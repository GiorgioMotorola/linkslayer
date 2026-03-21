<template>
  <Transition name="combat-overlay">
    <div v-if="inEncounter" class="combat-backdrop" aria-hidden="true">
      <div class="scanlines"></div>
    </div>
  </Transition>
  <Transition name="combat-overlay">
    <div v-if="inEncounter" class="combat-overlay" aria-hidden="true">

      <!-- Player portrait with HP badge -->
      <div class="co-player-portrait">
        <div class="co-player-wrap" :class="{ 'img-flash--taken': flashType === 'taken' }">
          <img :src="playerImage" class="co-player" alt="" />
        </div>
        <div class="co-hp-bar-wrap co-player-hp-bar">
          <div class="co-hp-bar-fill co-hp-bar-player" :style="{ width: playerHpPct + '%' }"></div>
        </div>
      </div>

      <!-- Enemy group — layout driven by enemy count -->
      <div class="co-enemy-group" :class="`co-enemy-group--${enemyList.length}`">
        <div v-for="(row, rowIdx) in enemyRows" :key="rowIdx" class="co-enemy-row">
          <div
            v-for="idx in row"
            :key="idx"
            class="co-enemy-portrait"
            @click="enemyList[idx]?.currentHP > 0 && $emit('switch-target', idx)"
          >
            <div
              class="co-enemy-wrap"
              :class="{
                'co-enemy-active': idx === targetIndex,
                'co-enemy-dead': enemyList[idx]?.currentHP <= 0,
                'img-flash--dealt': idx === targetIndex && flashType === 'dealt',
              }"
            >
              <img
                :src="thumbnailUrl ?? enemyPlaceholder"
                class="co-enemy"
                alt=""
                @error="thumbnailUrl = null"
              />
            </div>
            <div class="co-hp-bar-wrap co-enemy-hp-bar">
              <div class="co-hp-bar-fill co-hp-bar-enemy" :style="{ width: enemyHpPct(idx) + '%' }"></div>
            </div>
          </div>
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
  inEncounter:     Boolean,
  playerClass:     Object,
  playerHP:        { type: Number, default: 0 },
  playerMaxHP:     { type: Number, default: 1 },
  enemyHP:         { type: Number, default: 0 },
  articleTitle:    String,
  lastDamageDealt: { type: Number, default: null },
  lastDamageTaken: { type: Number, default: null },
  encounter:       { type: Object, default: null },
});

defineEmits(["switch-target"]);

// ── Flash animation ─────────────────────────────────────────────────────────
const flashType = ref(null);
let flashTimer = null;

function triggerFlash(type) {
  flashType.value = type;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flashType.value = null; }, 1400);
}

watch(() => props.lastDamageTaken, (val) => { if (val) triggerFlash("taken"); });
watch(() => props.lastDamageDealt, (val) => { if (val) triggerFlash("dealt"); });

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
  const cur = idx === targetIndex.value ? props.enemyHP : (e.currentHP ?? 0);
  return Math.max(0, Math.min(100, (cur / Math.max(1, maxHp)) * 100));
}

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
  animation: img-hit-pulse 1.4s ease-out forwards;
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
  bottom: clamp(260px, 60vh, 500px);
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

/* Portrait sizes by enemy count */
.co-enemy-group--1 .co-enemy { height: clamp(100px, 18vh, 200px); width: clamp(100px, 18vh, 200px); }
.co-enemy-group--2 .co-enemy { height: clamp(80px,  14vh, 150px); width: clamp(80px,  14vh, 150px); }
.co-enemy-group--3 .co-enemy { height: clamp(65px,  11vh, 120px); width: clamp(65px,  11vh, 120px); }
.co-enemy-group--4 .co-enemy { height: clamp(55px,  10vh, 100px); width: clamp(55px,  10vh, 100px); }
.co-enemy-group--5 .co-enemy { height: clamp(50px,   9vh,  90px); width: clamp(50px,   9vh,  90px); }

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
  .combat-overlay { bottom: clamp(320px, 62vh, 600px); }
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
