// src/composables/useGameHandlers.js

import { ref } from "vue";
import { classes } from "@/utils/classes";
import { isBoss } from "@/utils/bossGenerator";
import { handleCombatAction } from "@/utils/combat";
import { handleRest } from "@/utils/restHandler";
import { handleClick as externalHandleClick } from "@/utils/clickHandler.js";
import { handleEncounterOption as externalHandleEncounterOption } from "@/utils/encounterHandler";
import { handleLootDrop as externalHandleLootDrop } from "@/utils/lootHandler";
import { handleEnemyTurn as externalHandleEnemyTurn } from "@/utils/enemyTurnHandler";
import { handleMiniBossLootDrop } from "@/utils/miniBossLootHandler";
import { handleShopPurchase as externalHandleShopPurchase } from "@/utils/itemHandlers";
import { getRandomChain } from "@/utils/randomPair";

export function useGameHandlers(deps) {
  const {
    // Game Flow
    gameFlow,

    // Logging
    log,
    logEnemyAction,

    // Modals
    modals,

    // Player
    player,

    // Inventory
    inventory,
    enlightenmentFishAccumulatedHP,

    // Combat
    combat,

    // Status Effects
    statusEffects,
  } = deps;

  // Destructure what we need from each
  const {
    journeyLength,
    chain,
    current,
    currentTargetIndex,
    path,
    formattedTitle,
    clickCount,
    shortcutsUsedCount,
    timerInterval,
    defeated,
    bossSpawned,
    bossDefeated,
    selectedBossType,
    bossOverlay,
    combatEncountersFought,
    combatWinsSinceLastCapIncrease,
    hpCapBonus,
    seenLoreEncounters,
    seenNPCEncounters,
    enemyDifficultyLevel,
    markBossDefeated,
  } = gameFlow;

  const { showRestModal, showShopModal, showTipsModal, restModalCount } = modals;

  const {
    playerClass,
    playerName,
    playerHP,
    specialUsesLeft,
    totalSpecialsUsed,
    weaponBonus,
    shieldBonus,
    playerGold,
    shortRestsUsed,
    longRestsUsed,
    effectiveMaxHP,
    specialTier,
    offeringPot,
    playerGoal,
  } = player;

  const {
    blurClicksLeft,
    poisonedClicksLeft,
    poisonDamagePerClick,
    isCloakActive,
    cloakClicksRemaining,
    serratedDaggerActive,
    luckyFleeActive,
    wardingShieldHitsRemaining,
    wardStoneActive,
    encounterBeaconActive,
  } = statusEffects;

  const {
    encounter,
    encounterMessage,
    inEncounter,
    enemyHP,
    nextEnemyAttack,
    enemyNextAction,
    enemyTurnKey,
    currentEnemy,
    enemyStatusEffects,
    enemyIsStunned,
    DEFAULT_ENEMY_HP,
    decideEnemyAction,
    handleCloseEncounter,
  } = combat;

  // Dice roll display + damage notifications (sequenced)
  const lastDiceRoll = ref(null);
  const lastDamageDealt = ref(null);
  const lastDamageTaken = ref(null);

  let diceRollTimer = null;
  let diceAnimInterval = null;
  let diceBonusInterval = null;
  let dealtTimer = null;
  let takenTimer = null;
  let isDiceAnimating = false;
  let pendingDealt = null;
  let pendingTaken = null;
  let pendingMissPenalty = null;

  const DICE_TICKS = 15;
  const DICE_TICK_MS = 80;
  const DISPLAY_MS = 3000;
  const DEALT_TO_TAKEN_DELAY = 600;

  function showDealt(amount) {
    clearTimeout(dealtTimer);
    lastDamageDealt.value = amount;
    dealtTimer = setTimeout(() => { lastDamageDealt.value = null; }, DISPLAY_MS);
  }

  function showTaken(amount, delay = 0) {
    setTimeout(() => {
      clearTimeout(takenTimer);
      lastDamageTaken.value = amount;
      takenTimer = setTimeout(() => { lastDamageTaken.value = null; }, DISPLAY_MS);
    }, delay);
  }

  function onDiceRoll({ roll, rawRoll = roll, bonus = 0, threshold, didHit }) {
    clearTimeout(diceRollTimer);
    clearInterval(diceAnimInterval);
    clearInterval(diceBonusInterval);
    pendingDealt = null;
    pendingTaken = null;
    pendingMissPenalty = null;
    isDiceAnimating = true;

    const BONUS_TICK_MS = 300;

    function finishAndReveal() {
      isDiceAnimating = false;
      const hasDealt = pendingDealt !== null;
      if (hasDealt) { showDealt(pendingDealt); pendingDealt = null; }
      const hasTaken = pendingTaken !== null;
      const combined = (pendingTaken ?? 0) + (pendingMissPenalty ?? 0);
      if (hasTaken || pendingMissPenalty !== null) {
        showTaken(combined, hasDealt ? DEALT_TO_TAKEN_DELAY : 0);
        pendingTaken = null;
        pendingMissPenalty = null;
      }
    }

    // Start cycling random numbers
    lastDiceRoll.value = { roll: Math.floor(Math.random() * 20) + 1, threshold, didHit, isRolling: true, bonus: 0 };

    let ticks = 0;
    diceAnimInterval = setInterval(() => {
      ticks++;
      if (ticks >= DICE_TICKS) {
        clearInterval(diceAnimInterval);

        if (bonus > 0) {
          // Land on raw roll first, then tick up
          lastDiceRoll.value = { roll: rawRoll, threshold, didHit, isRolling: false, isBonusing: true, bonus };
          let current = rawRoll;
          diceBonusInterval = setInterval(() => {
            current++;
            const done = current >= roll;
            lastDiceRoll.value = { roll: current, threshold, didHit, isRolling: false, isBonusing: !done, bonus };
            if (done) {
              clearInterval(diceBonusInterval);
              finishAndReveal();
            }
          }, BONUS_TICK_MS);
        } else {
          lastDiceRoll.value = { roll, threshold, didHit, isRolling: false, isBonusing: false, bonus: 0 };
          finishAndReveal();
        }
      } else {
        lastDiceRoll.value = { roll: Math.floor(Math.random() * 20) + 1, threshold, didHit, isRolling: true, bonus: 0 };
      }
    }, DICE_TICK_MS);

    const bonusExtra = bonus > 0 ? bonus * BONUS_TICK_MS + 400 : 0;
    diceRollTimer = setTimeout(() => {
      lastDiceRoll.value = null;
    }, DICE_TICKS * DICE_TICK_MS + DISPLAY_MS + bonusExtra);
  }

  function onFleeSuccess() {
    const cardDelay = DICE_TICKS * DICE_TICK_MS + 400;
    setTimeout(() => {
      enemyTurnKey.value++;
      enemyNextAction.value = "fled";
      setTimeout(() => {
        encounter.value = null;
        enemyNextAction.value = null;
      }, 1400);
    }, cardDelay);
  }

  function onVictory() {
    // Wait for dice animation + damage badge to finish, then show "Path Cleared."
    const victoryDelay = isDiceAnimating
      ? DICE_TICKS * DICE_TICK_MS + DISPLAY_MS
      : DISPLAY_MS;
    setTimeout(() => {
      enemyTurnKey.value++;
      enemyNextAction.value = "victory";
      setTimeout(() => {
        encounter.value = null;
        enemyNextAction.value = null;
      }, 1400);
    }, victoryDelay);
  }

  function onCombatResult({ type, amount }) {
    if (!amount || amount <= 0) return;
    if (isDiceAnimating) {
      // Buffer until dice lands
      if (type === "dealt") pendingDealt = amount;
      else if (type === "taken") pendingTaken = amount;
      else if (type === "miss_penalty") pendingMissPenalty = amount;
      return;
    }
    // Steady attack — no dice, show immediately in sequence
    if (type === "dealt") {
      showDealt(amount);
    } else if (type === "taken") {
      const combined = amount + (pendingMissPenalty ?? 0);
      pendingMissPenalty = null;
      showTaken(combined, lastDamageDealt.value !== null ? DEALT_TO_TAKEN_DELAY : 0);
    } else if (type === "miss_penalty") {
      pendingMissPenalty = amount;
    }
  }

  // Loot handler
  function handleLoot(defeatedEnemyData) {
    const lootHandlerArgs = {
      playerState: {
        playerHP,
        playerName,
        playerClass,
        specialUsesLeft,
        weaponBonus,
        shieldBonus,
        playerGold,
        effectiveMaxHP: effectiveMaxHP.value,
        inventory,
      },
      utilityFunctions: {
        log,
      },
      defeatedEnemyData: defeatedEnemyData,
    };

    if (isBoss(defeatedEnemyData)) {
      log(
        `✨ The ${defeatedEnemyData.name} dissipates, leaving no worldly possessions behind.`
      );
      markBossDefeated();
    } else if (defeatedEnemyData.isMiniBoss) {
      handleMiniBossLootDrop(lootHandlerArgs);
    } else {
      externalHandleLootDrop(lootHandlerArgs);
    }
  }

  // Close encounter wrapper
  function handleCloseEncounterWrapper() {
    handleCloseEncounter({
      bossDefeated,
      current,
      chain,
      journeyLength,
      currentTargetIndex,
      path,
      timerInterval,
    });
  }

  // Click handler
  async function callHandleClick(title) {
    const finalTarget = chain[journeyLength.value - 1];

    await externalHandleClick({
      title,
      playerState: {
        clickCount,
        path,
        currentTargetIndex,
        combatEncountersFought,
        combatWinsSinceLastCapIncrease,
      },
      gameData: {
        enemyDifficultyLevel,
        chain,
        current,
        bossSpawned,
        bossDefeated,
        selectedBossType,
        formattedTitle,
        seenLoreEncounters,
        seenNPCEncounters,
        timerInterval,
        journeyLength,
        finalTarget,
      },
      modalState: {
        inEncounter,
        showRestModal,
        showShopModal,
        showTipsModal,
        bossOverlay,
      },
      enemyState: {
        encounter,
        enemyHP,
        encounterMessage,
        nextEnemyAttack,
        enemyNextAction,
        currentEnemy,
      },
      utilityFunctions: {
        log,
        logEnemyAction,
        clearInterval: (intervalId) => clearInterval(intervalId),
        isBoss,
      },
      isCloakActive,
      cloakClicksRemaining,
      wardStoneActive,
      encounterBeaconActive,
    });
  }

  // Rest handler
  function callHandleRest(choice) {
    const restType = handleRest({
      player: {
        playerHP,
        playerClass,
        specialUsesLeft,
        playerName,
        effectiveMaxHP: effectiveMaxHP.value,
      },
      state: {
        restChoice: choice,
        shortRestsUsed,
        longRestsUsed,
      },
      utils: {
        log,
        showRestModal,
      },
    });

    if (restModalCount.value % 2 === 0) {
      enemyDifficultyLevel.value = enemyDifficultyLevel.value + 1;
      log(
        `⚔️ The world gets ${enemyDifficultyLevel.value} times more dangerous.`
      );
    }
  }

  // Combat action handler
  function handleCombatActionWrapper(playerAction) {
    handleCombatAction({
      player: {
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
      },
      enemy: {
        enemyHP,
        encounter,
        nextEnemyAttack,
        enemyNextAction,
        enemyStatusEffects,
        enemyIsStunned,
      },
      state: {
        log,
        formattedTitle: formattedTitle.value,
        DEFAULT_ENEMY_HP,
        isBoss,
        combatWinsSinceLastCapIncrease,
        hpCapBonus,
      },
      utils: {
        clearTimer: () => clearInterval(timerInterval),
        setDefeated: () => (defeated.value = true),
        handleLootDrop: handleLoot,
        markBossDefeated,
        gotoEnemyTurn,
        bossOverlay: bossOverlay,
        onDiceRoll,
        onCombatResult,
        onVictory,
        onFleeSuccess,
      },
      itemEffects: {
        serratedDaggerActive,
        luckyFleeActive,
        wardingShieldHitsRemaining,
        coolerStickBonus: inventory.value.coolerStickItem > 0 ? 2 : 0,
      },
    });
  }

  // Enemy turn handler
  function gotoEnemyTurn() {
    // Delay showing the new enemy intent until current dice + damage animations finish
    const hadDice = isDiceAnimating;
    const intentDelay = (hadDice ? DICE_TICKS * DICE_TICK_MS : 0) + DEALT_TO_TAKEN_DELAY + 400;
    setTimeout(() => {
      enemyTurnKey.value++;
      externalHandleEnemyTurn({
      enemyState: {
        enemyStatusEffects,
        enemyHP,
        encounter,
        enemyIsStunned,
        enemyNextAction,
        nextEnemyAttack,
      },
      playerState: {
        playerName,
        playerHP,
        effectiveMaxHP: effectiveMaxHP.value,
      },
      gameData: {},
      utilityFunctions: {
        log,
      },
      combatFunctions: {
        formattedTitle: formattedTitle,
        decideEnemyAction: decideEnemyAction,
        logEnemyAction: logEnemyAction,
      },
    });
    }, intentDelay);
  }

  // Encounter option handler
  async function callHandleEncounterOption(option) {
    await externalHandleEncounterOption({
      option,
      playerState: {
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
        effectiveMaxHP: effectiveMaxHP.value,
      },
      gameData: {
        chain,
        current,
        formattedTitle: formattedTitle.value,
      },
      enemyState: {
        encounter,
        enemyHP,
        encounterMessage,
        nextEnemyAttack,
        enemyNextAction,
      },
      modalState: {
        bossOverlay,
      },
      utilityFunctions: {
        log,
      },
    });
  }

  // Shop purchase handler
  function handleShopPurchase(item) {
    externalHandleShopPurchase(
      item,
      {
        playerGold,
        playerHP,
        effectiveMaxHP,
        weaponBonus,
        shieldBonus,
        specialUsesLeft,
        longRestsUsed,
        shortRestsUsed,
        blurClicksLeft,
        inventory,
      },
      {
        playerName,
      },
      {
        log,
      }
    );
  }

  // Class selection handler
  function handleClassSelection({ classKey, name, journeyLength: selectedLen, goal }) {
    playerClass.value = classes[classKey];
    playerHP.value = playerClass.value.maxHP;
    playerName.value = name;
    playerGoal.value = goal || "";
    journeyLength.value = selectedLen;

    const newChain = getRandomChain(journeyLength.value);
    chain.splice(0, chain.length, ...newChain);
    current.value = chain[0];
    path.value = [current.value];

    if (playerClass.value.startingWeaponBonus) {
      weaponBonus.value += playerClass.value.startingWeaponBonus;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingWeaponBonus} starting Weapon Damage.`
      );
    }
    if (playerClass.value.startingSpecialUses) {
      specialUsesLeft.value += playerClass.value.startingSpecialUses;
      log(
        `🎁 <span class="player-name">${playerName.value}</span> starts with +${playerClass.value.startingSpecialUses} Class Ability charges.`
      );
    }
    if (playerClass.value.startingShieldBonus) {
      shieldBonus.value += playerClass.value.startingShieldBonus;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingShieldBonus} starting Defense Bonus.`
      );
    }
    if (playerClass.value.startingHealthPotionBonus) {
      inventory.value.healthPotions = playerClass.value.startingHealthPotionBonus;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingHealthPotionBonus} starting Health Potions.`
      );
    }
    if (playerClass.value.startingInvisibilityCloaks) {
      inventory.value.invisibilityCloaks =
        playerClass.value.startingInvisibilityCloaks;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingInvisibilityCloaks} starting Invisibility Cloaks.`
      );
    }
    if (playerClass.value.startingPlayerGold) {
      playerGold.value = playerClass.value.startingPlayerGold;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingPlayerGold} starting Gold.`
      );
    }
    log(`Player name: ${playerName.value}`);
    log(`Class selected: ${playerClass.value.name}`);
    log(`Journey length: ${journeyLength.value} articles.`);
  }

  // Offering / special tier upgrade handler
  const OFFERING_COSTS = [[10, 15, 20], [25, 30, 50]];

  function callHandleOffer() {
    const tier = specialTier.value;
    if (tier >= 3) return;

    const cost = OFFERING_COSTS[tier - 1][offeringPot.value];
    if (playerGold.value < cost) {
      log(`🙏 You need ${cost}g to make this offering. You only have ${playerGold.value}g.`);
      return;
    }

    playerGold.value -= cost;
    offeringPot.value++;

    if (offeringPot.value >= 3) {
      specialTier.value++;
      offeringPot.value = 0;
      specialUsesLeft.value = 3;
      const tierData = playerClass.value?.specialTiers?.[specialTier.value - 1];
      const newName = tierData?.name ?? playerClass.value?.special;
      log(`✨ The Gods have answered. Your class ability ascends to Tier ${specialTier.value}: <strong>${newName}</strong>! Special charges restored to 3.`);
    } else {
      log(`🙏 <span class="player-name">${playerName.value}</span> places ${cost}g in the offering bowl... (${offeringPot.value}/3)`);
    }
  }

  // Assemble upgrade handler
  function handleAssembleUpgrade({
    inventory,
    playerName,
    weaponBonus,
    shieldBonus,
    upgradeType,
    utilityFunctions,
  }) {
    const { log } = utilityFunctions;

    if (upgradeType === "weapon") {
      if (inventory.value.weaponPieces >= 2) {
        inventory.value.weaponPieces -= 2;
        weaponBonus.value += 1;
        log(
          `⚔️ <span class="player-name">${playerName.value}</span> crafted a Weapon Upgrade (+1 Weapon Bonus)`
        );
        log(
          `Weapon Pieces: ${inventory.value.weaponPieces}, Weapon Bonus: ${weaponBonus.value}`
        );
      } else {
        log(`⛔ Not enough Weapon Pieces to craft an upgrade. You need 2.`);
      }
    } else if (upgradeType === "defense") {
      if (inventory.value.defensePieces >= 2) {
        inventory.value.defensePieces -= 2;
        shieldBonus.value += 1;
        log(
          `🛡️ <span class="player-name">${playerName.value}</span> crafted a Defense Upgrade. (+1 Defense Bonus)`
        );
        log(
          `Defense Pieces: ${inventory.value.defensePieces}, Defense Bonus: ${shieldBonus.value}`
        );
      } else {
        log(`⛔ Not enough Defense Pieces to craft an upgrade. You need 2.`);
      }
    } else {
      log(`Unknown upgrade type: ${upgradeType}`);
    }
  }

  function handleAssembleUpgradeWrapper(upgradeType) {
    handleAssembleUpgrade({
      inventory: inventory,
      playerName,
      weaponBonus,
      shieldBonus,
      upgradeType,
      utilityFunctions: {
        log,
      },
    });
    if (restModalCount.value % 2 === 0) {
      enemyDifficultyLevel.value = enemyDifficultyLevel.value + 1;
      log(
        `⚔️ The world gets ${enemyDifficultyLevel.value} times more dangerous.`
      );
    }
    showRestModal.value = false;
  }

  return {
    callHandleClick,
    callHandleRest,
    callHandleOffer,
    handleCombatActionWrapper,
    gotoEnemyTurn,
    callHandleEncounterOption,
    handleShopPurchase,
    handleClassSelection,
    handleAssembleUpgradeWrapper,
    handleCloseEncounterWrapper,
    lastDiceRoll,
    lastDamageDealt,
    lastDamageTaken,
  };
}
