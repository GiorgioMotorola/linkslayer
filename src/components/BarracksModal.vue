<template>
  <div class="barracks-overlay" @click.self="$emit('close')">
    <div class="barracks-modal">

      <div class="barracks-header">
        <span><i class="ra ra-sword"></i> The Barracks</span>
        <button class="barracks-close" @click="$emit('close')">✕</button>
      </div>

      <!-- Tabs -->
      <div class="barracks-tabs">
        <button :class="['barracks-tab', { active: tab === 'training' }]" @click="tab = 'training'">
          <i class="ra ra-helmet"></i> Training Grounds
        </button>
        <button :class="['barracks-tab', { active: tab === 'roster' }]" @click="tab = 'roster'">
          <i class="ra ra-crossed-swords"></i> Active Roster
          <span v-if="activeWarriors.length" class="roster-count">{{ activeWarriors.length }}</span>
        </button>
      </div>

      <!-- ── Training Grounds ── -->
      <div v-if="tab === 'training'" class="barracks-body">

        <p class="barracks-subtitle">Train warriors to fight alongside you. Progress accumulates as you click through Wikipedia.</p>

        <div class="training-slots">
          <div v-for="(slot, i) in localSlots" :key="i" class="training-slot">

            <!-- Empty slot -->
            <template v-if="!slot.tier && !slot.spec">
              <div class="slot-header">Slot {{ i + 1 }} — <span class="slot-empty-label">Empty</span></div>
              <div class="slot-config">
                <div class="config-row">
                  <label>Tier</label>
                  <div class="tier-btns">
                    <button
                      v-for="(tDef, tKey) in WARRIOR_TIERS"
                      :key="tKey"
                      :class="['tier-btn', { selected: pendingTier[i] === tKey }]"
                      @click="pendingTier[i] = tKey"
                    >
                      {{ tDef.label }}
                      <span class="tier-cost">{{ tDef.clickCost }} clicks{{ tDef.goldCost ? ` · ${tDef.goldCost}g` : '' }}</span>
                    </button>
                  </div>
                </div>
                <div class="config-row">
                  <label>Specialization</label>
                  <div v-for="cat in SPEC_CATEGORIES" :key="cat" class="spec-category">
                    <div class="spec-cat-label">{{ cat }}</div>
                    <div class="spec-btns">
                      <button
                        v-for="(sDef, sKey) in specsByCategory(cat)"
                        :key="sKey"
                        :class="['spec-btn', { selected: pendingSpec[i] === sKey }]"
                        :title="sDef.description"
                        @click="pendingSpec[i] = sKey"
                      >
                        <i :class="['ra', sDef.icon]"></i> {{ sDef.label }}
                      </button>
                    </div>
                  </div>
                </div>
                <div class="config-row" v-if="pendingSpec[i] && pendingTier[i]">
                  <div class="selected-preview">
                    <i :class="['ra', WARRIOR_SPECS[pendingSpec[i]].icon]"></i>
                    <strong>{{ WARRIOR_TIERS[pendingTier[i]].label }} {{ WARRIOR_SPECS[pendingSpec[i]].label }}</strong>
                    — {{ WARRIOR_SPECS[pendingSpec[i]].description }}
                  </div>
                </div>
                <button
                  class="begin-training-btn"
                  :disabled="!pendingTier[i] || !pendingSpec[i] || !canAfford(pendingTier[i]) || activeWarriors.length >= MAX_WARRIORS"
                  @click="beginTraining(i)"
                >
                  <template v-if="activeWarriors.length >= MAX_WARRIORS">Roster Full ({{ MAX_WARRIORS }})</template>
                  <template v-else-if="!pendingTier[i] || !pendingSpec[i]">Select tier &amp; spec</template>
                  <template v-else-if="!canAfford(pendingTier[i])">Need {{ WARRIOR_TIERS[pendingTier[i]].goldCost }}g</template>
                  <template v-else>Begin Training</template>
                </button>
              </div>
            </template>

            <!-- Training in progress -->
            <template v-else-if="slot.tier && slot.spec && !isReady(slot)">
              <div class="slot-header">
                Slot {{ i + 1 }} — Training
                <span class="slot-training-label">
                  <i :class="['ra', WARRIOR_SPECS[slot.spec].icon]"></i>
                  {{ WARRIOR_TIERS[slot.tier].label }} {{ WARRIOR_SPECS[slot.spec].label }}
                </span>
              </div>
              <div class="training-progress-wrap">
                <div class="training-progress-bar" :style="{ width: trainingPct(slot) + '%' }"></div>
                <span class="training-progress-label">{{ clicksDone(slot) }} / {{ WARRIOR_TIERS[slot.tier].clickCost }} clicks</span>
              </div>
              <div class="slot-stats">
                {{ WARRIOR_TIERS[slot.tier].maxHP }} HP · {{ WARRIOR_TIERS[slot.tier].damageMin }}–{{ WARRIOR_TIERS[slot.tier].damageMax }} dmg
              </div>
              <button class="cancel-btn" @click="cancelTraining(i)">Cancel</button>
            </template>

            <!-- Ready to deploy -->
            <template v-else-if="isReady(slot)">
              <div class="slot-header">
                Slot {{ i + 1 }} — <span class="ready-label"><i class="ra ra-flag"></i> Ready!</span>
              </div>
              <div class="ready-warrior">
                <i :class="['ra', WARRIOR_SPECS[slot.spec].icon, 'ready-icon']"></i>
                <div class="ready-info">
                  <strong>{{ WARRIOR_TIERS[slot.tier].label }} {{ WARRIOR_SPECS[slot.spec].label }}</strong>
                  <div class="slot-stats">{{ WARRIOR_TIERS[slot.tier].maxHP }} HP · {{ WARRIOR_TIERS[slot.tier].damageMin }}–{{ WARRIOR_TIERS[slot.tier].damageMax }} dmg</div>
                  <div class="spec-desc">{{ WARRIOR_SPECS[slot.spec].description }}</div>
                </div>
              </div>
              <button
                class="deploy-btn"
                :disabled="activeWarriors.length >= MAX_WARRIORS"
                @click="deploy(i)"
              >
                {{ activeWarriors.length >= MAX_WARRIORS ? 'Roster Full' : 'Deploy' }}
              </button>
            </template>

          </div>
        </div>
      </div>

      <!-- ── Active Roster ── -->
      <div v-if="tab === 'roster'" class="barracks-body">
        <p class="barracks-subtitle">Warriors currently on the journey with you. They fight in every combat until they fall or slip away.</p>

        <div v-if="!activeWarriors.length" class="no-warriors">
          <i class="ra ra-sword"></i>
          <p>No warriors deployed. Train some in the Training Grounds.</p>
        </div>

        <div v-else class="roster-list">
          <div v-for="w in activeWarriors" :key="w.id" class="roster-warrior">
            <div class="roster-warrior-icon">
              <i :class="['ra', WARRIOR_SPECS[w.spec]?.icon ?? 'ra-sword']"></i>
            </div>
            <div class="roster-warrior-info">
              <div class="roster-warrior-name">
                {{ WARRIOR_TIERS[w.tier]?.label }} {{ w.label }}
                <span class="tier-badge tier-badge--{{ w.tier }}">{{ w.tier }}</span>
              </div>
              <div class="roster-hp-bar-wrap">
                <div class="roster-hp-bar" :style="{ width: (w.currentHP / w.maxHP * 100) + '%', background: hpColor(w) }"></div>
              </div>
              <div class="roster-hp-label">{{ w.currentHP }} / {{ w.maxHP }} HP</div>
              <div class="roster-spec-desc">{{ WARRIOR_SPECS[w.spec]?.description }}</div>
            </div>
            <button class="dismiss-btn" @click="$emit('dismiss-warrior', w.id)">Dismiss</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import {
  WARRIOR_TIERS,
  WARRIOR_SPECS,
  SPEC_CATEGORIES,
  MAX_WARRIORS,
  defaultBarracksData,
  buildWarrior,
} from "@/utils/barracksDefs.js";

const props = defineProps({
  barrackData:       { type: Object, default: null },
  activeWarriors:    { type: Array,  default: () => [] },
  playerGold:        { type: Number, default: 0 },
  currentClickCount: { type: Number, default: 0 },
});

const emit = defineEmits(["close", "update-barracks", "deploy-warrior", "dismiss-warrior", "spend-gold"]);

const tab = ref("training");

// Local copy of training slots
const base = computed(() => props.barrackData ?? defaultBarracksData());
const localSlots = ref(base.value.trainingSlots.map(s => ({ ...s })));

// Pending selections per slot (before training starts)
const pendingTier = reactive(localSlots.value.map(() => null));
const pendingSpec = reactive(localSlots.value.map(() => null));

function specsByCategory(cat) {
  return Object.fromEntries(
    Object.entries(WARRIOR_SPECS).filter(([, v]) => v.category === cat)
  );
}

function clicksDone(slot) {
  return Math.min(props.currentClickCount - (slot.startedAt ?? props.currentClickCount), WARRIOR_TIERS[slot.tier].clickCost);
}

function trainingPct(slot) {
  return Math.min((clicksDone(slot) / WARRIOR_TIERS[slot.tier].clickCost) * 100, 100);
}

function isReady(slot) {
  if (!slot.tier || !slot.spec || slot.startedAt == null) return false;
  return (props.currentClickCount - slot.startedAt) >= WARRIOR_TIERS[slot.tier].clickCost;
}

function canAfford(tierKey) {
  return props.playerGold >= (WARRIOR_TIERS[tierKey]?.goldCost ?? 0);
}

function beginTraining(i) {
  const tier = pendingTier[i];
  const spec = pendingSpec[i];
  if (!tier || !spec) return;
  const goldCost = WARRIOR_TIERS[tier].goldCost;
  if (goldCost > 0) emit("spend-gold", goldCost);
  localSlots.value[i] = { tier, spec, startedAt: props.currentClickCount };
  pendingTier[i] = null;
  pendingSpec[i] = null;
  saveSlots();
}

function cancelTraining(i) {
  localSlots.value[i] = { spec: null, tier: null, startedAt: null };
  saveSlots();
}

function deploy(i) {
  const slot = localSlots.value[i];
  if (!isReady(slot)) return;
  const warrior = buildWarrior(slot.spec, slot.tier);
  emit("deploy-warrior", warrior);
  localSlots.value[i] = { spec: null, tier: null, startedAt: null };
  saveSlots();
}

function saveSlots() {
  emit("update-barracks", { trainingSlots: localSlots.value.map(s => ({ ...s })) });
}

function hpColor(w) {
  const pct = w.currentHP / w.maxHP;
  if (pct > 0.6) return "linear-gradient(90deg, #3ecf3e, #6eff6e)";
  if (pct > 0.3) return "linear-gradient(90deg, #cfab3e, #ffe066)";
  return "linear-gradient(90deg, #cf3e3e, #ff6e6e)";
}
</script>

<style scoped>
.barracks-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
}

.barracks-modal {
  background: #1a1008;
  border: 2px solid #8b6914;
  border-radius: 10px;
  width: min(760px, 96vw);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #e8d5a0;
  font-family: inherit;
}

.barracks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: #2a1a08;
  border-bottom: 1px solid #8b6914;
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.barracks-close {
  background: none;
  border: none;
  color: #e8d5a0;
  font-size: 1.1rem;
  cursor: pointer;
  opacity: 0.7;
}
.barracks-close:hover { opacity: 1; }

.barracks-tabs {
  display: flex;
  border-bottom: 1px solid #5a3d10;
}

.barracks-tab {
  flex: 1;
  padding: 10px;
  background: none;
  border: none;
  color: #a08050;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  position: relative;
}
.barracks-tab:hover { background: #2a1a08; color: #e8d5a0; }
.barracks-tab.active { background: #2a1a08; color: #ffe080; border-bottom: 2px solid #ffe080; }

.roster-count {
  display: inline-block;
  background: #8b6914;
  color: #fff;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 0.75rem;
  margin-left: 5px;
}

.barracks-body {
  overflow-y: auto;
  padding: 16px;
  flex: 1;
}

.barracks-subtitle {
  color: #a08050;
  font-size: 0.85rem;
  margin: 0 0 14px;
}

/* ── Training slots ── */
.training-slots {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.training-slot {
  background: #231508;
  border: 1px solid #5a3d10;
  border-radius: 8px;
  padding: 14px;
}

.slot-header {
  font-weight: bold;
  font-size: 0.95rem;
  margin-bottom: 10px;
  color: #e8d5a0;
}

.slot-empty-label { color: #666; font-weight: normal; }
.slot-training-label { color: #ffe080; margin-left: 6px; }
.ready-label { color: #6edf6e; }

.config-row {
  margin-bottom: 10px;
}
.config-row > label {
  display: block;
  font-size: 0.8rem;
  color: #a08050;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tier-btns, .spec-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tier-btn, .spec-btn {
  background: #2e1e0a;
  border: 1px solid #5a3d10;
  color: #c8a860;
  border-radius: 5px;
  padding: 6px 10px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tier-btn:hover, .spec-btn:hover { border-color: #ffe080; color: #ffe080; }
.tier-btn.selected, .spec-btn.selected { border-color: #ffe080; background: #3a2808; color: #ffe080; }

.tier-cost {
  font-size: 0.72rem;
  color: #a08050;
  margin-top: 2px;
}

.spec-category { margin-bottom: 8px; }
.spec-cat-label {
  font-size: 0.75rem;
  color: #7a6030;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.selected-preview {
  background: #2e1e0a;
  border: 1px solid #8b6914;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.84rem;
  color: #c8a860;
  line-height: 1.5;
}

.begin-training-btn {
  margin-top: 6px;
  width: 100%;
  padding: 9px;
  background: #5a3d10;
  border: 1px solid #8b6914;
  border-radius: 6px;
  color: #ffe080;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s;
}
.begin-training-btn:hover:not(:disabled) { background: #7a5510; }
.begin-training-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* Training progress */
.training-progress-wrap {
  background: #2a1a08;
  border-radius: 4px;
  height: 22px;
  position: relative;
  overflow: hidden;
  margin-bottom: 6px;
}
.training-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #8b6914, #ffe080);
  transition: width 0.3s;
}
.training-progress-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  color: #fff;
  font-weight: bold;
  text-shadow: 0 1px 2px #000;
}

.slot-stats {
  font-size: 0.8rem;
  color: #a08050;
  margin-bottom: 6px;
}

.cancel-btn {
  background: none;
  border: 1px solid #5a3d10;
  color: #a08050;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 0.8rem;
  cursor: pointer;
}
.cancel-btn:hover { border-color: #cf3e3e; color: #cf3e3e; }

/* Ready */
.ready-warrior {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 10px;
}
.ready-icon {
  font-size: 2rem;
  color: #6edf6e;
  margin-top: 2px;
}
.ready-info { flex: 1; }
.spec-desc {
  font-size: 0.8rem;
  color: #a08050;
  margin-top: 3px;
}

.deploy-btn {
  width: 100%;
  padding: 9px;
  background: #1a4a1a;
  border: 1px solid #3a8a3a;
  border-radius: 6px;
  color: #6edf6e;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s;
}
.deploy-btn:hover:not(:disabled) { background: #255525; }
.deploy-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Active Roster ── */
.no-warriors {
  text-align: center;
  padding: 40px 20px;
  color: #5a3d10;
}
.no-warriors i { font-size: 2.5rem; display: block; margin-bottom: 10px; }
.no-warriors p { font-size: 0.9rem; }

.roster-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.roster-warrior {
  display: flex;
  gap: 12px;
  align-items: center;
  background: #231508;
  border: 1px solid #5a3d10;
  border-radius: 8px;
  padding: 12px;
}

.roster-warrior-icon {
  font-size: 2rem;
  color: #ffe080;
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.roster-warrior-info { flex: 1; }

.roster-warrior-name {
  font-weight: bold;
  font-size: 0.95rem;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tier-badge {
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 10px;
  background: #5a3d10;
  color: #c8a860;
  text-transform: capitalize;
}

.roster-hp-bar-wrap {
  height: 8px;
  background: #2a1a08;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 3px;
}
.roster-hp-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}
.roster-hp-label {
  font-size: 0.78rem;
  color: #a08050;
  margin-bottom: 3px;
}
.roster-spec-desc {
  font-size: 0.78rem;
  color: #7a6030;
}

.dismiss-btn {
  background: none;
  border: 1px solid #5a3d10;
  color: #a08050;
  border-radius: 4px;
  padding: 5px 12px;
  font-size: 0.8rem;
  cursor: pointer;
  flex-shrink: 0;
}
.dismiss-btn:hover { border-color: #cf3e3e; color: #cf3e3e; }
</style>
