// src/utils/clickHandler.js

import { nextTick } from "vue";
import { getRandomBoss, isBoss } from "@/utils/bossGenerator";
import { rollEncounter, generateEnemy } from "@/utils/encounterGenerator";
import friendlyEncounters from "@/assets/data/friendlyEncounters.json";
import loreEncounters from "@/assets/data/loreEncounters.json";

export async function handleClick({
  title,
  playerState,
  gameData,
  modalState,
  enemyState,
  utilityFunctions,
  isCloakActive,
  cloakClicksRemaining,
}) {
  const { journeyLength, enemyDifficultyLevel } = gameData; // <-- Retrieve difficultyLevel here

  if (
    modalState.inEncounter.value ||
    modalState.showRestModal.value ||
    modalState.showShopModal.value ||
    modalState.showTipsModal.value
  ) {
    return;
  }

  utilityFunctions.log(`📍 ARTICLE: ${title}`);

  const finalTarget = gameData.chain[journeyLength.value - 1];

  gameData.current.value = title;
  playerState.clickCount.value++;
  playerState.path.value.push(title);

  if (title === gameData.chain[playerState.currentTargetIndex.value + 1]) {
    playerState.currentTargetIndex.value++;
    utilityFunctions.log(`🎯 You have reached ${title.replaceAll("_", " ")}.`);
  }

  let encounterPreventedByCloak = false;

  if (isCloakActive.value && title !== finalTarget) {
    utilityFunctions.log(
      `✨ Cloak of Invisibility active: ${cloakClicksRemaining.value} clicks remaining.`
    );
    utilityFunctions.log(
      "👻 You slip past unseen thanks to the Cloak of Invisibility."
    );
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
    
    // Pass difficultyLevel to getRandomBoss
    const boss = getRandomBoss(enemyDifficultyLevel.value); 
    gameData.selectedBossType.value = boss.type;

    enemyState.encounter.value = {
      type: "combat",
      enemy: boss,
    };
    enemyState.enemyHP.value = boss.hp;
    enemyState.encounterMessage.value = `💀 A terrifying ${boss.name} rises to defend ${gameData.formattedTitle.value}. Time to roll some true damage.`;

    enemyState.nextEnemyAttack.value =
      Math.floor(Math.random() * (boss.maxDamage - boss.minDamage + 1)) +
      boss.minDamage;
    enemyState.enemyNextAction.value = "attack";

    gameData.bossSpawned.value = true;
    playerState.combatEncountersFought.value++;

    utilityFunctions.log(
      `💀 <strong>BOSS ENCOUNTER:</strong> ${boss.name}.<br><br>${
        boss.message || "Roll for damage."
      }`
    );

    utilityFunctions.logEnemyAction();

    return;
  }

  if (
    playerState.clickCount.value > 0 &&
    playerState.clickCount.value % 12 === 0 &&
    !encounterPreventedByCloak
  ) {
    modalState.showRestModal.value = true;
    return;
  }
  if (
    playerState.clickCount.value > 0 &&
    playerState.clickCount.value % 10 === 0 &&
    !modalState.showRestModal.value &&
    !encounterPreventedByCloak
  ) {
    modalState.showShopModal.value = true;
    return;
  }

  if (
    title !== finalTarget &&
    !encounterPreventedByCloak &&
    Math.random() < 0.4
  ) {
    // Pass difficultyLevel to rollEncounter
    const roll = rollEncounter(enemyDifficultyLevel.value); 
    let fullEncounter = null;

    if (roll.type === "npc") {
      const availableNPCs = friendlyEncounters.filter(
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
      const availableLore = loreEncounters.filter(
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
        // Pass difficultyLevel to generateEnemy
      const enemy = generateEnemy(enemyDifficultyLevel.value); 
      if (!enemy) {
        console.warn("Could not generate enemy, skipping combat encounter.");
      } else {
        enemyState.enemyHP.value = enemy.currentHP;
        enemyState.currentEnemy.value = enemy;
        fullEncounter = { type: "combat", enemy };
        playerState.combatEncountersFought.value++;
      }
      enemyState.nextEnemyAttack.value =
        Math.floor(Math.random() * (enemy.maxDamage - enemy.minDamage + 1)) +
        enemy.minDamage;
      enemyState.enemyNextAction.value = "attack";
    }

    if (fullEncounter) {
      enemyState.encounter.value = fullEncounter;

      if (fullEncounter.type === "combat") {
        utilityFunctions.log(
          `🗡️ You've been attacked by <strong>${
            gameData.formattedTitle.value
          }</strong> ${fullEncounter.enemy.name ?? ""}. What do you do?`
        );
        utilityFunctions.logEnemyAction();
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

  window.scrollTo({ top: 0, behavior: "smooth" });
}