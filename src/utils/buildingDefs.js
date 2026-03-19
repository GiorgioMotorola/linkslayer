// ── Terrain tile emojis ────────────────────────────────────────────────────
export const TERRAIN_EMOJIS = {
  grass:              "🟩",
  river:              "🟦",
  rock:               "🪨",
  tree:               "🌲",
  wheatfield:         "🌾",
  white_flower:       "🌸",
  yellow_white_flower:"🌸",
  pink_flower:        "🌸",
  farm:               "🌾",
  well:               "🪣",
  dock:               "⚓",
};

// ── Building definitions ───────────────────────────────────────────────────
// yieldType: 'gold' | 'scrap' | 'healthPotion' | null
// yieldAmount: how much per yieldEvery clicks
// constraint: function(x, y, grid, buildings) → bool — true if placement is valid
// category: 'terrain' | 'structure'

// ── Terrain paint tools (modify terrain array, cost 0) ────────────────────
export const TERRAIN_PAINTS = {
  paint_grass:        { name: "Grass",        cost: 0, description: "It's Grass.",              paintsTerrain: "grass"        },
  paint_river:        { name: "Water",        cost: 0, description: "It's Water.",              paintsTerrain: "river"        },
  paint_rock:         { name: "Rock",         cost: 0, description: "It's a Rock.",               paintsTerrain: "rock"         },
  paint_tree:         { name: "Tree",         cost: 0, description: "It's a Tree.",               paintsTerrain: "tree"         },
  paint_wheatfield:   { name: "Wheatfield",   cost: 0, description: "It's Wheat.",         paintsTerrain: "wheatfield"   },
  paint_white_flower:        { name: "White Flower",       cost: 0, description: "It's a White Flower.",        paintsTerrain: "white_flower"        },
  paint_white_yellow_flower: { name: "Yellow/White Flower", cost: 0, description: "It's a Yellow/White Flower.", paintsTerrain: "yellow_white_flower" },
  pink_flower:               { name: "Pink Flower",         cost: 0, description: "It's a Pink Flower.",         paintsTerrain: "pink_flower"         },
  paint_farm:                { name: "Farm",                cost: 0, description: "Crop fields.",                 paintsTerrain: "farm"                },
  paint_well:                { name: "Well",                cost: 0, description: "A stone well.",               paintsTerrain: "well"                },
  paint_dock:                { name: "Dock",                cost: 0, description: "A dock. Place on water.",      paintsTerrain: "dock"                },
};

export const BUILDING_DEFS = {
  road: {
    name: "Road",
    emoji: "🟫",
    cost: 1,
    description: "A dirt road. Purely cosmetic.",
    category: "terrain",
    yieldType: null,
  },
  fence: {
    name: "Fence",
    emoji: "🪵",
    cost: 2,
    description: "A wooden fence. Purely cosmetic.",
    category: "terrain",
    yieldType: null,
  },
  bridge: {
    name: "Bridge",
    emoji: "🌉",
    cost: 5,
    description: "Must be placed on a river tile. Allows building over water.",
    category: "terrain",
    yieldType: null,
    requiresTerrain: "river",
  },
  general_store: {
    name: "General Store",
    emoji: "🏪",
    cost: 35,
    description: "Earns 1g per click. Limit: 1 per 3 houses.",
    category: "structure",
    yieldType: "gold",
    yieldAmount: 1,
    yieldEvery: 1,
    maxPerHouses: 3,
  },
  smithy: {
    name: "Smithy",
    emoji: "⚒️",
    cost: 50,
    description: "Earns 1g per click. Produces 3 Scrap Metal per 25 clicks. Limit: 1 per 3 houses.",
    category: "structure",
    yieldType: "gold",
    yieldAmount: 1,
    yieldEvery: 1,
    bonusYieldType: "scrap",
    bonusYieldAmount: 3,
    bonusYieldEvery: 25,
    maxPerHouses: 3,
  },
  church: {
    name: "Church",
    emoji: "⛪",
    cost: 60,
    description: "Attracts +1 villager to the attractive scale. Limit: 1 per 3 houses.",
    category: "structure",
    yieldType: null,
    attractionBonus: 1,
    maxPerHouses: 3,
  },
  house: {
    name: "House",
    emoji: "🏠",
    cost: 25,
    description: "Houses 5 villagers. Every 3 houses earns 1g per click.",
    category: "structure",
    yieldType: null,
    villagersPerBuilding: 5,
  },
  apothecary: {
    name: "Apothecary",
    emoji: "⚗️",
    cost: 75,
    description: "Produces 1 Health Potion per 20 clicks. Limit: 1 per 3 houses.",
    category: "structure",
    yieldType: "healthPotion",
    yieldAmount: 1,
    yieldEvery: 20,
    maxPerHouses: 3,
  },
  horse_stable: {
    name: "Stable",
    emoji: "🐎",
    cost: 100,
    description: "Earns 2g per click. Limit: 1 per 3 houses.",
    category: "structure",
    yieldType: "gold",
    yieldAmount: 2,
    yieldEvery: 1,
    maxPerHouses: 3,
  },
  castle: {
    name: "Castle",
    emoji: "🏰",
    cost: 200,
    description: "Earns 3g per click. Grants access to a short rest and the Forge while visiting.",
    category: "structure",
    yieldType: "gold",
    yieldAmount: 3,
    yieldEvery: 2,
    grantsShortRest: true,
    grantsForge: true,
    maxPerMap: 1,
  },
  tavern: {
    name: "Tavern",
    emoji: "🍺",
    cost: 60,
    description: "Earns 1g per click. Limit: 1 per 3 houses.",
    category: "structure",
    yieldType: "gold",
    yieldAmount: 1,
    yieldEvery: 1,
    maxPerHouses: 3,
  },
};

// ── Economy helpers ────────────────────────────────────────────────────────

/**
 * Returns the emoji to render for a given cell.
 * Buildings take precedence over terrain.
 */
export function cellEmoji(tileType, building) {
  if (building) return BUILDING_DEFS[building.type]?.emoji ?? "❓";
  return TERRAIN_EMOJIS[tileType] ?? "🟩";
}

/**
 * Compute resources accumulated since last visit.
 * Returns { gold, scrap, healthPotions }
 */
export function computeYield(buildings, terrain, clicksSince) {
  if (!clicksSince || clicksSince <= 0) return { gold: 0, scrap: 0, healthPotions: 0 };

  let gold = 0;
  let scrap = 0;
  let healthPotions = 0;

  const villagers = buildings
    .filter(b => b.type === "house")
    .length * (BUILDING_DEFS.house.villagersPerBuilding ?? 5);
  const houseGoldPerClick = Math.floor(villagers / 15);

  for (const building of buildings) {
    const def = BUILDING_DEFS[building.type];
    if (!def) continue;

    // Primary yield
    if (def.yieldType === "gold" && def.yieldEvery) {
      gold += Math.floor(clicksSince / def.yieldEvery) * def.yieldAmount;
    }
    if (def.yieldType === "healthPotion" && def.yieldEvery) {
      healthPotions += Math.floor(clicksSince / def.yieldEvery) * def.yieldAmount;
    }

    // Bonus yield (Smithy scrap)
    if (def.bonusYieldType === "scrap" && def.bonusYieldEvery) {
      scrap += Math.floor(clicksSince / def.bonusYieldEvery) * def.bonusYieldAmount;
    }
  }

  // House villager income
  if (houseGoldPerClick > 0) {
    gold += houseGoldPerClick * clicksSince;
  }

  return { gold, scrap, healthPotions };
}
