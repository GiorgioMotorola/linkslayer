<template>
  <div class="shop-overlay">
    <div class="shop-modal">
      <div class="shop-desc">
        A mysterious merchant appears, ready to trade! You have
        {{ playerGold }} Gold Pieces.
      </div>
      <div class="shop-items">
        <button @click="buyItem('health')" :disabled="playerGold < 15">
          > Buy Potion of Healing (+15 HP) - 15 Gold
        </button>
        <button @click="buyItem('weapon')" :disabled="playerGold < 20">
          > Buy Whetstone (+1 Weapon Damage) - 20 Gold
        </button>
        <button @click="buyItem('shield')" :disabled="playerGold < 20">
          > Buy Sturdy Buckler (+1 Shield Bonus) - 20 Gold
        </button>
        <button @click="buyItem('special')" :disabled="playerGold < 15">
          > Buy Tome of Knowledge (+1 Class Ability Charge) - 15 Gold
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
};

const toastMessage = ref(null);
const isToastError = ref(false);
let toastTimeout = null;

const buyItem = (itemType) => {
  const item = shopItems[itemType];
  if (!item) {
    console.error("Attempted to buy an unknown item type:", itemType);
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
  animation: fade-in-overlay 1.25s ease-out forwards;
  background-image: linear-gradient(
    to bottom,
    rgba(10, 50, 100, 0.9),
    rgba(50, 100, 150, 0.9),
    rgba(150, 200, 250, 0.6)
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
  text-align: start;
  border: none;
  background-color: rgb(197, 193, 193);
  font-size: 17px;
  color: #303030;
  font-weight: 400;
  padding: 0.5rem 0;
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
</style>
