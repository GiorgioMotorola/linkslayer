// combat.js

export function handleCombatAction({ player, enemy, state, utils, itemEffects = {} }) {
  const {
    playerHP,
    playerClass,
    specialUsesLeft,
    weaponBonus,
    shieldBonus,
    playerName,
    action: playerAction,
    effectiveMaxHP,
    totalSpecialsUsed,
  } = player;

  const {
    enemyHP,
    encounter,
    nextEnemyAttack,
    enemyNextAction,
    enemyIsStunned,
    enemyStatusEffects,
  } = enemy;

  const {
    serratedDaggerActive,
    luckyFleeActive,
    wardingShieldHitsRemaining,
  } = itemEffects;

  const {
    log,
    formattedTitle,
    DEFAULT_ENEMY_HP,
    combatWinsSinceLastCapIncrease,
    hpCapBonus,
  } = state;

  const {
    clearTimer,
    setDefeated,
    handleLootDrop,
    markBossDefeated,
    gotoEnemyTurn,
  } = utils;

  const isBossFromState = state.isBoss;

  const currentEffectiveMaxHP = player.effectiveMaxHP;

  let currentEnemyDamage = nextEnemyAttack.value;
  if (typeof currentEnemyDamage !== "number" || isNaN(currentEnemyDamage)) {
    console.warn(
      "nextEnemyAttack.value is not a number, defaulting to 1.",
      currentEnemyDamage
    );
    currentEnemyDamage = 1;
  }

  let damageToPlayer = 0;
  let damageToEnemy = 0;
  let skipEnemyCurrentTurn = false;
  let playerDefendedThisTurn = false;

  if (playerAction === "attack_steady" || playerAction === "attack_power" || playerAction === "attack_reckless") {
    let randomDamage = Math.floor(Math.random() * 5) + 2;
    if (playerClass.value.name === "Fighter") randomDamage += 1;
    if (playerClass.value.name === "Rogue" && Math.random() < 0.25) {
      randomDamage += 3;
      log(
        `<span class="player-name">${playerName.value}</span> lands a critical strike.`
      );
    }
    if (weaponBonus.value > 0) {
      randomDamage += weaponBonus.value;
    }

    let damageMultiplier = 1.0;
    let attackName = "strikes";
    let hitThreshold = null; // null = auto-hit (steady)

    if (playerAction === "attack_power") {
      damageMultiplier = 1.5;
      attackName = "lands a power strike";
      hitThreshold = 7; // needs 7+ on d20 (70%)
    } else if (playerAction === "attack_reckless") {
      damageMultiplier = 2.0;
      attackName = "swings recklessly";
      hitThreshold = 13; // needs 13+ on d20 (40%)
    }

    let didHit = true;
    if (hitThreshold !== null) {
      const roll = Math.floor(Math.random() * 20) + 1;
      didHit = roll >= hitThreshold;
      utils.onDiceRoll?.({ roll, threshold: hitThreshold, didHit });
      const dieClass = didHit ? "hit" : "miss";
      const dieFace = `<span class="dice-face ${dieClass}">${roll}</span>`;
      log(
        `🎲 ${dieFace} (need ${hitThreshold}+) — ${didHit ? "Hit!" : "Miss!"}`
      );
    }

    if (didHit) {
      damageToEnemy = Math.floor(randomDamage * damageMultiplier);
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> ${attackName} and hits ${formattedTitle} for ${damageToEnemy} damage.`
      );
      if (serratedDaggerActive?.value && enemyStatusEffects) {
        enemyStatusEffects.value.push({ type: "bleed", damage: 1, duration: 2 });
        serratedDaggerActive.value = false;
        log(`🩸 The serrated edge opens a wound — ${formattedTitle} begins to Bleed.`);
      }
    } else {
      damageToEnemy = 0;
      const missPenalty = playerAction === "attack_reckless" ? 2 : 1;
      playerHP.value = Math.max(playerHP.value - missPenalty, 0);
      log(
        `💨 <span class="player-name">${playerName.value}</span> ${attackName} but misses — ${formattedTitle} seizes the opening and deals ${missPenalty} damage.`
      );
    }
  } else if (playerAction === "special") {
    if (specialUsesLeft.value <= 0) {
      log(
        `<span class="player-name">${playerName.value}</span> is out of ${playerClass.value.special} charges.`
      );
      return;
    }
    specialUsesLeft.value--;
    if (totalSpecialsUsed) {
      totalSpecialsUsed.value++;
    }
    const cls = playerClass.value.name;
    const specialName = playerClass.value.special;

    let baseSpecialDamage = 0;
    let effect;

    if (cls === "Fighter") {
      baseSpecialDamage = 8;
      damageToEnemy = baseSpecialDamage;
      log(
        `⚔️ <span class="player-name">${playerName.value}</span> unleashes ${specialName} for ${baseSpecialDamage} damage.`
      );
    } else if (cls === "Wizard") {
      effect = playerClass.value.specialEffect(enemyHP.value, playerHP.value);
      baseSpecialDamage = effect.wizardDamage;
      damageToEnemy = baseSpecialDamage;
      log(
        `🔥 <span class="player-name">${
          playerName.value
        }</span> casts ${specialName}, dealing ${baseSpecialDamage} damage.${
          effect.stunned ? ` The enemy is stunned.` : ""
        }`
      );
      if (effect.stunned) {
        enemyIsStunned.value = true;
        enemyNextAction.value = null;
        skipEnemyCurrentTurn = true;
      }
    } else if (cls === "Rogue") {
      effect = playerClass.value.specialEffect(enemyHP.value, DEFAULT_ENEMY_HP);
      baseSpecialDamage = effect.rogueDamage;
      damageToEnemy = baseSpecialDamage;
      damageToPlayer = 0;
      skipEnemyCurrentTurn = true;

      log(
        `🗡️ <span class="player-name">${playerName.value}</span> disappears and executes ${specialName} for ${baseSpecialDamage} damage.`
      );
    } else if (cls === "Paladin") {
      baseSpecialDamage = 5;
      damageToEnemy = baseSpecialDamage;

      effect = playerClass.value.specialEffect(
        enemyHP.value,
        playerHP.value,
        effectiveMaxHP.value
      );
      playerHP.value = effect.playerHP;

      log(
        `✨ <span class="player-name">${playerName.value}</span> calls upon ${specialName}, dealing ${baseSpecialDamage} damage and restoring HP.`
      );
    } else if (cls === "Cleric") {
      baseSpecialDamage = 6;
      damageToEnemy = baseSpecialDamage;
      effect = playerClass.value.specialEffect(
        enemyHP.value,
        playerHP.value,
        effectiveMaxHP.value
      );
      playerHP.value = effect.playerHP;

      log(
        `🙏 <span class="player-name">${playerName.value}</span> invokes ${specialName}, healing 5 HP and dealing ${baseSpecialDamage} damage.`
      );
    } else if (cls === "Sorcerer") {
      baseSpecialDamage = 12;
      damageToEnemy = baseSpecialDamage;
      effect = playerClass.value.specialEffect(enemyHP.value, playerHP.value);

      playerHP.value = effect.playerHP;

      log(
        `💥 <span class="player-name">${playerName.value}</span> unleashes ${specialName}, dealing ${baseSpecialDamage} damage but taking recoil.`
      );
    } else {
      log(
        `<span class="player-name">${playerName.value}</span> uses ${specialName}.`
      );
      if (playerClass.value.specialEffect) {
        effect = playerClass.value.specialEffect(
          enemyHP.value,
          playerHP.value,
          effectiveMaxHP.value
        );
        if (typeof effect === "object" && effect !== null) {
          if (effect.playerHP !== undefined) {
            playerHP.value = Math.min(effect.playerHP, effectiveMaxHP.value);
          }
          if (effect.enemyDamage !== undefined) {
            damageToEnemy = effect.enemyDamage;
          }
          if (effect.stunned) {
            enemyIsStunned.value = true;
            enemyNextAction.value = null;
            skipEnemyCurrentTurn = true;
          }
          if (effect.skipEnemyTurn) {
            skipEnemyCurrentTurn = true;
          }
        }
      }
    }
  } else if (playerAction === "defend") {
    playerDefendedThisTurn = true;
  } else if (playerAction === "flee") {
    if (isBossFromState(encounter.value?.enemy)) {
      log(`You cannot flee from ${encounter.value?.enemy?.name}.`);
    } else {
      const guaranteedFlee = luckyFleeActive?.value;
      if (guaranteedFlee) {
        luckyFleeActive.value = false;
        log(`🪙 The Lucky Coin shines! <span class="player-name">${playerName.value}</span> escapes without fail.`);
        encounter.value = null;
        return;
      } else if (Math.random() > 0.7) {
        log(
          `🏃 <span class="player-name">${playerName.value}</span> fled successfully.`
        );
        encounter.value = null;
        return;
      } else {
        log(
          `<span class="player-name">${playerName.value}</span> failed to flee.`
        );
      }
    }
  }

  if (damageToEnemy > 0) {
    let finalDamageToEnemy = damageToEnemy;

    if (
      enemyNextAction.value === "defend" &&
      !(playerAction === "special" && playerClass.value.name === "Rogue")
    ) {
      finalDamageToEnemy = Math.floor(finalDamageToEnemy * 0.5);
      log(
        `🛡️ ${formattedTitle} defends, reducing incoming damage to ${finalDamageToEnemy}HP.`
      );
    }
    enemyHP.value -= finalDamageToEnemy;
    utils.onCombatResult?.({ type: "dealt", amount: finalDamageToEnemy });
  }

  if (enemyHP.value <= 0) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> defeated ${formattedTitle}`
    );
    const defeatedEnemyData = encounter.value?.enemy;
    encounter.value = null;
    handleLootDrop(defeatedEnemyData);

    combatWinsSinceLastCapIncrease.value++;
    if (combatWinsSinceLastCapIncrease.value >= 5) {
      hpCapBonus.value += 10;

      log(
        `🎉 You have gained experience from defeating the evil in this land and your maximum HP increased by <strong>10</strong>. New max HP: ${effectiveMaxHP.value}`
      );
      combatWinsSinceLastCapIncrease.value = 0;
      playerHP.value = Math.min(playerHP.value, effectiveMaxHP.value);
    }
    return;
  }

  if (!skipEnemyCurrentTurn) {
    if (enemyIsStunned.value) {
      log(`💤 ${formattedTitle} is stunned and skips their turn.`);
      enemyIsStunned.value = false;
      damageToPlayer = 0;
    } else {
      if (enemyNextAction.value === "attack") {
        damageToPlayer = currentEnemyDamage;

        damageToPlayer = Math.max(
          0,
          damageToPlayer - Math.floor(shieldBonus.value / 2)
        );

        if (playerDefendedThisTurn) {
          damageToPlayer = Math.max(0, Math.floor(damageToPlayer * 0.9));
          log(
            `🛡️ <span class="player-name">${playerName.value}</span> defended the attack, taking ${damageToPlayer} damage.`
          );
        } else {
          log(
            `💥 ${formattedTitle} attacks back and <span class="player-name">${playerName.value}</span> takes ${damageToPlayer} damage.`
          );
        }

        if (wardingShieldHitsRemaining?.value > 0) {
          damageToPlayer = Math.max(0, Math.floor(damageToPlayer * 0.5));
          wardingShieldHitsRemaining.value--;
          log(`🛡️ Warding Shield absorbs half the blow! Reduced to ${damageToPlayer} damage. (${wardingShieldHitsRemaining.value} hits remaining)`);
          if (wardingShieldHitsRemaining.value <= 0) {
            log(`🛡️ The Warding Shield shatters.`);
          }
        }
      } else if (enemyNextAction.value === "trip") {
        damageToPlayer = 0;
      } else if (enemyNextAction.value === "flee") {
        log(`🏃 ${formattedTitle} flees.`);
        encounter.value = null;
        return;
      } else if (enemyNextAction.value === "defend") {
        damageToPlayer = 0;
      }
    }
  } else {
    damageToPlayer = 0;
  }

  if (typeof damageToPlayer === "number" && !isNaN(damageToPlayer)) {
    playerHP.value = Math.max(playerHP.value - damageToPlayer, 0);
    if (damageToPlayer > 0) utils.onCombatResult?.({ type: "taken", amount: damageToPlayer });
  } else {
    console.error(
      "ERROR: damageToPlayer is not a valid number, defaulting to 0 damage.",
      damageToPlayer
    );
    playerHP.value = Math.max(playerHP.value - 0, 0);
  }

  if (playerHP.value <= 0) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> was defeated.`
    );
    encounter.value = null;
    clearTimer();
    setDefeated();
    return;
  }

  gotoEnemyTurn();
}