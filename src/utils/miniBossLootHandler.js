// src/utils/miniBossLootHandler.js

export function handleMiniBossLootDrop({
  playerState,
  utilityFunctions,
  defeatedEnemyData,
}) {
  const { playerName, playerGold, weaponBonus, shieldBonus } = playerState;
  const { log } = utilityFunctions;

  const goldAmount = defeatedEnemyData.goldReward || 0;
  playerGold.value += goldAmount;
  log(
    `💰 <span class="player-name">${playerName.value}</span> finds ${goldAmount} Gold Pieces from defeating the ${defeatedEnemyData.name}.`
  );

  const weaponAmount = defeatedEnemyData.weaponReward || 0;
  if (weaponAmount > 0) {
    weaponBonus.value += weaponAmount;
    log(
      `⚔️ <span class="player-name">${playerName.value}</span> gained a weapon upgrade. Weapon damage +${weaponAmount} (Total: +${weaponBonus.value})`
    );
  }

  const defenseAmount = defeatedEnemyData.defenseReward || 0;
  if (defenseAmount > 0) {
    shieldBonus.value += defenseAmount;
    log(
      `🛡️ <span class="player-name">${playerName.value}</span> found reinforced armor. Defense +${defenseAmount} (Total: +${shieldBonus.value})`
    );
  }
}
