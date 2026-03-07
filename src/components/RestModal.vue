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
          :disabled="
            hasOfferedThisRest || props.playerGold < props.nextOfferingCost
          "
          class="offering-button"
        >
          <span class="offering-main"
            >🙏 Offer {{ props.nextOfferingCost }}g to the Gods — upgrade your
            Special</span
          >
          <span class="offering-sub">
            Offering bowl:
            <span
              v-for="i in 3"
              :key="i"
              class="pot-dot"
              :class="{ filled: i <= props.offeringPot }"
              >{{ i <= props.offeringPot ? "●" : "○" }}</span
            >
            {{ props.offeringPot }}/3
            <span v-if="props.specialTier === 1"> — Tier 1 → 2</span>
            <span v-if="props.specialTier === 2"> — Tier 2 → 3</span>
          </span>
        </button>

        <button
          v-if="shouldShowShortRest"
          @click="$emit('open-forge')"
          class="close-action-btn"
        >
          ⚒️ Go To The Forge
          <span class="assemble-sub"
            >{{ props.scrapMetal || 0 }} scrap metal available</span
          >
        </button>

        <button
          v-if="shouldShowShortRest"
          @click="$emit('open-shop')"
          class="close-action-btn shop-btn"
        >
          🛒 Visit the Shop →
        </button>

        <button
          v-if="shouldShowShortRest"
          @click="handleContinue"
          class="close-action-btn"
        >
          Continue On →
        </button>
        <template v-if="shouldShowLongRest && tavernView">
          <button
            v-if="!hasBeer"
            @click="orderBeer"
            :disabled="props.playerGold < 10"
          >
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
              <template v-else
                >+1 HP · {{ sipsRemaining }} sip{{
                  sipsRemaining !== 1 ? "s" : ""
                }}
                remaining</template
              >
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
              <template v-else
                >+12 HP · {{ mealBitesRemaining }} bite{{
                  mealBitesRemaining !== 1 ? "s" : ""
                }}
                remaining</template
              >
            </span>
          </button>

          <button
            @click="$emit('open-die-slayer')"
            :disabled="props.playerGold < 5"
          >
            🎲 Play Die Slayer
          </button>

          <button
            v-if="props.campTier < 3"
            @click="$emit('open-tavern-shop')"
            class="close-action-btn"
          >
            🛒 Camp Supplies →
          </button>
          <button
            v-if="props.questComplete && !props.questTurnedIn"
            @click="$emit('turn-in-quest')"
            class="quest-turnin-btn"
          >
            📜 Turn In: The Growling Dark
            <span class="assemble-sub"
              >You've slain the bear. Claim your 50g reward.</span
            >
          </button>

          <div v-else-if="props.questTurnedIn" class="quest-taken-note">
            ✓ The Growling Dark — complete.
          </div>

          <div v-else-if="props.questScrolls > 0" class="quest-taken-note">
            📜 Quest scroll is in your backpack.
          </div>

          <div
            v-else-if="props.questTaken && !props.questComplete"
            class="quest-taken-note"
          >
            📜 Quest in progress...
          </div>

          <button v-else @click="takeQuest">
            📜 The Growling Dark
            <span class="assemble-sub"
              >A weathered notice tacked to the wall. Something stirs in the
              cave near town...</span
            >
          </button>

          <button @click="returnToCampsite" class="close-action-btn">
            ← Return to your campsite
          </button>
        </template>

        <template v-if="shouldShowLongRest && !tavernView">
          <button @click="handleLongRest" :disabled="longRestDone">
            🌙 {{ longRestLabel }} — restore {{ longRestHp }} HP and gain +{{
              longRestSpecials
            }}
            class {{ longRestSpecials === 1 ? "ability" : "abilities" }}
          </button>

          <button @click="goToTavern" class="close-action-btn tavern-btn">
            Head to The Lighthouse Tavern →
          </button>

          <button @click="handleSleep" class="close-action-btn sleep-btn">
            Drift Off to Sleep…
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import {
  getRandomRestPhrase,
  getRandomTavernPhrase,
  getRandomSipPhrase,
  getRandomTavernMeal,
} from "../utils/restPhrases.js";

const props = defineProps({
  showRestModal: Boolean,
  shortRestsUsed: Number,
  longRestsUsed: Number,
  scrapMetal: { type: Number, default: 0 },
  restModalCount: Number,
  specialTier: { type: Number, default: 1 },
  offeringPot: { type: Number, default: 0 },
  playerGold: { type: Number, default: 0 },
  nextOfferingCost: { type: Number, default: 10 },
  questScrolls: { type: Number, default: 0 },
  questTaken: { type: Boolean, default: false },
  questComplete: { type: Boolean, default: false },
  questTurnedIn: { type: Boolean, default: false },
  campTier: { type: Number, default: 0 },
});

const emit = defineEmits([
  "rest",
  "offer",
  "sleep",
  "order-beer",
  "order-meal",
  "open-die-slayer",
  "take-quest",
  "turn-in-quest",
  "sip-beer",
  "bite-meal",
  "open-shop",
  "open-tavern-shop",
  "open-forge",
]);

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
  { immediate: true },
);

const CAMP_LABELS = [
  "sleep on the ground",
  "sleeping bag",
  "sleeping bag, pillow",
  "sleeping bag, pillow, tent",
];
const longRestLabel = computed(() => {
  const label = CAMP_LABELS[props.campTier] ?? CAMP_LABELS[0];
  return `Long Rest, ${label}`;
});
const longRestHp = computed(() => [20, 25, 30, 50][props.campTier] ?? 20);
const longRestSpecials = computed(() => [1, 1, 2, 2][props.campTier] ?? 1);

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
  setTimeout(() => {
    mealCooldown.value = false;
  }, 3000);
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
  setTimeout(() => {
    sipCooldown.value = false;
  }, 3000);
};

const goToTavern = async () => {
  isTransitioning.value = true;
  await new Promise((r) => setTimeout(r, 350));
  tavernView.value = true;
  currentSipScene.value = "";
  await new Promise((r) => setTimeout(r, 30));
  isTransitioning.value = false;
};

const takeQuest = () => {
  emit("take-quest");
};

const returnToCampsite = async () => {
  isTransitioning.value = true;
  await new Promise((r) => setTimeout(r, 350));
  tavernView.value = false;
  currentSipScene.value = "";
  await new Promise((r) => setTimeout(r, 30));
  isTransitioning.value = false;
};
</script>

<style scoped>
@import "./styles/restModalStyles.css";
</style>
