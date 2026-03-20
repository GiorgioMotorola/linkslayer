<template>
  <div class="shop-overlay" @click.self="$emit('close')">
    <div class="shop-modal">

      <div class="shop-header">
        <div class="shop-title">TAVERN — {{ props.townName }}</div>
        <div class="shop-gold">{{ props.playerGold }} Gold</div>
        <transition name="toast-fade">
          <div v-if="toastMessage" class="toast" :class="{ 'toast-error': isToastError }">{{ toastMessage }}</div>
        </transition>
      </div>

      <div class="shop-body">
        <div v-if="!props.beers?.length" class="tavern-empty">No beer on tap right now.</div>
        <div v-else class="shop-list">
          <div v-for="(beer, idx) in props.beers" :key="idx" class="shop-item">
            <div class="shop-item-header" @click="toggle(idx)">
              <span class="shop-item-name">{{ beer.name }}</span>
              <span class="shop-item-price">{{ beer.sellPrice }}g</span>
              <span class="shop-chevron" :class="{ open: expandedIdx === idx }">›</span>
            </div>
            <div v-if="expandedIdx === idx" class="shop-item-body">
              <p class="shop-item-desc">
                <span :style="{ color: qualityColor(beer.quality) }">{{ beer.quality }}</span>
                · ❤️ {{ beer.hp }} HP per bottle · ×{{ beer.qty }} available
                <template v-if="beer.poisonClicks > 0"><br><span class="tavern-poison">☠ Caution: swill (poisons for {{ beer.poisonClicks }} clicks)</span></template>
              </p>
              <button
                class="shop-buy-btn"
                :disabled="props.playerGold < beer.sellPrice"
                @click="buy(idx)"
              >{{ beer.sellPrice }}g — Buy one</button>
            </div>
          </div>
        </div>
      </div>

      <div class="shop-footer">
        <button class="shop-close-btn" @click="$emit('close')">← Leave Tavern</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  beers:      { type: Array,  default: () => [] },
  playerGold: { type: Number, default: 0 },
  townName:   { type: String, default: "Tavern" },
});

const emit = defineEmits(["buy", "close"]);

const expandedIdx  = ref(null);
const toastMessage = ref(null);
const isToastError = ref(false);
let toastTimeout = null;

function toggle(idx) {
  expandedIdx.value = expandedIdx.value === idx ? null : idx;
}

function buy(idx) {
  const beer = props.beers[idx];
  if (!beer || props.playerGold < beer.sellPrice) {
    showToast("Not enough gold.", true);
    return;
  }
  emit("buy", { beer, idx });
  showToast(`Bought one ${beer.name}!`);
}

function showToast(msg, isError = false) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastMessage.value = msg;
  isToastError.value = isError;
  toastTimeout = setTimeout(() => { toastMessage.value = null; }, 3000);
}

const QUALITY_COLORS = {
  "Rough": "#c0392b", "Decent": "#e67e22", "Perfect": "#27ae60",
  "Over-Fermented": "#8e44ad", "Swill": "#555",
};
function qualityColor(label) { return QUALITY_COLORS[label] ?? "#999"; }
</script>

<style scoped>
/* Matches ShopModal styling */
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
  position: relative;
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

.tavern-empty {
  font-size: 12px;
  color: #505060;
  font-style: italic;
  margin-top: 1rem;
}

.shop-list { display: flex; flex-direction: column; gap: 0.35rem; }

.shop-item {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(62, 64, 76, 0.35);
  border-radius: 5px;
  overflow: hidden;
}

.shop-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.55rem 0.8rem;
  cursor: pointer;
  user-select: none;
}

.shop-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #b8b8c4;
  flex: 1;
}

.shop-item-price {
  font-size: 12px;
  color: #c8a840;
}

.shop-chevron {
  font-size: 18px;
  color: #505060;
  transition: transform 0.18s ease;
}
.shop-chevron.open { transform: rotate(90deg); color: #8888a0; }

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
  line-height: 1.5;
  margin: 0;
}

.tavern-poison { color: #c0392b; }

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
  font-family: inherit;
}
.shop-buy-btn:disabled { opacity: 0.28; cursor: not-allowed; }
.shop-buy-btn:hover:not(:disabled) { background: rgba(40, 40, 52, 0.9); color: #c8c8d4; }

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
  font-family: inherit;
}

.toast {
  position: absolute;
  top: 10px; right: 10px;
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
