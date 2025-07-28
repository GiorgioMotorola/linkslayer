// src/utils/enemyTurnHandler.js

import { handleLootDrop } from "@/utils/lootHandler";

export function handleEnemyTurn({
  enemyState,
  playerState,
  gameData,
  utilityFunctions,
  combatFunctions,
}) {
  const {
    enemyStatusEffects,
    enemyHP,
    encounter,
    enemyIsStunned,
    enemyNextAction,
    nextEnemyAttack,
  } = enemyState;
  const { playerName } = playerState;
  const { log } = utilityFunctions;
  const { formattedTitle, decideEnemyAction, logEnemyAction } = combatFunctions;

  enemyStatusEffects.value = enemyStatusEffects.value.filter((effect) => {
    if (effect.type === "bleed") {
      enemyHP.value -= effect.damage;
      log(
        `🩸 ${formattedTitle.value} is bleeding. ${formattedTitle.value} takes ${effect.damage} additional damage.`
      );
    }

    effect.duration -= 1;
    return effect.duration > 0;
  });

  if (enemyHP.value <= 0) {
    log(`💀 ${playerName.value} defeated ${formattedTitle.value}`);
    encounter.value = null;

    handleLootDrop({ playerState, utilityFunctions });
    return;
  }

  if (enemyIsStunned.value) {
    log(`💤 ${formattedTitle.value} is stunned and skips their turn.`);
    enemyNextAction.value = null;
    enemyIsStunned.value = false;
    return;
  }

  const tripChance = 0.1;
  const rand = Math.random();

  if (rand < tripChance) {
    enemyNextAction.value = "trip";
    nextEnemyAttack.value = null;
  } else {
    const action = decideEnemyAction();
    enemyNextAction.value = action;

    if (action === "attack") {
      const currentEnemyData = encounter.value?.enemy;

      if (currentEnemyData) {
        nextEnemyAttack.value =
          Math.floor(
            Math.random() *
              (currentEnemyData.maxDamage - currentEnemyData.minDamage + 1)
          ) + currentEnemyData.minDamage;
      } else {
        console.warn(
          "Enemy data not found for attack. Defaulting to 1-3 damage."
        );
        nextEnemyAttack.value = Math.floor(Math.random() * 3) + 1;
      }
    } else {
      nextEnemyAttack.value = null;
    }
  }
  logEnemyAction();
}