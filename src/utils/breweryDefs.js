// ── Brewery & Farm Definitions ─────────────────────────────────────────────

export const GROW_CLICKS = 24; // clicks for any ingredient to fully grow

// 15 ingredients: Common (5g), Uncommon (10g), Rare (20g)
export const INGREDIENTS = {
  hops:        { name: "Hops",        tier: "common",   cost: 5,  tag: "bitter",  descriptor: "Hopped",      hpMod:  2, sellMod:  1, bottleMod: -1, yieldMin: 2, yieldMax: 3 },
  ginger:      { name: "Ginger",      tier: "common",   cost: 5,  tag: "spicy",   descriptor: "Ginger",      hpMod:  3, sellMod:  1, bottleMod:  0, yieldMin: 2, yieldMax: 3 },
  rye:         { name: "Rye",         tier: "common",   cost: 5,  tag: "grain",   descriptor: "Rye",         hpMod:  3, sellMod:  1, bottleMod:  0, yieldMin: 2, yieldMax: 3 },
  nettles:     { name: "Nettles",     tier: "common",   cost: 5,  tag: "herbal",  descriptor: "Nettle",      hpMod:  3, sellMod:  1, bottleMod:  2, yieldMin: 2, yieldMax: 3 },
  meadowsweet: { name: "Meadowsweet", tier: "common",   cost: 5,  tag: "floral",  descriptor: "Meadow",      hpMod:  3, sellMod:  3, bottleMod:  0, yieldMin: 2, yieldMax: 3 },
  charcoal:    { name: "Charcoal",    tier: "common",   cost: 5,  tag: "smoky",   descriptor: "Charcoal",    hpMod:  2, sellMod:  1, bottleMod:  0, yieldMin: 2, yieldMax: 3 },
  honey:       { name: "Honey",       tier: "uncommon", cost: 10, tag: "sweet",   descriptor: "Honey",       hpMod:  5, sellMod:  2, bottleMod:  0, yieldMin: 3, yieldMax: 4 },
  elderflower: { name: "Elderflower", tier: "uncommon", cost: 10, tag: "floral",  descriptor: "Elderflower", hpMod:  2, sellMod:  3, bottleMod:  1, yieldMin: 3, yieldMax: 4 },
  blackberry:  { name: "Blackberry",  tier: "uncommon", cost: 10, tag: "fruity",  descriptor: "Blackberry",  hpMod:  4, sellMod:  2, bottleMod:  1, yieldMin: 3, yieldMax: 4 },
  juniper:     { name: "Juniper",     tier: "uncommon", cost: 10, tag: "bitter",  descriptor: "Juniper",     hpMod:  1, sellMod:  2, bottleMod:  0, yieldMin: 3, yieldMax: 4 },
  chestnuts:   { name: "Chestnuts",   tier: "uncommon", cost: 10, tag: "nutty",   descriptor: "Chestnut",    hpMod:  2, sellMod:  2, bottleMod:  0, yieldMin: 3, yieldMax: 4 },
  vanilla:     { name: "Vanilla",     tier: "rare",     cost: 20, tag: "sweet",   descriptor: "Vanilla",     hpMod:  4, sellMod:  3, bottleMod:  0, yieldMin: 3, yieldMax: 4 },
  wild_yeast:  { name: "Wild Yeast",  tier: "rare",     cost: 20, tag: "wild",    descriptor: "Wild",        hpMod:  1, sellMod:  1, bottleMod:  3, yieldMin: 3, yieldMax: 4 },
  oak_chips:   { name: "Oak Chips",   tier: "rare",     cost: 20, tag: "oaky",    descriptor: "Oak",         hpMod:  1, sellMod:  2, bottleMod: -1, yieldMin: 3, yieldMax: 4 },
  pine_resin:  { name: "Pine Resin",  tier: "rare",     cost: 20, tag: "piney",   descriptor: "Pine",        hpMod:  1, sellMod:  1, bottleMod: -1, yieldMin: 3, yieldMax: 4 },
};

// 5 bases (purchased with gold, no inventory slot needed)
export const BASES = {
  pale_ale: { name: "Pale Ale", cost: 15, bottles: 8,  baseHP: 20, baseSell: 8  },
  wheat:    { name: "Wheat",    cost: 12, bottles: 10, baseHP: 18, baseSell: 7  },
  stout:    { name: "Stout",    cost: 20, bottles: 7,  baseHP: 25, baseSell: 10 },
  ipa:      { name: "IPA",      cost: 18, bottles: 8,  baseHP: 22, baseSell: 9  },
  sour:     { name: "Sour",     cost: 22, bottles: 7,  baseHP: 20, baseSell: 11 },
};

// Quality zones based on click-delta since brew started
export const QUALITY_ZONES = [
  { label: "Too Early",      min: 0,   max: 23,       canBottle: false, bottleMod:  0, hpMod:   0, sellMod:  0, isSwill: false },
  { label: "Rough",          min: 24,  max: 35,       canBottle: true,  bottleMod: -2, hpMod:  -5, sellMod: -3, isSwill: false },
  { label: "Decent",         min: 36,  max: 45,       canBottle: true,  bottleMod: -1, hpMod:   0, sellMod: -1, isSwill: false },
  { label: "Perfect",        min: 46,  max: 55,       canBottle: true,  bottleMod:  0, hpMod:   5, sellMod:  3, isSwill: false },
  { label: "Over-Fermented", min: 56,  max: 65,       canBottle: true,  bottleMod: -1, hpMod:  -3, sellMod: -2, isSwill: false },
  { label: "Swill",          min: 66,  max: Infinity, canBottle: true,  bottleMod: -4, hpMod: -15, sellMod: -5, isSwill: true  },
];

export function getQualityZone(clickDelta) {
  return QUALITY_ZONES.find(z => clickDelta >= z.min && clickDelta <= z.max)
    ?? QUALITY_ZONES[QUALITY_ZONES.length - 1];
}

// Synergy rules (tag-pair → bonus)
export const SYNERGY_RULES = [
  { tags: ["bitter", "bitter"],  name: "Double Bitter",    sellMod: 5, hpMod: 3, bottleMod: 0 },
  { tags: ["sweet",  "sweet"],   name: "Candied",          sellMod: 4, hpMod: 5, bottleMod: 0 },
  { tags: ["floral", "floral"],  name: "Bloom",            sellMod: 6, hpMod: 2, bottleMod: 0 },
  { tags: ["bitter", "sweet"],   name: "Balanced",         sellMod: 2, hpMod: 3, bottleMod: 0 },
  { tags: ["spicy",  "bitter"],  name: "Fire & Brimstone", sellMod: 3, hpMod: 4, bottleMod: 0 },
  { tags: ["fruity", "sweet"],   name: "Orchard",          sellMod: 4, hpMod: 5, bottleMod: 0 },
  { tags: ["smoky",  "oaky"],    name: "Barrel Smoked",    sellMod: 5, hpMod: 2, bottleMod: 1 },
  { tags: ["herbal", "floral"],  name: "Garden Brew",      sellMod: 4, hpMod: 3, bottleMod: 0 },
  { tags: ["grain",  "grain"],   name: "Double Grain",     sellMod: 2, hpMod: 0, bottleMod: 1 },
  { tags: ["oaky",   "sweet"],   name: "Vanilla Oak",      sellMod: 6, hpMod: 1, bottleMod: 0 },
  { tags: ["piney",  "bitter"],  name: "Forest Floor",     sellMod: 3, hpMod: 2, bottleMod: 0 },
  { tags: ["nutty",  "grain"],   name: "Harvest",          sellMod: 3, hpMod: 2, bottleMod: 1 },
];

// Wild synergy fires when either adjunct is "wild"
export const WILD_SYNERGY = { name: "Wild-Fermented", sellMod: -2, hpMod: 6, bottleMod: 0 };

export function findSynergy(adj1Key, adj2Key) {
  if (!adj1Key || !adj2Key) return null;
  const tag1 = INGREDIENTS[adj1Key]?.tag;
  const tag2 = INGREDIENTS[adj2Key]?.tag;
  if (!tag1 || !tag2) return null;
  if (tag1 === "wild" || tag2 === "wild") return WILD_SYNERGY;
  for (const rule of SYNERGY_RULES) {
    const [rt1, rt2] = rule.tags;
    if ((tag1 === rt1 && tag2 === rt2) || (tag1 === rt2 && tag2 === rt1)) return rule;
  }
  return null;
}

/**
 * Build the full beer name from brew parameters.
 * Format: "{PlayerName}'s {Quality} {Synergy} {Adj1} {Adj2} {Base}"
 */
export function generateBeerName(playerName, qualityLabel, synergy, adj1Key, adj2Key, baseName) {
  const parts = [];
  if (playerName) parts.push(`${playerName}'s`);
  parts.push(qualityLabel);
  if (synergy) parts.push(synergy.name);
  if (adj1Key) { const d = INGREDIENTS[adj1Key]?.descriptor; if (d) parts.push(d); }
  if (adj2Key) { const d = INGREDIENTS[adj2Key]?.descriptor; if (d) parts.push(d); }
  parts.push(baseName);
  return parts.filter(Boolean).join(" ");
}

/**
 * Calculate the brew result: bottle count, HP per bottle, sell price.
 * Returns { bottles, hp, sell, zone, synergy, poisonClicks }
 */
export function calculateBrewResult(baseKey, adj1Key, adj2Key, clickDelta) {
  const base = BASES[baseKey];
  if (!base) return null;
  const adj1 = adj1Key ? INGREDIENTS[adj1Key] : null;
  const adj2 = adj2Key ? INGREDIENTS[adj2Key] : null;
  const zone = getQualityZone(clickDelta);
  const synergy = findSynergy(adj1Key, adj2Key);

  let bottles = base.bottles + zone.bottleMod;
  let hp      = base.baseHP  + zone.hpMod;
  let sell    = base.baseSell + zone.sellMod;

  if (adj1) { hp += adj1.hpMod; sell += adj1.sellMod; bottles += adj1.bottleMod; }
  if (adj2) { hp += adj2.hpMod; sell += adj2.sellMod; bottles += adj2.bottleMod; }
  if (synergy) { hp += synergy.hpMod; sell += synergy.sellMod; bottles += synergy.bottleMod; }

  let poisonClicks = 0;
  if (zone.isSwill) {
    bottles = 2;
    hp = Math.max(1, Math.min(5, hp));
    const over = Math.max(0, clickDelta - 66);
    poisonClicks = Math.min(10, 3 + Math.floor(over / 5));
  }

  return {
    bottles:      Math.max(1, bottles),
    hp:           Math.max(1, hp),
    sell:         Math.max(1, sell),
    zone,
    synergy,
    poisonClicks,
  };
}

/** Default brewery state for a new settlement. */
export function defaultBreweryState() {
  return {
    farmSlots:      Array(9).fill(null).map(() => ({ ingredient: null, plantedAt: null })),
    activeBrew:     null,
    harvestedStock: {},
    bottledStock:   [],
    tavernStock:    [],
  };
}
