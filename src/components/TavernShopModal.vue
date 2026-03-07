<template>
  <div class="tshop-overlay" @click.self="$emit('close')">
    <div class="tshop-modal">
      <div class="tshop-title">The Lighthouse Tavern — Camp Supplies</div>
      <div class="tshop-gold">You have {{ playerGold }} Gold</div>

      <div class="tshop-items">
        <div
          v-for="item in items"
          :key="item.tier"
          class="tshop-item"
          :class="{
            'tshop-item-owned': campTier >= item.tier,
            'tshop-item-locked': item.tier > campTier + 1,
          }"
        >
          <div class="tshop-item-left">
            <div class="tshop-item-name">{{ item.name }}</div>
            <div class="tshop-item-desc">{{ item.desc }}</div>
          </div>
          <div class="tshop-item-right">
            <span v-if="campTier >= item.tier" class="tshop-owned">Owned</span>
            <span v-else-if="item.tier > campTier + 1" class="tshop-locked">Locked</span>
            <button
              v-else
              class="tshop-buy-btn"
              :disabled="playerGold < item.cost"
              @click="$emit('buy', item.tier)"
            >
              {{ item.cost }}g
            </button>
          </div>
        </div>
      </div>

      <button class="tshop-close-btn" @click="$emit('close')">← Back to Tavern</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  campTier: { type: Number, default: 0 },
  playerGold: { type: Number, default: 0 },
});

defineEmits(["close", "buy"]);

const items = [
  {
    tier: 1,
    name: "Sleeping Bag",
    cost: 50,
    desc: "Long rests restore 25 HP and 1 class ability.",
  },
  {
    tier: 2,
    name: "Pillow",
    cost: 75,
    desc: "Long rests restore 30 HP and 2 class abilities. Requires sleeping bag.",
  },
  {
    tier: 3,
    name: "Tent",
    cost: 100,
    desc: "Long rests restore 50 HP and 2 class abilities. Requires pillow.",
  },
];
</script>

<style scoped>
@import "./styles/tavernShopModalStyles.css";
</style>
