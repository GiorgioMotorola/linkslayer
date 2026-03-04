function dropOnce({ playerName, inventory, playerGold, log }) {
  const lootOptions = ["weaponPiece", "defensePiece", "gold"];
  const selectedLoot = lootOptions[Math.floor(Math.random() * lootOptions.length)];

  switch (selectedLoot) {
    case "weaponPiece": {
      inventory.value.weaponPieces = (inventory.value.weaponPieces || 0) + 1;
      log(`🛠️ <span class="player-name">${playerName.value}</span> loots a Weapon Piece.`);
      break;
    }
    case "defensePiece": {
      inventory.value.defensePieces = (inventory.value.defensePieces || 0) + 1;
      log(`🛡️ <span class="player-name">${playerName.value}</span> loots a Defense Piece.`);
      break;
    }
    case "gold": {
      const amount = Math.floor(Math.random() * 30) + 10;
      playerGold.value += amount;
      log(`💰 <span class="player-name">${playerName.value}</span> loots ${amount} Gold Pieces.`);
      break;
    }
  }
}

export function handleLootDrop({ playerState, utilityFunctions, bountyScrollActive }) {
  const { playerName, playerGold, inventory } = playerState;
  const { log } = utilityFunctions;

  dropOnce({ playerName, inventory, playerGold, log });

  if (bountyScrollActive?.value) {
    bountyScrollActive.value = false;
    log(`📜 The Bounty Scroll shimmers — a second drop falls!`);
    dropOnce({ playerName, inventory, playerGold, log });
  }
}
