<template>
  <div class="rest-overlay">
    <div class="rest-modal">
      <div class="rest-desc">
        The sky emits a gloam only owned by a finishing sunset. What do you do?
      </div>
      <button @click="$emit('rest', 'short')" :disabled="shortRestsUsed >= 4">
        > Short Rest (+5 HP)
      </button>
      <button @click="$emit('rest', 'long')" :disabled="longRestsUsed >= 2">
        > Long Rest (+10 HP)
      </button>
      <button @click="$emit('rest', 'continue')">> Continue On (0 HP)</button>
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
  background-color: rgba(10, 10, 10, 0);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  animation: fade-in-overlay 1s ease-out forwards;
  background-color: rgba(41, 47, 66, 0.904);
}
.rest-modal {
  background-color: rgb(228, 224, 224);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 800px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: pop-in 0.3s ease;
  z-index: 1000;
}

.rest-desc {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 18px;
  animation: npc-drop 0.5s ease-out forwards;
  color: rgb(7, 7, 7);
  border-bottom: 1px solid rgb(155, 152, 152);
  padding-bottom: 10px;
  margin-left: 100px;
  margin-right: 100px;
}

button {
  display: flex;
  flex-direction: column;
  border: none;
  background-color: rgb(228, 224, 224);
  font-size: 17px;
  margin-bottom: 0.3rem;
  color: #303030;
  font-weight: 400;
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
