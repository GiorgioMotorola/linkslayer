<template>
  <div class="forge-overlay" @click.self="$emit('close')">
    <div class="forge-modal">
      <div class="forge-title">⚒️ The Forge</div>

      <div class="forge-scrap">
        <span class="forge-scrap-label">Scrap Metal</span>
        <span class="forge-scrap-count">{{ scrapMetal }}</span>
      </div>

      <div class="forge-columns">
        <!-- Weapon Column -->
        <div class="forge-col">
          <div class="forge-col-header">⚔️ Weapon</div>
          <div class="forge-col-current">Current bonus: +{{ weaponBonus }}</div>
          <div class="forge-counter">
            <button class="forge-adj" @click="adjustWeapon(-2)" :disabled="weaponAlloc < 2">−</button>
            <span class="forge-alloc">{{ weaponAlloc }} scrap</span>
            <button class="forge-adj" @click="adjustWeapon(2)" :disabled="weaponAlloc + 2 > availableForWeapon">+</button>
          </div>
          <div class="forge-yield">→ +{{ weaponAlloc / 2 }} weapon bonus</div>
          <div class="forge-btn-wrap">
            <button
              class="forge-make-btn"
              :disabled="weaponAlloc < 2"
              @click="forgeWeapon"
            >
              Forge Weapon
            </button>
            <template v-for="burstId in weaponBursts" :key="burstId">
              <span v-for="angle in sparkAngles" :key="angle" class="spark" :style="`--a: ${angle}deg`"></span>
            </template>
          </div>
        </div>

        <div class="forge-divider"></div>

        <!-- Defense Column -->
        <div class="forge-col">
          <div class="forge-col-header">🛡️ Defense</div>
          <div class="forge-col-current">Current bonus: +{{ shieldBonus }}</div>
          <div class="forge-counter">
            <button class="forge-adj" @click="adjustDefense(-2)" :disabled="defenseAlloc < 2">−</button>
            <span class="forge-alloc">{{ defenseAlloc }} scrap</span>
            <button class="forge-adj" @click="adjustDefense(2)" :disabled="defenseAlloc + 2 > availableForDefense">+</button>
          </div>
          <div class="forge-yield">→ +{{ defenseAlloc / 2 }} defense bonus</div>
          <div class="forge-btn-wrap">
            <button
              class="forge-make-btn"
              :disabled="defenseAlloc < 2"
              @click="forgeDefense"
            >
              Forge Defense
            </button>
            <template v-for="burstId in defenseBursts" :key="burstId">
              <span v-for="angle in sparkAngles" :key="angle" class="spark" :style="`--a: ${angle}deg`"></span>
            </template>
          </div>
        </div>
      </div>

      <div v-if="scrapMetal === 0" class="forge-empty">No scrap metal.</div>

      <!-- Augment Slots -->
      <div v-if="showAugmentSection" class="forge-augments">
        <div class="forge-augment-title">⚗️ Augment Slots</div>
        <div class="forge-augment-row">
          <!-- Weapon Slot -->
          <div class="forge-augment-slot">
            <div class="forge-augment-slot-label">⚔️ Weapon</div>
            <div class="forge-augment-current">
              {{ weaponAugment ? augmentLabel(weaponAugment) : '— Empty —' }}
            </div>
            <div v-if="uniquePendingWeapon.length > 0" class="forge-augment-pending">
              <button
                v-for="key in uniquePendingWeapon"
                :key="key"
                class="forge-augment-btn"
                @click="installAugment('weapon', key)"
              >
                Install: {{ augmentLabel(key) }}
              </button>
            </div>
            <div v-else-if="!weaponAugment" class="forge-augment-hint">Buy augments at the Tavern Fence</div>
          </div>

          <div class="forge-augment-divider"></div>

          <!-- Defense Slot -->
          <div class="forge-augment-slot">
            <div class="forge-augment-slot-label">🛡️ Defense</div>
            <div class="forge-augment-current">
              {{ defenseAugment ? augmentLabel(defenseAugment) : '— Empty —' }}
            </div>
            <div v-if="uniquePendingDefense.length > 0" class="forge-augment-pending">
              <button
                v-for="key in uniquePendingDefense"
                :key="key"
                class="forge-augment-btn"
                @click="installAugment('defense', key)"
              >
                Install: {{ augmentLabel(key) }}
              </button>
            </div>
            <div v-else-if="!defenseAugment" class="forge-augment-hint">Buy augments at the Tavern Fence</div>
          </div>
        </div>
      </div>

      <button class="forge-close-btn" @click="$emit('close')">← Back to Camp</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const AUGMENT_LABELS = {
  bleedEdge:    "Serrated Edge",
  venomCoat:    "Venom Coat",
  thunderstrike:"Thunderstrike Rune",
  emberTemper:  "Ember Temper",
  cursedRune:   "Cursed Rune",
  soulShard:    "Soul Shard",
  thornplate:   "Thornplate",
  stoneskin:    "Stoneskin",
  bloodpactRune:"Bloodpact Rune",
  ironWill:     "Iron Will",
  wardensWard:  "Warden's Ward",
  frostbound:   "Frostbound",
};

const props = defineProps({
  scrapMetal:             { type: Number, default: 0 },
  weaponBonus:            { type: Number, default: 0 },
  shieldBonus:            { type: Number, default: 0 },
  weaponAugment:          { type: String, default: "" },
  defenseAugment:         { type: String, default: "" },
  pendingWeaponAugments:  { type: Array,  default: () => [] },
  pendingDefenseAugments: { type: Array,  default: () => [] },
});

const emit = defineEmits(["close", "forge", "install-augment"]);

const weaponAlloc = ref(0);
const defenseAlloc = ref(0);
const weaponBursts = ref([]);
const defenseBursts = ref([]);
const sparkAngles = [0, 45, 90, 135, 180, 225, 270, 315];
let nextBurstId = 0;

const availableForWeapon = computed(() => props.scrapMetal - defenseAlloc.value);
const availableForDefense = computed(() => props.scrapMetal - weaponAlloc.value);

function adjustWeapon(delta) {
  weaponAlloc.value = Math.max(0, Math.min(weaponAlloc.value + delta, availableForWeapon.value));
}

function adjustDefense(delta) {
  defenseAlloc.value = Math.max(0, Math.min(defenseAlloc.value + delta, availableForDefense.value));
}

function triggerSparks(burstArray) {
  for (let wave = 0; wave < 3; wave++) {
    setTimeout(() => {
      const id = nextBurstId++;
      burstArray.value.push(id);
      setTimeout(() => {
        const idx = burstArray.value.indexOf(id);
        if (idx !== -1) burstArray.value.splice(idx, 1);
      }, 550);
    }, wave * 200);
  }
}

function forgeWeapon() {
  if (weaponAlloc.value < 2) return;
  emit("forge", { type: "weapon", scrapUsed: weaponAlloc.value });
  weaponAlloc.value = 0;
  triggerSparks(weaponBursts);
}

function forgeDefense() {
  if (defenseAlloc.value < 2) return;
  emit("forge", { type: "defense", scrapUsed: defenseAlloc.value });
  defenseAlloc.value = 0;
  triggerSparks(defenseBursts);
}

const uniquePendingWeapon = computed(() => [...new Set(props.pendingWeaponAugments)]);
const uniquePendingDefense = computed(() => [...new Set(props.pendingDefenseAugments)]);

const showAugmentSection = computed(() =>
  props.weaponAugment || props.defenseAugment ||
  props.pendingWeaponAugments.length > 0 || props.pendingDefenseAugments.length > 0
);

function augmentLabel(key) {
  return AUGMENT_LABELS[key] ?? key;
}

function installAugment(type, key) {
  emit("install-augment", { type, key });
  triggerSparks(type === "weapon" ? weaponBursts : defenseBursts);
}
</script>

<style scoped>
@import "./styles/forgeModalStyles.css";
</style>
