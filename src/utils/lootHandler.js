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
  } = playerState;
  const { log } = utilityFunctions;

  const lootChance = Math.random();
  if (lootChance > 0.7) {
    log(`❌ Enemy has no loot to drop.`);
    return;
  }

  const lootOptions = ["health", "weapon", "special", "shield", "gold"];
  const selectedLoot =
    lootOptions[Math.floor(Math.random() * lootOptions.length)];

  switch (selectedLoot) {
    case "health": {
      const amount = 10;

      playerHP.value = Math.min(
        playerHP.value + amount,
        playerClass.value.maxHP
      );
      log(
        `🍎 <span class="player-name">${playerName.value}</span> loots +${amount} HP.`
      );
      break;
    }

    case "weapon": {
      weaponBonus.value += 2;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> loots a sharper weapon. Weapon damage +2 (Base Damage Total: +${weaponBonus.value})`
      );
      break;
    }

    case "special": {
      specialUsesLeft.value += 2;
      log(
        `🎁 <span class="player-name">${playerName.value}</span> regains +2 Class Ability charges. (Total: ${specialUsesLeft.value})`
      );
      break;
    }

    case "shield": {
      shieldBonus.value += 2;
      log(
        `🛡️<span class="player-name">${playerName.value}</span> loots stronger Chainmail. Defense +2 (Base Defense Total: +${shieldBonus.value})`
      );
      break;
    }
    case "gold": {
      const amount = Math.floor(Math.random() * 5) + 3;
      playerGold.value += amount;
      log(
        `💰 <span class="player-name">${playerName.value}</span> loots ${amount} Gold Pieces!`
      );
      break;
    }
    case "turkeyLeg": {
      inventory.value.turkeyLegs++;
      log(
        `🍖 <span class="player-name">${playerName.value}</span> loots a delicious Turkey Leg!`
      );
      break;
    }
  }
}
