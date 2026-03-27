import { getRandomBoss, isBoss } from "@/utils/bossGenerator";
import { rollEncounter, npcData, loreData } from "@/utils/encounterGenerator";
import { shopItems } from "@/utils/shopItems";
import { buildGroupIntents } from "@/utils/enemyTurnHandler";

const DOG_EXCLUDED = new Set([
  "stickItem", "coolerStickItem", "evenCoolerStickItem", "dog",
]);
const DOG_ALLOWED_ITEMS = shopItems.filter(
  (i) => i.effect === "inventoryItem" && !DOG_EXCLUDED.has(i.details)
);

const dogInventoryKey = {
  compass:              (inv) => { inv.compass              = (inv.compass              || 0) + 1; },
  healthPotion:         (inv) => { inv.healthPotions        = (inv.healthPotions        || 0) + 1; },
  minorHealthPotion:    (inv) => { inv.minorHealthPotions   = (inv.minorHealthPotions   || 0) + 1; },
  barkTea:              (inv) => { inv.barkTeas             = (inv.barkTeas             || 0) + 1; },
  invisibilityCloak:    (inv) => { inv.invisibilityCloaks   = (inv.invisibilityCloaks   || 0) + 1; },
  herbalPoultice:       (inv) => { inv.herbalPoultices      = (inv.herbalPoultices      || 0) + 1; },
  frenchOnionSoup:      (inv) => { inv.frenchOnionSoups     = (inv.frenchOnionSoups     || 0) + 1; },
  smokeBomb:            (inv) => { inv.smokeBombs           = (inv.smokeBombs           || 0) + 1; },
  antidote:             (inv) => { inv.antidotes            = (inv.antidotes            || 0) + 1; },
  adventurersRations:   (inv) => { inv.adventurersRations   = (inv.adventurersRations   || 0) + 1; },
  sharedSufferingAmulet:(inv) => { inv.sharedSufferingAmulets = (inv.sharedSufferingAmulets || 0) + 1; },
  flashPowder:          (inv) => { inv.flashPowders         = (inv.flashPowders         || 0) + 1; },
  venomVial:            (inv) => { inv.venomVials           = (inv.venomVials           || 0) + 1; },
  serratedDagger:       (inv) => { inv.serratedDaggers      = (inv.serratedDaggers      || 0) + 1; },
  luckyCoin:            (inv) => { inv.luckyCoins           = (inv.luckyCoins           || 0) + 1; },
  wardingShield:        (inv) => { inv.wardingShields       = (inv.wardingShields       || 0) + 1; },
  wardStone:            (inv) => { inv.wardStones           = (inv.wardStones           || 0) + 1; },
  encounterBeacon:      (inv) => { inv.encounterBeacons     = (inv.encounterBeacons     || 0) + 1; },
  goldPouch:            (inv) => { inv.goldPouches          = (inv.goldPouches          || 0) + 1; },
  bountyScroll:         (inv) => { inv.bountyScrolls        = (inv.bountyScrolls        || 0) + 1; },
  turkeyLeg:            (inv) => { inv.turkeyLegs           = (inv.turkeyLegs           || 0) + 1; },
};

export async function handleClick({
  title,
  playerState,
  gameData,
  modalState,
  enemyState,
  utilityFunctions,
  isCloakActive,
  cloakClicksRemaining,
  wardStoneActive,
  encounterBeaconActive,
}) {
  const { journeyLength, enemyDifficultyLevel } = gameData;

  if (
    modalState.inEncounter.value ||
    modalState.showRestModal.value ||
    modalState.showShopModal.value ||
    modalState.showTipsModal.value ||
    modalState.showCampfireOverlay?.value
  ) {
    return;
  }

  utilityFunctions.log(`<i class="ra ra-archery-target"></i> ARTICLE: ${title}`);

  const finalTarget = gameData.chain[journeyLength.value - 1];

  gameData.current.value = title;
  playerState.clickCount.value++;
  playerState.path.value.push(title);

  if (title === gameData.chain[playerState.currentTargetIndex.value + 1]) {
    playerState.currentTargetIndex.value++;
    utilityFunctions.log(`<i class="ra ra-archery-target"></i> You have reached ${title.replaceAll("_", " ")}.`);
  }

  let encounterPreventedByCloak = false;

  if (isCloakActive.value && title !== finalTarget) {
    utilityFunctions.log(
      `<i class="ra ra-aura"></i> Cloak of Invisibility active: ${cloakClicksRemaining.value} clicks remaining.`
    );
    utilityFunctions.log(
      `<i class="ra ra-angel-wings"></i> You slip past unseen thanks to the Cloak of Invisibility.`
    );
    encounterPreventedByCloak = true;
  }

  if (wardStoneActive?.value && title !== finalTarget) {
    utilityFunctions.log(`<i class="ra ra-mountains"></i> The Ward Stone hums — you pass by unnoticed.`);
    encounterPreventedByCloak = true;
  }

  if (
    title === finalTarget &&
    playerState.currentTargetIndex.value === journeyLength.value - 1 &&
    !gameData.bossSpawned.value &&
    !gameData.bossDefeated.value
  ) {
    modalState.showRestModal.value = false;
    modalState.showShopModal.value = false;
    modalState.bossOverlay.value = true;

    const boss = getRandomBoss(enemyDifficultyLevel.value);
    gameData.selectedBossType.value = boss.type;

    enemyState.encounter.value = {
      type: "combat",
      enemy: boss,
    };
    enemyState.enemyHP.value = boss.hp;
    enemyState.encounterMessage.value = `<i class="ra ra-skull"></i> A terrifying ${boss.name} rises to defend ${gameData.formattedTitle.value}. Time to roll some true damage.`;

    enemyState.nextEnemyAttack.value =
      Math.floor(Math.random() * (boss.maxDamage - boss.minDamage + 1)) +
      boss.minDamage;
    enemyState.enemyNextAction.value = "attack";

    gameData.bossSpawned.value = true;
    playerState.combatEncountersFought.value++;

    utilityFunctions.log(
      `<i class="ra ra-skull"></i> <strong>BOSS ENCOUNTER:</strong> ${boss.name}.<br><br>${
        boss.message || "Roll for damage."
      }`
    );

    utilityFunctions.logEnemyAction(enemyState.enemyNextAction, enemyState.nextEnemyAttack);

    return;
  }

  const isBossClick =
    title === finalTarget &&
    playerState.currentTargetIndex.value === journeyLength.value - 1 &&
    !gameData.bossSpawned.value &&
    !gameData.bossDefeated.value;

  // Treasure map check — fires even through cloak (player deliberately navigated here)
  if (!isBossClick) {
    const openMaps = (playerState.inventory?.value?.treasureMaps ?? []).filter(
      (m) => m.opened && !m.collected && m.article === title
    );
    if (openMaps.length > 0) {
      const map = openMaps[0];
      enemyState.encounter.value = {
        type: "lore",
        lore: {
          id: "treasure_map_reward",
          name: "X Marks the Spot",
          text: `Parchment in hand, you've arrived. The hill, the stone, the old dead tree — it all matches the Cartographer's diagram exactly. And there it is: a patch of disturbed earth, right where the X should be.`,
          options: [
            {
              text: "Start digging.",
              result: "treasure_reward",
              mapId: map.id,
            },
          ],
        },
      };
      return;
    }
  }

  if (
    playerState.clickCount.value > 0 &&
    playerState.clickCount.value % 12 === 0 &&
    !encounterPreventedByCloak &&
    !isBossClick
  ) {
    modalState.showRestModal.value = true;
    return;
  }
  if (
    title !== finalTarget &&
    !encounterPreventedByCloak &&
    (encounterBeaconActive?.value || Math.random() < 0.4)
  ) {
    if (encounterBeaconActive?.value) {
      encounterBeaconActive.value = false;
      const availableNPCs = npcData.filter(
        (npc) => !gameData.seenNPCEncounters.value.includes(npc.id)
      );
      if (availableNPCs.length > 0) {
        const npc = availableNPCs[Math.floor(Math.random() * availableNPCs.length)];
        gameData.seenNPCEncounters.value.push(npc.id);
        enemyState.encounter.value = { type: "npc", npc };
        utilityFunctions.log(`<i class="ra ra-lantern-flame"></i> The Encounter Beacon draws a friendly face — ${npc.greeting}`);
      } else {
        utilityFunctions.log(`<i class="ra ra-lantern-flame"></i> The Encounter Beacon pulses, but all known travelers have passed through.`);
      }
      return;
    }

    const roll = rollEncounter(enemyDifficultyLevel.value);
    let fullEncounter = null;

    if (roll.type === "npc") {
      const availableNPCs = npcData.filter(
        (npc) => !gameData.seenNPCEncounters.value.includes(npc.id)
      );
      if (availableNPCs.length === 0) {
        console.warn("All NPCs seen, skipping NPC encounter.");
      } else {
        const npc =
          availableNPCs[Math.floor(Math.random() * availableNPCs.length)];
        gameData.seenNPCEncounters.value.push(npc.id);
        fullEncounter = { type: "npc", npc };
        utilityFunctions.log(`${npc.greeting}`);
      }
    } else if (roll.type === "lore") {
      const availableLore = loreData.filter(
        (lore) => !gameData.seenLoreEncounters.value.includes(lore.id)
      );
      if (availableLore.length === 0) {
        console.warn("All lore seen, skipping lore encounter.");
      } else {
        const lore =
          availableLore[Math.floor(Math.random() * availableLore.length)];
        gameData.seenLoreEncounters.value.push(lore.id);
        fullEncounter = { type: "lore", lore };
        utilityFunctions.log(`${lore.text}`);
      }
    } else if (roll.type === "combat") {
      const enemies = roll.enemies;
      const enemy = enemies?.[0];
      if (!enemy) {
        console.warn("Could not generate enemy, skipping combat encounter.");
      } else {
        fullEncounter = { ...roll, targetIndex: 0, enemy };
        enemyState.enemyHP.value = enemy.currentHP;
        enemyState.currentEnemy.value = enemy;
        playerState.combatEncountersFought.value++;

        const allEnemies = fullEncounter.enemies;
        if (allEnemies && allEnemies.length > 1) {
          const intents = buildGroupIntents(allEnemies);
          if (enemyState.enemyIntents) enemyState.enemyIntents.value = intents;
          const targetIntent = intents[0];
          enemyState.nextEnemyAttack.value = targetIntent?.damage ?? null;
          enemyState.enemyNextAction.value = targetIntent?.action === "attack" ? "attack" : "idle";
        } else {
          enemyState.nextEnemyAttack.value =
            Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) +
            enemy.minDamage;
          enemyState.enemyNextAction.value = "attack";
        }
      }
    }

    if (fullEncounter) {
      enemyState.encounter.value = fullEncounter;

      if (fullEncounter.type === "combat") {
        const groupSize = fullEncounter.enemies?.length ?? 1;
        const enemyName = fullEncounter.enemy.name ?? "Enemy";
        const enemyLabel = groupSize > 1
          ? `<strong>${enemyName}s</strong>`
          : `a <strong>${enemyName}</strong>`;
        utilityFunctions.log(
          `<i class="ra ra-plain-dagger"></i> You've been attacked near <strong>${
            gameData.formattedTitle.value
          }</strong> by ${enemyLabel}. What do you do?`
        );
        utilityFunctions.logEnemyAction(enemyState.enemyNextAction, enemyState.nextEnemyAttack);
      }

      return;
    }
  }

  if (encounterPreventedByCloak) {
    enemyState.encounter.value = null;
  }

  if (title === finalTarget && gameData.bossDefeated.value) {
    utilityFunctions.clearInterval(gameData.timerInterval);
  }

  // Dog find encounter — 10% chance if player has a dog and no encounter is active
  if (
    playerState.dogName?.value &&
    playerState.inventory?.value &&
    !enemyState.encounter.value &&
    Math.random() < 0.07
  ) {
    const item = DOG_ALLOWED_ITEMS[Math.floor(Math.random() * DOG_ALLOWED_ITEMS.length)];
    const addFn = dogInventoryKey[item.details];
    if (item && addFn) {
      addFn(playerState.inventory.value);
      const dogName = playerState.dogName.value;
      enemyState.encounter.value = {
        type: "lore",
        lore: {
          id: `dog_find_${Date.now()}`,
          name: "Dog Find",
          text: `<i class="ra ra-pawprint"></i> ${dogName} sniffs the ground and begins digging and growling excitedly. They found <strong>${item.name}</strong>! It has been added to your inventory.`,
          options: [{ text: `Good dog! <i class="ra ra-pawprint"></i>`, flow: "close_encounter" }],
        },
      };
    }
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}
