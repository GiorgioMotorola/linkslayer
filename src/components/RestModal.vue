<template>
  <div class="rest-overlay" :class="overlayClass" v-if="props.showRestModal">
    <div class="transition-fade" :class="{ active: isTransitioning }"></div>
    <div class="rest-modal" :class="modalClass">

      <div class="rest-icon">{{ restIcon }}</div>
      <div class="rest-modal-phrase">{{ displayPhrase }}</div>

      <div v-if="shouldShowLongRest && !tavernView" class="danger-warning">
        Enemies will be stronger when you wake up...
      </div>

      <div class="rest-options">
        <button
          v-if="shouldShowShortRest"
          @click="handleShortRest"
          :disabled="shortRestDone"
        >
          🔥 Short Rest — gain +20 HP
        </button>

        <button
          v-if="shouldShowShortRest && props.specialTier < 3"
          @click="handleOffer"
          :disabled="hasOfferedThisRest || props.playerGold < props.nextOfferingCost"
          class="offering-button"
        >
          <span class="offering-main">🙏 Offer {{ props.nextOfferingCost }}g to the Gods — upgrade your Special</span>
          <span class="offering-sub">
            Offering bowl:
            <span v-for="i in 3" :key="i" class="pot-dot" :class="{ filled: i <= props.offeringPot }">{{ i <= props.offeringPot ? '●' : '○' }}</span>
            {{ props.offeringPot }}/3
            <span v-if="props.specialTier === 1"> — Tier 1 → 2</span>
            <span v-if="props.specialTier === 2"> — Tier 2 → 3</span>
          </span>
        </button>

        <button v-if="shouldShowShortRest" @click="handleContinue" class="close-action-btn">
          Continue On →
        </button>
        <template v-if="shouldShowLongRest && tavernView">

          <button v-if="!hasBeer" @click="orderBeer" :disabled="props.playerGold < 10">
            🍺 Order a beer (10g)
          </button>

          <button
            v-if="hasBeer"
            @click="takeSip"
            class="sip-button"
            :class="{ 'sip-cooling': sipCooldown }"
            :style="sipFillStyle"
            :disabled="sipCooldown"
          >
            Take a sip
            <span class="sip-sub">
              <template v-if="sipCooldown">...</template>
              <template v-else>+1 HP · {{ sipsRemaining }} sip{{ sipsRemaining !== 1 ? 's' : '' }} remaining</template>
            </span>
          </button>

          <button
            v-if="currentMeal && !mealOrdered"
            @click="orderMeal"
            :disabled="props.playerGold < 15"
          >
            🍽️ {{ currentMeal.name }} (15g)
            <span class="assemble-sub">{{ currentMeal.desc }}</span>
          </button>

          <button
            v-if="mealOrdered && mealBitesRemaining > 0"
            @click="takeBite"
            class="sip-button"
            :class="{ 'sip-cooling': mealCooldown }"
            :style="mealFillStyle"
            :disabled="mealCooldown"
          >
            Take a bite
            <span class="sip-sub">
              <template v-if="mealCooldown">...</template>
              <template v-else>+12 HP · {{ mealBitesRemaining }} bite{{ mealBitesRemaining !== 1 ? 's' : '' }} remaining</template>
            </span>
          </button>

          <button @click="$emit('open-die-slayer')" :disabled="props.playerGold < 5">
            🎲 Play Die Slayer
          </button>
          <button
            v-if="props.questComplete && !props.questTurnedIn"
            @click="$emit('turn-in-quest')"
            class="quest-turnin-btn"
          >
            📜 Turn In: The Growling Dark
            <span class="assemble-sub">You've slain the bear. Claim your 50g reward.</span>
          </button>

          <div v-else-if="props.questTurnedIn" class="quest-taken-note">
            ✓ The Growling Dark — complete.
          </div>

          <div v-else-if="props.questScrolls > 0" class="quest-taken-note">
            📜 Quest scroll is in your backpack.
          </div>

          <div v-else-if="props.questTaken && !props.questComplete" class="quest-taken-note">
            📜 Quest in progress...
          </div>

          <button
            v-else
            @click="takeQuest"
          >
            📜 The Growling Dark
            <span class="assemble-sub">A weathered notice tacked to the wall. Something stirs in the cave near town...</span>
          </button>

          <button @click="returnToCampsite" class="close-action-btn">
            ← Return to your campsite
          </button>

        </template>

        <template v-if="shouldShowLongRest && !tavernView">

          <button
            @click="handleLongRest"
            :disabled="longRestDone"
          >
            🌙 Long Rest — restore 35 HP and gain +1 class ability
          </button>

          <button
            @click="handleAssemble('weapon')"
            :disabled="(props.weaponPieces || 0) < 2"
          >
            🛠️ Assemble Weapon Upgrade
            <span class="assemble-sub">{{ props.weaponPieces || 0 }} piece{{ (props.weaponPieces || 0) !== 1 ? 's' : '' }} — need 2</span>
          </button>

          <button
            @click="handleAssemble('defense')"
            :disabled="(props.defensePieces || 0) < 2"
          >
            🛡️ Assemble Defense Upgrade
            <span class="assemble-sub">{{ props.defensePieces || 0 }} piece{{ (props.defensePieces || 0) !== 1 ? 's' : '' }} — need 2</span>
          </button>

          <button @click="handleSleep" class="close-action-btn sleep-btn">
            Drift Off to Sleep…
          </button>

          <button @click="goToTavern" class="close-action-btn tavern-btn">
            Head to The Lighthouse Tavern →
          </button>

        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { getRandomRestPhrase, getRandomTavernPhrase, getRandomSipPhrase, getRandomTavernMeal } from "../utils/restPhrases.js";

const props = defineProps({
  showRestModal: Boolean,
  shortRestsUsed: Number,
  longRestsUsed: Number,
  weaponPieces: { type: Number, default: 0 },
  defensePieces: { type: Number, default: 0 },
  restModalCount: Number,
  specialTier: { type: Number, default: 1 },
  offeringPot: { type: Number, default: 0 },
  playerGold: { type: Number, default: 0 },
  nextOfferingCost: { type: Number, default: 10 },
  questScrolls: { type: Number, default: 0 },
  questTaken: { type: Boolean, default: false },
  questComplete: { type: Boolean, default: false },
  questTurnedIn: { type: Boolean, default: false },
});

const emit = defineEmits(["rest", "assemble-upgrade", "offer", "sleep", "order-beer", "order-meal", "open-die-slayer", "take-quest", "turn-in-quest", "sip-beer", "bite-meal"]);

const currentRestPhrase = ref("");
const tavernPhrase = ref("");
const currentSipScene = ref("");
const hasOfferedThisRest = ref(false);
const shortRestDone = ref(false);
const longRestDone = ref(false);
const tavernView = ref(false);
const isTransitioning = ref(false);
const hasBeer = ref(false);
const sipsRemaining = ref(0);
const sipCooldown = ref(false);
const currentMeal = ref(null);
const mealOrdered = ref(false);
const mealBitesRemaining = ref(0);
const mealCooldown = ref(false);

const sipFillStyle = computed(() => {
  const pct = (sipsRemaining.value / 10) * 100;
  return {
    background: `linear-gradient(to right, rgba(195, 130, 15, 0.38) 0%, rgba(195, 130, 15, 0.38) ${pct}%, rgba(35, 14, 3, 0.65) ${pct}%, rgba(35, 14, 3, 0.65) 100%)`,
  };
});

const mealFillStyle = computed(() => {
  const pct = (mealBitesRemaining.value / 2) * 100;
  return {
    background: `linear-gradient(to right, rgba(160, 80, 20, 0.40) 0%, rgba(160, 80, 20, 0.40) ${pct}%, rgba(35, 14, 3, 0.65) ${pct}%, rgba(35, 14, 3, 0.65) 100%)`,
  };
});

watch(
  () => props.showRestModal,
  (newValue) => {
    if (newValue) {
      currentRestPhrase.value = getRandomRestPhrase();
      tavernPhrase.value = getRandomTavernPhrase();
      currentSipScene.value = "";
      hasOfferedThisRest.value = false;
      shortRestDone.value = false;
      longRestDone.value = false;
      tavernView.value = false;
      hasBeer.value = false;
      sipsRemaining.value = 0;
      sipCooldown.value = false;
      currentMeal.value = getRandomTavernMeal();
      mealOrdered.value = false;
      mealBitesRemaining.value = 0;
      mealCooldown.value = false;
    }
  },
  { immediate: true }
);

const shouldShowLongRest = computed(() => props.restModalCount % 2 === 0);
const shouldShowShortRest = computed(() => props.restModalCount % 2 !== 0);

const overlayClass = computed(() => {
  if (shouldShowShortRest.value) return "overlay-campfire";
  return tavernView.value ? "overlay-tavern" : "overlay-night";
});

const modalClass = computed(() => {
  if (shouldShowShortRest.value) return "modal-campfire";
  return tavernView.value ? "modal-tavern" : "modal-night";
});

const restIcon = computed(() => {
  if (shouldShowShortRest.value) return "🔥";
  return tavernView.value ? "🍺" : "🌙";
});

const displayPhrase = computed(() => {
  if (!shouldShowLongRest.value) return currentRestPhrase.value;
  if (!tavernView.value) return currentRestPhrase.value;
  if (currentSipScene.value) return currentSipScene.value;
  return tavernPhrase.value;
});

const handleShortRest = () => {
  shortRestDone.value = true;
  emit("rest", "short");
};

const handleLongRest = () => {
  longRestDone.value = true;
  emit("rest", "long");
};

const handleContinue = () => {
  emit("rest", "continue");
};

const handleSleep = () => {
  emit("sleep");
};

const handleAssemble = (type) => {
  emit("assemble-upgrade", type);
};

const handleOffer = () => {
  hasOfferedThisRest.value = true;
  emit("offer");
};

const orderBeer = () => {
  hasBeer.value = true;
  sipsRemaining.value = 10;
  currentSipScene.value = "";
  emit("order-beer");
};

const orderMeal = () => {
  mealOrdered.value = true;
  mealBitesRemaining.value = 2;
  emit("order-meal");
};

const takeBite = () => {
  emit("bite-meal");
  mealBitesRemaining.value--;
  if (mealBitesRemaining.value === 0) return;
  mealCooldown.value = true;
  setTimeout(() => { mealCooldown.value = false; }, 3000);
};

const takeSip = () => {
  emit("sip-beer");
  currentSipScene.value = getRandomSipPhrase();
  sipsRemaining.value--;
  if (sipsRemaining.value === 0) {
    hasBeer.value = false;
    return;
  }
  sipCooldown.value = true;
  setTimeout(() => { sipCooldown.value = false; }, 3000);
};

const goToTavern = async () => {
  isTransitioning.value = true;
  await new Promise(r => setTimeout(r, 350));
  tavernView.value = true;
  currentSipScene.value = "";
  await new Promise(r => setTimeout(r, 30));
  isTransitioning.value = false;
};

const takeQuest = () => {
  emit("take-quest");
};

const returnToCampsite = async () => {
  isTransitioning.value = true;
  await new Promise(r => setTimeout(r, 350));
  tavernView.value = false;
  currentSipScene.value = "";
  await new Promise(r => setTimeout(r, 30));
  isTransitioning.value = false;
};
</script>

<style scoped>
* {
  font-family: "IBM Plex Sans", sans-serif;
  font-optical-sizing: auto;
}

.rest-overlay {
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

@keyframes fade-in-overlay {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.overlay-campfire {
  background: linear-gradient(
    to bottom,
    rgba(18, 8, 2, 0.93),
    rgba(38, 18, 6, 0.9),
    rgba(22, 10, 3, 0.78)
  );
}

.overlay-tavern {
  background: linear-gradient(
    to bottom,
    rgba(16, 8, 1, 0.95),
    rgba(32, 17, 4, 0.92),
    rgba(20, 10, 2, 0.84)
  );
}

.overlay-night {
  background:
    radial-gradient(ellipse at 20% 15%, rgba(255,255,200,0.07) 1px, transparent 1px),
    radial-gradient(ellipse at 55% 8%,  rgba(255,255,200,0.06) 1px, transparent 1px),
    radial-gradient(ellipse at 78% 20%, rgba(255,255,200,0.05) 1px, transparent 1px),
    radial-gradient(ellipse at 35% 30%, rgba(255,255,200,0.04) 1px, transparent 1px),
    radial-gradient(ellipse at 88% 12%, rgba(255,255,200,0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(4,6,22,0.96), rgba(8,12,38,0.93), rgba(6,9,28,0.82));
}

.rest-modal {
  padding: 2rem;
  border-radius: 12px;
  text-align: start;
  max-width: 700px;
  width: 90%;
  animation: pop-in 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

@keyframes pop-in {
  from { transform: scale(0.85); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

.modal-campfire {
  background: rgba(28, 12, 4, 0.88);
  border: 1px solid rgba(200, 95, 18, 0.55);
  box-shadow: 0 0 35px rgba(200, 95, 18, 0.18), 0 8px 28px rgba(0,0,0,0.65);
}

.modal-campfire .rest-modal-phrase {
  border-bottom-color: rgba(200, 95, 18, 0.4);
}

.modal-campfire button {
  border-color: rgba(170, 80, 15, 0.5);
  background: rgba(38, 16, 4, 0.65);
  color: #e8c890;
}

.modal-campfire button:hover:not(:disabled) {
  background: rgba(180, 85, 15, 0.22);
  border-color: rgba(230, 130, 35, 0.75);
  color: #f5d898;
  opacity: 1;
}

.modal-tavern {
  background: rgba(20, 10, 3, 0.92);
  border: 1px solid rgba(170, 115, 28, 0.5);
  box-shadow: 0 0 40px rgba(150, 95, 15, 0.16), 0 8px 28px rgba(0,0,0,0.65);
}

.modal-tavern .rest-modal-phrase {
  border-bottom-color: rgba(170, 115, 28, 0.4);
}

.modal-tavern button {
  border-color: rgba(150, 100, 22, 0.5);
  background: rgba(35, 14, 3, 0.65);
  color: #e8c890;
}

.modal-tavern button:hover:not(:disabled) {
  background: rgba(165, 100, 18, 0.22);
  border-color: rgba(210, 145, 38, 0.75);
  color: #f5d898;
  opacity: 1;
}

.modal-tavern .close-action-btn {
  border-color: rgba(210, 145, 35, 0.7) !important;
  color: #f5d060 !important;
}

.modal-night {
  background: rgba(6, 10, 32, 0.9);
  border: 1px solid rgba(80, 105, 210, 0.5);
  box-shadow: 0 0 45px rgba(55, 80, 190, 0.18), 0 8px 28px rgba(0,0,0,0.75);
}

.modal-night .rest-modal-phrase {
  border-bottom-color: rgba(80, 105, 210, 0.4);
}

.modal-night button {
  border-color: rgba(70, 95, 190, 0.45);
  background: rgba(10, 15, 45, 0.65);
  color: #b0c4f0;
}

.modal-night button:hover:not(:disabled) {
  background: rgba(60, 85, 190, 0.22);
  border-color: rgba(110, 140, 230, 0.7);
  color: #ccdaff;
  opacity: 1;
}

.rest-icon {
  font-size: 38px;
  text-align: center;
}

@keyframes flicker {
  0%,100% { transform: scale(1)    rotate(-1deg); filter: drop-shadow(0 0 6px rgba(255,140,20,0.7)); }
  25%     { transform: scale(1.08) rotate(2deg);  filter: drop-shadow(0 0 12px rgba(255,160,30,0.9)); }
  50%     { transform: scale(0.95) rotate(-1deg); filter: drop-shadow(0 0 4px rgba(220,100,10,0.6)); }
  75%     { transform: scale(1.05) rotate(1deg);  filter: drop-shadow(0 0 10px rgba(255,150,25,0.8)); }
}

.modal-campfire .rest-icon {
  animation: flicker 2.2s ease-in-out infinite;
}

@keyframes ale-bob {
  0%,100% { transform: translateY(0);    filter: drop-shadow(0 0 6px rgba(200,140,20,0.5)); }
  50%     { transform: translateY(-3px); filter: drop-shadow(0 0 10px rgba(220,160,30,0.7)); }
}

.modal-tavern .rest-icon {
  animation: ale-bob 2.8s ease-in-out infinite;
}

@keyframes moon-float {
  0%,100% { transform: translateY(0);    filter: drop-shadow(0 0 8px rgba(140,165,255,0.65)); }
  50%     { transform: translateY(-5px); filter: drop-shadow(0 0 14px rgba(160,185,255,0.85)); }
}

.modal-night .rest-icon {
  animation: moon-float 3.5s ease-in-out infinite;
}

.rest-modal-phrase {
  text-align: center;
  font-size: 18px;
  color: rgb(214, 215, 216);
  border-bottom: 1px solid rgba(150, 150, 150, 0.35);
  padding-bottom: 1.2rem;
}

button {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  text-align: start;
  border-radius: 8px;
  padding: 0.8rem 1rem;
  font-size: 15px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  position: relative;
}

button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.4);
}

button:disabled::after {
  content: '🚫';
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1em;
  opacity: 0.7;
}

button:disabled:hover {
  cursor: not-allowed;
  opacity: 0.35;
}

.sip-button {
  transition: background 0.5s ease, opacity 0.15s ease-in-out, border-color 0.15s ease-in-out, color 0.15s ease-in-out;
}

.sip-cooling {
  opacity: 0.5;
}

.sip-cooling::after {
  content: none !important;
}

.assemble-sub,
.sip-sub {
  font-size: 0.82em;
  opacity: 0.65;
  margin-top: 2px;
}

.close-action-btn {
  margin-top: 0.4rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.modal-campfire .close-action-btn {
  border-color: rgba(220, 130, 30, 0.7) !important;
  color: #f5d070 !important;
}

.modal-night .close-action-btn {
  border-color: rgba(110, 140, 230, 0.7) !important;
  color: #ccdaff !important;
}

.sleep-btn {
  font-style: italic;
}

.offering-button {
  gap: 0.3rem;
}

.offering-main {
  font-weight: 500;
}

.offering-sub {
  font-size: 0.85em;
  opacity: 0.75;
  letter-spacing: 0.02em;
}

.pot-dot {
  margin: 0 1px;
}

.pot-dot.filled {
  opacity: 1;
}

.transition-fade {
  position: absolute;
  inset: 0;
  background: black;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
  z-index: 1002;
}

.transition-fade.active {
  opacity: 1;
}

.modal-night .tavern-btn {
  border-color: rgba(160, 100, 22, 0.6) !important;
  color: #d4a84b !important;
}

.quest-taken-note {
  font-size: 14px;
  opacity: 0.55;
  padding: 0.5rem 0.2rem;
  font-style: italic;
  color: white;
}

.quest-turnin-btn {
  border-color: rgba(80, 160, 60, 0.55) !important;
  background: rgba(20, 50, 15, 0.6) !important;
  color: #a8e090 !important;
}

.quest-turnin-btn:hover:not(:disabled) {
  background: rgba(40, 100, 25, 0.3) !important;
  border-color: rgba(100, 200, 70, 0.8) !important;
  color: #c4f0a0 !important;
  opacity: 1 !important;
}

.danger-warning {
  color: #e08050;
  font-size: 15px;
  border: 1px solid #7a3a1a;
  border-radius: 6px;
  padding: 0.5rem 0.8rem;
  background: rgba(100, 40, 10, 0.25);
}

.rest-options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 0.5rem;
}

@media screen and (max-width: 600px) {
  .rest-overlay {
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    padding: 0.75rem 0.5rem;
    box-sizing: border-box;
  }

  .rest-modal {
    width: 100%;
    padding: 1rem;
    box-sizing: border-box;
    gap: 0.6rem;
  }

  .rest-icon {
    font-size: 28px;
  }

  .rest-modal-phrase {
    font-size: 15px;
    padding-bottom: 0.8rem;
  }

  button {
    font-size: 13px;
    padding: 0.6rem 0.8rem;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  .rest-options {
    gap: 1.2rem;
    margin-bottom: 0.5rem;
  }
}
</style>
