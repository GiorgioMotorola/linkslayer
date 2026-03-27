
/**
 * Build and return a per-enemy intent array for a group encounter.
 * 70% of rounds: one active enemy. 30%: two or more.
 * Active enemies use decideAction() to pick their move (attack, confuse, enrage, etc.)
 */
export function buildGroupIntents(enemies, enrageBonus = 0, decideAction = null) {
  const aliveIndices = enemies.map((_, i) => i).filter(i => enemies[i].currentHP > 0);
  if (aliveIndices.length === 0) return enemies.map(() => ({ action: "dead", damage: null }));

  let activeIndices;
  if (Math.random() < 0.70 || aliveIndices.length === 1) {
    const pick = aliveIndices[Math.floor(Math.random() * aliveIndices.length)];
    activeIndices = new Set([pick]);
  } else {
    const shuffled = [...aliveIndices].sort(() => Math.random() - 0.5);
    const count = Math.floor(Math.random() * (shuffled.length - 1)) + 2;
    activeIndices = new Set(shuffled.slice(0, count));
  }

  return enemies.map((e, i) => {
    if (e.currentHP <= 0) return { action: "dead", damage: null };
    // Consume any forced action before the random active/idle assignment
    // so it's guaranteed to apply regardless of this round's active selection
    if (e.forcedNextAction) {
      const forced = e.forcedNextAction;
      e.forcedNextAction = null;
      return { action: forced, damage: null };
    }
    if (!activeIndices.has(i)) return { action: "idle", damage: null };
    const action = decideAction ? decideAction() : "attack";
    const damage = action === "attack"
      ? Math.floor(Math.random() * (e.maxDamage - e.minDamage + 1)) + e.minDamage + enrageBonus
      : null;
    return { action, damage };
  });
}

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
    enemyIntents,
    enrageBonus,
  } = enemyState;
  const { playerName } = playerState;
  const { log } = utilityFunctions;
  const { formattedTitle, decideEnemyAction, logEnemyAction, onEnemyKilled } = combatFunctions;

  enemyStatusEffects.value = enemyStatusEffects.value.filter((effect) => {
    if (effect.type === "bleed") {
      enemyHP.value -= effect.damage;
      log(
        `<i class="ra ra-dripping-blade"></i> ${formattedTitle.value} is bleeding. ${formattedTitle.value} takes ${effect.damage} additional damage.`
      );
    } else if (effect.type === "poison") {
      enemyHP.value -= effect.damage;
      log(
        `<i class="ra ra-skull"></i> ${formattedTitle.value} is poisoned. ${formattedTitle.value} takes ${effect.damage} poison damage.`
      );
    } else if (effect.type === "fire") {
      enemyHP.value -= effect.damage;
      log(`<i class="ra ra-fire"></i> ${formattedTitle.value} is on fire! Takes ${effect.damage} burn damage.`);
    } else if (effect.type === "weaken") {
      const turnsLeft = effect.duration - 1;
      if (turnsLeft > 0) {
        log(`<i class="ra ra-aura"></i> ${formattedTitle.value} is weakened (-${effect.damageReduction} dmg, ${turnsLeft} turn${turnsLeft === 1 ? "" : "s"} left).`);
      } else {
        log(`<i class="ra ra-aura"></i> ${formattedTitle.value}'s weakness fades.`);
      }
    } else if (effect.type === "chill") {
      const turnsLeft = effect.duration - 1;
      if (turnsLeft > 0) {
        log(`<i class="ra ra-snowflake"></i> ${formattedTitle.value} is chilled (-${effect.damageReduction} dmg, ${turnsLeft} turn${turnsLeft === 1 ? "" : "s"} left).`);
      } else {
        log(`<i class="ra ra-snowflake"></i> The chill on ${formattedTitle.value} fades.`);
      }
    }

    effect.duration -= 1;
    return effect.duration > 0;
  });

  if (enemyHP.value <= 0) {
    log(`<i class="ra ra-skull"></i> ${playerName.value} defeated ${formattedTitle.value}`);
    onEnemyKilled?.(encounter.value?.enemy);
    return;
  }

  // ── Assign per-enemy intents (Slay the Spire style) ──────────────────────
  const enc = encounter.value;
  const enemies = enc?.enemies;
  const bonus = enrageBonus?.value ?? 0;

  if (enemyIsStunned.value) {
    log(`<i class="ra ra-campfire"></i> ${formattedTitle.value} is stunned and skips their turn.`);
    enemyIsStunned.value = false;
    // For multi-enemy: immediately assign next-round intents so the UI never shows "···"
    if (enemies && enemies.length > 1) {
      const intents = buildGroupIntents(enemies, bonus, decideEnemyAction);
      if (enemyIntents) enemyIntents.value = intents;
      const targetIdx = enc.targetIndex ?? 0;
      const targetIntent = intents[targetIdx];
      enemyNextAction.value = targetIntent?.action ?? "idle";
      nextEnemyAttack.value = targetIntent?.damage ?? null;
      logEnemyAction(enemyNextAction, nextEnemyAttack);
    } else {
      enemyNextAction.value = "stunned";
      if (enemyIntents) enemyIntents.value = [];
    }
    return;
  }

  if (enemies && enemies.length > 1) {
    const intents = buildGroupIntents(enemies, bonus, decideEnemyAction);
    if (enemyIntents) enemyIntents.value = intents;

    // Sync active target's intent into the existing single-enemy fields
    const targetIdx = enc.targetIndex ?? 0;
    const targetIntent = intents[targetIdx];
    enemyNextAction.value = targetIntent?.action ?? "idle";
    nextEnemyAttack.value = targetIntent?.damage ?? null;

  } else {
    // Single-enemy path — original logic
    if (enemyIntents) enemyIntents.value = [];
    const tripChance = 0.1;
    const rand = Math.random();

    if (rand < tripChance) {
      enemyNextAction.value = "trip";
      nextEnemyAttack.value = null;
    } else {
      const action = decideEnemyAction();
      enemyNextAction.value = action;

      if (action === "attack") {
        const currentEnemyData = enc?.enemy;
        if (currentEnemyData) {
          nextEnemyAttack.value =
            Math.floor(Math.random() * (currentEnemyData.maxDamage - currentEnemyData.minDamage + 1)) +
            currentEnemyData.minDamage + bonus;
        } else {
          nextEnemyAttack.value = Math.floor(Math.random() * 3) + 1 + bonus;
        }
      } else {
        nextEnemyAttack.value = null;
      }
    }
  }

  logEnemyAction(enemyNextAction, nextEnemyAttack);
}
