<template>
  <div class="shop-overlay">
    <div class="shop-content-game-style">
      <div class="shop-title">The Shop</div>
      <div class="shop-gold">You have {{ playerGold }} Gold</div>

      <div class="shop-items">
        <div
          v-for="item in props.shopItems"
          :key="item.id"
          class="shop-item"
          :class="{ 'shop-item-owned': item.isSpecialLoot }"
        >
          <div class="shop-item-left">
            <div class="shop-item-name">{{ item.name }}</div>
            <div class="shop-item-desc">{{ item.description }}</div>
          </div>
          <div class="shop-item-right">
            <span v-if="item.isSpecialLoot" class="shop-owned">Owned</span>
            <button
              v-else
              class="shop-buy-btn"
              :disabled="playerGold < item.cost"
              @click="buyItem(item)"
            >
              {{ item.cost }}g
            </button>
          </div>
        </div>
      </div>

      <div class="shop-footer">
        <button class="shop-close-btn" @click="$emit('open-backpack')">Backpack</button>
        <button class="shop-close-btn" @click="$emit('close')">← Done</button>
      </div>

      <transition name="toast-fade">
        <div
          v-if="toastMessage"
          class="toast-notification"
          :class="{ 'toast-error': isToastError }"
        >
          {{ toastMessage }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  playerGold: Number,
  shopItems: Array,
  weaponBonus: Number,
  shieldBonus: Number,
  specialUsesLeft: Number,
});

const emit = defineEmits(["buy", "close", "open-backpack"]);

const toastMessage = ref(null);
const isToastError = ref(false);
let toastTimeout = null;

const buyItem = (item) => {
  if (item.isSpecialLoot) {
    showToast(`You already acquired ${item.name}.`, true);
    return;
  }
  if (props.playerGold >= item.cost) {
    emit("buy", item);
    showToast(`Purchased ${item.name}.`);
  } else {
    showToast(`Not enough gold for ${item.name}.`, true);
  }
};

function showToast(message, isError = false) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastMessage.value = message;
  isToastError.value = isError;
  toastTimeout = setTimeout(() => {
    toastMessage.value = null;
    isToastError.value = false;
    toastTimeout = null;
  }, 3000);
}
</script>

<style scoped>
@import "./styles/shopModalStyles.css";
</style>
