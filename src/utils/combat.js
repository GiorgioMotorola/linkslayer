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
    specialTier,
    playerGold,
  } = player;

  const {
    enemyHP,
    encounter,
    nextEnemyAttack,
    enemyNextAction,
    enemyIsStunned,
    enemyStatusEffects,
    enrageBonus,
    confusedAction,
    confusedTurnsLeft,
  } = enemy;

  const {
    serratedDaggerActive,
    luckyFleeActive,
    wardingShieldHitsRemaining,
    coolerStickBonus = 0,
  } = itemEffects;

  const {
    log,
    formattedTitle,
    combatWinsSinceLastCapIncrease,
    hpCapBonus,
    enemiesKilled,
  } = state;

  const {
    clearTimer,
    setDefeated,
    handleLootDrop,
    gotoEnemyTurn,
  } = utils;

  const isBossFromState = state.isBoss;

  function tickConfusion() {
    if ((confusedTurnsLeft?.value ?? 0) > 0) {
      confusedTurnsLeft.value--;
      if (confusedTurnsLeft.value <= 0 && confusedAction) {
        confusedAction.value = [];
        log(`🌀 The confusion fades.`);
      }
    }
  }
  tickConfusion();

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
  let enemyActionCountered = false;

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
    let hitThreshold = null;

    if (playerAction === "attack_power") {
      damageMultiplier = 1.5;
      attackName = "lands a power strike";
      hitThreshold = 7;
    } else if (playerAction === "attack_reckless") {
      damageMultiplier = 2.0;
      attackName = "swings recklessly";
      hitThreshold = 13;
    }

    let didHit = true;
    if (hitThreshold !== null) {
      const rawRoll = Math.floor(Math.random() * 20) + 1;
      const roll = rawRoll + coolerStickBonus;
      didHit = roll >= hitThreshold;
      utils.onDiceRoll?.({ roll, rawRoll, bonus: coolerStickBonus, threshold: hitThreshold, didHit });
      const dieClass = didHit ? "hit" : "miss";
      const dieFace = `<span class="dice-face ${dieClass}">${roll}</span>`;
      const bonusNote = coolerStickBonus > 0 ? ` (+${coolerStickBonus} stick)` : "";
      log(
        `🎲 ${dieFace}${bonusNote} (need ${hitThreshold}+) — ${didHit ? "Hit!" : "Miss!"}`
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
      const missPenalty = playerAction === "attack_reckless" ? 3 : playerAction === "attack_power" ? 2 : 1;
      playerHP.value = Math.max(playerHP.value - missPenalty, 0);
      utils.onCombatResult?.({ type: "miss_penalty", amount: missPenalty });
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
    const tier = specialTier?.value ?? 1;
    const tierData = playerClass.value.specialTiers?.[tier - 1];
    const specialName = tierData?.name ?? playerClass.value.special;

    let baseSpecialDamage = 0;

    if (cls === "Fighter") {
      if (tier === 1) {
        baseSpecialDamage = 8;
        damageToEnemy = baseSpecialDamage;
        log(`⚔️ <span class="player-name">${playerName.value}</span> unleashes ${specialName} for ${baseSpecialDamage} damage.`);
      } else if (tier === 2) {
        baseSpecialDamage = 12;
        damageToEnemy = baseSpecialDamage;
        enemyStatusEffects.value.push({ type: "bleed", damage: 1, duration: 1 });
        log(`⚔️ <span class="player-name">${playerName.value}</span> cleaves for ${baseSpecialDamage} damage! The wound bleeds.`);
      } else {
        baseSpecialDamage = 18;
        damageToEnemy = baseSpecialDamage;
        enemyIsStunned.value = true;
        enemyNextAction.value = "stunned";
        skipEnemyCurrentTurn = true;
        log(`⚔️ <span class="player-name">${playerName.value}</span> delivers a Warlord's Strike for ${baseSpecialDamage} damage! The enemy is stunned.`);
      }
    } else if (cls === "Wizard") {
      let minDmg, maxDmg, stunChance;
      if (tier === 1) { minDmg = 5; maxDmg = 15; stunChance = 0.3; }
      else if (tier === 2) { minDmg = 8; maxDmg = 18; stunChance = 0.5; }
      else { minDmg = 15; maxDmg = 25; stunChance = 1.0; }

      baseSpecialDamage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
      damageToEnemy = baseSpecialDamage;
      const stunned = Math.random() < stunChance;
      log(`🔥 <span class="player-name">${playerName.value}</span> casts ${specialName}, dealing ${baseSpecialDamage} damage.${stunned ? ` The enemy is stunned.` : ""}`);
      if (stunned) {
        enemyIsStunned.value = true;
        enemyNextAction.value = "stunned";
        skipEnemyCurrentTurn = true;
      }
    } else if (cls === "Rogue") {
      if (tier === 1) {
        baseSpecialDamage = 6;
      } else if (tier === 2) {
        baseSpecialDamage = 10;
      } else {
        baseSpecialDamage = 15;
        enemyStatusEffects.value.push({ type: "bleed", damage: 1, duration: 2 });
        log(`🩸 The shadows cut deep — the enemy begins to bleed.`);
      }
      damageToEnemy = baseSpecialDamage;
      skipEnemyCurrentTurn = true;
      log(`🗡️ <span class="player-name">${playerName.value}</span> disappears and executes ${specialName} for ${baseSpecialDamage} damage.`);
    } else if (cls === "Paladin") {
      let dmg, heal;
      if (tier === 1) { dmg = 5; heal = 3; }
      else if (tier === 2) { dmg = 8; heal = 7; }
      else { dmg = 12; heal = effectiveMaxHP.value; }
      baseSpecialDamage = dmg;
      damageToEnemy = baseSpecialDamage;
      const newHP = tier === 3
        ? effectiveMaxHP.value
        : Math.min(playerHP.value + heal, effectiveMaxHP.value);
      playerHP.value = newHP;
      const healMsg = tier === 3 ? "fully restores HP" : `heals ${heal} HP`;
      log(`✨ <span class="player-name">${playerName.value}</span> calls upon ${specialName}, dealing ${baseSpecialDamage} damage and ${healMsg}.`);
    } else if (cls === "Mundane") {
      if (tier === 1) {
        baseSpecialDamage = 5;
        damageToEnemy = baseSpecialDamage;
        log(`🪨 <span class="player-name">${playerName.value}</span> hurls a rock for ${baseSpecialDamage} damage. The enemy looks almost offended.`);
      } else if (tier === 2) {
        baseSpecialDamage = 0;
        damageToEnemy = 0;
        skipEnemyCurrentTurn = true;
        log(`🛡️ <span class="player-name">${playerName.value}</span> grits their teeth and braces — the enemy's attack glances off.`);
      } else {
        baseSpecialDamage = Math.max(5, (effectiveMaxHP.value - playerHP.value) + 5);
        damageToEnemy = baseSpecialDamage;
        log(`💢 <span class="player-name">${playerName.value}</span> channels pure desperation into a Grit Surge — ${baseSpecialDamage} damage!`);
      }
    } else {
      log(`<span class="player-name">${playerName.value}</span> uses ${specialName}.`);
      if (playerClass.value.specialEffect) {
        const effect = playerClass.value.specialEffect(
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
            enemyNextAction.value = "stunned";
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
    const counterableActions = ["steal", "enrage", "confuse", "summon"];
    if (counterableActions.includes(enemyNextAction.value)) {
      const rawRoll = Math.floor(Math.random() * 20) + 1;
      const roll = rawRoll + coolerStickBonus;
      const threshold = 11;
      const succeeded = roll >= threshold;
      utils.onDiceRoll?.({ roll, rawRoll, bonus: coolerStickBonus, threshold, didHit: succeeded });
      const dieClass = succeeded ? "hit" : "miss";
      const dieFace = `<span class="dice-face ${dieClass}">${roll}</span>`;
      const bonusNote = coolerStickBonus > 0 ? ` (+${coolerStickBonus} stick)` : "";
      log(`🎲 ${dieFace}${bonusNote} (need ${threshold}+) — ${succeeded ? "Countered!" : "Failed to counter!"}`);
      enemyActionCountered = succeeded;
      utils.onCounterResult?.({ succeeded });
    }
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
      } else {
        const fleeRoll = Math.floor(Math.random() * 20) + 1;
        const fleeThreshold = 7;
        const fleeSucceeded = fleeRoll >= fleeThreshold;
        utils.onDiceRoll?.({ roll: fleeRoll, rawRoll: fleeRoll, bonus: 0, threshold: fleeThreshold, didHit: fleeSucceeded });
        const dieClass = fleeSucceeded ? "hit" : "miss";
        const dieFace = `<span class="dice-face ${dieClass}">${fleeRoll}</span>`;
        log(`🎲 ${dieFace} (need ${fleeThreshold}+) — ${fleeSucceeded ? "Escaped!" : "Caught!"}`);
        if (fleeSucceeded) {
          log(`🏃 <span class="player-name">${playerName.value}</span> fled successfully.`);
          if (utils.onFleeSuccess) {
            utils.onFleeSuccess();
          } else {
            encounter.value = null;
          }
          return;
        } else {
          log(`<span class="player-name">${playerName.value}</span> failed to flee.`);
        }
      }
    }
  }

  if (player.dogName?.value && damageToEnemy > 0) {
    damageToEnemy += 2;
    log(`🐕‍🦺 ${player.dogName.value} bites for 2 extra damage!`);
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
    utils.onVictory?.(defeatedEnemyData);
    handleLootDrop(defeatedEnemyData);

    if (enemiesKilled) enemiesKilled.value++;
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
          damageToPlayer - Math.floor(shieldBonus.value / 2.333)
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
      } else if (enemyNextAction.value === "steal") {
        if (enemyActionCountered) {
          log(`🛡️ <span class="player-name">${playerName.value}</span> guards their coin pouch — the theft fails!`);
        } else {
          const stealAmount = Math.min(
            playerGold?.value ?? 0,
            Math.floor(Math.random() * 6) + 3
          );
          if (stealAmount > 0 && playerGold) {
            playerGold.value -= stealAmount;
            log(`💰 ${formattedTitle} snatches ${stealAmount} gold from <span class="player-name">${playerName.value}</span>!`);
          } else {
            log(`💰 ${formattedTitle} reaches for your gold — but finds nothing.`);
          }
        }
        damageToPlayer = 0;
      } else if (enemyNextAction.value === "enrage") {
        if (enemyActionCountered) {
          log(`🛡️ ${formattedTitle}'s enrage is disrupted!`);
        } else {
          if (enrageBonus) enrageBonus.value += 2;
          log(`💢 ${formattedTitle} enrages! Future attacks will hit harder.`);
        }
        damageToPlayer = 0;
      } else if (enemyNextAction.value === "confuse") {
        if (enemyActionCountered) {
          log(`🛡️ <span class="player-name">${playerName.value}</span> resists the confusion!`);
        } else {
          const actions = ["attack_steady", "attack_power", "attack_reckless", "defend", "special", "flee"];
          const shuffled = actions.sort(() => Math.random() - 0.5);
          const blocked = shuffled.slice(0, 2);
          if (confusedAction) {
            confusedAction.value = blocked;
            confusedTurnsLeft.value = 1;
          }
          const labels = { attack_steady: "Steady", attack_power: "Power", attack_reckless: "Reckless", defend: "Defend", special: "Special", flee: "Flee" };
          const lockedNames = blocked.map(a => `<strong>${labels[a]}</strong>`).join(" and ");
          log(`🌀 ${formattedTitle} clouds <span class="player-name">${playerName.value}</span>'s mind! ${lockedNames} locked for 1 turn.`);
        }
        damageToPlayer = 0;
      } else if (enemyNextAction.value === "summon") {
        if (enemyActionCountered) {
          log(`🛡️ ${formattedTitle}'s healing is interrupted!`);
        } else {
          const summonAmount = 12;
          enemyHP.value += summonAmount;
          log(`💚 ${formattedTitle} heals for ${summonAmount} HP!`);
        }
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

  const counterableActions = ["steal", "enrage", "confuse", "summon"];
  if (counterableActions.includes(enemyNextAction.value) && !enemyActionCountered) {
    utils.onCounterResult?.({ succeeded: false, delay: 0 });
  }

  gotoEnemyTurn();
}