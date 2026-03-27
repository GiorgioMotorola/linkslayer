<template>
  <div class="tshop-overlay" @click.self="$emit('close')">
    <div class="tshop-modal">
      <img :src="fenceImg" class="modal-banner-img" alt="" />
      <div class="tshop-header">
        <div class="tshop-title">THE FENCE</div>
        <div class="tshop-gold">{{ playerGold }} Gold</div>
      </div>

      <div class="tshop-body">
        <div class="tshop-section-label"><i class="ra ra-campfire"></i> Camp Supplies</div>
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
              <span v-else-if="item.tier > campTier + 1" class="tshop-lock"><i class="ra ra-locked-fortress"></i></span>
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

      </div>

        <div class="tshop-section-label"><i class="ra ra-castle-flag"></i> Land</div>
        <div class="tshop-list">
          <div
            class="tshop-item"
            :class="{ 'tshop-owned': props.hasSettlementFlag || props.hasSettlement }"
          >
            <div class="tshop-item-header" @click="toggle('settlement-flag')">
              <span class="tshop-item-name">Settlement Flag</span>
              <span v-if="props.hasSettlementFlag || props.hasSettlement" class="tshop-check">✓</span>
              <span v-else class="tshop-chevron" :class="{ open: expandedId === 'settlement-flag' }">›</span>
            </div>
            <div v-if="expandedId === 'settlement-flag'" class="tshop-item-body">
              <p class="tshop-item-desc">Plant this flag on any Wikipedia article to found your settlement there. Name your town and begin building. One per adventure.</p>
              <span v-if="props.hasSettlementFlag || props.hasSettlement" class="tshop-owned-label">✓ Owned</span>
              <button
                v-else
                class="tshop-buy-btn"
                :disabled="playerGold < 150"
                @click="$emit('buy-flag'); expandedId = null"
              >
                150g — Buy
              </button>
            </div>
          </div>
        </div>

        <div class="tshop-section-label"><i class="ra ra-sword"></i> Combat</div>
        <div class="tshop-list">
          <!-- Quick Hands Charm: always shown, owned once extraActions >= 1 -->
          <div
            class="tshop-item"
            :class="{ 'tshop-owned': extraActions >= 1 }"
          >
            <div class="tshop-item-header" @click="toggle('quick-hands')">
              <span class="tshop-item-name">Quick Hands Charm</span>
              <span v-if="extraActions >= 1" class="tshop-check">✓</span>
              <span v-else class="tshop-chevron" :class="{ open: expandedId === 'quick-hands' }">›</span>
            </div>
            <div v-if="expandedId === 'quick-hands'" class="tshop-item-body">
              <p class="tshop-item-desc">Grants 1 extra combat action per turn. Queue 2 attacks before the enemy responds.</p>
              <span v-if="extraActions >= 1" class="tshop-owned-label">✓ Owned</span>
              <button
                v-else
                class="tshop-buy-btn"
                :disabled="playerGold < 150"
                @click="$emit('buy-extra-action', 1); expandedId = null"
              >
                150g — Buy
              </button>
            </div>
          </div>
          <!-- Swift Strike Rune: only visible once Quick Hands is owned -->
          <div
            v-if="extraActions >= 1"
            class="tshop-item"
            :class="{ 'tshop-owned': extraActions >= 2 }"
          >
            <div class="tshop-item-header" @click="toggle('swift-strike')">
              <span class="tshop-item-name">Swift Strike Rune</span>
              <span v-if="extraActions >= 2" class="tshop-check">✓</span>
              <span v-else class="tshop-chevron" :class="{ open: expandedId === 'swift-strike' }">›</span>
            </div>
            <div v-if="expandedId === 'swift-strike'" class="tshop-item-body">
              <p class="tshop-item-desc">Upgrades Quick Hands. Grants 2 extra combat actions per turn for a total of 3.</p>
              <span v-if="extraActions >= 2" class="tshop-owned-label">✓ Owned</span>
              <button
                v-else
                class="tshop-buy-btn"
                :disabled="playerGold < 300"
                @click="$emit('buy-extra-action', 2); expandedId = null"
              >
                300g — Buy
              </button>
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

const fenceImg = new URL("../assets/fence-img.png", import.meta.url).href;

const props = defineProps({
  campTier:               { type: Number, default: 0 },
  playerGold:             { type: Number, default: 0 },
  hasSettlementFlag:      { type: Boolean, default: false },
  hasSettlement:          { type: Boolean, default: false },
  extraActions:           { type: Number, default: 0 },
});

defineEmits(["close", "buy", "buy-flag", "buy-extra-action"]);

const expandedId = ref(null);

const campItems = [
  { tier: 1, name: "Sleeping Bag",  cost: 50,  desc: "Long rests restore 25 HP and 1 class ability." },
  { tier: 2, name: "Pillow",        cost: 75,  desc: "Long rests restore 30 HP and 2 class abilities. Requires sleeping bag." },
  { tier: 3, name: "Tent",          cost: 100, desc: "Long rests restore 50 HP and 2 class abilities. Requires pillow." },
];

function toggle(id) {
  expandedId.value = expandedId.value === id ? null : id;
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

.modal-banner-img {
  display: block;
  width: 100%;
  height: 200px;
  object-fit: cover;
  flex-shrink: 0;
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
