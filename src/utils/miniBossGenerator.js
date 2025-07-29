// src/utils/miniBossGenerator.js

export const MINI_BOSS_TYPES = [
  {
    type: "Dragon Whelp",
    hp: 65,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 20,
    weaponReward: 1,
    defenseReward: 0,
  },
  {
    type: "Lich Apprentice",
    hp: 65,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 25,
    weaponReward: 0,
    defenseReward: 1,
  },
  {
    type: "Young Vampire",
    hp: 60,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 20,
    weaponReward: 1,
    defenseReward: 1,
  },
  {
    type: "Giant Spider",
    hp: 50,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 15,
    weaponReward: 0,
    defenseReward: 0,
  },
  {
    type: "Baby Kraken",
    hp: 65,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 30,
    weaponReward: 1,
    defenseReward: 0,
  },
  {
    type: "Lesser Elder Brain",
    hp: 65,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 35,
    weaponReward: 0,
    defenseReward: 1,
  },
  {
    type: "Imp",
    hp: 40,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 10,
    weaponReward: 0,
    defenseReward: 0,
  },
  {
    type: "Flaming Skull",
    hp: 45,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 12,
    weaponReward: 0,
    defenseReward: 0,
  },
  {
    type: "Mind Flayer Spawn",
    hp: 60,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 50,
    weaponReward: 1,
    defenseReward: 1,
  },
  {
    type: "Dire Wolf",
    hp: 55,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 18,
    weaponReward: 0,
    defenseReward: 0,
  },
  {
    type: "Wailing Ghost",
    hp: 50,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 16,
    weaponReward: 0,
    defenseReward: 0,
  },
  {
    type: "Hulking Brute",
    hp: 70,
    minDamage: 6,
    maxDamage: 10,
    goldReward: 80,
    weaponReward: 1,
    defenseReward: 1,
  },
  {
    type: "Bandit Camp",
    hp: 120,
    minDamage: 8,
    maxDamage: 12,
    goldReward: 100,
    weaponReward: 2,
    defenseReward: 2,
  },
  {
    type: "Bog Hag (Wearing the skin of the Wizard)",
    hp: 80,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 70,
    weaponReward: 1,
    defenseReward: 0,
  },
  {
    type: "Bobby Lasagna's Hut",
    hp: 80,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 70,
    weaponReward: 1,
    defenseReward: 0,
  },
  {
    type: "Bobby Lasagna",
    hp: 150,
    minDamage: 12,
    maxDamage: 18,
    goldReward: 140,
    weaponReward: 1,
    defenseReward: 2,
  },
    {
    type: "Grotto Banshee",
    hp: 80,
    minDamage: 6,
    maxDamage: 12,
    goldReward: 0,
    weaponReward: 1,
    defenseReward: 0,
  },
];

export function generateMiniBoss(specificType) {
  if (!specificType) {
    throw new Error(
      "generateMiniBoss: A specificType must be provided for mini-boss generation."
    );
  }

  const miniBossData = MINI_BOSS_TYPES.find(
    (boss) => boss.type === specificType
  );

  if (!miniBossData) {
    throw new Error(
      `Mini-boss type "${specificType}" not found in MINI_BOSS_TYPES. Please check your encounter JSON and miniBossGenerator.js.`
    );
  }

  return {
    id: miniBossData.type.toLowerCase().replace(/\s/g, "_"),
    name: miniBossData.type,
    currentHP: miniBossData.hp,
    maxHP: miniBossData.hp,
    minDamage: miniBossData.minDamage,
    maxDamage: miniBossData.maxDamage,
    goldReward: miniBossData.goldReward || 0,
    weaponReward: miniBossData.weaponReward || 0,
    defenseReward: miniBossData.defenseReward || 0,
    isMiniBoss: true,
  };
}
