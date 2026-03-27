<template>
  <div class="game-modal-overlay">
    <div class="game-modal-content">

      <div class="modal-icon"><i class="ra ra-trophy ra-3x"></i></div>

      <div class="modal-title">Victory!</div>

      <div class="modal-identity">
        <span class="identity-name">{{ playerName }}</span>
        <span class="identity-sep"> the </span>
        <span class="identity-class">{{ playerClass?.name ?? 'Adventurer' }}</span>
      </div>

      <div v-if="lastBattle?.enemyName || lastBattle?.article" class="modal-battle-summary">
        <span class="battle-player">{{ playerName }}</span>
        <span class="battle-verb"> slayed the </span>
        <span class="battle-article">{{ lastBattle.article }}</span>
        <span v-if="lastBattle.enemyName" class="battle-enemy">&nbsp;{{ lastBattle.enemyName }}</span>
      </div>

      <div v-if="playerGoal" class="modal-goal">"{{ playerGoal }}"</div>

      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-label">Time</div>
          <div class="hero-stat-value">{{ timer }}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">HP Remaining</div>
          <div class="hero-stat-value hp-value">{{ playerHP }}</div>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-cell">
          <div class="stat-cell-label">Days</div>
          <div class="stat-cell-value">{{ daysCount }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Clicks</div>
          <div class="stat-cell-value">{{ clicks }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Enemies Killed</div>
          <div class="stat-cell-value">{{ enemiesKilled }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Encounters</div>
          <div class="stat-cell-value">{{ combatEncountersFought }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Gold Spent</div>
          <div class="stat-cell-value">{{ goldSpent }}g</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Gold Remaining</div>
          <div class="stat-cell-value">{{ playerGold }}g</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Weapon Bonus</div>
          <div class="stat-cell-value">+{{ weaponBonus }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Defense Bonus</div>
          <div class="stat-cell-value">+{{ shieldBonus }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Special Tier</div>
          <div class="stat-cell-value">T{{ specialTier ?? 1 }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Specials Used</div>
          <div class="stat-cell-value">{{ specialsUsed }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Short Rests</div>
          <div class="stat-cell-value">{{ shortRestsUsed }}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Long Rests</div>
          <div class="stat-cell-value">{{ longRestsUsed }}</div>
        </div>
      </div>

      <div class="modal-site-link">
        <a href="https://linkslayer.org/" target="_blank" rel="noopener">linkslayer.org</a>
      </div>

      <div class="modal-buttons">
        <button @click="share" class="modal-btn">⬆ Share Results</button>
        <button @click="copyLogToClipboard" class="modal-btn"><i class="ra ra-scroll-unfurled"></i> Copy Log</button>
        <button @click="handleRestart" class="modal-btn modal-btn-primary">↩ Play Again</button>
      </div>

    </div>
    <div id="victory-notification-banner" class="notification-banner">
      <span id="victory-notification-message"></span>
      <button class="close-button" @click="hideNotification">×</button>
    </div>
  </div>
</template>

<script setup>
import { nextTick } from "vue";

const props = defineProps({
  clicks: Number,
  daysCount: { type: Number, default: 1 },
  path: Array,
  timer: String,
  targets: Array,
  combatEncountersFought: Number,
  enemiesKilled: Number,
  playerHP: Number,
  weaponBonus: Number,
  shieldBonus: Number,
  specialsUsed: Number,
  longRestsUsed: Number,
  shortRestsUsed: Number,
  playerName: String,
  playerClass: Object,
  playerGoal: String,
  playerGold: Number,
  goldSpent: Number,
  specialTier: Number,
  gameLog: Array,
  lastBattle: { type: Object, default: () => ({ enemyName: '', article: '' }) },
});

const emit = defineEmits(["close", "restart"]);

const share = () => {
  const slayed = props.lastBattle?.article
    ? `${props.lastBattle.article}${props.lastBattle.enemyName ? ' ' + props.lastBattle.enemyName : ''}`
    : '';
  const summaryText =
    `🏆 VICTORY — ${props.playerName} the ${props.playerClass?.name ?? 'Adventurer'}\n` +
    (slayed ? `Slayed: ${slayed}\n` : "") +
    (props.playerGoal ? `Goal: "${props.playerGoal}"\n` : "") +
    `\n` +
    `Time: ${props.timer}\n` +
    `HP Remaining: ${props.playerHP}\n` +
    `Days: ${props.daysCount}\n` +
    `Clicks: ${props.clicks}\n` +
    `Enemies Killed: ${props.enemiesKilled ?? 0}\n` +
    `Encounters: ${props.combatEncountersFought}\n` +
    `Gold Spent: ${props.goldSpent ?? 0}g\n` +
    `Gold Remaining: ${props.playerGold ?? 0}g\n` +
    (props.weaponBonus > 0 ? `Weapon Bonus: +${props.weaponBonus}\n` : "") +
    (props.shieldBonus > 0 ? `Defense Bonus: +${props.shieldBonus}\n` : "") +
    `Special Tier: T${props.specialTier ?? 1}\n` +
    `Specials Used: ${props.specialsUsed}\n` +
    `Short Rests: ${props.shortRestsUsed} | Long Rests: ${props.longRestsUsed}\n` +
    `\nhttps://linkslayer.org/`;

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(summaryText)
      .then(() => showAlertAsBanner("Results copied to clipboard.", "success"))
      .catch(() => showAlertAsBanner("Failed to copy results.", "error"));
  } else {
    showAlertAsBanner("Clipboard not supported in this browser.", "error");
  }
};

function copyLogToClipboard() {
  const rawLog = props.gameLog
    .map((entry) => entry.text.replace(/<[^>]*>/g, ""))
    .join("\n");
  navigator.clipboard
    .writeText(rawLog)
    .then(() => showAlertAsBanner("Game log copied to clipboard.", "success"))
    .catch(() => showAlertAsBanner("Failed to copy log.", "error"));
}

let notificationTimeoutId = null;

async function showAlertAsBanner(message, type = "info", duration = 3000) {
  await nextTick();
  const banner = document.getElementById("victory-notification-banner");
  const messageSpan = document.getElementById("victory-notification-message");
  if (!banner || !messageSpan) { alert(message); return; }
  banner.className = "notification-banner";
  banner.classList.add(type);
  messageSpan.textContent = message;
  banner.classList.add("show");
  if (notificationTimeoutId) clearTimeout(notificationTimeoutId);
  notificationTimeoutId = setTimeout(hideNotification, duration);
}

function hideNotification() {
  const banner = document.getElementById("victory-notification-banner");
  if (banner) {
    banner.classList.remove("show");
    if (notificationTimeoutId) { clearTimeout(notificationTimeoutId); notificationTimeoutId = null; }
  }
}

function handleRestart() {
  if (!window.confirm("Start a new game? Your current save will be deleted.")) return;
  emit("restart");
}
</script>

<style scoped>
@import "./styles/victoryModalStyles.css";
</style>
