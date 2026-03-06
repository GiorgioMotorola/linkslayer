<template>
  <div class="rune-overlay" @click.self="onOverlayClick">
    <div class="rune-modal">
      <div class="rune-header">
        <span class="header-ornament">᛫</span>
        <span class="header-title">Ancient Cache</span>
        <span class="header-ornament">᛫</span>
      </div>

      <!-- Idle: about to start -->
      <div v-if="phase === 'idle'" class="rune-body">
        <p class="rune-instruction">
          The runes pulse in sequence. Watch carefully, then repeat the pattern.
        </p>
        <div class="rune-grid">
          <button v-for="rune in RUNES" :key="rune" class="rune-btn" disabled>
            {{ rune }}
          </button>
        </div>
        <button class="action-btn" @click="startSequence">Begin</button>
      </div>

      <!-- Playing: watch the sequence -->
      <div v-else-if="phase === 'playing'" class="rune-body">
        <p class="rune-instruction">Watch the sequence...</p>
        <div class="rune-grid">
          <button
            v-for="rune in RUNES"
            :key="rune"
            class="rune-btn"
            :class="{ 'rune-active': activeRune === rune }"
            disabled
          >
            {{ rune }}
          </button>
        </div>
      </div>

      <!-- Input: player repeats -->
      <div v-else-if="phase === 'input'" class="rune-body">
        <p class="rune-instruction">
          Repeat the sequence. ({{ playerInput.length }} /
          {{ sequence.length }})
          <span class="attempts-left">
            — {{ attemptsLeft }} attempt{{
              attemptsLeft === 1 ? "" : "s"
            }}
            left</span
          >
        </p>
        <div class="rune-grid">
          <button
            v-for="rune in RUNES"
            :key="rune"
            class="rune-btn rune-btn-clickable"
            :class="{
              'rune-flash-correct': flashCorrect === rune,
              'rune-flash-wrong': flashWrong === rune,
            }"
            @click="onRuneClick(rune)"
          >
            {{ rune }}
          </button>
        </div>
      </div>

      <!-- Success -->
      <div v-else-if="phase === 'success'" class="rune-body rune-result">
        <div class="result-icon">✦</div>
        <p class="result-title">The cache opens.</p>
        <p class="result-reward">{{ rewardText }}</p>
        <button class="action-btn" @click="claimReward">Claim Reward</button>
      </div>

      <!-- Failure -->
      <div v-else-if="phase === 'failure'" class="rune-body rune-result">
        <div class="result-icon result-icon-fail">✗</div>
        <p class="result-title">The runes go dark.</p>
        <p class="result-sub">The cache remains sealed.</p>
        <button class="action-btn action-btn-dim" @click="$emit('close')">
          Walk Away
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  tier: { type: Number, default: 1 },
});

const emit = defineEmits(["close", "reward"]);

const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ"];

const rewardsByTier = {
  1: [
    { type: "gold", amount: 25, label: "You find 25 gold inside." },
    {
      type: "health_potion",
      amount: 1,
      label: "You find a Health Potion inside.",
    },
  ],
  2: [
    { type: "gold", amount: 40, label: "You find 40 gold inside." },
    {
      type: "health_potion",
      amount: 1,
      label: "You find a Health Potion inside.",
    },
  ],
  3: [
    { type: "gold", amount: 80, label: "You find 80 gold inside." },
    {
      type: "health_potion",
      amount: 1,
      label: "You find 2 Health Potions inside.",
    },
  ],
  4: [
    { type: "gold", amount: 100, label: "You find 100 gold inside." },
    {
      type: "health_potion",
      amount: 2,
      label: "You find 2 Health Potions inside.",
    },
  ],
  5: [
    { type: "gold", amount: 125, label: "You find 125 gold inside." },
    {
      type: "weapon",
      amount: 1,
      label: "You find a sword pommel.",
    },
  ],
  6: [
    { type: "gold", amount: 150, label: "You find 150 gold inside." },
    {
      type: "health_potion",
      amount: 2,
      label: "You find 2 Health Potions inside.",
    },
    {
      type: "weapon",
      amount: 1,
      label: "You find a sword pommel.",
    },
    {
      type: "defense",
      amount: 1,
      label: "You find a greaves.",
    },
  ],
};

const sequenceLength = computed(() => props.tier + 2); // tier 1→3, tier 2→4, tier 3→5

const phase = ref("idle");
const sequence = ref([]);
const activeRune = ref(null);
const playerInput = ref([]);
const attemptsLeft = ref(3);
const flashCorrect = ref(null);
const flashWrong = ref(null);
const rolledReward = ref(null);

const rewardText = computed(() => rolledReward.value?.label ?? "");

function buildSequence() {
  const seq = [];
  for (let i = 0; i < sequenceLength.value; i++) {
    seq.push(RUNES[Math.floor(Math.random() * RUNES.length)]);
  }
  return seq;
}

async function startSequence() {
  sequence.value = buildSequence();
  playerInput.value = [];
  phase.value = "playing";
  await playSequence();
  phase.value = "input";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function playSequence() {
  for (const rune of sequence.value) {
    activeRune.value = rune;
    await sleep(650);
    activeRune.value = null;
    await sleep(300);
  }
}

async function onRuneClick(rune) {
  if (phase.value !== "input") return;

  const expected = sequence.value[playerInput.value.length];

  if (rune === expected) {
    flashCorrect.value = rune;
    await sleep(300);
    flashCorrect.value = null;
    playerInput.value.push(rune);

    if (playerInput.value.length === sequence.value.length) {
      // Success — roll reward
      const pool = rewardsByTier[props.tier] ?? rewardsByTier[1];
      rolledReward.value = pool[Math.floor(Math.random() * pool.length)];
      phase.value = "success";
    }
  } else {
    flashWrong.value = rune;
    await sleep(400);
    flashWrong.value = null;
    attemptsLeft.value--;

    if (attemptsLeft.value <= 0) {
      phase.value = "failure";
    } else {
      // Replay sequence
      playerInput.value = [];
      phase.value = "playing";
      await sleep(300);
      await playSequence();
      phase.value = "input";
    }
  }
}

function claimReward() {
  emit("reward", rolledReward.value);
}

function onOverlayClick() {
  if (phase.value === "success" || phase.value === "failure") {
    emit("close");
  }
}
</script>

<style scoped>
.rune-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.rune-modal {
  background: #011316;
  border: 1px solid rgba(100, 140, 60, 0.35);
  border-radius: 8px;
  width: 90%;
  max-width: 420px;
  padding: 28px 28px 24px;
  box-shadow:
    0 10px 50px rgba(0, 0, 0, 0.8),
    inset 0 0 40px rgba(0, 0, 0, 0.4);
  font-family: "IBM Plex Sans", sans-serif;
}

.rune-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(100, 140, 60, 0.25);
  margin-bottom: 20px;
}

.header-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #c00e0e;
}

.header-ornament {
  color: #3061ca;
  font-size: 16px;
  opacity: 0.8;
}

.rune-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.rune-instruction {
  font-size: 13px;
  color: #d3d6ce;
  text-align: center;
  line-height: 1.5;
  margin: 0;
}

.attempts-left {
  color: #6a7a55;
  font-size: 12px;
}

.rune-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
}

.rune-btn {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(80, 110, 50, 0.35);
  border-radius: 6px;
  color: #d3d6ce;
  font-size: 28px;
  padding: 14px 8px;
  cursor: default;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s,
    box-shadow 0.15s;
  user-select: none;
  line-height: 1;
}

.rune-btn-clickable {
  cursor: pointer;
}

.rune-btn-clickable:hover {
  background: rgba(40, 60, 25, 0.9);
  border-color: rgba(120, 160, 70, 0.5);
  color: #90b060;
}

.rune-active {
  background: rgba(17, 124, 124, 0.6) !important;
  border-color: rgba(80, 112, 200, 0.8) !important;
  color: #c8e880 !important;
  box-shadow: 0 0 18px 4px rgba(120, 180, 40, 0.45) !important;
}

.rune-flash-correct {
  background: rgba(30, 80, 30, 0.7) !important;
  border-color: rgba(80, 180, 80, 0.8) !important;
  color: #80e880 !important;
  box-shadow: 0 0 14px 3px rgba(60, 160, 60, 0.4) !important;
}

.rune-flash-wrong {
  background: rgba(80, 20, 20, 0.7) !important;
  border-color: rgba(180, 60, 60, 0.8) !important;
  color: #e88080 !important;
  box-shadow: 0 0 14px 3px rgba(160, 40, 40, 0.4) !important;
}

.action-btn {
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 5px;
  color: #3061ca;
  font-size: 12px;
  font-family: "IBM Plex Sans", sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 8px 28px;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.action-btn:hover {
  background: rgba(55, 85, 25, 0.8);
  border-color: rgba(130, 180, 70, 0.7);
}

.action-btn-dim {
  background: rgba(25, 30, 20, 0.6);
  border-color: rgba(70, 90, 50, 0.4);
  color: #6a7a55;
}

.action-btn-dim:hover {
  background: rgba(35, 40, 25, 0.7);
  border-color: rgba(90, 110, 60, 0.5);
  color: #8a9a70;
}

.rune-result {
  padding: 10px 0 4px;
}

.result-icon {
  font-size: 36px;
  color: #a0c860;
  text-shadow: 0 0 20px rgba(140, 200, 60, 0.6);
}

.result-icon-fail {
  color: #a06060;
  text-shadow: 0 0 20px rgba(160, 60, 60, 0.5);
}

.result-title {
  font-size: 15px;
  font-weight: 700;
  color: #b0d070;
  letter-spacing: 1px;
  margin: 0;
}

.result-reward {
  font-size: 13px;
  color: #90a870;
  text-align: center;
  font-style: italic;
  margin: 0;
  line-height: 1.5;
}

.result-sub {
  font-size: 13px;
  color: #6a7058;
  font-style: italic;
  margin: 0;
}
</style>
