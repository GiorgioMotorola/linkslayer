<template>
  <Header
    :start="chain[currentTargetIndex]"
    :targets="chain[currentTargetIndex + 1]"
    :clicks="clickCount"
    :path="path"
    :playerClass="playerClass"
    :specialUsesLeft="specialUsesLeft"
    :playerHP="playerHP"
    :maxHP="playerClass?.maxHP ?? 0"
    :gameLog="gameLog"
    :encounter="encounter"
    :enemyHP="enemyHP"
    :nextEnemyAttack="nextEnemyAttack"
    :enemyNextAction="enemyNextAction"
    :message="encounterMessage"
    @action="handleCombatActionWrapper"
    @option-chosen="callHandleEncounterOption"
    @close="handleCloseEncounter"
    :playerName="playerName"
    @log-line="log"
    :shieldBonus="shieldBonus"
    :weaponBonus="weaponBonus"
    :longRestsUsed="longRestsUsed"
    :isDarkened="bossOverlay"
    :shortRestsUsed="shortRestsUsed"
    :playerGold="playerGold"
    @show-tips="showTipsModal = true"
  />

  <div class="main-content-wrapper">
    <ClassSelect
      v-if="!playerClass"
      @select="handleClassSelection"
      :articleTitle="current"
      :start="chain[0]"
      :targets="chain[currentTargetIndex + 1]"
      :formattedStart="formattedStart"
      :formattedTitle="formattedTitle"
      :fullChain="chain"
      @show-tips="showTipsModal = true"
    />
    <div>
      <VictoryModal
        v-if="isGameComplete"
        :clicks="clickCount"
        :path="path"
        :timer="formattedTimer"
        :targets="chain"
        :shortcutsUsed="shortcutsUsedCount"
        :combatEncountersFought="combatEncountersFought"
        :playerHP="playerHP"
        :weaponBonus="weaponBonus"
        :specialsUsed="totalSpecialsUsed"
        :longRestsUsed="longRestsUsed"
        :shortRestsUsed="shortRestsUsed"
        @close="resetGame"
        :gameLog="gameLog"
      />

      <DefeatModal
        v-if="defeated"
        :clicks="clickCount"
        :path="path"
        :timer="formattedTimer"
        :targets="chain"
        :shortcutsUsed="shortcutsUsedCount"
        :combatEncountersFought="combatEncountersFought"
        :playerHP="playerHP"
        :weaponBonus="weaponBonus"
        :specialsUsed="totalSpecialsUsed"
        :longRestsUsed="longRestsUsed"
        :shortRestsUsed="shortRestsUsed"
        @close="resetGame"
        :gameLog="gameLog"
      />

      <ArticleViewer
        :articleTitle="current"
        :start="chain[0]"
        :targets="chain[currentTargetIndex + 1]"
        :inEncounter="inEncounter"
        @link-clicked="callHandleClick"
        :path="path"
        :fullChain="chain"
        :currentTargetIndex="currentTargetIndex"
        :isBlurred="blurClicksLeft > 0"
      />

      <RestModal
        v-show="showRestModal"
        :shortRestsUsed="shortRestsUsed"
        :longRestsUsed="longRestsUsed"
        @rest="callHandleRest"
      />

      <ShopModal
        v-show="showShopModal"
        :playerGold="playerGold"
        @buy="handleShopPurchase"
        @close="showShopModal = false"
      />
    </div>
  </div>

  <div class="dim-overlay" :class="{ 'active-overlay': bossOverlay }"></div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
  nextTick,
} from "vue";
import { getRandomChain } from "@/utils/randomPair";
import ArticleViewer from "@/components/ArticleViewer.vue";
import Header from "@/components/Header.vue";
import VictoryModal from "@/components/VictoryModal.vue";
import ClassSelect from "@/components/ClassSelect.vue";
import { classes } from "@/utils/classes";
import DefeatModal from "@/components/DefeatModal.vue";
import { getRandomBoss, isBoss } from "@/utils/bossGenerator";
import RestModal from "@/components/RestModal.vue";
import { handleCombatAction } from "@/utils/combat";
import ShopModal from "@/components/ShopModal.vue";
import { handleRest } from "@/utils/restHandler";
import { handleClick as externalHandleClick } from "@/utils/clickHandler.js";
import { handleEncounterOption as externalHandleEncounterOption } from "@/utils/encounterHandler";
import { handleLootDrop as externalHandleLootDrop } from "@/utils/lootHandler";
import { handleEnemyTurn as externalHandleEnemyTurn } from "@/utils/enemyTurnHandler"; //

const chain = getRandomChain();
const current = ref(chain[0]);

const formattedStart = computed(() => chain[0]?.replaceAll("_", " ") ?? "");
const formattedTitle = computed(
  () => current.value?.replaceAll("_", " ") ?? ""
);

const defeated = ref(false);
const currentTargetIndex = ref(0);
const clickCount = ref(0);
const shortcutsUsedCount = ref(0);
const combatEncountersFought = ref(0);
const totalSpecialsUsed = ref(0);
const path = ref([current.value]);
const encounter = ref(null);
const playerHP = ref(0);
const enemyHP = ref(25);
const nextEnemyAttack = ref(null);
const enemyNextAction = ref("attack");
const specialUsesLeft = ref(5);
const playerClass = ref(null);
const gameLog = ref([]);
const encounterMessage = ref("");
const playerName = ref("");
const DEFAULT_ENEMY_HP = 25;
const weaponBonus = ref(0);
const shieldBonus = ref(0);
const enemyStatusEffects = ref([]);
const enemyIsStunned = ref(false);
const seenLoreEncounters = ref([]);
const seenNPCEncounters = ref([]);
const currentEnemy = ref(null);
const selectedBossType = ref("");
const bossSpawned = ref(false);
const bossDefeated = ref(false);
const shortRestsUsed = ref(0);
const showRestModal = ref(false);
const longRestsUsed = ref(0);
const hasReachedFinalArticle = ref(false);
const bossOverlay = ref(false);
const blurClicksLeft = ref(0);
const playerGold = ref(0);
const showShopModal = ref(false);
const showTipsModal = ref(false);
const poisonedClicksLeft = ref(0);
const poisonDamagePerClick = ref(0);

const inEncounter = computed(() => {
  const e = encounter.value;
  if (!e || typeof e !== "object") return false;

  if (e.type === "combat") {
    return e.enemy && typeof e.enemy === "object";
  }

  if (e.type === "npc") {
    return (
      e.npc &&
      typeof e.npc.name === "string" &&
      typeof e.npc.greeting === "string"
    );
  }

  if (e.type === "lore") {
    return e.lore && typeof e.lore.text === "string";
  }

  return false;
});

watch(playerHP, (newVal) => {
  if (playerClass.value && newVal <= 0 && !defeated.value) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> was defeated.`
    );
    defeated.value = true;
    clearInterval(timerInterval);
    encounter.value = null;
  }
});

watch(clickCount, (newClicks) => {
  if (newClicks > 0 && newClicks % 11 === 0) {
    showRestModal.value = true;
  }
  if (newClicks > 0 && newClicks % 15 === 0 && !showRestModal.value) {
    showShopModal.value = true;
  }
  if (blurClicksLeft.value > 0) {
    blurClicksLeft.value--;
    log(
      `🍺 You are still drunk. ${blurClicksLeft.value} clicks left til you sober up.`
    );
  }
  if (poisonedClicksLeft.value > 0) {
    playerHP.value = Math.max(0, playerHP.value - poisonDamagePerClick.value);
    poisonedClicksLeft.value--;
    log(
      `🤢 You are poisoned! You lose ${poisonDamagePerClick.value} HP. ${poisonedClicksLeft.value} clicks left until the poison wears off.`
    );
    if (playerHP.value <= 0) {
      log(
        `💀 <span class="player-name">${playerName.value}</span> was defeated by poison.`
      );
      defeated.value = true;
      clearInterval(timerInterval);
      encounter.value = null;
    }
  }
});

const timer = ref(0);
let timerInterval;

const formattedTimer = computed(() => {
  const minutes = Math.floor(timer.value / 60);
  const seconds = timer.value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
});

const isGameComplete = computed(() => {
  return current.value === chain[2] && bossDefeated.value;
});

async function callHandleClick(title) {
  await externalHandleClick({
    title,
    playerState: {
      clickCount,
      path,
      currentTargetIndex,
      combatEncountersFought,
    },
    gameData: {
      chain,
      current,
      bossSpawned,
      bossDefeated,
      selectedBossType,
      formattedTitle,
      seenLoreEncounters,
      seenNPCEncounters,
      timerInterval,
    },
    modalState: {
      inEncounter,
      showRestModal,
      showShopModal,
      showTipsModal,
      bossOverlay,
    },
    enemyState: {
      encounter,
      enemyHP,
      encounterMessage,
      nextEnemyAttack,
      enemyNextAction,
      currentEnemy,
    },
    utilityFunctions: {
      log,
      logEnemyAction,
      clearInterval: (intervalId) => clearInterval(intervalId),
    },
  });
}

function callHandleRest(choice) {
  handleRest({
    player: {
      playerHP,
      playerClass,
      specialUsesLeft,
      playerName,
    },
    state: {
      restChoice: choice,
      shortRestsUsed,
      longRestsUsed,
    },
    utils: {
      log,
      showRestModal,
    },
  });
}
function handleCombatActionWrapper(playerAction) {
  handleCombatAction({
    player: {
      playerHP,
      playerClass,
      specialUsesLeft,
      weaponBonus,
      shieldBonus,
      playerName,
      action: playerAction,
    },
    enemy: {
      enemyHP,
      encounter,
      nextEnemyAttack,
      enemyNextAction,
      enemyStatusEffects,
      enemyIsStunned,
    },
    state: {
      log,
      formattedTitle: formattedTitle.value,
      DEFAULT_ENEMY_HP,
      isBoss,
    },
    utils: {
      clearTimer: () => clearInterval(timerInterval),
      setDefeated: () => (defeated.value = true),
      handleLootDrop,
      markBossDefeated,
      gotoEnemyTurn,
    },
  });
}

function gotoEnemyTurn() {
  externalHandleEnemyTurn({
    enemyState: {
      enemyStatusEffects,
      enemyHP,
      encounter,
      enemyIsStunned,
      enemyNextAction,
      nextEnemyAttack,
    },
    playerState: {
      playerName,
    },
    gameData: {},
    utilityFunctions: {
      log,
    },
    combatFunctions: {
      formattedTitle: formattedTitle,
      decideEnemyAction: decideEnemyAction,
      logEnemyAction: logEnemyAction,
    },
  });
}

let logId = 0;

function log(message) {
  logId++;
  gameLog.value.push({
    id: logId,
    text: `[${formattedTimer.value}] ${message}`,
  });
}

function decideEnemyAction() {
  if (
    !isBoss(encounter.value?.enemy) &&
    enemyHP.value <= 5 &&
    Math.random() < 0.02
  ) {
    return "flee";
  }
  if (Math.random() < 0.2) return "defend";
  return "attack";
}

function logEnemyAction() {
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
    default:
      message = "";
  }
  if (message) log(message);
}

function handleCloseEncounter() {
  encounter.value = null;

  if (bossDefeated.value) {
    current.value = chain[chain.length - 1];
  }

  const lastTitle = path.value[path.value.length - 1];
  if (lastTitle === chain[currentTargetIndex.value + 1]) {
    currentTargetIndex.value++;
  }

  if (lastTitle === chain[chain.length - 1]) {
    clearInterval(timerInterval);
  }
}

function handleClassSelection({ classKey, name }) {
  playerClass.value = classes[classKey];
  playerHP.value = playerClass.value.maxHP;
  playerName.value = name;
  if (playerClass.value.startingWeaponBonus) {
    weaponBonus.value += playerClass.value.startingWeaponBonus;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingWeaponBonus} starting Weapon Damage.`
    );
  }
  if (playerClass.value.startingSpecialUses) {
    specialUsesLeft.value += playerClass.value.startingSpecialUses;
    log(
      `🎁 <span class="player-name">${playerName.value}</span> starts with +${playerClass.value.startingSpecialUses} Class Ability charges.`
    );
  }
  if (playerClass.value.startingShieldBonus) {
    shieldBonus.value += playerClass.value.startingShieldBonus;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingShieldBonus} starting Defense Bonus.`
    );
  }
  log(`Player name: ${playerName.value}`);
  log(`Class selected: ${playerClass.value.name}`);
}

function callHandleEncounterOption(option) {
  externalHandleEncounterOption({
    option,
    playerState: {
      playerHP,
      playerName,
      playerClass,
      combatEncountersFought,
      specialUsesLeft,
      weaponBonus,
      shieldBonus,
      blurClicksLeft,
      poisonedClicksLeft,
      poisonDamagePerClick,
      playerGold,
      currentTargetIndex,
      path,
      clickCount,
      shortcutsUsedCount,
    },
    gameData: {
      chain,
      current,
    },
    enemyState: {
      encounter,
      enemyHP,
      encounterMessage,
      nextEnemyAttack,
      enemyNextAction,
    },
    modalState: {
      bossOverlay,
    },
    utilityFunctions: {
      log,
    },
  });
}

function handleLootDrop() {
  externalHandleLootDrop({
    playerState: {
      playerHP,
      playerName,
      playerClass,
      specialUsesLeft,
      weaponBonus,
      shieldBonus,
      playerGold,
    },
    utilityFunctions: {
      log,
    },
  });
}

function handleShopPurchase(item) {
  let purchased = false;
  if (playerGold.value >= item.cost) {
    playerGold.value -= item.cost;
    purchased = true;
    log(
      `💸 <span class="player-name">${playerName.value}</span> purchased ${item.name} for ${item.cost} Gold.`
    );

    switch (item.effect) {
      case "health":
        playerHP.value = Math.min(
          playerHP.value + item.amount,
          playerClass.value.maxHP
        );
        log(`➕ ${playerName.value} gained ${item.amount} HP.`);
        break;
      case "weapon":
        weaponBonus.value += item.amount;
        log(`🗡️ ${playerName.value} gained +${item.amount} Weapon Bonus.`);
        break;
      case "shield":
        shieldBonus.value += item.amount;
        log(`🛡️ ${playerName.value} gained +${item.amount} Defense Bonus.`);
        break;
      case "special":
        specialUsesLeft.value += item.amount;
        log(`✨ ${playerName.value} gained +${item.amount} Ability charges.`);
        break;
      case "longRest":
        longRestsUsed.value = Math.max(0, longRestsUsed.value - item.amount);
        log(`🛌 ${playerName.value} refreshed ${item.amount} Long Rest(s).`);
        break;
      case "shortRest":
        shortRestsUsed.value = Math.max(0, shortRestsUsed.value - item.amount);
        log(`🧘 ${playerName.value} refreshed ${item.amount} Short Rest(s).`);
        break;
      case "blurCure":
        blurClicksLeft.value = 0;
        log(`🧼 ${playerName.value} sobered up and vision is clear!`);
        break;
    }
  } else {
    log(
      `❌ Not enough Gold for ${item.name}! (Cost: ${item.cost}, You have: ${playerGold.value})`
    );
  }
}

function markBossDefeated() {
  bossDefeated.value = true;
  current.value = chain[chain.length - 1];
  clearInterval(timerInterval);
  bossOverlay.value = false;
}

function resetGame() {
  clearInterval(timerInterval);
  const newChain = getRandomChain();
  chain.splice(0, chain.length, ...newChain);
  current.value = chain[0];
  weaponBonus.value = 0;
  poisonedClicksLeft.value = 0;
  poisonDamagePerClick.value = 0;
  shieldBonus.value = 0;
  currentTargetIndex.value = 0;
  clickCount.value = 0;
  shortcutsUsedCount.value = 0;
  combatEncountersFought.value = 0;
  totalSpecialsUsed.value = 0;
  path.value = [current.value];
  encounter.value = null;
  playerHP.value = 0;
  enemyHP.value = DEFAULT_ENEMY_HP;
  nextEnemyAttack.value = null;
  enemyNextAction.value = "attack";
  specialUsesLeft.value = 5;
  playerClass.value = null;
  playerHP.value = -1;
  gameLog.value = [];
  encounterMessage.value = "";
  playerName.value = "";
  weaponBonus.value = 0;
  enemyStatusEffects.value = [];
  enemyIsStunned.value = false;
  seenLoreEncounters.value = [];
  seenNPCEncounters.value = [];
  currentEnemy.value = null; 
  selectedBossType.value = "";
  bossSpawned.value = false;
  bossDefeated.value = false;
  shortRestsUsed.value = 0;
  showRestModal.value = false;
  longRestsUsed.value = 0;
  hasReachedFinalArticle.value = false;
  bossOverlay.value = false;
  defeated.value = false;
  blurClicksLeft.value = 0;
  timer.value = 0;
  playerGold.value = 0;
  showShopModal.value = false;
  timerInterval = setInterval(() => {
    timer.value++;
  }, 1000);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => {
  timerInterval = setInterval(() => {
    timer.value++;
  }, 1000);
});

onBeforeUnmount(() => {
  clearInterval(timerInterval);
});
</script>

<style scoped>
.timer {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.player-name {
  color: rgb(160, 178, 226);
  text-transform: uppercase;
}

.dim-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0);
  pointer-events: none;
  transition: background-color 1.5s ease-in-out;
  z-index: 99;
}

.dim-overlay.active-overlay {
  background-color: rgba(0, 0, 0, 0.6);
  pointer-events: auto;
}

@media screen and (max-width: 600px) {
  .timer {
    font-size: 13px;
    margin-top: 0.1rem;
  }
}
</style>
