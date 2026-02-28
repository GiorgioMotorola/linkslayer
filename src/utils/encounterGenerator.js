// utils/encounterGenerator.js
import { ENEMY_TYPES } from "@/utils/enemies";

const npcModules = import.meta.glob("@/assets/data/encounters/friendly/*.yaml", { eager: true });
const npcData = Object.values(npcModules).flatMap((m) => m.default);

const loreModules = import.meta.glob("@/assets/data/encounters/lore/*.yaml", { eager: true });
const loreData = Object.values(loreModules).flatMap((m) => m.default);

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

  const scaledMinHP = enemyData.minHP + 2 * difficultyLevel;
  const scaledMaxHP = enemyData.maxHP + 2 * difficultyLevel;

  const scaledMinDamage = enemyData.minDamage + 2 * difficultyLevel;
  const scaledMaxDamage = enemyData.maxDamage + 2 * difficultyLevel;

  const hp =
    Math.floor(Math.random() * (scaledMaxHP - scaledMinHP + 1)) + scaledMinHP;

  return {
    ...enemyData,
    currentHP: hp,
    minDamage: scaledMinDamage,
    maxDamage: scaledMaxDamage,
  };
}
