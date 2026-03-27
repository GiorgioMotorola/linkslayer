import { shopItems } from "@/utils/shopItems";

export function handleShopPurchase(
  item,
  playerState,
  gameData,
  utilityFunctions,
  modalState
) {
  let purchased = false;
  if (item.details === "dog" && playerState.dogName?.value) {
    utilityFunctions.log(`<i class="ra ra-pawprint"></i> You already have a companion: ${playerState.dogName.value}!`);
    return;
  }
  if (item.isSpecialLoot) {
    purchased = true;
    utilityFunctions.log(
      `<i class="ra ra-aura"></i> <span class="player-name">${gameData.playerName.value}</span> obtained ${item.name}.`
    );
  } else if (playerState.playerGold.value >= item.cost) {
    playerState.playerGold.value -= item.cost;
    if (playerState.goldSpent) playerState.goldSpent.value += item.cost;
    purchased = true;
    utilityFunctions.log(
      `<i class="ra ra-gold-bar"></i> <span class="player-name">${gameData.playerName.value}</span> purchased ${item.name} for ${item.cost} Gold.`
    );
  } else {
    utilityFunctions.log(
      `<i class="ra ra-x-mark"></i> Not enough Gold for ${item.name}. (Cost: ${item.cost}, You have: ${playerState.playerGold.value})`
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
          `+ ${gameData.playerName.value} gained ${item.amount} HP.`
        );
        break;
      case "weapon":
        playerState.weaponBonus.value += item.amount;
        utilityFunctions.log(
          `<i class="ra ra-plain-dagger"></i> ${gameData.playerName.value} gained +${item.amount} Weapon Bonus.`
        );
        break;
      case "shield":
        playerState.shieldBonus.value += item.amount;
        utilityFunctions.log(
          `<i class="ra ra-shield"></i> ${gameData.playerName.value} gained +${item.amount} Defense Bonus.`
        );
        break;
      case "special":
        playerState.specialUsesLeft.value += item.amount;
        utilityFunctions.log(
          `<i class="ra ra-aura"></i> ${gameData.playerName.value} gained +${item.amount} Ability charges.`
        );
        break;
      case "longRest":
        playerState.longRestsUsed.value = Math.max(
          0,
          playerState.longRestsUsed.value - item.amount
        );
        utilityFunctions.log(
          `<i class="ra ra-campfire"></i> ${gameData.playerName.value} refreshed ${item.amount} Long Rest(s).`
        );
        break;
      case "shortRest":
        playerState.shortRestsUsed.value = Math.max(
          0,
          playerState.shortRestsUsed.value - item.amount
        );
        utilityFunctions.log(
          `<i class="ra ra-campfire"></i> ${gameData.playerName.value} refreshed ${item.amount} Short Rest(s).`
        );
        break;
      case "blurCure":
        playerState.blurClicksLeft.value = 0;
        utilityFunctions.log(`<i class="ra ra-flask"></i> ${gameData.playerName.value} sobered up.`);
        break;

      case "weaponAugment":
        if (!playerState.inventory.value.pendingWeaponAugments) {
          playerState.inventory.value.pendingWeaponAugments = [];
        }
        playerState.inventory.value.pendingWeaponAugments.push(item.details);
        utilityFunctions.log(
          `<i class="ra ra-cog"></i> ${gameData.playerName.value} acquired <strong>${item.name}</strong> — install it at the Forge.`
        );
        break;

      case "defenseAugment":
        if (!playerState.inventory.value.pendingDefenseAugments) {
          playerState.inventory.value.pendingDefenseAugments = [];
        }
        playerState.inventory.value.pendingDefenseAugments.push(item.details);
        utilityFunctions.log(
          `<i class="ra ra-cog"></i> ${gameData.playerName.value} acquired <strong>${item.name}</strong> — install it at the Forge.`
        );
        break;

      case "inventoryItem":
        if (item.details === "compass") {
          playerState.inventory.value.compass++;
          utilityFunctions.log(
            `<i class="ra ra-compass"></i> ${gameData.playerName.value} acquired an Arcane Compass.`
          );
        } else if (item.details === "healthPotion") {
          playerState.inventory.value.healthPotions++;
          utilityFunctions.log(
            `+ ${gameData.playerName.value} acquired a Health Potion.`
          );
        } else if (item.details === "turkeyLeg") {
          playerState.inventory.value.turkeyLegs++;
          utilityFunctions.log(
            `<i class="ra ra-chicken-leg"></i> ${gameData.playerName.value} acquired a Turkey Leg.`
          );
        } else if (item.details === "barkTea") {
          playerState.inventory.value.barkTeas =
            Number(playerState.inventory.value.barkTeas || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-coffee-mug"></i> ${gameData.playerName.value} acquired Bark Tea.`
          );
        } else if (item.details === "invisibilityCloak") {
          playerState.inventory.value.invisibilityCloaks++;
          utilityFunctions.log(
            `<i class="ra ra-angel-wings"></i> ${gameData.playerName.value} acquired a Cloak of Invisibility.`
          );
          console.log(
            "Inventory after cloak purchase:",
            playerState.inventory.value
          );
        } else if (item.details === "stickItem") {
          playerState.inventory.value.stickItem++;
          utilityFunctions.log(
            `${gameData.playerName.value} acquired a Cool Stick.`
          );
        } else if (item.details === "coolerStickItem") {
          playerState.inventory.value.coolerStickItem++;
          utilityFunctions.log(
            `<i class="ra ra-crystal-wand"></i> ${gameData.playerName.value} acquired a Cooler Stick. +2 to all combat dice rolls.`
          );
        } else if (item.details === "evenCoolerStickItem") {
          playerState.inventory.value.evenCoolerStickItem++;
          utilityFunctions.log(
            `<i class="ra ra-sun-symbol"></i> ${gameData.playerName.value} acquired an Even Cooler Stick. +3 to all combat dice rolls.`
          );
        } else if (item.details === "herbalPoultice") {
          playerState.inventory.value.herbalPoultices++;
          utilityFunctions.log(
            `<i class="ra ra-leaf"></i> ${gameData.playerName.value} acquired a Herbal Poultice.`
          );
        } else if (item.details === "frenchOnionSoup") {
          playerState.inventory.value.frenchOnionSoups =
            Number(playerState.inventory.value.frenchOnionSoups || 0) + 1;
          utilityFunctions.log(
            `${gameData.playerName.value} acquired French Onion Soup.`
          );
        } else if (item.details === "smokeBomb") {
          playerState.inventory.value.smokeBombs =
            Number(playerState.inventory.value.smokeBombs || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-poison-cloud"></i> ${gameData.playerName.value} acquired a Smoke Bomb.`
          );
        } else if (item.details === "antidote") {
          playerState.inventory.value.antidotes =
            Number(playerState.inventory.value.antidotes || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-corked-tube"></i> ${gameData.playerName.value} acquired an Antidote.`
          );
        } else if (item.details === "adventurersRations") {
          playerState.inventory.value.adventurersRations =
            Number(playerState.inventory.value.adventurersRations || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-acorn"></i> ${gameData.playerName.value} acquired Adventurer's Rations.`
          );
        } else if (item.details === "enlightenmentFish") {
          playerState.inventory.value.enlightenmentFish = 1;
          utilityFunctions.log(
            `<i class="ra ra-fish"></i> ${gameData.playerName.value} acquired The Fish of Eternal Enlightenment.`
          );
        } else if (item.details === "sharedSufferingAmulet") {
          playerState.inventory.value.sharedSufferingAmulets =
            Number(playerState.inventory.value.sharedSufferingAmulets || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-broken-heart"></i> ${gameData.playerName.value} acquired an Amulet of Shared Suffering.`
          );
        } else if (item.details === "minorHealthPotion") {
          playerState.inventory.value.minorHealthPotions =
            Number(playerState.inventory.value.minorHealthPotions || 0) + 1;
          utilityFunctions.log(
            `+ ${gameData.playerName.value} acquired a Potion of Minor Health.`
          );
        } else if (item.details === "flashPowder") {
          playerState.inventory.value.flashPowders =
            Number(playerState.inventory.value.flashPowders || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-aura"></i> ${gameData.playerName.value} acquired Flash Powder.`
          );
        } else if (item.details === "venomVial") {
          playerState.inventory.value.venomVials =
            Number(playerState.inventory.value.venomVials || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-skull"></i> ${gameData.playerName.value} acquired a Venom Vial.`
          );
        } else if (item.details === "serratedDagger") {
          playerState.inventory.value.serratedDaggers =
            Number(playerState.inventory.value.serratedDaggers || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-plain-dagger"></i> ${gameData.playerName.value} acquired a Serrated Dagger.`
          );
        } else if (item.details === "luckyCoin") {
          playerState.inventory.value.luckyCoins =
            Number(playerState.inventory.value.luckyCoins || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-gold-bar"></i> ${gameData.playerName.value} acquired a Lucky Coin.`
          );
        } else if (item.details === "wardingShield") {
          playerState.inventory.value.wardingShields =
            Number(playerState.inventory.value.wardingShields || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-shield"></i> ${gameData.playerName.value} acquired a Warding Shield.`
          );
        } else if (item.details === "wardStone") {
          playerState.inventory.value.wardStones =
            Number(playerState.inventory.value.wardStones || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-mountains"></i> ${gameData.playerName.value} acquired a Ward Stone.`
          );
        } else if (item.details === "encounterBeacon") {
          playerState.inventory.value.encounterBeacons =
            Number(playerState.inventory.value.encounterBeacons || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-lantern-flame"></i> ${gameData.playerName.value} acquired an Encounter Beacon.`
          );
        } else if (item.details === "goldPouch") {
          playerState.inventory.value.goldPouches =
            Number(playerState.inventory.value.goldPouches || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-ammo-bag"></i> ${gameData.playerName.value} acquired a Gold Pouch.`
          );
        } else if (item.details === "bountyScroll") {
          playerState.inventory.value.bountyScrolls =
            Number(playerState.inventory.value.bountyScrolls || 0) + 1;
          utilityFunctions.log(
            `<i class="ra ra-scroll-unfurled"></i> ${gameData.playerName.value} acquired a Bounty Scroll.`
          );
        } else if (item.details === "dog") {
          if (modalState?.showDogNameModal) {
            modalState.showDogNameModal.value = true;
          }
          utilityFunctions.log(`<i class="ra ra-pawprint"></i> A dog trots up to you expectantly...`);
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
    utilityFunctions.log(`<i class="ra ra-compass"></i> You don't have any Arcane Compasses to use.`);
    return;
  }

  playerState.inventory.value.compass--;
  utilityFunctions.log(`<i class="ra ra-compass"></i> You use an Arcane Compass!`);

  if (!fullChain || fullChain.length === 0) {
    utilityFunctions.log(
      `<i class="ra ra-compass"></i> The compass spins wildly; there's no defined path to jump within yet.`
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
      `<i class="ra ra-x-mark"></i> You cannot use the Arcane Compass during a boss battle.`
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
      `<i class="ra ra-compass"></i> The compass pulls you, disorienting you for a moment, then guides you directly to ${targetArticle.replaceAll(
        "_",
        " "
      )}.`
    );

    const targetIndexInChain = fullChain.indexOf(targetArticle);
    playerState.currentTargetIndex.value = targetIndexInChain;

    utilityFunctions.log(`<i class="ra ra-aura"></i> You feel a step closer to your goal.`);
  } else {
    utilityFunctions.log(
      `<i class="ra ra-compass"></i> The compass seems confused; there are no intermediate paths to jump to. (Perhaps you're at the start/end or only one article in length?)`
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

export const useBreadcrumb = (playerState, utilityFunctions, itemConstants) => {
  if (playerState.inventory.value.breadcrumbs > 0) {
    playerState.inventory.value.breadcrumbs--;
    playerState.playerHP.value = Math.min(
      playerState.playerHP.value + itemConstants.BREADCRUMB_HEAL_AMOUNT,
      playerState.effectiveMaxHP.value
    );
    utilityFunctions.log(
      `<i class="ra ra-acorn"></i> You ate some Breadcrumbs and recovered ${itemConstants.BREADCRUMB_HEAL_AMOUNT} HP. Your HP is now ${playerState.playerHP.value}.`
    );
  } else {
    utilityFunctions.log("You don't have any Breadcrumbs to use.");
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
      `<i class="ra ra-chicken-leg"></i> You consumed a Turkey Leg and recovered ${itemConstants.TURKEY_LEG_HEAL_AMOUNT} HP. Your HP is now ${playerState.playerHP.value}.`
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
      `<i class="ra ra-coffee-mug"></i> You drank Bark Tea and recovered ${itemConstants.BARK_TEA_HEAL_AMOUNT} HP. Your HP is now ${playerState.playerHP.value}.`
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
      `You consumed French Onion Soup and recovered ${healedAmount} HP and ${specialRestored} special use. Your HP is now ${playerState.playerHP.value}.`
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
        `<i class="ra ra-health"></i> You consumed an Antidote. The poison has been neutralized.`
      );
      utilityFunctions.closeInventoryModal();
    } else {
      utilityFunctions.log(
        `<i class="ra ra-x-mark"></i> You are not poisoned. You don't need to use an Antidote.`
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
    utilityFunctions.log(`<i class="ra ra-angel-wings"></i> The Cloak of Invisibility is already active.`);
    return;
  }
  if (playerState.inventory.value.invisibilityCloaks > 0) {
    playerState.inventory.value.invisibilityCloaks--;
    playerState.isCloakActive.value = true;
    playerState.cloakClicksRemaining.value = itemConstants.CLOAK_DURATION;
    utilityFunctions.log(
      `<i class="ra ra-angel-wings"></i> You don the Cloak of Invisibility. You will avoid non-boss encounters for ${itemConstants.CLOAK_DURATION} clicks.`
    );
  } else {
    utilityFunctions.log(`<i class="ra ra-angel-wings"></i> You don't have a Cloak of Invisibility.`);
  }
};

export const useHerbalPoultice = (playerState, utilityFunctions) => {
  if (playerState.healthRegenActive.value) {
    utilityFunctions.log(`<i class="ra ra-leaf"></i> A health regeneration effect is already active.`);
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
        `<i class="ra ra-leaf"></i> You applied a Herbal Poultice. Health will regenerate for ${poulticeDetails.durationClicks} clicks.`
      );
    } else {
      utilityFunctions.log(`Error: Herbal Poultice details not found.`);
      playerState.inventory.value.herbalPoultices++;
    }
  } else {
    utilityFunctions.log("You don't have any Herbal Poultices to use.");
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
      utilityFunctions.log(`<i class="ra ra-aura"></i> Your vision clears.`);
    }

    utilityFunctions.log(
      `<i class="ra ra-acorn"></i> You consumed Adventurer's Rations and recovered ${healedAmount} HP.`
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
        `<i class="ra ra-fish"></i> The Fish of Eternal Enlightenment has no HP accumulated yet.`
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
      `<i class="ra ra-fish"></i> You consumed The Fish of Eternal Enlightenment and recovered ${healedAmount} HP. Your HP is now ${playerState.playerHP.value}.`
    );
  } else {
    utilityFunctions.log("You don't have The Fish of Eternal Enlightenment.");
  }
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

export const useLuckyCoin = (playerState, utilityFunctions, combatData) => {
  const { inventory } = playerState;
  const { log, closeInventoryModal } = utilityFunctions;
  const { encounter, luckyFleeActive } = combatData;

  if (inventory.value.luckyCoins <= 0) {
    log(`You don't have any Lucky Coins.`);
    return;
  }
  if (!encounter.value || encounter.value.type !== "combat") {
    log(`<i class="ra ra-x-mark"></i> Lucky Coin can only be used during combat.`);
    return;
  }
  if (luckyFleeActive.value) {
    log(`<i class="ra ra-gold-bar"></i> A guaranteed flee is already active.`);
    return;
  }
  inventory.value.luckyCoins--;
  luckyFleeActive.value = true;
  log(`<i class="ra ra-gold-bar"></i> You flip the Lucky Coin. Your next Flee attempt is guaranteed to succeed.`);
  closeInventoryModal();
};

export const useWardStone = (playerState, utilityFunctions, combatData) => {
  const { inventory } = playerState;
  const { log } = utilityFunctions;
  const { wardStoneActive, wardStoneClicksRemaining } = combatData;

  if (inventory.value.wardStones <= 0) {
    log(`You don't have any Ward Stones.`);
    return;
  }
  if (wardStoneActive.value) {
    log(`<i class="ra ra-mountains"></i> A Ward Stone is already active (${wardStoneClicksRemaining.value} clicks remaining).`);
    return;
  }
  inventory.value.wardStones--;
  wardStoneActive.value = true;
  wardStoneClicksRemaining.value = 5;
  log(`<i class="ra ra-mountains"></i> You activate the Ward Stone. Non-boss encounters suppressed for 5 clicks.`);
};

export const useEncounterBeacon = (playerState, utilityFunctions, combatData) => {
  const { inventory } = playerState;
  const { log } = utilityFunctions;
  const { encounterBeaconActive } = combatData;

  if (inventory.value.encounterBeacons <= 0) {
    log(`You don't have any Encounter Beacons.`);
    return;
  }
  if (encounterBeaconActive.value) {
    log(`<i class="ra ra-lantern-flame"></i> An Encounter Beacon is already active.`);
    return;
  }
  inventory.value.encounterBeacons--;
  encounterBeaconActive.value = true;
  log(`<i class="ra ra-lantern-flame"></i> You light the Encounter Beacon. Your next encounter will be a friendly NPC.`);
};

export const useBountyScroll = (playerState, utilityFunctions, combatData) => {
  const { inventory } = playerState;
  const { log, closeInventoryModal } = utilityFunctions;
  const { bountyScrollActive } = combatData;

  if (inventory.value.bountyScrolls <= 0) {
    log(`You don't have any Bounty Scrolls.`);
    return;
  }
  if (bountyScrollActive.value) {
    log(`<i class="ra ra-scroll-unfurled"></i> A Bounty Scroll is already active.`);
    return;
  }
  inventory.value.bountyScrolls--;
  bountyScrollActive.value = true;
  log(`<i class="ra ra-scroll-unfurled"></i> You unfurl the Bounty Scroll. Your next combat victory will drop loot twice.`);
  closeInventoryModal();
};

export const useGoldPouch = (playerState, utilityFunctions, goldPouchData) => {
  const { inventory, playerGold } = playerState;
  const { log, closeInventoryModal } = utilityFunctions;
  const { goldPouchAccumulatedGold } = goldPouchData;

  if (inventory.value.goldPouches <= 0) {
    log(`You don't have a Gold Pouch.`);
    return;
  }
  if (goldPouchAccumulatedGold.value <= 0) {
    log(`<i class="ra ra-ammo-bag"></i> Your Gold Pouch is empty. Keep clicking to accumulate gold.`);
    return;
  }
  const collected = goldPouchAccumulatedGold.value;
  playerGold.value += collected;
  goldPouchAccumulatedGold.value = 0;
  inventory.value.goldPouches--;
  log(`<i class="ra ra-ammo-bag"></i> You collect ${collected} gold from your Gold Pouch.`);
  closeInventoryModal();
};
