<template>
  <div class="shop-overlay" @click.self="$emit('close')">
    <div class="shop-modal">
      
      <div class="shop-header">
        <div class="shop-title">THE SHOP</div>
        <div class="shop-gold">{{ playerGold }} Gold</div>
        
        <transition name="toast-fade">
          <div v-if="toastMessage" class="toast" :class="{ 'toast-error': isToastError }">
            {{ toastMessage }}
          </div>
        </transition>

        <div class="shop-btns-container"> <button class="shop-buy-btn" @click="$emit('open-backpack')">Backpack</button>
        </div>
      </div>

      <div class="shop-body">
        <div class="shop-list">
          <div
            v-for="item in props.shopItems"
            :key="item.id"
            class="shop-item"
            :class="{ 'shop-owned': item.isSpecialLoot }"
          >
            <div class="shop-item-header" @click="toggle(item.id)">
              <span class="shop-item-name">{{ item.name }}</span>
              <span v-if="item.isSpecialLoot" class="shop-check">✓</span>
              <span v-else class="shop-chevron" :class="{ open: expandedId === item.id }">›</span>
            </div>

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

      <div class="shop-footer">
        <button class="shop-close-btn" @click="$emit('close')">← Done</button>
      </div>

    </div>
  </div>
</template>
<script setup>
import { ref } from "vue";
// import "./styles/shopModalStyles.css";

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
/* Copy-pasted from TavernShopModal */
.shop-overlay {
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

.shop-modal {
  background: rgba(11, 11, 15, 0.98);
  border-left: 1px solid rgba(68, 70, 82, 0.4);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shop-header {
  padding: 1.4rem 1.6rem 0.75rem;
  border-bottom: 1px solid rgba(62, 64, 76, 0.5);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  position: relative; /* For toast positioning */
}

.shop-title {
  font-size: 11px;
  font-weight: 700;
  color: #848490;
  letter-spacing: 3px;
}

.shop-gold {
  font-size: 12px;
  color: #c8a840;
}

.shop-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.shop-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.shop-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.8rem;
  cursor: pointer;
  user-select: none;
}

.shop-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #b8b8c4;
}

.shop-item.shop-owned .shop-item-name {
  color: #6a9e6a;
}

.shop-chevron {
  font-size: 18px;
  color: #505060;
  transition: transform 0.18s ease;
}

.shop-chevron.open {
  transform: rotate(90deg);
  color: #8888a0;
}

.shop-check {
  font-size: 12px;
  color: #4a7a4a;
  font-weight: 700;
}

.shop-item-body {
  padding: 0.5rem 0.8rem 0.7rem;
  border-top: 1px solid rgba(58, 60, 72, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.shop-item-desc {
  font-size: 11px;
  color: #787882;
  line-height: 1.45;
  margin: 0;
}

.shop-buy-btn {
  align-self: flex-start;
  background: rgba(20, 20, 28, 0.8);
  border: 1px solid rgba(68, 70, 85, 0.58);
  border-radius: 4px;
  color: #94949e;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  cursor: pointer;
}

.shop-buy-btn:disabled {
  opacity: 0.28;
  cursor: not-allowed;
}

.shop-footer {
  flex-shrink: 0;
  padding: 0.75rem 1.2rem;
  border-top: 1px solid rgba(62, 64, 76, 0.35);
}

.shop-close-btn {
  background: transparent;
  border: 1px solid rgba(65, 68, 82, 0.5);
  border-radius: 4px;
  color: #848490;
  font-size: 12px;
  padding: 7px 14px;
  cursor: pointer;
}

/* --- Keep your Toast Styles below --- */
.toast {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #2e7d32;
  color: white;
  padding: 4px 8px;
  font-size: 10px;
  border-radius: 4px;
}
.toast-error { background: #c62828; }
.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity 0.3s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; }
</style>