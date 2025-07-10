<template>
  <header>
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
              > Special
            </button>
          </div>
          <div class="enemy">
            Player HP: {{ playerHP }} &nbsp;&#10074;&nbsp; Enemy HP:
            {{ enemyHP }}
          </div>
          <!-- <div v-if="message" class="encounter-message" v-html="message" /> -->
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

    <div class="player-stats">
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
            class="log-toggle"
          >
            {{ expanded ? "Show Less" : "Show More" }}
          </button>
          <button @click="copyLogToClipboard" class="log-copy">Copy Log</button>
        </div>
      </div>
    </div>
    <div class="clicks">
      {{ props.playerName || "Unnamed" }} ({{ playerClass?.name || `none` }})
      &nbsp;&nbsp;&nbsp;&nbsp;&#10074;&nbsp;&nbsp;&nbsp;&nbsp;
      {{ `HP: ` + playerHP }}
      &nbsp;&nbsp;&nbsp;&nbsp;&#10074;&nbsp;&nbsp;&nbsp;&nbsp;
      {{ `Specials Left: ` + specialUsesLeft }}
      &nbsp;&nbsp;&nbsp;&nbsp;&#10074;&nbsp;&nbsp;&nbsp;&nbsp;
      {{ `Clicks: ` + clicks }}
      &nbsp;&nbsp;&nbsp;&nbsp;&#10074;&nbsp;&nbsp;&nbsp;&nbsp;
      {{ `Base dmg: +${weaponBonus > 0 ? weaponBonus : 0}` }}
    </div>
  </header>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";

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
});

const emit = defineEmits([
  "action",
  "defend",
  "flee",
  "special",
  "close",
  "option-chosen",
  "log-line",
]);

const activeAction = ref("");
const typedLine = ref("");
const typedGreeting = ref("");
let typeInterval = null;

const expanded = ref(false);
const visibleLogCount = ref(Math.min(props.gameLog?.length ?? 0, 5));
const newLinesRevealed = ref(0);
const newLineIds = ref([]);

const displayedLog = computed(() => {
  return expanded.value ? props.gameLog : props.gameLog.slice(-5);
});

const visibleLog = computed(() => {
  return displayedLog.value.slice(-visibleLogCount.value);
});

watch(
  () => props.encounter,
  (newEncounter) => {
    if (!newEncounter) return;
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
        }</strong> ${newEncounter.enemy.name ?? ""}. What do you do?`;
      }

      typedLine.value = "";
      emit("log-line", fullText);
    } else if (newEncounter.type === "npc") {
      fullText = newEncounter.npc.greeting;
      typedGreeting.value = "";
    } else if (newEncounter.type === "lore") {
      fullText = newEncounter.lore.text;
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

const formattedStart = computed(
  () => props.start?.toString().replaceAll("_", " ") ?? ""
);

const formattedTarget = computed(
  () => props.targets?.toString().replaceAll("_", " ") ?? ""
);

const formattedPath = computed(() =>
  (props.path || []).map((step) => step.replaceAll("_", " ")).join(" → ")
);

const formattedTitle = computed(() =>
  (props.path?.[props.path.length - 1] ?? "").replaceAll("_", " ")
);

function copyLogToClipboard() {
  const rawLog = props.gameLog
    .map((entry) => entry.replace(/<[^>]*>/g, ""))
    .join("\n");

  navigator.clipboard
    .writeText(rawLog)
    .then(() => alert("Log copied to clipboard"))
    .catch((err) => console.error("Failed to copy log:", err));
}
</script>

<style scoped>
* {
  font-family: "IBM Plex Mono", monospace;
}
header {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgb(228, 224, 224);
  z-index: 100;
  padding: 1rem;
  border: 2px solid #000000;
  border-radius: 4px;
  
}

.encounter-dashboard {
  border-radius: 8px;
  padding: 0.5rem;
}

.clicks {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 20px;
  color: rgb(35, 36, 35);
  font-weight: 500;
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-top: 1rem;
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
  margin-top: 0.3rem;
  color: rgb(229, 231, 229);
  font-weight: 700;
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
  background-color: rgb(228, 224, 224);
  font-size: 15px;
  margin-bottom: 0.3rem;
  color: #303030;
  font-weight: 700;
}

button:hover {
  color: rgb(41, 119, 67);
  cursor: pointer;
}

.enemy {
  color: #376475;
  font-weight: 500;
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
}

.npc-name {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 30px;
  animation: npc-drop 0.5s ease-out forwards;
  color: rgb(7, 7, 7);
}

.lore-name {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 30px;
  animation: lore-drop 0.8s ease-out forwards;
  color: rgb(7, 7, 7);
}

.npc-greeting,
.lore-greeting {
  font-size: 18px;
  margin-bottom: 1rem;
}

.npc button {
  display: flex;
  flex-direction: column;
  border: none;
  background-color: rgb(228, 224, 224);
  font-size: 14px;
  margin-bottom: 0.3rem;
  color: #303030;
  font-weight: 700;
}

.lore button {
  display: flex;
  flex-direction: column;
  border: none;
  background-color: rgb(228, 224, 224);
  font-size: 14px;
  margin-bottom: 0.3rem;
  color: #303030;
  font-weight: 700;
}

.npc button:hover {
  color: rgb(41, 119, 67);
  cursor: pointer;
}

.lore button:hover {
  color: rgb(41, 119, 67);
  cursor: pointer;
}

.attack-line {
  text-align: start;
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

@media screen and (max-width: 600px) {
  .path {
    font-size: 17px;
    margin-bottom: 1rem;
  }

  .clicks {
    font-size: 13px;
  }

  .current-path {
    font-size: 13px;
  }
}
</style>
