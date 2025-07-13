<template>
  <div class="game-modal-overlay">
    <div class="game-modal-content">
      <div class="modal-title">You Won 👍</div>
      <div class="summary-details">
        <div class="detail-item">
          <span class="label">Total Clicks:&nbsp;</span>
          <span class="value">{{ clicks }}</span>
        </div>
        <div class="detail-item" v-if="shortcutsUsed > 0">
          <span class="label">Shortcuts Used:&nbsp;</span>
          <span class="value">{{ shortcutsUsed }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Time:&nbsp;</span>
          <span class="value">{{ timer }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Combat Encounters:&nbsp;</span>
          <span class="value">{{ combatEncountersFought }}</span>
        </div>
        <div class="detail-item">
          <span class="label">HP Remaining:&nbsp;</span>
          <span class="value">{{ playerHP }}</span>
        </div>
        <div class="detail-item" v-if="weaponBonus > 0">
          <span class="label">Weapon Bonus:&nbsp;</span>
          <span class="value">+{{ weaponBonus }}</span>
        </div>
        <div class="detail-item" v-if="shieldBonus > 0">
          <span class="label">Shield Bonus:&nbsp;</span>
          <span class="value">+{{ shieldBonus }}</span>
        </div>
        <div class="detail-item" v-if="totalSpecialsUsed > 0">
          <span class="label">Specials Used:&nbsp;</span>
          <span class="value">{{ totalSpecialsUsed }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Long Rests Used:&nbsp;</span>
          <span class="value">{{ longRestsUsed }}</span>
        </div>
        <div class="detail-item">
          <span class="label">Short Rests Used:&nbsp;</span>
          <span class="value">{{ shortRestsUsed }}</span>
        </div>
      </div>

      <div class="modal-buttons">
        <button @click="share">> Share Results</button>
        <button @click="$emit('close')">> Play Again</button>
      </div>
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
    `👍 VICTORY 👍\n` +
    `Clicks: ${props.clicks}\n` +
    (props.shortcutsUsed > 0
      ? `Shortcuts Used: ${props.shortcutsUsed}\n`
      : "") +
    `Time: ${props.timer}\n` +
    `Combat Fought: ${props.combatEncountersFought}\n` +
    `HP Remaining: ${props.playerHP}\n` +
    (props.weaponBonus > 0 ? `Weapon Bonus: +${props.weaponBonus}\n` : "") +
    (props.shieldBonus > 0 ? `Shield Bonus: +${props.shieldBonus}\n` : "") +
    (props.totalSpecialsUsed > 0
      ? `Specials Used: ${props.totalSpecialsUsed}\n`
      : "") +
    `Rests Used (L/S): ${props.longRestsUsed}/${props.shortRestsUsed}\n` +
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
.game-modal-overlay {
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
}

.game-modal-content {
  background-color: rgb(219, 216, 216);
  padding: 2rem;
  border-radius: 12px;
  text-align: start;
  max-width: 300px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(37, 37, 37, 0.671);
  animation: pop-in 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.modal-title {
  text-align: center;
  margin-bottom: 0rem;
  font-size: 28px;
  animation: npc-drop 0.5s ease-out forwards;
  color: #2080c0;
  border-bottom: 1px solid rgb(155, 152, 152);
  padding-bottom: 15px;
  width: 100%;
  background-color: rgb(219, 216, 216);
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
  justify-content: center;
  padding: 0.3rem 0;
  color: #303030;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #0a0a0a;
}

.value {
  color: #424242;
  font-weight: 500;
}

.modal-buttons {
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: flex-start;
  margin-top: 1rem;
}

.modal-buttons button {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  text-align: start;
  border: none;
  background-color: rgb(219, 216, 216);
  font-size: 17px;
  margin-bottom: 0.5rem;
  color: #0a0a0a;
  font-weight: 400;
  margin-top: 0.5rem;
  width: auto;
  padding: 0;
}

.modal-buttons button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
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

@keyframes npc-drop {
  0% {
    opacity: 0;
    transform: translateX(-150px);
  }
  60% {
    opacity: 1;
    transform: translateX(10px);
  }
  80% {
    transform: translateX(-5px);
  }
  100% {
    transform: translateX(0);
  }
}

@media screen and (max-width: 600px) {
  .game-modal-content {
    padding: 1.5rem;
    gap: 0.6rem;
  }
  .modal-title {
    font-size: 24px;
    margin-bottom: 1rem;
  }
  .summary-details {
    font-size: 14px;
    padding: 0 0.5rem;
  }
  .modal-buttons button {
    padding: 0;
    font-size: 14px;
  }
}
</style>
