<template>
  <div class="shop-overlay">
    <div class="shop-panel">
      <div class="shop-header">
        <div class="shop-title">THE SHOP</div>
        <div class="shop-gold">You have {{ playerGold }} Gold</div>
        <transition name="toast-fade">
          <div v-if="toastMessage" class="toast" :class="{ 'toast-error': isToastError }">
            {{ toastMessage }}
          </div>
        </transition>
        <div class="shop-btns">
          <button class="shop-btn" @click="$emit('open-backpack')">Backpack</button>
          <button class="shop-btn" @click="$emit('close')">← Done</button>
        </div>
      </div>

      <div class="shop-list">
        <div
          v-for="item in props.shopItems"
          :key="item.id"
          class="shop-item"
          :class="{ owned: item.isSpecialLoot }"
        >
          <div class="shop-item-name" @click="toggle(item.id)">{{ item.name }}</div>
          <div v-if="expandedId === item.id" class="shop-item-body">
            <p class="shop-item-desc">{{ item.description }}</p>
            <span v-if="item.isSpecialLoot" class="shop-owned-label">Owned</span>
            <button
              v-else
              class="shop-buy-btn"
              :disabled="playerGold < item.cost"
              @click="buyItem(item)"
            >
              {{ item.cost }}g — Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import "./styles/shopModalStyles.css";

const props = defineProps({
  playerGold: Number,
  shopItems: Array,
  weaponBonus: Number,
  shieldBonus: Number,
  specialUsesLeft: Number,
});

const emit = defineEmits(["buy", "close", "open-backpack"]);

const expandedId = ref(null);
const toastMessage = ref(null);
const isToastError = ref(false);
let toastTimeout = null;

function toggle(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

function buyItem(item) {
  if (item.isSpecialLoot) { showToast(`You already acquired ${item.name}.`, true); return; }
  if (props.playerGold >= item.cost) {
    emit("buy", item);
    showToast(`Purchased ${item.name}.`);
    // expandedId.value = null;
  } else {
    showToast(`Not enough gold for ${item.name}.`, true);
  }
}

function showToast(message, isError = false) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastMessage.value = message;
  isToastError.value = isError;
  toastTimeout = setTimeout(() => { toastMessage.value = null; toastTimeout = null; }, 3000);
}
</script>

<style scoped>
body {
  font-family: "Roboto", sans-serif;
  font-optical-sizing: auto;
}
</style>
