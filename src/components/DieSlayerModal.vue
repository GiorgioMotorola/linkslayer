<template>
  <div class="die-slayer-overlay">
    <div class="die-slayer-modal">

      <div class="ds-title">⚔ Die Slayer</div>

      <!-- NPC greeting -->
      <div class="ds-npc-bar">
        <span class="ds-npc-name">{{ npc.name }}</span>
        <span class="ds-npc-dialog">{{ currentDialog }}</span>
      </div>

      <!-- Round tracker -->
      <div class="ds-round-tracker">
        <div
          v-for="r in 3"
          :key="r"
          class="ds-round-slot"
          :class="{
            'round-win': roundResults[r - 1] === 'win',
            'round-lose': roundResults[r - 1] === 'lose',
            'round-empty': roundResults[r - 1] === null,
          }"
        >
          <span v-if="roundResults[r - 1] === 'win'">✓</span>
          <span v-else-if="roundResults[r - 1] === 'lose'">✗</span>
          <span v-else>{{ r }}</span>
        </div>
      </div>

      <!-- SETUP PHASE -->
      <div v-if="phase === 'setup'" class="ds-phase">
        <div class="ds-phase-label">Roll your dice — best of 3 rolls</div>
        <div class="ds-dice-row">
          <div
            v-for="(die, i) in playerDice"
            :key="i"
            class="ds-die ds-die-player"
            :class="{ 'ds-die-rolling': isRolling }"
          >
            {{ isRolling ? '?' : die }}
          </div>
        </div>
        <div class="ds-roll-info">Rolls used: {{ rollsUsed }} / 3</div>
        <div class="ds-setup-buttons">
          <button
            class="ds-btn"
            @click="rollDice"
            :disabled="isRolling || rollsUsed >= 3"
          >
            {{ rollsUsed === 0 ? 'Roll Dice' : 'Reroll' }}
          </button>
          <button
            class="ds-btn ds-btn-primary"
            @click="lockIn"
            :disabled="isRolling || rollsUsed === 0"
          >
            Lock In
          </button>
        </div>
      </div>

      <!-- BATTLE PHASE -->
      <div v-if="phase === 'battle'" class="ds-phase">
        <div class="ds-battle-arena">

          <!-- Player dice -->
          <div class="ds-arena-side">
            <div class="ds-arena-label">You</div>
            <div class="ds-dice-row">
              <div
                v-for="(die, i) in playerRemainingDice"
                :key="i"
                class="ds-die ds-die-player"
                :class="{
                  'ds-die-selected': selectedDieIndex === i,
                }"
                @click="selectDie(i)"
              >
                {{ die }}
              </div>
            </div>
          </div>

          <!-- Reveal area -->
          <div class="ds-reveal-area" v-if="revealedPlayerDie !== null || revealedNpcDie !== null">
            <div class="ds-reveal-col">
              <div class="ds-reveal-label">You</div>
              <div
                class="ds-die ds-die-revealed"
                :class="{
                  'ds-die-win': roundOutcome === 'win',
                  'ds-die-lose': roundOutcome === 'lose',
                  'ds-die-rolling': tieRolling,
                }"
              >
                {{ revealedPlayerDie ?? '?' }}
              </div>
            </div>
            <div class="ds-vs">VS</div>
            <div class="ds-reveal-col">
              <div class="ds-reveal-label">{{ npc.name }}</div>
              <div
                class="ds-die ds-die-revealed ds-die-npc"
                :class="{
                  'ds-die-win': roundOutcome === 'lose',
                  'ds-die-lose': roundOutcome === 'win',
                  'ds-die-rolling': tieRolling,
                }"
              >
                {{ revealedNpcDie !== null ? revealedNpcDie : '?' }}
              </div>
            </div>
          </div>

          <!-- NPC dice (face down) -->
          <div class="ds-arena-side">
            <div class="ds-arena-label">{{ npc.name }}</div>
            <div class="ds-dice-row">
              <div
                v-for="(_, i) in npcRemainingDice"
                :key="i"
                class="ds-die ds-die-npc ds-die-hidden"
              >
                ?
              </div>
            </div>
          </div>

        </div>

        <div class="ds-battle-buttons" v-if="battleSubPhase === 'select'">
          <button
            class="ds-btn ds-btn-primary"
            @click="playDie"
            :disabled="selectedDieIndex === null"
          >
            Play Die
          </button>
        </div>

        <div class="ds-tie-notice" v-if="tieWaitingForClick">
          🎲 It's a tie! Both must reroll.
          <button class="ds-btn ds-btn-primary" @click="executeTieReroll">Reroll</button>
        </div>
        <div class="ds-tie-notice" v-if="tieRolling">
          🎲 Rerolling...
        </div>
      </div>

      <!-- END PHASE -->
      <div v-if="phase === 'end'" class="ds-phase ds-end-phase">
        <div class="ds-end-result" :class="gameWon ? 'ds-result-win' : 'ds-result-lose'">
          {{ gameWon ? '⚔ Victory!' : '💀 Defeated!' }}
        </div>
        <div class="ds-end-gold">
          {{ gameWon ? '+10 Gold' : '-5 Gold' }}
        </div>
        <div class="ds-npc-dialog ds-end-dialog">{{ currentDialog }}</div>
        <div class="ds-end-buttons">
          <button
            class="ds-btn ds-btn-primary"
            @click="startGame"
            :disabled="playerGold < 5"
          >
            {{ playerGold >= 5 ? 'Play Again — 5g' : 'Not Enough Gold' }}
          </button>
          <button class="ds-btn" @click="$emit('leave')">
            Return to Shop
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="ds-footer">
        <button class="ds-btn ds-btn-help" @click="showHowToPlay = true">
          How to Play
        </button>
        <button class="ds-btn ds-btn-danger" v-if="phase !== 'end'" @click="leaveGame">
          Leave Table (lose 5g)
        </button>
      </div>

      <!-- How to Play overlay -->
      <div v-if="showHowToPlay" class="ds-htp-overlay" @click.self="showHowToPlay = false">
        <div class="ds-htp-box">
          <div class="ds-htp-title">⚔ How to Play Die Slayer</div>
          <div class="ds-htp-body">
            <p><strong>Entry:</strong> Costs 5 gold to play. Win and take home 10 gold.</p>
            <p><strong>Setup:</strong> Roll your 3 dice. You get up to 3 rolls total — reroll as many times as you like, then lock in your best hand. Your opponent rolls secretly at the same time.</p>
            <p><strong>Battle:</strong> Each round, pick one of your dice to play. Your opponent picks one of theirs. Both are revealed at the same time — highest die wins the round.</p>
            <p><strong>Tie:</strong> If both dice match, both sides reroll that single die until the tie is broken.</p>
            <p><strong>Winning:</strong> First to win 2 out of 3 rounds takes the pot.</p>
            <p><strong>Leaving:</strong> If you leave mid-game, your 5 gold entry fee is forfeit.</p>
          </div>
          <button class="ds-btn ds-btn-primary" @click="showHowToPlay = false">Got it</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const props = defineProps({
  playerGold: { type: Number, required: true },
});

const emit = defineEmits(["gold-change", "leave"]);

// ── NPC data ──────────────────────────────────────────────────────────────
const NPC_NAMES = [
  "Will Baters", "Joe The Party", "Knife The Knife Flynn", "J.T. the T.J.",
  "Chris Guyman", "Connor Conhead", "Jacob Potatoes", "Ron Von Zarovich",
  "Sam Von Zarovich", "Baxter Wolfman",
];

const NPC_DIALOG = {
  greeting: [
    "Care to lose some gold?",
    "I haven't lost in weeks.",
    "Fresh blood.",
    "Five gold. Any freaking Questions?",
    "Don't cry when you lose.",
  ],
  win: [
    "Better luck next time.",
    "My dice, my rules.",
    "You never had a chance.",
    "Come back when you learn to roll.",
    "Easy gold. Thank you.",
  ],
  lose: [
    "...Beginners luck.",
    "I let you win. Obviously.",
    "Don't get used to it.",
    "Fine. Take it.",
    "Play again. I want it back.",
  ],
};

// ── State ─────────────────────────────────────────────────────────────────
const npc = ref({ name: "" });
const currentDialog = ref("");
const phase = ref("idle"); // idle | setup | battle | end

const playerDice = ref([0, 0, 0]);
const playerRemainingDice = ref([]);
const npcDice = ref([0, 0, 0]);
const npcRemainingDice = ref([]);

const rollsUsed = ref(0);
const isRolling = ref(false);

const selectedDieIndex = ref(null);
const revealedPlayerDie = ref(null);
const revealedNpcDie = ref(null);
const roundOutcome = ref(null); // 'win' | 'lose' | null
const roundResults = ref([null, null, null]);
const battleSubPhase = ref("select"); // select | revealing | resolved
const tieRolling = ref(false);
const tieWaitingForClick = ref(false);
const showHowToPlay = ref(false);
const tiePendingPIdx = ref(null);
const tiePendingNIdx = ref(null);
const gameWon = ref(false);

// ── Helpers ───────────────────────────────────────────────────────────────
function rollD6() { return Math.floor(Math.random() * 6) + 1; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pickNpc() {
  npc.value = { name: pickRandom(NPC_NAMES) };
  currentDialog.value = pickRandom(NPC_DIALOG.greeting);
}

// ── Game flow ─────────────────────────────────────────────────────────────
function startGame() {
  emit("gold-change", -5);
  pickNpc();
  rollsUsed.value = 0;
  playerDice.value = [0, 0, 0];
  roundResults.value = [null, null, null];
  selectedDieIndex.value = null;
  revealedPlayerDie.value = null;
  revealedNpcDie.value = null;
  roundOutcome.value = null;
  battleSubPhase.value = "select";
  phase.value = "setup";

  // NPC pre-rolls silently
  const npcRolls = Math.floor(Math.random() * 3) + 1;
  let npcResult = [rollD6(), rollD6(), rollD6()];
  for (let i = 1; i < npcRolls; i++) {
    npcResult = [rollD6(), rollD6(), rollD6()];
  }
  npcDice.value = npcResult;
}

function rollDice() {
  if (isRolling.value || rollsUsed.value >= 3) return;
  isRolling.value = true;

  // Animate rolling
  let ticks = 0;
  const interval = setInterval(() => {
    playerDice.value = [rollD6(), rollD6(), rollD6()];
    ticks++;
    if (ticks >= 8) {
      clearInterval(interval);
      rollsUsed.value++;
      isRolling.value = false;
    }
  }, 80);
}

function lockIn() {
  playerRemainingDice.value = [...playerDice.value];
  npcRemainingDice.value = [...npcDice.value];
  selectedDieIndex.value = null;
  revealedPlayerDie.value = null;
  revealedNpcDie.value = null;
  roundOutcome.value = null;
  battleSubPhase.value = "select";
  phase.value = "battle";
}

// ── Battle ────────────────────────────────────────────────────────────────
function selectDie(i) {
  if (battleSubPhase.value !== "select") return;
  selectedDieIndex.value = i;
}

function playDie() {
  if (selectedDieIndex.value === null) return;
  battleSubPhase.value = "revealing";

  const pDie = playerRemainingDice.value[selectedDieIndex.value];
  const npcIdx = Math.floor(Math.random() * npcRemainingDice.value.length);
  const nDie = npcRemainingDice.value[npcIdx];

  revealedPlayerDie.value = pDie;

  // Pause then reveal NPC die
  setTimeout(() => {
    revealedNpcDie.value = nDie;
    resolveRound(pDie, nDie, selectedDieIndex.value, npcIdx);
  }, 1800);
}

function resolveRound(pDie, nDie, pIdx, nIdx) {
  if (pDie === nDie) {
    // Tie — reroll both
    handleTie(pIdx, nIdx);
    return;
  }

  const won = pDie > nDie;
  roundOutcome.value = won ? "win" : "lose";

  const currentRound = roundResults.value.filter(r => r !== null).length;
  roundResults.value[currentRound] = won ? "win" : "lose";

  playerRemainingDice.value.splice(pIdx, 1);
  npcRemainingDice.value.splice(nIdx, 1);

  const wins = roundResults.value.filter(r => r === "win").length;
  const losses = roundResults.value.filter(r => r === "lose").length;

  setTimeout(() => {
    revealedPlayerDie.value = null;
    revealedNpcDie.value = null;
    roundOutcome.value = null;
    selectedDieIndex.value = null;

    if (wins >= 2 || losses >= 2 || roundResults.value.every(r => r !== null)) {
      endGame(wins >= 2);
    } else {
      battleSubPhase.value = "select";
    }
  }, 2000);
}

function handleTie(pIdx, nIdx) {
  // Pause and wait for player to click Reroll
  tieWaitingForClick.value = true;
  tiePendingPIdx.value = pIdx;
  tiePendingNIdx.value = nIdx;
}

function executeTieReroll() {
  tieWaitingForClick.value = false;
  tieRolling.value = true;
  const pIdx = tiePendingPIdx.value;
  const nIdx = tiePendingNIdx.value;

  let ticks = 0;
  const interval = setInterval(() => {
    revealedPlayerDie.value = rollD6();
    revealedNpcDie.value = rollD6();
    ticks++;
    if (ticks >= 10) {
      clearInterval(interval);
      const pNew = revealedPlayerDie.value;
      const nNew = revealedNpcDie.value;
      tieRolling.value = false;

      if (pNew === nNew) {
        // Still tied — ask player to reroll again
        playerRemainingDice.value[pIdx] = pNew;
        npcRemainingDice.value[nIdx] = nNew;
        handleTie(pIdx, nIdx);
      } else {
        playerRemainingDice.value[pIdx] = pNew;
        npcRemainingDice.value[nIdx] = nNew;
        resolveRound(pNew, nNew, pIdx, nIdx);
      }
    }
  }, 150);
}

function endGame(won) {
  gameWon.value = won;
  if (won) {
    emit("gold-change", 10);
    currentDialog.value = pickRandom(NPC_DIALOG.lose);
  } else {
    currentDialog.value = pickRandom(NPC_DIALOG.win);
  }
  phase.value = "end";
}

function leaveGame() {
  if (phase.value !== "end") {
    // 5g already deducted on start, nothing extra to do
  }
  emit("leave");
}

// ── Init ──────────────────────────────────────────────────────────────────
onMounted(() => {
  startGame();
});
</script>

<style scoped>
.die-slayer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.die-slayer-modal {
  position: relative;
  background: #1a1a1a;
  border: 2px solid #444;
  border-radius: 10px;
  padding: 24px 28px;
  width: 92%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: #eee;
  font-family: inherit;
}

/* Title */
.ds-title {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #e8d080;
  border-bottom: 1px solid #333;
  padding-bottom: 12px;
}

/* NPC bar */
.ds-npc-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.ds-npc-name {
  font-weight: 700;
  color: #c89040;
  white-space: nowrap;
}

.ds-npc-dialog {
  color: #aaa;
  font-style: italic;
}

/* Round tracker */
.ds-round-tracker {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.ds-round-slot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #666;
  transition: all 0.3s ease;
}

.round-win {
  border-color: #4caf50;
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.round-lose {
  border-color: #e53935;
  background: rgba(229, 57, 53, 0.2);
  color: #e53935;
}

/* Dice */
.ds-dice-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.ds-die {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  cursor: default;
  transition: transform 0.1s, box-shadow 0.2s, border-color 0.2s;
  user-select: none;
  border: 2px solid #555;
  background: #111;
  color: #fff;
}

.ds-die-player {
  cursor: pointer;
  border-color: #666;
}

.ds-die-player:hover {
  border-color: #999;
  transform: translateY(-2px);
}

.ds-die-selected {
  border-color: #4a90d9 !important;
  box-shadow: 0 0 10px rgba(74, 144, 217, 0.5);
  transform: translateY(-3px);
}

.ds-die-hidden {
  cursor: default;
  color: #444;
  border-color: #333;
  background: #0d0d0d;
}

.ds-die-rolling {
  animation: die-shake 0.08s ease infinite;
  color: #888;
}

.ds-die-win {
  border-color: #4caf50 !important;
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.5);
}

.ds-die-lose {
  border-color: #e53935 !important;
  box-shadow: 0 0 12px rgba(229, 57, 53, 0.5);
}

.ds-die-revealed {
  width: 60px;
  height: 60px;
  font-size: 26px;
  cursor: default;
}

@keyframes die-shake {
  0%, 100% { transform: rotate(-4deg); }
  50%       { transform: rotate(4deg); }
}

/* Phase label */
.ds-phase-label {
  text-align: center;
  font-size: 12px;
  color: #888;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.ds-roll-info {
  text-align: center;
  font-size: 12px;
  color: #666;
}

/* Battle arena */
.ds-battle-arena {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ds-arena-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.ds-arena-label {
  font-size: 11px;
  color: #888;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.ds-reveal-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-direction: row;
}

.ds-reveal-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ds-reveal-label {
  font-size: 10px;
  color: #888;
  letter-spacing: 1px;
  text-transform: uppercase;
  white-space: nowrap;
}

.ds-vs {
  font-size: 11px;
  color: #555;
  font-weight: 700;
  letter-spacing: 2px;
}

.ds-tie-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 13px;
  color: #e8d080;
  animation: pulse-text 0.6s ease infinite alternate;
}

@keyframes pulse-text {
  from { opacity: 0.5; }
  to   { opacity: 1; }
}

/* Buttons */
.ds-setup-buttons,
.ds-battle-buttons,
.ds-end-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.ds-btn {
  padding: 8px 18px;
  border-radius: 5px;
  border: 1px solid #555;
  background: #2a2a2a;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  font-family: inherit;
}

.ds-btn:hover:not(:disabled) {
  background: #333;
  border-color: #777;
}

.ds-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.ds-btn-primary {
  background: #2a4a2a;
  border-color: #4a8a4a;
  color: #8fd48f;
}

.ds-btn-primary:hover:not(:disabled) {
  background: #335533;
}

.ds-btn-danger {
  border-color: #6a2a2a;
  color: #c07070;
  font-size: 11px;
  padding: 5px 12px;
}

.ds-btn-danger:hover {
  background: #2a1a1a;
}

/* End phase */
.ds-end-phase {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ds-end-result {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
}

.ds-result-win { color: #4caf50; }
.ds-result-lose { color: #e53935; }

.ds-end-gold {
  font-size: 15px;
  color: #e8d080;
  font-weight: 600;
}

.ds-end-dialog {
  font-size: 13px;
}

/* Footer */
.ds-footer {
  display: flex;
  justify-content: center;
  border-top: 1px solid #2a2a2a;
  padding-top: 10px;
}

.ds-phase {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Footer */
.ds-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #2a2a2a;
  padding-top: 10px;
  flex-wrap: wrap;
}

.ds-btn-help {
  font-size: 11px;
  color: #888;
  border-color: #333;
  padding: 5px 12px;
}

.ds-btn-help:hover {
  color: #bbb;
  border-color: #555;
}

/* How to Play overlay */
.ds-htp-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.ds-htp-box {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 22px 26px;
  max-width: 400px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ds-htp-title {
  font-size: 15px;
  font-weight: 700;
  color: #e8d080;
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.ds-htp-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ds-htp-body p {
  font-size: 13px;
  color: #bbb;
  line-height: 1.5;
  margin: 0;
}

.ds-htp-body strong {
  color: #ddd;
}
</style>
