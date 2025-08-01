// utils/encounterGenerator.js

import loreData from "@/assets/data/loreEncounters.json";
import npcData from "@/assets/data/friendlyEncounters.json";
import { ENEMY_TYPES } from "@/utils/enemies";

export function rollEncounter(difficultyLevel) {
  const roll = Math.floor(Math.random() * 20) + 1;

  if (roll <= 8) {
    // Lore encounter
    const lore = loreData[Math.floor(Math.random() * loreData.length)];
    return {
      type: "lore",
      lore: {
        ...lore,
        currentNodeId: lore.dialogueNodes ? "start" : undefined,
      },
    };
  }

  if (roll <= 15) {
    // Friendly NPC encounter
    const npc = npcData[Math.floor(Math.random() * npcData.length)];
    return {
      type: "npc",
      npc: {
        ...npc,
        currentNodeId: npc.dialogueNodes ? "start" : undefined,
      },
    };
  }

  // Combat (all other rolls)
  return {
    type: "combat",
    enemy: generateEnemy(difficultyLevel),
  };
}

export function generateEnemy(difficultyLevel = 0) {
  const enemyData = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];

  // Scale HP: +2 HP per difficulty level
  const scaledMinHP = enemyData.minHP + (2 * difficultyLevel);
  const scaledMaxHP = enemyData.maxHP + (2 * difficultyLevel);

  // Scale damage: +1 to both min and max damage per difficulty level
  const scaledMinDamage = enemyData.minDamage + (1 * difficultyLevel);
  const scaledMaxDamage = enemyData.maxDamage + (1 * difficultyLevel);

  const hp =
    Math.floor(Math.random() * (scaledMaxHP - scaledMinHP + 1)) +
    scaledMinHP;

  return {
    ...enemyData,
    currentHP: hp,
    minDamage: scaledMinDamage,
    maxDamage: scaledMaxDamage
  };
}