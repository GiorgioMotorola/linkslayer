const MINI_BOSS_TYPES = [
  {
    type: "Dragon Whelp",
    hp: 65,
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
    hp: 65,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Lesser Elder Brain",
    hp: 65,
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

export function generateMiniBoss() {
  const randomIndex = Math.floor(Math.random() * MINI_BOSS_TYPES.length);
  const miniBossData = MINI_BOSS_TYPES[randomIndex];

  return {
    id: miniBossData.type.toLowerCase().replace(/\s/g, "_"),
    name: miniBossData.type,
    currentHP: miniBossData.hp,
    maxHP: miniBossData.hp,
    minDamage: miniBossData.minDamage,
    maxDamage: miniBossData.maxDamage,
    defense: miniBossData.defense || 0,
    xpReward: miniBossData.xpReward || 0,
    goldReward: miniBossData.goldReward || 0,
    isMiniBoss: true,
  };
}
