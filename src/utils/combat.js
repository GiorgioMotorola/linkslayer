export function handleCombatAction({ player, enemy, state, utils }) {
  const {
    playerHP,
    playerClass,
    specialUsesLeft,
    weaponBonus,
    shieldBonus,
    playerName,
    action: playerAction,
  } = player;

  const {
    enemyHP,
    encounter,
    nextEnemyAttack,
    enemyNextAction,
    enemyIsStunned,
  } = enemy;

  const { log, formattedTitle, DEFAULT_ENEMY_HP, isBoss } = state;

  const {
    clearTimer,
    setDefeated,
    handleLootDrop,
    markBossDefeated,
    gotoEnemyTurn,
  } = utils;

  let currentEnemyDamage = nextEnemyAttack.value;
  if (typeof currentEnemyDamage !== "number" || isNaN(currentEnemyDamage)) {
    console.warn(
      "nextEnemyAttack.value is not a number, defaulting to 1.",
      nextEnemyAttack.value
    );
    currentEnemyDamage = 1;
  }

  let damageToPlayer = 0;
  let damageToEnemy = 0;
  let skipEnemyCurrentTurn = false;

  console.log("DEBUG: Player Action:", playerAction);
  console.log(
    "DEBUG: Enemy Next Action (for this turn):",
    enemyNextAction.value
  );
  console.log("DEBUG: Initial playerHP:", playerHP.value);
  console.log("DEBUG: Initial enemyHP:", enemyHP.value);

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
    damageToEnemy = randomDamage;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> hits ${formattedTitle} for ${damageToEnemy} damage.`
    );
  } else if (playerAction === "special") {
    if (specialUsesLeft.value <= 0) {
      log(
        `❌ <span class="player-name">${playerName.value}</span> is out of Special Moves.`
      );
      return;
    }
    specialUsesLeft.value--;

    const cls = playerClass.value.name;
    log(
      `❗ <span class="player-name">${playerName.value}</span> uses ${playerClass.value.special}!`
    );

    if (cls === "Fighter") {
      damageToEnemy = 8;
      log(
        `⚔️ <span class="player-name">${playerName.value}</span> unleashes Power Strike!`
      );
    } else if (cls === "Wizard") {
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
        `🔥 ${wizardDamage} damage dealt.${
          stunned ? " The enemy is stunned!" : ""
        }`
      );
      if (stunned) {
        enemyIsStunned.value = true;
        enemyNextAction.value = null;
      }
      skipEnemyCurrentTurn = true;
    } else if (cls === "Rogue") {
      const effect = playerClass.value.specialEffect(
        enemyHP.value,
        DEFAULT_ENEMY_HP
      );
      const { enemyHP: newEnemyHP, rogueDamage } = effect;
      enemyHP.value = newEnemyHP;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> executes Backstab for ${rogueDamage} damage.`
      );
      skipEnemyCurrentTurn = true;
    } else {
      if (playerClass.value.specialEffect) {
        const effect = playerClass.value.specialEffect(
          enemyHP.value,
          playerHP.value,
          playerClass.value.maxHP
        );
        if (typeof effect === "object" && effect !== null) {
          enemyHP.value = effect.enemyHP;
          playerHP.value = effect.playerHP;
        }
      }
    }
  } else if (playerAction === "defend") {
    log(
      `🛡️ <span class="player-name">${playerName.value}</span> braces for impact.`
    );
  } else if (playerAction === "flee") {
    if (isBoss(encounter.value?.enemy)) {
      log(`❌ You cannot flee from ${encounter.value?.enemy?.name}.`);
    } else {
      if (Math.random() > 0.4) {
        log(
          `🏃 <span class="player-name">${playerName.value}</span> fled successfully.`
        );
        encounter.value = null;
        return;
      } else {
        log(
          `❌ <span class="player-name">${playerName.value}</span> failed to flee!`
        );
      }
    }
  }

  if (damageToEnemy > 0) {
    enemyHP.value -= damageToEnemy;
  }

  if (enemyHP.value <= 0) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> defeated ${formattedTitle.value}`
    );
    const defeatedEnemyData = encounter.value?.enemy;
    encounter.value = null;
    handleLootDrop();
    if (isBoss(defeatedEnemyData)) {
      markBossDefeated();
    }
    return;
  }
  if (!skipEnemyCurrentTurn) {
    if (enemyIsStunned.value) {
      log(`💤 ${formattedTitle.value} is stunned and skips their turn.`);
      enemyIsStunned.value = false;
    } else {
      if (enemyNextAction.value === "attack") {
        damageToPlayer = currentEnemyDamage;
        damageToPlayer = Math.max(0, damageToPlayer - shieldBonus.value);
        if (playerAction === "defend") {
          damageToPlayer = Math.max(0, Math.floor(damageToPlayer * 0.5));
          log(
            `🛡️ <span class="player-name">${playerName.value}</span> defended, taking ${damageToPlayer} damage.`
          );
        } else {
          log(
            `💥 ${formattedTitle.value} attacks! <span class="player-name">${playerName.value}</span> takes ${damageToPlayer} damage.`
          );
        }
      } else if (enemyNextAction.value === "trip") {
        log(`🤾 ${formattedTitle.value} trips! You get a free hit!`);
        damageToPlayer = 0;
      } else if (enemyNextAction.value === "flee") {
        log(`🏃 ${formattedTitle.value} flees!`);
        encounter.value = null;
        return;
      } else if (enemyNextAction.value === "defend") {
        log(`🛡️ ${formattedTitle.value} is holding up their shield.`);
        damageToPlayer = 0;
      }
    }
  } else {
    console.log(
      "DEBUG: Enemy current turn skipped due to player's special action."
    );
  }

  if (typeof damageToPlayer === "number" && !isNaN(damageToPlayer)) {
    playerHP.value = Math.max(playerHP.value - damageToPlayer, 0);
  } else {
    console.error(
      "ERROR: damageToPlayer is not a valid number:",
      damageToPlayer
    );
    playerHP.value = Math.max(playerHP.value - 0, 0);
  }

  console.log("DEBUG: playerHP after this turn:", playerHP.value);
  console.log("DEBUG: enemyHP after this turn:", enemyHP.value);

  if (playerHP.value <= 0) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> was defeated!`
    );
    encounter.value = null;
    clearTimer();
    setDefeated();
    return;
  }

  gotoEnemyTurn();
}
