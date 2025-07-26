// utils/encounterGenerator.js

import loreData from "@/assets/data/loreEncounters.json";
import npcData from "@/assets/data/friendlyEncounters.json";
import { ENEMY_TYPES } from "@/utils/enemies";

export function rollEncounter() {
  const roll = Math.floor(Math.random() * 20) + 1;

  if (roll <= 0) {
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

  if (roll <= 20) {
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
    enemy: generateEnemy(),
  };
}

export function generateEnemy() {
  const enemyData = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];

  const hp =
    Math.floor(Math.random() * (enemyData.maxHP - enemyData.minHP + 1)) +
    enemyData.minHP;

  return {
    ...enemyData,
    currentHP: hp,
  };
}
