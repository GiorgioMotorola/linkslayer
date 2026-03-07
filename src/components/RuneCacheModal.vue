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
  1: { type: "gold", amount: 25, label: "You find 25 gold inside." },
  2: { type: "gold", amount: 40, label: "You find 40 gold inside." },
  3: { type: "gold", amount: 80, label: "You find 80 gold inside." },
  4: { type: "gold", amount: 100, label: "You find 100 gold inside." },
  5: { type: "gold", amount: 150, label: "You find 150 gold inside." },
  6: { type: "gold", amount: 175, label: "You find 175 gold inside." },
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
      // Success — give gold reward for this tier
      rolledReward.value = rewardsByTier[props.tier] ?? rewardsByTier[1];
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
@import "./styles/runeCacheModalStyles.css";
</style>
