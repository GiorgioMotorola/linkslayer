<template>
  <div class="rest-overlay">
    <div class="rest-modal">
      <div class="rest-desc">
        {{ restGreeting }}
      </div>
      <button @click="$emit('rest', 'short')" :disabled="shortRestsUsed >= 4">
        Take A Short Rest (+5 HP)
      </button>
      <button @click="$emit('rest', 'long')" :disabled="longRestsUsed >= 2">
        Take A Long Rest (+10 HP)
      </button>
      <button @click="$emit('rest', 'continue')">
        There is far too much ground to cover. I must continue on. (+0 HP)
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getRandomRestPhrase } from "@/utils/restPhrases";

const restGreeting = ref("");

onMounted(() => {
  restGreeting.value = getRandomRestPhrase();
});

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
  background: rgba(0, 0, 0, 0.342);
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
  border: #616060 1px solid;
}

.rest-desc {
  text-align: center;
  margin-bottom: 0rem;
  font-size: 22px;
  animation: npc-drop 0.5s ease-out forwards;
  color: rgb(7, 7, 7);
  border-bottom: 1px solid rgb(155, 152, 152);
  margin-left: 0px;
  margin-right: 0px;
  background: rgba(0, 0, 0, 0);
  color: rgb(214, 215, 216);
  padding-bottom: 2rem;
}

button {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  text-align: start;
  border: 1px solid #616060;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.342);
  padding: 0.8rem 1rem;
  font-size: 17px;
  color: #303030;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
  color: rgb(214, 215, 216);
}

button:hover {
  text-decoration: none;
  opacity: 0.6;
  background-color: #c5c1c144;
  color: #000000;
  border-color: #6e6e6e;
  font-weight: 500;
}

button:disabled {
  text-decoration-line: line-through;
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #c5c1c1;
  color: #777;
  border: 1px solid #616060;
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
