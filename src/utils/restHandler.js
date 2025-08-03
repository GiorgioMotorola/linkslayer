// src/utils/restHandler.js

export function handleRest({ player, state, utils }) {
  const { playerHP, playerClass, specialUsesLeft, playerName, effectiveMaxHP } =
    player;
  const { shortRestsUsed, longRestsUsed, restChoice } = state;
  const { log, showRestModal } = utils;

  const choice = restChoice;
  let restType = null;

  if (choice === "short" && shortRestsUsed.value < 9999) {
    const healAmount = 20;
    playerHP.value = Math.min(playerHP.value + healAmount, effectiveMaxHP);
    log(`${playerName.value} feels rested and has gained +${healAmount}HP.`);
    shortRestsUsed.value++;
    restType = "short";
  } else if (choice === "long" && longRestsUsed.value < 9999) {
    playerHP.value = effectiveMaxHP;
    specialUsesLeft.value = specialUsesLeft.value + 1;
    log(
      `${playerName.value} takes a long rest. You retrieve 1 class ability and your HP is fully restored.`
    );
    longRestsUsed.value++;
    restType = "long";
  } else if (choice === "continue") {
    log(`${playerName.value} decided not to rest and continued their journey.`);
    restType = "continue";
  } else {
    log("You cannot rest any further at this time.");
    restType = "none";
  }

  showRestModal.value = false;
  return restType;
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
