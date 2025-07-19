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
}) {
  const { journeyLength } = gameData;

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
    utilityFunctions.log(`🎯 You have reached ${title.replaceAll("_", " ")}!`);
  }

  if (
    title === finalTarget &&
    playerState.currentTargetIndex.value === journeyLength.value - 1 &&
    !gameData.bossSpawned.value &&
    !gameData.bossDefeated.value
  ) {
    modalState.showRestModal.value = false;
    modalState.bossOverlay.value = true;
    const boss = getRandomBoss();
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
      `💀 <strong>BOSS ENCOUNTER:</strong> ${boss.name}!<br><br>${
        boss.message || "Prepare for the fight of your life."
      }`
    );

    utilityFunctions.logEnemyAction();

    return;
  }

  if (
    playerState.clickCount.value > 0 &&
    playerState.clickCount.value % 11 === 0
  ) {
    modalState.showRestModal.value = true;
    return;
  }
  if (
    playerState.clickCount.value > 0 &&
    playerState.clickCount.value % 15 === 0 &&
    !modalState.showRestModal.value
  ) {
    modalState.showShopModal.value = true;
    return;
  }

  if (title !== finalTarget && Math.random() < 0.4) {
    const roll = rollEncounter();
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
      const enemy = generateEnemy();
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

  if (title === finalTarget && gameData.bossDefeated.value) {
    utilityFunctions.clearInterval(gameData.timerInterval);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}
