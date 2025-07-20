// src/utils/restHandler.js

export function handleRest({ player, state, utils }) {
  const { playerHP, playerClass, specialUsesLeft, playerName, effectiveMaxHP } =
    player;
  const { shortRestsUsed, longRestsUsed } = state;
  const { log, showRestModal } = utils;

  const choice = state.restChoice;

  if (choice === "short" && shortRestsUsed.value < 4) {
    const healAmount = 5;
    playerHP.value = Math.min(playerHP.value + healAmount, effectiveMaxHP);
    log(`${playerName.value} feels rested and has gained +${healAmount}HP.`);
    shortRestsUsed.value++;
  } else if (choice === "long" && longRestsUsed.value < 2) {
    const healAmount = 10;
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
