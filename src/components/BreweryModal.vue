<template>
  <div class="brewery-overlay">
    <div class="brewery-panel">

      <!-- Header -->
      <div class="brewery-header">
        <span><i class="ra ra-beer"></i> Farm &amp; Brewery</span>
        <button class="brewery-close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- Tabs -->
      <div class="brewery-tabs">
        <button :class="['brewery-tab', { active: activeTab === 'farm' }]" @click="activeTab = 'farm'"><i class="ra ra-grass"></i> Farm</button>
        <button :class="['brewery-tab', { active: activeTab === 'brew' }]" @click="activeTab = 'brew'"><i class="ra ra-brandy-bottle"></i> Brew</button>
        <button :class="['brewery-tab', { active: activeTab === 'stock' }]" @click="activeTab = 'stock'"><i class="ra ra-ammo-bag"></i> Stock</button>
      </div>

      <!-- ─────────────── FARM TAB ─────────────── -->
      <div v-if="activeTab === 'farm'" class="brewery-content">
        <div class="farm-intro">Plant ingredients in your 9 farm plots. Each takes <strong>{{ GROW_CLICKS }} clicks</strong> to grow.</div>

        <div class="farm-grid">
          <div
            v-for="(slot, idx) in farmSlots"
            :key="idx"
            :class="['farm-slot', slotState(slot)]"
            @click="handleSlotClick(idx)"
          >
            <template v-if="slotState(slot) === 'empty'">
              <span class="farm-slot-empty-icon">+</span>
              <span class="farm-slot-label">Plant</span>
            </template>
            <template v-else-if="slotState(slot) === 'growing'">
              <span class="farm-slot-icon"><i class="ra ra-sprout"></i></span>
              <span class="farm-slot-name">{{ INGREDIENTS[slot.ingredient]?.name }}</span>
              <div class="farm-slot-progress-bar">
                <div class="farm-slot-progress-fill" :style="{ width: growthPercent(slot) + '%' }"></div>
              </div>
              <span class="farm-slot-pct">{{ Math.floor(growthPercent(slot)) }}%</span>
            </template>
            <template v-else>
              <!-- ready -->
              <span class="farm-slot-icon">✅</span><!-- checkmark kept -->
              <span class="farm-slot-name">{{ INGREDIENTS[slot.ingredient]?.name }}</span>
              <span class="farm-slot-harvest-hint">Harvest</span>
            </template>
          </div>
        </div>

        <!-- Ingredient picker overlay -->
        <div v-if="showIngredientPicker" class="ingredient-picker-overlay" @click.self="showIngredientPicker = false">
          <div class="ingredient-picker">
            <div class="ingredient-picker-header">
              <div>
                <div class="ingredient-picker-title">Choose an ingredient to plant</div>
                <div class="ingredient-picker-subtitle">{{ props.playerGold }}g available</div>
              </div>
              <button class="ingredient-picker-x" @click="showIngredientPicker = false">✕</button>
            </div>

            <!-- Column headers -->
            <div class="ing-list-header">
              <span class="ing-col-name">Ingredient</span>
              <span class="ing-col-tag">Flavour</span>
              <span class="ing-col-yield">Yield</span>
              <span class="ing-col-cost">Cost</span>
              <span class="ing-col-action"></span>
            </div>

            <div class="ing-list-body">
            <div
              v-for="(ing, key) in INGREDIENTS"
              :key="key"
              :class="['ing-list-row', { 'ing-row-disabled': props.playerGold < ing.cost }]"
            >
              <span class="ing-col-name">{{ ing.name }}</span>
              <span class="ing-col-tag">{{ ing.tag }}</span>
              <span class="ing-col-yield">{{ ing.yieldMin }}–{{ ing.yieldMax }}</span>
              <span class="ing-col-cost">{{ ing.cost }}g</span>
              <span class="ing-col-action">
                <button
                  class="ing-plant-btn"
                  :disabled="props.playerGold < ing.cost"
                  @click="plantIngredient(pickerSlotIndex, key)"
                >Plant</button>
              </span>
            </div>
          </div> <!-- ing-list-body -->
          </div> <!-- ingredient-picker -->
        </div> <!-- ingredient-picker-overlay -->
      </div>

      <!-- ─────────────── BREW TAB ─────────────── -->
      <div v-if="activeTab === 'brew'" class="brewery-content">

        <!-- No active brew: setup form -->
        <template v-if="!state.activeBrew">
          <div class="brew-setup">
            <div class="brew-section-title">Choose a Base</div>
            <div class="brew-bases">
              <button
                v-for="(base, key) in BASES"
                :key="key"
                :class="['brew-base-btn', { selected: selectedBase === key }]"
                :disabled="props.playerGold < base.cost"
                @click="selectedBase = key"
              >
                <span class="brew-base-name">{{ base.name }}</span>
                <span class="brew-base-cost">{{ base.cost }}g</span>
                <span class="brew-base-info">~{{ base.bottles }} bottles · {{ base.baseHP }}hp · {{ base.baseSell }}g/ea</span>
              </button>
            </div>

            <div class="brew-section-title">Adjuncts (optional — from your harvested stock)</div>
            <div class="brew-adjuncts">
              <div class="brew-adjunct-slot">
                <label class="brew-adj-label">Slot 1</label>
                <select v-model="selectedAdj1" class="brew-adj-select">
                  <option value="">— None —</option>
                  <option
                    v-for="(qty, key) in availableAdjuncts"
                    :key="key"
                    :value="key"
                  >{{ INGREDIENTS[key]?.name }} ({{ qty }}) — {{ INGREDIENTS[key]?.tag }}</option>
                </select>
              </div>
              <div class="brew-adjunct-slot">
                <label class="brew-adj-label">Slot 2</label>
                <select v-model="selectedAdj2" class="brew-adj-select">
                  <option value="">— None —</option>
                  <option
                    v-for="(qty, key) in availableAdjuncts"
                    :key="key"
                    :value="key"
                  >{{ INGREDIENTS[key]?.name }} ({{ qty }}) — {{ INGREDIENTS[key]?.tag }}</option>
                </select>
              </div>
            </div>

            <div v-if="setupSynergy" class="brew-synergy-preview">
              <i class="ra ra-aura"></i> Synergy: <strong>{{ setupSynergy.name }}</strong>
              (+{{ setupSynergy.hpMod }}hp, +{{ setupSynergy.sellMod }}g sell, +{{ setupSynergy.bottleMod }} bottles)
            </div>

            <div class="brew-section-title">Beer Name <span class="brew-name-hint">(optional — added to the generated name)</span></div>
            <input
              v-model="brewCustomName"
              class="brew-name-input"
              placeholder="e.g. Mountain Special"
              maxlength="30"
            />

            <button
              class="brew-start-btn"
              :disabled="!selectedBase"
              @click="startBrew"
            >Start Brewing{{ selectedBase ? ` — ${BASES[selectedBase].name}` : '' }}</button>
          </div>
        </template>

        <!-- Active brew -->
        <template v-else>
          <div class="active-brew">
            <div class="active-brew-title"><i class="ra ra-brandy-bottle"></i> Brewing in progress</div>
            <div class="active-brew-details">
              <span class="brew-detail-item"><strong>Base:</strong> {{ BASES[state.activeBrew.base]?.name }}</span>
              <span v-if="state.activeBrew.adjunct1" class="brew-detail-item"><strong>Adj 1:</strong> {{ INGREDIENTS[state.activeBrew.adjunct1]?.name }}</span>
              <span v-if="state.activeBrew.adjunct2" class="brew-detail-item"><strong>Adj 2:</strong> {{ INGREDIENTS[state.activeBrew.adjunct2]?.name }}</span>
              <span v-if="activeSynergy" class="brew-detail-item brew-synergy-tag"><i class="ra ra-aura"></i> {{ activeSynergy.name }}</span>
            </div>
            <div v-if="state.activeBrew.customName" class="active-brew-custom-name">
              Named: "{{ state.activeBrew.customName }}"
            </div>

            <!-- Quality bar -->
            <div class="quality-bar-wrapper">
              <div class="quality-bar-title">Quality</div>
              <div class="quality-bar-outer">
                <div class="quality-bar">
                  <div
                    v-for="zone in QUALITY_ZONES"
                    :key="zone.label"
                    class="quality-zone"
                    :style="{ background: zoneColor(zone.label), flex: zoneWidth(zone) }"
                    :title="zone.label"
                  >
                    <span class="quality-zone-label">{{ zone.label === 'Too Early' ? 'Early' : zone.label }}</span>
                  </div>
                </div>
                <div class="quality-marker" :style="{ left: markerPct + '%' }"></div>
              </div>
              <div class="quality-indicator-row">
                <span class="quality-current-label" :style="{ color: zoneColor(currentZone.label) }">
                  {{ currentZone.label }}
                </span>
                <span class="quality-click-delta">{{ clickDelta }} clicks since start</span>
              </div>
            </div>

            <!-- Bottle preview -->
            <div class="brew-preview" v-if="brewPreview">
              <div class="brew-preview-title">Predicted Result</div>
              <div class="brew-preview-stats">
                <span><i class="ra ra-brandy-bottle"></i> {{ brewPreview.bottles }} bottles</span>
                <span><i class="ra ra-health"></i> {{ brewPreview.hp }} HP each</span>
                <span><i class="ra ra-gold-bar"></i> {{ brewPreview.sell }}g sell each</span>
                <span v-if="brewPreview.poisonClicks > 0" class="brew-swill-warning"><i class="ra ra-skull"></i> Swill — poisons for {{ brewPreview.poisonClicks }} clicks</span>
              </div>
            </div>

            <div class="brew-bottle-row">
              <button
                class="brew-bottle-btn"
                :disabled="!currentZone.canBottle"
                :title="!currentZone.canBottle ? 'The brew needs more time' : ''"
                @click="bottleBrew"
              >
                <i class="ra ra-brandy-bottle"></i> Bottle
              </button>
              <span v-if="!currentZone.canBottle" class="brew-too-early">
                Needs {{ GROW_CLICKS - clickDelta }} more clicks
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- ─────────────── STOCK TAB ─────────────── -->
      <div v-if="activeTab === 'stock'" class="brewery-content">

        <!-- Harvested ingredients -->
        <div class="stock-section">
          <div class="stock-section-title"><i class="ra ra-leaf"></i> Harvested Ingredients</div>
          <div v-if="!hasHarvestedStock" class="stock-empty">No ingredients harvested yet.</div>
          <div v-else class="stock-ingredient-list">
            <div
              v-for="(qty, key) in state.harvestedStock"
              :key="key"
              class="stock-row"
            >
              <span class="stock-row-label">
                {{ INGREDIENTS[key]?.name }} ×{{ qty }}
                <span class="stock-row-sub">({{ INGREDIENTS[key]?.tag }})</span>
              </span>
              <div class="stock-stepper">
                <button class="stepper-btn" @click="ingTransferQty[key] = Math.max(1, ingQty(key, qty) - 1)">▼</button>
                <span class="stepper-val">{{ ingQty(key, qty) }}</span>
                <button class="stepper-btn" @click="ingTransferQty[key] = Math.min(qty, ingQty(key, qty) + 1)">▲</button>
              </div>
              <button class="stock-btn stock-btn-backpack" @click="takeIngredientToBackpack(key, qty)">→ Backpack</button>
              <button class="stock-btn stock-btn-sell" @click="sellIngredient(key, qty)">Sell ({{ INGREDIENTS[key]?.cost ?? 0 }}g)</button>
            </div>
          </div>
        </div>

        <!-- Bottled beers -->
        <div class="stock-section">
          <div class="stock-section-title"><i class="ra ra-brandy-bottle"></i> Bottled Beer</div>
          <div v-if="!state.bottledStock?.length" class="stock-empty">No bottles yet.</div>
          <div v-else class="stock-beer-list">
            <div
              v-for="(beer, idx) in state.bottledStock"
              :key="idx"
              class="stock-row"
            >
              <span class="stock-row-label">
                {{ beer.name }} ×{{ beer.qty }}
                <span class="stock-row-sub"
                  :style="{ color: zoneColor(beer.quality) }">{{ beer.quality }}</span>
                <span class="stock-row-sub"><i class="ra ra-health"></i>{{ beer.hp }}hp</span>
                <span v-if="beer.poisonClicks > 0" class="stock-row-poison"><i class="ra ra-skull"></i>{{ beer.poisonClicks }}cl</span>
              </span>
              <div class="stock-stepper">
                <button class="stepper-btn" @click="beerTransferQty[idx] = Math.max(1, beerQty(idx, beer.qty) - 1)">▼</button>
                <span class="stepper-val">{{ beerQty(idx, beer.qty) }}</span>
                <button class="stepper-btn" @click="beerTransferQty[idx] = Math.min(beer.qty, beerQty(idx, beer.qty) + 1)">▲</button>
              </div>
              <button class="stock-btn stock-btn-backpack" @click="takeBeerToBackpack(idx)">→ Backpack</button>
              <button class="stock-btn stock-btn-sell" @click="listBeerInTavern(idx)">→ Tavern ({{ beer.sellPrice }}g)</button>
            </div>
          </div>
        </div>

        <!-- Tavern stock -->
        <div class="stock-section" v-if="state.tavernStock?.length">
          <div class="stock-section-title"><i class="ra ra-castle-emblem"></i> Currently Listed in Tavern</div>
          <div class="stock-beer-list">
            <div v-for="(beer, idx) in state.tavernStock" :key="idx" class="stock-row stock-beer-tavern">
              <span class="stock-row-label">
                {{ beer.name }} ×{{ beer.qty }}
                <span class="stock-row-sub" :style="{ color: zoneColor(beer.quality) }">{{ beer.quality }}</span>
                <span class="stock-row-sub"><i class="ra ra-health"></i>{{ beer.hp }}hp</span>
                <span class="stock-row-sub" style="color:#d4a94a">{{ beer.sellPrice }}g ea</span>
              </span>
              <button
                class="stock-btn stock-btn-backpack"
                :disabled="props.playerGold < beer.sellPrice || beer.qty < 1"
                @click="buyFromTavern(idx)"
              >Buy ({{ beer.sellPrice }}g)</button>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import {
  INGREDIENTS, BASES, QUALITY_ZONES, GROW_CLICKS,
  getQualityZone, findSynergy, generateBeerName,
  calculateBrewResult, defaultBreweryState,
} from "@/utils/breweryDefs.js";

const props = defineProps({
  breweryState:      { type: Object,  default: null },
  playerGold:        { type: Number,  default: 0 },
  playerName:        { type: String,  default: "" },
  currentClickCount: { type: Number,  default: 0 },
  hasTavern:         { type: Boolean, default: false },
});

const emit = defineEmits([
  "close",
  "update-brewery",
  "spend-gold",
  "earn-gold",
  "add-to-backpack-ingredient",
  "add-to-backpack-beer",
  "list-in-tavern",
  "buy-from-tavern",
]);

// ── Local state ─────────────────────────────────────────────────────────────
const activeTab         = ref("farm");
const showIngredientPicker = ref(false);
const pickerSlotIndex   = ref(null);
const selectedBase      = ref("");
const selectedAdj1      = ref("");
const selectedAdj2      = ref("");
const brewCustomName    = ref("");

// Deep clone brewery state so we can mutate locally before emitting
const state = ref(props.breweryState ? JSON.parse(JSON.stringify(props.breweryState)) : defaultBreweryState());

watch(() => props.breweryState, (val) => {
  if (val) state.value = JSON.parse(JSON.stringify(val));
}, { deep: true });

// ── Farm helpers ─────────────────────────────────────────────────────────────
const farmSlots = computed(() => state.value.farmSlots ?? Array(9).fill(null).map(() => ({ ingredient: null, plantedAt: null })));

function slotState(slot) {
  if (!slot.ingredient) return "empty";
  const delta = props.currentClickCount - (slot.plantedAt ?? props.currentClickCount);
  return delta >= GROW_CLICKS ? "ready" : "growing";
}

function growthPercent(slot) {
  if (!slot.ingredient) return 0;
  const delta = props.currentClickCount - (slot.plantedAt ?? props.currentClickCount);
  return Math.min(100, (delta / GROW_CLICKS) * 100);
}


function handleSlotClick(idx) {
  const slot = state.value.farmSlots[idx];
  if (slotState(slot) === "empty") {
    pickerSlotIndex.value = idx;
    showIngredientPicker.value = true;
  } else if (slotState(slot) === "ready") {
    harvestSlot(idx);
  }
  // growing: do nothing on click
}

function plantIngredient(idx, ingredientKey) {
  const ing = INGREDIENTS[ingredientKey];
  if (!ing || props.playerGold < ing.cost) return;
  emit("spend-gold", ing.cost);
  const slots = [...state.value.farmSlots];
  slots[idx] = { ingredient: ingredientKey, plantedAt: props.currentClickCount };
  state.value.farmSlots = slots;
  showIngredientPicker.value = false;
  save();
}

function harvestSlot(idx) {
  const slot = state.value.farmSlots[idx];
  const ing = INGREDIENTS[slot.ingredient];
  if (!ing) return;
  const qty = ing.yieldMin + Math.floor(Math.random() * (ing.yieldMax - ing.yieldMin + 1));
  const key = slot.ingredient;
  const stock = { ...state.value.harvestedStock };
  stock[key] = (stock[key] ?? 0) + qty;
  state.value.harvestedStock = stock;
  const slots = [...state.value.farmSlots];
  slots[idx] = { ingredient: null, plantedAt: null };
  state.value.farmSlots = slots;
  save();
}

// ── Brew helpers ─────────────────────────────────────────────────────────────
const availableAdjuncts = computed(() => {
  const stock = state.value.harvestedStock ?? {};
  return Object.fromEntries(Object.entries(stock).filter(([, qty]) => qty > 0));
});

const setupSynergy = computed(() => findSynergy(selectedAdj1.value || null, selectedAdj2.value || null));

const clickDelta = computed(() => {
  const brew = state.value.activeBrew;
  if (!brew) return 0;
  return Math.max(0, props.currentClickCount - (brew.startedAt ?? props.currentClickCount));
});

const currentZone = computed(() => getQualityZone(clickDelta.value));

const activeSynergy = computed(() => {
  const brew = state.value.activeBrew;
  if (!brew) return null;
  return findSynergy(brew.adjunct1 || null, brew.adjunct2 || null);
});

const brewPreview = computed(() => {
  const brew = state.value.activeBrew;
  if (!brew || !currentZone.value.canBottle) return null;
  return calculateBrewResult(brew.base, brew.adjunct1 || null, brew.adjunct2 || null, clickDelta.value);
});

function startBrew() {
  if (!selectedBase.value) return;
  const base = BASES[selectedBase.value];
  if (!base || props.playerGold < base.cost) return;

  const adj1 = selectedAdj1.value || null;
  const adj2 = selectedAdj2.value || null;

  // Deduct adjuncts from harvestedStock
  const stock = { ...state.value.harvestedStock };
  if (adj1) {
    if (!stock[adj1] || stock[adj1] <= 0) return;
    stock[adj1]--;
    if (stock[adj1] === 0) delete stock[adj1];
  }
  if (adj2) {
    if (!stock[adj2] || stock[adj2] <= 0) return;
    stock[adj2]--;
    if (stock[adj2] === 0) delete stock[adj2];
  }
  state.value.harvestedStock = stock;

  emit("spend-gold", base.cost);

  state.value.activeBrew = {
    base:       selectedBase.value,
    adjunct1:   adj1,
    adjunct2:   adj2,
    startedAt:  props.currentClickCount,
    customName: brewCustomName.value.trim(),
  };

  selectedBase.value = "";
  selectedAdj1.value = "";
  selectedAdj2.value = "";
  brewCustomName.value = "";
  save();
}

function bottleBrew() {
  const brew = state.value.activeBrew;
  if (!brew || !currentZone.value.canBottle) return;

  const result = calculateBrewResult(brew.base, brew.adjunct1 || null, brew.adjunct2 || null, clickDelta.value);
  if (!result) return;

  const baseName = BASES[brew.base]?.name ?? brew.base;
  const generatedName = generateBeerName(
    props.playerName,
    result.zone.label,
    result.synergy,
    brew.adjunct1 || null,
    brew.adjunct2 || null,
    baseName,
  );
  const finalName = brew.customName
    ? `${brew.customName} (${generatedName})`
    : generatedName;

  const bottle = {
    name:         finalName,
    quality:      result.zone.label,
    hp:           result.hp,
    sellPrice:    result.sell,
    qty:          result.bottles,
    poisonClicks: result.poisonClicks,
  };

  state.value.bottledStock = [...(state.value.bottledStock ?? []), bottle];
  state.value.activeBrew = null;
  save();
}

// ── Stock helpers ─────────────────────────────────────────────────────────────
const hasHarvestedStock = computed(() =>
  Object.values(state.value.harvestedStock ?? {}).some(q => q > 0)
);

// Per-row quantity selections for stock actions
const ingTransferQty  = ref({});
const beerTransferQty = ref({});

function ingQty(key, max) {
  if (ingTransferQty.value[key] == null || ingTransferQty.value[key] > max)
    ingTransferQty.value[key] = max;
  return ingTransferQty.value[key];
}

function beerQty(idx, max) {
  if (beerTransferQty.value[idx] == null || beerTransferQty.value[idx] > max)
    beerTransferQty.value[idx] = max;
  return beerTransferQty.value[idx];
}

function takeIngredientToBackpack(key, qty) {
  const amount = Math.min(qty, ingTransferQty.value[key] ?? qty);
  if (amount <= 0) return;
  emit("add-to-backpack-ingredient", { key, qty: amount });
  const stock = { ...state.value.harvestedStock };
  stock[key] = (stock[key] ?? 0) - amount;
  if (stock[key] <= 0) delete stock[key];
  state.value.harvestedStock = stock;
  delete ingTransferQty.value[key];
  save();
}

function sellIngredient(key, qty) {
  const ing = INGREDIENTS[key];
  if (!ing) return;
  const amount = Math.min(qty, ingTransferQty.value[key] ?? qty);
  if (amount <= 0) return;
  emit("earn-gold", ing.cost * amount);
  const stock = { ...state.value.harvestedStock };
  stock[key] = (stock[key] ?? 0) - amount;
  if (stock[key] <= 0) delete stock[key];
  state.value.harvestedStock = stock;
  delete ingTransferQty.value[key];
  save();
}

function takeBeerToBackpack(idx) {
  const beer = state.value.bottledStock[idx];
  if (!beer) return;
  const amount = Math.min(beer.qty, beerTransferQty.value[idx] ?? beer.qty);
  if (amount <= 0) return;
  emit("add-to-backpack-beer", { ...beer, qty: amount });
  const remaining = beer.qty - amount;
  const updated = [...state.value.bottledStock];
  if (remaining > 0) updated[idx] = { ...beer, qty: remaining };
  else updated.splice(idx, 1);
  state.value.bottledStock = updated;
  delete beerTransferQty.value[idx];
  save();
}

function listBeerInTavern(idx) {
  const beer = state.value.bottledStock[idx];
  if (!beer) return;
  const amount = Math.min(beer.qty, beerTransferQty.value[idx] ?? beer.qty);
  if (amount <= 0) return;
  const tavernEntry = { ...beer, qty: amount };
  // Merge with existing tavern entry for same beer name if present
  const existing = (state.value.tavernStock ?? []).findIndex(t => t.name === beer.name && t.sellPrice === beer.sellPrice);
  const tavernStock = [...(state.value.tavernStock ?? [])];
  if (existing >= 0) tavernStock[existing] = { ...tavernStock[existing], qty: tavernStock[existing].qty + amount };
  else tavernStock.push(tavernEntry);
  state.value.tavernStock = tavernStock;
  const remaining = beer.qty - amount;
  const updated = [...state.value.bottledStock];
  if (remaining > 0) updated[idx] = { ...beer, qty: remaining };
  else updated.splice(idx, 1);
  state.value.bottledStock = updated;
  delete beerTransferQty.value[idx];
  emit("list-in-tavern", tavernEntry);
  save();
}

function buyFromTavern(idx) {
  const beer = state.value.tavernStock[idx];
  if (!beer || props.playerGold < beer.sellPrice) return;
  emit("spend-gold", beer.sellPrice);
  emit("add-to-backpack-beer", { ...beer, qty: 1 });
  const tavernStock = [...state.value.tavernStock];
  if (beer.qty > 1) tavernStock[idx] = { ...beer, qty: beer.qty - 1 };
  else tavernStock.splice(idx, 1);
  state.value.tavernStock = tavernStock;
  save();
}

// ── Persistence ───────────────────────────────────────────────────────────────
function save() {
  emit("update-brewery", JSON.parse(JSON.stringify(state.value)));
}

// ── UI helpers ────────────────────────────────────────────────────────────────
const ZONE_COLORS = {
  "Too Early":      "#888",
  "Rough":          "#c0392b",
  "Decent":         "#e67e22",
  "Perfect":        "#27ae60",
  "Over-Fermented": "#8e44ad",
  "Swill":          "#2c3e50",
};
function zoneColor(label) { return ZONE_COLORS[label] ?? "#999"; }
// Proportional zone widths based on actual click ranges; Swill capped at 12
const SWILL_DISPLAY = 12;
const QUALITY_BAR_MAX = QUALITY_ZONES.reduce((acc, z) => acc + (z.max === Infinity ? SWILL_DISPLAY : z.max - z.min + 1), 0);
function zoneWidth(zone) {
  return zone.max === Infinity ? SWILL_DISPLAY : zone.max - zone.min + 1;
}
const markerPct = computed(() => Math.min((clickDelta.value / QUALITY_BAR_MAX) * 100, 99.5));
</script>

<style scoped>
/* ── Palette: dark grey-blue ──────────────────────────────────────────────── */
/* bg0: #131820  bg1: #1a2130  bg2: #1f2a3c  bg3: #263348             */
/* border: #2d3f55  accent: #4a7aaa  accent-dim: #2e4d6a              */
/* text: #c8d8e8  text-dim: #7a9ab8  text-muted: #3d5570              */
/* gold: #d4a94a  green: #3fb950  purple: #8b6dbd  red: #e74c3c       */

.brewery-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1200;
  pointer-events: none;
}

.brewery-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 680px;
  height: 100dvh;
  background: #131820;
  border-left: 1px solid #2d3f55;
  box-shadow: -6px 0 32px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: "IBM Plex Sans", Arial, sans-serif;
  color: #c8d8e8;
  pointer-events: all;
}

.brewery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #1a2130;
  border-bottom: 1px solid #2d3f55;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #e0eaf5;
}

.brewery-close-btn {
  background: none;
  border: none;
  color: #4a7aaa;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 2px 6px;
}
.brewery-close-btn:hover { color: #e0eaf5; }

.brewery-tabs {
  display: flex;
  border-bottom: 1px solid #2d3f55;
}

.brewery-tab {
  flex: 1;
  padding: 10px;
  background: #131820;
  border: none;
  border-right: 1px solid #2d3f55;
  color: #4a7aaa;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.brewery-tab:last-child { border-right: none; }
.brewery-tab:hover { background: #1a2130; color: #c8d8e8; }
.brewery-tab.active { background: #1f2a3c; color: #e0eaf5; font-weight: 600; border-bottom: 2px solid #4a7aaa; }

.brewery-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ─── FARM ─── */
.farm-intro { font-size: 0.85rem; color: #7a9ab8; }

.farm-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.farm-slot {
  background: #1a2130;
  border: 1px solid #2d3f55;
  border-radius: 6px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  min-height: 80px;
  text-align: center;
  transition: background 0.15s;
}
.farm-slot:hover { background: #1f2a3c; }
.farm-slot.ready { border-color: #3fb950; background: #162318; }
.farm-slot.growing { border-color: #4a7aaa; cursor: default; }

.farm-slot-empty-icon { font-size: 1.6rem; color: #2d3f55; }
.farm-slot-label { font-size: 0.72rem; color: #3d5570; }
.farm-slot-icon { font-size: 1.4rem; }
.farm-slot-name { font-size: 0.75rem; color: #c8d8e8; font-weight: 600; }
.farm-slot-harvest-hint { font-size: 0.68rem; color: #3fb950; }
.farm-slot-pct { font-size: 0.68rem; color: #7a9ab8; }

.farm-slot-progress-bar {
  width: 100%;
  height: 5px;
  background: #1f2a3c;
  border-radius: 3px;
  overflow: hidden;
}
.farm-slot-progress-fill {
  height: 100%;
  background: #4a7aaa;
  border-radius: 3px;
  transition: width 0.3s;
}

/* ─── Ingredient picker ─── */
.ingredient-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
}

.ingredient-picker {
  background: #131820;
  border: 1px solid #2d3f55;
  border-radius: 8px;
  width: min(620px, 94vw);
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: "IBM Plex Sans", Arial, sans-serif;
  color: #c8d8e8;
}

.ingredient-picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #2d3f55;
  background: #1a2130;
  flex-shrink: 0;
}
.ingredient-picker-title { font-weight: 700; font-size: 1rem; color: #e0eaf5; }
.ingredient-picker-subtitle { font-size: 0.78rem; color: #4a7aaa; margin-top: 2px; }
.ingredient-picker-x {
  background: none; border: none; color: #4a7aaa; font-size: 1rem; cursor: pointer; padding: 2px 6px; flex-shrink: 0;
}
.ingredient-picker-x:hover { color: #e0eaf5; }

/* Column header row */
.ing-list-header {
  display: grid;
  grid-template-columns: 140px 1fr 60px 55px 64px;
  gap: 0;
  padding: 6px 12px;
  background: #1a2130;
  border-bottom: 1px solid #2d3f55;
  font-size: 0.75rem;
  font-weight: 600;
  color: #7a9ab8;
  flex-shrink: 0;
}

/* Scrollable list body */
.ing-list-body {
  overflow-y: auto;
  flex: 1;
}

.ing-list-row {
  display: grid;
  grid-template-columns: 140px 1fr 60px 55px 64px;
  align-items: center;
  gap: 0;
  padding: 7px 12px;
  border-bottom: 1px solid #1a2130;
  transition: background 0.1s;
  cursor: default;
}
.ing-list-row:hover:not(.ing-row-disabled) { background: #1a2130; }
.ing-row-disabled { opacity: 0.38; }

.ing-col-name  { font-size: 0.85rem; font-weight: 600; color: #c8d8e8; padding-right: 6px; }
.ing-col-tag   { font-size: 0.75rem; color: #7a9ab8; font-style: italic; }
.ing-col-yield  { font-size: 0.75rem; color: #7a9ab8; text-align: center; }
.ing-col-cost   { font-size: 0.75rem; color: #d4a94a; font-weight: 600; text-align: right; padding-right: 8px; }
.ing-col-action { display: flex; justify-content: flex-end; }

.ing-plant-btn {
  background: #2e4d6a;
  border: 1px solid #4a7aaa;
  border-radius: 4px;
  color: #79b8ff;
  font-size: 0.75rem;
  font-family: inherit;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.ing-plant-btn:hover:not(:disabled) { background: #3a6090; }
.ing-plant-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ─── BREW ─── */
.brew-setup { display: flex; flex-direction: column; gap: 12px; }
.brew-section-title { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4a7aaa; }
.brew-name-hint { font-weight: 400; text-transform: none; letter-spacing: 0; color: #2e4d6a; font-style: italic; }

.brew-bases { display: flex; flex-wrap: wrap; gap: 7px; }
.brew-base-btn {
  background: #1a2130;
  border: 1px solid #2d3f55;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #c8d8e8;
  font-family: inherit;
  transition: background 0.15s;
  min-width: 110px;
}
.brew-base-btn:hover:not(:disabled) { background: #1f2a3c; }
.brew-base-btn.selected { background: #1f2a3c; border-color: #4a7aaa; }
.brew-base-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.brew-base-name { font-size: 0.9rem; font-weight: 600; }
.brew-base-cost { font-size: 0.75rem; color: #d4a94a; }
.brew-base-info { font-size: 0.68rem; color: #7a9ab8; }

.brew-adjuncts { display: flex; gap: 10px; flex-wrap: wrap; }
.brew-adjunct-slot { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 160px; }
.brew-adj-label { font-size: 0.75rem; color: #7a9ab8; }
.brew-adj-select {
  background: #1a2130;
  border: 1px solid #2d3f55;
  border-radius: 5px;
  color: #c8d8e8;
  padding: 6px 8px;
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}

.brew-synergy-preview {
  background: #20163a;
  border: 1px solid #42306a;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.82rem;
  color: #b09ad8;
}

.brew-name-input {
  background: #1a2130;
  border: 1px solid #2d3f55;
  border-radius: 5px;
  color: #c8d8e8;
  padding: 7px 10px;
  font-family: inherit;
  font-size: 0.85rem;
  width: 100%;
  box-sizing: border-box;
}

.brew-start-btn {
  background: #2e4d6a;
  border: 1px solid #4a7aaa;
  border-radius: 6px;
  color: #e0eaf5;
  padding: 10px 18px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  align-self: flex-start;
}
.brew-start-btn:hover:not(:disabled) { background: #3a6090; }
.brew-start-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Active brew */
.active-brew { display: flex; flex-direction: column; gap: 14px; }
.active-brew-title { font-size: 1rem; font-weight: 700; color: #e0eaf5; }
.active-brew-details { display: flex; flex-wrap: wrap; gap: 8px; }
.brew-detail-item {
  background: #1a2130;
  border: 1px solid #2d3f55;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.78rem;
  color: #c8d8e8;
}
.brew-synergy-tag { border-color: #42306a; color: #b09ad8; background: #20163a; }
.active-brew-custom-name { font-size: 0.8rem; color: #7a9ab8; font-style: italic; }

.quality-bar-wrapper { display: flex; flex-direction: column; gap: 5px; }
.quality-bar-title { font-size: 0.75rem; color: #7a9ab8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

.quality-bar-outer {
  position: relative;
  padding-bottom: 5px;
}

.quality-bar {
  display: flex;
  border-radius: 5px;
  overflow: hidden;
  height: 22px;
  border: 1px solid #2d3f55;
}

.quality-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.65;
  min-width: 0;
}

.quality-zone-label {
  font-size: 0.55rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 2px;
}

.quality-marker {
  position: absolute;
  top: -3px;
  height: 28px;
  width: 3px;
  background: #fff;
  border-radius: 2px;
  transform: translateX(-50%);
  box-shadow: 0 0 6px rgba(255,255,255,0.85), 0 0 2px #fff;
  pointer-events: none;
  transition: left 0.4s ease;
}

.quality-marker::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: #fff;
}

.quality-indicator-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.quality-current-label { font-size: 0.85rem; font-weight: 700; }
.quality-click-delta { font-size: 0.75rem; color: #7a9ab8; }

.brew-preview {
  background: #1a2130;
  border: 1px solid #2d3f55;
  border-radius: 6px;
  padding: 10px 12px;
}
.brew-preview-title { font-size: 0.75rem; font-weight: 700; color: #4a7aaa; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
.brew-preview-stats { display: flex; flex-wrap: wrap; gap: 10px; font-size: 0.82rem; }
.brew-swill-warning { color: #e74c3c; font-weight: 600; }

.brew-bottle-row { display: flex; align-items: center; gap: 10px; }
.brew-bottle-btn {
  background: #163020;
  border: 1px solid #285038;
  border-radius: 6px;
  color: #3fb950;
  padding: 9px 16px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.brew-bottle-btn:hover:not(:disabled) { background: #1e4028; }
.brew-bottle-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.brew-too-early { font-size: 0.78rem; color: #4a7aaa; }

/* ─── STOCK ─── */
.stock-section { display: flex; flex-direction: column; gap: 8px; }
.stock-section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4a7aaa; }
.stock-empty { font-size: 0.82rem; color: #2d3f55; font-style: italic; }

.stock-ingredient-list, .stock-beer-list { display: flex; flex-direction: column; gap: 4px; }

.stock-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #1a2130;
  border: 1px solid #2d3f55;
  border-radius: 5px;
}

.stock-row-label {
  flex: 1;
  font-size: 0.82rem;
  font-weight: 600;
  color: #c8d8e8;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.stock-row-sub { font-size: 0.72rem; color: #7a9ab8; font-weight: 400; font-style: italic; }
.stock-row-poison { font-size: 0.72rem; color: #e74c3c; font-style: normal; }

.stock-stepper {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  border: 1px solid #2d3f55;
  border-radius: 4px;
  overflow: hidden;
}
.stepper-btn {
  background: #1f2a3c;
  border: none;
  color: #7a9ab8;
  font-size: 0.6rem;
  padding: 0 6px;
  height: 26px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stepper-btn:hover { background: #263348; color: #c8d8e8; }
.stepper-val {
  min-width: 28px;
  text-align: center;
  font-size: 0.82rem;
  color: #c8d8e8;
  background: #131820;
  padding: 0 4px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid #2d3f55;
  border-right: 1px solid #2d3f55;
}

.stock-beer-tavern { border-color: #4a7aaa; opacity: 0.75; }
.stock-tavern-price { color: #d4a94a; font-weight: 600; }

.stock-btn {
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.72rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
  border: 1px solid;
}
.stock-btn-backpack { background: #1f2a3c; border-color: #2d3f55; color: #79b8ff; }
.stock-btn-backpack:hover { background: #263348; }
.stock-btn-sell { background: #1f2010; border-color: #4a4020; color: #d4a94a; }
.stock-btn-sell:hover { background: #2a2a18; }

/* ─── MOBILE ─── */
@media (max-width: 700px) {
  .brewery-panel {
    width: 100vw;
    border-left: none;
  }

  .brewery-content {
    padding: 10px;
    gap: 10px;
  }

  /* Ingredient picker — full screen, drop Flavour + Yield columns */
  .ingredient-picker {
    width: 100vw;
    max-height: 100dvh;
    border-radius: 0;
  }

  .ing-list-header,
  .ing-list-row {
    grid-template-columns: 1fr 50px 58px;
  }

  .ing-col-tag,
  .ing-col-yield {
    display: none;
  }

  .ing-col-name {
    font-size: 0.8rem;
  }

  /* Brew adjuncts — stack vertically */
  .brew-adjuncts {
    flex-direction: column;
  }

  .brew-adjunct-slot {
    min-width: unset;
  }

  /* Brew bases — fill row */
  .brew-base-btn {
    min-width: unset;
    flex: 1;
  }

  /* Stock rows — allow label to wrap so buttons don't overflow */
  .stock-row {
    flex-wrap: wrap;
    gap: 6px;
  }

  .stock-row-label {
    width: 100%;
    white-space: normal;
  }

  .farm-grid {
    gap: 6px;
  }

  .farm-slot {
    min-height: 68px;
    padding: 7px 5px;
  }
}
</style>
