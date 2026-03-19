import { ref, computed, watch } from "vue";
import { isBoss } from "@/utils/bossGenerator";

export function useCombat() {
  const encounter = ref(null);
  const encounterMessage = ref("");

  const enemyHP = ref(25);
  const nextEnemyAttack = ref(null);
  const enemyNextAction = ref("attack");
  const enemyTurnKey = ref(0);
  const currentEnemy = ref(null);
  const enemyStatusEffects = ref([]);
  const enemyIsStunned = ref(false);
  const enrageBonus = ref(0);

  const confusedAction = ref([]);
  const confusedTurnsLeft = ref(0);

  const ironWillUsed = ref(false);
  const bloodpactActive = ref(false);
  const playerEnrageCharges = ref(0); // 0–3; reaches 3 → Enraged available

  const DEFAULT_ENEMY_HP = 25;

  const inEncounter = computed(() => {
    const e = encounter.value;
    if (!e || typeof e !== "object") return false;

    if (e.type === "combat") {
      return e.enemy && typeof e.enemy === "object";
    }

    if (e.type === "npc") {
      return (
        e.npc &&
        typeof e.npc.name === "string" &&
        typeof e.npc.greeting === "string"
      );
    }

    if (e.type === "lore") {
      return e.lore && typeof e.lore.text === "string";
    }

    return false;
  });

  const isInCombat = computed(
    () => encounter.value && encounter.value.type === "combat"
  );

  const isBossEncounter = computed(
    () => isInCombat.value && isBoss(encounter.value.enemy)
  );

  watch(encounter, (newEncounter, oldEncounter) => {
    const wasInCombat = oldEncounter?.type === "combat";
    const isNowInCombat = newEncounter?.type === "combat";
    const isNewEnemy = isNowInCombat && newEncounter?.enemy !== oldEncounter?.enemy;
    const combatEnded = wasInCombat && !isNowInCombat;

    if (isNewEnemy || combatEnded) {
      enemyStatusEffects.value = [];
      enemyIsStunned.value = false;
      enrageBonus.value = 0;
      confusedAction.value = [];
      confusedTurnsLeft.value = 0;
      ironWillUsed.value = false;
      bloodpactActive.value = false;
      playerEnrageCharges.value = 0;
    }
  });

  function decideEnemyAction() {
    const isCurrentBoss = isBoss(encounter.value?.enemy);

    if (!isCurrentBoss && enemyHP.value <= 5 && Math.random() < 0.02) {
      return "flee";
    }

    const roll = Math.random();
    if (!isCurrentBoss && roll < 0.03) return "summon";
    if (roll < 0.08) return "enrage";
    if (roll < 0.13) return "steal";
    if (roll < 0.17) return "confuse";
    if (roll < 0.32) return "defend";
    return "attack";
  }

  function handleCloseEncounter(deps) {
    const { bossDefeated, current, chain, journeyLength, currentTargetIndex, path, timerInterval } = deps;

    encounter.value = null;

    if (bossDefeated.value) {
      current.value = chain[journeyLength.value - 1];
    }

    const lastTitle = path.value[path.value.length - 1];
    if (lastTitle === chain[currentTargetIndex.value + 1]) {
      currentTargetIndex.value++;
    }

    if (lastTitle === chain[journeyLength.value - 1]) {
      clearInterval(timerInterval);
    }
  }

  return {
    encounter,
    encounterMessage,
    inEncounter,
    isInCombat,
    isBossEncounter,

    enemyHP,
    nextEnemyAttack,
    enemyNextAction,
    enemyTurnKey,
    currentEnemy,
    enemyStatusEffects,
    enemyIsStunned,
    enrageBonus,
    DEFAULT_ENEMY_HP,

    confusedAction,
    confusedTurnsLeft,

    ironWillUsed,
    bloodpactActive,
    playerEnrageCharges,

    decideEnemyAction,
    handleCloseEncounter,
  };
}
