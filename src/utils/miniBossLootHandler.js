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

  const lootChance = Math.random();
  if (lootChance < 0.1) {
    log(`❌ The defeated mini-boss yields no special loot.`);
    return;
  }

  const miniBossLootOptions = [
    { type: "health", amount: 15 },
    { type: "weapon", amount: 2 },
    { type: "special", amount: 2 },
    { type: "shield", amount: 2 },
    { type: "gold", min: 10, max: 30 },
  ];

  const selectedLoot =
    miniBossLootOptions[Math.floor(Math.random() * miniBossLootOptions.length)];

  switch (selectedLoot.type) {
    case "health": {
      const amount = selectedLoot.amount;
      playerHP.value = Math.min(
        playerHP.value + amount,
        effectiveMaxHP.value || playerHP.value
      );
      log(
        `💖 <span class="player-name">${playerName.value}</span> loots a rare potion, gaining +${amount} HP!`
      );
      break;
    }
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
        `🌟 <span class="player-name">${playerName.value}</span> feels empowered, regaining +${selectedLoot.amount} Class Ability charges! (Total: ${specialUsesLeft.value})`
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
        `💰 <span class="player-name">${playerName.value}</span> finds a hidden stash of ${amount} Gold Pieces!`
      );
      break;
    }
  }
}
