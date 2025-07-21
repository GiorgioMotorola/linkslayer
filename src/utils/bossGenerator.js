// utils/bossGenerator.js

const BOSS_TYPES = [
  {
    type: "Dragon",
    hp: 100,
    minDamage: 5,
    maxDamage: 12,
  },
  {
    type: "Lich",
    hp: 100,
    minDamage: 6,
    maxDamage: 13,
  },
  {
    type: "Vampire",
    hp: 100,
    minDamage: 6,
    maxDamage: 12,
  },
  {
    type: "Giant",
    hp: 100,
    minDamage: 6,
    maxDamage: 12,
  },
  {
    type: "Kraken",
    hp: 100,
    minDamage: 7,
    maxDamage: 12,
  },
  {
    type: "Elder Brain",
    hp: 100,
    minDamage: 5,
    maxDamage: 12,
  },
  {
    type: "Barbed Devil",
    hp: 100,
    minDamage: 5,
    maxDamage: 10,
  },
  {
    type: "Flameskull",
    hp: 100,
    minDamage: 5,
    maxDamage: 9,
  },
  {
    type: "Illithid",
    hp: 100,
    minDamage: 5,
    maxDamage: 12,
  },
  {
    type: "Werewolf",
    hp: 100,
    minDamage: 6,
    maxDamage: 11,
  },
  {
    type: "Banshee",
    hp: 100,
    minDamage: 5,
    maxDamage: 10,
  },
];

export function getRandomBoss() {
  const bossData = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];

  return {
    ...bossData,
    name: `💀 ${bossData.type}`,
    isBoss: true,
    message: `A towering ${bossData.type} blocks your path to ultimate knowledge. Time to roll some true damage.`,
  };
}

export function isBoss(enemyOrName) {
  const name =
    typeof enemyOrName === "string" ? enemyOrName : enemyOrName?.name ?? "";

  return BOSS_TYPES.some((boss) => name.includes(boss.type));
}
