<template>
  <div class="die-slayer-overlay">
    <div class="die-slayer-modal">
      <img :src="dieSlayerImg" class="modal-banner-img" alt="" />
      <div class="ds-title">
        <i class="ra ra-sword"></i> Die Slayer
        <span class="ds-gold-display"><i class="ra ra-gold-bar"></i> {{ playerGold }}g</span>
      </div>

      <div class="ds-npc-bar">
        <span class="ds-npc-name">{{ npc.name }}</span>
        <span class="ds-npc-dialog">{{ currentDialog }}</span>
      </div>

      <div class="ds-round-tracker">
        <div
          v-for="r in 5"
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

      <div v-if="phase === 'idle'" class="ds-phase ds-idle-phase">
        <div class="ds-phase-label">Place Your Bet</div>
        <div class="ds-bet-display">{{ bet }}g</div>
        <input
          type="range"
          class="ds-bet-slider"
          v-model.number="bet"
          min="1"
          :max="playerGold"
          step="1"
        />
        <div class="ds-bet-range-labels">
          <span>1g</span>
          <span>{{ playerGold }}g</span>
        </div>
        <button
          class="ds-btn ds-btn-primary"
          @click="startGame"
          :disabled="playerGold < 1"
        >
          Enter Table — {{ bet }}g
        </button>
      </div>

      <div v-if="phase === 'setup'" class="ds-phase">
        <div class="ds-phase-label">Roll your dice</div>
        <div class="ds-dice-row">
          <div
            v-for="(die, i) in playerDice"
            :key="i"
            class="ds-die ds-die-player"
            :class="{ 'ds-die-rolling': isRolling }"
          >
            {{ isRolling || rollsUsed === 0 ? '?' : die }}
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

      <div v-if="phase === 'battle'" class="ds-phase">
        <div class="ds-arena-label">You</div>
        <div class="ds-dice-row">
          <div
            v-for="(die, i) in playerRemainingDice"
            :key="i"
            class="ds-die ds-die-player"
            :class="{
              'ds-die-selected': selectedDieIndex === i,
              'ds-die-played': hiddenPlayerDieIndex === i,
            }"
            @click="selectDie(i)"
          >
            {{ die }}
          </div>
        </div>

        <div class="ds-staging-row">
          <div class="ds-staging-col">
            <div class="ds-staging-label">You</div>
            <div class="ds-staging-box">
              <div
                v-if="revealedPlayerDie !== null"
                class="ds-die ds-die-revealed ds-die-staged"
                :class="{
                  'ds-die-win': roundOutcome === 'win',
                  'ds-die-lose': roundOutcome === 'lose',
                  'ds-die-rolling': tieRolling,
                }"
              >{{ revealedPlayerDie }}</div>
            </div>
          </div>
          <div class="ds-staging-vs">
            <span v-if="revealedPlayerDie !== null && revealedNpcDie !== null" class="ds-vs">VS</span>
          </div>
          <div class="ds-staging-col">
            <div class="ds-staging-label">Them</div>
            <div class="ds-staging-box">
              <div
                v-if="revealedNpcDie !== null"
                class="ds-die ds-die-revealed ds-die-npc ds-die-staged"
                :class="{
                  'ds-die-win': roundOutcome === 'lose',
                  'ds-die-lose': roundOutcome === 'win',
                  'ds-die-rolling': tieRolling,
                }"
              >{{ revealedNpcDie }}</div>
            </div>
          </div>
        </div>

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

        <div class="ds-battle-buttons">
          <button
            class="ds-btn ds-btn-primary"
            @click="playDie"
            :disabled="selectedDieIndex === null || battleSubPhase !== 'select'"
          >
            Play Die
          </button>
        </div>

        <div class="ds-tie-notice" v-if="tieWaitingForClick">
          <i class="ra ra-perspective-dice-random"></i> It's a tie! Both must reroll.
          <button class="ds-btn ds-btn-primary" @click="executeTieReroll">Reroll</button>
        </div>
        <div class="ds-tie-notice" v-if="tieRolling">
          <i class="ra ra-perspective-dice-random"></i> Rerolling...
        </div>
      </div>

      <div v-if="phase === 'end'" class="ds-phase ds-end-phase">
        <div class="ds-end-result" :class="gameWon ? 'ds-result-win' : 'ds-result-lose'">
          {{ gameWon ? '' : '' }}<template v-if="gameWon"><i class="ra ra-sword"></i> Victory!</template><template v-else><i class="ra ra-skull"></i> Defeated!</template>
        </div>
        <div class="ds-end-gold">
          {{ gameWon ? '+' + (bet * 2) + ' Gold' : '-' + bet + ' Gold' }}
        </div>
        <div class="ds-npc-dialog ds-end-dialog">{{ currentDialog }}</div>
        <div class="ds-end-buttons">
          <button
            class="ds-btn ds-btn-primary"
            @click="resetToBet"
            :disabled="playerGold < 1"
          >
            {{ playerGold >= 1 ? 'Play Again' : 'Not Enough Gold' }}
          </button>
          <button class="ds-btn" @click="$emit('leave')">
            Return to the Bar
          </button>
        </div>
      </div>

      <div class="ds-footer">
        <button class="ds-btn ds-btn-help" @click="showHowToPlay = true">
          How to Play
        </button>
        <button class="ds-btn ds-btn-danger" v-if="phase !== 'end'" @click="leaveGame">
          {{ phase === 'idle' ? 'Leave Table' : 'Leave Table (lose ' + bet + 'g)' }}
        </button>
      </div>

      <div v-if="showHowToPlay" class="ds-htp-overlay" @click.self="showHowToPlay = false">
        <div class="ds-htp-box">
          <div class="ds-htp-title"><i class="ra ra-sword"></i> How to Play Die Slayer</div>
          <div class="ds-htp-body">
            <p><strong>Entry:</strong> Bet between 1g and all your gold. Win and take home double your bet.</p>
            <p><strong>Setup:</strong> Roll your 5 dice. You get up to 3 rolls total — reroll as many times as you like, then lock in your best hand. Your opponent rolls secretly at the same time.</p>
            <p><strong>Battle:</strong> Each round, pick one of your dice to play. Your opponent picks one of theirs. Both are revealed at the same time — highest die wins the round.</p>
            <p><strong>Tie:</strong> If both dice match, both sides reroll that single die until the tie is broken.</p>
            <p><strong>Winning:</strong> First to win 3 out of 5 rounds takes the pot.</p>
            <p><strong>Leaving:</strong> If you leave mid-game, your entry bet is forfeit.</p>
          </div>
          <button class="ds-btn ds-btn-primary" @click="showHowToPlay = false">Got it</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

const dieSlayerImg = new URL("../assets/dieslayer-img.jpg", import.meta.url).href;

const props = defineProps({
  playerGold: { type: Number, required: true },
});

const emit = defineEmits(["gold-change", "leave"]);

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

const npc = ref({ name: "" });
const currentDialog = ref("");
const phase = ref("idle"); 

const playerDice = ref([0, 0, 0, 0, 0]);
const playerRemainingDice = ref([]);
const npcDice = ref([0, 0, 0, 0, 0]);
const npcRemainingDice = ref([]);

const rollsUsed = ref(0);
const isRolling = ref(false);

const selectedDieIndex = ref(null);
const hiddenPlayerDieIndex = ref(null);
const revealedPlayerDie = ref(null);
const revealedNpcDie = ref(null);
const roundOutcome = ref(null);
const roundResults = ref([null, null, null, null, null]);
const battleSubPhase = ref("select");
const tieRolling = ref(false);
const tieWaitingForClick = ref(false);
const showHowToPlay = ref(false);
const tiePendingPIdx = ref(null);
const tiePendingNIdx = ref(null);
const gameWon = ref(false);
const bet = ref(5);

function rollD6() { return Math.floor(Math.random() * 6) + 1; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pickNpc() {
  npc.value = { name: pickRandom(NPC_NAMES) };
  currentDialog.value = pickRandom(NPC_DIALOG.greeting);
}

function startGame() {
  emit("gold-change", -bet.value);
  rollsUsed.value = 0;
  playerDice.value = [0, 0, 0, 0, 0];
  roundResults.value = [null, null, null, null, null];
  selectedDieIndex.value = null;
  revealedPlayerDie.value = null;
  revealedNpcDie.value = null;
  roundOutcome.value = null;
  battleSubPhase.value = "select";
  phase.value = "setup";

  const npcRolls = Math.floor(Math.random() * 3) + 1;
  let npcResult = [rollD6(), rollD6(), rollD6(), rollD6(), rollD6()];
  for (let i = 1; i < npcRolls; i++) {
    npcResult = [rollD6(), rollD6(), rollD6(), rollD6(), rollD6()];
  }
  npcDice.value = npcResult;
}

function rollDice() {
  if (isRolling.value || rollsUsed.value >= 3) return;
  isRolling.value = true;

  let ticks = 0;
  const interval = setInterval(() => {
    playerDice.value = [rollD6(), rollD6(), rollD6(), rollD6(), rollD6()];
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

function selectDie(i) {
  if (battleSubPhase.value !== "select") return;
  selectedDieIndex.value = i;
}

function playDie() {
  if (selectedDieIndex.value === null) return;
  battleSubPhase.value = "revealing";

  const pIdx = selectedDieIndex.value;
  const pDie = playerRemainingDice.value[pIdx];
  const npcIdx = Math.floor(Math.random() * npcRemainingDice.value.length);
  const nDie = npcRemainingDice.value[npcIdx];

  revealedPlayerDie.value = pDie;
  hiddenPlayerDieIndex.value = pIdx;
  selectedDieIndex.value = null;

  setTimeout(() => {
    revealedNpcDie.value = nDie;
    resolveRound(pDie, nDie, pIdx, npcIdx);
  }, 1800);
}

function resolveRound(pDie, nDie, pIdx, nIdx) {
  if (pDie === nDie) {
    handleTie(pIdx, nIdx);
    return;
  }

  const won = pDie > nDie;
  roundOutcome.value = won ? "win" : "lose";

  const currentRound = roundResults.value.filter(r => r !== null).length;
  roundResults.value[currentRound] = won ? "win" : "lose";

  playerRemainingDice.value.splice(pIdx, 1);
  npcRemainingDice.value.splice(nIdx, 1);
  hiddenPlayerDieIndex.value = null;

  const wins = roundResults.value.filter(r => r === "win").length;
  const losses = roundResults.value.filter(r => r === "lose").length;

  setTimeout(() => {
    revealedPlayerDie.value = null;
    revealedNpcDie.value = null;
    roundOutcome.value = null;
    selectedDieIndex.value = null;

    if (wins >= 3 || losses >= 3 || roundResults.value.every(r => r !== null)) {
      endGame(wins >= 3);
    } else {
      battleSubPhase.value = "select";
    }
  }, 2000);
}

function handleTie(pIdx, nIdx) {
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
    emit("gold-change", bet.value * 2);
    currentDialog.value = pickRandom(NPC_DIALOG.lose);
  } else {
    currentDialog.value = pickRandom(NPC_DIALOG.win);
  }
  phase.value = "end";
}

function leaveGame() {
  emit("leave");
}

function resetToBet() {
  pickNpc();
  bet.value = Math.min(bet.value, props.playerGold);
  phase.value = "idle";
}

onMounted(() => {
  pickNpc();
  bet.value = Math.min(5, props.playerGold);
});
</script>

<style scoped>
@import "./styles/dieSlayerModalStyles.css";
</style>
