<template>
  <div class="shop-overlay">
    <div class="shop-modal">
      <div class="shop-desc">
        BELETHOR: "Some may call these treasures. Me, I call them junk."
      </div>
      <div class="shop-items">
        <div class="player-gold">You have 
        {{ playerGold }} Gold</div>
        <button
          v-for="item in props.shopItems"
          :key="item.id"
          @click="buyItem(item)"
          :disabled="props.playerGold < item.cost"
        >
          <div class="item-header">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-cost">({{ item.cost }} Gold)</span>
          </div>

          <div class="item-description">
            <span v-if="item.effect === 'health'"
              >Restores {{ item.amount }} Health.</span
            >
            <span v-else-if="item.effect === 'weapon'">
              Increases Weapon Damage by {{ item.amount }}.
            </span>
            <span v-else-if="item.effect === 'shield'">
              Adds {{ item.amount }} Defense.
            </span>
            <span v-else-if="item.effect === 'special'">
              Grants {{ item.amount }} Class Ability Charge.
            </span>
            <span v-else-if="item.effect === 'inventoryItem'">
              <span v-if="item.details === 'compass'">
                Allows skipping to a random non-start/end article.
              </span>
              <span v-else-if="item.details === 'healthPotion'">
                A consumable potion that restores health.
              </span>
            </span>
            <span v-else-if="item.effect === 'blurCure'">
              Sober up instantly, clearing blur effects.
            </span>
            <span v-else>No description available.</span>
          </div>
        </button>
      </div>
      <button @click="$emit('close')">> Done Shopping</button>

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
});

const emit = defineEmits(["buy", "close"]);

const shopItems = {
  health: { name: "Potion of Healing", cost: 15, effect: "health", amount: 15 },
  weapon: { name: "Whetstone", cost: 20, effect: "weapon", amount: 1 },
  shield: { name: "Sturdy Buckler", cost: 20, effect: "shield", amount: 1 },
  special: {
    name: "Tome of Knowledge",
    cost: 15,
    effect: "special",
    amount: 1,
  },
  compass: {
    name: "Arcane Compass",
    cost: 1,
    effect: "route",
    details: "compass",
  },
};

const toastMessage = ref(null);
const isToastError = ref(false);
let toastTimeout = null;

const buyItem = (item) => {
  if (!item) {
    console.error("Attempted to buy an undefined item:", item);
    showToast("Error: Unknown item!", true);
    return;
  }

  if (props.playerGold >= item.cost) {
    emit("buy", item);
    showToast(`Purchased ${item.name}!`);
  } else {
    showToast(`Not enough gold for ${item.name}!`, true);
  }
};

function showToast(message, isError = false) {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

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
* {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
}

@keyframes fade-in-overlay {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.shop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  animation: fade-in-overlay 0.75s ease-out forwards;
  background-color: #545b63a6;
    background-image: linear-gradient(
    to bottom,
    rgba(8, 12, 17, 0.9),
    rgba(17, 27, 37, 0.9),
    rgba(13, 19, 26, 0.6)
  );
}
.shop-modal {
  background-color: rgb(197, 193, 193);
  padding: 2rem;
  border-radius: 12px;
  text-align: start;
  max-width: 650px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(37, 37, 37, 0.671);
  animation: pop-in 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

.player-gold {
  font-size: 14px;
  padding: .5rem;
  color: #000000;
  font-weight: 300;
  margin-bottom: .3rem;
}

.shop-desc {
  text-align: center;
  font-size: 18px;
  animation: npc-drop 0.5s ease-out forwards;
  color: rgb(7, 7, 7);
  border-bottom: 1px solid rgb(155, 152, 152);
  padding-bottom: 15px;
  background-color: rgb(197, 193, 193);
}

.shop-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

button {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  text-align: start;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #c5c1c1;
  padding: 0.8rem 1rem;
  font-size: 17px;
  color: #303030;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
}

button:hover {
  background-color: #e0e0e0;
  border-color: #999;
  color: rgb(28, 128, 158);
}

button:disabled {
  text-decoration: none;
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #c5c1c1;
  color: #777;
  border-color: #ddd;
}

button:disabled:hover {
  color: #0e0d0d;
  cursor: not-allowed;
  background-color: #eee;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 5px;
}

.item-name {
  font-weight: 600;
  color: #000;
  font-size: 1.1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.item-cost {
  font-size: 0.9em;
  color: #000000;
  white-space: nowrap;
  margin-left: 10px;
  flex-shrink: 0;
}

.item-description {
  font-size: 0.9em;
  color: #666;
  text-align: start;
  line-height: 1.4;
  width: 100%;
}

button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
}

button:disabled {
  text-decoration: line-through;
  opacity: 0.5;
  cursor: not-allowed;
  color: #777;
}

button:disabled:hover {
  color: #777;
  cursor: not-allowed;
}

@keyframes pop-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.toast-notification {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 0.95em;
  font-weight: bold;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
}

.toast-notification.toast-error {
  background-color: rgba(189, 58, 58, 0.9);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

.shop-items button {
  padding: 8px 12px;
}
.item-name {
  font-size: 1em;
}
.item-cost,
.item-description {
  font-size: 0.85em;
}
</style>
