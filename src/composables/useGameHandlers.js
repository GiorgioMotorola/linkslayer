import { ref, watch } from "vue";
import { classes } from "@/utils/classes";
import { isBoss } from "@/utils/bossGenerator";
import { handleCombatAction } from "@/utils/combat";
import { handleRest } from "@/utils/restHandler";
import { handleClick as externalHandleClick } from "@/utils/clickHandler.js";
import { handleEncounterOption as externalHandleEncounterOption } from "@/utils/encounterHandler";
import { handleLootDrop as externalHandleLootDrop } from "@/utils/lootHandler";
import { handleEnemyTurn as externalHandleEnemyTurn, buildGroupIntents } from "@/utils/enemyTurnHandler";
import { handleMiniBossLootDrop } from "@/utils/miniBossLootHandler";
import { handleShopPurchase as externalHandleShopPurchase } from "@/utils/itemHandlers";
import { getRandomChain } from "@/utils/randomPair";
import { getBook } from "@/utils/libraryBooks";
export function useGameHandlers(deps) {
  const daysCount = ref(1);

  // ── Infinite Library state ─────────────────────────────────────────────────
  // libraryBook: { id, type, levelIndex } | null  — book currently being read
  // libraryProgress: number of clicks completed toward readClicks target
  // libraryReady: { id, type, levelIndex } | null  — finished reading, ready to forge
  // craftedLevels: { [bookId]: number }  — highest level crafted this run (0 = none)
  const libraryBook = ref(null);
  const libraryProgress = ref(0);
  const libraryReady = ref(null);
  const craftedLevels = ref({});

  const {
    gameFlow,
    log,
    logEnemyAction,
    modals,
    player,
    inventory,
    enlightenmentFishAccumulatedHP,
    combat,
    statusEffects,
  } = deps;

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
    showRecap,
    recapType,
    bossSpawned,
    bossDefeated,
    selectedBossType,
    bossOverlay,
    combatEncountersFought,
    enemiesKilled,
    combatWinsSinceLastCapIncrease,
    hpCapBonus,
    seenLoreEncounters,
    seenNPCEncounters,
    enemyDifficultyLevel,
    markBossDefeated,
  } = gameFlow;

  const { showRestModal, showShopModal, showTipsModal, restModalCount, longRestDismissCount, showCampfireOverlay, campfireReward, showRuneCacheModal, runeCacheReward, showDogNameModal } = modals;

  const {
    playerClass,
    playerName,
    playerHP,
    specialUsesLeft,
    totalSpecialsUsed,
    weaponBonus,
    shieldBonus,
    playerGold,
    goldSpent,
    shortRestsUsed,
    longRestsUsed,
    effectiveMaxHP,
    specialTier,
    offeringPot,
    playerGoal,
    dogName,
    campTier,
    weaponAugment,
    defenseAugment,
    equippedWeapon,
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
    bountyScrollActive,
  } = statusEffects;

  const {
    encounter,
    encounterMessage,
    inEncounter,
    enemyHP,
    nextEnemyAttack,
    enemyNextAction,
    enemyIntents,
    enemyTurnKey,
    currentEnemy,
    enemyStatusEffects,
    enemyIsStunned,
    enrageBonus,
    ironWillUsed,
    bloodpactActive,
    playerEnrageCharges,
    DEFAULT_ENEMY_HP,
    confusedAction,
    confusedTurnsLeft,
    decideEnemyAction,
    handleCloseEncounter,
  } = combat;

  // Assign per-enemy intents only when first entering a multi-enemy combat.
  // Mutations like targetIndex changes spread-replace the object, so guard with
  // oldEnc?.type !== "combat" to avoid re-rolling intents mid-round.
  watch(encounter, (newEnc, oldEnc) => {
    const enteringCombat = newEnc?.type === "combat" && oldEnc?.type !== "combat";
    const enemiesGrew = newEnc?.type === "combat" &&
      newEnc.enemies?.length > 1 &&
      newEnc.enemies?.length !== oldEnc?.enemies?.length;
    if ((enteringCombat || enemiesGrew) && newEnc.enemies?.length > 1) {
      const intents = buildGroupIntents(newEnc.enemies, enrageBonus.value ?? 0, decideEnemyAction);
      enemyIntents.value = intents;
      const targetIntent = intents[newEnc.targetIndex ?? 0];
      enemyNextAction.value = targetIntent?.action ?? "idle";
      nextEnemyAttack.value = targetIntent?.damage ?? null;
    }
  });

  // Keep encounter.enemies[targetIndex].currentHP in sync with enemyHP ref.
  // flush:'sync' ensures the sync is immediate (before any render), preventing
  // the HP bar from briefly reading a stale value when targetIndex changes.
  watch(enemyHP, (newHP) => {
    const enc = encounter.value;
    if (enc?.enemies) {
      const idx = enc.targetIndex ?? 0;
      if (enc.enemies[idx]) enc.enemies[idx].currentHP = newHP;
    }
  }, { flush: 'sync' });

  const counterResult = ref(null);
  const victoryLoot = ref("");

  function onCounterResult({ succeeded, delay }) {
    const ms = delay !== undefined ? delay : DICE_TICKS * DICE_TICK_MS + 150;
    setTimeout(() => {
      counterResult.value = succeeded ? 'success' : 'fail';
    }, ms);
  }

  const lastDiceRoll = ref(null);
  const lastDamageDealt = ref(null);
  const enemyHitKey = ref(0);
  const lastDamageTaken = ref(null);
  const playerHitKey = ref(0);
  const lastGoldStolen = ref(null);

  let diceResolve = null;
  let diceClearResolve = null;
  let diceRollTimer = null;
  let diceAnimInterval = null;
  let diceBonusInterval = null;
  let dealtTimer = null;
  let takenTimer = null;
  let goldStolenTimer = null;
  let isDiceAnimating = false;
  let pendingDealt = null;
  let pendingTaken = null;
  let pendingMissPenalty = null;

  const DICE_TICKS = 15;
  const DICE_TICK_MS = 80;
  const DISPLAY_MS = 3000;
  const DEALT_TO_TAKEN_DELAY = 600;
  const DICE_SETTLE_DELAY = 500; // pause after dice lands before revealing results

  function showDealt(amount) {
    clearTimeout(dealtTimer);
    lastDamageDealt.value = amount;
    enemyHitKey.value++;
    dealtTimer = setTimeout(() => { lastDamageDealt.value = null; }, DISPLAY_MS);
  }

  function showTaken(amount, delay = 0) {
    setTimeout(() => {
      clearTimeout(takenTimer);
      lastDamageTaken.value = amount;
      playerHitKey.value++;
      takenTimer = setTimeout(() => { lastDamageTaken.value = null; }, DISPLAY_MS);
    }, delay);
  }

  function onGoldStolen(amount) {
    clearTimeout(goldStolenTimer);
    lastGoldStolen.value = amount;
    goldStolenTimer = setTimeout(() => { lastGoldStolen.value = null; }, DISPLAY_MS);
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
      if (diceResolve) { const r = diceResolve; diceResolve = null; r(); }
    }

    lastDiceRoll.value = { roll: Math.floor(Math.random() * 20) + 1, threshold, didHit, isRolling: true, bonus: 0 };

    let ticks = 0;
    diceAnimInterval = setInterval(() => {
      ticks++;
      if (ticks >= DICE_TICKS) {
        clearInterval(diceAnimInterval);

        if (bonus > 0) {
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
      if (diceClearResolve) { const r = diceClearResolve; diceClearResolve = null; r(); }
    }, DICE_TICKS * DICE_TICK_MS + DISPLAY_MS + bonusExtra);
  }

  function onFleeSuccess() {
    const cardDelay = isDiceAnimating ? DICE_TICKS * DICE_TICK_MS + 400 : 400;
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
    handleLoot(encounter.value?.enemy);
    const victoryDelay = isDiceAnimating
      ? DICE_TICKS * DICE_TICK_MS + DISPLAY_MS
      : DISPLAY_MS;
    setTimeout(() => {
      enemyTurnKey.value++;
      enemyNextAction.value = "victory";
      // Encounter stays open until player clicks "Continue Your Journey"
    }, victoryDelay);
  }

  function onEnemyKilled(defeatedEnemyData) {
    const enc = encounter.value;
    if (!enc?.enemies) {
      // Single-enemy or boss — use old victory path
      onVictory();
      return;
    }

    // Mark the targeted enemy as dead
    const targetIdx = enc.targetIndex ?? 0;
    enc.enemies[targetIdx].currentHP = 0;

    // Find next alive enemy
    const nextIdx = enc.enemies.findIndex((e, i) => i !== targetIdx && e.currentHP > 0);
    if (nextIdx === -1) {
      // All enemies dead — full victory
      onVictory();
      return;
    }

    // Clear the dead enemy's telegraphed action immediately
    enemyNextAction.value = null;
    nextEnemyAttack.value = null;

    // Switch to next alive enemy — mutate in place to avoid triggering encounter watchers
    const nextEnemy = enc.enemies[nextIdx];
    const victoryDelay = isDiceAnimating
      ? DICE_TICKS * DICE_TICK_MS + DISPLAY_MS
      : DISPLAY_MS;
    setTimeout(() => {
      encounter.value.targetIndex = nextIdx;
      encounter.value.enemy = nextEnemy;
      enemyHP.value = nextEnemy.currentHP;
      log(`⚔️ <span class="player-name">${playerName.value}</span> now faces ${nextEnemy.name}!`);
      gotoEnemyTurn();
    }, victoryDelay);
  }

  function handleSwitchTarget(newIndex) {
    const enc = encounter.value;
    if (!enc?.enemies) return;
    const target = enc.enemies[newIndex];
    if (!target || target.currentHP <= 0) return;
    // Mutate in place — avoid replacing the ref value which triggers watchers
    encounter.value.targetIndex = newIndex;
    encounter.value.enemy = target;
    enemyHP.value = target.currentHP;
    // Sync intent from the pre-assigned per-enemy intent (don't re-roll)
    const intent = enemyIntents.value[newIndex];
    if (intent) {
      enemyNextAction.value = intent.action ?? "attack";
      nextEnemyAttack.value = intent.damage ?? null;
    } else {
      // Intents not assigned yet — keep a tentative attack value
      enemyNextAction.value = "attack";
      nextEnemyAttack.value =
        Math.floor(Math.random() * (target.maxDamage - target.minDamage + 1)) +
        target.minDamage;
    }
  }

  function waitForDice() {
    if (!isDiceAnimating) return Promise.resolve();
    return new Promise((resolve) => {
      diceResolve = () => setTimeout(resolve, DICE_SETTLE_DELAY);
    });
  }

  function waitForDiceClear() {
    if (lastDiceRoll.value === null) return Promise.resolve();
    return new Promise((resolve) => { diceClearResolve = resolve; });
  }

  // Between queued actions: wait for dice to clear AND ensure a minimum visible pause
  function waitForInterAction() {
    const minPause = new Promise(r => setTimeout(r, 1400));
    return Promise.all([waitForDiceClear(), minPause]);
  }

  function onCombatResult({ type, amount }) {
    if (!amount || amount <= 0) return;
    if (isDiceAnimating) {
      if (type === "dealt") pendingDealt = amount;
      else if (type === "taken") pendingTaken = amount;
      else if (type === "miss_penalty") pendingMissPenalty = amount;
      return;
    }
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
        equippedWeapon,
        weaponAugment,
        defenseAugment,
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
      victoryLoot.value = "";
      markBossDefeated();
    } else if (defeatedEnemyData.isMiniBoss) {
      handleMiniBossLootDrop(lootHandlerArgs);
      victoryLoot.value = "";
    } else {
      const enemyCount = encounter.value?.enemies?.length ?? 1;
      const drops = externalHandleLootDrop({ ...lootHandlerArgs, bountyScrollActive, enemyCount });
      victoryLoot.value = drops?.join(" · ") ?? "";
    }
  }

  function handleCloseEncounterWrapper() {
    enemyNextAction.value = null;
    victoryLoot.value = "";
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
        dogName,
        inventory,
        playerName,
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
        showCampfireOverlay,
        campfireReward,
        showRuneCacheModal,
        runeCacheReward,
        bossOverlay,
      },
      enemyState: {
        encounter,
        enemyHP,
        encounterMessage,
        nextEnemyAttack,
        enemyNextAction,
        enemyIntents,
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

  function callHandleRest(choice) {
    handleRest({
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
        campTier,
      },
      utils: {
        log,
      },
    });

    if (choice === "continue") {
      showRestModal.value = false;
    }
  }

  function callHandleSleep() {
    enemyDifficultyLevel.value = enemyDifficultyLevel.value + 1;
    daysCount.value = daysCount.value + 1;
    longRestDismissCount.value++;
    log(`⚔️ The world gets ${enemyDifficultyLevel.value} times more dangerous.`);
    showRestModal.value = false;
  }

  async function handleCombatActionWrapper(playerAction) {
    // playerAction is either a string (instant: defend/flee) or an array of queued actions
    const isQueue = Array.isArray(playerAction);
    const actions = isQueue
      ? playerAction
      : [{ action: playerAction, targetIndex: encounter.value?.targetIndex ?? 0 }];

    for (let i = 0; i < actions.length; i++) {
      if (encounter.value === null) break; // combat ended mid-queue

      const { action: singleAction, targetIndex: actionTargetIndex } = actions[i];
      const isLast = i === actions.length - 1;

      // Switch target if this queued action targets a different enemy
      if (isQueue && typeof actionTargetIndex === "number" && encounter.value?.targetIndex !== actionTargetIndex) {
        encounter.value = { ...encounter.value, targetIndex: actionTargetIndex };
      }

      // ── Combat item actions (use_item:*) ─────────────────────────────────────
      if (singleAction.startsWith('use_item:')) {
        const itemType = singleAction.replace('use_item:', '');
        let itemEndedCombat = false;

        if (itemType === 'sharedSufferingAmulet') {
          const ENEMY_DMG = 50, PLAYER_DMG = 25;
          inventory.value.sharedSufferingAmulets = Math.max(0, (inventory.value.sharedSufferingAmulets || 0) - 1);
          const newEnemyHP = Math.max(0, enemyHP.value - ENEMY_DMG);
          enemyHP.value = newEnemyHP;
          log(`💔 You activate the Amulet of Shared Suffering. The enemy takes ${ENEMY_DMG} damage.`);
          onCombatResult({ type: 'dealt', amount: ENEMY_DMG });
          const newPlayerHP = Math.max(0, playerHP.value - PLAYER_DMG);
          playerHP.value = newPlayerHP;
          log(`💔 You also feel the pain, taking ${PLAYER_DMG} damage.`);
          onCombatResult({ type: 'taken', amount: PLAYER_DMG });
          await new Promise(r => setTimeout(r, 800));
          if (newEnemyHP <= 0) {
            onEnemyKilled(encounter.value?.enemy);
            itemEndedCombat = true;
          } else if (newPlayerHP <= 0) {
            log(`💀 <span class="player-name">${playerName.value}</span> was defeated.`);
            encounter.value = null;
            clearInterval(timerInterval);
            showRecap.value = true;
            recapType.value = 'defeat';
            itemEndedCombat = true;
          }
        } else if (itemType === 'flashPowder') {
          if ((inventory.value.flashPowders || 0) > 0) {
            if (isBoss(encounter.value?.enemy)) {
              log(`🚫 You cannot use Flash Powder during a boss battle.`);
            } else {
              inventory.value.flashPowders--;
              enemyIsStunned.value = true;
              log(`💥 You throw Flash Powder! The enemy is blinded and will skip their next turn.`);
            }
          }
        } else if (itemType === 'venomVial') {
          if ((inventory.value.venomVials || 0) > 0) {
            inventory.value.venomVials--;
            enemyStatusEffects.value.push({ type: 'poison', damage: 3, duration: 4 });
            log(`☠️ You splash the Venom Vial! The enemy is poisoned and will take 3 damage per turn for 4 turns.`);
          }
        } else if (itemType === 'serratedDagger') {
          if ((inventory.value.serratedDaggers || 0) > 0 && !serratedDaggerActive.value) {
            inventory.value.serratedDaggers--;
            serratedDaggerActive.value = true;
            log(`🗡️ You coat your blade with the Serrated Dagger. Your next attack will cause the enemy to Bleed.`);
          }
        } else if (itemType === 'luckyCoin') {
          if ((inventory.value.luckyCoins || 0) > 0 && !luckyFleeActive.value) {
            inventory.value.luckyCoins--;
            luckyFleeActive.value = true;
            log(`🪙 You flip the Lucky Coin. Your next Flee attempt is guaranteed to succeed.`);
          }
        } else if (itemType === 'wardingShield') {
          if ((inventory.value.wardingShields || 0) > 0 && wardingShieldHitsRemaining.value <= 0) {
            inventory.value.wardingShields--;
            wardingShieldHitsRemaining.value = 3;
            log(`🛡️ You raise the Warding Shield! Incoming damage is halved for the next 3 hits.`);
          }
        } else if (itemType === 'smokeBomb') {
          if ((inventory.value.smokeBombs || 0) > 0) {
            if (isBoss(encounter.value?.enemy)) {
              log(`🚫 You cannot use a Smoke Bomb during a boss battle.`);
            } else {
              inventory.value.smokeBombs--;
              log(`💨 You throw a Smoke Bomb. You swiftly escape the combat.`);
              encounter.value = null;
              bossOverlay.value = false;
              itemEndedCombat = true;
            }
          }
        }

        if (itemEndedCombat) break;

        // Route through handleCombatAction with a no-op player action so the
        // enemy's queued attack (damage, warding shield, augments, defeat check)
        // runs through the full pipeline — same as any regular combat action.
        const itemIntentsSnapshot = [...(enemyIntents.value)];
        await handleCombatAction({
          player: {
            playerHP,
            playerClass,
            specialUsesLeft,
            weaponBonus,
            shieldBonus,
            playerName,
            dogName,
            action: 'use_item',
            effectiveMaxHP,
            totalSpecialsUsed,
            specialTier,
            playerGold,
            weaponAugment,
            defenseAugment,
            equippedWeapon,
            ironWillUsed,
            bloodpactActive,
            playerEnrageCharges,
          },
          enemy: {
            enemyHP,
            encounter,
            nextEnemyAttack,
            enemyNextAction,
            enemyStatusEffects,
            enemyIsStunned,
            enrageBonus,
            confusedAction,
            confusedTurnsLeft,
          },
          state: {
            log,
            formattedTitle: formattedTitle.value,
            DEFAULT_ENEMY_HP,
            isBoss,
            combatWinsSinceLastCapIncrease,
            hpCapBonus,
            enemiesKilled,
          },
          utils: {
            clearTimer: () => clearInterval(timerInterval),
            setDefeated: () => {
              showRecap.value = true;
              recapType.value = 'defeat';
              clearInterval(timerInterval);
            },
            handleLootDrop: handleLoot,
            markBossDefeated,
            gotoEnemyTurn,
            bossOverlay: bossOverlay,
            onDiceRoll,
            waitForDice,
            onCombatResult,
            onCounterResult,
            onVictory,
            onEnemyKilled,
            onFleeSuccess,
            onGoldStolen,
            onHpCapIncrease: () => {
              const bonus = "💪 Max HP +10";
              victoryLoot.value = victoryLoot.value ? `${victoryLoot.value} · ${bonus}` : bonus;
            },
            enemyIntents,
            enemyIntentsSnapshot: itemIntentsSnapshot,
            skipEnemyTurn: !isLast,
          },
          itemEffects: {
            serratedDaggerActive,
            luckyFleeActive,
            wardingShieldHitsRemaining,
            coolerStickBonus: (inventory.value.coolerStickItem > 0 ? 2 : 0) + (inventory.value.evenCoolerStickItem > 0 ? 3 : 0),
          },
        });

        if (!isLast) await waitForInterAction();
        continue;
      }
      // ── End combat item actions ───────────────────────────────────────────────

      // Snapshot intents (still needed by runSidekickAttacks); do NOT clear — intents stay frozen until enemy turn fires
      const combatIntentsSnapshot = [...(enemyIntents.value)];

      await handleCombatAction({
        player: {
          playerHP,
          playerClass,
          specialUsesLeft,
          weaponBonus,
          shieldBonus,
          playerName,
          dogName,
          action: singleAction,
          effectiveMaxHP,
          totalSpecialsUsed,
          specialTier,
          playerGold,
          weaponAugment,
          defenseAugment,
          equippedWeapon,
          ironWillUsed,
          bloodpactActive,
          playerEnrageCharges,
        },
        enemy: {
          enemyHP,
          encounter,
          nextEnemyAttack,
          enemyNextAction,
          enemyStatusEffects,
          enemyIsStunned,
          enrageBonus,
          confusedAction,
          confusedTurnsLeft,
        },
        state: {
          log,
          formattedTitle: formattedTitle.value,
          DEFAULT_ENEMY_HP,
          isBoss,
          combatWinsSinceLastCapIncrease,
          hpCapBonus,
          enemiesKilled,
        },
        utils: {
          clearTimer: () => clearInterval(timerInterval),
          setDefeated: () => {
            showRecap.value = true;
            recapType.value = 'defeat';
            clearInterval(timerInterval);
          },
          handleLootDrop: handleLoot,
          markBossDefeated,
          gotoEnemyTurn,
          bossOverlay: bossOverlay,
          onDiceRoll,
          waitForDice,
          onCombatResult,
          onCounterResult,
          onVictory,
          onEnemyKilled,
          onFleeSuccess,
          onGoldStolen,
          onHpCapIncrease: () => {
            const bonus = "💪 Max HP +10";
            victoryLoot.value = victoryLoot.value ? `${victoryLoot.value} · ${bonus}` : bonus;
          },
          enemyIntents,
          enemyIntentsSnapshot: combatIntentsSnapshot,
          skipEnemyTurn: !isLast,
        },
        itemEffects: {
          serratedDaggerActive,
          luckyFleeActive,
          wardingShieldHitsRemaining,
          coolerStickBonus: (inventory.value.coolerStickItem > 0 ? 2 : 0) + (inventory.value.evenCoolerStickItem > 0 ? 3 : 0),
        },
      });

      // Between queued actions: wait for dice result to fully display before starting the next roll
      if (!isLast) await waitForInterAction();
    }
  }

  function gotoEnemyTurn() {
    // Synchronous — intents must be set before Vue flushes DOM updates,
    // otherwise nextEnemyAttack.value is stale when the player clicks (breaks brace).
    counterResult.value = null;
    enemyTurnKey.value++;
    externalHandleEnemyTurn({
      enemyState: {
        enemyStatusEffects,
        enemyHP,
        encounter,
        enemyIsStunned,
        enemyNextAction,
        nextEnemyAttack,
        enemyIntents,
        enrageBonus,
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
        onEnemyKilled,
      },
    });
  }

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
        daysCount,
      },
      gameData: {
        chain,
        current,
        formattedTitle: formattedTitle.value,
        enemyDifficultyLevel,
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
        showCampfireOverlay,
        campfireReward,
        showRuneCacheModal,
        runeCacheReward,
      },
      utilityFunctions: {
        log,
      },
    });
  }

  function handleShopPurchase(item) {
    externalHandleShopPurchase(
      item,
      {
        playerGold,
        goldSpent,
        playerHP,
        effectiveMaxHP,
        weaponBonus,
        shieldBonus,
        specialUsesLeft,
        longRestsUsed,
        shortRestsUsed,
        blurClicksLeft,
        inventory,
        dogName,
      },
      {
        playerName,
      },
      {
        log,
      },
      {
        showDogNameModal,
      }
    );
  }

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
      const chargesRestored = specialUsesLeft.value < 3;
      if (chargesRestored) specialUsesLeft.value = 3;
      const tierData = playerClass.value?.specialTiers?.[specialTier.value - 1];
      const newName = tierData?.name ?? playerClass.value?.special;
      const chargeMsg = chargesRestored ? " Special charges restored to 3." : "";
      log(`✨ The Gods have answered. Your class ability ascends to Tier ${specialTier.value}: <strong>${newName}</strong>!${chargeMsg}`);
    } else {
      log(`🙏 <span class="player-name">${playerName.value}</span> places ${cost}g in the offering bowl... (${offeringPot.value}/3)`);
    }
  }

  // ── Library: advance reading progress on every link click ─────────────────
  watch(clickCount, () => {
    if (!libraryBook.value) return;
    libraryProgress.value++;
    const book = getBook(libraryBook.value.id);
    const target = book?.levels[libraryBook.value.levelIndex]?.readClicks ?? 23;
    if (libraryProgress.value >= target) {
      libraryReady.value = { ...libraryBook.value };
      libraryBook.value = null;
      libraryProgress.value = 0;
      log(`📖 You've finished reading <strong>${book.name}</strong>. Visit the Forge to craft it!`);
    }
  });

  function startReadingBook({ id, type, levelIndex }) {
    libraryBook.value = { id, type, levelIndex };
    libraryProgress.value = 0;
    const book = getBook(id);
    log(`📖 <span class="player-name">${playerName.value}</span> checks out <strong>${book?.name ?? id}</strong> from the Infinite Library.`);
  }

  function craftLibraryBook() {
    if (!libraryReady.value) return;
    const { id, levelIndex } = libraryReady.value;
    const book = getBook(id);
    const level = book?.levels[levelIndex];
    const cost = level?.forgeCost ?? 4;
    if ((inventory.value.scrapMetal ?? 0) < cost) return;
    inventory.value.scrapMetal -= cost;
    craftedLevels.value[id] = levelIndex + 1;
    libraryReady.value = null;
    log(`⚒️ <span class="player-name">${playerName.value}</span> forges <strong>${book?.name ?? id}</strong> (Level ${levelIndex + 1})!`);
  }

  return {
    callHandleClick,
    callHandleRest,
    callHandleSleep,
    callHandleOffer,
    handleCombatActionWrapper,
    gotoEnemyTurn,
    callHandleEncounterOption,
    handleShopPurchase,
    handleClassSelection,
    handleCloseEncounterWrapper,
    lastDiceRoll,
    lastDamageDealt,
    enemyHitKey,
    lastDamageTaken,
    playerHitKey,
    lastGoldStolen,
    counterResult,
    daysCount,
    playerEnrageCharges,
    handleSwitchTarget,
    victoryLoot,
    enemyIntents,
    libraryBook,
    libraryProgress,
    libraryReady,
    craftedLevels,
    startReadingBook,
    craftLibraryBook,
  };
}
