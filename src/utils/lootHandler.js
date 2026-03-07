function dropOnce({ playerName, inventory, playerGold, log }) {
  const lootOptions = ["scrapMetal", "scrapMetal", "gold"];
  const selectedLoot = lootOptions[Math.floor(Math.random() * lootOptions.length)];

  switch (selectedLoot) {
    case "scrapMetal": {
      const amount = Math.floor(Math.random() * 3) + 1;
      inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) + amount;
      log(`🔩 <span class="player-name">${playerName.value}</span> loots ${amount} Scrap Metal.`);
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
