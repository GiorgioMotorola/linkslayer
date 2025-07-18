// utils/classes.js
export const classes = {
  Fighter: {
    name: "Fighter",
    maxHP: 65,
    special: "Power Strike",
    description: "65 HP. Class Ability(Power Strike) deals 6 damage. Starts with +1 Weapon Damage.",
    specialEffect: (enemyHP) => enemyHP - 6,
    startingWeaponBonus: 1,
    startingSpecialUses: 0,
    startingShieldBonus: 0,
  },
  Paladin: {
    name: "Paladin",
    maxHP: 60,
    special: "Smite",
    description:
      "60 HP. Class Ability(Smite) deals 5 damage and gives +2 HP to player. Starts with +1 Defense Bonus",
    specialEffect: (enemyHP, playerHP, maxHP) => ({
      enemyHP: enemyHP - 5,
      playerHP: playerHP + 2,
    }),
    startingWeaponBonus: 0,
    startingSpecialUses: 0,
    startingShieldBonus: 1,
  },
  Wizard: {
    name: "Wizard",
    maxHP: 50,
    special: "Fireball",
    description:
      "50 HP. Class Ability(Fireball) deals between 5 and 15 damage with a 20% chance to stun the enemy. Starts with 6 Class Ability charges.",
    specialEffect: (enemyHP, playerHP) => {
      const wizardDamage = Math.floor(Math.random() * 11) + 5;
      const stunned = Math.random() < 0.2;
      return {
        enemyHP: enemyHP - wizardDamage,
        playerHP: playerHP - 0,
        wizardDamage,
        stunned,
      };
    },
    startingWeaponBonus: 0,
    startingSpecialUses: 1,
    startingShieldBonus: 0,
  },
  Rogue: {
    name: "Rogue",
    maxHP: 55,
    special: "Sneak Attack",
    description:
      "55 HP. Class Ability(Sneak Attack) deals 6 damage and evades the incoming enemy strike. Starts with 6 Class Ability charges.",
    specialEffect: (enemyHP) => {
      const rogueDamage = 6;
      return {
        enemyHP: enemyHP - rogueDamage,
        rogueDamage,
      };
    },
    startingWeaponBonus: 0,
    startingSpecialUses: 1,
    startingShieldBonus: 0,
  },
  Cleric: {
    name: "Cleric",
    maxHP: 60,
    special: "Divine Blessing",
    description: "60 HP. Class Ability(Divine Blessing) heals 5 HP and deals 6 damage.",
    specialEffect: (enemyHP, playerHP, maxHP) => ({
      enemyHP: enemyHP - 5,
      playerHP: playerHP + 5,
    }),
    startingWeaponBonus: 0,
    startingSpecialUses: 0,
    startingShieldBonus: 0,
  },
  Sorcerer: {
    name: "Sorcerer",
    maxHP: 50,
    special: "Chaos Surge",
    description:
      "50 HP. Class Ability(Chaos Surge) deals 12 damage, but takes random recoil damage to the player.",
    specialEffect: (enemyHP, playerHP) => {
      const recoil = Math.floor(Math.random() * 6) + 1;
      return {
        enemyHP: enemyHP - 12,
        playerHP: playerHP - recoil,
      };
    },
    startingWeaponBonus: 0,
    startingSpecialUses: 0,
    startingShieldBonus: 0,
  },
};
