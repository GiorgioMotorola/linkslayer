<template>
  <Header
    :start="chain[currentTargetIndex]"
    :targets="chain[currentTargetIndex + 1]"
    :clicks="clickCount"
    :daysCount="daysCount"
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
    :enemyTurnKey="enemyTurnKey"
    :message="encounterMessage"
    @action="handleCombatActionWrapper"
    @option-chosen="handleOptionChosen"
    @close="handleCloseEncounterWrapper"
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
    @open-map-modal="isMapModalOpen = true"
    :lastDiceRoll="lastDiceRoll"
    :lastDamageDealt="lastDamageDealt"
    :lastDamageTaken="lastDamageTaken"
    :counterResult="counterResult"
    :specialTier="specialTier"
    :playerGoal="playerGoal"
    :enemyStatusEffects="enemyStatusEffects"
    :confusedAction="confusedAction"
    :confusedTurnsLeft="confusedTurnsLeft"
    :autoSaveFeedback="autoSaveFeedback"
    @restart="handleRestart"
  />

  <Transition name="sleep-fade">
    <div v-if="isSleeping" class="sleep-overlay"></div>
  </Transition>

  <div class="main-content-wrapper">
    <div v-if="isLoadingGame" class="game-loader-overlay">
      <div class="loader-content">
        <div class="spinner"></div>
      </div>
    </div>
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
        :daysCount="daysCount"
        :path="path"
        :timer="formattedTimer"
        :targets="chain"
        :combatEncountersFought="combatEncountersFought"
        :enemiesKilled="enemiesKilled"
        :playerHP="playerHP"
        :weaponBonus="weaponBonus"
        :shieldBonus="shieldBonus"
        :specialsUsed="totalSpecialsUsed"
        :longRestsUsed="longRestsUsed"
        :shortRestsUsed="shortRestsUsed"
        :playerName="playerName"
        :playerClass="playerClass"
        :playerGoal="playerGoal"
        :playerGold="playerGold"
        :goldSpent="goldSpent"
        :specialTier="specialTier"
        @close="resetGame"
        :gameLog="gameLog"
        :lastBattle="lastBattle"
        @restart="handleRestart"
      />

      <DefeatModal
        v-if="defeated"
        :clicks="clickCount"
        :daysCount="daysCount"
        :path="path"
        :timer="formattedTimer"
        :targets="chain"
        :combatEncountersFought="combatEncountersFought"
        :enemiesKilled="enemiesKilled"
        :playerHP="playerHP"
        :weaponBonus="weaponBonus"
        :shieldBonus="shieldBonus"
        :specialsUsed="totalSpecialsUsed"
        :longRestsUsed="longRestsUsed"
        :shortRestsUsed="shortRestsUsed"
        :playerName="playerName"
        :playerClass="playerClass"
        :playerGoal="playerGoal"
        :playerGold="playerGold"
        :goldSpent="goldSpent"
        :specialTier="specialTier"
        @close="resetGame"
        :gameLog="gameLog"
        :lastBattle="lastBattle"
        @restart="handleRestart"
      />

      <ArticleViewer
        :articleTitle="current"
        :start="chain[0]"
        :targets="chain[currentTargetIndex + 1]"
        :inEncounter="inEncounter"
        @link-clicked="handleLinkClicked"
        @open-map="isMapModalOpen = true"
        :path="path"
        :fullChain="chain"
        :currentTargetIndex="currentTargetIndex"
        :isBlurred="blurClicksLeft > 0"
        :clickCount="clickCount"
        :longRestDismissCount="longRestDismissCount"
        :autoSaveFeedback="autoSaveFeedback"
      />

      <RestModal
        :showRestModal="showRestModal"
        :shortRestsUsed="shortRestsUsed"
        :longRestsUsed="longRestsUsed"
        :weaponPieces="inventory.weaponPieces"
        :defensePieces="inventory.defensePieces"
        :restModalCount="restModalCount"
        :specialTier="specialTier"
        :offeringPot="offeringPot"
        :playerGold="playerGold"
        :nextOfferingCost="nextOfferingCost"
        :questScrolls="inventory.questScrolls"
        :questTaken="questTaken"
        :questComplete="questComplete"
        :questTurnedIn="questTurnedIn"
        @rest="handleRest"
        @assemble-upgrade="handleAssembleUpgradeWrapper"
        @offer="callHandleOffer"
        @sleep="handleSleepTransition"
        @order-beer="handleOrderBeer"
        @sip-beer="handleSipBeer"
        @order-meal="handleOrderMeal"
        @bite-meal="handleBiteMeal"
        @open-die-slayer="openDieSlayerFromTavern"
        @take-quest="handleTakeQuest"
        @turn-in-quest="handleTurnInQuest"
      />

      <ShopModal
        v-show="showShopModal && !showDieSlayer"
        :playerGold="playerGold"
        @buy="handleShopPurchase"
        @close="showShopModal = false"
        :shopItems="shopItems"
        :weaponBonus="weaponBonus"
        :shieldBonus="shieldBonus"
        :specialUsesLeft="specialUsesLeft"
        @open-backpack="openInventoryModal"
        @open-die-slayer="openDieSlayerFromShop"
      />

      <DieSlayerModal
        v-if="showDieSlayer"
        :playerGold="playerGold"
        @gold-change="handleDieSlayerGold"
        @leave="handleDieSlayerLeave"
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
        :amulet-of-shared-suffering-damage="AMULET_ENEMY_DAMAGE"
        :health-regen-clicks-remaining="healthRegenClicksRemaining"
        :is-serrated-dagger-active="serratedDaggerActive"
        :is-lucky-flee-active="luckyFleeActive"
        :warding-shield-hits-remaining="wardingShieldHitsRemaining"
        :is-ward-stone-active="wardStoneActive"
        :ward-stone-clicks-remaining="wardStoneClicksRemaining"
        :is-encounter-beacon-active="encounterBeaconActive"
        :gold-pouch-accumulated-gold="goldPouchAccumulatedGold"
        :is-bounty-scroll-active="bountyScrollActive"
        :isIdle="isIdle"
      />

      <MapModal
        v-if="isMapModalOpen"
        :fullChain="chain"
        :currentTargetIndex="currentTargetIndex"
        @close="isMapModalOpen = false"
      />

    </div>
  </div>

  <Transition name="quest-notif-fade">
    <div v-if="showQuestNotification" class="quest-notification">
      <div class="quest-notif-label">Quest Started</div>
      <div class="quest-notif-name">The Growling Dark</div>
    </div>
  </Transition>

  <div class="dim-overlay" :class="{ 'active-overlay': bossOverlay }"></div>

  <Transition name="campfire-fade">
    <CampfireOverlay
      v-if="showCampfireOverlay && campfireReward"
      :reward="campfireReward"
      @done="handleCampfireReward"
    />
  </Transition>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from "vue";
import ArticleViewer from "@/components/ArticleViewer.vue";
import Header from "@/components/Header.vue";
import VictoryModal from "@/components/VictoryModal.vue";
import ClassSelect from "@/components/ClassSelect.vue";
import DefeatModal from "@/components/DefeatModal.vue";
import RestModal from "@/components/RestModal.vue";
import ShopModal from "@/components/ShopModal.vue";
import InventoryModal from "@/components/InventoryModal.vue";
import MapModal from "@/components/MapModal.vue";
import DieSlayerModal from "@/components/DieSlayerModal.vue";
import CampfireOverlay from "@/components/CampfireOverlay.vue";

import { shopItems as allShopItems } from "@/utils/shopItems";
import { isBoss } from "@/utils/bossGenerator";
import { generateMiniBoss } from "@/utils/miniBossGenerator";
import { QUESTS } from "@/utils/quests";
import { classes } from "@/utils/classes";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/composables/useAuth";

import { useGameFlow } from "@/composables/useGameFlow";
import { useGameLog } from "@/composables/useGameLog";
import { useModals } from "@/composables/useModals";
import { usePlayerState } from "@/composables/usePlayerState";
import { useInventory } from "@/composables/useInventory";
import { useStatusEffects } from "@/composables/useStatusEffects";
import { useCombat } from "@/composables/useCombat";
import { useGameHandlers } from "@/composables/useGameHandlers";

const gameFlow = useGameFlow();
const {
  chain,
  current,
  currentTargetIndex,
  path,
  journeyLength,
  formattedStart,
  formattedTitle,
  clickCount,
  shortcutsUsedCount,
  timerInterval,
  formattedTimer,
  defeated,
  isLoadingGame,
  isGameComplete,
  bossOverlay,
  combatEncountersFought,
  enemiesKilled,
  combatWinsSinceLastCapIncrease,
  hpCapBonus,
  bossDefeated,
  enemyDifficultyLevel,
  seenLoreEncounters,
  seenNPCEncounters,
  resetGame,
} = gameFlow;

const { user } = useAuth();

const { gameLog, log, logEnemyAction, restoreLog } = useGameLog(() => formattedTimer.value);

const modals = useModals();
const {
  showRestModal,
  showShopModal,
  showTipsModal,
  isInventoryModalOpen,
  isMapModalOpen,
  restModalCount,
  longRestDismissCount,
  showCampfireOverlay,
  campfireReward,
  openInventoryModal,
  closeInventoryModal,
} = modals;

const showDieSlayer = ref(false);
const dieSlayerSource = ref("shop");

function openDieSlayerFromShop() {
  dieSlayerSource.value = "shop";
  showDieSlayer.value = true;
}

function openDieSlayerFromTavern() {
  dieSlayerSource.value = "tavern";
  showDieSlayer.value = true;
}

function handleDieSlayerLeave() {
  showDieSlayer.value = false;
  if (dieSlayerSource.value === "shop") {
    showShopModal.value = true;
  }
}

function handleDieSlayerGold(amount) {
  playerGold.value += amount;
}

function handleOrderBeer() {
  playerGold.value -= 10;
}

function handleSipBeer() {
  playerHP.value = Math.min(playerHP.value + 1, effectiveMaxHP.value);
}

function handleOrderMeal() {
  playerGold.value -= 15;
}

function handleBiteMeal() {
  playerHP.value = Math.min(playerHP.value + 12, effectiveMaxHP.value);
}

function handleCampfireReward(reward) {
  playerHP.value = Math.min(Number(playerHP.value) + 15, Number(effectiveMaxHP.value));
  const bonusLabels = { gold: `+${reward.amount} Gold`, weapon: `+${reward.amount} Weapon Damage`, shield: `+${reward.amount} Defense`, special: `+${reward.amount} Special Charges` };
  if (reward.type === "gold") playerGold.value += reward.amount;
  else if (reward.type === "weapon") weaponBonus.value += reward.amount;
  else if (reward.type === "shield") shieldBonus.value += reward.amount;
  else if (reward.type === "special") specialUsesLeft.value += reward.amount;
  log(`🔥 You rested at the ${reward.name}. You gained +15 HP and ${bonusLabels[reward.type]}.`);
  showCampfireOverlay.value = false;
  campfireReward.value = null;
}

const player = usePlayerState(hpCapBonus);
const {
  playerClass,
  playerName,
  playerHP,
  specialUsesLeft,
  totalSpecialsUsed,
  weaponBonus,
  shieldBonus,
  playerGold,
  goldSpent,
  shortRestsUsed,
  longRestsUsed,
  effectiveMaxHP,
  specialTier,
  offeringPot,
  playerGoal,
} = player;

const OFFERING_COSTS = [[10, 15, 20], [25, 30, 50]];
const nextOfferingCost = computed(() => {
  if (specialTier.value >= 3) return null;
  return OFFERING_COSTS[specialTier.value - 1][offeringPot.value];
});

const inventoryManager = useInventory();
const {
  inventory,
  enlightenmentFishAccumulatedHP,
  goldPouchAccumulatedGold,
  AMULET_ENEMY_DAMAGE,
  createItemHandlers,
} = inventoryManager;

const shopItems = computed(() =>
  allShopItems.filter((item) => {
    if (item.id === "gold_pouch" && inventory.value.goldPouches > 0) return false;
    if (item.id === "stick_item" && (inventory.value.stickItem > 0 || inventory.value.coolerStickItem > 0)) return false;
    if (item.id === "cooler_stick_item" && inventory.value.stickItem <= 0) return false;
    if (item.id === "cooler_stick_item" && inventory.value.coolerStickItem > 0) return false;
    if (item.id === "even_cooler_stick_item" && inventory.value.coolerStickItem <= 0) return false;
    if (item.id === "even_cooler_stick_item" && inventory.value.evenCoolerStickItem > 0) return false;
    return true;
  })
);

const statusEffects = useStatusEffects();
const {
  poisonedClicksLeft,
  poisonDamagePerClick,
  isPlayerPoisoned,
  isCloakActive,
  cloakClicksRemaining,
  blurClicksLeft,
  isBlurred,
  healthRegenActive,
  healthRegenAmount,
  healthRegenClicksRemaining,
  healthRegenMaxHeal,
  healthRegenHealedCount,
  serratedDaggerActive,
  luckyFleeActive,
  wardingShieldHitsRemaining,
  wardStoneActive,
  wardStoneClicksRemaining,
  encounterBeaconActive,
  bountyScrollActive,
  setupClickWatcher,
} = statusEffects;

const combat = useCombat();
const {
  encounter,
  encounterMessage,
  inEncounter,
  isInCombat,
  isBossEncounter,
  enemyHP,
  nextEnemyAttack,
  enemyNextAction,
  enemyTurnKey,
  enemyStatusEffects,
  confusedAction,
  confusedTurnsLeft,
} = combat;

setupClickWatcher({
  clickCount,
  playerHP,
  effectiveMaxHP,
  inventory,
  log,
  showRestModal,
  showShopModal,
  enlightenmentFishAccumulatedHP,
  goldPouchAccumulatedGold,
});

const lastBattle = ref({ enemyName: '', article: '' });

watch(encounter, (newVal) => {
  if (newVal?.type === 'combat' && newVal?.enemy) {
    lastBattle.value = {
      enemyName: newVal.enemy.name ?? '',
      article: formattedTitle.value ?? '',
    };
  }
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

watch(bossDefeated, (val) => {
  if (val) {
    lastBattle.value = {
      enemyName: combat.currentEnemy?.value?.name ?? '',
      article: formattedTitle.value ?? '',
    };
  }
});

const isSleeping = ref(false);

function handleSleepTransition() {
  isSleeping.value = true;
  setTimeout(async () => {
    callHandleSleep();
    await saveGame();
    setTimeout(() => {
      isSleeping.value = false;
    }, 900);
  }, 1800);
}

const {
  callHandleClick,
  callHandleRest,
  callHandleSleep,
  callHandleOffer,
  handleCombatActionWrapper,
  callHandleEncounterOption,
  handleShopPurchase,
  handleClassSelection,
  handleAssembleUpgradeWrapper,
  handleCloseEncounterWrapper,
  lastDiceRoll,
  lastDamageDealt,
  lastDamageTaken,
  counterResult,
  daysCount,
} = useGameHandlers({
  gameFlow,
  log,
  logEnemyAction,
  modals,
  player,
  inventory,
  enlightenmentFishAccumulatedHP,
  combat,
  statusEffects,
});

const itemHandlers = createItemHandlers({
  playerState: {
    playerHP,
    effectiveMaxHP,
    specialUsesLeft,
    path,
    clickCount,
    shortcutsUsedCount,
    currentTargetIndex,
    playerGold,
  },
  gameData: {
    current,
    chain,
    formattedTitle,
  },
  modalState: {
    bossOverlay,
    closeInventoryModal,
  },
  utilityFunctions: {
    log,
    isBoss,
    nextTick,
    handleLootDrop: () => {},
    handleCloseEncounter: handleCloseEncounterWrapper,
  },
  combatData: {
    encounter,
    enemyHP,
    enemyIsStunned: combat.enemyIsStunned,
    enemyStatusEffects: combat.enemyStatusEffects,
  },
  statusEffects: {
    poisonedClicksLeft,
    poisonDamagePerClick,
    isCloakActive,
    cloakClicksRemaining,
    blurClicksLeft,
    healthRegenActive,
    healthRegenAmount,
    healthRegenClicksRemaining,
    healthRegenMaxHeal,
    healthRegenHealedCount,
    serratedDaggerActive,
    luckyFleeActive,
    wardingShieldHitsRemaining,
    wardStoneActive,
    wardStoneClicksRemaining,
    encounterBeaconActive,
    bountyScrollActive,
  },
});

const handleBeforeUnload = (e) => {
  if (playerClass.value) {
    e.preventDefault();
  }
};
const handleVisibilityChange = () => { if (document.visibilityState === "hidden") saveGame(); };
onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});
onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

const showQuestNotification = ref(false);
const questTaken = ref(false);
const questCombatActive = ref(false);
const questComplete = ref(false);
const questTurnedIn = ref(false);

const isIdle = computed(() =>
  !isInCombat.value &&
  !encounter.value &&
  !showRestModal.value &&
  !showShopModal.value
);

function handleTakeQuest() {
  inventory.value.questScrolls++;
  questTaken.value = true;
  log("📜 You take the quest scroll from the notice board.");
}

function handleTurnInQuest() {
  playerGold.value += 50;
  questTurnedIn.value = true;
  log("📜 You recount your deed at the bar. The innkeeper slides 50g across the counter. <em>The Growling Dark</em> — complete.");
}

function advanceQuestStep(stepIndex) {
  const quest = QUESTS[0];
  const step = quest.steps[stepIndex];
  encounter.value = {
    type: "npc",
    npc: {
      id: `quest_cave_step_${stepIndex}`,
      name: quest.name,
      greeting: step.scene,
      options: step.choices.map(c => ({ text: c.text, questStep: c.next })),
    },
  };
}

function handleOptionChosen(option) {
  if (option.questStep !== undefined) {
    if (option.questStep === "combat") {
      startQuestCombat(QUESTS[0].combatType);
    } else if (option.questStep === "leave") {
      encounter.value = null;
      questTaken.value = false;
      log("📜 You step back from the cave. The notice remains on the board if you wish to return.");
    } else {
      advanceQuestStep(option.questStep);
    }
    return;
  }
  callHandleEncounterOption(option);
}

function startQuestCombat(bossType) {
  const boss = generateMiniBoss(bossType, enemyDifficultyLevel.value);
  encounter.value = { type: "combat", enemy: boss };
  enemyHP.value = boss.currentHP;
  nextEnemyAttack.value =
    Math.floor(Math.random() * (boss.maxDamage - boss.minDamage + 1)) + boss.minDamage;
  enemyNextAction.value = "attack";
  combatEncountersFought.value++;
  questCombatActive.value = true;
  log(`🐻 A massive <strong>${boss.name}</strong> emerges from the darkness! What do you do?`);
  logEnemyAction(enemyNextAction, nextEnemyAttack);
}

watch(encounter, (newVal, oldVal) => {
  if (!questCombatActive.value) return;
  if (oldVal?.type === "combat" && oldVal?.enemy?.name === "Brown Bear" && newVal === null) {
    questCombatActive.value = false;
    if (!defeated.value && enemyHP.value <= 0) {
      questComplete.value = true;
      log("📜 You've slain the bear. Return to The Lighthouse Tavern to claim your reward.");
    } else if (!defeated.value) {
      questTaken.value = false;
      log("📜 You retreat from the cave. The notice remains on the board if you wish to return.");
    }
  }
});

function handleUseInventoryItem(itemType) {
  if (itemType === "compass") {
    itemHandlers.useCompass();
  } else if (itemType === "healthPotion") {
    itemHandlers.useHealthPotion();
  } else if (itemType === "breadcrumb") {
    itemHandlers.useBreadcrumb();
  } else if (itemType === "turkeyLeg") {
    itemHandlers.useTurkeyLeg();
  } else if (itemType === "invisibilityCloak") {
    itemHandlers.useInvisibilityCloak();
  } else if (itemType === "herbalPoultice") {
    itemHandlers.useHerbalPoultice();
  } else if (itemType === "barkTea") {
    itemHandlers.useBarkTea();
  } else if (itemType === "frenchOnionSoup") {
    itemHandlers.useFrenchOnionSoup();
  } else if (itemType === "antidote") {
    itemHandlers.useAntidote();
  } else if (itemType === "smokeBomb") {
    itemHandlers.useSmokeBomb();
  } else if (itemType === "adventurersRations") {
    itemHandlers.useAdventurersRations();
  } else if (itemType === "enlightenmentFish") {
    itemHandlers.useEnlightenmentFish();
  } else if (itemType === "sharedSufferingAmulet") {
    itemHandlers.useAmuletOfSharedSuffering();
  } else if (itemType === "minorHealthPotion") {
    itemHandlers.useMinorHealthPotion();
  } else if (itemType === "flashPowder") {
    itemHandlers.useFlashPowder();
  } else if (itemType === "venomVial") {
    itemHandlers.useVenomVial();
  } else if (itemType === "serratedDagger") {
    itemHandlers.useSerratedDagger();
  } else if (itemType === "luckyCoin") {
    itemHandlers.useLuckyCoin();
  } else if (itemType === "wardingShield") {
    itemHandlers.useWardingShield();
  } else if (itemType === "wardStone") {
    itemHandlers.useWardStone();
  } else if (itemType === "encounterBeacon") {
    itemHandlers.useEncounterBeacon();
  } else if (itemType === "goldPouch") {
    itemHandlers.useGoldPouch();
  } else if (itemType === "bountyScroll") {
    itemHandlers.useBountyScroll();
  } else if (itemType === "questScroll") {
    inventory.value.questScrolls--;
    closeInventoryModal();
    advanceQuestStep(0);
    showQuestNotification.value = true;
    setTimeout(() => { showQuestNotification.value = false; }, 3000);
  }
}

const autoSaveFeedback = ref(false);
let autoSaveFeedbackTimer = null;
let inventoryAutoSaveTimer = null;

async function triggerAutoSave() {
  await saveGame();
  clearTimeout(autoSaveFeedbackTimer);
  autoSaveFeedback.value = true;
  autoSaveFeedbackTimer = setTimeout(() => { autoSaveFeedback.value = false; }, 2000);
}

async function handleLinkClicked(...args) {
  await callHandleClick(...args);
  await triggerAutoSave();
}

async function handleRest(...args) {
  callHandleRest(...args);
  await triggerAutoSave();
}

watch(encounter, (newVal, oldVal) => {
  if (newVal === null && oldVal !== null) triggerAutoSave();
});

watch(inventory, () => {
  clearTimeout(inventoryAutoSaveTimer);
  inventoryAutoSaveTimer = setTimeout(() => triggerAutoSave(), 500);
}, { deep: true });

async function saveGame() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("saves").upsert({
    user_id: user.id,
    updated_at: new Date().toISOString(),
    game_state: {
      playerClassName: playerClass.value?.name,
      playerName: playerName.value,
      playerHP: playerHP.value,
      specialUsesLeft: specialUsesLeft.value,
      totalSpecialsUsed: totalSpecialsUsed.value,
      weaponBonus: weaponBonus.value,
      shieldBonus: shieldBonus.value,
      playerGold: playerGold.value,
      goldSpent: goldSpent.value,
      shortRestsUsed: shortRestsUsed.value,
      longRestsUsed: longRestsUsed.value,
      specialTier: specialTier.value,
      offeringPot: offeringPot.value,
      daysCount: daysCount.value,
      combatEncountersFought: combatEncountersFought.value,
      enemiesKilled: enemiesKilled.value,
      hpCapBonus: hpCapBonus.value,
      combatWinsSinceLastCapIncrease: combatWinsSinceLastCapIncrease.value,
      inventory: { ...inventory.value },
      questTaken: questTaken.value,
      questComplete: questComplete.value,
      questTurnedIn: questTurnedIn.value,
      chain: [...chain],
      current: current.value,
      currentTargetIndex: currentTargetIndex.value,
      path: [...path.value],
      journeyLength: journeyLength.value,
      clickCount: clickCount.value,
      longRestDismissCount: longRestDismissCount.value,
      playerGoal: playerGoal.value,
      bossDefeated: bossDefeated.value,
      seenLoreEncounters: [...seenLoreEncounters.value],
      seenNPCEncounters: [...seenNPCEncounters.value],
      enemyDifficultyLevel: enemyDifficultyLevel.value,
      enlightenmentFishAccumulatedHP: enlightenmentFishAccumulatedHP.value,
      gameLog: gameLog.value,
      poisonedClicksLeft: poisonedClicksLeft.value,
      poisonDamagePerClick: poisonDamagePerClick.value,
      isCloakActive: isCloakActive.value,
      cloakClicksRemaining: cloakClicksRemaining.value,
      blurClicksLeft: blurClicksLeft.value,
      healthRegenActive: healthRegenActive.value,
      healthRegenAmount: healthRegenAmount.value,
      healthRegenClicksRemaining: healthRegenClicksRemaining.value,
      healthRegenMaxHeal: healthRegenMaxHeal.value,
      healthRegenHealedCount: healthRegenHealedCount.value,
      serratedDaggerActive: serratedDaggerActive.value,
      wardingShieldHitsRemaining: wardingShieldHitsRemaining.value,
      wardStoneActive: wardStoneActive.value,
      wardStoneClicksRemaining: wardStoneClicksRemaining.value,
      luckyFleeActive: luckyFleeActive.value,
      encounterBeaconActive: encounterBeaconActive.value,
      bountyScrollActive: bountyScrollActive.value,
      restModalCount: restModalCount.value,
      longRestDismissCount: longRestDismissCount.value,
    },
  }, { onConflict: 'user_id' });
}

function restoreGameState(s) {
  if (s.playerClassName) playerClass.value = classes[s.playerClassName];
  playerName.value = s.playerName ?? "";
  playerHP.value = s.playerHP ?? 0;
  specialUsesLeft.value = s.specialUsesLeft ?? 3;
  totalSpecialsUsed.value = s.totalSpecialsUsed ?? 0;
  weaponBonus.value = s.weaponBonus ?? 0;
  shieldBonus.value = s.shieldBonus ?? 0;
  playerGold.value = s.playerGold ?? 0;
  goldSpent.value = s.goldSpent ?? 0;
  shortRestsUsed.value = s.shortRestsUsed ?? 0;
  longRestsUsed.value = s.longRestsUsed ?? 0;
  specialTier.value = s.specialTier ?? 1;
  offeringPot.value = s.offeringPot ?? 0;
  daysCount.value = s.daysCount ?? 1;
  combatEncountersFought.value = s.combatEncountersFought ?? 0;
  enemiesKilled.value = s.enemiesKilled ?? 0;
  hpCapBonus.value = s.hpCapBonus ?? 0;
  combatWinsSinceLastCapIncrease.value = s.combatWinsSinceLastCapIncrease ?? 0;
  enlightenmentFishAccumulatedHP.value = s.enlightenmentFishAccumulatedHP ?? 0;
  if (s.inventory) Object.assign(inventory.value, s.inventory);
  questTaken.value = s.questTaken ?? false;
  questComplete.value = s.questComplete ?? false;
  questTurnedIn.value = s.questTurnedIn ?? false;
  if (s.chain?.length) chain.splice(0, chain.length, ...s.chain);
  if (s.current) current.value = s.current;
  if (s.currentTargetIndex != null) currentTargetIndex.value = s.currentTargetIndex;
  if (s.path?.length) path.value = s.path;
  if (s.journeyLength) journeyLength.value = s.journeyLength;
  if (s.clickCount != null) clickCount.value = s.clickCount;
  if (s.longRestDismissCount != null) longRestDismissCount.value = s.longRestDismissCount;
  if (s.playerGoal) playerGoal.value = s.playerGoal;
  if (s.bossDefeated != null) bossDefeated.value = s.bossDefeated;
  if (s.seenLoreEncounters?.length) seenLoreEncounters.value = s.seenLoreEncounters;
  if (s.seenNPCEncounters?.length) seenNPCEncounters.value = s.seenNPCEncounters;
  if (s.enemyDifficultyLevel != null) enemyDifficultyLevel.value = s.enemyDifficultyLevel;
    if (s.gameLog?.length) restoreLog(s.gameLog);
  poisonedClicksLeft.value = s.poisonedClicksLeft ?? 0;
  poisonDamagePerClick.value = s.poisonDamagePerClick ?? 0;
  isCloakActive.value = s.isCloakActive ?? false;
  cloakClicksRemaining.value = s.cloakClicksRemaining ?? 0;
  blurClicksLeft.value = s.blurClicksLeft ?? 0;
  healthRegenActive.value = s.healthRegenActive ?? false;
  healthRegenAmount.value = s.healthRegenAmount ?? 0;
  healthRegenClicksRemaining.value = s.healthRegenClicksRemaining ?? 0;
  healthRegenMaxHeal.value = s.healthRegenMaxHeal ?? 0;
  healthRegenHealedCount.value = s.healthRegenHealedCount ?? 0;
  serratedDaggerActive.value = s.serratedDaggerActive ?? false;
  wardingShieldHitsRemaining.value = s.wardingShieldHitsRemaining ?? 0;
  wardStoneActive.value = s.wardStoneActive ?? false;
  wardStoneClicksRemaining.value = s.wardStoneClicksRemaining ?? 0;
  luckyFleeActive.value = s.luckyFleeActive ?? false;
  encounterBeaconActive.value = s.encounterBeaconActive ?? false;
  bountyScrollActive.value = s.bountyScrollActive ?? false;
  if (s.restModalCount != null) restModalCount.value = s.restModalCount;
  if (s.longRestDismissCount != null) longRestDismissCount.value = s.longRestDismissCount;
  
}

async function handleRestart() {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (currentUser) {
    await supabase.from("saves").delete().eq("user_id", currentUser.id);
  }
  location.reload();
}

async function loadSave(userId) {
  isLoadingGame.value = true;
  const { data } = await supabase
    .from("saves")
    .select("game_state")
    .eq("user_id", userId)
    .single();
  if (data?.game_state) restoreGameState(data.game_state);
  isLoadingGame.value = false;
}

onMounted(async () => {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (currentUser) await loadSave(currentUser.id);
});

watch(user, async (newUser, oldUser) => {
  if (newUser && !oldUser) await loadSave(newUser.id);
});
</script>

<style scoped>
.sleep-overlay {
  position: fixed;
  inset: 0;
  background: black;
  z-index: 9998;
  pointer-events: none;
}

.sleep-fade-enter-active {
  transition: opacity 1.6s ease;
}
.sleep-fade-leave-active {
  transition: opacity 0.9s ease;
}
.sleep-fade-enter-from,
.sleep-fade-leave-to {
  opacity: 0;
}

.campfire-fade-enter-active {
  transition: opacity 1.4s ease;
}
.campfire-fade-leave-active {
  transition: opacity 1.2s ease;
}
.campfire-fade-enter-from,
.campfire-fade-leave-to {
  opacity: 0;
}

.quest-notification {
  position: fixed;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  text-align: center;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  background: black;
  padding: 1.2rem 2.4rem;
  border-radius: 6px;
}

.quest-notif-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(200, 140, 40, 0.75);
  font-family: "IBM Plex Sans", sans-serif;
}

.quest-notif-name {
  font-size: 26px;
  font-weight: 500;
  color: #e8c870;
  font-family: "IBM Plex Sans", sans-serif;
  text-shadow: 0 0 30px rgba(220, 160, 30, 0.6), 0 0 60px rgba(180, 110, 10, 0.3);
  letter-spacing: 1px;
}

.quest-notif-fade-enter-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.quest-notif-fade-leave-active {
  transition: opacity 1s ease, transform 1s ease;
}
.quest-notif-fade-enter-from {
  opacity: 0;
  transform: translate(-50%, -44%);
}
.quest-notif-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -60%);
}

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

.game-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: white;
  font-size: 1.5rem;
  flex-direction: column;
}

.loader-content {
  text-align: center;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #fff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@media screen and (max-width: 600px) {
  .timer {
    font-size: 13px;
    margin-top: 0.1rem;
  }
}
</style>
