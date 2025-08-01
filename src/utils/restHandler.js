// src/utils/restHandler.js

export function handleRest({ player, state, utils }) {
  const { playerHP, playerClass, specialUsesLeft, playerName, effectiveMaxHP } =
    player;
  const { shortRestsUsed, longRestsUsed, restChoice } = state;
  const { log, showRestModal } = utils;

  const choice = restChoice;

  if (choice === "short" && shortRestsUsed.value < 100) {
    const healAmount = 10;
    playerHP.value = Math.min(playerHP.value + healAmount, effectiveMaxHP);
    log(`${playerName.value} feels rested and has gained +${healAmount}HP.`);
    shortRestsUsed.value++;
  } else if (choice === "long" && longRestsUsed.value < 100) {
    const healAmount = 20;
    playerHP.value = Math.min(playerHP.value + healAmount, effectiveMaxHP);
    log(`${playerName.value} feels rested and has gained +${healAmount}HP.`);
    longRestsUsed.value++;
    specialUsesLeft.value = specialUsesLeft.value + 1;
    log(`${playerName.value} also recovered 1 Class Ability charge.`);
  } else if (choice === "continue") {
    log(`${playerName.value} decided not to rest and continued their journey.`);
  }

  showRestModal.value = false;
}

export function handleAssembleUpgrade({
  playerState,
  upgradeType,
  utilityFunctions,
}) {
  const { inventory, playerName, weaponBonus, shieldBonus } = playerState;
  const { log } = utilityFunctions;

  if (upgradeType === "weapon") {
    if ((inventory.weaponPieces || 0) >= 2) {
      inventory.weaponPieces -= 2;
      weaponBonus.value += 1;
      log(
        `🛠️ <span class="player-name">${playerName.value}</span> assembled 2 Weapon Pieces into +1 Weapon Damage.`
      );
    } else {
      log(
        `You need 2 Weapon Pieces to assemble a weapon upgrade. You currently have ${
          inventory.weaponPieces || 0
        }.`
      );
    }
  } else if (upgradeType === "defense") {
    if ((inventory.defensePieces || 0) >= 2) {
      inventory.defensePieces -= 2;
      shieldBonus.value += 1;
      log(
        `🛡️ <span class="player-name">${playerName.value}</span> assembled 2 Defense Pieces into +1 Defense Bonus.`
      );
    } else {
      log(
        `You need 2 Defense Pieces to assemble a defense upgrade. You currently have ${
          inventory.defensePieces || 0
        }.`
      );
    }
  } else {
    log(`Invalid upgrade type specified for assembly: ${upgradeType}`);
  }
}
