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

  const lootChance = Math.random();
  if (lootChance > 0.7) {
    log(`❌ Enemy has no loot to drop.`);
    return;
  }

  const lootOptions = ["health", "weapon", "special", "shield", "gold"];
  const selectedLoot =
    lootOptions[Math.floor(Math.random() * lootOptions.length)];

  switch (selectedLoot) {
    // case "health": {
    //   const amount = 10;

    //   playerHP.value = Math.min(playerHP.value + amount, effectiveMaxHP);
    //   log(
    //     `🍎 <span class="player-name">${playerName.value}</span> loots +${amount} HP.`
    //   );
    //   break;
    // }

    case "weapon": {
      weaponBonus.value += 1;
      log(
        `🗡️ <span class="player-name">${playerName.value}</span> loots a sharper weapon. Weapon damage +1 (Base Damage Total: +${weaponBonus.value})`
      );
      break;
    }

    case "special": {
      specialUsesLeft.value += 1;
      log(
        `🎁 <span class="player-name">${playerName.value}</span> regains +1 Class Ability charges. (Total: ${specialUsesLeft.value})`
      );
      break;
    }

    case "shield": {
      shieldBonus.value += 1;
      log(
        `🛡️<span class="player-name">${playerName.value}</span> loots stronger Chainmail. Defense +1 (Base Defense Total: +${shieldBonus.value})`
      );
      break;
    }
    case "gold": {
      const amount = Math.floor(Math.random() * 16) + 5;
      playerGold.value += amount;
      log(
        `💰 <span class="player-name">${playerName.value}</span> loots ${amount} Gold Pieces!`
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
        case "barkTea": {
      inventory.value.barkTeas++;
      log(
        `🍖 <span class="player-name">${playerName.value}</span> loots Bark Tea.`
      );
      break;
    }
  }
}
