<template>
  <div class="shop-overlay">
    <div class="shop-modal">
      <div class="shop-desc">
        A mysterious merchant appears, ready to trade! You have {{ playerGold }} Gold Pieces.
      </div>
      <div class="shop-items">
        <button @click="buyItem('health')" :disabled="playerGold < 10">
          > Buy Potion of Healing (+15 HP) - 10 Gold
        </button>
        <button @click="buyItem('weapon')" :disabled="playerGold < 15">
          > Buy Whetstone (+1 Weapon Damage) - 15 Gold
        </button>
        <button @click="buyItem('shield')" :disabled="playerGold < 15">
          > Buy Sturdy Buckler (+1 Shield Bonus) - 15 Gold
        </button>
        <button @click="buyItem('special')" :disabled="playerGold < 20">
          > Buy Tome of Knowledge (+1 Class Ability Charge) - 20 Gold
        </button>
      </div>
      <button @click="$emit('close')">
        > No thanks, I'll save my gold.
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  playerGold: Number,
});

const emit = defineEmits(["buy", "close"]);

const shopItems = {
  health: { name: 'Potion of Healing', cost: 10, effect: 'health', amount: 15 },
  weapon: { name: 'Whetstone', cost: 15, effect: 'weapon', amount: 1 },
  shield: { name: 'Sturdy Buckler', cost: 15, effect: 'shield', amount: 1 },
  special: { name: 'Tome of Knowledge', cost: 20, effect: 'special', amount: 1 },
};

const buyItem = (itemType) => {
  const item = shopItems[itemType];
  if (item) {
    emit("buy", item);
  } else {
    console.error("Attempted to buy an unknown item type:", itemType);
  }
};

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
  animation: fade-in-overlay .75s ease-out forwards;
  background-image: linear-gradient(to bottom,
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
</style>