<!-- function handleCombatAction(playerAction) {
  const enemyAction = enemyNextAction.value;
  const enemyDamage = nextEnemyAttack.value ?? 1;

  let playerDamage = 0;
  let enemyTakesDamage = 0;

  // Always calculate player attack damage if player chose attack
  if (playerAction === "attack") {
    let randomDamage = Math.floor(Math.random() * 5) + 2;

    if (playerClass.value.name === "Fighter") randomDamage += 1;
    if (playerClass.value.name === "Rogue" && Math.random() < 0.25) {
      randomDamage += 3;
      log(
        `<span class="player-name">${playerName.value}</span> lands a critical strike`
      );
    }

    if (weaponBonus.value > 0) {
      randomDamage += weaponBonus.value;
    }

    enemyTakesDamage = randomDamage;
  }

  if (playerAction === "special") {
    if (specialUsesLeft.value <= 0) {
      log(
        `❌ <span class="player-name">${playerName.value}</span> is out of Special Moves.`
      );
      return;
    }

    specialUsesLeft.value--;
    if (
      enemyHP.value > 0 &&
      enemyAction === "attack" &&
      playerClass.value.name !== "Rogue"
    ) {
      playerDamage = enemyDamage;
      playerHP.value -= playerDamage;

      log(
        `💥 ${formattedTitle.value} strikes back during your special! You take ${playerDamage} damage.`
      );

      if (playerHP.value <= 0) {
        log(
          `💀 <span class="player-name">${playerName.value}</span> was defeated!`
        );
        encounter.value = null;
        clearInterval(timerInterval);
        defeated.value = true;
        return;
      }
    }
    const cls = playerClass.value.name;

    if (cls === "Fighter") {
      enemyTakesDamage = 8;
      log(
        `⚔️ <span class="player-name">${playerName.value}</span> unleashes Power Strike! 8 damage dealt to ${formattedTitle.value}`
      );
      encounterMessage.value = `⚔️ <span class="player-name">${playerName.value}</span> unleashes Power Strike! 8 damage dealt to ${formattedTitle.value}`;
      enemyHP.value -= enemyTakesDamage;
    } else if (playerClass.value.name === "Wizard") {
      const effect = playerClass.value.specialEffect(
        enemyHP.value,
        playerHP.value
      );
      const {
        enemyHP: newEnemyHP,
        playerHP: newPlayerHP,
        wizardDamage,
        stunned,
      } = effect;

      enemyHP.value = newEnemyHP;
      playerHP.value = newPlayerHP;

      log(
        `🔥 <span class="player-name">${
          playerName.value
        }</span> casts Fireball at ${
          formattedTitle.value
        }. ${wizardDamage} damage dealt.${
          stunned ? " The enemy is stunned!" : ""
        }`
      );
      encounterMessage.value = `🔥 <span class="player-name">${
        playerName.value
      }</span> casts Fireball at ${
        formattedTitle.value
      }. ${wizardDamage} damage dealt.${
        stunned ? " The enemy is stunned!" : ""
      }`;

      if (stunned) {
        enemyIsStunned.value = true;
        enemyNextAction.value = null;
      }
    } else if (playerClass.value.name === "Rogue") {
      const effect = playerClass.value.specialEffect(
        enemyHP.value,
        DEFAULT_ENEMY_HP
      );
      const { enemyHP: newEnemyHP, rogueDamage } = effect;

      enemyHP.value = newEnemyHP;

      log(
        `🗡️ <span class="player-name">${playerName.value}</span> executes Backstab, evading the incoming strike. It hits for ${rogueDamage} to ${formattedTitle.value}.`
      );
      encounterMessage.value = `🗡️ <span class="player-name">${playerName.value}</span> executes Backstab, evading the incoming strike. It hits for ${rogueDamage} to ${formattedTitle.value}.`;
    } else if (playerClass.value.specialEffect) {
      const effect = playerClass.value.specialEffect(
        enemyHP.value,
        playerHP.value,
        playerClass.value.maxHP
      );

      if (typeof effect === "object" && effect !== null) {
        enemyHP.value = effect.enemyHP;
        playerHP.value = effect.playerHP;
      }

      log(
        `❗ <span class="player-name">${playerName.value}</span> uses ${playerClass.value.special}!`
      );
    }

    if (enemyHP.value <= 0) {
      log(`${playerName.value} defeated ${formattedTitle.value}`);

      // Save enemy name before nullifying encounter
      const defeatedEnemyName = encounter.value?.enemy;

      encounter.value = null;
      handleLootDrop();

      if (isBoss(defeatedEnemyName)) {
        markBossDefeated();
      }

      return;
    }

    nextTick(() => {
      current.value = current.value + "";
    });

    gotoEnemyTurn();
    return;
  }

  if (enemyAction === "trip") {
    log(
      `🤾 ${formattedTitle.value} trips and falls! <span class="player-name">${playerName.value}</span> gets a free hit!`
    );

    let damage = Math.floor(Math.random() * 5) + 4;

    if (playerClass.value.name === "Fighter") damage += 1;
    if (playerClass.value.name === "Rogue" && Math.random() < 0.25) {
      damage += 3;
      log(
        `<span class="player-name">${playerName.value}</span> lands a critical strike on the downed enemy!`
      );
    }

    if (weaponBonus.value > 0) {
      damage += weaponBonus.value;
    }

    enemyHP.value -= damage;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> strikes the fallen ${formattedTitle.value} for ${damage} damage.`
    );

    if (enemyHP.value <= 0) {
      log(`${playerName.value} defeated ${formattedTitle.value}`);

      // Save enemy name before nullifying encounter
      const defeatedEnemyName = encounter.value?.enemy;

      encounter.value = null;
      handleLootDrop();

      if (isBoss(defeatedEnemyName)) {
        markBossDefeated();
      }

      return;
    }

    gotoEnemyTurn();
    return;
  }

  if (enemyAction === "attack") {
    log(`${formattedTitle.value} used: ${enemyAction}`);

    playerDamage = enemyDamage;

    const bleedChance = 0.1;
    const stunChance = 0.1;

    if (Math.random() < bleedChance) {
      enemyStatusEffects.value.push({ type: "bleed", duration: 3, damage: 1 });
      log(`🩸 ${formattedTitle.value} starts bleeding!`);
    }

    if (Math.random() < stunChance) {
      enemyStatusEffects.value.push({ type: "stun", duration: 1 });
      enemyIsStunned.value = true;
      enemyNextAction.value = null;
      log(`💤 ${formattedTitle.value} is stunned and misses their next turn!`);
    } else if (playerAction === "defend") {
      let reducedDamage = Math.max(1, Math.floor((Math.random() * 4 + 1) / 2));
      playerDamage = reducedDamage;
      log(
        `🛡️ <span class="player-name">${playerName.value}</span> blocks. ${formattedTitle.value} hits for ${playerDamage}`
      );
    } else if (playerAction === "flee") {
      if (isBoss(encounter.value?.enemy)) {
        log(
          `❌ You cannot flee from ${encounter.value?.enemy?.name}. This battle must be fought to the death!`
        );
        return;
      }

      const success = Math.random() > 0.4;
      if (success) {
        log(
          `🏃 <span class="player-name">${playerName.value}</span> fled successfully.`
        );
        encounter.value = null;
        return;
      } else {
        playerDamage = enemyDamage;
        log(
          `❌ <span class="player-name">${playerName.value}</span> failed to flee and took ${playerDamage} damage!`
        );
      }
    }
  } else if (enemyAction === "defend") {
    log(
      `<span class="player-name">${playerName.value}</span> used: ${playerAction}`
    );

    if (playerAction === "attack") {
      let reducedDamage = Math.max(1, Math.floor((Math.random() * 4 + 1) / 2));
      if (playerClass.value.name === "Fighter") reducedDamage += 1;
      enemyTakesDamage = reducedDamage;
      log(
        `🛡️ ${formattedTitle.value} blocked. <span class="player-name">${playerName.value}</span> only dealt ${enemyTakesDamage}`
      );
    } else if (playerAction === "defend") {
      log("🛡️ Both of you blocked. Nothing happens.");
    } else if (playerAction === "flee") {
      const success = Math.random() > 0.4;
      if (success) {
        log(
          `🏃 <span class="player-name">${playerName.value}</span> fled successfully!`
        );
        encounter.value = null;
        return;
      } else {
        log(
          `❌ <span class="player-name">${playerName.value}</span> failed to flee, but the enemy was just defending. No damage taken`
        );
        return;
      }
    }
  } else if (enemyAction === "flee") {
    log(`${playerName.value} fled`);
    encounter.value = null;
    return;
  }

  if (playerAction === "attack" && enemyTakesDamage > 0) {
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> hits ${formattedTitle.value} for ${enemyTakesDamage} damage.`
    );
  }

  playerHP.value -= playerDamage;
  enemyHP.value -= enemyTakesDamage;

  if (playerHP.value <= 0) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> was defeated!`
    );
    encounter.value = null;
    clearInterval(timerInterval);
    defeated.value = true;
    return;
  }

  if (enemyHP.value <= 0) {
    log(`${playerName.value} defeated ${formattedTitle.value}`);
    encounter.value = null;
    handleLootDrop();
    return;
  }

  gotoEnemyTurn();
} -->