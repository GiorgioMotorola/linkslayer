// src/utils/miniBossGenerator.js

// Defines the types of mini-bosses available, with their base stats.
// These are adapted from your provided BOSS_TYPES to be suitable for mini-boss encounters.
const MINI_BOSS_TYPES = [
  {
    type: "Dragon Whelp",
    hp: 70,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Lich Apprentice",
    hp: 65,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Young Vampire",
    hp: 60,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Giant Spider",
    hp: 50,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Baby Kraken",
    hp: 80,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Lesser Elder Brain",
    hp: 70,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Imp",
    hp: 40,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Flaming Skull",
    hp: 45,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Mind Flayer Spawn",
    hp: 60,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Dire Wolf",
    hp: 55,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Wailing Ghost",
    hp: 50,
    minDamage: 5,
    maxDamage: 9,
  },
];

/**
 * Generates a random mini-boss from the predefined MINI_BOSS_TYPES.
 * Each mini-boss includes an ID, name, current and max HP, damage range,
 * defense, and rewards (XP and gold).
 * @returns {object | null} A mini-boss object, or null if no mini-boss types are defined.
 */
export function generateMiniBoss() {
  // Check if there are any mini-boss types defined to prevent errors.
  if (!MINI_BOSS_TYPES || MINI_BOSS_TYPES.length === 0) {
    console.warn("No mini-boss data available in MINI_BOSS_TYPES.");
    return null;
  }

  // Select a random mini-boss type from the array.
  const randomIndex = Math.floor(Math.random() * MINI_BOSS_TYPES.length);
  const miniBossData = MINI_BOSS_TYPES[randomIndex];

  // Construct and return the mini-boss object.
  // Properties like 'defense', 'xpReward', and 'goldReward' are given default
  // values of 0 if they are not explicitly defined in the MINI_BOSS_TYPES entry,
  // ensuring the object is complete for combat calculations.
  return {
    id: miniBossData.type.toLowerCase().replace(/\s/g, '_'), // Generate a unique ID from the type name
    name: miniBossData.type,
    currentHP: miniBossData.hp,
    maxHP: miniBossData.hp,
    minDamage: miniBossData.minDamage,
    maxDamage: miniBossData.maxDamage,
    defense: miniBossData.defense || 0,
    xpReward: miniBossData.xpReward || 0,
    goldReward: miniBossData.goldReward || 0,
    // Abilities are not included in this structure, as per the user's provided base.
    // They can be added here if specific mini-boss abilities are desired in the future.
  };
}
