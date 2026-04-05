export const WARRIOR_TIERS = {
  recruit: {
    key: "recruit",
    label: "Recruit",
    clickCost: 48,
    goldCost: 0,
    maxHP: 25,
    damageMin: 3,
    damageMax: 6,
  },
  footsoldier: {
    key: "footsoldier",
    label: "Footsoldier",
    clickCost: 96,
    goldCost: 10,
    maxHP: 45,
    damageMin: 6,
    damageMax: 10,
  },
  veteran: {
    key: "veteran",
    label: "Veteran",
    clickCost: 192,
    goldCost: 25,
    maxHP: 70,
    damageMin: 10,
    damageMax: 16,
  },
};

export const WARRIOR_SPECS = {
  assassin: {
    label: "Assassin",
    icon: "ra-plain-dagger",
    description: "Targets the lowest HP enemy. Hits for 1.5× damage.",
    category: "Offensive",
  },
  hexblade: {
    label: "Hexblade",
    icon: "ra-crystal-wand",
    description: "35% chance to inflict a random status effect on each hit.",
    category: "Offensive",
  },
  destroyer: {
    label: "Destroyer",
    icon: "ra-axe",
    description: "Winds up every other turn. Hits for 2× damage when it strikes.",
    category: "Offensive",
  },
  duelist: {
    label: "Duelist",
    icon: "ra-crossed-swords",
    description: "Gains +1 damage for each time the player has been hit this combat.",
    category: "Offensive",
  },
  sentinel: {
    label: "Sentinel",
    icon: "ra-shield",
    description: "25% chance to step in front of an attack, taking the hit instead of you.",
    category: "Defensive",
  },
  iron_monk: {
    label: "Iron Monk",
    icon: "ra-muscle-up",
    description: "Reduces all incoming damage to you by 2.",
    category: "Defensive",
  },
  bulwark: {
    label: "Bulwark",
    icon: "ra-round-shield",
    description: "Digs in over time — gains +1 damage reduction per combat round (max 5).",
    category: "Defensive",
  },
  scout: {
    label: "Scout",
    icon: "ra-eye",
    description: "Adds +3 to your flee roll. Reveals enemy attack damage at combat start.",
    category: "Utility",
  },
  scavenger: {
    label: "Scavenger",
    icon: "ra-gold-bar",
    description: "25% chance to find 3 extra gold after each combat win.",
    category: "Utility",
  },
  apothecary: {
    label: "Apothecary",
    icon: "ra-flask",
    description: "Doesn't fight — heals you for 3–5 HP each combat round.",
    category: "Utility",
  },
  tactician: {
    label: "Tactician",
    icon: "ra-scroll-unfurled",
    description: "All allies deal +2 damage while Tactician is alive.",
    category: "Utility",
  },
  beastmaster: {
    label: "Beastmaster",
    icon: "ra-wolf-head",
    description: "Unleashes a wild beast that deals 1–20 unpredictable damage.",
    category: "Wild Card",
  },
  cursed_knight: {
    label: "Cursed Knight",
    icon: "ra-knight-helmet",
    description: "Hits hard (1.5× damage) but their curse deals 2 recoil damage to you per hit.",
    category: "Wild Card",
  },
  trickster: {
    label: "Trickster",
    icon: "ra-perspective-dice-random",
    description: "Applies a random enemy debuff (confuse, steal, enrage) on each hit.",
    category: "Wild Card",
  },
};

export const SPEC_CATEGORIES = ["Offensive", "Defensive", "Utility", "Wild Card"];

export const MAX_WARRIORS = 3;
export const MAX_TRAINING_SLOTS = 3;

export function defaultBarracksData() {
  return {
    trainingSlots: [
      { spec: null, tier: null, startedAt: null },
      { spec: null, tier: null, startedAt: null },
      { spec: null, tier: null, startedAt: null },
    ],
  };
}

/** Returns a warrior object ready to be pushed into the warriors ref */
export function buildWarrior(spec, tier) {
  const tierDef = WARRIOR_TIERS[tier];
  const specDef = WARRIOR_SPECS[spec];
  return {
    id: `${spec}_${tier}_${Date.now()}`,
    label: `${specDef.label}`,
    tier,
    spec,
    currentHP: tierDef.maxHP,
    maxHP: tierDef.maxHP,
    damageMin: tierDef.damageMin,
    damageMax: tierDef.damageMax,
    // volatile combat state — reset each new combat
    windingUp: false,
    hitsPlayerReceivedInCombat: 0,
    roundsInCombat: 0,
    rollDisplay: null,
    leaving: false,
  };
}
