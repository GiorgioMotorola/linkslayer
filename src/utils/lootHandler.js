export function handleLootDrop({ playerState, utilityFunctions, bountyScrollActive, enemyCount = 1 }) {
  const { playerName, playerGold, inventory } = playerState;
  const { log } = utilityFunctions;

  const bountyMultiplier = bountyScrollActive?.value ? 2 : 1;
  if (bountyScrollActive?.value) {
    bountyScrollActive.value = false;
    log(`<i class="ra ra-scroll-unfurled"></i> The Bounty Scroll shimmers — double drops!`);
  }

  const scrapAmount = enemyCount * bountyMultiplier;
  const goldAmount = (10 + (enemyCount - 1) * 5) * bountyMultiplier;

  // 50% scrap, 50% gold
  if (Math.random() < 0.5) {
    inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) + scrapAmount;
    log(`<i class="ra ra-cog"></i> <span class="player-name">${playerName.value}</span> loots ${scrapAmount} Scrap Metal.`);
    return [`<i class="ra ra-cog"></i> ${scrapAmount} Scrap Metal`];
  }

  playerGold.value += goldAmount;
  log(`<i class="ra ra-gold-bar"></i> <span class="player-name">${playerName.value}</span> loots ${goldAmount} Gold Pieces.`);
  return [`<i class="ra ra-gold-bar"></i> ${goldAmount} Gold Pieces`];
}
