// src/utils/miniBossLootHandler.js

export function handleMiniBossLootDrop({ playerState, utilityFunctions }) {
  const {
    playerHP,
    playerName,
    specialUsesLeft,
    weaponBonus,
    shieldBonus,
    playerGold,
    effectiveMaxHP,
  } = playerState;
  const { log } = utilityFunctions;

  const miniBossLootOptions = [
    { type: "weapon", amount: 1 },
    { type: "special", amount: 2 },
    { type: "shield", amount: 1 },
    { type: "gold", min: 10, max: 40 },
  ];

  const selectedLoot =
    miniBossLootOptions[Math.floor(Math.random() * miniBossLootOptions.length)];

  switch (selectedLoot.type) {
    case "weapon": {
      weaponBonus.value += selectedLoot.amount;
      log(
        `✨ <span class="player-name">${playerName.value}</span> finds a masterwork weapon. Weapon damage +${selectedLoot.amount} (Total: +${weaponBonus.value})`
      );
      break;
    }
    case "special": {
      specialUsesLeft.value += selectedLoot.amount;
      log(
        `🌟 <span class="player-name">${playerName.value}</span> feels empowered, regaining +${selectedLoot.amount} Class Ability charges. (Total: ${specialUsesLeft.value})`
      );
      break;
    }
    case "shield": {
      shieldBonus.value += selectedLoot.amount;
      log(
        `🛡️ <span class="player-name">${playerName.value}</span> discovers reinforced armor. Defense +${selectedLoot.amount} (Total: +${shieldBonus.value})`
      );
      break;
    }
    case "gold": {
      const amount =
        Math.floor(Math.random() * (selectedLoot.max - selectedLoot.min + 1)) +
        selectedLoot.min;
      playerGold.value += amount;
      log(
        `💰 <span class="player-name">${playerName.value}</span> finds a hidden stash of ${amount} Gold Pieces.`
      );
      break;
    }
  }
}
