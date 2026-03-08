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
    :dogName="dogName"
    @log-line="log"
    :compass-count="inventory.compass"
    :shieldBonus="shieldBonus"
    :weaponBonus="weaponBonus"
    :hasStick="inventory.stickItem > 0"
    :hasCoolerStick="inventory.coolerStickItem > 0"
    :hasEvenCoolerStick="inventory.evenCoolerStickItem > 0"
    :longRestsUsed="longRestsUsed"
    :isDarkened="bossOverlay"
    :shortRestsUsed="shortRestsUsed"
    :playerGold="playerGold"
    @show-tips="showTipsModal = true"
    :game-chain="chain"
    @open-hub="hubOpen = true; hubTab = 'backpack'"
    :is-cloak-active="isCloakActive"
    :isBlurred="isBlurred"
    :isPlayerPoisoned="isPlayerPoisoned"
    :healthRegenActive="healthRegenActive"
    :encounterBeaconActive="encounterBeaconActive"
    :wardingShieldHitsRemaining="wardingShieldHitsRemaining"
    :isEnemyVenomed="isEnemyVenomed"
    :isEnemyBleeding="isEnemyBleeding"
    :bountyScrollActive="bountyScrollActive"
    :luckyFleeActive="luckyFleeActive"
    :cloak-clicks-remaining="cloakClicksRemaining"
    :combatWinsSinceLastCapIncrease="combatWinsSinceLastCapIncrease"
    :hpCapBonus="hpCapBonus"
    :formattedTitle="formattedTitle"
    @open-map-modal="hubOpen = true; hubTab = 'map'"
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
        @open-map="hubOpen = true; hubTab = 'map'"
        :path="path"
        :fullChain="chain"
        :currentTargetIndex="currentTargetIndex"
        :isBlurred="blurClicksLeft > 0"
        :clickCount="clickCount"
        :longRestDismissCount="longRestDismissCount"
        :autoSaveFeedback="autoSaveFeedback"
        :daysCount="daysCount"
      />

      <Transition name="rest-modal">
      <RestModal
        :showRestModal="showRestModal"
        :shortRestsUsed="shortRestsUsed"
        :longRestsUsed="longRestsUsed"
        :scrapMetal="inventory.scrapMetal"
        :restModalCount="restModalCount"
        :specialTier="specialTier"
        :offeringPot="offeringPot"
        :playerGold="playerGold"
        :nextOfferingCost="nextOfferingCost"
        :questStatus="questStatus"
        :boardQuestName="boardQuest?.name ?? ''"
        :boardQuestHint="boardQuest?.tavernHint ?? ''"
        :boardQuestRewardLabel="boardQuest?.rewardLabel ?? ''"
        :campTier="campTier"
        @rest="handleRest"
        @offer="callHandleOffer"
        @sleep="handleSleepTransition"
        @order-beer="handleOrderBeer"
        @sip-beer="handleSipBeer"
        @order-meal="handleOrderMeal"
        @bite-meal="handleBiteMeal"
        @open-die-slayer="openDieSlayerFromTavern"
        @take-quest="handleTakeQuest"
        @turn-in-quest="handleTurnInQuest"
        @open-shop="showShopModal = true"
        @open-tavern-shop="showTavernShop = true"
        @open-forge="showForge = true"
      />
      </Transition>

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

    </div>
  </div>

  <HubModal
    v-if="hubOpen"
    :activeTab="hubTab"
    :isLoggedIn="!!user"
    @change-tab="hubTab = $event"
    @close="hubOpen = false"
    @restart="handleRestart"
  >
    <template #backpack>
      <InventoryModal
        embedded
        :inventory="inventory"
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
    </template>
    <template #map>
      <MapModal
        embedded
        :fullChain="chain"
        :currentTargetIndex="currentTargetIndex"
        :markedPOIs="markedPOIs"
        :engagedPOIs="engagedPOIs"
        :isIdle="isIdle"
        @revisit-poi="handleRevisitPOI"
      />
    </template>
    <template #journal>
      <NotesModal
        embedded
        :playerClass="playerClass"
        :specialTier="specialTier"
        :playerName="playerName"
        :weaponBonus="weaponBonus"
        :shieldBonus="shieldBonus"
        :playerGoal="playerGoal"
        :dogName="dogName"
        :isBlurred="isBlurred"
        :isPlayerPoisoned="isPlayerPoisoned"
        :isCloakActive="isCloakActive"
        :wardStoneActive="wardStoneActive"
        :healthRegenActive="healthRegenActive"
        :encounterBeaconActive="encounterBeaconActive"
        :wardingShieldHitsRemaining="wardingShieldHitsRemaining"
        :isEnemyVenomed="isEnemyVenomed"
        :isEnemyBleeding="isEnemyBleeding"
      />
    </template>
    <template #quests>
      <div class="hub-quest-pane">
        <div
          v-for="q in QUESTS.filter(q => completedQuestIds.includes(q.id))"
          :key="q.id"
          class="hub-quest-item hub-quest-complete"
        >
          <div class="hub-quest-info">
            <span class="hub-quest-name">{{ q.name }}</span>
            <span class="hub-quest-desc">Quest complete.</span>
          </div>
          <span class="hub-quest-status-badge">COMPLETED ✓</span>
        </div>
        <template v-if="boardQuest && !completedQuestIds.includes(boardQuest.id)">
          <div v-if="questStatus === 'complete'" class="hub-quest-item hub-quest-turn-in">
            <div class="hub-quest-info">
              <span class="hub-quest-name">{{ boardQuest.name }}</span>
              <span class="hub-quest-desc">Return to The Lighthouse Tavern to collect your reward.</span>
            </div>
            <span class="hub-quest-status-badge hub-quest-status-return">Turn In !</span>
          </div>
          <div v-else-if="questStatus === 'progress'" class="hub-quest-item">
            <div class="hub-quest-info">
              <span class="hub-quest-name">{{ boardQuest.name }}</span>
              <span class="hub-quest-desc">Quest underway.</span>
            </div>
            <span class="hub-quest-status-badge hub-quest-status-active">In Progress</span>
          </div>
          <div v-else-if="questStatus === 'scroll'" class="hub-quest-item">
            <div class="hub-quest-info">
              <span class="hub-quest-name">{{ boardQuest.name }}</span>
              <span class="hub-quest-desc">A rolled parchment sealed with wax. Must be opened while idle.</span>
            </div>
            <button class="hub-quest-btn" @click="handleUseInventoryItem('questScroll')" :disabled="!isIdle">Begin Quest</button>
          </div>
          <div v-else class="hub-quest-item">
            <div class="hub-quest-info">
              <span class="hub-quest-name">{{ boardQuest.name }}</span>
              <span class="hub-quest-desc">{{ boardQuest.tavernHint }}</span>
            </div>
            <span class="hub-quest-status-badge">Available</span>
          </div>
        </template>
        <div v-else-if="questStatus === 'done'" class="hub-quest-empty">All quests complete.</div>
        <div v-else class="hub-quest-empty">No active quests.</div>
      </div>
    </template>
  </HubModal>

  <Transition name="quest-notif-fade">
    <div v-if="showQuestNotification" class="quest-notification">
      <div class="quest-notif-label">Quest Started</div>
      <div class="quest-notif-name">{{ activeQuest?.name ?? "" }}</div>
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

  <RuneCacheModal
    v-if="showRuneCacheModal"
    :tier="runeCacheReward?.tier ?? 1"
    @close="showRuneCacheModal = false"
    @reward="handleRuneCacheReward"
  />

  <DogNameModal
    v-if="showDogNameModal"
    @named="onDogNamed"
  />

  <TavernShopModal
    v-if="showTavernShop"
    :campTier="campTier"
    :playerGold="playerGold"
    @close="showTavernShop = false"
    @buy="handleTavernShopBuy"
  />

  <ForgeModal
    v-if="showForge"
    :scrapMetal="inventory.scrapMetal"
    :weaponBonus="weaponBonus"
    :shieldBonus="shieldBonus"
    @close="showForge = false"
    @forge="handleForge"
  />
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
import NotesModal from "@/components/NotesModal.vue";
import HubModal from "@/components/HubModal.vue";
import DieSlayerModal from "@/components/DieSlayerModal.vue";
import CampfireOverlay from "@/components/CampfireOverlay.vue";
import RuneCacheModal from "@/components/RuneCacheModal.vue";
import DogNameModal from "@/components/DogNameModal.vue";
import TavernShopModal from "@/components/TavernShopModal.vue";
import ForgeModal from "@/components/ForgeModal.vue";

import { shopItems as allShopItems } from "@/utils/shopItems";
import { isBoss } from "@/utils/bossGenerator";
import { generateMiniBoss } from "@/utils/miniBossGenerator";
import { npcData, loreData } from "@/utils/encounterGenerator";
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
  restModalCount,
  longRestDismissCount,
  showCampfireOverlay,
  campfireReward,
  showRuneCacheModal,
  runeCacheReward,
  showDogNameModal,
  openInventoryModal,
  closeInventoryModal,
} = modals;

const hubOpen = ref(false);
const hubTab = ref("backpack");
const showTavernShop = ref(false);
const showForge = ref(false);

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
  const bonusLabels = { gold: `+${reward.amount} Gold`, scrap: `${reward.amount} Scrap Metal`, special: `+${reward.amount} Special Charges` };
  if (reward.type === "gold") playerGold.value += reward.amount;
  else if (reward.type === "scrap") inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) + reward.amount;
  else if (reward.type === "special") specialUsesLeft.value += reward.amount;
  log(`🔥 You rested at the ${reward.name}. You gained +15 HP and ${bonusLabels[reward.type]}.`);
  showCampfireOverlay.value = false;
  campfireReward.value = null;
}

function handleRuneCacheReward(reward) {
  if (reward.type === "gold") {
    playerGold.value += reward.amount;
    log(`✦ The cache yields ${reward.amount} gold.`);
  } else if (reward.type === "health_potion") {
    inventory.value.healthPotions++;
    log(`✦ The cache yields a Health Potion.`);
  } else if (reward.type === "weapon") {
    weaponBonus.value += reward.amount;
    log(`✦ The cache yields a weapon upgrade. +${reward.amount} Weapon Damage.`);
  } else if (reward.type === "shield") {
    shieldBonus.value += reward.amount;
    log(`✦ The cache yields a defensive ward. +${reward.amount} Defense.`);
  }
  showRuneCacheModal.value = false;
  runeCacheReward.value = null;
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
  dogName,
  campTier,
} = player;

function onDogNamed(name) {
  dogName.value = name;
  showDogNameModal.value = false;
  log(`🐶 You named your companion <strong>${name}</strong>! They wag their tail happily.`);
}

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
    if (item.id === "dog_companion" && dogName.value) return false;
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
const completedQuestIds = ref([]);
const activeQuestId = ref(null);
const questCombatActive = ref(false);
const questComplete = ref(false);
const markedPOIs = ref([]);
const engagedPOIs = ref([]);

const activeQuest = computed(() =>
  activeQuestId.value ? QUESTS.find(q => q.id === activeQuestId.value) : null
);
const boardQuest = computed(() => {
  if (activeQuestId.value) return activeQuest.value;
  return QUESTS.find(q => !completedQuestIds.value.includes(q.id)) ?? null;
});
const questStatus = computed(() => {
  if (!boardQuest.value) return "done";
  if (questComplete.value && activeQuestId.value === boardQuest.value?.id) return "complete";
  if ((inventory.value.questScrolls ?? 0) > 0 && activeQuestId.value === boardQuest.value?.id) return "scroll";
  if (activeQuestId.value === boardQuest.value?.id) return "progress";
  return "none";
});

const isIdle = computed(() =>
  !isInCombat.value &&
  !encounter.value &&
  !showRestModal.value &&
  !showShopModal.value
);
const isEnemyVenomed = computed(() => enemyStatusEffects.value?.some(e => e.type === "poison") ?? false);
const isEnemyBleeding = computed(() => enemyStatusEffects.value?.some(e => e.type === "bleed") ?? false);

const CAMP_NAMES = ["", "Sleeping Bag", "Pillow", "Tent"];
const CAMP_COSTS = [0, 50, 75, 100];

function handleTavernShopBuy(tier) {
  const cost = CAMP_COSTS[tier];
  if (playerGold.value < cost) return;
  playerGold.value -= cost;
  campTier.value = tier;
  log(`🏕️ You purchase a ${CAMP_NAMES[tier]}. Your long rest has improved.`);
  saveGame();
}

function handleForge({ type, scrapUsed }) {
  const upgrades = scrapUsed / 2;
  inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) - scrapUsed;
  if (type === "weapon") {
    weaponBonus.value += upgrades;
    log(`⚒️ <span class="player-name">${playerName.value}</span> forged ${scrapUsed} scrap into +${upgrades} Weapon Bonus.`);
  } else {
    shieldBonus.value += upgrades;
    log(`⚒️ <span class="player-name">${playerName.value}</span> forged ${scrapUsed} scrap into +${upgrades} Defense Bonus.`);
  }
}

function handleTakeQuest() {
  const quest = boardQuest.value;
  if (!quest) return;
  inventory.value.questScrolls++;
  activeQuestId.value = quest.id;
  log("📜 You take the quest scroll from the notice board.");
}

function handleTurnInQuest() {
  const quest = activeQuest.value;
  if (!quest) return;
  playerGold.value += quest.turnInGold ?? 0;
  if (quest.turnInScrap) {
    inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) + quest.turnInScrap;
  }
  completedQuestIds.value.push(quest.id);
  activeQuestId.value = null;
  questComplete.value = false;
  log(`📜 ${quest.turnInLog}`);
  saveGame();
}

function advanceQuestStep(stepIndex) {
  const quest = activeQuest.value;
  if (!quest) return;
  const step = quest.steps[stepIndex];
  encounter.value = {
    type: "npc",
    npc: {
      id: `quest_${quest.id}_step_${stepIndex}`,
      name: quest.name,
      greeting: step.scene,
      options: step.choices.map(c => ({ text: c.text, questStep: c.next })),
    },
  };
}

function getCurrentEncounterOptions(enc) {
  if (!enc) return [];
  if (enc.type === 'lore') {
    if (enc.lore.dialogueNodes) {
      const nodeId = enc.lore.currentNodeId || 'start';
      return enc.lore.dialogueNodes[nodeId]?.options || [];
    }
    return enc.lore.options || [];
  }
  if (enc.type === 'npc') {
    if (enc.npc.dialogueNodes) {
      const nodeId = enc.npc.currentNodeId || 'start';
      return enc.npc.dialogueNodes[nodeId]?.options || [];
    }
    return enc.npc.options || [];
  }
  return [];
}

function handleOptionChosen(option) {
  if (option.questStep !== undefined) {
    const quest = activeQuest.value;
    if (option.questStep === "combat") {
      startQuestCombat(quest.combatType);
    } else if (option.questStep === "complete") {
      encounter.value = null;
      questComplete.value = true;
      log(`📜 ${quest?.victoryLog ?? "Quest complete. Return to the tavern to claim your reward."}`);
    } else if (option.questStep === "leave") {
      encounter.value = null;
      activeQuestId.value = null;
      log(`📜 ${quest?.leaveLog ?? "You turn back. The quest scroll remains on the board."}`);
    } else {
      advanceQuestStep(option.questStep);
    }
    return;
  }

  if (option.result === 'come_back_later') {
    const enc = encounter.value;
    const encId = enc?.lore?.id || enc?.npc?.id;
    const encName = enc?.lore?.name || enc?.npc?.name || '';
    if (encId && !markedPOIs.value.some(p => p.id === encId)) {
      markedPOIs.value.push({ id: encId, name: encName });
    }
    const responseText = option.responseText || 'This point of interest has been marked on your map.';
    log(`🗺️ ${responseText}`);
    const continueOption = [{ text: "Continue on your journey.", flow: "close_encounter" }];
    if (enc?.type === 'lore') {
      encounter.value = { type: 'lore', lore: { id: enc.lore.id, name: enc.lore.name, text: responseText, options: continueOption } };
    } else if (enc?.type === 'npc') {
      encounter.value = { type: 'npc', npc: { id: enc.npc.id, name: enc.npc.name, greeting: responseText, options: continueOption } };
    } else {
      encounter.value = null;
    }
    return;
  }

  const enc = encounter.value;
  const currentOptions = getCurrentEncounterOptions(enc);
  if (currentOptions.some(o => o.result === 'come_back_later')) {
    const encId = enc?.lore?.id || enc?.npc?.id;
    if (encId && markedPOIs.value.some(p => p.id === encId) && !engagedPOIs.value.includes(encId)) {
      engagedPOIs.value.push(encId);
    }
  }

  callHandleEncounterOption(option);
}

function handleRevisitPOI(poi) {
  if (engagedPOIs.value.includes(poi.id) || !isIdle.value) return;
  const loreEnc = loreData.find(e => e.id === poi.id);
  if (loreEnc) {
    hubOpen.value = false;
    encounter.value = { type: 'lore', lore: { ...loreEnc, currentNodeId: loreEnc.dialogueNodes ? 'start' : undefined } };
    return;
  }
  const npcEnc = npcData.find(e => e.id === poi.id);
  if (npcEnc) {
    hubOpen.value = false;
    encounter.value = { type: 'npc', npc: { ...npcEnc, currentNodeId: npcEnc.dialogueNodes ? 'start' : undefined } };
  }
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
  const emoji = activeQuest.value?.combatEmoji ?? "⚔️";
  log(`${emoji} A <strong>${boss.name}</strong> blocks your path! What do you do?`);
  logEnemyAction(enemyNextAction, nextEnemyAttack);
}

watch(encounter, (newVal, oldVal) => {
  if (!questCombatActive.value) return;
  if (oldVal?.type === "combat" && newVal === null) {
    const quest = activeQuest.value;
    questCombatActive.value = false;
    if (!defeated.value && enemyHP.value <= 0) {
      if (quest?.postCombatStep != null) {
        advanceQuestStep(quest.postCombatStep);
      } else {
        questComplete.value = true;
        log(`📜 ${quest?.victoryLog ?? "Quest enemy defeated. Return to the tavern to claim your reward."}`);
      }
    } else if (!defeated.value) {
      activeQuestId.value = null;
      log(`📜 ${quest?.leaveLog ?? "You retreat. The quest remains available."}`);
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
    hubOpen.value = false;
    advanceQuestStep(0);
    showQuestNotification.value = true;
    setTimeout(() => { showQuestNotification.value = false; }, 6000);
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
      questComplete: questComplete.value,
      completedQuestIds: [...completedQuestIds.value],
      activeQuestId: activeQuestId.value,
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
      dogName: dogName.value,
      goldPouchAccumulatedGold: goldPouchAccumulatedGold.value,
      campTier: campTier.value,
      markedPOIs: [...markedPOIs.value],
      engagedPOIs: [...engagedPOIs.value],
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
  questComplete.value = s.questComplete ?? false;
  completedQuestIds.value = s.completedQuestIds ?? (s.questTurnedIn ? ["cave_bear"] : []);
  activeQuestId.value = s.activeQuestId ?? (s.questTaken && !s.questTurnedIn ? "cave_bear" : null);
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
  dogName.value = s.dogName ?? "";
  campTier.value = s.campTier ?? 0;
  goldPouchAccumulatedGold.value = s.goldPouchAccumulatedGold ?? 0;
  markedPOIs.value = s.markedPOIs ?? [];
  engagedPOIs.value = s.engagedPOIs ?? [];
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
@import "./styles/gameViewStyles.css";
</style>
