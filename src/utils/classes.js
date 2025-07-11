// utils/classes.js
export const classes = {
  Fighter: {
    name: "Fighter",
    maxHP: 40,
    special: "Power Strike",
    description: "40 HP. Special deals 6 damage.",
    specialEffect: (enemyHP) => enemyHP - 6,
  },
  Wizard: {
    name: "Wizard",
    maxHP: 30,
    special: "Fireball",
    description: "30 HP. Special deals between 5 and 15 damage.",
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
  },
  Rogue: {
    name: "Rogue",
    maxHP: 35,
    special: "Sneak Attack",
    description:
      "35 HP. Special deals 6 damage and evades the incoming enemy strike.",
    specialEffect: (enemyHP) => {
      const rogueDamage = 6;
      return {
        enemyHP: enemyHP - rogueDamage,
        rogueDamage,
      };
    },
  },
  Paladin: {
    name: "Paladin",
    maxHP: 45,
    special: "Divine Blessing",
    description: "45 HP. Special heals 3 HP and deals 5 damage.",
    specialEffect: (enemyHP, playerHP, maxHP) => ({
      enemyHP: enemyHP - 5,
      playerHP: playerHP + 3,
    }),
  },
  Sorcerer: {
    name: "Sorcerer",
    maxHP: 33,
    special: "Chaos Surge",
    description:
      "33 HP. Special deals 12 damage, but takes random recoil damage to the player.",
    specialEffect: (enemyHP, playerHP) => {
      const recoil = Math.floor(Math.random() * 4);
      return {
        enemyHP: enemyHP - 12,
        playerHP: playerHP - recoil,
      };
    },
  },
};
