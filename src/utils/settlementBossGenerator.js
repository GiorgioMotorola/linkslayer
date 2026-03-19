/**
 * Settlement guardian bosses — spawned when a settlement is abandoned.
 * HP and damage scale with how many buildings the settlement had.
 */

export const SETTLEMENT_BOSS_DEFS = {
  ancient_dragon: {
    name: "Ancient Dragon",
    baseHP: 1,
    minBaseDamage: 1,
    maxBaseDamage: 1,
    goldReward: 200,
    scrapReward: 8,
  },
  gnoll_army: {
    name: "Gnoll Army",
    baseHP: 1,
    minBaseDamage: 1,
    maxBaseDamage: 1,
    goldReward: 120,
    scrapReward: 6,
  },
  oblex: {
    name: "Oblex",
    baseHP: 1,
    minBaseDamage: 1,
    maxBaseDamage: 1,
    goldReward: 80,
    scrapReward: 4,
  },
};

/**
 * Returns the boss key for a given settlement based on building count.
 * Ancient Dragon ≥ 15 buildings, Gnoll Army ≥ 8, Oblex otherwise.
 */
export function assignSettlementBossKey(buildings) {
  const count = buildings?.length ?? 0;
  if (count >= 15) return "ancient_dragon";
  if (count >= 8)  return "gnoll_army";
  return "oblex";
}

/**
 * Generates full combat stats for a settlement guardian.
 * Pass overrideKey to use the stored boss key from the DB instead of recalculating.
 * Output shape matches generateMiniBoss so the existing combat system can use it directly.
 */
export function generateSettlementBoss(buildings, overrideKey = null) {
  const count = buildings?.length ?? 0;
  const key   = overrideKey ?? assignSettlementBossKey(buildings);
  const def   = SETTLEMENT_BOSS_DEFS[key];

  const hp          = def.baseHP + count * 3;
  const dmgBonus    = Math.floor(count * 0.5);

  return {
    id:          key,
    name:        def.name,
    currentHP:   hp,
    maxHP:       hp,
    minDamage:   def.minBaseDamage + dmgBonus,
    maxDamage:   def.maxBaseDamage + dmgBonus,
    goldReward:  def.goldReward,
    scrapReward: def.scrapReward,
    isMiniBoss:  true,
  };
}
