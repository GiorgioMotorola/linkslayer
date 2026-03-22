import { WEAPONS } from "@/utils/weapons";

export function handleLootDrop({ playerState, utilityFunctions, bountyScrollActive, enemyCount = 1 }) {
  const { playerName, playerGold, inventory, equippedWeapon } = playerState;
  const { log } = utilityFunctions;

  const bountyMultiplier = bountyScrollActive?.value ? 2 : 1;
  if (bountyScrollActive?.value) {
    bountyScrollActive.value = false;
    log(`📜 The Bounty Scroll shimmers — double drops!`);
  }

  const roll = Math.random();

  // 33% weapon, 33% scrap, 33% gold
  if (roll < 0.33) {
    const weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
    if (!inventory.value.pendingWeapons) inventory.value.pendingWeapons = [];
    const alreadyOwned = inventory.value.pendingWeapons.includes(weapon.id)
      || equippedWeapon?.value === weapon.id;
    if (!alreadyOwned) {
      inventory.value.pendingWeapons.push(weapon.id);
      log(`⚔️ <span class="player-name">${playerName.value}</span> found a <strong>${weapon.name}</strong>! Take it to the Forge to equip it.`);
      return [`⚔️ ${weapon.name}`];
    }
    // Weapon already owned — fall through to scrap as consolation
  }

  const scrapAmount = enemyCount * 2 * bountyMultiplier;
  const goldAmount = (10 + (enemyCount - 1) * 5) * bountyMultiplier;

  if (roll < 0.66) {
    inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) + scrapAmount;
    log(`🔩 <span class="player-name">${playerName.value}</span> loots ${scrapAmount} Scrap Metal.`);
    return [`🔩 ${scrapAmount} Scrap Metal`];
  }

  playerGold.value += goldAmount;
  log(`💰 <span class="player-name">${playerName.value}</span> loots ${goldAmount} Gold Pieces.`);
  return [`💰 ${goldAmount} Gold Pieces`];
}
