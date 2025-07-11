// src/utils/combat.js

export function handleCombatAction({ player, enemy, state, utils }) {
  const { playerHP, playerClass, specialUsesLeft, weaponBonus, playerName } =
    player;

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

  const enemyAction = enemyNextAction.value;
  const enemyDamage = nextEnemyAttack.value ?? 1;
  console.log(player.playerHP);

  let playerDamage = 0;
  let enemyTakesDamage = 0;

  if (player.action === "attack") {
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

  if (player.action === "special") {
    if (specialUsesLeft.value <= 0) {
      log(
        `❌ <span class="player-name">${playerName.value}</span> is out of Special Moves.`
      );
      return;
    }
    specialUsesLeft.value--;
    let skipEnemyTurn = false;

    const cls = playerClass.value.name;

    if (cls === "Fighter") {
      enemyTakesDamage = 8;
      log(
        `⚔️ <span class="player-name">${playerName.value}</span> unleashes Power Strike! 8 damage dealt to ${formattedTitle}`
      );
      enemyHP.value -= enemyTakesDamage;
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
        `🔥 <span class="player-name">${
          playerName.value
        }</span> casts Fireball. ${wizardDamage} damage.${
          stunned ? " The enemy is stunned!" : ""
        }`
      );
      if (stunned) {
        enemyIsStunned.value = true;
        enemyNextAction.value = null;
      }
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
      skipEnemyTurn = true;
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
      log(`${playerName.value} defeated ${formattedTitle}`);
      const defeatedEnemyName = encounter.value?.enemy;
      encounter.value = null;
      handleLootDrop();
      if (isBoss(defeatedEnemyName)) markBossDefeated();
      return;
    }

    if (skipEnemyTurn) {
      gotoEnemyTurn();
      return;
    }

    if (enemyAction === "trip") {
      log(`🤾 ${formattedTitle} trips! You get a free hit!`);
      let damage = Math.floor(Math.random() * 5) + 4;
      if (playerClass.value.name === "Fighter") damage += 1;
      if (playerClass.value.name === "Rogue" && Math.random() < 0.25) {
        damage += 3;
        log(
          `<span class="player-name">${playerName.value}</span> lands a critical strike on the downed enemy!`
        );
      }
      if (weaponBonus.value > 0) damage += weaponBonus.value;
      enemyHP.value -= damage;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> strikes for ${damage} damage.`
      );
      if (enemyHP.value <= 0) {
        log(`${playerName.value} defeated ${formattedTitle}`);
        const defeatedEnemyName = encounter.value?.enemy;
        encounter.value = null;
        handleLootDrop();
        if (isBoss(defeatedEnemyName)) markBossDefeated();
        return;
      }
    }

    if (enemyAction === "attack") {
      let playerDamage = enemyDamage;
      playerHP.value -= playerDamage;
      log(
        `💥 ${formattedTitle} attacks ${playerName.value} for ${playerDamage} damage!`
      );

      if (playerHP.value <= 0) {
        log(
          `💀 <span class="player-name">${playerName.value}</span> was defeated!`
        );
        encounter.value = null;
        clearTimer();
        setDefeated();
        return;
      }
    }

    gotoEnemyTurn();
    return;
  }

  if (enemyAction === "trip") {
    log(`🤾 ${formattedTitle} trips! You get a free hit!`);
    let damage = Math.floor(Math.random() * 5) + 4;
    if (playerClass.value.name === "Fighter") damage += 1;
    if (playerClass.value.name === "Rogue" && Math.random() < 0.25) {
      damage += 3;
      log(
        `<span class="player-name">${playerName.value}</span> lands a critical strike on the downed enemy!`
      );
    }
    if (weaponBonus.value > 0) damage += weaponBonus.value;
    enemyHP.value -= damage;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> strikes for ${damage} damage.`
    );
    if (enemyHP.value <= 0) {
      log(`${playerName.value} defeated ${formattedTitle}`);
      const defeatedEnemyName = encounter.value?.enemy;
      encounter.value = null;
      handleLootDrop();
      if (isBoss(defeatedEnemyName)) markBossDefeated();
      return;
    }
    gotoEnemyTurn();
    return;
  }

  if (enemyAction === "attack") {
    playerDamage = enemyDamage;
    if (player.action === "defend") {
      playerDamage = Math.max(1, Math.floor((Math.random() * 4 + 1) / 2));
    }
    if (player.action === "flee") {
      if (isBoss(encounter.value?.enemy)) {
        log(`❌ You cannot flee from ${encounter.value?.enemy?.name}.`);
        return;
      }
      if (Math.random() > 0.4) {
        log(
          `🏃 <span class="player-name">${playerName.value}</span> fled successfully.`
        );
        encounter.value = null;
        return;
      } else {
        log(
          `❌ <span class="player-name">${playerName.value}</span> failed to flee and took ${playerDamage} damage!`
        );
      }
    }
  }

  if (player.action === "attack" && enemyTakesDamage > 0) {
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> hits ${formattedTitle} for ${enemyTakesDamage} damage.`
    );
  }

  playerHP.value -= playerDamage;
  enemyHP.value -= enemyTakesDamage;

  if (playerHP.value <= 0) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> was defeated!`
    );
    encounter.value = null;
    clearTimer();
    setDefeated();
    return;
  }

  if (enemyHP.value <= 0) {
    log(`${playerName.value} defeated ${formattedTitle}`);
    const defeatedEnemyName = encounter.value?.enemy;
    encounter.value = null;
    handleLootDrop();
    if (isBoss(defeatedEnemyName)) markBossDefeated();
    return;
  }
  gotoEnemyTurn();
}
