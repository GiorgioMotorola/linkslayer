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
    weaponAugment,
    defenseAugment,
    ironWillUsed,
    bloodpactActive,
    playerEnrageCharges,
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
  let enemyAttemptedAttack = false;

  if (playerAction === "attack_steady" || playerAction === "attack_power" || playerAction === "attack_enraged") {
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
      hitThreshold = 10; // 50% — was 7
    } else if (playerAction === "attack_enraged") {
      damageMultiplier = 2.0;
      attackName = "unleashes an enraged strike";
      // No roll — guaranteed hit, rage consumed
      if (playerEnrageCharges) playerEnrageCharges.value = 0;
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
      const missPenalty = playerAction === "attack_power" ? 3 : 1;
      playerHP.value = Math.max(playerHP.value - missPenalty, 0);
      // Miss penalty damage also counts as a rage charge
      if (playerEnrageCharges && missPenalty > 0) {
        playerEnrageCharges.value = Math.min(3, playerEnrageCharges.value + 1);
      }
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
    log(`🐶 ${player.dogName.value} bites for 2 extra damage!`);
  }

  // Bloodpact Rune: once active, add +3 to attack damage
  if (bloodpactActive?.value && damageToEnemy > 0) {
    damageToEnemy += 3;
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

    // Weapon augment proc (only on actual hits)
    const wAug = weaponAugment?.value;
    if (wAug && finalDamageToEnemy > 0) {
      const roll = Math.random();
      if (wAug === "bleedEdge" && roll < 0.30) {
        enemyStatusEffects.value.push({ type: "bleed", damage: 2, duration: 4 });
        log(`🩸 Serrated Edge bites deep — enemy Bleeds (2 dmg × 4 turns)!`);
      } else if (wAug === "venomCoat" && roll < 0.30) {
        enemyStatusEffects.value.push({ type: "poison", damage: 3, duration: 3 });
        log(`☠️ Venom Coat seeps in — enemy Poisoned (3 dmg × 3 turns)!`);
      } else if (wAug === "thunderstrike" && roll < 0.25) {
        enemyIsStunned.value = true;
        enemyNextAction.value = "stunned";
        skipEnemyCurrentTurn = true;
        log(`⚡ Thunderstrike Rune fires — enemy stunned!`);
      } else if (wAug === "emberTemper" && roll < 0.30) {
        enemyStatusEffects.value.push({ type: "fire", damage: 5, duration: 2 });
        log(`🔥 Ember Temper ignites the wound — enemy on Fire (5 dmg × 2 turns)!`);
      } else if (wAug === "cursedRune" && roll < 0.20) {
        enemyStatusEffects.value.push({ type: "weaken", damageReduction: 2, duration: 3 });
        log(`💫 Cursed Rune drains their strength — enemy Weakened (-2 dmg × 3 turns)!`);
      }
    }
  }

  if (enemyHP.value <= 0) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> defeated ${formattedTitle}`
    );
    // Soul Shard: 15% chance on kill to restore 8 HP
    if (weaponAugment?.value === "soulShard" && Math.random() < 0.15) {
      const soulHeal = 8;
      playerHP.value = Math.min(playerHP.value + soulHeal, effectiveMaxHP.value);
      log(`💠 Soul Shard pulses — you recover ${soulHeal} HP from the fallen.`);
    }
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
        enemyAttemptedAttack = true;
        damageToPlayer = currentEnemyDamage;

        // Apply weaken/chill status debuffs on the enemy
        for (const eff of (enemyStatusEffects.value ?? [])) {
          if ((eff.type === "weaken" || eff.type === "chill") && eff.damageReduction > 0) {
            damageToPlayer = Math.max(0, damageToPlayer - eff.damageReduction);
          }
        }

        // Iron Will: block first hit of combat entirely
        if (defenseAugment?.value === "ironWill" && !ironWillUsed?.value) {
          ironWillUsed.value = true;
          damageToPlayer = 0;
          log(`🧱 Iron Will absorbs the first blow entirely!`);
        }

        // Stoneskin: 20% chance to fully block
        if (damageToPlayer > 0 && defenseAugment?.value === "stoneskin" && Math.random() < 0.20) {
          damageToPlayer = 0;
          log(`🪨 Stoneskin activates — attack fully blocked!`);
        }

        // Warden's Ward: 25% chance to halve damage
        if (damageToPlayer > 0 && defenseAugment?.value === "wardensWard" && Math.random() < 0.25) {
          damageToPlayer = Math.floor(damageToPlayer * 0.5);
          log(`✨ Warden's Ward pulses — damage halved to ${damageToPlayer}!`);
        }

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
          const actions = ["attack_steady", "attack_power", "attack_enraged", "defend", "special", "flee"];
          const shuffled = actions.sort(() => Math.random() - 0.5);
          const blocked = shuffled.slice(0, 2);
          if (confusedAction) {
            confusedAction.value = blocked;
            confusedTurnsLeft.value = 1;
          }
          const labels = { attack_steady: "Steady", attack_power: "Power", attack_enraged: "Enraged", defend: "Defend", special: "Special", flee: "Flee" };
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
    if (damageToPlayer > 0) {
      utils.onCombatResult?.({ type: "taken", amount: damageToPlayer });
      // Every hit taken (including defended hits) charges Enraged by 1 (max 3)
      if (playerEnrageCharges) {
        playerEnrageCharges.value = Math.min(3, playerEnrageCharges.value + 1);
      }
    }
  } else {
    console.error(
      "ERROR: damageToPlayer is not a valid number, defaulting to 0 damage.",
      damageToPlayer
    );
    playerHP.value = Math.max(playerHP.value - 0, 0);
  }

  // Defense augment procs that fire after enemy attack
  if (enemyAttemptedAttack && defenseAugment?.value) {
    const daug = defenseAugment.value;

    // Thornplate: reflect 2 damage back on any hit attempt
    if (daug === "thornplate") {
      const thornDmg = 2;
      enemyHP.value = Math.max(0, enemyHP.value - thornDmg);
      utils.onCombatResult?.({ type: "dealt", amount: thornDmg });
      log(`🌵 Thornplate reflects ${thornDmg} damage back at ${formattedTitle}!`);
      if (enemyHP.value <= 0) {
        log(`💀 <span class="player-name">${playerName.value}</span> defeated ${formattedTitle} with Thornplate!`);
        const defeatedEnemyData = encounter.value?.enemy;
        utils.onVictory?.(defeatedEnemyData);
        handleLootDrop(defeatedEnemyData);
        if (enemiesKilled) enemiesKilled.value++;
        combatWinsSinceLastCapIncrease.value++;
        if (combatWinsSinceLastCapIncrease.value >= 5) {
          hpCapBonus.value += 10;
          log(`🎉 Your maximum HP increased by <strong>10</strong>. New max HP: ${effectiveMaxHP.value}`);
          combatWinsSinceLastCapIncrease.value = 0;
          playerHP.value = Math.min(playerHP.value, effectiveMaxHP.value);
        }
        return;
      }
    }

    // Frostbound: 20% chance to Chill enemy (-1 dmg next hit) when damage landed
    if (daug === "frostbound" && damageToPlayer > 0 && Math.random() < 0.20) {
      enemyStatusEffects.value.push({ type: "chill", damageReduction: 1, duration: 1 });
      log(`❄️ Frostbound retaliates — ${formattedTitle} is Chilled (-1 dmg next hit)!`);
    }
  }

  // Bloodpact Rune: activate when HP drops below 25% for first time
  if (
    defenseAugment?.value === "bloodpactRune" &&
    !bloodpactActive?.value &&
    playerHP.value > 0 &&
    playerHP.value < effectiveMaxHP.value * 0.25
  ) {
    bloodpactActive.value = true;
    log(`🩸 Bloodpact Rune awakens — rage fills the wound! +3 damage for the rest of this combat.`);
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