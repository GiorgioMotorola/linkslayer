<template>
  <Header
    :start="chain[currentTargetIndex]"
    :targets="chain[currentTargetIndex + 1]"
    :clicks="clickCount"
    :path="path"
    :playerClass="playerClass"
    :specialUsesLeft="specialUsesLeft"
    :playerHP="playerHP"
    :maxHP="playerClass?.maxHP"
    :effectiveMaxHP="effectiveMaxHP"
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
    :compass-count="inventory.compass"
    :shieldBonus="shieldBonus"
    :weaponBonus="weaponBonus"
    :longRestsUsed="longRestsUsed"
    :isDarkened="bossOverlay"
    :shortRestsUsed="shortRestsUsed"
    :playerGold="playerGold"
    @show-tips="showTipsModal = true"
    :game-chain="chain"
    @open-inventory-modal="openInventoryModal"
    :is-cloak-active="isCloakActive"
    :cloak-clicks-remaining="cloakClicksRemaining"
    :combatWinsSinceLastCapIncrease="combatWinsSinceLastCapIncrease"
    :hpCapBonus="hpCapBonus"
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
        :shopItems="shopItems"
        :weaponBonus="weaponBonus"
        :shieldBonus="shieldBonus"
        :specialUsesLeft="specialUsesLeft"
      />

      <InventoryModal
        v-if="isInventoryModalOpen"
        :inventory="inventory"
        @close="closeInventoryModal"
        @use-item="handleUseInventoryItem"
        :is-cloak-active="isCloakActive"
        :cloak-clicks-remaining="cloakClicksRemaining"
      />
    </div>
  </div>

  <div class="dim-overlay" :class="{ 'active-overlay': bossOverlay }"></div>
</template>

<script setup>
import {
  ref,
  reactive,
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
import { handleEnemyTurn as externalHandleEnemyTurn } from "@/utils/enemyTurnHandler";
import InventoryModal from "@/components/InventoryModal.vue";
import { shopItems } from "@/utils/shopItems";

const journeyLength = ref(3);
const chain = getRandomChain(journeyLength.value);
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
const combatWinsSinceLastCapIncrease = ref(0);
const hpCapBonus = ref(0);
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
const HEALTH_POTION_HEAL_AMOUNT = 30;
const TURKEY_LEG_HEAL_AMOUNT = 6;
const isCloakActive = ref(false);
const CLOAK_DURATION = 10;
const cloakClicksRemaining = ref(0);
const inventory = ref({
  compass: 0,
  healthPotions: 0,
  turkeyLegs: 0,
  invisibilityCloaks: 0,
});

const isInventoryModalOpen = ref(false);

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

const effectiveMaxHP = computed(() => {
  return playerClass.value ? playerClass.value.maxHP + hpCapBonus.value : 0;
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

  if (isCloakActive.value) {
    cloakClicksRemaining.value--;
    log(
      `✨ Cloak of Invisibility active: ${cloakClicksRemaining.value} clicks remaining.`
    );

    if (cloakClicksRemaining.value <= 0) {
      isCloakActive.value = false;
      cloakClicksRemaining.value = 0;
      log(`👻 The Cloak of Invisibility fades away.`);
    }
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
      `🤢 You are poisoned. You lose ${poisonDamagePerClick.value} HP. ${poisonedClicksLeft.value} clicks left until the poison wears off.`
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

// src/views/GameView.vue (around line 304)
watch(clickCount, (newClicks) => {
  // ...
  if (poisonedClicksLeft.value > 0) {
    // Add these console.log statements
    console.log("DEBUG: Applying poison damage.");
    console.log("DEBUG: playerHP.value before poison:", playerHP.value);
    console.log(
      "DEBUG: poisonDamagePerClick.value:",
      poisonDamagePerClick.value
    );

    // Ensure poisonDamagePerClick.value is a number right before use
    const effectivePoisonDamage = Number(poisonDamagePerClick.value);
    if (isNaN(effectivePoisonDamage)) {
      console.error(
        "CRITICAL ERROR: poisonDamagePerClick.value is NaN before application! Resetting to 0.",
        poisonDamagePerClick.value
      );
      poisonDamagePerClick.value = 0; // Reset it to a safe value
      playerHP.value = Math.max(0, playerHP.value - 0); // Apply 0 damage
    } else {
      playerHP.value = Math.max(0, playerHP.value - effectivePoisonDamage);
    }

    poisonedClicksLeft.value--; // This needs to happen regardless
    log(
      `🤢 You are poisoned. You lose ${effectivePoisonDamage} HP. ${poisonedClicksLeft.value} clicks left until the poison wears off.`
    );
    // ... rest of your poison logic
  }
  // ...
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
  return current.value === chain[journeyLength.value - 1] && bossDefeated.value;
});

async function callHandleClick(title) {
  const finalTarget = chain[journeyLength.value - 1];

  await externalHandleClick({
    title,
    playerState: {
      clickCount,
      path,
      currentTargetIndex,
      combatEncountersFought,
      combatWinsSinceLastCapIncrease,
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
      journeyLength,
      finalTarget,
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
    isCloakActive,
    cloakClicksRemaining,
    setIsCloakActive: (value) => (isCloakActive.value = value),
    setCloakClicksRemaining: (value) => (cloakClicksRemaining.value = value),
  });
}

function callHandleRest(choice) {
  handleRest({
    player: {
      playerHP,
      playerClass,
      specialUsesLeft,
      playerName,
      effectiveMaxHP: effectiveMaxHP.value,
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
      effectiveMaxHP: effectiveMaxHP.value,
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
      combatWinsSinceLastCapIncrease,
      hpCapBonus,
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
      playerHP,
      effectiveMaxHP: effectiveMaxHP.value,
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
    current.value = chain[journeyLength.value - 1];
  }

  const lastTitle = path.value[path.value.length - 1];
  if (lastTitle === chain[currentTargetIndex.value + 1]) {
    currentTargetIndex.value++;
  }

  if (lastTitle === chain[journeyLength.value - 1]) {
    clearInterval(timerInterval);
  }
}

function handleClassSelection({ classKey, name, journeyLength: selectedLen }) {
  playerClass.value = classes[classKey];
  playerHP.value = playerClass.value.maxHP;
  playerName.value = name;
  journeyLength.value = selectedLen;

  const newChain = getRandomChain(journeyLength.value);
  chain.splice(0, chain.length, ...newChain);
  current.value = chain[0];
  path.value = [current.value];

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
  log(`Journey length: ${journeyLength.value} articles.`);
}

async function callHandleEncounterOption(option) {
  const encounterResult = await externalHandleEncounterOption({
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
      inventory,
      effectiveMaxHP: effectiveMaxHP.value,
    },
    gameData: {
      chain,
      current,
      formattedTitle: formattedTitle.value,
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
      effectiveMaxHP: effectiveMaxHP.value,
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
          effectiveMaxHP.value
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
        log(`🧼 ${playerName.value} sobered up.`);
        break;

      case "inventoryItem":
        if (item.details === "compass") {
          inventory.value.compass++;
          log(`🧭 ${playerName.value} acquired an Arcane Compass!`);
        } else if (item.details === "healthPotion") {
          inventory.value.healthPotions++;
          log(`➕ ${playerName.value} acquired a Health Potion!`);
        } else if (item.details === "turkeyLeg") {
          inventory.value.turkeyLegs++;
          log(`🍗 ${playerName.value} acquired a Turkey Leg!`);
        } else if (item.details === "invisibilityCloak") {
          inventory.value.invisibilityCloaks++;
          log(`👻 ${playerName.value} acquired a Cloak of Invisibility!`);
          console.log("Inventory after cloak purchase:", inventory.value);
        }
        break;

      default:
        break;
    }
  } else {
    log(
      `❌ Not enough Gold for ${item.name}. (Cost: ${item.cost}, You have: ${playerGold.value})`
    );
  }
}

function useCompass() {
  const fullChain = chain;

  if (inventory.value.compass <= 0) {
    log(`🧭 You don't have any Arcane Compasses to use!`);
    return;
  }

  inventory.value.compass--;
  log(`🧭 You use an Arcane Compass!`);

  if (!fullChain || fullChain.length === 0) {
    log(
      `🧭 The compass spins wildly; there's no defined path to jump within yet!`
    );

    console.warn(
      "useCompass: Attempted to use compass when fullChain is undefined or empty."
    );
    closeInventoryModal();
    return;
  }

  if (
    encounter.value &&
    encounter.value.type === "combat" &&
    isBoss(encounter.value.enemy)
  ) {
    log(`🚫 You cannot use the Arcane Compass during a boss battle!`);
    return;
  }

  const startArticle = fullChain[0];
  const endArticle = fullChain[fullChain.length - 1];

  const potentialTargets = fullChain.filter((article) => {
    return (
      article !== startArticle &&
      article !== endArticle &&
      article !== current.value
    );
  });

  if (potentialTargets.length > 0) {
    const randomIndex = Math.floor(Math.random() * potentialTargets.length);
    const targetArticle = potentialTargets[randomIndex];

    current.value = targetArticle;
    path.value.push(targetArticle);
    clickCount.value++;
    shortcutsUsedCount.value++;

    log(
      `🧭 The compass pulls you, disorienting you for a moment, then guides you directly to ${targetArticle.replaceAll(
        "_",
        " "
      )}!`
    );

    const targetIndexInChain = fullChain.indexOf(targetArticle);
    currentTargetIndex.value = targetIndexInChain;

    log(`✨ You feel a step closer to your goal.`);
  } else {
    log(
      `🧭 The compass seems confused; there are no intermediate paths to jump to. (Perhaps you're at the start/end or only one article in length?)`
    );
  }

  if (encounter.value) {
    log(`The previous encounter was disrupted by the compass's pull.`);
    encounter.value = null;
    bossOverlay.value = false;
  }
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

const useHealthPotion = () => {
  if (inventory.value.healthPotions > 0) {
    inventory.value.healthPotions--;
    playerHP.value = Math.min(
      playerHP.value + HEALTH_POTION_HEAL_AMOUNT,
      effectiveMaxHP.value
    );
    log(
      `You consumed a Health Potion and recovered ${HEALTH_POTION_HEAL_AMOUNT} HP! Your HP is now ${playerHP.value}.`
    );
    closeInventoryModal();
  } else {
    log("You don't have any Health Potions to use.");
  }
};

const useTurkeyLeg = () => {
  if (inventory.value.turkeyLegs > 0) {
    inventory.value.turkeyLegs--;
    playerHP.value = Math.min(
      playerHP.value + TURKEY_LEG_HEAL_AMOUNT,
      effectiveMaxHP.value
    );
    log(
      `🍖 You consumed a Turkey Leg and recovered ${TURKEY_LEG_HEAL_AMOUNT} HP! Your HP is now ${playerHP.value}.`
    );
    closeInventoryModal();
  } else {
    log("You don't have any Turkey Legs to use.");
  }
};
const useInvisibilityCloak = () => {
  if (isCloakActive.value) {
    log(`👻 The Cloak of Invisibility is already active!`);
    return;
  }
  if (inventory.value.invisibilityCloaks > 0) {
    inventory.value.invisibilityCloaks--;
    isCloakActive.value = true;
    cloakClicksRemaining.value = CLOAK_DURATION;
    log(
      `👻 You don the Cloak of Invisibility! You will avoid non-boss encounters for ${CLOAK_DURATION} clicks.`
    );
    closeInventoryModal();
  } else {
    log(`👻 You don't have a Cloak of Invisibility.`);
  }
};

function markBossDefeated() {
  bossDefeated.value = true;
  current.value = chain[journeyLength.value - 1];
  clearInterval(timerInterval);
  bossOverlay.value = false;
}

function openInventoryModal() {
  isInventoryModalOpen.value = true;
  console.log("Inventory modal opened!");
  console.log("isInventoryModalOpen value:", isInventoryModalOpen.value);
}

function closeInventoryModal() {
  isInventoryModalOpen.value = false;
}

function handleUseInventoryItem(itemType) {
  if (itemType === "compass") {
    useCompass();
  } else if (itemType === "healthPotion") {
    useHealthPotion();
  } else if (itemType === "turkeyLeg") {
    useTurkeyLeg();
  } else if (itemType === "invisibilityCloak") {
    useInvisibilityCloak();
  }
}

function resetGame() {
  clearInterval(timerInterval);

  const newChain = getRandomChain(journeyLength.value);
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
  gameLog.value = [];
  encounterMessage.value = "";
  playerName.value = "";
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
  bossOverlay.value = false;
  defeated.value = false;
  blurClicksLeft.value = 0;
  timer.value = 0;
  playerGold.value = 0;
  showShopModal.value = false;
  inventory.value.compass = 0;
  inventory.value.healthPotions = 0;
  hasReachedFinalArticle.value = false;
  showTipsModal.value = false;
  inventory.value.invisibilityCloaks = 0;
  isCloakActive.value = false;
  cloakClicksRemaining.value = 0;
  combatWinsSinceLastCapIncrease.value = 0;
  hpCapBonus.value = 0;

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
