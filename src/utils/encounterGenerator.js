// utils/encounterGenerator.js

import loreData from "@/assets/data/loreEncounters.json";
import npcData from "@/assets/data/friendlyEncounters.json";

export function rollEncounter() {
  const roll = Math.floor(Math.random() * 20) + 1;

  if (roll <= 1) {
    // Lore encounter
    const lore = loreData[Math.floor(Math.random() * loreData.length)];
    return {
      type: "lore",
      lore,
    };
  }

  if (roll <= 19) {
    // Friendly NPC encounter
    const npc = npcData[Math.floor(Math.random() * npcData.length)];
    return {
      type: "npc",
      npc,
    };
  }

  // Combat (all other rolls)
  return {
    type: "combat",
    enemy: generateEnemy(),
  };
}

function generateEnemy() {
  const enemies = ["Goblin", "Wraith", "Skeleton", "Beast", "Dragon", "Fiend"];
  return enemies[Math.floor(Math.random() * enemies.length)];
}

export { generateEnemy };
