<template>
  <Transition name="combat-overlay">
    <div v-if="inEncounter" class="combat-backdrop" aria-hidden="true">
      <div class="scanlines"></div>
    </div>
  </Transition>
  <Transition name="combat-overlay">
    <div v-if="inEncounter" class="combat-overlay" aria-hidden="true">

      <!-- Player portrait with HP badge -->
      <div class="co-player-portrait" :class="{ 'co-player-recoil': playerShakeActive }">
        <div class="co-player-wrap" :class="{ 'img-flash--taken': flashType === 'taken' }">
          <img :src="playerImage" class="co-player" alt="" />
        </div>
        <div class="co-hp-bar-wrap co-player-hp-bar">
          <div class="co-hp-bar-fill co-hp-bar-player" :style="{ width: playerHpPct + '%' }"></div>
        </div>
      </div>

      <!-- Turned allies — conscripted enemies fighting for the player -->
      <div class="co-turned-group">
        <div
          v-for="(e, i) in enemyList"
          :key="'turned-' + i"
          v-show="e.turned && e.currentHP > 0"
          class="co-enemy-portrait co-turned-ally"
        >
          <div class="co-enemy-wrap co-enemy-turned">
            <img :src="thumbnailUrl ?? enemyPlaceholder" class="co-enemy" alt="" />
          </div>
          <div class="co-intent-badge co-turned-badge"><i class="ra ra-sword"></i> Ally</div>
          <div class="co-hp-bar-wrap co-enemy-hp-bar">
            <div class="co-hp-bar-fill co-hp-bar-turned" :style="{ width: enemyHpPct(i) + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- Enemy group — layout driven by enemy count -->
      <div class="co-enemy-group" :class="`co-enemy-group--${visibleEnemyCount}`">
        <div v-for="(row, rowIdx) in enemyRows" :key="rowIdx" class="co-enemy-row">
          <template v-for="idx in row" :key="idx">
          <div
            v-if="!enemyList[idx]?.fled && !enemyList[idx]?.turned"
            class="co-enemy-portrait"
            :class="{ 'co-enemy-shake': shakeActive && idx === targetIndex }"
            @click="enemyList[idx]?.currentHP > 0 && $emit('switch-target', idx)"
          >
            <div
              class="co-enemy-wrap"
              :class="{
                'co-enemy-active': idx === targetIndex && playerSelectedTarget,
                'co-enemy-dead': enemyList[idx]?.currentHP <= 0,
                'img-flash--dealt': idx === targetIndex && flashType === 'dealt',
                'co-low-hp-aura': isLowHP(idx),
              }"
            >
              <img
                :src="thumbnailUrl ?? enemyPlaceholder"
                class="co-enemy"
                alt=""
                @error="thumbnailUrl = null"
              />
              <!-- Intent tint — clipped to circle by parent overflow:hidden -->
              <div
                v-if="intentTintFor(idx)"
                class="co-intent-tint"
                :style="{ background: intentTintFor(idx) }"
              ></div>
            </div>
            <!-- Intent badge — collapses to icon, expands to full status when selected -->
            <div
              v-if="intentIconFor(idx)"
              :key="'badge-' + idx + '-' + badgeAnimKey"
              class="co-intent-badge"
              :class="{
                'co-intent-badge--loading': getIntentFor(idx)?.action === 'unknown',
                'co-intent-badge--danger': isDangerIntent(idx),
                'co-intent-badge--expanded': idx === targetIndex && playerSelectedTarget,
              }"
            >
              <!-- Collapsed: just the icon -->
              <template v-if="!(idx === targetIndex && playerSelectedTarget)"><span v-html="intentIconFor(idx)"></span></template>

              <!-- Expanded: full status card -->
              <template v-else>
                <div class="co-badge-exp-name">{{ selectedEnemy?.name }}</div>
                <div class="co-badge-exp-hp">
                  <span class="co-badge-exp-hp-bar-wrap">
                    <span class="co-badge-exp-hp-bar-fill" :style="{ width: selectedEnemyHpPct + '%' }"></span>
                  </span>
                  <span class="co-badge-exp-hp-val">{{ selectedEnemyCurrentHP }} HP</span>
                </div>
                <div class="co-badge-exp-intent" :class="{ 'co-badge-exp-intent--danger': selectedIntentIsDanger }">
                  {{ selectedIntentText }}
                </div>
                <div v-if="selectedStatusEffects.length" class="co-badge-exp-effects">
                  <span v-for="effect in selectedStatusEffects" :key="effect.type" class="co-badge-exp-effect">
                    <span v-html="STATUS_ICON[effect.type] ?? '?'"></span> {{ effectLabel(effect) }}
                  </span>
                </div>
              </template>
            </div>
            <div class="co-hp-bar-wrap co-enemy-hp-bar">
              <div class="co-hp-bar-fill co-hp-bar-enemy" :style="{ width: enemyHpPct(idx) + '%' }"></div>
            </div>
            <div v-if="statusIconsFor(idx).length" class="co-status-icons">
              <span v-for="icon in statusIconsFor(idx)" :key="icon" class="co-status-icon" v-html="icon"></span>
            </div>
            <!-- Damage dealt float -->
            <div v-if="dmgDealtVal && idx === targetIndex" :key="'dealt-' + dmgDealtKey" class="co-float-dmg co-float-dmg--dealt">-{{ dmgDealtVal }}</div>
            <!-- DEFEATED stamp -->
            <div v-if="defeatedStampIdx === idx" class="co-defeated-stamp">DEFEATED</div>
          </div>
          </template>
        </div>
      </div>

    </div>
  </Transition>


</template>

<script setup>
import { ref, computed, watch } from "vue";

const knightImg        = new URL("../assets/knight-img.jpg",        import.meta.url).href;
const paladinImg       = new URL("../assets/paladin-img.jpg",       import.meta.url).href;
const wizardImg        = new URL("../assets/wizard-img.jpg",        import.meta.url).href;
const rogueImg         = new URL("../assets/rogue-img.png",         import.meta.url).href;
const mundaneImg       = new URL("../assets/mundane-img.jpg",       import.meta.url).href;
const enemyPlaceholder = new URL("../assets/enemy-placeholder.png", import.meta.url).href;

const props = defineProps({
  inEncounter:      Boolean,
  playerClass:      Object,
  playerHP:         { type: Number, default: 0 },
  playerMaxHP:      { type: Number, default: 1 },
  enemyHP:          { type: Number, default: 0 },
  articleTitle:     String,
  lastDamageDealt:  { type: Number, default: null },
  lastDamageTaken:  { type: Number, default: null },
  enemyHitKey:      { type: Number, default: 0 },
  playerHitKey:     { type: Number, default: 0 },
  encounter:        { type: Object, default: null },
  enemyNextAction:  { type: String, default: null },
  nextEnemyAttack:  { type: Number, default: null },
  enemyIntents:        { type: Array, default: () => [] },
  enemyStatusEffects:  { type: Array, default: () => [] },
  lastGoldStolen:      { type: Number, default: null },
  enemyTurnKey:        { type: Number, default: 0 },
  playerSelectedTarget: { type: Boolean, default: false },
});

defineEmits(["switch-target"]);

// ── Intent badge refresh animation ───────────────────────────────────────────
const badgeAnimKey = ref(0);
watch(() => props.enemyTurnKey, () => { badgeAnimKey.value++; });

// ── Flash animation ─────────────────────────────────────────────────────────
const flashType = ref(null);
let flashTimer = null;

function triggerFlash(type) {
  flashType.value = type;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashType.value = null; }, 2400);
}

watch(() => props.lastDamageTaken, (val) => { if (val) triggerFlash("taken"); });
watch(() => props.lastDamageDealt, (val) => { if (val) triggerFlash("dealt"); });


// ── Floating damage numbers ───────────────────────────────────────────────────
const dmgDealtKey = ref(0);
const dmgDealtVal = ref(null);
let dmgDealtTimer = null;
watch(() => props.lastDamageDealt, (val) => {
  if (val) {
    dmgDealtVal.value = val;
    dmgDealtKey.value++;
    clearTimeout(dmgDealtTimer);
    dmgDealtTimer = setTimeout(() => { dmgDealtVal.value = null; }, 2800);
  }
});

const dmgTakenKey = ref(0);
const dmgTakenVal = ref(null);
watch(() => props.lastDamageTaken, (val) => { if (val) { dmgTakenVal.value = val; dmgTakenKey.value++; } });


// ── Enemy portrait recoil ─────────────────────────────────────────────────────
const shakeActive = ref(false);
let shakeTimer = null;
watch(() => props.enemyHitKey, () => {
  shakeActive.value = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    shakeActive.value = true;
    clearTimeout(shakeTimer);
    shakeTimer = setTimeout(() => { shakeActive.value = false; }, 900);
  }));
});

// ── Player portrait recoil ────────────────────────────────────────────────────
const playerShakeActive = ref(false);
let playerShakeTimer = null;
watch(() => props.playerHitKey, () => {
  playerShakeActive.value = false;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    playerShakeActive.value = true;
    clearTimeout(playerShakeTimer);
    playerShakeTimer = setTimeout(() => { playerShakeActive.value = false; }, 900);
  }));
});

// ── DEFEATED stamp ────────────────────────────────────────────────────────────
const defeatedStampIdx = ref(null);
let defeatedTimer = null;
watch(() => props.enemyHP, (val, old) => {
  if ((old ?? 0) > 0 && (val ?? 0) <= 0) {
    defeatedStampIdx.value = targetIndex.value;
    clearTimeout(defeatedTimer);
    defeatedTimer = setTimeout(() => { defeatedStampIdx.value = null; }, 2200);
  }
});

// ── Low HP aura ───────────────────────────────────────────────────────────────
function isLowHP(idx) {
  const e = enemyList.value[idx];
  if (!e) return false;
  const maxHp = e.maxHP ?? e.hp ?? 1;
  const cur = e.currentHP ?? 0;
  return cur > 0 && (cur / maxHp) <= 0.25;
}

// ── Intent danger escalation ──────────────────────────────────────────────────
function isDangerIntent(idx) {
  const intent = getIntentFor(idx);
  return (intent?.action === "attack" || intent?.action === "attack_power") && (intent?.damage ?? 0) >= 15;
}

// ── Player image ─────────────────────────────────────────────────────────────
const classImageMap = {
  Fighter: knightImg,
  Paladin: paladinImg,
  Wizard:  wizardImg,
  Rogue:   rogueImg,
  Mundane: mundaneImg,
};

const playerImage = computed(
  () => classImageMap[props.playerClass?.name] ?? knightImg
);

// ── Enemy list + layout ───────────────────────────────────────────────────────
const enemyList = computed(() => {
  const enc = props.encounter;
  if (enc?.enemies?.length) return enc.enemies;
  if (enc?.enemy) return [enc.enemy];
  return [];
});

const targetIndex = computed(() => props.encounter?.targetIndex ?? 0);

const playerHpPct = computed(() =>
  Math.max(0, Math.min(100, (props.playerHP / Math.max(1, props.playerMaxHP)) * 100))
);

function enemyHpPct(idx) {
  const e = enemyList.value[idx];
  if (!e) return 0;
  const maxHp = e.maxHP ?? e.hp ?? 1;
  const cur = e.currentHP ?? 0;
  return Math.max(0, Math.min(100, (cur / Math.max(1, maxHp)) * 100));
}

const visibleEnemyCount = computed(() =>
  enemyList.value.filter(e => !e?.fled && !e?.turned).length
);

const enemyRows = computed(() => {
  const n = enemyList.value.length;
  if (n <= 0) return [];
  if (n === 1) return [[0]];
  if (n === 2) return [[0, 1]];
  if (n === 3) return [[0], [1, 2]];
  if (n === 4) return [[0, 1], [2, 3]];
  // 5 — diamond
  return [[0], [1, 2, 3], [4]];
});

// ── Enemy intent (Option E: full tint + icon badge) ──────────────────────────
const INTENT_TINT = {
  attack:       "rgba(200, 20, 20, 0.38)",
  attack_power: "rgba(220, 60, 0,  0.45)",
  defend:       "rgba(0, 100, 220, 0.35)",
  counter:      "rgba(0, 150, 200, 0.38)",
  steal:        "rgba(160, 100, 0, 0.38)",
  confuse:      "rgba(160, 0, 200, 0.38)",
  enrage:       "rgba(220, 80, 0, 0.42)",
  flee:         "rgba(0, 180, 80, 0.32)",
  summon:       "rgba(0, 180, 60, 0.38)",
  trip:         "rgba(180, 140, 0, 0.35)",
  special:      "rgba(140, 0, 200, 0.38)",
  idle:         null,
  unknown:      null,
};
const INTENT_ICON = {
  attack:       '<i class="ra ra-sword"></i>',
  attack_power: '<i class="ra ra-explosion"></i>',
  defend:       '<i class="ra ra-shield"></i>',
  counter:      '<i class="ra ra-player-dodge"></i>',
  steal:        '<i class="ra ra-gold-bar"></i> Steal',
  confuse:      '<i class="ra ra-cycle"></i> Confuse',
  enrage:       '<i class="ra ra-burning-eye"></i> Enrage',
  flee:         '<i class="ra ra-player-dodge"></i> Flee',
  summon:       '<i class="ra ra-health"></i> Heal',
  trip:         "🤾 Trip",
  special:      '<i class="ra ra-aura"></i>',
  idle:         '<i class="ra ra-hourglass"></i>',
  unknown:      "···",
};

// Per-enemy intent helpers — use enemyIntents array when available (multi-enemy),
// fall back to the single-enemy props for solo encounters.
function getIntentFor(idx) {
  const enemy = enemyList.value[idx];
  if (!enemy || enemy.currentHP <= 0) return null;

  const intents = props.enemyIntents;
  if (intents?.length) return intents[idx] ?? { action: "unknown", damage: null };

  // Multi-enemy but intents not assigned yet
  if (enemyList.value.length > 1) return { action: "unknown", damage: null };

  // Solo: synthesise from the single-enemy props
  if (idx !== targetIndex.value) return null;
  return { action: props.enemyNextAction, damage: props.nextEnemyAttack };
}

function intentTintFor(idx) {
  const intent = getIntentFor(idx);
  return INTENT_TINT[intent?.action] ?? null;
}

function intentIconFor(idx) {
  const intent = getIntentFor(idx);
  if (!intent?.action) return null;
  const icon = INTENT_ICON[intent.action];
  if (!icon) return null;
  if ((intent.action === "attack" || intent.action === "attack_power") && intent.damage) {
    return `${icon} ${intent.damage}`;
  }
  return icon;
}

// ── Status effect icons per portrait ─────────────────────────────────────────
const STATUS_ICON = { fire: '<i class="ra ra-fire"></i>', bleed: '<i class="ra ra-dripping-blade"></i>', poison: '<i class="ra ra-skull"></i>', weaken: '<i class="ra ra-aura"></i>', chill: '<i class="ra ra-snowflake"></i>' };

function statusIconsFor(idx) {
  const effects = idx === targetIndex.value
    ? (props.enemyStatusEffects ?? [])
    : (enemyList.value[idx]?.statusEffects ?? []);
  return effects.map(e => STATUS_ICON[e.type]).filter(Boolean);
}


// ── Selected enemy status panel ───────────────────────────────────────────────
const selectedEnemy = computed(() => {
  const e = enemyList.value[targetIndex.value];
  return e ?? null;
});

// Use currentHP directly from the enemy object (kept in sync with enemyHP ref via the flush:'sync' watcher)
const selectedEnemyCurrentHP = computed(() => selectedEnemy.value?.currentHP ?? 0);

const selectedEnemyHpPct = computed(() => {
  const e = selectedEnemy.value;
  if (!e) return 0;
  const max = e.maxHP ?? e.hp ?? 1;
  return Math.max(0, Math.min(100, (selectedEnemyCurrentHP.value / max) * 100));
});

const selectedStatusEffects = computed(() => {
  return props.enemyStatusEffects ?? [];
});

const selectedIntentText = computed(() => {
  const intent = getIntentFor(targetIndex.value);
  if (!intent) return "—";
  const label = {
    attack:       "Attack",
    attack_power: "Power Attack",
    defend:       "Defend",
    steal:        "Steal Gold",
    confuse:      "Confuse",
    enrage:       "Enrage",
    flee:         "Flee",
    summon:       "Heal",
    trip:         "Trip",
    idle:         "Idle",
    unknown:      "···",
  }[intent.action] ?? intent.action;
  return intent.damage ? `${label} (${intent.damage} dmg)` : label;
});

const selectedIntentIsDanger = computed(() => isDangerIntent(targetIndex.value));

function effectLabel(effect) {
  const turns = effect.duration ?? effect.turnsLeft ?? 0;
  return `${turns}t`;
}

// ── Wikipedia thumbnail ───────────────────────────────────────────────────────
const thumbnailUrl = ref(null);

watch(
  () => props.articleTitle,
  async (title) => {
    if (!title) return;
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      );
      const data = await res.json();
      thumbnailUrl.value = data.thumbnail?.source ?? null;
    } catch {
      thumbnailUrl.value = null;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
/* ── Scanlines backdrop ───────────────────────────────────────────────────── */
.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 3px,
    rgba(0, 0, 0, 0.12) 3px,
    #18272a 7px
  );
  animation: scanline-scroll 1s linear infinite;
  pointer-events: none;
}

@keyframes scanline-scroll {
  from { background-position: 0 0; }
  to   { background-position: 0 40px; }
}

/* ── Flash animations ────────────────────────────────────────────────────── */
.img-flash--taken,
.img-flash--dealt {
  animation: img-hit-pulse 2.4s ease-out forwards;
}

@keyframes img-hit-pulse {
  0%   { transform: scale(1);    box-shadow: 0 0 8px  4px  rgba(180, 20, 20, 0.6); }
  15%  { transform: scale(1.06); box-shadow: 0 0 24px 12px rgba(220, 0,  0,  0.95); }
  30%  { transform: scale(0.98); box-shadow: 0 0 18px 8px  rgba(200, 30, 10, 0.8); }
  50%  { transform: scale(1.03); box-shadow: 0 0 20px 10px rgba(160, 0,  0,  0.65); }
  70%  { transform: scale(1);    box-shadow: 0 0 14px 6px  rgba(140, 0,  0,  0.4); }
  100% { transform: scale(1);    box-shadow: 0 0 0px  0px  rgba(100, 0,  0,  0); }
}

/* ── Backdrop + overlay containers ──────────────────────────────────────── */
.combat-backdrop {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  background-color: #020202ec;
  z-index: 94;
  pointer-events: none;
}

.combat-overlay {
  position: fixed;
  bottom: clamp(160px, 46vh, 380px);
  left: 0;
  right: 0;
  height: clamp(160px, 28vh, 320px);
  pointer-events: none;
  z-index: 95;
  overflow: visible;
}

/* ── Player portrait ─────────────────────────────────────────────────────── */
.co-player-portrait {
  position: absolute;
  left: 25%;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.co-player-wrap {
  border-radius: 50%;
  border: 5px solid rgb(4, 183, 238);
  overflow: hidden;
}

.co-player {
  height: clamp(120px, 18vh, 220px);
  width: auto;
  object-fit: contain;
  opacity: 0.92;
  filter: drop-shadow(2px 0px 12px rgba(0, 0, 0, 0.7));
  border-radius: 50%;
  display: block;
}

/* ── Enemy group container ───────────────────────────────────────────────── */
.co-enemy-group {
  position: absolute;
  right: 26%;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.co-enemy-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
}

/* ── Individual enemy portrait ───────────────────────────────────────────── */
.co-enemy-portrait {
  position: relative;
  cursor: pointer;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.co-enemy-wrap {
  border-radius: 50%;
  border: 5px solid rgb(202, 17, 17);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s, opacity 0.3s;
}

.co-enemy-active {
  border-color: rgb(255, 210, 0);
  box-shadow: 0 0 14px 4px rgba(255, 200, 0, 0.65);
}

.co-enemy-dead {
  opacity: 0.35;
  cursor: not-allowed;
}
.co-enemy-dead .co-enemy {
  filter: grayscale(100%) drop-shadow(-2px 0px 12px rgba(0, 0, 0, 0.7));
}

.co-enemy {
  object-fit: cover;
  opacity: 0.88;
  filter: grayscale(100%) drop-shadow(-2px 0px 12px rgba(0, 0, 0, 0.7));
  border-radius: 50%;
  display: block;
}

/* Turned ally portrait size */
.co-turned-ally .co-enemy { height: clamp(70px, 12vh, 130px); width: clamp(70px, 12vh, 130px); }

/* Portrait sizes by enemy count */
.co-enemy-group--1 .co-enemy { height: clamp(100px, 18vh, 200px); width: clamp(100px, 18vh, 200px); }
.co-enemy-group--2 .co-enemy { height: clamp(80px,  14vh, 150px); width: clamp(80px,  14vh, 150px); }
.co-enemy-group--3 .co-enemy { height: clamp(65px,  11vh, 120px); width: clamp(65px,  11vh, 120px); }
.co-enemy-group--4 .co-enemy { height: clamp(55px,  10vh, 100px); width: clamp(55px,  10vh, 100px); }
.co-enemy-group--5 .co-enemy { height: clamp(50px,   9vh,  90px); width: clamp(50px,   9vh,  90px); }

/* ── Intent tint + badge ─────────────────────────────────────────────────── */
.co-intent-tint {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
  animation: intent-pulse 2s ease-in-out infinite;
}

@keyframes intent-pulse {
  0%,  100% { opacity: 0.55; }
  50%        { opacity: 0.85; }
}

.co-intent-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: clamp(14px, 2.2vh, 22px);
  line-height: 1;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.8));
  animation: badge-rise 0.42s cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: 0.18s;
  pointer-events: none;
  z-index: 2;
  color: #ca1111;
  background-color: black;
  padding: .2rem;
  border: white 1px solid;
}

@keyframes badge-rise {
  0%   { transform: translateY(28px) scale(0.5); opacity: 0; }
  70%  { transform: translateY(-2px) scale(1.08); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}

.co-intent-badge--loading {
  animation: badge-loading 1s ease-in-out infinite;
  letter-spacing: 2px;
  color: #888;
  border-color: #555;
}

@keyframes badge-loading {
  0%,  100% { opacity: 0.4; }
  50%        { opacity: 1; }
}

/* ── Turned ally group ───────────────────────────────────────────────────── */
.co-turned-group {
  position: absolute;
  left: 36%;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.co-turned-ally {
  pointer-events: none;
}

.co-enemy-turned {
  border-color: rgb(0, 210, 120) !important;
  box-shadow: 0 0 14px 4px rgba(0, 220, 130, 0.6);
  animation: turned-pulse 1.5s ease-in-out infinite;
}

.co-enemy-turned .co-enemy {
  filter: none !important;
  opacity: 0.92;
}

@keyframes turned-pulse {
  0%,  100% { box-shadow: 0 0 10px 3px rgba(0, 220, 130, 0.5); }
  50%        { box-shadow: 0 0 22px 8px rgba(0, 220, 130, 0.85); }
}

.co-turned-badge {
  color: rgb(0, 230, 140) !important;
  border-color: rgb(0, 200, 110) !important;
  background-color: rgba(0, 30, 15, 0.9) !important;
  font-size: clamp(10px, 1.6vh, 14px) !important;
}

.co-hp-bar-turned {
  background: linear-gradient(90deg, #00c878, #00ff9d);
}



/* ── Floating damage numbers ─────────────────────────────────────────────── */
.co-float-dmg {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: clamp(18px, 3vw, 30px);
  font-weight: 900;
  pointer-events: none;
  z-index: 10;
  animation: float-dmg 2.8s ease-out forwards;
  white-space: nowrap;
}
.co-float-dmg--dealt {
  color: #fff;
  text-shadow: 0 0 8px rgba(255,100,0,0.9), -1px -1px 0 #000, 1px 1px 0 #000;
}
.co-float-dmg--taken {
  color: #ff5555;
  text-shadow: 0 0 8px rgba(255,0,0,0.9), -1px -1px 0 #000, 1px 1px 0 #000;
}
@keyframes float-dmg {
  0%   { opacity: 0; transform: translateX(-50%) translateY(0); }
  15%  { opacity: 1; transform: translateX(-50%) translateY(-12px); }
  70%  { opacity: 1; transform: translateX(-50%) translateY(-38px); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-58px); }
}

/* ── Enemy push-back (hit → slams right, returns) ───────────────────────── */
/* ── Enemy push-back (slams right, holds, returns) ───────────────────────── */
.co-enemy-shake {
  animation: enemy-pushback 0.3s ease-out both;
}
@keyframes enemy-pushback {
  0%   { transform: translateX(0); }
  18%  { transform: translateX(8px); }
  40%  { transform: translateX(6px); }
  100% { transform: translateX(0); }
}

/* ── Player push-back (slams left, holds, returns) ───────────────────────── */
.co-player-recoil {
  animation: player-pushback 0.3s ease-out both;
}
@keyframes player-pushback {
  0%   { transform: translateX(0); }
  18%  { transform: translateX(-8px); }
  40%  { transform: translateX(-6px); }
  100% { transform: translateX(0); }
}


/* ── DEFEATED stamp ──────────────────────────────────────────────────────── */
.co-defeated-stamp {
  position: absolute;
  top: 28%;
  left: 50%;
  font-size: clamp(12px, 2vw, 20px);
  font-weight: 900;
  color: #ff2020;
  letter-spacing: 0.07em;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  border: 2px solid #ff2020;
  padding: 1px 5px;
  pointer-events: none;
  z-index: 10;
  animation: defeated-slam 0.28s cubic-bezier(0.17, 0.89, 0.32, 1.28) forwards;
}
@keyframes defeated-slam {
  0%   { transform: translateX(-50%) rotate(-14deg) scale(2.8); opacity: 0; }
  60%  { transform: translateX(-50%) rotate(-14deg) scale(0.92); opacity: 1; }
  100% { transform: translateX(-50%) rotate(-14deg) scale(1); opacity: 1; }
}

/* ── Low HP aura ─────────────────────────────────────────────────────────── */
.co-low-hp-aura {
  animation: low-hp-pulse 0.75s ease-in-out infinite !important;
  border-color: rgb(255, 30, 30) !important;
}
@keyframes low-hp-pulse {
  0%, 100% { box-shadow: 0 0 8px 3px rgba(220, 0, 0, 0.55); }
  50%       { box-shadow: 0 0 28px 12px rgba(255, 20, 20, 0.9); }
}

/* ── Intent danger badge ─────────────────────────────────────────────────── */
.co-intent-badge--danger {
  color: #ff2020 !important;
  border-color: #ff0000 !important;
  animation: badge-danger-pulse 1.4s ease-in-out infinite;
}
@keyframes badge-danger-pulse {
  0%, 100% { box-shadow: 0 0 4px 1px rgba(255, 0, 0, 0.5); }
  50%       { box-shadow: 0 0 14px 5px rgba(255, 0, 0, 0.9); }
}

/* ── Intent badge expanded state ─────────────────────────────────────────── */
.co-intent-badge--expanded {
  /* Override the collapsed badge styles */
  top: auto;
  bottom: calc(100% + 6px);  /* fold up from above the portrait */
  right: 50%;
  transform: translateX(50%);
  width: max(120px, 90%);
  background: rgba(8, 3, 16, 0.96) !important;
  border-color: rgba(200, 30, 30, 0.6) !important;
  border-radius: 6px !important;
  padding: 0.45rem 0.55rem !important;
  font-size: unset !important;
  color: unset !important;
  display: flex !important;
  flex-direction: column;
  gap: 0.3rem;
  animation: badge-expand 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
  pointer-events: none;
  z-index: 10;
  white-space: normal;
}

@keyframes badge-expand {
  from { opacity: 0; transform: translateX(50%) scaleY(0.6); transform-origin: bottom center; }
  to   { opacity: 1; transform: translateX(50%) scaleY(1);   transform-origin: bottom center; }
}

.co-badge-exp-name {
  font-size: 11px;
  font-weight: 700;
  color: #e84040;
  text-transform: uppercase;
  letter-spacing: 1px;
  line-height: 1;
}

.co-badge-exp-hp {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.co-badge-exp-hp-bar-wrap {
  flex: 1;
  height: 4px;
  background: rgba(80, 20, 20, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.co-badge-exp-hp-bar-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ca1111, #e84040);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.co-badge-exp-hp-val {
  font-size: 10px;
  font-weight: 600;
  color: #c04040;
  flex-shrink: 0;
  white-space: nowrap;
}

.co-badge-exp-intent {
  font-size: 11px;
  font-weight: 600;
  color: #c0a0a0;
  border-top: 1px solid rgba(120, 40, 40, 0.35);
  padding-top: 0.25rem;
}

.co-badge-exp-intent--danger {
  color: #ff4040;
}

.co-badge-exp-effects {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.co-badge-exp-effect {
  font-size: 10px;
  background: rgba(40, 20, 10, 0.7);
  border: 1px solid rgba(140, 80, 20, 0.4);
  border-radius: 3px;
  padding: 1px 4px;
  color: #c08040;
}

/* gold-float keyframe lives in the non-scoped block below */

/* ── Status effect icons ─────────────────────────────────────────────────── */
.co-status-icons {
  display: flex;
  gap: 2px;
  justify-content: center;
  margin-top: 2px;
  pointer-events: none;
}

.co-status-icon {
  font-size: clamp(10px, 1.6vh, 16px);
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.9));
}

/* ── HP bars ─────────────────────────────────────────────────────────────── */
.co-hp-bar-wrap {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
  pointer-events: none;
}

.co-hp-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.co-hp-bar-player {
  background: linear-gradient(90deg, #04b7ee, #0cf);
}

.co-hp-bar-enemy {
  background: linear-gradient(90deg, #ca1111, #e84040);
}

.co-player-hp-bar {
  width: clamp(80px, 14vh, 180px);
}

.co-enemy-hp-bar {
  /* width matches portrait size via parent .co-enemy-portrait */
  width: 100%;
}

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media screen and (max-width: 1000px) {
  .combat-overlay { bottom: clamp(160px, 46vh, 380px); }
  .co-player-portrait { left: 5%; }
  .co-enemy-group     { right: 5%; }
  .co-player { height: clamp(70px, 14vh, 120px); }

  .co-enemy-group--1 .co-enemy { height: clamp(60px, 12vh, 100px); width: clamp(60px, 12vh, 100px); }
  .co-enemy-group--2 .co-enemy { height: clamp(50px, 10vh,  80px); width: clamp(50px, 10vh,  80px); }
  .co-enemy-group--3 .co-enemy { height: clamp(42px,  8vh,  65px); width: clamp(42px,  8vh,  65px); }
  .co-enemy-group--4 .co-enemy { height: clamp(38px,  7vh,  58px); width: clamp(38px,  7vh,  58px); }
  .co-enemy-group--5 .co-enemy { height: clamp(34px,  6vh,  52px); width: clamp(34px,  6vh,  52px); }
}

/* ── Overlay transitions ─────────────────────────────────────────────────── */
.combat-overlay-enter-active {
  animation: combat-slam 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.combat-overlay-leave-active {
  transition: opacity 0.3s ease;
}
.combat-overlay-leave-to { opacity: 0; }

@keyframes combat-slam {
  0%   { opacity: 0; transform: scaleY(0) scaleX(1.1); }
  60%  { opacity: 1; transform: scaleY(1.06) scaleX(0.98); }
  80%  { transform: scaleY(0.97) scaleX(1.01); }
  100% { opacity: 1; transform: scaleY(1) scaleX(1); }
}
</style>

<style>
/* Non-scoped — ensures the keyframe and teleported element are always reachable */
.co-gold-stolen-teleport {
  position: fixed;
  bottom: 44vh;
  left: 22%;
  transform: translateX(-50%);
  font-size: 28px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 2px 10px rgba(0,0,0,1), 0 0 22px rgba(255, 210, 0, 0.95);
  white-space: nowrap;
  pointer-events: none;
  z-index: 9999;
  animation: co-gold-float 2.8s ease-out forwards;
}

@keyframes co-gold-float {
  0%   { opacity: 0;   transform: translateX(-50%) translateY(0px);   }
  12%  { opacity: 1;   transform: translateX(-50%) translateY(-10px); }
  65%  { opacity: 1;   transform: translateX(-50%) translateY(-40px); }
  100% { opacity: 0;   transform: translateX(-50%) translateY(-60px); }
}
</style>
