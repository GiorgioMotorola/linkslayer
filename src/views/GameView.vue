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
    :formattedTitle="formattedTitle"
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
        :shieldBonus="shieldBonus"
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
        :shieldBonus="shieldBonus"
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
        :is-health-regen-active="healthRegenActive"
        :is-poisoned="isPlayerPoisoned"
        :is-in-combat="isInCombat"
        :is-boss-encounter="isBossEncounter"
        :playerHP="playerHP"
        :effectiveMaxHP="effectiveMaxHP"
        :is-blurred="isBlurred"
        :enlightenment-fish-hp="enlightenmentFishAccumulatedHP"
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
import { handleMiniBossLootDrop } from "@/utils/miniBossLootHandler";
import InventoryModal from "@/components/InventoryModal.vue";
import { shopItems } from "@/utils/shopItems";
import {
  handleShopPurchase as externalHandleShopPurchase,
  useCompass as externalUseCompass,
  useHealthPotion as externalUseHealthPotion,
  useTurkeyLeg as externalUseTurkeyLeg,
  useInvisibilityCloak as externalUseInvisibilityCloak,
  useHerbalPoultice as externalUseHerbalPoultice,
  useBarkTea as externalUseBarkTea,
  useFrenchOnionSoup as externalUseFrenchOnionSoup,
  useAntidote as externalUseAntidote,
  useSmokeBomb as externalUseSmokeBomb,
  useAdventurersRations as externalUseAdventurersRations,
  useEnlightenmentFish as externalUseEnlightenmentFish,
} from "@/utils/itemHandlers";

const journeyLength = ref(3);
const chain = getRandomChain(journeyLength.value);
const current = ref(chain[0]);
const formattedStart = computed(() => chain[0]?.replaceAll("_", " ") ?? "");
const formattedTitle = computed(
  () => current.value?.replaceAll("_", " ") ?? ""
);
const isPlayerPoisoned = computed(() => poisonedClicksLeft.value > 0);
const isInCombat = computed(
  () => encounter.value && encounter.value.type === "combat"
);
const isBossEncounter = computed(
  () => isInCombat.value && isBoss(encounter.value.enemy)
);

const isBlurred = computed(() => blurClicksLeft.value > 0);

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
const BARK_TEA_HEAL_AMOUNT = 8;
const FRENCH_ONION_SOUP_HEAL_AMOUNT = 10;
const FRENCH_ONION_SOUP_SPECIAL_AMOUNT = 1;
const ADVENTURERS_RATIONS_HEAL_AMOUNT = 7;
const enlightenmentFishAccumulatedHP = ref(0);
const isCloakActive = ref(false);
const CLOAK_DURATION = 10;
const cloakClicksRemaining = ref(0);
const healthRegenActive = ref(false);
const healthRegenAmount = ref(0);
const healthRegenClicksRemaining = ref(0);
const healthRegenMaxHeal = ref(0);
const healthRegenHealedCount = ref(0);
const inventory = ref({
  compass: 0,
  healthPotions: 0,
  turkeyLegs: 0,
  invisibilityCloaks: 0,
  stickItem: 0,
  herbalPoultices: 0,
  barkTea: 0,
  frenchOnionSoups: 0,
  antidotes: 0,
  smokeBombs: 0,
  adventurersRations: 0,
  enlightenmentFish: 0,
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

  let netHealthChange = 0;

  if (poisonedClicksLeft.value > 0) {
    const effectivePoisonDamage = Number(poisonDamagePerClick.value);
    if (isNaN(effectivePoisonDamage)) {
      console.error(
        "CRITICAL ERROR: poisonDamagePerClick.value is NaN! Resetting to 0.",
        poisonDamagePerClick.value
      );
      poisonDamagePerClick.value = 0;
    } else {
      netHealthChange -= effectivePoisonDamage;
      log(`🤢 You are poisoned. You lose ${effectivePoisonDamage} HP.`);
    }
    poisonedClicksLeft.value--;
    if (poisonedClicksLeft.value <= 0) {
      log(`✅ The poison wears off.`);
    } else {
      log(
        `🤢 ${poisonedClicksLeft.value} clicks left until the poison wears off.`
      );
    }
  }

  if (healthRegenActive.value) {
    if (
      healthRegenClicksRemaining.value > 0 &&
      healthRegenHealedCount.value < healthRegenMaxHeal.value
    ) {
      const potentialHeal = healthRegenAmount.value;
      const remainingHealCapacity =
        effectiveMaxHP.value - (playerHP.value + netHealthChange);
      const remainingTotalHealFromPoultice =
        healthRegenMaxHeal.value - healthRegenHealedCount.value;

      const actualHeal = Math.min(
        potentialHeal,
        remainingHealCapacity,
        remainingTotalHealFromPoultice
      );

      if (actualHeal > 0) {
        netHealthChange += actualHeal;
        healthRegenHealedCount.value += actualHeal;
        log(
          `🌱 You feel a surge of vitality! Healed ${actualHeal} HP from Herbal Poultice.`
        );
      }

      healthRegenClicksRemaining.value--;

      if (
        healthRegenClicksRemaining.value <= 0 ||
        healthRegenHealedCount.value >= healthRegenMaxHeal.value
      ) {
        healthRegenActive.value = false;
        healthRegenAmount.value = 0;
        healthRegenClicksRemaining.value = 0;
        healthRegenMaxHeal.value = 0;
        healthRegenHealedCount.value = 0;
        log(`✅ The Herbal Poultice's effect wears off.`);
      }
    } else {
      healthRegenActive.value = false;
      healthRegenAmount.value = 0;
      healthRegenClicksRemaining.value = 0;
      healthRegenMaxHeal.value = 0;
      healthRegenHealedCount.value = 0;
      log(`✅ The Herbal Poultice's effect wears off.`);
    }
  }

  playerHP.value = Math.min(
    effectiveMaxHP.value,
    Math.max(0, playerHP.value + netHealthChange)
  );

  if (playerHP.value <= 0 && !defeated.value) {
    log(
      `💀 <span class="player-name">${playerName.value}</span> was defeated.`
    );
    defeated.value = true;
    clearInterval(timerInterval);
    encounter.value = null;
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

  if (inventory.value.enlightenmentFish > 0) {
    enlightenmentFishAccumulatedHP.value++;
    log(
      `🐟 The Fish of Eternal Enlightenment shimmers, gaining 1 HP. (Total: ${enlightenmentFishAccumulatedHP.value} HP)`
    );
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
      isBoss,
    },
    isCloakActive,
    cloakClicksRemaining,
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
  const handleLoot = (defeatedEnemyData) => {
    const lootHandlerArgs = {
      playerState: {
        playerHP,
        playerName,
        playerClass,
        specialUsesLeft,
        weaponBonus,
        shieldBonus,
        playerGold,
        effectiveMaxHP: effectiveMaxHP.value,
        inventory,
      },
      utilityFunctions: {
        log,
      },
    };

    if (isBoss(defeatedEnemyData)) {
      log(
        `✨ The ${defeatedEnemyData.name} dissipates, leaving no worldly possessions behind.`
      );
      markBossDefeated();
    } else if (defeatedEnemyData.isMiniBoss) {
      handleMiniBossLootDrop(lootHandlerArgs);
    } else {
      externalHandleLootDrop(lootHandlerArgs);
    }
  };

  handleCombatAction({
    player: {
      playerHP,
      playerClass,
      specialUsesLeft,
      weaponBonus,
      shieldBonus,
      playerName,
      action: playerAction,
      effectiveMaxHP,
      totalSpecialsUsed,
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
      handleLootDrop: handleLoot,
      markBossDefeated,
      gotoEnemyTurn,
      bossOverlay: bossOverlay,
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
  if (playerClass.value.startingHealthPotionBonus) {
    inventory.value.healthPotions = playerClass.value.startingHealthPotionBonus;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingHealthPotionBonus} starting Health Potions.`
    );
  }
  if (playerClass.value.startingInvisibilityCloaks) {
    inventory.value.invisibilityCloaks =
      playerClass.value.startingInvisibilityCloaks;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingInvisibilityCloaks} starting Invisibility Cloaks.`
    );
  }
  if (playerClass.value.startingPlayerGold) {
    playerGold.value = playerClass.value.startingPlayerGold;
    log(
      `🗡️ <span class="player-name">${playerName.value}</span> gains +${playerClass.value.startingPlayerGold} starting Gold.`
    );
  }
  log(`Player name: ${playerName.value}`);
  log(`Class selected: ${playerClass.value.name}`);
  log(`Journey length: ${journeyLength.value} articles.`);
}

//playerGold.value = 0;

async function callHandleEncounterOption(option) {
  await externalHandleEncounterOption({
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

function handleShopPurchase(item) {
  externalHandleShopPurchase(
    item,
    {
      playerGold,
      playerHP,
      effectiveMaxHP,
      weaponBonus,
      shieldBonus,
      specialUsesLeft,
      longRestsUsed,
      shortRestsUsed,
      blurClicksLeft,
      inventory,
    },
    {
      playerName,
    },
    {
      log,
    }
  );
}

function useCompass() {
  externalUseCompass(
    {
      inventory,
      current,
      path,
      clickCount,
      shortcutsUsedCount,
      currentTargetIndex,
    },
    {
      chain,
      formattedTitle,
    },
    {
      bossOverlay,
    },
    {
      log,
      isBoss,
      nextTick,
      closeInventoryModal,
    },
    {
      encounter,
    }
  );
}

const useHealthPotion = () => {
  externalUseHealthPotion(
    {
      inventory,
      playerHP,
      effectiveMaxHP,
    },
    {
      log,
    },
    {
      HEALTH_POTION_HEAL_AMOUNT,
    }
  );
};

const useTurkeyLeg = () => {
  externalUseTurkeyLeg(
    {
      inventory,
      playerHP,
      effectiveMaxHP,
    },
    {
      log,
    },
    {
      TURKEY_LEG_HEAL_AMOUNT,
    }
  );
};

const useBarkTea = () => {
  externalUseBarkTea(
    {
      inventory,
      playerHP,
      effectiveMaxHP,
    },
    {
      log,
    },
    {
      BARK_TEA_HEAL_AMOUNT,
    }
  );
};

const useFrenchOnionSoup = () => {
  externalUseFrenchOnionSoup(
    {
      inventory,
      playerHP,
      specialUsesLeft,
      effectiveMaxHP,
    },
    {
      log,
    },
    {
      FRENCH_ONION_SOUP_HEAL_AMOUNT,
      FRENCH_ONION_SOUP_SPECIAL_AMOUNT,
    }
  );
};

const useAntidote = () => {
  externalUseAntidote(
    {
      inventory,
      poisonedClicksLeft,
      poisonDamagePerClick,
    },
    {
      log,
      closeInventoryModal,
    }
  );
};

const useInvisibilityCloak = () => {
  externalUseInvisibilityCloak(
    {
      isCloakActive,
      inventory,
      cloakClicksRemaining,
    },
    {
      log,
    },
    {
      CLOAK_DURATION,
    }
  );
};

const useHerbalPoultice = () => {
  externalUseHerbalPoultice(
    {
      inventory,
      healthRegenActive,
      healthRegenAmount,
      healthRegenClicksRemaining,
      healthRegenMaxHeal,
      healthRegenHealedCount,
    },
    {
      log,
    }
  );
};

const useSmokeBomb = () => {
  externalUseSmokeBomb(
    {
      inventory,
    },
    {
      log,
      isBoss,
      closeInventoryModal,
    },
    {
      encounter,
    },
    {
      bossOverlay,
    }
  );
};

const useAdventurersRations = () => {
  externalUseAdventurersRations(
    {
      inventory,
      playerHP,
      blurClicksLeft,
      effectiveMaxHP,
    },
    {
      log,
      closeInventoryModal,
    },
    {
      ADVENTURERS_RATIONS_HEAL_AMOUNT,
    }
  );
};

const useEnlightenmentFish = () => {
  externalUseEnlightenmentFish(
    {
      inventory,
      playerHP,
      effectiveMaxHP,
    },
    {
      log,
    },
    {
      enlightenmentFishAccumulatedHP,
    }
  );
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
  } else if (itemType === "herbalPoultice") {
    useHerbalPoultice();
  } else if (itemType === "barkTea") {
    useBarkTea();
  } else if (itemType === "frenchOnionSoup") {
    useFrenchOnionSoup();
  } else if (itemType === "antidote") {
    useAntidote();
  } else if (itemType === "smokeBomb") {
    useSmokeBomb();
  } else if (itemType === "adventurersRations") {
    useAdventurersRations();
  } else if (itemType === "enlightenmentFish") {
    useEnlightenmentFish();
  }
}

function resetGame() {
  location.reload();
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
