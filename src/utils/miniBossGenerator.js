export const MINI_BOSS_TYPES = [
  {
    type: "Dragon Whelp",
    hp: 65,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 20,
    scrapReward: 2,
  },
  {
    type: "Lich Apprentice",
    hp: 65,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 25,
    scrapReward: 2,
  },
  {
    type: "Young Vampire",
    hp: 60,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 20,
    scrapReward: 4,
  },
  {
    type: "Giant Spider",
    hp: 50,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 15,
    scrapReward: 0,
  },
  {
    type: "Baby Kraken",
    hp: 65,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 30,
    scrapReward: 2,
  },
  {
    type: "Lesser Elder Brain",
    hp: 65,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 35,
    scrapReward: 2,
  },
  {
    type: "Imp",
    hp: 40,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 10,
    scrapReward: 0,
  },
  {
    type: "Flaming Skull",
    hp: 45,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 12,
    scrapReward: 0,
  },
  {
    type: "Mind Flayer Spawn",
    hp: 60,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 50,
    scrapReward: 4,
  },
  {
    type: "Dire Wolf",
    hp: 55,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 18,
    scrapReward: 0,
  },
  {
    type: "Wailing Ghost",
    hp: 50,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 16,
    scrapReward: 0,
  },
  {
    type: "Hulking Brute",
    hp: 70,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 80,
    scrapReward: 4,
  },
  {
    type: "Bandit Camp",
    hp: 120,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 100,
    scrapReward: 8,
  },
  {
    type: "Bog Hag (Wearing the skin of the Wizard)",
    hp: 80,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 70,
    scrapReward: 2,
  },
  {
    type: "Bobby Lasagna's Hut",
    hp: 80,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 70,
    scrapReward: 2,
  },
  {
    type: "Bobby Lasagna",
    hp: 150,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 140,
    scrapReward: 6,
  },
  {
    type: "Grotto Banshee",
    hp: 80,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 0,
    scrapReward: 2,
  },
  {
    type: "Drunken Kidnappers",
    hp: 130,
    minDamage: 6,
    maxDamage: 9,
    goldReward: 150,
    scrapReward: 4,
  },
  {
    type: "Chef Robert, Retired Knights Gaurd and Hand of the King (Expert in Swordplay, has killed over 1000 Men and Beasts.)",
    hp: 180,
    minDamage: 5,
    maxDamage: 10,
    goldReward: 170,
    scrapReward: 4,
  },
  {
    type: "Brown Bear",
    hp: 100,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 50,
    scrapReward: 4,
  },
  {
    type: "Sentient Pile of Human Remains",
    hp: 150,
    minDamage: 8,
    maxDamage: 14,
    goldReward: 200,
    scrapReward: 10,
  },
  {
    type: "Talking Horse",
    hp: 90,
    minDamage: 5,
    maxDamage: 9,
    goldReward: 0,
    scrapReward: 4,
  },
];

export function generateMiniBoss(specificType, difficultyLevel = 0) {
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

  const scaledHP = miniBossData.hp + 3 * difficultyLevel;
  const scaledMinDamage = miniBossData.minDamage + 3 * difficultyLevel;
  const scaledMaxDamage = miniBossData.maxDamage + 3 * difficultyLevel;

  return {
    id: miniBossData.type.toLowerCase().replace(/\s/g, "_"),
    name: miniBossData.type,
    currentHP: scaledHP,
    maxHP: scaledHP,
    minDamage: scaledMinDamage,
    maxDamage: scaledMaxDamage,
    goldReward: miniBossData.goldReward || 0,
    scrapReward: miniBossData.scrapReward || 0,
    isMiniBoss: true,
  };
}
