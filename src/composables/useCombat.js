// src/composables/useCombat.js

import { ref, computed } from "vue";
import { isBoss } from "@/utils/bossGenerator";

export function useCombat() {
  // Encounter state
  const encounter = ref(null);
  const encounterMessage = ref("");

  // Enemy state
  const enemyHP = ref(25);
  const nextEnemyAttack = ref(null);
  const enemyNextAction = ref("attack");
  const currentEnemy = ref(null);
  const enemyStatusEffects = ref([]);
  const enemyIsStunned = ref(false);

  // Constants
  const DEFAULT_ENEMY_HP = 25;

  // Computed properties
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

  // Enemy AI decision
  function decideEnemyAction() {
    if (
      !isBoss(encounter.value?.enemy) &&
      enemyHP.value <= 5 &&
      Math.random() < 0.02
    ) {
      return "flee";
    }
    if (Math.random() < 0.2) return "defend";
    return "attack";
  }

  // Close/clear encounter
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
    // Encounter
    encounter,
    encounterMessage,
    inEncounter,
    isInCombat,
    isBossEncounter,

    // Enemy
    enemyHP,
    nextEnemyAttack,
    enemyNextAction,
    currentEnemy,
    enemyStatusEffects,
    enemyIsStunned,
    DEFAULT_ENEMY_HP,

    // Functions
    decideEnemyAction,
    handleCloseEncounter,
  };
}
