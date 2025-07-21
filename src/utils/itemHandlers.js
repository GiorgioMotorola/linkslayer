// src/utils/itemHandlers.js
import { shopItems } from "@/utils/shopItems";

export function handleShopPurchase(
  item,
  playerState,
  gameData,
  utilityFunctions
) {
  let purchased = false;
  if (playerState.playerGold.value >= item.cost) {
    playerState.playerGold.value -= item.cost;
    purchased = true;
    utilityFunctions.log(
      `💸 <span class="player-name">${gameData.playerName.value}</span> purchased ${item.name} for ${item.cost} Gold.`
    );

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
        }
        break;

      default:
        break;
    }
  } else {
    utilityFunctions.log(
      `❌ Not enough Gold for ${item.name}. (Cost: ${item.cost}, You have: ${playerState.playerGold.value})`
    );
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
    utilityFunctions.log(`🧭 You don't have any Arcane Compasses to use!`);
    return;
  }

  playerState.inventory.value.compass--;
  utilityFunctions.log(`🧭 You use an Arcane Compass!`);

  if (!fullChain || fullChain.length === 0) {
    utilityFunctions.log(
      `🧭 The compass spins wildly; there's no defined path to jump within yet!`
    );
    console.warn(
      "useCompass: Attempted to use compass when fullChain is undefined or empty."
    );
    utilityFunctions.closeInventoryModal();
    return;
  }

  if (
    combatData.encounter.value &&
    combatData.encounter.value.type === "combat" &&
    utilityFunctions.isBoss(combatData.encounter.value.enemy)
  ) {
    utilityFunctions.log(
      `🚫 You cannot use the Arcane Compass during a boss battle!`
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
      )}!`
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
      `You consumed a Health Potion and recovered ${itemConstants.HEALTH_POTION_HEAL_AMOUNT} HP! Your HP is now ${playerState.playerHP.value}.`
    );
    utilityFunctions.closeInventoryModal();
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
      `🍖 You consumed a Turkey Leg and recovered ${itemConstants.TURKEY_LEG_HEAL_AMOUNT} HP! Your HP is now ${playerState.playerHP.value}.`
    );
  } else {
    utilityFunctions.log("You don't have any Turkey Legs to use.");
  }
};

export const useInvisibilityCloak = (
  playerState,
  utilityFunctions,
  itemConstants
) => {
  if (playerState.isCloakActive.value) {
    utilityFunctions.log(`👻 The Cloak of Invisibility is already active!`);
    return;
  }
  if (playerState.inventory.value.invisibilityCloaks > 0) {
    playerState.inventory.value.invisibilityCloaks--;
    playerState.isCloakActive.value = true;
    playerState.cloakClicksRemaining.value = itemConstants.CLOAK_DURATION;
    utilityFunctions.log(
      `👻 You don the Cloak of Invisibility! You will avoid non-boss encounters for ${itemConstants.CLOAK_DURATION} clicks.`
    );
  } else {
    utilityFunctions.log(`👻 You don't have a Cloak of Invisibility.`);
  }
};

export const useHerbalPoultice = (playerState, utilityFunctions) => {
  if (playerState.healthRegenActive.value) {
    utilityFunctions.log(`🌿 A health regeneration effect is already active!`);
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
        `🌿 You applied a Herbal Poultice! Health will regenerate for ${poulticeDetails.durationClicks} clicks.`
      );
      utilityFunctions.closeInventoryModal();
    } else {
      utilityFunctions.log(`Error: Herbal Poultice details not found.`);
      playerState.inventory.value.herbalPoultices++;
    }
  } else {
    utilityFunctions.log("You don't have any Herbal Poultices to use.");
  }
};
