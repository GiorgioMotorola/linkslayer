export const classes = {
  Fighter: {
    name: "Fighter",
    maxHP: 650,
    special: "Power Strike",
    description:
      "65 HP. Class Ability(Power Strike) deals 8 damage. Starts with +1 Weapon Damage.",
    specialTiers: [
      { name: "Power Strike", description: "Deals 8 damage." },
      { name: "Cleave", description: "Deals 12 damage and applies 1 turn of bleed." },
      { name: "Warlord's Strike", description: "Deals 18 damage and stuns the enemy." },
    ],
    specialEffect: (enemyHP) => enemyHP - 8,
    startingWeaponBonus: 100,
    startingSpecialUses: 0,
    startingShieldBonus: 100,
    startingHealthPotionBonus: 0,
    startingInvisibilityCloaks: 0,
    startingPlayerGold: 1000,
  },
  Paladin: {
    name: "Paladin",
    maxHP: 60,
    special: "Smite",
    description:
      "60 HP. Class Ability(Smite) deals 5 damage and gives +3 HP to player. Starts with +1 Defense Bonus",
    specialTiers: [
      { name: "Smite", description: "Deals 5 damage and heals 3 HP." },
      { name: "Holy Smite", description: "Deals 8 damage and heals 7 HP." },
      { name: "Divine Judgement", description: "Deals 12 damage and fully restores your HP." },
    ],
    specialEffect: (enemyHP, playerHP, maxHP) => {
      const healAmount = 3;
      return {
        enemyHP: enemyHP - 5,
        playerHP: Math.min(playerHP + healAmount, maxHP),
      };
    },
    startingWeaponBonus: 0,
    startingSpecialUses: 0,
    startingShieldBonus: 1,
    startingHealthPotionBonus: 0,
    startingInvisibilityCloaks: 0,
    startingPlayerGold: 0,
  },
  Wizard: {
    name: "Wizard",
    maxHP: 50,
    special: "Fireball",
    description:
      "50 HP. Class Ability(Fireball) deals between 5 and 15 damage with a 30% chance to stun the enemy. Starts with +2 Class Ability charges.",
    specialTiers: [
      { name: "Fireball", description: "Deals 5–15 damage with 30% stun chance." },
      { name: "Chain Lightning", description: "Deals 8–18 damage with 50% stun chance." },
      { name: "Arcane Overload", description: "Deals 15–25 damage with guaranteed stun." },
    ],
    specialEffect: (enemyHP, playerHP) => {
      const wizardDamage = Math.floor(Math.random() * 11) + 5;
      const stunned = Math.random() < 0.3;
      return {
        enemyHP: enemyHP - wizardDamage,
        playerHP: playerHP - 0,
        wizardDamage,
        stunned,
      };
    },
    startingWeaponBonus: 0,
    startingSpecialUses: 2,
    startingShieldBonus: 0,
    startingHealthPotionBonus: 0,
    startingInvisibilityCloaks: 0,
    startingPlayerGold: 0,
  },
  Rogue: {
    name: "Rogue",
    maxHP: 55,
    special: "Sneak Attack",
    description:
      "55 HP. Class Ability(Sneak Attack) deals 6 damage and evades the incoming enemy strike. Starts with 50 Gold.",
    specialTiers: [
      { name: "Sneak Attack", description: "Deals 6 damage and evades the enemy's strike." },
      { name: "Ambush", description: "Deals 10 damage and evades the enemy's strike." },
      { name: "Shadow Strike", description: "Deals 15 damage, evades, and applies 2 turns of bleed." },
    ],
    specialEffect: (enemyHP) => {
      const rogueDamage = 6;
      return {
        enemyHP: enemyHP - rogueDamage,
        rogueDamage,
      };
    },
    startingWeaponBonus: 0,
    startingSpecialUses: 0,
    startingShieldBonus: 0,
    startingHealthPotionBonus: 0,
    startingInvisibilityCloaks: 0,
    startingPlayerGold: 50,
  },
  Mundane: {
    name: "Mundane",
    maxHP: 45,
    special: "Rock Throw",
    description:
      "45 HP. Class Ability(Rock Throw) hurls a rock for 5 damage. No starting bonuses. Hard mode.",
    specialTiers: [
      { name: "Rock Throw", description: "Hurls a rock for 5 damage." },
      { name: "Resilience", description: "Block the enemy's next strike entirely." },
      { name: "Grit Surge", description: "Deals damage equal to your missing HP + 5. The lower your HP, the harder you hit." },
    ],
    specialEffect: (enemyHP) => enemyHP - 5,
    startingWeaponBonus: 0,
    startingSpecialUses: 0,
    startingShieldBonus: 0,
    startingHealthPotionBonus: 0,
    startingInvisibilityCloaks: 0,
    startingPlayerGold: 0,
  },
};
