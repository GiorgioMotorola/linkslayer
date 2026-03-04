import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { getRandomChain } from "@/utils/randomPair";

export function useGameFlow() {
  const journeyLength = ref(3);
  const chain = reactive(getRandomChain(journeyLength.value));
  const current = ref(chain[0]);
  const currentTargetIndex = ref(0);
  const path = ref([current.value]);

  const formattedStart = computed(() => chain[0]?.replaceAll("_", " ") ?? "");
  const formattedTitle = computed(
    () => current.value?.replaceAll("_", " ") ?? ""
  );

  const clickCount = ref(0);
  const shortcutsUsedCount = ref(0);

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

  const defeated = ref(false);
  const isLoadingGame = ref(false);

  const bossSpawned = ref(false);
  const bossDefeated = ref(false);
  const selectedBossType = ref("");
  const bossOverlay = ref(false);
  const hasReachedFinalArticle = ref(false);

  const combatEncountersFought = ref(0);
  const enemiesKilled = ref(0);
  const combatWinsSinceLastCapIncrease = ref(0);
  const hpCapBonus = ref(0);

  const seenLoreEncounters = ref([]);
  const seenNPCEncounters = ref([]);

  const enemyDifficultyLevel = ref(0);

  const isGameComplete = computed(() => {
    return (
      current.value === chain[journeyLength.value - 1] && bossDefeated.value
    );
  });

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
    journeyLength,
    chain,
    current,
    currentTargetIndex,
    path,
    formattedStart,
    formattedTitle,

    clickCount,
    shortcutsUsedCount,

    timer,
    timerInterval,
    formattedTimer,

    defeated,
    isLoadingGame,
    isGameComplete,

    bossSpawned,
    bossDefeated,
    selectedBossType,
    bossOverlay,
    hasReachedFinalArticle,

    combatEncountersFought,
    enemiesKilled,
    combatWinsSinceLastCapIncrease,
    hpCapBonus,

    seenLoreEncounters,
    seenNPCEncounters,

    enemyDifficultyLevel,

    resetGame,
    markBossDefeated,
  };
}
