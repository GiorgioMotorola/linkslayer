<template>
  <div class="tshop-overlay" @click.self="$emit('close')">
    <div class="tshop-modal">

      <div class="tshop-header">
        <div class="tshop-title">THE FENCE</div>
        <div class="tshop-gold">{{ playerGold }} Gold</div>
      </div>

      <div class="tshop-body">
        <div class="tshop-section-label">🏕️ Camp Supplies</div>
        <div class="tshop-list">
          <div
            v-for="item in campItems"
            :key="item.tier"
            class="tshop-item"
            :class="{
              'tshop-owned': campTier >= item.tier,
              'tshop-locked': item.tier > campTier + 1,
            }"
          >
            <div class="tshop-item-header" @click="toggle(`camp-${item.tier}`)">
              <span class="tshop-item-name">{{ item.name }}</span>
              <span v-if="campTier >= item.tier" class="tshop-check">✓</span>
              <span v-else-if="item.tier > campTier + 1" class="tshop-lock">🔒</span>
              <span v-else class="tshop-chevron" :class="{ open: expandedId === `camp-${item.tier}` }">›</span>
            </div>
            <div v-if="expandedId === `camp-${item.tier}`" class="tshop-item-body">
              <p class="tshop-item-desc">{{ item.desc }}</p>
              <span v-if="campTier >= item.tier" class="tshop-owned-label">Owned</span>
              <button
                v-else
                class="tshop-buy-btn"
                :disabled="playerGold < item.cost"
                @click="$emit('buy', item.tier); expandedId = null"
              >
                {{ item.cost }}g — Buy
              </button>
            </div>
          </div>
        </div>

        <div class="tshop-section-label">⚗️ Augments <span class="tshop-aug-hint">— Install at the Forge</span></div>

        <div class="tshop-group-label">⚔️ Weapon</div>
        <div class="tshop-list">
          <div
            v-for="aug in weaponAugments"
            :key="aug.id"
            class="tshop-item"
            :class="{ 'tshop-owned': isAugOwned('weapon', aug.details) }"
          >
            <div class="tshop-item-header" @click="toggle(aug.id)">
              <span class="tshop-item-name">{{ aug.name }}</span>
              <span v-if="isAugOwned('weapon', aug.details)" class="tshop-check">✓</span>
              <span v-else class="tshop-chevron" :class="{ open: expandedId === aug.id }">›</span>
            </div>
            <div v-if="expandedId === aug.id" class="tshop-item-body">
              <p class="tshop-item-desc">{{ aug.description }}</p>
              <span v-if="isAugOwned('weapon', aug.details)" class="tshop-owned-label">✓ Owned</span>
              <button
                v-else
                class="tshop-buy-btn"
                :disabled="playerGold < aug.cost"
                @click="$emit('buy-augment', aug); expandedId = null"
              >
                {{ aug.cost }}g — Buy
              </button>
            </div>
          </div>
        </div>

        <div class="tshop-group-label">🛡️ Defense</div>
        <div class="tshop-list">
          <div
            v-for="aug in defenseAugments"
            :key="aug.id"
            class="tshop-item"
            :class="{ 'tshop-owned': isAugOwned('defense', aug.details) }"
          >
            <div class="tshop-item-header" @click="toggle(aug.id)">
              <span class="tshop-item-name">{{ aug.name }}</span>
              <span v-if="isAugOwned('defense', aug.details)" class="tshop-check">✓</span>
              <span v-else class="tshop-chevron" :class="{ open: expandedId === aug.id }">›</span>
            </div>
            <div v-if="expandedId === aug.id" class="tshop-item-body">
              <p class="tshop-item-desc">{{ aug.description }}</p>
              <span v-if="isAugOwned('defense', aug.details)" class="tshop-owned-label">✓ Owned</span>
              <button
                v-else
                class="tshop-buy-btn"
                :disabled="playerGold < aug.cost"
                @click="$emit('buy-augment', aug); expandedId = null"
              >
                {{ aug.cost }}g — Buy
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="tshop-footer">
        <button class="tshop-close-btn" @click="$emit('close')">← Back to Tavern</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { shopItems } from "@/utils/shopItems";

const props = defineProps({
  campTier:               { type: Number, default: 0 },
  playerGold:             { type: Number, default: 0 },
  weaponAugment:          { type: String, default: "" },
  defenseAugment:         { type: String, default: "" },
  pendingWeaponAugments:  { type: Array,  default: () => [] },
  pendingDefenseAugments: { type: Array,  default: () => [] },
});

defineEmits(["close", "buy", "buy-augment"]);

const expandedId = ref(null);

const campItems = [
  { tier: 1, name: "Sleeping Bag",  cost: 50,  desc: "Long rests restore 25 HP and 1 class ability." },
  { tier: 2, name: "Pillow",        cost: 75,  desc: "Long rests restore 30 HP and 2 class abilities. Requires sleeping bag." },
  { tier: 3, name: "Tent",          cost: 100, desc: "Long rests restore 50 HP and 2 class abilities. Requires pillow." },
];

const weaponAugments  = shopItems.filter(i => i.effect === "weaponAugment");
const defenseAugments = shopItems.filter(i => i.effect === "defenseAugment");

function toggle(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

function isAugOwned(type, key) {
  if (type === "weapon") return props.weaponAugment === key || props.pendingWeaponAugments.includes(key);
  return props.defenseAugment === key || props.pendingDefenseAugments.includes(key);
}
</script>

<style scoped>
.tshop-overlay {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: 320px;
  display: flex;
  flex-direction: column;
  z-index: 1100;
  box-shadow: -10px 0 50px rgba(0,0,0,0.75);
  overflow: hidden;
  font-family: "IBM Plex Sans", sans-serif;
}

.tshop-modal {
  background: rgba(11, 11, 15, 0.98);
  border-left: 1px solid rgba(68, 70, 82, 0.4);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tshop-header {
  padding: 1.4rem 1.6rem 0.75rem;
  border-bottom: 1px solid rgba(62, 64, 76, 0.5);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.tshop-title {
  font-size: 11px;
  font-weight: 700;
  color: #848490;
  letter-spacing: 3px;
}

.tshop-gold {
  font-size: 12px;
  color: #c8a840;
}

.tshop-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.tshop-footer {
  flex-shrink: 0;
  padding: 0.75rem 1.2rem;
  border-top: 1px solid rgba(62, 64, 76, 0.35);
}

.tshop-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #c9a227;
  margin-top: 0.4rem;
  margin-bottom: 0.1rem;
}

.tshop-aug-hint {
  font-size: 0.65rem;
  color: #777;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}

.tshop-group-label {
  font-size: 0.68rem;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 0.2rem;
}

.tshop-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.tshop-item {
  overflow: hidden;
}

.tshop-item.tshop-locked {
  opacity: 0.35;
}

.tshop-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.8rem;
  cursor: pointer;
  user-select: none;
}

.tshop-item-header:hover .tshop-item-name {
  color: #d8d8e4;
}

.tshop-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #b8b8c4;
}

.tshop-item.tshop-owned .tshop-item-name {
  color: #6a9e6a;
}

.tshop-chevron {
  font-size: 18px;
  color: #505060;
  transition: transform 0.18s ease;
  flex-shrink: 0;
}

.tshop-chevron.open {
  transform: rotate(90deg);
  color: #8888a0;
}

.tshop-check {
  font-size: 12px;
  color: #4a7a4a;
  font-weight: 700;
  flex-shrink: 0;
}

.tshop-lock {
  font-size: 12px;
  flex-shrink: 0;
}

.tshop-item-body {
  padding: 0.5rem 0.8rem 0.7rem;
  border-top: 1px solid rgba(58, 60, 72, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tshop-item-desc {
  font-size: 11px;
  color: #787882;
  line-height: 1.45;
  margin: 0;
}

.tshop-owned-label {
  font-size: 11px;
  color: #4a7a4a;
  font-weight: 600;
}

.tshop-buy-btn {
  align-self: flex-start;
  background: rgba(20, 20, 28, 0.8);
  border: 1px solid rgba(68, 70, 85, 0.58);
  border-radius: 4px;
  color: #94949e;
  font-size: 12px;
  font-family: "IBM Plex Sans", sans-serif;
  font-weight: 600;
  padding: 5px 14px;
  cursor: pointer;
}

.tshop-buy-btn:hover:not(:disabled) {
  background: rgba(45, 45, 60, 0.55);
  border-color: rgba(115, 118, 140, 0.7);
  color: #c0c0d0;
}

.tshop-buy-btn:disabled {
  opacity: 0.28;
  cursor: not-allowed;
}

.tshop-close-btn {
  background: transparent;
  border: 1px solid rgba(65, 68, 82, 0.5);
  border-radius: 4px;
  color: #848490;
  font-size: 12px;
  font-family: "IBM Plex Sans", sans-serif;
  padding: 7px 14px;
  cursor: pointer;
}

.tshop-close-btn:hover {
  background: rgba(36, 36, 48, 0.45);
  color: #aaaab8;
}
</style>
