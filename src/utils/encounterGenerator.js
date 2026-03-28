import { ENEMY_TYPES } from "@/utils/enemies";

const npcModules = import.meta.glob("@/assets/data/encounters/friendly/*.yaml", { eager: true });
export const npcData = Object.values(npcModules).flatMap((m) => m.default);

// For NPCs with sequential IDs (e.g. npc_pell_001, npc_pell_002), only expose
// the next unseen entry in the series. Standalone NPCs are included if unseen.
const SERIES_RE = /^(.+)_(\d+)$/;
export function getAvailableNPCs(allNpcs, seenIds) {
  const seriesMap = {};
  const standalone = [];
  for (const npc of allNpcs) {
    const m = npc.id.match(SERIES_RE);
    if (m) {
      (seriesMap[m[1]] ??= []).push(npc);
    } else {
      standalone.push(npc);
    }
  }
  const available = standalone.filter((npc) => !seenIds.includes(npc.id));
  for (const entries of Object.values(seriesMap)) {
    entries.sort((a, b) => {
      const na = parseInt(a.id.match(/(\d+)$/)[1]);
      const nb = parseInt(b.id.match(/(\d+)$/)[1]);
      return na - nb;
    });
    const next = entries.find((npc) => !seenIds.includes(npc.id));
    if (next) available.push(next);
  }
  return available;
}

const loreModules = import.meta.glob("@/assets/data/encounters/lore/*.yaml", { eager: true });
export const loreData = Object.values(loreModules).flatMap((m) => m.default);

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
  const enemies = generateEnemyGroup(difficultyLevel);
  return {
    type: "combat",
    enemies,
    targetIndex: 0,
    enemy: enemies[0],
  };
}

export function generateEnemyGroup(difficultyLevel = 0) {
  const count = Math.floor(Math.random() * 5) + 1;
  const enemyData = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
  return Array.from({ length: count }, () => generateEnemy(difficultyLevel, enemyData));
}

export function generateEnemy(difficultyLevel = 0, enemyData = null) {
  if (!enemyData) enemyData = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];

  const scaledMinHP = enemyData.minHP + 2 * difficultyLevel;
  const scaledMaxHP = enemyData.maxHP + 2 * difficultyLevel;

  const scaledMinDamage = enemyData.minDamage + 2 * difficultyLevel;
  const scaledMaxDamage = enemyData.maxDamage + 2 * difficultyLevel;

  const hp =
    Math.floor(Math.random() * (scaledMaxHP - scaledMinHP + 1)) + scaledMinHP;

  return {
    ...enemyData,
    currentHP: hp,
    maxHP: hp,
    minDamage: scaledMinDamage,
    maxDamage: scaledMaxDamage,
  };
}
