// src/composables/useGameFlow.js

import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { getRandomChain } from "@/utils/randomPair";

export function useGameFlow() {
  // Journey & Chain
  const journeyLength = ref(3);
  const chain = getRandomChain(journeyLength.value);
  const current = ref(chain[0]);
  const currentTargetIndex = ref(0);
  const path = ref([current.value]);

  // Computed properties for formatted names
  const formattedStart = computed(() => chain[0]?.replaceAll("_", " ") ?? "");
  const formattedTitle = computed(
    () => current.value?.replaceAll("_", " ") ?? ""
  );

  // Clicks & Shortcuts
  const clickCount = ref(0);
  const shortcutsUsedCount = ref(0);

  // Timer
  const timer = ref(0);
  let timerInterval = null;

  const formattedTimer = computed(() => {
    const minutes = Math.floor(timer.value / 60);
    const seconds = timer.value % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  });

  // Game State
  const defeated = ref(false);
  const isLoadingGame = ref(false);

  // Boss State
  const bossSpawned = ref(false);
  const bossDefeated = ref(false);
  const selectedBossType = ref("");
  const bossOverlay = ref(false);
  const hasReachedFinalArticle = ref(false);

  // Combat & Progression
  const combatEncountersFought = ref(0);
  const combatWinsSinceLastCapIncrease = ref(0);
  const hpCapBonus = ref(0);

  // Encounters tracking
  const seenLoreEncounters = ref([]);
  const seenNPCEncounters = ref([]);

  // Enemy difficulty
  const enemyDifficultyLevel = ref(0);

  // Game completion check
  const isGameComplete = computed(() => {
    return (
      current.value === chain[journeyLength.value - 1] && bossDefeated.value
    );
  });

  // Lifecycle - start timer
  onMounted(() => {
    timerInterval = setInterval(() => {
      timer.value++;
    }, 1000);
  });

  onBeforeUnmount(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });

  function resetGame() {
    isLoadingGame.value = true;
    location.reload();
  }

  function markBossDefeated() {
    bossDefeated.value = true;
    current.value = chain[journeyLength.value - 1];
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    bossOverlay.value = false;
  }

  return {
    // Journey & Chain
    journeyLength,
    chain,
    current,
    currentTargetIndex,
    path,
    formattedStart,
    formattedTitle,

    // Clicks
    clickCount,
    shortcutsUsedCount,

    // Timer
    timer,
    timerInterval,
    formattedTimer,

    // Game State
    defeated,
    isLoadingGame,
    isGameComplete,

    // Boss State
    bossSpawned,
    bossDefeated,
    selectedBossType,
    bossOverlay,
    hasReachedFinalArticle,

    // Combat & Progression
    combatEncountersFought,
    combatWinsSinceLastCapIncrease,
    hpCapBonus,

    // Encounters
    seenLoreEncounters,
    seenNPCEncounters,

    // Difficulty
    enemyDifficultyLevel,

    // Functions
    resetGame,
    markBossDefeated,
  };
}
