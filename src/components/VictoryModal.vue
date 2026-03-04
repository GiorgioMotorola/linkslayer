<template>
  <div class="game-modal-overlay">
    <div class="game-modal-content">

      <div class="modal-icon">🏆</div>

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
        <button @click="copyLogToClipboard" class="modal-btn">📋 Copy Log</button>
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
* {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
}

/* ── Overlay ─────────────────────────────────────────────── */
@keyframes fade-in-overlay {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.game-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  animation: fade-in-overlay 1.25s ease-out forwards;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255,210,60,0.06) 1px, transparent 1px),
    radial-gradient(ellipse at 70% 10%, rgba(255,200,40,0.05) 1px, transparent 1px),
    radial-gradient(ellipse at 55% 35%, rgba(255,220,80,0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(10, 7, 2, 0.96), rgba(28, 18, 4, 0.93), rgba(14, 9, 2, 0.85));
}

/* ── Card ────────────────────────────────────────────────── */
@keyframes pop-in {
  from { transform: scale(0.85); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

.game-modal-content {
  background: rgba(22, 14, 3, 0.94);
  border: 1px solid rgba(220, 170, 40, 0.55);
  box-shadow: 0 0 45px rgba(200, 150, 20, 0.18), 0 8px 28px rgba(0,0,0,0.7);
  padding: 1.8rem 2rem;
  border-radius: 12px;
  max-width: 460px;
  width: 92%;
  animation: pop-in 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
}

/* ── Icon ────────────────────────────────────────────────── */
@keyframes victory-pulse {
  0%,100% { transform: scale(1);    filter: drop-shadow(0 0 8px rgba(255,200,40,0.7)); }
  50%     { transform: scale(1.12); filter: drop-shadow(0 0 18px rgba(255,220,60,0.95)); }
}

.modal-icon {
  font-size: 42px;
  animation: victory-pulse 2.5s ease-in-out infinite;
}

/* ── Title ───────────────────────────────────────────────── */
.modal-title {
  font-size: 30px;
  font-weight: 700;
  color: #f0c840;
  letter-spacing: 0.5px;
  text-align: center;
}

/* ── Identity ────────────────────────────────────────────── */
.modal-identity {
  font-size: 16px;
  color: #d4b870;
  text-align: center;
}

.identity-name {
  font-weight: 600;
  color: #f0d888;
}

.identity-sep {
  color: #a08848;
}

.identity-class {
  font-style: italic;
  color: #d4aa60;
}

/* ── Battle summary ──────────────────────────────────────── */
.modal-battle-summary {
  font-size: 13px;
  color: #b09050;
  text-align: center;
}

.battle-player {
  font-weight: 600;
  color: #f0d888;
}

.battle-verb {
  color: #a08040;
}

.battle-article {
  font-weight: 700;
  color: #e8c050;
}

.battle-enemy {
  font-style: italic;
  color: #c8a850;
}

/* ── Site link ───────────────────────────────────────────── */
.modal-site-link {
  font-size: 11px;
  text-align: center;
  opacity: 0.45;
}

.modal-site-link a {
  color: #c8a840;
  text-decoration: none;
  letter-spacing: 0.5px;
}

.modal-site-link a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* ── Goal ────────────────────────────────────────────────── */
.modal-goal {
  font-size: 13px;
  font-style: italic;
  color: #a09060;
  text-align: center;
  border-top: 1px solid rgba(200, 150, 30, 0.25);
  border-bottom: 1px solid rgba(200, 150, 30, 0.25);
  padding: 0.5rem 0.8rem;
  width: 100%;
  box-sizing: border-box;
}

/* ── Hero stats ──────────────────────────────────────────── */
.hero-stats {
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: center;
}

.hero-stat {
  flex: 1;
  background: rgba(200, 150, 20, 0.1);
  border: 1px solid rgba(200, 150, 20, 0.3);
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  text-align: center;
}

.hero-stat-label {
  font-size: 11px;
  color: #a08848;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 2px;
}

.hero-stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #f0c840;
}

.hp-value {
  color: #e86060;
}

/* ── Stat grid ───────────────────────────────────────────── */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  width: 100%;
}

.stat-cell {
  background: rgba(255, 200, 40, 0.06);
  border: 1px solid rgba(200, 150, 20, 0.2);
  border-radius: 6px;
  padding: 0.4rem 0.7rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
}

.stat-cell-label {
  font-size: 12px;
  color: #9a8040;
}

.stat-cell-value {
  font-size: 14px;
  font-weight: 600;
  color: #e8c870;
}

/* ── Buttons ─────────────────────────────────────────────── */
.modal-buttons {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.modal-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgba(170, 120, 20, 0.45);
  background: rgba(38, 24, 4, 0.65);
  color: #d4aa50;
  border-radius: 7px;
  padding: 0.65rem 1rem;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  text-align: start;
}

.modal-btn:hover {
  background: rgba(180, 130, 20, 0.2);
  border-color: rgba(230, 180, 40, 0.7);
  color: #f5d878;
}

.modal-btn-primary {
  border-color: rgba(220, 170, 40, 0.65);
  color: #f0d070;
  font-weight: 600;
  letter-spacing: 0.4px;
}

/* ── Notification banner ─────────────────────────────────── */
.notification-banner {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #555;
  color: white;
  padding: 12px 18px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  z-index: 1001;
  opacity: 0;
  display: none;
  transition: opacity 0.4s ease;
  min-width: 220px;
  max-width: 90%;
  text-align: center;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.notification-banner.show {
  display: flex;
  opacity: 1;
}

.notification-banner.success { background-color: #2d7a2d; }
.notification-banner.error   { background-color: #8a2020; }

.notification-banner .close-button {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

/* ── Mobile ──────────────────────────────────────────────── */
@media screen and (max-width: 600px) {
  .game-modal-content {
    padding: 1.2rem;
    gap: 0.7rem;
    max-width: 96%;
  }

  .modal-icon { font-size: 32px; }
  .modal-title { font-size: 24px; }
  .hero-stat-value { font-size: 18px; }

  .stat-cell-label { font-size: 11px; }
  .stat-cell-value { font-size: 13px; }

  .modal-btn { font-size: 13px; padding: 0.55rem 0.8rem; }
}
</style>
