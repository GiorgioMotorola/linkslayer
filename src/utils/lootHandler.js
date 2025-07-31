// src/utils/lootHandler.js

export function handleLootDrop({ playerState, utilityFunctions }) {
  const {
    playerHP,
    playerName,
    playerClass,
    specialUsesLeft,
    weaponBonus,
    shieldBonus,
    playerGold,
    inventory,
    effectiveMaxHP,
  } = playerState;
  const { log } = utilityFunctions;

  const lootOptions = [
    "weaponPiece",
    "special",
    "defensePiece",
    "gold",
    "turkeyLeg",
  ];
  const selectedLoot =
    lootOptions[Math.floor(Math.random() * lootOptions.length)];

  switch (selectedLoot) {
    case "special": {
      specialUsesLeft.value += 1;
      log(
        `🎁 <span class="player-name">${playerName.value}</span> regains +1 Class Ability charges. (Total: ${specialUsesLeft.value})`
      );
      break;
    }
    case "weaponPiece": {
      inventory.value.weaponPieces = (inventory.value.weaponPieces || 0) + 1;
      log(
        `🛠️ <span class="player-name">${playerName.value}</span> loots a Weapon Piece.`
      );
      break;
    }

    case "defensePiece": {
      inventory.value.defensePieces = (inventory.value.defensePieces || 0) + 1;
      log(
        `🛡️ <span class="player-name">${playerName.value}</span> loots a Defense Piece.`
      );
      break;
    }

    case "gold": {
      const amount = Math.floor(Math.random() * 30) + 10;
      playerGold.value += amount;
      log(
        `💰 <span class="player-name">${playerName.value}</span> loots ${amount} Gold Pieces.`
      );
      break;
    }
    case "turkeyLeg": {
      inventory.value.turkeyLegs++;
      log(
        `🍖 <span class="player-name">${playerName.value}</span> loots a Turkey Leg.`
      );
      break;
    }
  }
}
