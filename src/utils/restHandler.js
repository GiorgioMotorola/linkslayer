// src/utils/restHandler.js


export function handleRest({ player, state, utils }) {
  const { playerHP, playerClass, specialUsesLeft, playerName } = player;
  const { shortRestsUsed, longRestsUsed } = state;
  const { log, showRestModal } = utils;

  const choice = state.restChoice;

  console.log("Rest choice:", choice);

  if (choice === "short" && shortRestsUsed.value < 4) {
    playerHP.value = playerHP.value + 5;
    log(`${playerName.value} feels rested and has gained +5HP.`);
    shortRestsUsed.value++;
  } else if (choice === "long" && longRestsUsed.value < 2) {
    playerHP.value = playerHP.value + 10;
    log(`${playerName.value} feels rested and has gained +10HP.`);
    longRestsUsed.value++;
    specialUsesLeft.value = specialUsesLeft.value + 1;
    log(`${playerName.value} also recovered 1 Class Ability charge.`);
  } else if (choice === "continue") {
    log(`${playerName.value} decided not to rest and continued their journey.`);
  }

  showRestModal.value = false; 
}