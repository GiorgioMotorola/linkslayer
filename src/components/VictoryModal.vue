<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="nice-dude">Victory &#127881;</div>
      <div class="summary-details">
        <div class="detail-item">
          <span class="label">Total Clicks:</span>
          <span class="value">{{ clicks }}</span>
        </div>
        <div class="detail-item" v-if="shortcutsUsed > 0">
          <span class="label">Shortcuts Used:</span>
          <span class="value">{{ shortcutsUsed }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Time:</span>
          <span class="value">{{ timer }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Combat Encounters:</span>
          <span class="value">{{ combatEncountersFought }}</span>
        </div>
        <div class="detail-item">
          <span class="label">HP Remaining:</span>
          <span class="value">{{ playerHP }}</span>
        </div>
        <div class="detail-item" v-if="weaponBonus > 0">
          <span class="label">Weapon Bonus:</span>
          <span class="value">+{{ weaponBonus }}</span>
        </div>
        <div class="detail-item" v-if="shieldBonus > 0">
          <span class="label">Shield Bonus:</span>
          <span class="value">+{{ shieldBonus }}</span>
        </div>
        <div class="detail-item" v-if="totalSpecialsUsed > 0">
          <span class="label">Specials Used:</span>
          <span class="value">{{ totalSpecialsUsed }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Long Rests Used:</span>
          <span class="value">{{ longRestsUsed }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Short Rests Used:</span>
          <span class="value">{{ shortRestsUsed }}</span>
        </div>
      </div>

      <button @click="share">Share Results</button>
      <button @click="$emit('close')">Play Again</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps([
  "clicks",
  "path",
  "timer",
  "targets",
  "shortcutsUsed",
  "combatEncountersFought",
  "playerHP",
  "weaponBonus",
  "totalSpecialsUsed",
  "longRestsUsed",
  "shortRestsUsed",
  "shieldBonus",
]);

const emit = defineEmits(["close"]);

const formattedPath = computed(() =>
  props.path.map((step) => step.replaceAll("_", " "))
);

const share = () => {
  const summaryText =
    `🗺️ Victory 🗺️\n` +
    `Clicks: ${props.clicks}\n` +
    (props.shortcutsUsed > 0
      ? `Shortcuts Used: ${props.shortcutsUsed}\n`
      : "") +
    `Time: ${props.timer}\n` +
    `Combat Fought: ${props.combatEncountersFought}\n` +
    `HP Remaining: ${props.playerHP}\n` +
    (props.weaponBonus > 0 ? `Weapon Bonus: +${props.weaponBonus}\n` : "") +
    +(props.shieldBonus > 0 ? `Shield Bonus: +${props.shieldBonus}\n` : "") +
    (props.totalSpecialsUsed > 0
      ? `Specials Used: ${props.totalSpecialsUsed}\n`
      : "") +
    `Rests (L/S): ${props.longRestsUsed}/${props.shortRestsUsed}\n` +
    `https://example.com`;

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(summaryText)
      .then(() => {
        alert("Results copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy results. Please try again.");
      });
  } else {
    alert("Clipboard not supported in this browser.");
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0vh;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: pop-in 0.3s ease;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 1rem;
}

.results-path {
  font-size: 12px;
  background: #f0f0f0;
  padding: 0.4rem;
  border-radius: 4px;
  text-align: center;
}

button {
  margin: 1rem 0;
  padding: 0.6rem 1.2rem;
  font-size: 14px;
  border: none;
  background: #4a8096;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 0.5rem;
}

.nice-dude {
  font-size: 30px;
  margin-bottom: 2rem;
}

.total-clicks {
  font-size: 17px;
}

.timer {
  font-size: 15px;
}

button:hover {
  background: #45a047;
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

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.nice-dude {
  font-size: 30px;
  margin-bottom: 1.5rem;
  font-weight: bold;
  color: #28a745;
}

.summary-details {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
  padding: 0 1rem;
  font-size: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0;
  border-bottom: 1px dashed #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #333;
}

.value {
  color: #007bff;
  font-weight: 500;
}

button {
  margin-top: 1.5rem;
  padding: 0.7rem 1.5rem;
  font-size: 16px;
  min-width: 120px;
  transition: background 0.3s ease;
}

button:last-of-type {
  margin-left: 1rem;
}

button.share-button {
  background: #007bff;
}

button.share-button:hover {
  background: #0056b3;
}

button.play-again-button {
  background: #28a745;
}

button.play-again-button:hover {
  background: #218838;
}

@media screen and (max-width: 600px) {
  .modal-content {
    padding: 1.5rem;
    gap: 0.6rem;
  }
  .nice-dude {
    font-size: 24px;
    margin-bottom: 1rem;
  }
  .summary-details {
    font-size: 14px;
    padding: 0 0.5rem;
  }
  button {
    padding: 0.5rem 1rem;
    font-size: 14px;
    min-width: 100px;
  }
  button:last-of-type {
    margin-left: 0.5rem;
  }
}
</style>
