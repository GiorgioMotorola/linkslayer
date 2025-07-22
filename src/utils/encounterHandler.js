// src/utils/encounterHandler.js

import { generateEnemy } from "@/utils/encounterGenerator";
import { generateMiniBoss } from "@/utils/miniBossGenerator";

export function handleEncounterOption({
  option,
  playerState,
  gameData,
  enemyState,
  modalState,
  utilityFunctions,
}) {
  window.scrollTo({ top: 0, behavior: "smooth" });

  const currentEncounter = enemyState.encounter.value;
  const isNpcEncounter = currentEncounter && currentEncounter.type === "npc";
  const isLoreEncounter = currentEncounter && currentEncounter.type === "lore";

  if (option.responseText) {
    utilityFunctions.log(`You select: ${option.text}`);
    utilityFunctions.log(option.responseText);
    enemyState.encounterMessage.value = option.responseText;
  }

  if (option.result === "dialogue_branch" && option.next_node_id) {
    if (isNpcEncounter && currentEncounter.npc.dialogueNodes) {
      const nextNode = currentEncounter.npc.dialogueNodes[option.next_node_id];
      if (nextNode) {
        enemyState.encounter.value = {
          ...currentEncounter,
          npc: {
            ...currentEncounter.npc,
            currentNodeId: option.next_node_id,
          },
        };
        return;
      } else {
        console.warn(
          `Dialogue node '${option.next_node_id}' not found for NPC.`
        );
        utilityFunctions.log(`NPC seems confused. The conversation ends.`);
        enemyState.encounter.value = null;
        modalState.bossOverlay.value = false;
        return;
      }
    } else if (isLoreEncounter && currentEncounter.lore.dialogueNodes) {
      const nextNode = currentEncounter.lore.dialogueNodes[option.next_node_id];
      if (nextNode) {
        enemyState.encounter.value = {
          ...currentEncounter,
          lore: {
            ...currentEncounter.lore,
            currentNodeId: option.next_node_id,
          },
        };
        return;
      } else {
        console.warn(
          `Dialogue node '${option.next_node_id}' not found for Lore.`
        );
        utilityFunctions.log(`You couldn't find more information.`);
        enemyState.encounter.value = null;
        modalState.bossOverlay.value = false;
        return;
      }
    }
  }

  if (option.result === "close_encounter") {
    enemyState.encounter.value = null;
    modalState.bossOverlay.value = false;
    return;
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
    effectiveMaxHP,
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
      enemyState.encounter.value = null;
      modalState.bossOverlay.value = false;
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
      playerHP.value = Math.min(
        Number(playerHP.value || 0) + 5,
        Number(effectiveMaxHP || 0)
      );
      log(
        `🎲 <span class="player-name">${playerName.value}</span> has gained +5 HP.`
      );
    }
    if (option.details === "health-major") {
      playerHP.value = Math.min(
        Number(playerHP.value || 0) + 15,
        Number(effectiveMaxHP || 0)
      );
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
      const duration = Number(option.amount) || 4;
      blurClicksLeft.value += duration;
      log(
        `🍺 <span class="player-name">${playerName.value}</span> chugs the beer. Your vision becomes blurry for ${duration} clicks.`
      );
    }
    if (option.details === "poison") {
      const duration = Number(option.amount) || 3;
      const damage = Number(option.damage) || 1;

      poisonedClicksLeft.value += duration;
      poisonDamagePerClick.value = damage;
      log(
        `🤢 <span class="player-name">${playerName.value}</span> is poisoned. You will lose ${damage} HP for the next ${duration} clicks.`
      );
    }
    if (option.details === "beer-health") {
      const duration = Number(option.amount) || 4;
      blurClicksLeft.value += duration;

      playerHP.value = Math.min(
        Number(playerHP.value || 0) + 5,
        Number(effectiveMaxHP || 0)
      );
      log(
        `🍺 <span class="player-name">${playerName.value}</span> chugs the beer. Your vision becomes blurry for ${duration} clicks but you gain +5HP.`
      );
    }
    if (option.details === "gold") {
      const amount = Number(option.amount) || 0;
      playerGold.value += amount;
      log(
        `💰 <span class="player-name">${playerName.value}</span> obtained ${amount} Gold Pieces.`
      );
    }
    if (option.details === "health-gold-loss") {
      const healthAmount = Number(option.healthAmount) || 0;
      const goldCost = Number(option.goldCost) || 0;

      if (playerGold.value >= goldCost) {
        playerHP.value = Math.min(
          Number(playerHP.value || 0) + healthAmount,
          Number(effectiveMaxHP || 0)
        );
        playerGold.value -= goldCost;
        log(
          `❤️‍🩹 <span class="player-name">${playerName.value}</span> gained ${healthAmount} HP but lost ${goldCost} Gold.`
        );
      } else {
        log(
          `❌ <span class="player-name">${playerName.value}</span> doesn't have enough Gold for this. (Need: ${goldCost}, Have: ${playerGold.value})`
        );
      }
    }
    if (option.details === "beer-cost-blur") {
      const duration = Number(option.amount) || 4;
      const goldCost = Number(option.goldCost) || 0;
      const healthAmount = Number(option.healthAmount) || 0;

      if (playerGold.value >= goldCost) {
        blurClicksLeft.value += duration;
        playerHP.value = Math.min(
          Number(playerHP.value || 0) + healthAmount,
          Number(effectiveMaxHP || 0)
        );
        playerGold.value -= goldCost;
        log(
          `🍺 <span class="player-name">${playerName.value}</span> chugs the beer. Your vision blurs for ${duration} clicks and you gained ${healthAmount} HP, but lost ${goldCost} Gold.`
        );
      } else {
        log(
          `❌ <span class="player-name">${playerName.value}</span> can't afford that drink! (Need: ${goldCost}, Have: ${playerGold.value})`
        );
      }
    }
    if (option.details === "shield") {
      shieldBonus.value += 1;
      log(
        `🛡️ <span class="player-name">${playerName.value}</span> has increased their Defense by +1 (Base Defense Total: +${shieldBonus.value})`
      );
    }
    enemyState.encounter.value = null;
    modalState.bossOverlay.value = false;
    return;
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
    } else if (option.id === "turkey_leg_consumable") {
      inventory.value.turkeyLegs++;
      log(
        `🍖 <span class="player-name">${playerName.value}</span> found a Turkey Leg!`
      );
    }
    log(option.responseText);
    enemyState.encounter.value = null;
    modalState.bossOverlay.value = false;
    return;
  }
  if (option.result === "damage") {
    playerHP.value = Math.max(Number(playerHP.value || 0) - 5, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 5 damage.`
    );
  }
  if (option.result === "damage-minor") {
    playerHP.value = Math.max(Number(playerHP.value || 0) - 1, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 1 damage.`
    );
  }
  if (option.result === "damage-major") {
    playerHP.value = Math.max(Number(playerHP.value || 0) - 50, 0);
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took 50 damage.`
    );
  }

  if (option.result === "mini_boss_combat") {
    const miniBoss = generateMiniBoss();
    if (!miniBoss) {
      console.warn("Could not generate mini-boss, skipping combat.");
      enemyState.encounter.value = null;
      modalState.bossOverlay.value = false;
      return;
    }

    enemyState.encounter.value = {
      type: "combat",
      enemy: miniBoss,
      isMiniBoss: true,
    };
    enemyState.enemyHP.value = miniBoss.currentHP;
    enemyState.nextEnemyAttack.value =
      Math.floor(
        Math.random() * (miniBoss.maxDamage - miniBoss.minDamage + 1)
      ) + miniBoss.minDamage;
    enemyState.enemyNextAction.value = "attack";
    combatEncountersFought.value++;
    log(
      `💥 Your choice has led to a fierce battle! You are attacked by the mini-boss: <strong>${miniBoss.name}</strong>! What do you do?`
    );
    return;
  }

  if (option.details === "weapon" && option.result !== "item") {
    weaponBonus.value += 1;
    log(
      `🎲 <span class="player-name">${playerName.value}</span> received a weapon upgrade. Weapon damage +1 (Base Damage Total: +${weaponBonus.value})`
    );
  }

  if (option.result === "special" && option.details === "recover") {
    const amount = Number(option.amount) || 1;
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
    playerHP.value = Math.max(Number(playerHP.value || 0) - damageTaken, 0);
    clickCount.value = Math.max(0, clickCount.value - clicksReduced);
    shortcutsUsedCount.value++;
    log(
      `🎲 <span class="player-name">${playerName.value}</span> took ${damageTaken} damage for taking the shortcut, but saved ${clicksReduced} clicks.`
    );
  }
  if (option.result === "shortcut" && option.details === "clicks") {
    const amount = Number(option.amount) || 1;
    clickCount.value = Math.max(0, clickCount.value - amount);
    shortcutsUsedCount.value++;
    log(
      `🎲 <span class="player-name">${playerName.value}</span> discovered a shortcut. Click count reduced by ${amount}.`
    );
  }

  if (option.routeTitle) {
    utilityFunctions.log(`📚 You choose: ${option.text}`);
    gameData.current.value = option.routeTitle;
    path.value.push(option.routeTitle);
    playerState.clickCount.value++;

    enemyState.encounter.value = null;
    modalState.bossOverlay.value = false;

    if (option.routeTitle === chain[playerState.currentTargetIndex.value + 1]) {
      playerState.currentTargetIndex.value++;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (currentEncounter !== null) {
    enemyState.encounter.value = null;
    modalState.bossOverlay.value = false;
    utilityFunctions.log(
      `Encounter closed by fallback for option result: ${
        option.result || "none"
      }`
    );
  }
}
