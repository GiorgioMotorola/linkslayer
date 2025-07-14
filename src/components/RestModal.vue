<template>
  <div class="rest-overlay">
    <div class="rest-modal">
      <div class="rest-desc">
        The sky emits a gloam only owned by a finishing sunset. What do you do?
        🌙
      </div>
      <button @click="$emit('rest', 'short')" :disabled="shortRestsUsed >= 4">
        > You find a good leaning tree, eat an apple and take a load off for a
        bit before continuing on (gain +5 HP)
      </button>
      <button @click="$emit('rest', 'long')" :disabled="longRestsUsed >= 2">
        > You build a fire, set up your tent and watch the chicken leg drip into
        the fire before a proper rest. (gain +10 HP)
      </button>
      <button @click="$emit('rest', 'continue')">
        > There is far too much ground to cover. I must continue on. (0 HP)
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps(["shortRestsUsed", "longRestsUsed"]);
defineEmits(["rest"]);
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

.rest-overlay {
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
    rgba(8, 12, 17, 0.9),
    rgba(17, 27, 37, 0.9),
    rgba(13, 19, 26, 0.6)
  );
}
.rest-modal {
  background-color: rgb(197, 193, 193);
  padding: 2rem;
  border-radius: 12px;
  text-align: start;
  max-width: 650px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(37, 37, 37, 0.671);
  animation: pop-in 0.3s ease;
  z-index: 1000;
}

.rest-desc {
  text-align: center;
  margin-bottom: 0rem;
  font-size: 18px;
  animation: npc-drop 0.5s ease-out forwards;
  color: rgb(7, 7, 7);
  border-bottom: 1px solid rgb(155, 152, 152);
  padding-bottom: 15px;
  margin-left: 0px;
  margin-right: 0px;
  background-color: rgb(197, 193, 193);
}

button {
  display: flex;
  flex-direction: column;
  justify-content: start;
  text-align: start;
  border: none;
  background-color: rgb(197, 193, 193);
  font-size: 17px;
  margin-bottom: 0.5rem;
  color: #303030;
  font-weight: 400;
  margin-top: 0.5rem;
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
