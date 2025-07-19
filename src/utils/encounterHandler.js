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

  const {
    playerHP,
    playerName,
    playerClass,
    combatEncountersFought,
    specialUsesLeft,
    weaponBonus,
    shieldBonus,
    blurClicksLeft,
    poisonedClicksLeft,
    poisonDamagePerClick,
    playerGold,
    currentTargetIndex,
    path,
    clickCount,
    shortcutsUsedCount,
    inventory,
  } = playerState;

  const { log } = utilityFunctions;

  const {
    encounter,
    enemyHP,
    encounterMessage,
    nextEnemyAttack,
    enemyNextAction,
  } = enemyState;
  const { current, formattedTitle, chain } = gameData;
  const { bossOverlay } = modalState;

  if (option.result === "combat") {
    const enemy = generateEnemy();
    if (!enemy) {
      console.warn("Could not generate enemy from option, skipping combat.");
      encounter.value = null;
      return;
    }

    encounter.value = {
      type: "combat",
      enemy: enemy,
    };
    enemyHP.value = enemy.currentHP;
    nextEnemyAttack.value =
      Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) +
      enemy.minDamage;
    enemyNextAction.value = "attack";
    combatEncountersFought.value++;
    log(
      `🗡️ Your choice has resulted in combat and you have been attacked by <strong>${
        formattedTitle.value
      }</strong> ${enemy.name ?? ""}. What do you do?`
    );
    return;
  }

  if (option.result === "item") {
    if (option.details === "health") {
      playerHP.value = playerHP.value + 5;
      log(
        `🎲 <span class="player-name">${playerName.value}</span> has gained +5 HP.`
      );
    }

    if (option.details === "health-major") {
      playerHP.value = playerHP.value + 15;
      log(
        `🎲 <span class="player-name">${playerName.value}</span> has gained +15 HP.`
      );
    }
    if (option.details === "weapon") {
      weaponBonus.value += 1;
      log(
        `🎲 <span class="player-name">${playerName.value}</span> found a weapon upgrade. Weapon damage +1 (Base Damage Total: +${weaponBonus.value})`
      );
    }
    if (option.details === "beer") {
      const duration = option.amount || 4;
      blurClicksLeft.value += duration;
      log(
        `🍺 <span class="player-name">${playerName.value}</span> chugs the beer. Your vision becomes blurry for ${duration} clicks.`
      );
    }
    if (option.details === "poison") {
      const duration = option.amount || 3;
      const damage = option.damage || 1;
      poisonedClicksLeft.value += duration;
      poisonDamagePerClick.value = damage;
      log(
        `🤢 <span class="player-name">${playerName.value}</span> is poisoned. You will lose ${damage} HP for the next ${duration} clicks.`
      );
    }
    if (option.details === "beer-health") {
      const duration = option.amount || 4;
      blurClicksLeft.value += duration;
      playerHP.value = playerHP.value + 5;
      log(
        `🍺 <span class="player-name">${playerName.value}</span> chugs the beer. Your vision becomes blurry for ${duration} clicks but you gain +5HP.`
      );
    }
    if (option.details === "gold") {
      const amount = option.amount || 0;
      playerGold.value += amount;
      log(
        `💰 <span class="player-name">${playerName.value}</span> obtained ${amount} Gold Pieces.`
      );
    }
  } else if (option.result === "inventoryItem") {
    if (option.id === "health_potion_consumable") {
      inventory.value.healthPotions++;
      log(
        `➕ <span class="player-name">${playerName.value}</span> found a Health Potion!`
      );
    } else if (option.id === "arcane_compass") {
      inventory.value.compass++;
      log(
        `🧭 <span class="player-name">${playerName.value}</span> found an Arcane Compass!`
      );
    }
    log(option.responseText);
    encounter.value = null;
    bossOverlay.value = false;
    return null;
  }

  encounter.value = null;
  bossOverlay.value = false;

  if (option.result === "damage") {
    playerHP.value = Math.max(playerHP.value - 5, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 5 damage.`
    );
  }
  if (option.result === "damage-minor") {
    playerHP.value = Math.max(playerHP.value - 1, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 1 damage.`
    );
  }
  if (option.result === "damage-major") {
    playerHP.value = Math.max(playerHP.value - 50, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 50 damage.`
    );
  }

  if (option.details === "weapon" && option.result !== "item") {
    weaponBonus.value += 1;
    log(
      `🎲 <span class="player-name">${playerName.value}</span> received a weapon upgrade. Weapon damage +1 (Base Damage Total: +${weaponBonus.value})`
    );
  }

  if (option.result === "special" && option.details === "recover") {
    const amount = option.amount || 1;
    specialUsesLeft.value += amount;
    log(
      `🎲 <span class="player-name">${
        playerName.value
      }</span> regained ${amount} class ability charges ${
        amount > 1 ? "s" : ""
      }.`
    );
  }

  if (option.result === "shortcut-damage") {
    const damageTaken = 10;
    const clicksReduced = 10;
    playerHP.value = Math.max(playerHP.value - damageTaken, 0);
    clickCount.value = Math.max(0, clickCount.value - clicksReduced);
    shortcutsUsedCount.value++;
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took ${damageTaken} damage for taking the shortcut, but saved ${clicksReduced} clicks.`
    );
  }
  if (option.result === "shortcut" && option.details === "clicks") {
    const amount = option.amount || 1;
    clickCount.value = Math.max(0, clickCount.value - amount);
    shortcutsUsedCount.value++;
    log(
      `🎲 <span class="player-name">${playerName.value}</span> discovered a shortcut. Click count reduced by ${amount}.`
    );
  }

  if (option.details === "shield") {
    shieldBonus.value += 1;
    log(
      `🛡️ <span class="player-name">${playerName.value}</span> has increased their Defense by +1 (Base Defense Total: +${shieldBonus.value})`
    );
  }

  if (option.routeTitle) {
    log(`📚 You choose: ${option.text}`);
    current.value = option.routeTitle;
    path.value.push(option.routeTitle);
    clickCount.value++;

    bossOverlay.value = false;
    encounter.value = null;

    if (option.routeTitle === chain[currentTargetIndex.value + 1]) {
      currentTargetIndex.value++;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // These lines here are redundant if all other branches return null or handle closing themselves.
  // If this is meant as a default 'close' when nothing else applies, it's fine.
  // encounter.value = null;
  // bossOverlay.value = false;
}
