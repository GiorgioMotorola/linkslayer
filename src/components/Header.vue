<template>
  <header :class="{ 'darkened-header': isDarkened }">
    <transition name="encounter-fade" mode="out-in">
      <div v-if="encounter" class="encounter-dashboard">
        <div v-if="encounter.type === 'combat'">
          <div class="oh-no">Combat ⚔️</div>
          <div class="attack-line" v-html="typedLine"></div>
          <div class="btn-group">
            <button
              :class="{ 'btn-anim-attack': activeAction === 'attack' }"
              @click="handleAction('attack')"
            >
              > Attack
            </button>

            <button
              :class="{ 'btn-anim-defend': activeAction === 'defend' }"
              @click="handleAction('defend')"
            >
              > Defend
            </button>

            <button
              :class="{ 'btn-anim-flee': activeAction === 'flee' }"
              @click="handleAction('flee')"
            >
              > Flee
            </button>

            <button
              :class="{ 'btn-anim-special': activeAction === 'special' }"
              @click="handleAction('special')"
            >
              > {{ playerSpecialAbilityName }}
            </button>
          </div>
          <div class="enemy">
            💀 (HP:
            {{ enemyHP }})
          </div>
        </div>

        <div class="npc" v-else-if="encounter.type === 'npc'">
          <div class="npc-name">{{ encounter.npc.name }} 💬</div>
          <div class="npc-greeting" v-html="typedGreeting"></div>
          <div v-if="encounter.npc.options">
            <button
              v-for="(option, index) in encounter.npc.options"
              :key="index"
              @click="emit('option-chosen', option)"
            >
              > {{ option.text }}
            </button>
          </div>
          <div v-else>
            <button @click="emit('close')">> Continue</button>
          </div>
        </div>

        <div class="lore" v-else-if="encounter.type === 'lore'">
          <div class="lore-name">Discovery 🔎</div>
          <div class="lore-greeting" v-html="typedGreeting"></div>
          <div v-if="encounter.lore.options">
            <button
              v-for="(option, index) in encounter.lore.options"
              :key="index"
              @click="emit('option-chosen', option)"
            >
              > {{ option.text }}
            </button>
          </div>
          <div v-else>
            <button @click="emit('close')">> Continue</button>
          </div>
        </div>

        <div v-else>
          <p>⚠️ Unknown encounter type.</p>
          <button @click="emit('close')">Continue</button>
        </div>
      </div>
    </transition>

    <div class="player-stats-container">
      <div class="player-name-line">
        {{ props.playerName || "Unnamed" }}
        <span style="font-weight: 600; color: #02204d"
          >({{ playerClass?.name || `none` }})</span
        >
      </div>

      <div class="all-stats-row-box">
        <div class="stat-column-hp">
          <div class="stat-label">HP</div>
          <div class="stat-value" :class="hpAnimClass">{{ playerHP }}</div>
        </div>

        <div class="stat-column">
          <div class="stat-label">Weapon</div>
          <div class="stat-value" :class="weaponAnimClass">
            +{{ weaponBonus }}
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">Defense</div>
          <div class="stat-value" :class="defenseAnimClass">
            +{{ shieldBonus }}
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">{{ playerSpecialAbilityName }}</div>
          <div class="stat-value" :class="specialAnimClass">
            {{ specialUsesLeft }}
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">Short Rest</div>
          <div class="stat-value" :class="shortRestAnimClass">
            {{ 4 - shortRestsUsedCount }}
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">Long Rest</div>
          <div class="stat-value" :class="longRestAnimClass">
            {{ 2 - longRestsUsedCount }}
          </div>
        </div>

        <div class="stat-column">
          <div class="stat-label">Gold</div>
          <div class="stat-value" :class="goldAnimClass">{{ playerGold }}</div>
        </div>

        <div class="stat-column-clicks">
          <div class="stat-label">Clicks</div>
          <div class="stat-value" :class="clicksAnimClass">{{ clicks }}</div>
        </div>
      </div>
      <div class="game-log">
        <div class="log"></div>
        <div
          v-for="(entry, index) in visibleLog"
          :key="entry.id"
          :class="[
            'log-entry',
            {
              'latest-log': entry === visibleLog[visibleLog.length - 1],
              'animate-log': newLineIds.includes(entry.id),
            },
          ]"
          v-html="entry.id + '. ' + entry.text"
          :style="
            newLineIds.includes(entry.id)
              ? { animationDelay: `${Math.max(index, 1) * 0.3}s` }
              : {}
          "
        />

        <div class="log-btns">
          <button
            v-if="props.gameLog.length > 5"
            @click="expanded = !expanded"
            class="tips-button"
          >
            {{ expanded ? "Show Less" : "Show More" }}
          </button>
          <button class="tips-button" @click="copyLogToClipboard">
            Copy Log
          </button>
          <button class="tips-button" @click="openModal">Game Tips</button>
          <TipsModal v-if="isModalOpen" @close="closeModal" />
        </div>
      </div>
    </div>

    <div class="footer-buttons">
      <button @click="emit('open-inventory-modal')" class="inventory-button">
        Inventory
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import TipsModal from "./TipsModal.vue";

const props = defineProps({
  start: String,
  targets: String,
  clicks: Number,
  path: Array,
  playerClass: Object,
  specialUsesLeft: Number,
  playerHP: Number,
  maxHP: Number,
  gameLog: Array,
  encounter: Object,
  enemyHP: Number,
  nextEnemyAttack: Number,
  enemyNextAction: String,
  message: String,
  playerName: String,
  weaponBonus: Number,
  shortRestsUsed: Number,
  longRestsUsed: Number,
  formattedTitle: String,
  shieldBonus: Number,
  playerGold: Number,
  hasCompass: Number,
  gameChain: Array,
  isDarkened: {
    type: Boolean,
    default: false,
  },
  compassCount: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits([
  "action",
  "defend",
  "flee",
  "special",
  "close",
  "option-chosen",
  "log-line",
  "show-tips",
  "use-compass",
  "open-inventory-modal",
]);

const activeAction = ref("");
const typedLine = ref("");
const typedGreeting = ref("");
let typeInterval = null;

const expanded = ref(false);
const visibleLogCount = ref(Math.min(props.gameLog?.length ?? 0, 5));
const newLineIds = ref([]);

const displayedLog = computed(() => {
  return expanded.value ? props.gameLog : props.gameLog.slice(-5);
});

const visibleLog = computed(() => {
  return displayedLog.value.slice(-visibleLogCount.value);
});

const isModalOpen = ref(false);

const openModal = () => {
  isModalOpen.value = true;
  emit("show-tips");
};

const closeModal = () => {
  isModalOpen.value = false;
};

const longRestsUsedCount = computed(() => props.longRestsUsed ?? 0);

const shortRestsUsedCount = computed(() => props.shortRestsUsed ?? 0);

const playerSpecialAbilityName = computed(() => {
  return props.playerClass?.special || "Special";
});

const hpAnimClass = ref("");
const weaponAnimClass = ref("");
const defenseAnimClass = ref("");
const clicksAnimClass = ref("");
const goldAnimClass = ref("");
const specialAnimClass = ref("");
const shortRestAnimClass = ref("");
const longRestAnimClass = ref("");

let hpTimeout = null;
let weaponTimeout = null;
let defenseTimeout = null;
let clicksTimeout = null;
let goldTimeout = null;
let specialTimeout = null;
let shortRestTimeout = null;
let longRestTimeout = null;

function triggerAnim(refVar, className, duration = 700) {
  let currentTimeoutRef;
  if (refVar === hpAnimClass) currentTimeoutRef = hpTimeout;
  else if (refVar === weaponAnimClass) currentTimeoutRef = weaponTimeout;
  else if (refVar === defenseAnimClass) currentTimeoutRef = defenseTimeout;
  else if (refVar === clicksAnimClass) currentTimeoutRef = clicksTimeout;
  else if (refVar === goldAnimClass) currentTimeoutRef = goldTimeout;
  else if (refVar === specialAnimClass) currentTimeoutRef = specialTimeout;
  else if (refVar === shortRestAnimClass) currentTimeoutRef = shortRestTimeout;
  else if (refVar === longRestAnimClass) currentTimeoutRef = longRestTimeout;

  if (currentTimeoutRef) {
    clearTimeout(currentTimeoutRef);
  }

  refVar.value = "";

  void refVar.value;
  nextTick(() => {
    refVar.value = className;

    const newTimeout = setTimeout(() => {
      refVar.value = "";
    }, duration);

    if (refVar === hpAnimClass) hpTimeout = newTimeout;
    else if (refVar === weaponAnimClass) weaponTimeout = newTimeout;
    else if (refVar === defenseAnimClass) defenseTimeout = newTimeout;
    else if (refVar === clicksAnimClass) clicksTimeout = newTimeout;
    else if (refVar === goldAnimClass) goldTimeout = newTimeout;
    else if (refVar === specialAnimClass) specialTimeout = newTimeout;
    else if (refVar === shortRestAnimClass) shortRestTimeout = newTimeout;
    else if (refVar === longRestAnimClass) longRestTimeout = newTimeout;
  });
}

watch(
  () => props.playerHP,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      if (newVal > oldVal) {
        triggerAnim(hpAnimClass, "hp-gain");
      } else {
        triggerAnim(hpAnimClass, "hp-loss");
      }
    }
  }
);

watch(
  () => props.encounter,
  (newEncounter) => {
    if (newEncounter && newEncounter.type === "combat" && newEncounter.enemy) {
      console.log("Enemy object:", newEncounter.enemy);
      console.log("Enemy image URL:", newEncounter.enemy.imageUrl);
    }
  },
  { immediate: true }
);

watch(
  () => props.weaponBonus,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      triggerAnim(weaponAnimClass, "stat-flash");
    }
  }
);

watch(
  () => props.shieldBonus,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      triggerAnim(defenseAnimClass, "stat-flash");
    }
  }
);

watch(
  () => props.clicks,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      triggerAnim(clicksAnimClass, "stat-bounce");
    }
  }
);

watch(
  () => props.playerGold,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      if (newVal > oldVal) {
        triggerAnim(goldAnimClass, "gold-gain");
      } else {
        triggerAnim(goldAnimClass, "gold-loss");
      }
    }
  }
);

watch(
  () => props.specialUsesLeft,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      if (newVal > oldVal) {
        triggerAnim(specialAnimClass, "stat-gain");
      } else {
        triggerAnim(specialAnimClass, "stat-loss");
      }
    }
  }
);

watch(shortRestsUsedCount, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    if (newVal > oldVal) {
      triggerAnim(shortRestAnimClass, "stat-loss");
    } else {
      triggerAnim(shortRestAnimClass, "stat-gain");
    }
  }
});

watch(longRestsUsedCount, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    if (newVal > oldVal) {
      triggerAnim(longRestAnimClass, "stat-loss");
    } else {
      triggerAnim(longRestAnimClass, "stat-gain");
    }
  }
});

watch(
  () => props.encounter,
  (newEncounter) => {
    if (!newEncounter) {
      typedLine.value = "";
      typedGreeting.value = "";
      clearInterval(typeInterval);
      return;
    }

    let fullText = "";

    if (newEncounter.type === "combat") {
      if (newEncounter.enemy?.isBoss) {
        fullText = `💀 <strong>BOSS ENCOUNTER:</strong> ${
          newEncounter.enemy.name
        }!<br><br>${
          newEncounter.enemy.message || "Prepare for the fight of your life."
        }`;
      } else if (newEncounter.enemy?.message) {
        fullText = newEncounter.enemy.message;
      } else {
      fullText = `🗡️ You've been attacked by <strong>${
          formattedTitle.value
        }</strong> ${newEncounter.enemy.name ?? ""}. (HP: ${
          newEncounter.enemy.currentHP
        }) What do you do?`;
      }

      typedLine.value = "";
      typedGreeting.value = "";
    } else if (newEncounter.type === "npc") {
      fullText = newEncounter.npc.greeting;
      typedGreeting.value = "";
      typedLine.value = "";
    } else if (newEncounter.type === "lore") {
      fullText = newEncounter.lore.text;
      typedGreeting.value = "";
      typedLine.value = "";
    } else {
      fullText = "⚠️ Unknown encounter type.";
      typedLine.value = "";
      typedGreeting.value = "";
    }

    startTyping(fullText, newEncounter.type);
  }
);

function startTyping(fullText, type = "combat") {
  clearInterval(typeInterval);
  let index = 0;

  typeInterval = setInterval(() => {
    if (type === "combat") {
      typedLine.value += fullText.charAt(index);
    } else {
      typedGreeting.value += fullText.charAt(index);
    }

    index++;
    if (index >= fullText.length) clearInterval(typeInterval);
  }, 10);
}
watch(
  () => props.gameLog.length,
  async (newLength, oldLength) => {
    const diff = newLength - visibleLogCount.value;

    if (diff > 0) {
      const newEntries = props.gameLog.slice(-diff);
      newLineIds.value = newEntries.map((e) => e.id);

      let revealIndex = 0;
      const interval = setInterval(() => {
        if (revealIndex >= diff) {
          clearInterval(interval);
          newLineIds.value = [];
        } else {
          visibleLogCount.value++;
          revealIndex++;
        }
      }, 350);
    } else {
      visibleLogCount.value = newLength;
      newLineIds.value = [];
    }

    await nextTick();
  },
  { immediate: true }
);

function handleAction(action) {
  activeAction.value = action;
  emit("action", action);

  setTimeout(() => {
    activeAction.value = "";
  }, 300);
}

const formattedTitle = computed(() =>
  (props.path?.[props.path.length - 1] ?? "").replaceAll("_", " ")
);

function copyLogToClipboard() {
  const rawLog = props.gameLog
    .map((entry) => entry.text.replace(/<[^>]*>/g, ""))
    .join("\n");

  navigator.clipboard
    .writeText(rawLog)
    .then(() => alert("Log copied to clipboard"))
    .catch((err) => console.error("Failed to copy log:", err));
}
</script>

<style scoped>
* {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
}
header {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #e2e6e7;
  z-index: 100;
  padding: 0.5rem;
  border-top: 1.5px solid #000000;
  transition: background-color 1.5s ease-in-out, filter 1.5s ease-in-out;
  color: rgb(35, 36, 35);
  transition: background-color 1.5s ease-in-out, filter 1.5s ease-in-out,
    color 1.5s ease-in-out;

  display: flex;
  flex-direction: column;
}

.darkened-header {
  background-color: rgb(100, 95, 95);
  filter: brightness(0.7);
  color: rgb(200, 200, 200);
}

.darkened-header .player-name-line {
  color: rgb(150, 180, 255);
}

.darkened-header .all-stats-row-box {
  background-color: #2a2828;
  border-color: #777;
}

.darkened-header .stat-label {
  color: rgb(180, 180, 180);
}

.darkened-header .stat-value {
  color: rgb(255, 200, 0);
}

.darkened-header .game-log {
  background-color: #2a2828;
  border-color: #555;
}

.darkened-header .game-log .log-entry {
  color: rgb(180, 180, 180);
}

.darkened-header .game-log .latest-log {
  background-color: #3a71b865;
  color: rgb(255, 255, 255);
}

.darkened-header .log-btns button {
  color: rgb(200, 200, 200);
}

.darkened-header .log-btns button:hover {
  color: rgb(150, 180, 255);
}

.darkened-header .enemy {
  color: rgb(167, 186, 194);
}

.darkened-header .oh-no,
.darkened-header .npc-name,
.darkened-header .lore-name {
  color: rgb(253, 35, 35);
  text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000,
    2px 2px 0 #000, -2px 0px 0 #000, 2px 0px 0 #000, 0px -2px 0 #000,
    0px 2px 0 #000;
}

.darkened-header .npc-greeting,
.darkened-header .lore-greeting,
.darkened-header .attack-line {
  color: rgb(220, 220, 220);
}

.darkened-header button {
  color: rgb(253, 35, 35);
  background-color: transparent;
  text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000,
    2px 2px 0 #000, -2px 0px 0 #000, 2px 0px 0 #000, 0px -2px 0 #000,
    0px 2px 0 #000;
  font-size: 20px;
}

.darkened-header button:hover {
  color: rgb(100, 200, 120);
}

.encounter-dashboard {
  border-radius: 8px;
  padding: 0.5rem;
}

.player-name-line {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
  font-size: 24px;
  color: rgb(29, 29, 29);
  font-weight: 600;
  text-align: center;
  margin-top: 0.5rem;
  margin-bottom: 0.8rem;
}

.all-stats-row-box {
  background-color: #d4dddd;
  border: 1px solid #555;
  border-radius: 8px;
  padding: 0.8rem 1rem;
  margin-left: auto;
  margin-right: auto;
  max-width: fit-content;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 5rem;
  color: rgb(229, 231, 229);
}

.stat-column,
.stat-column-hp,
.stat-column-clicks {
  display: flex;
  flex-direction: column;
  align-items: center;
  white-space: nowrap;
}

.stat-column-hp {
  border-right: 2px solid rgb(141, 141, 141);
  padding-right: 4.5rem;
}

.stat-column-clicks {
  border-left: 2px solid rgb(141, 141, 141);
  padding-left: 4.5rem;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 0.2rem;
  letter-spacing: 1px;
  color: #000;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #374147;
  display: inline-block;
  will-change: transform, color, text-shadow;
}

.footer-buttons {
  display: flex;
  justify-content: center;
  width: 100%;
}

.inventory-button {
  background-color: transparent;
  color: rgb(185, 17, 17);
  border: none;
  border-radius: 5px;
  margin-top: 0.5rem;
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
}
.inventory-button:hover {
  background-color: #0056b3;
}
.current-path {
  margin-top: 0.1rem;
  margin-bottom: 1rem;
  font-size: 16px;
  color: #555;
  text-align: start;
}

.game-log {
  max-height: 200px;
  overflow-y: auto;
  background-color: #3a3737;
  color: rgb(229, 231, 229);
  font-family: monospace;
  padding: 0.5rem;
  margin-top: 1rem;
  border: 1px solid #333;
  border-radius: 8px;
  font-size: 14px;
}

.log {
  color: rgb(229, 231, 229);
  font-size: 15px;
  padding: 0.3rem;
}

.log-btns {
  display: flex;
  flex-direction: row;
  border: none;
  background-color: #3a3737;
  font-size: 14px;
  margin-top: 0rem;
  color: rgb(229, 231, 229);
  font-weight: 400;
  gap: 1rem;
}

.latest-log {
  font-weight: bold;
  font-size: 17px;
  background-color: #4a91e265;
}

.log-entry {
  opacity: 0;
  transition: opacity 0.3s ease-in;
}

.log-entry:not(.animate-log) {
  opacity: 1;
}

.animate-log {
  opacity: 0;
  transform: translateY(5px);
  animation: fadeInUp 0.3s forwards;
}

.tips-button {
  margin-top: 0.3rem;
  background-color: transparent;
  color: beige;
  font-size: 17px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border: none;
}

.tips-button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.btn-group {
  margin-top: 20px;
}

button {
  display: flex;
  flex-direction: column;
  border: none;
  background: #e2e6e7;
  font-size: 17px;
  margin-bottom: 0.3rem;
  color: #303030;
  font-weight: 400;
}

button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
}

.enemy {
  color: #990702;
  font-weight: 400;
  font-size: 20px;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.oh-no {
  text-align: center;
  margin-bottom: 0.3rem;
  font-size: 50px;
  animation: combat-drop 0.35s ease-in forwards;
  color: rgb(7, 7, 7);
  border-bottom: 1px solid rgb(155, 152, 152);
  padding-bottom: 10px;
  margin-left: 100px;
  margin-right: 100px;
}

.npc-name {
  text-align: center;
  margin-bottom: 1rem;
  font-size: 30px;
  animation: npc-drop 0.5s ease-out forwards;
  color: rgb(7, 7, 7);
  border-bottom: 1px solid rgb(155, 152, 152);
  padding-bottom: 10px;
  margin-left: 100px;
  margin-right: 100px;
}

.lore-name {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 30px;
  animation: lore-drop 0.8s ease-out forwards;
  color: rgb(7, 7, 7);
  border-bottom: 1px solid black;
  padding-bottom: 10px;
  margin-left: 100px;
  margin-right: 100px;
}

.npc-greeting,
.lore-greeting {
  font-size: 22px;
  margin-bottom: 1rem;
  color: #000;
}

.npc button {
  display: flex;
  flex-direction: column;
  border: none;
  background: #e2e6e7;
  font-size: 17px;
  margin-bottom: 0.3rem;
  color: #303030;
  font-weight: 400;
}

.lore button {
  display: flex;
  flex-direction: column;
  border: none;
  background: #e2e6e7;
  font-size: 17px;
  margin-bottom: 0.3rem;
  color: #303030;
  font-weight: 400;
}

.npc button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
}

.lore button:hover {
  color: rgb(28, 128, 158);
  cursor: pointer;
}

.attack-line {
  text-align: start;
  font-size: 22px;
  margin-bottom: 1rem;
  color: #000;
  padding-bottom: 0.5rem;
  padding-top: 1rem;
}

.encounter-fade-enter-active,
.encounter-fade-leave-active {
  transition: all 0.9s ease;
}

.encounter-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.encounter-fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.encounter-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.encounter-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes combat-drop {
  0% {
    opacity: 0;
    transform: scale(3) translateY(-100px) rotate(-20deg);
    filter: blur(4px);
  }
  50% {
    opacity: 1;
    transform: scale(1.1) translateY(5px) rotate(2deg);
    filter: blur(0);
  }
  70% {
    transform: scale(0.95) rotate(-1deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

@keyframes lore-drop {
  0% {
    opacity: 0;
    filter: blur(8px);
  }

  35% {
    opacity: 0.5;
    filter: blur(5px);
  }

  60% {
    opacity: 0.8;
    filter: blur(2px);
  }

  75% {
    opacity: 0.95;
    filter: blur(1px);
  }

  100% {
    opacity: 1;
    filter: blur(0);
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

@keyframes action-scale {
  0% {
    color: rgb(148, 2, 2);
    box-shadow: 0 0 0px rgb(148, 50, 50);
    transform: scale(1);
  }
  50% {
    background-color: rgb(148, 2, 2);
    color: rgb(214, 214, 214);
    box-shadow: 0 0 0px rgb(216, 3, 3);
    transform: scale(1.5) rotate(3deg);
  }
  100% {
    color: rgb(148, 2, 2);
    box-shadow: 0 0 0px rgb(148, 50, 50);
    transform: scale(1);
  }
}

@keyframes defend-shield {
  0% {
    color: rgb(41, 45, 49);
    box-shadow: 0 0 0px #4a90e2;
  }
  50% {
    color: rgb(255, 255, 255);
    box-shadow: 0 0 50px #4a90e2;
    transform: scale(1.5);
  }
  100% {
    color: rgb(41, 45, 49);
    box-shadow: 0 0 0px #4a90e2;
    transform: scale(1);
  }
}

@keyframes flee-slide {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(30px);
    opacity: 0.6;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes special-flash {
  0% {
    background-color: gold;
  }
  50% {
    background-color: white;
    transform: scale(1.3);
  }
  100% {
    background-color: gold;
    transform: scale(1);
  }
}

.btn-anim-attack {
  animation: action-scale 0.3s ease;
}

.btn-anim-defend {
  animation: defend-shield 0.3s ease;
}

.btn-anim-flee {
  animation: flee-slide 0.3s ease;
}

.btn-anim-special {
  animation: special-flash 0.3s ease;
}

.encounter-fade-enter-active {
  transition: all 0.3s ease-out;
}

.encounter-fade-leave-active {
  transition: all 0.3s ease-in;
}

.encounter-fade-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.encounter-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}

@keyframes stat-flash {
  0% {
    transform: scale(1);
    color: inherit;
  }
  50% {
    transform: scale(1.25);
    color: #031788;
    text-shadow: 0 0 8px #032288;
  }
  100% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
}

@keyframes gold-gain {
  0% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
  50% {
    transform: scale(1.3);
    color: gold;
    text-shadow: 0 0 15px gold, 0 0 25px rgba(255, 215, 0, 0.7);
  }
  100% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
}

@keyframes gold-loss {
  0% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
  50% {
    transform: scale(1.3);
    color: #f44336;
    text-shadow: 0 0 15px #f44336, 0 0 25px rgba(244, 67, 54, 0.7);
  }
  100% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
}

.enemy-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  margin-right: 8px;
  border-radius: 4px;
}

.darkened-header .enemy-icon {
  filter: brightness(0.8);
}

@keyframes stat-gain {
  0% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }

  50% {
    transform: scale(1.3);
    color: #042f8b; 
    text-shadow: 0 0 10px #043a8ba1; 
  }

  80% {

    transform: scale(1.1); 
    color: #042f8b; 
    text-shadow: 0 0 8px #043a8ba1; 
  }
  100% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
}

@keyframes stat-loss {
  0% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }

  50% {
    transform: scale(1.3);
    color: #e26060; 
    text-shadow: 0 0 10px rgba(241, 110, 100, 0.9);
  }

  80% {
 
    transform: scale(1.1); 
    color: #e26060;
    text-shadow: 0 0 8px rgba(241, 110, 100, 0.7); 
  }
  100% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
}

@keyframes hp-gain {
  0% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
  50% {
    transform: scale(1.3);
    color: #1db30f;
    text-shadow: 0 0 10px rgba(76, 175, 80, 0.9);
  }
  100% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
}

@keyframes hp-loss {
  0% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
  50% {
    transform: scale(1.3);
    color: #f44336;
    text-shadow: 0 0 10px rgba(244, 67, 54, 0.9);
  }
  100% {
    transform: scale(1);
    color: inherit;
    text-shadow: none;
  }
}
@keyframes stat-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-5px) scale(1.1);
  }
  50% {
    transform: translateY(0);
  }
  75% {
    transform: translateY(-2px) scale(1.05);
  }
}

.stat-flash {
  animation: stat-flash 1s ease-out;
}

.stat-gain {
  animation: stat-gain 1s ease-out;
}

.stat-loss {
  animation: stat-loss 1s ease-out;
}

.hp-gain {
  animation: hp-gain 1s ease-out;
}

.hp-loss {
  animation: hp-loss 1s ease-out;
}

.gold-gain {
  animation: gold-gain 1s ease-out;
}

.gold-loss {
  animation: gold-loss 1s ease-out;
}

.stat-bounce {
  animation: stat-bounce 0.8s ease-out;
}

@media screen and (max-width: 600px) {
  .path {
    font-size: 17px;
    margin-bottom: 1rem;
  }

  .player-name-line {
    font-size: 20px;
  }

  .all-stats-row-box {
    padding: 0.6rem 0.8rem;
    gap: 1rem;
  }

  .stat-label {
    font-size: 14px;
  }

  .stat-value {
    font-size: 24px;
  }

  .current-path {
    font-size: 13px;
  }
}
</style>
