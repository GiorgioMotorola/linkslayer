// src/composables/useGameLog.js

import { ref } from "vue";

export function useGameLog(getFormattedTimer) {
  const gameLog = ref([]);
  let logId = 0;

  function log(message) {
    logId++;
    const timestamp = getFormattedTimer();
    gameLog.value.push({
      id: logId,
      text: `[${timestamp}] ${message}`,
    });
  }

  function logEnemyAction(enemyNextAction, nextEnemyAttack) {
    let message = "";
    switch (enemyNextAction.value) {
      case "attack":
        message = `🗡️ Enemy is now attacking for ${nextEnemyAttack.value} damage.`;
        break;
      case "defend":
        message = "🛡️ Enemy is defending your next attack.";
        break;
      case "flee":
        message = "🏃 Enemy is about to flee.";
        break;
      case "trip":
        message = "🤾 Enemy tripped. You get a free attack.";
        break;
      case "steal":
        message = "💰 Enemy eyes your gold with a wicked grin.";
        break;
      case "enrage":
        message = "💢 Enemy enrages! Their attacks will grow stronger.";
        break;
      case "confuse":
        message = "🌀 Enemy readies a confounding strike.";
        break;
      case "summon":
        message = "🪄 Enemy summons reinforcements!";
        break;
      default:
        message = "";
    }
    if (message) log(message);
  }

  return {
    gameLog,
    log,
    logEnemyAction,
  };
}
