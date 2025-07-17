// src/utils/encounterHandler.js

import { generateEnemy } from "@/utils/encounterGenerator";

export function handleEncounterOption({
  option,
  playerState,
  gameData,
  enemyState,
  modalState,
  utilityFunctions,
}) {
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (option.responseText) {
    utilityFunctions.log(`You select: ${option.text}`);
    utilityFunctions.log(option.responseText);
    enemyState.encounterMessage.value = option.responseText;
  }

  if (option.result === "combat") {
    const enemy = generateEnemy();
    if (!enemy) {
      console.warn("Could not generate enemy from option, skipping combat.");
      enemyState.encounter.value = null;
      return;
    }

    enemyState.encounter.value = {
      type: "combat",
      enemy: enemy,
    };
    enemyState.enemyHP.value = enemy.currentHP;
    enemyState.nextEnemyAttack.value =
      Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) +
      enemy.minDamage;
    enemyState.enemyNextAction.value = "attack";
    playerState.combatEncountersFought.value++;
    utilityFunctions.log(
      `🗡️ Your choice has resulted in combat and you have been attacked by <strong>${
        gameData.formattedTitle.value
      }</strong> ${enemy.name ?? ""}. What do you do?`
    );
    return;
  }

  if (option.result === "item") {
    if (option.details === "health") {
      playerState.playerHP.value = playerState.playerHP.value + 5;
      utilityFunctions.log(
        `🎲 <span class="player-name">${playerState.playerName.value}</span> has gained +5 HP.`
      );
    }
    if (option.details === "health-major") {
      playerState.playerHP.value = playerState.playerHP.value + 15;
      utilityFunctions.log(
        `🎲 <span class="player-name">${playerState.playerName.value}</span> has gained +15 HP.`
      );
    }
    if (option.details === "weapon") {
      playerState.weaponBonus.value += 1;
      utilityFunctions.log(
        `🎲 <span class="player-name">${playerState.playerName.value}</span> found a weapon upgrade. Weapon damage +1 (Base Damage Total: +${playerState.weaponBonus.value})`
      );
    }
    if (option.details === "beer") {
      const duration = option.amount || 4;
      playerState.blurClicksLeft.value += duration;
      utilityFunctions.log(
        `🍺 <span class="player-name">${playerState.playerName.value}</span> chugs the beer. Your vision becomes blurry for ${duration} clicks.`
      );
    }
    if (option.details === "poison") {
      const duration = option.amount || 3;
      const damage = option.damage || 1;
      playerState.poisonedClicksLeft.value += duration;
      playerState.poisonDamagePerClick.value = damage;
      utilityFunctions.log(
        `🤢 <span class="player-name">${playerState.playerName.value}</span> is poisoned! You will lose ${damage} HP for the next ${duration} clicks.`
      );
    }
    if (option.details === "beer-health") {
      const duration = option.amount || 4;
      playerState.blurClicksLeft.value += duration;
      playerState.playerHP.value = playerState.playerHP.value + 5;
      utilityFunctions.log(
        `🍺 <span class="player-name">${playerState.playerName.value}</span> chugs the beer. Your vision becomes blurry for ${duration} clicks but you gain +5HP.`
      );
    }
    if (option.details === "gold") {
      const amount = option.amount || 0;
      playerState.playerGold.value += amount;
      utilityFunctions.log(
        `💰 <span class="player-name">${playerState.playerName.value}</span> found ${amount} Gold Pieces!`
      );
    }
  }

  if (option.result === "route" && option.details === "compass") {
    if (playerState.currentTargetIndex.value < 1) {
      gameData.current.value = gameData.chain[1];
      playerState.path.value.push(gameData.chain[1]);
      playerState.clickCount.value++;
      utilityFunctions.log(
        `🧭 The compass guides you directly to ${gameData.chain[1].replaceAll(
          "_",
          " "
        )}!`
      );
      playerState.currentTargetIndex.value = Math.max(
        playerState.currentTargetIndex.value,
        1
      );
      utilityFunctions.log(`✨ You feel a step closer to your goal.`);
    } else {
      utilityFunctions.log(
        `🧭 The compass seems to point to a place you've already been, or are already near. It offers no new path.`
      );
    }
    enemyState.encounter.value = null;
    modalState.bossOverlay.value = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (option.result === "damage") {
    playerState.playerHP.value = Math.max(playerState.playerHP.value - 5, 0);
    utilityFunctions.log(
      `🎲 <span class="player-name">${playerState.playerName.value}</span> took 5 damage.`
    );
  }
  if (option.result === "damage-minor") {
    playerState.playerHP.value = Math.max(playerState.playerHP.value - 1, 0);
    utilityFunctions.log(
      `🎲 <span class="player-name">${playerState.playerName.value}</span> took 1 damage.`
    );
  }
  if (option.result === "damage-major") {
    playerState.playerHP.value = Math.max(playerState.playerHP.value - 50, 0);
    utilityFunctions.log(
      `🎲 <span class="player-name">${playerState.playerName.value}</span> took 50 damage.`
    );
  }

  if (option.details === "weapon" && option.result !== "item") {
    playerState.weaponBonus.value += 1;
    utilityFunctions.log(
      `🎲 <span class="player-name">${playerState.playerName.value}</span> received a weapon upgrade! Weapon damage +1 (Base Damage Total: +${playerState.weaponBonus.value})`
    );
  }

  if (option.result === "special" && option.details === "recover") {
    const amount = option.amount || 1;
    playerState.specialUsesLeft.value += amount;
    utilityFunctions.log(
      `🎲 <span class="player-name">${
        playerState.playerName.value
      }</span> regained ${amount} special move${amount > 1 ? "s" : ""}!`
    );
  }

  if (option.result === "shortcut-damage") {
    const damageTaken = 10;
    const clicksReduced = 10;
    playerState.playerHP.value = Math.max(
      playerState.playerHP.value - damageTaken,
      0
    );
    playerState.clickCount.value = Math.max(
      0,
      playerState.clickCount.value - clicksReduced
    );
    playerState.shortcutsUsedCount.value++;
    utilityFunctions.log(
      `🎲 <span class="player-name">${playerState.playerName.value}</span> took ${damageTaken} damage for taking the shortcut, but saved ${clicksReduced} clicks.`
    );
  }
  if (option.result === "shortcut" && option.details === "clicks") {
    const amount = option.amount || 1;
    playerState.clickCount.value = Math.max(
      0,
      playerState.clickCount.value - amount
    );
    playerState.shortcutsUsedCount.value++;
    utilityFunctions.log(
      `🎲 <span class="player-name">${playerState.playerName.value}</span> discovered a shortcut! Click count reduced by ${amount}.`
    );
  }

  if (option.details === "shield") {
    playerState.shieldBonus.value += 1;
    utilityFunctions.log(
      `🛡️ <span class="player-name">${playerState.playerName.value}</span> has increased their Defense by +1 (Base Defense Total: +${playerState.shieldBonus.value})`
    );
  }

  if (option.routeTitle) {
    utilityFunctions.log(`📚 You choose: ${option.text}`);
    gameData.current.value = option.routeTitle;
    playerState.path.value.push(option.routeTitle);
    playerState.clickCount.value++;

    modalState.bossOverlay.value = false;
    enemyState.encounter.value = null;

    if (
      option.routeTitle ===
      gameData.chain[playerState.currentTargetIndex.value + 1]
    ) {
      playerState.currentTargetIndex.value++;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  enemyState.encounter.value = null;
  modalState.bossOverlay.value = false;
}
