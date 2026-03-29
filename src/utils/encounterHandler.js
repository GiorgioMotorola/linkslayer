import { generateEnemy, generateEnemyGroup } from "@/utils/encounterGenerator";
import { generateMiniBoss } from "@/utils/miniBossGenerator";
import { getRandomTreasureMapArticle } from "@/utils/treasureMapArticles";

const MYSTERY_ITEM_POOL = [
  { inv: 'healthPotions',     name: 'Health Potion' },
  { inv: 'turkeyLegs',        name: 'Turkey Leg' },
  { inv: 'barkTea',           name: 'Bark Tea' },
  { inv: 'luckyStones',       name: 'Lucky Stone' },
  { inv: 'smokeBombs',        name: 'Smoke Bomb' },
  { inv: 'minorHealthPotions',name: 'Minor Health Potion' },
  { inv: 'antidotes',         name: 'Antidote' },
];

const TREASURE_AUGMENT_POOL = [
  { type: "weaponAugment", key: "bleedEdge",    name: "Serrated Edge" },
  { type: "weaponAugment", key: "venomCoat",    name: "Venom Coat" },
  { type: "weaponAugment", key: "thunderstrike", name: "Thunderstrike Rune" },
  { type: "weaponAugment", key: "emberTemper",  name: "Ember Temper" },
  { type: "weaponAugment", key: "cursedRune",   name: "Cursed Rune" },
  { type: "weaponAugment", key: "soulShard",    name: "Soul Shard" },
  { type: "defenseAugment", key: "thornplate",  name: "Thornplate" },
  { type: "defenseAugment", key: "stoneskin",   name: "Stoneskin" },
  { type: "defenseAugment", key: "bloodpactRune", name: "Bloodpact Rune" },
  { type: "defenseAugment", key: "ironWill",    name: "Iron Will" },
  { type: "defenseAugment", key: "wardensWard", name: "Warden's Ward" },
  { type: "defenseAugment", key: "frostbound",  name: "Frostbound" },
];

const TREASURE_OTHER_POOL = [
  { type: "scrap",         amount: 25,  name: "25 Scrap Metal" },
  { type: "healthPotions", amount: 10,  name: "10 Major Health Potions" },
  { type: "gold",          amount: 200, name: "200 Gold Pieces" },
];

function pickTreasureReward() {
  const pool = [...TREASURE_AUGMENT_POOL, ...TREASURE_OTHER_POOL];
  return pool[Math.floor(Math.random() * pool.length)];
}

function applyTreasureReward(reward, playerState, utilityFunctions) {
  const { inventory, playerGold, playerName } = playerState;
  const { log } = utilityFunctions;
  if (reward.type === "weaponAugment") {
    inventory.value.pendingWeaponAugments = [...(inventory.value.pendingWeaponAugments ?? []), reward.key];
    log(`<i class="ra ra-sword"></i> <span class="player-name">${playerName.value}</span> unearthed a <strong>${reward.name}</strong> weapon augment. It's been added to your pending augments.`);
  } else if (reward.type === "defenseAugment") {
    inventory.value.pendingDefenseAugments = [...(inventory.value.pendingDefenseAugments ?? []), reward.key];
    log(`<i class="ra ra-shield"></i> <span class="player-name">${playerName.value}</span> unearthed a <strong>${reward.name}</strong> defense augment. It's been added to your pending augments.`);
  } else if (reward.type === "scrap") {
    inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) + reward.amount;
    log(`<i class="ra ra-cog"></i> <span class="player-name">${playerName.value}</span> unearthed ${reward.amount} Scrap Metal.`);
  } else if (reward.type === "healthPotions") {
    inventory.value.healthPotions = (inventory.value.healthPotions || 0) + reward.amount;
    log(`<i class="ra ra-corked-tube"></i> <span class="player-name">${playerName.value}</span> unearthed ${reward.amount} Major Health Potions.`);
  } else if (reward.type === "gold") {
    playerGold.value += reward.amount;
    log(`<i class="ra ra-gold-bar"></i> <span class="player-name">${playerName.value}</span> unearthed ${reward.amount} Gold Pieces.`);
  }
  return reward;
}

function applyOptionEffects({
  effectType,
  option,
  playerState,
  utilityFunctions,
}) {
  const {
    playerHP,
    playerName,
    specialUsesLeft,
    blurClicksLeft,
    poisonedClicksLeft,
    poisonDamagePerClick,
    playerGold,
    inventory,
    effectiveMaxHP,
  } = playerState;

  const { log } = utilityFunctions;

  switch (effectType) {
    case "item":
      if (option.details === "health_potion_consumable") {
        inventory.value.healthPotions++;
        log(
          `+ <span class="player-name">${playerName.value}</span> found a Health Potion. It's been added to your backpack.`
        );
      }
      if (option.details === "health") {
        inventory.value.minorHealthPotions = (inventory.value.minorHealthPotions || 0) + 1;
        log(
          `<i class="ra ra-corked-tube"></i> <span class="player-name">${playerName.value}</span> found a Minor Health Potion. It's been added to your backpack.`
        );
      }
      if (option.details === "health-major") {
        inventory.value.healthPotions = (inventory.value.healthPotions || 0) + 1;
        log(
          `<i class="ra ra-corked-tube"></i> <span class="player-name">${playerName.value}</span> found a Health Potion. It's been added to your backpack.`
        );
      }
      if (option.details === "weapon") {
        const scrapAmount = Number(option.amount || 1) * 2;
        inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) + scrapAmount;
        log(
          `<i class="ra ra-cog"></i> <span class="player-name">${playerName.value}</span> found ${scrapAmount} Scrap Metal.`
        );
      }
      if (option.details === "whisky") {
        const duration = Number(option.amount) || 4;
        blurClicksLeft.value += duration;
        log(
          `<i class="ra ra-beer"></i> <span class="player-name">${playerName.value}</span> knocks back the whisky. Your vision becomes blurry for ${duration} clicks.`
        );
      }
      if (option.details === "poison") {
        const duration = Number(option.amount) || 3;
        const damage = Number(option.damage) || 1;

        poisonedClicksLeft.value += duration;
        poisonDamagePerClick.value = damage;
        log(
          `<i class="ra ra-venomous-snake"></i> <span class="player-name">${playerName.value}</span> is poisoned. You will lose ${damage} HP for the next ${duration} clicks.`
        );
      }
      if (option.details === "whisky-health") {
        const duration = Number(option.amount) || 4;
        const healthAmount = Number(option.healthAmount) || 5;

        blurClicksLeft.value += duration;
        playerHP.value = Math.min(
          Number(playerHP.value || 0) + healthAmount,
          Number(effectiveMaxHP || 0)
        );
        log(
          `<i class="ra ra-beer"></i> <span class="player-name">${playerName.value}</span> knocks back the whisky. Your vision blurs for ${duration} clicks and you gained ${healthAmount} HP.`
        );
      }
      if (option.details === "gold") {
        const amount = Number(option.amount) || 0;
        playerGold.value += amount;
        log(
          `<i class="ra ra-gold-bar"></i> <span class="player-name">${playerName.value}</span> obtained ${amount} Gold Pieces.`
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
            `<i class="ra ra-health-increase"></i> <span class="player-name">${playerName.value}</span> gained ${healthAmount} HP but lost ${goldCost} Gold.`
          );
        } else {
          log(
            `<i class="ra ra-x-mark"></i> <span class="player-name">${playerName.value}</span> doesn't have enough Gold for this. (Need: ${goldCost}, Have: ${playerGold.value})`
          );
        }
      }
      if (option.details === "whisky-cost-blur") {
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
            `<i class="ra ra-beer"></i> <span class="player-name">${playerName.value}</span> knocks back the whisky. Your vision blurs for ${duration} clicks and you gained ${healthAmount} HP, but lost ${goldCost} Gold.`
          );
        } else {
          log(
            `<i class="ra ra-x-mark"></i> <span class="player-name">${playerName.value}</span> can't afford that. (Need: ${goldCost}, Have: ${playerGold.value})`
          );
        }
      }
      if (option.details === "shield") {
        const scrapAmount = Number(option.amount || 1) * 2;
        inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) + scrapAmount;
        log(
          `<i class="ra ra-cog"></i> <span class="player-name">${playerName.value}</span> found ${scrapAmount} Scrap Metal.`
        );
      }
      if (option.details === "gold_damage") {
        const goldAmount = Number(option.goldAmount) || 25;
        const damageAmount = Number(option.damageAmount) || 5;
        playerGold.value += goldAmount;
        playerHP.value = Math.max(0, Number(playerHP.value || 0) - damageAmount);
        log(
          `<i class="ra ra-gold-bar"></i> <span class="player-name">${playerName.value}</span> took ${goldAmount} Gold but lost ${damageAmount} HP.`
        );
      }
      break;
    case "inventoryItem":
      if (option.id === "health_potion_consumable") {
        inventory.value.healthPotions++;
        log(
          `+ <span class="player-name">${playerName.value}</span> found a Health Potion.`
        );
      } else if (option.id === "arcane_compass") {
        inventory.value.compass++;
        log(
          `<i class="ra ra-compass"></i> <span class="player-name">${playerName.value}</span> found an Arcane Compass.`
        );
      } else if (option.id === "turkey_leg_consumable") {
        inventory.value.turkeyLegs++;
        log(
          `<i class="ra ra-chicken-leg"></i> <span class="player-name">${playerName.value}</span> found a Turkey Leg.`
        );
      } else if (option.id === "bark_tea_consumable" || option.details === "barkTea") {
        inventory.value.barkTeas = (inventory.value.barkTeas || 0) + 1;
        log(
          `<i class="ra ra-coffee-mug"></i> <span class="player-name">${playerName.value}</span> found Bark Tea. It's been added to your backpack.`
        );
      } else if (option.details === "enlightenmentFish") {
        inventory.value.enlightenmentFish = 1;
        log(
          `<i class="ra ra-fish"></i> <span class="player-name">${playerName.value}</span> acquired The Fish of Eternal Enlightenment.`
        );
      } else if (option.id === "lucky_stone") {
        inventory.value.luckyStones = (inventory.value.luckyStones ?? 0) + 1;
        log(
          `<i class="ra ra-mountains"></i> <span class="player-name">${playerName.value}</span> picked up a Lucky Stone.`
        );
      }
      break;

    case "damage":
      playerHP.value = Math.max(
        Number(playerHP.value || 0) - (option.amount || 5),
        0
      );
      log(
        `<i class="ra ra-perspective-dice-random"></i> <span class="player-name">${playerName.value}</span> took ${
          option.amount || 5
        } damage.`
      );
      break;
    case "damage-minor":
      playerHP.value = Math.max(
        Number(playerHP.value || 0) - (option.amount || 1),
        0
      );
      log(
        `<i class="ra ra-perspective-dice-random"></i> <span class="player-name">${playerName.value}</span> took ${
          option.amount || 1
        } damage.`
      );
      break;
    case "damage-major":
      playerHP.value = Math.max(
        Number(playerHP.value || 0) - (option.amount || 50),
        0
      );
      log(
        `<i class="ra ra-perspective-dice-random"></i> <span class="player-name">${playerName.value}</span> took ${
          option.amount || 50
        } damage.`
      );
      break;
    case "special":
      if (option.details === "recover") {
        const amount = Number(option.amount) || 1;
        specialUsesLeft.value += amount;
        log(
          `<i class="ra ra-perspective-dice-random"></i> <span class="player-name">${
            playerName.value
          }</span> regained ${amount} class ability charges ${
            amount > 1 ? "s" : ""
          }.`
        );
      }
      break;
    case "shortcut-damage":
      const damageTaken = Number(option.damageTaken) || 10;
      const clicksReduced = Number(option.clicksReduced) || 10;
      playerState.playerHP.value = Math.max(
        Number(playerState.playerHP.value || 0) - damageTaken,
        0
      );
      playerState.clickCount.value = Math.max(
        0,
        playerState.clickCount.value - clicksReduced
      );
      playerState.shortcutsUsedCount.value++;
      log(
        `<i class="ra ra-perspective-dice-random"></i> <span class="player-name">${playerName.value}</span> took ${damageTaken} damage for taking the shortcut, but saved ${clicksReduced} clicks.`
      );
      break;
    case "shortcut":
      if (option.details === "clicks") {
        const amount = Number(option.amount) || 1;
        playerState.clickCount.value = Math.max(
          0,
          playerState.clickCount.value - amount
        );
        playerState.shortcutsUsedCount.value++;
        log(
          `<i class="ra ra-perspective-dice-random"></i> <span class="player-name">${playerName.value}</span> discovered a shortcut. Click count reduced by ${amount}.`
        );
      }
      break;
  }
}

function showFinalScene(responseText, currentEncounter, enemyState) {
  const continueOption = [{ text: "Continue on your journey.", flow: "close_encounter" }];
  if (currentEncounter.type === "npc") {
    enemyState.encounter.value = {
      type: "npc",
      npc: {
        id: currentEncounter.npc.id,
        name: currentEncounter.npc.name,
        greeting: responseText,
        options: continueOption,
      },
    };
  } else if (currentEncounter.type === "lore") {
    enemyState.encounter.value = {
      type: "lore",
      lore: {
        id: currentEncounter.lore.id,
        name: currentEncounter.lore.name,
        text: responseText,
        options: continueOption,
      },
    };
  } else {
    enemyState.encounter.value = null;
  }
}

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
  const canShowFinalScene = isNpcEncounter || isLoreEncounter;

  if (option.responseText) {
    utilityFunctions.log(`You select: ${option.text}`);
    utilityFunctions.log(option.responseText);
    enemyState.encounterMessage.value = option.responseText;
  }

  if (option.effect) {
    applyOptionEffects({
      effectType: option.effect,
      option,
      playerState,
      utilityFunctions,
    });
  }

  if (option.flow === "dialogue_branch" && option.next_node_id) {
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

  if (option.result === "treasure_map") {
    const cost = Number(option.cost) || 50;
    const { inventory, playerGold, playerName } = playerState;
    const { log } = utilityFunctions;
    if (playerGold.value < cost) {
      log(`<i class="ra ra-x-mark"></i> You need ${cost}g to buy this map. You have ${playerGold.value}g.`);
      return; // stay on encounter, don't close
    }
    playerGold.value -= cost;
    const article = getRandomTreasureMapArticle(inventory.value.treasureMaps ?? []);
    const newMap = {
      id: `tmap_${Date.now()}`,
      article,
      opened: false,
      collected: false,
      tier: option.tier ?? "common",
    };
    inventory.value.treasureMaps = [...(inventory.value.treasureMaps ?? []), newMap];
    log(`<i class="ra ra-scroll-unfurled"></i> <span class="player-name">${playerName.value}</span> received a Treasure Map — Sealed. Open it from your backpack when you're ready.`);
    if (option.responseText && canShowFinalScene) {
      showFinalScene(option.responseText, currentEncounter, enemyState);
    } else {
      enemyState.encounter.value = null;
      modalState.bossOverlay.value = false;
    }
    return;
  }

  if (option.result === "treasure_reward") {
    const maps = playerState.inventory.value.treasureMaps ?? [];
    const mapIdx = maps.findIndex((m) => m.id === option.mapId);
    if (mapIdx >= 0) {
      maps[mapIdx].collected = true;
      playerState.inventory.value.treasureMaps = [...maps];
    }
    const reward = pickTreasureReward();
    applyTreasureReward(reward, playerState, utilityFunctions);
    const rewardText = `The Blacklisted Cartographer's map was worth every coin. You found: <strong>${reward.name}</strong>.`;
    showFinalScene(rewardText, currentEncounter, enemyState);
    return;
  }

  if (option.result === "days_increase") {
    const amount = Number(option.amount) || 50;
    const { daysCount, playerName } = playerState;
    const { log } = utilityFunctions;
    if (daysCount) {
      daysCount.value += amount;
    }
    log(`<i class="ra ra-campfire"></i> <span class="player-name">${playerName.value}</span> lost ${amount} days to the suspended sands.`);
    if (option.responseText && canShowFinalScene) {
      showFinalScene(option.responseText, currentEncounter, enemyState);
    } else {
      enemyState.encounter.value = null;
      modalState.bossOverlay.value = false;
    }
    return;
  }

  if (option.flow === "close_encounter") {
    if (option.responseText && canShowFinalScene) {
      showFinalScene(option.responseText, currentEncounter, enemyState);
    } else {
      enemyState.encounter.value = null;
      modalState.bossOverlay.value = false;
    }
    return;
  }

  if (option.result === "combat") {
    const enemies = generateEnemyGroup();
    const enemy = enemies?.[0];
    if (!enemy) {
      console.warn("Could not generate enemy from option, skipping combat.");
      enemyState.encounter.value = null;
      modalState.bossOverlay.value = false;
      return;
    }

    enemyState.encounter.value = {
      type: "combat",
      enemies,
      targetIndex: 0,
      enemy,
    };
    enemyState.enemyHP.value = enemy.currentHP;
    enemyState.nextEnemyAttack.value =
      Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) +
      enemy.minDamage;
    enemyState.enemyNextAction.value = "attack";
    playerState.combatEncountersFought.value++;
    const groupSize = enemies.length;
    const enemyName = enemy.name ?? "Enemy";
    const enemyLabel = groupSize > 1
      ? `<strong>${enemyName}s</strong>`
      : `a <strong>${enemyName}</strong>`;
    utilityFunctions.log(
      `<i class="ra ra-plain-dagger"></i> Your choice has led to combat — you are attacked by ${enemyLabel}. What do you do?`
    );
    return;
  }

  if (option.result === "mini_boss_combat") {
    const miniBoss = generateMiniBoss(option.miniBossType, gameData.enemyDifficultyLevel?.value ?? 0);
    if (!miniBoss) {
      console.warn(
        `Could not generate specific mini-boss for type "${option.miniBossType}", skipping combat.`
      );
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
    playerState.combatEncountersFought.value++;
    utilityFunctions.log(
      `<i class="ra ra-explosion"></i> You are attacked by <strong>${miniBoss.name}</strong> What do you do?`
    );
    return;
  }

  if (option.routeTitle) {
    utilityFunctions.log(`<i class="ra ra-book"></i> You choose: ${option.text}`);
    gameData.current.value = option.routeTitle;
    playerState.path.value.push(option.routeTitle);
    playerState.clickCount.value++;

    enemyState.encounter.value = null;
    modalState.bossOverlay.value = false;

    if (
      option.routeTitle ===
      gameData.chain[playerState.currentTargetIndex.value + 1]
    ) {
      playerState.currentTargetIndex.value++;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (option.result === "rune_cache") {
    modalState.runeCacheReward.value = { tier: option.tier || 1 };
    modalState.showRuneCacheModal.value = true;
    enemyState.encounter.value = null;
    modalState.bossOverlay.value = false;
    return;
  }

  if (option.result === "campfire_rest") {
    const rewards = [
      { type: "gold", amount: 50 },
      { type: "scrap", amount: 2 },
      { type: "scrap", amount: 4 },
      { type: "special", amount: 3 },
    ];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    modalState.campfireReward.value = { name: option.campfireName || "Campfire", ...reward };
    modalState.showCampfireOverlay.value = true;
    enemyState.encounter.value = null;
    modalState.bossOverlay.value = false;
    return;
  }

  if (option.result === "mystery_item") {
    const cost = Number(option.cost) || 40;
    const { playerGold, inventory, playerName } = playerState;
    const { log } = utilityFunctions;
    if (playerGold.value < cost) {
      log(`<i class="ra ra-x-mark"></i> You need ${cost}g. You have ${playerGold.value}g.`);
      return;
    }
    playerGold.value -= cost;
    const pick = MYSTERY_ITEM_POOL[Math.floor(Math.random() * MYSTERY_ITEM_POOL.length)];
    inventory.value[pick.inv] = (inventory.value[pick.inv] ?? 0) + 1;
    const resultText = `You hand over ${cost}g. He reaches into the pack without looking. He produces: ${pick.name}.`;
    showFinalScene(resultText, currentEncounter, enemyState);
    return;
  }

  if (option.result === "read_log") {
    const cost = Number(option.cost) || 20;
    const { playerGold, playerName } = playerState;
    const { log, gameLog } = utilityFunctions;
    if (playerGold.value < cost) {
      log(`<i class="ra ra-x-mark"></i> You need ${cost}g. You have ${playerGold.value}g.`);
      return;
    }
    playerGold.value -= cost;
    const entries = (gameLog?.value ?? gameLog ?? [])
      .filter(e => e.text && !e.text.includes('You select:') && !e.text.includes('Select an enemy'))
      .slice(-30);
    let resultText;
    if (entries.length > 3) {
      const entry = entries[Math.floor(Math.random() * (entries.length - 3))];
      const stripped = entry.text.replace(/<[^>]*>/g, '').replace(/^\d+\.\s*/, '').trim();
      resultText = `She closes her eyes. After a long silence she says: "${stripped}"`;
    } else {
      resultText = `She looks at your hands. "You have not done enough yet for me to read."`;
    }
    showFinalScene(resultText, currentEncounter, enemyState);
    return;
  }

  const isTerminalEffectResult = [
    "item",
    "inventoryItem",
    "damage",
    "damage-minor",
    "damage-major",
    "special",
    "shortcut",
    "shortcut-damage",
  ].includes(option.result);

  if (isTerminalEffectResult && !option.effect) {
    applyOptionEffects({
      effectType: option.result,
      option,
      playerState,
      utilityFunctions,
    });
    if (option.responseText && canShowFinalScene) {
      showFinalScene(option.responseText, currentEncounter, enemyState);
    } else {
      enemyState.encounter.value = null;
      modalState.bossOverlay.value = false;
    }
    return;
  }

  if (currentEncounter !== null) {
    if (option.responseText && canShowFinalScene) {
      showFinalScene(option.responseText, currentEncounter, enemyState);
    } else {
      enemyState.encounter.value = null;
      modalState.bossOverlay.value = false;
    }
  }
}
