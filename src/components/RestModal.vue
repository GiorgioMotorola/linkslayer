<template>
  <div class="rest-overlay" v-if="props.showRestModal">
    <div class="rest-modal">
      <div class="rest-modal-phrase">{{ currentRestPhrase }}</div>

      <div class="rest-options">
        <button
          @click="handleRestChoice('short')"
          :disabled="props.shortRestsUsed >= 4"
        >
          Short Rest (+10 HP) ({{ 4 - props.shortRestsUsed }} left)
        </button>
        <button
          @click="handleRestChoice('long')"
          :disabled="props.longRestsUsed >= 2"
        >
          Long Rest (+20 HP, +1 Special) ({{ 2 - props.longRestsUsed }} left)
        </button>
        <button
          @click="handleAssemble('weapon')"
          :disabled="(props.weaponPieces || 0) < 2"
        >
          Assemble Weapon Upgrade (You have {{ props.weaponPieces || 0 }}. You
          need at least 2 pieces to upgrade.)
        </button>
        <button
          @click="handleAssemble('defense')"
          :disabled="(props.defensePieces || 0) < 2"
        >
          Assemble Defense Upgrade (You have {{ props.defensePieces || 0 }}. You
          need at least 2 pieces to upgrade.)
        </button>
        <button @click="handleRestChoice('continue')">Continue Journey</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from "vue";
import { getRandomRestPhrase } from "../utils/restPhrases.js";

const props = defineProps({
  showRestModal: Boolean,
  shortRestsUsed: Number,
  longRestsUsed: Number,
  weaponPieces: { type: Number, default: 0 },
  defensePieces: { type: Number, default: 0 },
});

const currentRestPhrase = ref("");

watch(
  () => props.showRestModal,
  (newValue) => {
    if (newValue) {
      currentRestPhrase.value = getRandomRestPhrase();
    }
  },
  { immediate: true }
);

const emit = defineEmits(["rest", "assemble-upgrade"]);

const handleRestChoice = (choice) => {
  emit("rest", choice);
};

const handleAssemble = (type) => {
  emit("assemble-upgrade", type);
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
  max-width: 700px;
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

.rest-modal-phrase {
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

.rest-modal-description,
.crafting-description {
  color: rgb(214, 215, 216);
  margin-bottom: 15px;
  line-height: 1.5;
  font-size: 17px;
}

.rest-options,
.crafting-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 20px;
}

.rest-modal-divider {
  border: 0;
  height: 1px;
  background-color: rgb(155, 152, 152);
  margin: 25px 0;
}

.crafting-title {
  color: rgb(214, 215, 216);
  margin-bottom: 15px;
  font-size: 20px;
  text-align: center;
}

.piece-count {
  font-weight: 400;
  color: #cacaca;
  margin-bottom: 15px;
  font-size: 20px;
}

.crafting-buttons button {
  background: rgba(0, 0, 0, 0.442);
}

.crafting-buttons button:hover {
  background-color: #c5c1c155;
}

.crafting-buttons button:nth-child(1) {
  background: rgba(75, 75, 75, 0.4);
}
.crafting-buttons button:nth-child(1):hover:not(:disabled) {
  background: rgba(75, 75, 75, 0.4);
}

.crafting-buttons button:nth-child(2) {
  background: rgba(75, 75, 75, 0.4);
}
.crafting-buttons button:nth-child(2):hover:not(:disabled) {
  background: rgba(75, 75, 75, 0.4);
}
</style>
