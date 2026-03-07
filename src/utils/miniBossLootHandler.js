export function handleMiniBossLootDrop({
  playerState,
  utilityFunctions,
  defeatedEnemyData,
}) {
  const { playerName, playerGold, inventory } = playerState;
  const { log } = utilityFunctions;

  const goldAmount = defeatedEnemyData.goldReward || 0;
  playerGold.value += goldAmount;
  log(
    `💰 <span class="player-name">${playerName.value}</span> finds ${goldAmount} Gold Pieces from defeating the ${defeatedEnemyData.name}.`
  );

  const scrapAmount = defeatedEnemyData.scrapReward || 0;
  if (scrapAmount > 0) {
    inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) + scrapAmount;
    log(
      `🔩 <span class="player-name">${playerName.value}</span> salvages ${scrapAmount} Scrap Metal from the remains.`
    );
  }
}
