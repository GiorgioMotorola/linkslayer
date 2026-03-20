<template>
  <div class="rest-overlay" :class="overlayClass" v-if="props.showRestModal">
    <div class="transition-fade" :class="{ active: isTransitioning }"></div>
    <div class="rest-modal" :class="modalClass">
      <img v-if="shouldShowShortRest" :src="shortRestImg" class="sr-banner-img" alt="" />
      <img v-else-if="tavernView" :src="tavernImg" class="sr-banner-img" alt="" />
      <img v-else-if="shouldShowLongRest" :src="longRestImg" class="sr-banner-img" alt="" />

      <div v-if="shouldShowLongRest && !tavernView" class="danger-warning">
        Enemies will be stronger when you wake up...
      </div>

      <div class="rest-options">
        <button
          v-if="shouldShowShortRest"
          @click="handleShortRest"
          :disabled="shortRestDone"
          class="sr-btn"
        >
          Short Rest <span class="sr-sub">+20 HP</span>
        </button>

        <button
          v-if="shouldShowShortRest && props.specialTier < 3"
          @click="handleOffer"
          :disabled="hasOfferedThisRest || props.playerGold < props.nextOfferingCost"
          class="sr-btn"
        >
          Offer {{ props.nextOfferingCost }}g to the Gods
          <span class="sr-sub">
            <span v-for="i in 3" :key="i" class="pot-dot" :class="{ filled: i <= props.offeringPot }">{{ i <= props.offeringPot ? "●" : "○" }}</span>
            {{ props.offeringPot }}/3
            <template v-if="props.specialTier === 1"> — Tier 1 → 2</template>
            <template v-if="props.specialTier === 2"> — Tier 2 → 3</template>
          </span>
        </button>

        <button
          v-if="shouldShowShortRest"
          @click="$emit('open-forge')"
          class="sr-btn"
        >
          Go To The Forge <span class="sr-sub">{{ props.scrapMetal || 0 }} scrap available</span>
        </button>

        <button
          v-if="shouldShowShortRest"
          @click="$emit('open-shop')"
          class="sr-btn"
        >
          Visit the Shop
        </button>

        <button
          v-if="shouldShowShortRest"
          @click="handleContinue"
          class="sr-btn sr-continue"
        >
          Continue On
        </button>
        <template v-if="shouldShowLongRest && tavernView">
          <button
            v-if="!hasBeer"
            @click="orderBeer"
            :disabled="props.playerGold < 10"
            class="sr-btn"
          >
            Order a Beer <span class="sr-sub">10g</span>
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
              <template v-else>+1 HP · {{ sipsRemaining }} sip{{ sipsRemaining !== 1 ? "s" : "" }} remaining</template>
            </span>
          </button>

          <button
            v-if="currentMeal && !mealOrdered"
            @click="orderMeal"
            :disabled="props.playerGold < 15"
            class="sr-btn"
          >
            {{ currentMeal.name }} <span class="sr-sub">15g · {{ currentMeal.desc }}</span>
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
              <template v-else>+12 HP · {{ mealBitesRemaining }} bite{{ mealBitesRemaining !== 1 ? "s" : "" }} remaining</template>
            </span>
          </button>

          <button
            @click="$emit('open-die-slayer')"
            :disabled="props.playerGold < 5"
            class="sr-btn"
          >
            Play Die Slayer <span class="sr-sub">5g min</span>
          </button>

          <button
            @click="$emit('open-tavern-shop')"
            class="sr-btn"
          >
            Tavern Fence
          </button>

          <button
            v-if="props.questStatus === 'complete'"
            @click="$emit('turn-in-quest')"
            class="quest-turnin-btn sr-btn"
          >
            Turn In: {{ props.boardQuestName }}
            <span class="sr-sub">{{ props.boardQuestRewardLabel }}</span>
          </button>

          <div v-else-if="props.questStatus === 'done'" class="quest-taken-note">
            ✓ All quests complete.
          </div>

          <div v-else-if="props.questStatus === 'scroll'" class="quest-taken-note">
            Quest scroll is in your backpack.
          </div>

          <div v-else-if="props.questStatus === 'progress'" class="quest-taken-note">
            Quest in progress...
          </div>

          <button v-else-if="props.boardQuestName" @click="takeQuest" class="sr-btn">
            {{ props.boardQuestName }}
            <span class="sr-sub">{{ props.boardQuestHint }}</span>
          </button>

          <button @click="returnToCampsite" class="sr-btn sr-continue">
            Return to campsite
          </button>
        </template>

        <template v-if="shouldShowLongRest && !tavernView">
          <button @click="handleLongRest" :disabled="longRestDone" class="sr-btn">
            {{ longRestLabel }}
            <span class="sr-sub">+{{ longRestHp }} HP · +{{ longRestSpecials }} {{ longRestSpecials === 1 ? "ability" : "abilities" }}</span>
          </button>

          <button @click="goToTavern" class="sr-btn">
            Head to the Tavern
          </button>

          <button @click="handleSleep" class="sr-btn sr-continue">
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
  getRandomSipPhrase,
  getRandomTavernMeal,
} from "../utils/restPhrases.js";
const shortRestImg = new URL("../assets/short-rest.png", import.meta.url).href;
const longRestImg = new URL("../assets/long-rest.jpg", import.meta.url).href;
const tavernImg = new URL("../assets/tavern.jpg", import.meta.url).href;

const props = defineProps({
  showRestModal: Boolean,
  shortRestsUsed: Number,
  longRestsUsed: Number,
  scrapMetal: { type: Number, default: 0 },
  restModalCount: Number,
  isLongRest: { type: Boolean, default: false },
  specialTier: { type: Number, default: 1 },
  offeringPot: { type: Number, default: 0 },
  playerGold: { type: Number, default: 0 },
  nextOfferingCost: { type: Number, default: 10 },
  questStatus: { type: String, default: "none" },
  boardQuestName: { type: String, default: "" },
  boardQuestHint: { type: String, default: "" },
  boardQuestRewardLabel: { type: String, default: "" },
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

const shouldShowLongRest = computed(() => props.isLongRest);
const shouldShowShortRest = computed(() => !props.isLongRest);

const overlayClass = computed(() => {
  if (shouldShowShortRest.value) return "overlay-campfire";
  return tavernView.value ? "overlay-tavern" : "overlay-night";
});

const modalClass = computed(() => {
  if (shouldShowShortRest.value) return "modal-campfire";
  return tavernView.value ? "modal-tavern" : "modal-night";
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
