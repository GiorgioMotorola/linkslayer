export const STATUS_EFFECTS = {
  bleed: {
    name: "Bleed",
    apply: (target) => {
      target.statusEffects.push({ type: "bleed", duration: 2, damage: 1 });
    },
    tick: (target) => {
      const effect = target.statusEffects.find((e) => e.type === "bleed");
      if (effect) {
        target.hp -= effect.damage;
        effect.duration--;
        log(
          `${formattedTitle.value} is bleeding. ${formattedTitle.value} takes ${effect.damage} additional damage.`
        );
      }
    },
  },

  stun: {
    name: "Stun",
    apply: (target) => {
      target.statusEffects.push({ type: "stun", duration: 1 });
    },
    tick: (target) => {
      const effect = target.statusEffects.find((e) => e.type === "stun");
      if (effect) {
        effect.duration--;
        return `${target.name} is stunned and skips their turn.`;
      }
    },
  },
};