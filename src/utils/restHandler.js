const CAMP_TIERS = [
  { hp: 20, specials: 1, label: "sleep on the ground" },
  { hp: 25, specials: 1, label: "sleeping bag" },
  { hp: 30, specials: 2, label: "sleeping bag, pillow" },
  { hp: 50, specials: 2, label: "sleeping bag, pillow, tent" },
];

export function getLongRestLabel(campTier) {
  const tier = CAMP_TIERS[campTier] ?? CAMP_TIERS[0];
  return `Long Rest, ${tier.label}`;
}

export function handleRest({ player, state, utils }) {
  const { playerHP, playerClass, specialUsesLeft, playerName, effectiveMaxHP } =
    player;
  const { shortRestsUsed, longRestsUsed, restChoice, campTier } = state;
  const { log } = utils;

  const choice = restChoice;
  let restType = null;

  if (choice === "short" && shortRestsUsed.value < 9999) {
    const healAmount = 20;
    playerHP.value = Math.min(playerHP.value + healAmount, effectiveMaxHP);
    log(`${playerName.value} feels rested and has gained +${healAmount}HP.`);
    shortRestsUsed.value++;
    restType = "short";
  } else if (choice === "long" && longRestsUsed.value < 9999) {
    const tier = CAMP_TIERS[campTier?.value ?? 0] ?? CAMP_TIERS[0];
    const longHealAmount = tier.hp;
    const specialsGained = tier.specials;
    playerHP.value = Math.min(playerHP.value + longHealAmount, effectiveMaxHP);
    specialUsesLeft.value = specialUsesLeft.value + specialsGained;
    log(
      `${playerName.value} takes a long rest (${tier.label}). You retrieve ${specialsGained} class ${specialsGained === 1 ? "ability" : "abilities"} and restore ${longHealAmount}HP.`
    );
    longRestsUsed.value++;
    restType = "long";
  } else if (choice === "continue") {
    restType = "continue";
  } else {
    log("You cannot rest any further at this time.");
    restType = "none";
  }

  return restType;
}

