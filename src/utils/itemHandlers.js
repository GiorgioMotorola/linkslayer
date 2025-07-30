// src/utils/itemHandlers.js
import { shopItems } from "@/utils/shopItems";

export function handleShopPurchase(
  item,
  playerState,
  gameData,
  utilityFunctions
) {
  let purchased = false;
  if (item.isSpecialLoot) {
    purchased = true;
    utilityFunctions.log(
      `✨ <span class="player-name">${gameData.playerName.value}</span> obtained ${item.name}.`
    );
  } else if (playerState.playerGold.value >= item.cost) {
    playerState.playerGold.value -= item.cost;
    purchased = true;
    utilityFunctions.log(
      `💸 <span class="player-name">${gameData.playerName.value}</span> purchased ${item.name} for ${item.cost} Gold.`
    );
  } else {
    utilityFunctions.log(
      `❌ Not enough Gold for ${item.name}. (Cost: ${item.cost}, You have: ${playerState.playerGold.value})`
    );
    return;
  }

  if (purchased) {
    switch (item.effect) {
      case "health":
        playerState.playerHP.value = Math.min(
          playerState.playerHP.value + item.amount,
          playerState.effectiveMaxHP.value
        );
        utilityFunctions.log(
          `➕ ${gameData.playerName.value} gained ${item.amount} HP.`
        );
        break;
      case "weapon":
        playerState.weaponBonus.value += item.amount;
        utilityFunctions.log(
          `🗡️ ${gameData.playerName.value} gained +${item.amount} Weapon Bonus.`
        );
        break;
      case "shield":
        playerState.shieldBonus.value += item.amount;
        utilityFunctions.log(
          `🛡️ ${gameData.playerName.value} gained +${item.amount} Defense Bonus.`
        );
        break;
      case "special":
        playerState.specialUsesLeft.value += item.amount;
        utilityFunctions.log(
          `✨ ${gameData.playerName.value} gained +${item.amount} Ability charges.`
        );
        break;
      case "longRest":
        playerState.longRestsUsed.value = Math.max(
          0,
          playerState.longRestsUsed.value - item.amount
        );
        utilityFunctions.log(
          `🛌 ${gameData.playerName.value} refreshed ${item.amount} Long Rest(s).`
        );
        break;
      case "shortRest":
        playerState.shortRestsUsed.value = Math.max(
          0,
          playerState.shortRestsUsed.value - item.amount
        );
        utilityFunctions.log(
          `🧘 ${gameData.playerName.value} refreshed ${item.amount} Short Rest(s).`
        );
        break;
      case "blurCure":
        playerState.blurClicksLeft.value = 0;
        utilityFunctions.log(`🧼 ${gameData.playerName.value} sobered up.`);
        break;

      case "inventoryItem":
        if (item.details === "compass") {
          playerState.inventory.value.compass++;
          utilityFunctions.log(
            `🧭 ${gameData.playerName.value} acquired an Arcane Compass.`
          );
        } else if (item.details === "healthPotion") {
          playerState.inventory.value.healthPotions++;
          utilityFunctions.log(
            `➕ ${gameData.playerName.value} acquired a Health Potion.`
          );
        } else if (item.details === "turkeyLeg") {
          playerState.inventory.value.turkeyLegs++;
          utilityFunctions.log(
            `🍗 ${gameData.playerName.value} acquired a Turkey Leg.`
          );
        } else if (item.details === "barkTea") {
          playerState.inventory.value.barkTeas =
            Number(playerState.inventory.value.barkTeas || 0) + 1;
          utilityFunctions.log(
            `☕ ${gameData.playerName.value} acquired Bark Tea.`
          );
        } else if (item.details === "invisibilityCloak") {
          playerState.inventory.value.invisibilityCloaks++;
          utilityFunctions.log(
            `👻 ${gameData.playerName.value} acquired a Cloak of Invisibility.`
          );
          console.log(
            "Inventory after cloak purchase:",
            playerState.inventory.value
          );
        } else if (item.details === "stickItem") {
          playerState.inventory.value.stickItem++;
          utilityFunctions.log(
            `😎 ${gameData.playerName.value} acquired a Cool Stick.`
          );
        } else if (item.details === "herbalPoultice") {
          playerState.inventory.value.herbalPoultices++;
          utilityFunctions.log(
            `🌿 ${gameData.playerName.value} acquired a Herbal Poultice.`
          );
        } else if (item.details === "frenchOnionSoup") {
          playerState.inventory.value.frenchOnionSoups =
            Number(playerState.inventory.value.frenchOnionSoups || 0) + 1;
          utilityFunctions.log(
            `🥣 ${gameData.playerName.value} acquired French Onion Soup.`
          );
        } else if (item.details === "smokeBomb") {
          playerState.inventory.value.smokeBombs =
            Number(playerState.inventory.value.smokeBombs || 0) + 1;
          utilityFunctions.log(
            `💨 ${gameData.playerName.value} acquired a Smoke Bomb.`
          );
        } else if (item.details === "antidote") {
          playerState.inventory.value.antidotes =
            Number(playerState.inventory.value.antidotes || 0) + 1;
          utilityFunctions.log(
            `🧪 ${gameData.playerName.value} acquired an Antidote.`
          );
        } else if (item.details === "adventurersRations") {
          playerState.inventory.value.adventurersRations =
            Number(playerState.inventory.value.adventurersRations || 0) + 1;
          utilityFunctions.log(
            `🍞 ${gameData.playerName.value} acquired Adventurer's Rations.`
          );
        } else if (item.details === "enlightenmentFish") {
          playerState.inventory.value.enlightenmentFish = 1;
          utilityFunctions.log(
            `🐟 ${gameData.playerName.value} acquired The Fish of Eternal Enlightenment.`
          );
        } else if (item.details === "sharedSufferingAmulet") {
          playerState.inventory.value.sharedSufferingAmulets =
            Number(playerState.inventory.value.sharedSufferingAmulets || 0) + 1;
          utilityFunctions.log(
            `💔 ${gameData.playerName.value} acquired an Amulet of Shared Suffering.`
          );
        } else if (item.details === "minorHealthPotion") {
          playerState.inventory.value.minorHealthPotions =
            Number(playerState.inventory.value.minorHealthPotions || 0) + 1;
          utilityFunctions.log(
            `➕ ${gameData.playerName.value} acquired a Potion of Minor Health.`
          );
        }
        break;

      default:
        break;
    }
  }
}

export function useCompass(
  playerState,
  gameData,
  modalState,
  utilityFunctions,
  combatData
) {
  const fullChain = gameData.chain;

  if (playerState.inventory.value.compass <= 0) {
    utilityFunctions.log(`🧭 You don't have any Arcane Compasses to use.`);
    return;
  }

  playerState.inventory.value.compass--;
  utilityFunctions.log(`🧭 You use an Arcane Compass!`);

  if (!fullChain || fullChain.length === 0) {
    utilityFunctions.log(
      `🧭 The compass spins wildly; there's no defined path to jump within yet.`
    );
    console.warn(
      "useCompass: Attempted to use compass when fullChain is undefined or empty."
    );
    return;
  }

  if (
    combatData.encounter.value &&
    combatData.encounter.value.type === "combat" &&
    utilityFunctions.isBoss(combatData.encounter.value.enemy)
  ) {
    utilityFunctions.log(
      `🚫 You cannot use the Arcane Compass during a boss battle.`
    );
    return;
  }

  const startArticle = fullChain[0];
  const endArticle = fullChain[fullChain.length - 1];

  const potentialTargets = fullChain.filter((article) => {
    return (
      article !== startArticle &&
      article !== endArticle &&
      article !== playerState.current.value
    );
  });

  if (potentialTargets.length > 0) {
    const randomIndex = Math.floor(Math.random() * potentialTargets.length);
    const targetArticle = potentialTargets[randomIndex];

    playerState.current.value = targetArticle;
    playerState.path.value.push(targetArticle);
    playerState.clickCount.value++;
    playerState.shortcutsUsedCount.value++;

    utilityFunctions.log(
      `🧭 The compass pulls you, disorienting you for a moment, then guides you directly to ${targetArticle.replaceAll(
        "_",
        " "
      )}.`
    );

    const targetIndexInChain = fullChain.indexOf(targetArticle);
    playerState.currentTargetIndex.value = targetIndexInChain;

    utilityFunctions.log(`✨ You feel a step closer to your goal.`);
  } else {
    utilityFunctions.log(
      `🧭 The compass seems confused; there are no intermediate paths to jump to. (Perhaps you're at the start/end or only one article in length?)`
    );
  }

  if (combatData.encounter.value) {
    utilityFunctions.log(
      `The previous encounter was disrupted by the compass's pull.`
    );
    combatData.encounter.value = null;
    modalState.bossOverlay.value = false;
  }
  utilityFunctions.nextTick(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

export const useHealthPotion = (
  playerState,
  utilityFunctions,
  itemConstants
) => {
  if (playerState.inventory.value.healthPotions > 0) {
    playerState.inventory.value.healthPotions--;
    playerState.playerHP.value = Math.min(
      playerState.playerHP.value + itemConstants.HEALTH_POTION_HEAL_AMOUNT,
      playerState.effectiveMaxHP.value
    );
    utilityFunctions.log(
      `You consumed a Health Potion and recovered ${itemConstants.HEALTH_POTION_HEAL_AMOUNT} HP. Your HP is now ${playerState.playerHP.value}.`
    );
  } else {
    utilityFunctions.log("You don't have any Health Potions to use.");
  }
};

export const useTurkeyLeg = (playerState, utilityFunctions, itemConstants) => {
  if (playerState.inventory.value.turkeyLegs > 0) {
    playerState.inventory.value.turkeyLegs--;
    playerState.playerHP.value = Math.min(
      playerState.playerHP.value + itemConstants.TURKEY_LEG_HEAL_AMOUNT,
      playerState.effectiveMaxHP.value
    );
    utilityFunctions.log(
      `🍖 You consumed a Turkey Leg and recovered ${itemConstants.TURKEY_LEG_HEAL_AMOUNT} HP. Your HP is now ${playerState.playerHP.value}.`
    );
  } else {
    utilityFunctions.log("You don't have any Turkey Legs to use.");
  }
};

export const useBarkTea = (playerState, utilityFunctions, itemConstants) => {
  if (playerState.inventory.value.barkTeas > 0) {
    playerState.inventory.value.barkTeas--;
    playerState.playerHP.value = Math.min(
      playerState.playerHP.value + itemConstants.BARK_TEA_HEAL_AMOUNT,
      playerState.effectiveMaxHP.value
    );
    utilityFunctions.log(
      `☕ You drank Bark Team and recovered ${itemConstants.BARK_TEA_HEAL_AMOUNT} HP. Your HP is now ${playerState.playerHP.value}.`
    );
  } else {
    utilityFunctions.log("You don't have any Bark Tea to use.");
  }
};

export const useFrenchOnionSoup = (
  playerState,
  utilityFunctions,
  itemConstants
) => {
  if (playerState.inventory.value.frenchOnionSoups > 0) {
    playerState.inventory.value.frenchOnionSoups =
      Number(playerState.inventory.value.frenchOnionSoups || 0) - 1;

    const healedAmount = itemConstants.FRENCH_ONION_SOUP_HEAL_AMOUNT;
    playerState.playerHP.value = Math.min(
      playerState.playerHP.value + healedAmount,
      playerState.effectiveMaxHP.value
    );

    const specialRestored = itemConstants.FRENCH_ONION_SOUP_SPECIAL_AMOUNT;
    playerState.specialUsesLeft.value += specialRestored;

    utilityFunctions.log(
      `🥣 You consumed French Onion Soup and recovered ${healedAmount} HP and ${specialRestored} special use. Your HP is now ${playerState.playerHP.value}.`
    );
  } else {
    utilityFunctions.log("You don't have any French Onion Soup to use.");
  }
};

export const useAntidote = (playerState, utilityFunctions) => {
  if (playerState.inventory.value.antidotes > 0) {
    if (playerState.poisonedClicksLeft.value > 0) {
      playerState.inventory.value.antidotes =
        Number(playerState.inventory.value.antidotes || 0) - 1;
      playerState.poisonedClicksLeft.value = 0;
      playerState.poisonDamagePerClick.value = 0;
      utilityFunctions.log(
        `✅ You consumed an Antidote. The poison has been neutralized.`
      );
      utilityFunctions.closeInventoryModal();
    } else {
      utilityFunctions.log(
        `🚫 You are not poisoned. You don't need to use an Antidote.`
      );
    }
  } else {
    utilityFunctions.log("You don't have any Antidotes to use.");
  }
};

export const useInvisibilityCloak = (
  playerState,
  utilityFunctions,
  itemConstants
) => {
  if (playerState.isCloakActive.value) {
    utilityFunctions.log(`👻 The Cloak of Invisibility is already active.`);
    return;
  }
  if (playerState.inventory.value.invisibilityCloaks > 0) {
    playerState.inventory.value.invisibilityCloaks--;
    playerState.isCloakActive.value = true;
    playerState.cloakClicksRemaining.value = itemConstants.CLOAK_DURATION;
    utilityFunctions.log(
      `👻 You don the Cloak of Invisibility. You will avoid non-boss encounters for ${itemConstants.CLOAK_DURATION} clicks.`
    );
  } else {
    utilityFunctions.log(`👻 You don't have a Cloak of Invisibility.`);
  }
};

export const useHerbalPoultice = (playerState, utilityFunctions) => {
  if (playerState.healthRegenActive.value) {
    utilityFunctions.log(`🌿 A health regeneration effect is already active.`);
    return;
  }
  if (playerState.inventory.value.herbalPoultices > 0) {
    playerState.inventory.value.herbalPoultices--;

    const poulticeDetails = shopItems.find(
      (i) => i.details === "herbalPoultice"
    );
    if (poulticeDetails) {
      playerState.healthRegenActive.value = true;
      playerState.healthRegenAmount.value = poulticeDetails.amount;
      playerState.healthRegenClicksRemaining.value =
        poulticeDetails.durationClicks;
      playerState.healthRegenMaxHeal.value = poulticeDetails.maxHeal;
      playerState.healthRegenHealedCount.value = 0;
      utilityFunctions.log(
        `🌿 You applied a Herbal Poultice. Health will regenerate for ${poulticeDetails.durationClicks} clicks.`
      );
    } else {
      utilityFunctions.log(`Error: Herbal Poultice details not found.`);
      playerState.inventory.value.herbalPoultices++;
    }
  } else {
    utilityFunctions.log("You don't have any Herbal Poultices to use.");
  }
};

export const useSmokeBomb = (
  playerState,
  utilityFunctions,
  combatData,
  modalState
) => {
  if (playerState.inventory.value.smokeBombs > 0) {
    if (
      combatData.encounter.value &&
      combatData.encounter.value.type === "combat"
    ) {
      if (utilityFunctions.isBoss(combatData.encounter.value.enemy)) {
        utilityFunctions.log(
          `🚫 You cannot use a Smoke Bomb during a boss battle.`
        );
        return;
      }

      playerState.inventory.value.smokeBombs =
        Number(playerState.inventory.value.smokeBombs || 0) - 1;
      utilityFunctions.log(
        `💨 You throw a Smoke Bomb. You swiftly escape the combat.`
      );
      combatData.encounter.value = null;
      modalState.bossOverlay.value = false;
      utilityFunctions.closeInventoryModal();
    } else {
      utilityFunctions.log(`🚫 You can only use a Smoke Bomb during combat.`);
    }
  } else {
    utilityFunctions.log("You don't have any Smoke Bombs to use.");
  }
};

export const useAdventurersRations = (
  playerState,
  utilityFunctions,
  itemConstants
) => {
  if (playerState.inventory.value.adventurersRations > 0) {
    playerState.inventory.value.adventurersRations =
      Number(playerState.inventory.value.adventurersRations || 0) - 1;

    const healedAmount = itemConstants.ADVENTURERS_RATIONS_HEAL_AMOUNT;
    playerState.playerHP.value = Math.min(
      playerState.playerHP.value + healedAmount,
      playerState.effectiveMaxHP.value
    );

    if (playerState.blurClicksLeft.value > 0) {
      playerState.blurClicksLeft.value = 0;
      utilityFunctions.log(`✨ Your vision clears.`);
    }

    utilityFunctions.log(
      `🍞 You consumed Adventurer's Rations and recovered ${healedAmount} HP.`
    );
    utilityFunctions.closeInventoryModal();
  } else {
    utilityFunctions.log("You don't have any Adventurer's Rations to use.");
  }
};

export const useEnlightenmentFish = (
  playerState,
  utilityFunctions,
  fishHPState
) => {
  if (playerState.inventory.value.enlightenmentFish > 0) {
    const healedAmount = fishHPState.enlightenmentFishAccumulatedHP.value;
    if (healedAmount <= 0) {
      utilityFunctions.log(
        `🐟 The Fish of Eternal Enlightenment has no HP accumulated yet.`
      );
      return;
    }

    playerState.playerHP.value = Math.min(
      playerState.playerHP.value + healedAmount,
      playerState.effectiveMaxHP.value
    );
    playerState.inventory.value.enlightenmentFish--;
    fishHPState.enlightenmentFishAccumulatedHP.value = 0;

    utilityFunctions.log(
      `🐟 You consumed The Fish of Eternal Enlightenment and recovered ${healedAmount} HP. Your HP is now ${playerState.playerHP.value}.`
    );
  } else {
    utilityFunctions.log("You don't have The Fish of Eternal Enlightenment.");
  }
};

export const useAmuletOfSharedSuffering = (
  playerState,
  utilityFunctions,
  combatData,
  itemConstants
) => {
  if (playerState.inventory.value.sharedSufferingAmulets <= 0) {
    utilityFunctions.log(
      `💔 You don't have an Amulet of Shared Suffering to use.`
    );
    return;
  }

  const isInCombat =
    combatData.encounter.value && combatData.encounter.value.type === "combat";

  if (!isInCombat) {
    utilityFunctions.log(
      `🚫 The Amulet of Shared Suffering can only be used in combat.`
    );
    return;
  }

  const enemyDamage = itemConstants.AMULET_ENEMY_DAMAGE;
  const playerDamage = itemConstants.AMULET_PLAYER_DAMAGE;

  playerState.inventory.value.sharedSufferingAmulets--;

  combatData.enemyHP.value = Math.max(
    0,
    combatData.enemyHP.value - enemyDamage
  );
  utilityFunctions.log(
    `💔 You activate the Amulet of Shared Suffering. The enemy takes ${enemyDamage} damage.`
  );

  playerState.playerHP.value = Math.max(
    0,
    playerState.playerHP.value - playerDamage
  );
  utilityFunctions.log(
    `💔 You also feel the pain, taking ${playerDamage} damage.`
  );

  if (combatData.enemyHP.value <= 0) {
    utilityFunctions.log(`💥 The enemy was defeated by the amulet's power.`);
    utilityFunctions.handleLootDrop(combatData.encounter.value.enemy);
    utilityFunctions.handleCloseEncounter();
  } else {
    utilityFunctions.log(`Enemy HP: ${combatData.enemyHP.value}`);
  }

  utilityFunctions.closeInventoryModal();
};

export const useMinorHealthPotion = (
  playerState,
  utilityFunctions,
  itemConstants
) => {
  if (playerState.inventory.value.minorHealthPotions > 0) {
    playerState.inventory.value.minorHealthPotions--;
    playerState.playerHP.value = Math.min(
      playerState.playerHP.value +
        itemConstants.MINOR_HEALTH_POTION_HEAL_AMOUNT,
      playerState.effectiveMaxHP.value
    );
    utilityFunctions.log(
      `You consumed a Potion of Minor Health and recovered ${itemConstants.MINOR_HEALTH_POTION_HEAL_AMOUNT} HP. Your HP is now ${playerState.playerHP.value}.`
    );
  } else {
    utilityFunctions.log("You don't have any Potions of Minor Health to use.");
  }
};
