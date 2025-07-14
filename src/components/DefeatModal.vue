<template>
  <div class="game-modal-overlay">
    <div class="game-modal-content">
      <div class="modal-title">You Died ☠️</div>
      <div class="summary-details">
        <div class="detail-item">
          <span class="label">Total Clicks:&nbsp;</span>
          <span class="value">{{ clicks }}</span>
        </div>
        <div class="detail-item">
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
          <span class="label">Defense Bonus:&nbsp;</span>
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
        <button @click="copyLogToClipboard" class="log-copy">> Copy Log</button>
        <button @click="$emit('close')">> Play Again</button>
      </div>
    </div>
    <div id="defeat-notification-banner" class="notification-banner">
      <span id="defeat-notification-message"></span>
      <button class="close-button" @click="hideNotification">×</button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick } from "vue";

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
  "gameLog",
]);

const emit = defineEmits(["close"]);

const formattedPath = computed(() =>
  props.path.map((step) => step.replaceAll("_", " "))
);

const share = () => {
  const summaryText =
    `☠️ Death ☠️\n` +
    `Clicks: ${props.clicks}\n` +
    (props.shortcutsUsed > 0
      ? `Shortcuts Used: ${props.shortcutsUsed}\n`
      : "") +
    `Time: ${props.timer}\n` +
    `Combat Fought: ${props.combatEncountersFought}\n` +
    `HP Remaining: ${props.playerHP}\n` +
    (props.weaponBonus > 0 ? `Weapon Bonus: +${props.weaponBonus}\n` : "") +
    (props.shieldBonus > 0 ? `Defense Bonus: +${props.shieldBonus}\n` : "") +
    (props.totalSpecialsUsed > 0
      ? `Specials Used: ${props.totalSpecialsUsed}\n`
      : "") +
    `Rests Used(L/S): ${props.longRestsUsed}/${props.shortRestsUsed}\n` +
    `https://example.com`;

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(summaryText)
      .then(() => {
        showAlertAsBanner("Results copied to clipboard!", "success");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        showAlertAsBanner("Failed to copy results. Please try again.");
      });
  } else {
    showAlertAsBanner("Clipboard not supported in this browser.");
  }
};
function copyLogToClipboard() {
  const rawLog = props.gameLog
    .map((entry) => entry.text.replace(/<[^>]*>/g, ""))
    .join("\n");

  navigator.clipboard
    .writeText(rawLog)
    .then(() => showAlertAsBanner("Game log copied to clipboard!", "success"))
    .catch((err) => {
      console.error("Failed to copy log:", err);
      showAlertAsBanner("Failed to copy log. Please try again.", "error");
    });
}

let notificationTimeoutId = null;

async function showAlertAsBanner(message, type = "info", duration = 3000) {
  await nextTick();

  const banner = document.getElementById("defeat-notification-banner");
  const messageSpan = document.getElementById("defeat-notification-message");

  if (!banner || !messageSpan) {
    console.error(
      "Defeat Modal: Notification banner elements not found in the DOM."
    );
    showAlertAsBanner(message);
    return;
  }

  banner.className = "notification-banner";
  banner.classList.add(type);

  messageSpan.textContent = message;
  banner.classList.add("show");

  if (notificationTimeoutId) {
    clearTimeout(notificationTimeoutId);
  }

  notificationTimeoutId = setTimeout(() => {
    hideNotification();
  }, duration);
}

function hideNotification() {
  const banner = document.getElementById("defeat-notification-banner");
  if (banner) {
    banner.classList.remove("show");
    if (notificationTimeoutId) {
      clearTimeout(notificationTimeoutId);
      notificationTimeoutId = null;
    }
  }
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
  background-color: rgb(32, 32, 32);
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
  color: #c02020;
  border-bottom: 1px solid rgb(155, 152, 152);
  padding-bottom: 15px;
  width: 100%;
  background-color: rgb(32, 32, 32);
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
  color: #c7c6c6;
}

.value {
  color: #8d8d8d;
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
  background-color: rgb(32, 32, 32);
  font-size: 17px;
  margin-bottom: 0.5rem;
  color: #c7c6c6;
  font-weight: 400;
  margin-top: 0.5rem;
  width: auto;
  padding: 0;
}

.modal-buttons button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
}

.notification-banner {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #dc3545;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  display: none;
  opacity: 0;
  transition: opacity 0.5s ease-in-out, top 0.5s ease-in-out;
  min-width: 250px;
  max-width: 90%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notification-banner.show {
  display: flex;
  opacity: 1;
  top: 20px;
}

.notification-banner .close-button {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  margin-left: 15px;
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
