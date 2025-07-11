const BOSS_TYPES = [
  "Dragon",
  "Lich",
  "Vampire",
  "Giant",
  "Kraken",
  "Elder Brain",
  "Barbed Devil",
  "Flameskull",
  "Illithid",
  "Werewolf",
  "Banshee",
];

const BOSS_HP = 50;

export function getRandomBoss() {
  const type = BOSS_TYPES[Math.floor(Math.random() * BOSS_TYPES.length)];
  return {
    type,
    name: `💀 ${type}`,
    hp: BOSS_HP,
    isBoss: true,
    message: `A towering ${type} blocks your path to ultimate knowledge. Time to roll some true damage.`,
  };
}

export function isBoss(enemyOrName) {
  const name =
    typeof enemyOrName === "string" ? enemyOrName : enemyOrName?.name ?? "";
  return BOSS_TYPES.some((type) => name.includes(type));
}
