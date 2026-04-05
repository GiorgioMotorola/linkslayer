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
    @confirm-turn="handleConfirmTurn"
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
    @open-world-map="showWorldMap = true"
    :is-cloak-active="isCloakActive"
    :isBlurred="isBlurred"
    :isPlayerPoisoned="isPlayerPoisoned"
    :healthRegenActive="healthRegenActive"
    :encounterBeaconActive="encounterBeaconActive"
    :wardingShieldHitsRemaining="wardingShieldHitsRemaining"
    :isEnemyVenomed="isEnemyVenomed"
    :isEnemyBleeding="isEnemyBleeding"
    :isEnemyOnFire="isEnemyOnFire"
    :weaponAugment="weaponAugment"
    :defenseAugment="defenseAugment"
    :bountyScrollActive="bountyScrollActive"
    :luckyFleeActive="luckyFleeActive"
    :cloak-clicks-remaining="cloakClicksRemaining"
    :combatWinsSinceLastCapIncrease="combatWinsSinceLastCapIncrease"
    :hpCapBonus="hpCapBonus"
    :formattedTitle="formattedTitle"
    @open-map-modal="hubOpen = true; hubTab = 'journey'"
    :lastDiceRoll="lastDiceRoll"
    :lastDamageDealt="lastDamageDealt"
    :lastDamageTaken="lastDamageTaken"
    :counterResult="counterResult"
    :enrageCharges="playerEnrageCharges"
    :focusPips="focusPips"
    :guardCharges="guardCharges"
    :specialTier="specialTier"
    :playerGoal="playerGoal"
    :enemyStatusEffects="enemyStatusEffects"
    :confusedAction="confusedAction"
    :confusedTurnsLeft="confusedTurnsLeft"
    :autoSaveFeedback="autoSaveFeedback"
    :scrapMetal="inventory.scrapMetal"
    @restart="handleRestart"
    @switch-target="onSwitchTarget"
    :victoryLoot="victoryLoot"
    :playerSelectedTarget="playerSelectedTarget"
    :equippedWeaponId="equippedWeapon"
    :warriors="warriors"
    :enemyIntents="enemyIntents"
    :maxActionsPerTurn="maxActionsPerTurn"
    :combatInventory="{
      sharedSufferingAmulets: inventory.sharedSufferingAmulets ?? 0,
      flashPowders: inventory.flashPowders ?? 0,
      venomVials: inventory.venomVials ?? 0,
      serratedDaggers: inventory.serratedDaggers ?? 0,
      smokeBombs: inventory.smokeBombs ?? 0,
      wardingShields: inventory.wardingShields ?? 0,
    }"
    :serratedDaggerActive="serratedDaggerActive"
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
    <SplashScreen v-if="showSplash" @done="onSplashDone" />

    <ClassSelect
      v-if="!playerClass && !showSplash"
      @select="handleClassSelectionWithSplash"
      :articleTitle="current"
      :start="chain[0]"
      :targets="chain[currentTargetIndex + 1]"
      :formattedStart="formattedStart"
      :formattedTitle="formattedTitle"
      :fullChain="chain"
      @show-tips="showTipsModal = true"
    />
    <div>
      <JourneyRecapModal
        v-if="showRecap"
        :type="recapType"
        :playerName="playerName"
        :playerClass="playerClass"
        :daysCount="daysCount"
        :clickCount="clickCount"
        :weaponBonus="weaponBonus"
        :shieldBonus="shieldBonus"
        :enemiesKilled="enemiesKilled"
        :totalSpecialsUsed="totalSpecialsUsed"
        :goldSpent="goldSpent"
        :shortRestsUsed="shortRestsUsed"
        :longRestsUsed="longRestsUsed"
        :dogName="dogName"
        :lastBattle="lastBattle"
        @continue="onRecapContinue"
      />

      <VictoryModal
        v-if="isGameComplete && recapDismissed"
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
        :settlementOnThisPage="pageSettlement"
        :settlementClaimedBy="pageSettlementClaimedBy"
        :panelOpen="showSettlementView || showVisitorSettlement || showBrewery || showBarracks"
        @link-clicked="handleLinkClicked"
        @open-map="hubOpen = true; hubTab = 'journey'"
        @open-settlement="openPageSettlement"
        @switch-target="onSwitchTarget"
        :playerSelectedTarget="playerSelectedTarget"
        :path="path"
        :fullChain="chain"
        :currentTargetIndex="currentTargetIndex"
        :isBlurred="blurClicksLeft > 0"
        :clickCount="clickCount"
        :longRestDismissCount="longRestDismissCount"
        :autoSaveFeedback="autoSaveFeedback"
        :daysCount="daysCount"
        :playerClass="playerClass"
        :isInCombat="isInCombat"
        :playerHP="playerHP"
        :playerMaxHP="effectiveMaxHP"
        :enemyHP="enemyHP"
        :lastDamageDealt="lastDamageDealt"
        :lastDamageTaken="lastDamageTaken"
        :enemyHitKey="enemyHitKey"
        :playerHitKey="playerHitKey"
        :enemyStatusEffects="enemyStatusEffects"
        :encounter="encounter"
        :enemyNextAction="enemyNextAction"
        :nextEnemyAttack="nextEnemyAttack"
        :enemyIntents="enemyIntents"
        :enemyTurnKey="enemyTurnKey"
        :actionsPlaying="actionsPlaying"
        :actionFlash="actionFlash"
        :lastProcEvent="lastProcEvent"
        :allyCompanion="allyCompanion"
        :warriors="warriors"
      />

      <!-- Settlement side panel -->
      <div v-if="showSettlementView || showVisitorSettlement" class="settlement-side-panel">
        <SettlementModal
          v-if="showSettlementView && settlement"
          :settlement="settlement"
          :playerGold="playerGold"
          :isOwner="true"
          :clicksSince="clickCount - lastSettlementVisitClickCount"
          :lastVisitClickCount="lastSettlementVisitClickCount"
          :daysCount="daysCount"
          @close="closeSettlement"
          @collect="handleSettlementCollect"
          @place-building="handleSettlementPlaceBuilding"
          @remove-building="handleSettlementRemoveBuilding"
          @change-terrain="handleSettlementChangeTerrain"
          :canShortRest="canShortRestAtSettlement"
          @open-forge="showForge = true"
          @open-brewery="showBrewery = true"
          @open-barracks="showBarracks = true"
          @short-rest="handleSettlementShortRest"
          @update-town-meta="handleTownMetaUpdate"
        />
        <SettlementModal
          v-if="showVisitorSettlement && visitingSettlementData"
          :settlement="visitingSettlementData"
          :playerGold="0"
          :isOwner="false"
          :readOnly="true"
          :canChallenge="canChallengeSettlement"
          :playerHasSettlement="!!settlementId"
          :tavernBeers="visitingTavernBeers"
          @close="showVisitorSettlement = false; visitingSettlementData = null"
          @challenge-boss="handleChallengeSettlementBoss"
          @open-tavern="showTavernBeerModal = true"
        />
      </div>

      <!-- Gold stolen popup -->
      <div v-if="lastGoldStolen" :key="goldPopupKey" class="gold-stolen-popup">
        +{{ lastGoldStolen }} <i class="ra ra-gold-bar"></i>
      </div>

      <Transition name="rest-backdrop">
        <div v-if="showRestModal" class="rest-backdrop"></div>
      </Transition>

      <Transition name="rest-modal">
      <RestModal
        :showRestModal="showRestModal"
        :shortRestsUsed="shortRestsUsed"
        :longRestsUsed="longRestsUsed"
        :scrapMetal="inventory.scrapMetal"
        :restModalCount="restModalCount"
        :isLongRest="isLongRest"
        :specialTier="specialTier"
        :offeringPot="offeringPot"
        :playerGold="playerGold"
        :nextOfferingCost="nextOfferingCost"
        :questStatus="questStatus"
        :boardQuestName="boardQuest?.name ?? ''"
        :boardQuestHint="boardQuest?.tavernHint ?? ''"
        :boardQuestRewardLabel="boardQuest?.rewardLabel ?? ''"
        :campTier="campTier"
        :libraryBook="libraryBook"
        :libraryReady="libraryReady"
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
        @open-library="showLibrary = true"
      />
      </Transition>

      <Transition name="rest-backdrop">
        <div v-if="showShopModal" class="rest-backdrop"></div>
      </Transition>
      <Transition name="shop-panel">
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
      </Transition>

      <Transition name="rest-backdrop">
        <div v-if="showDieSlayer" class="rest-backdrop"></div>
      </Transition>
      <Transition name="ds-panel">
      <DieSlayerModal
        v-if="showDieSlayer"
        :playerGold="playerGold"
        @gold-change="handleDieSlayerGold"
        @leave="handleDieSlayerLeave"
      />
      </Transition>

      <InventoryModal
        v-if="isInventoryModalOpen"
        :inventory="inventory"
        @close="closeInventoryModal"
        @use-item="handleUseInventoryItem"
        @use-beer="handleUseBeer"
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
        :luckyStoneRollsLeft="luckyStoneRollsLeft"
        :is-ward-stone-active="wardStoneActive"
        :ward-stone-clicks-remaining="wardStoneClicksRemaining"
        :is-encounter-beacon-active="encounterBeaconActive"
        :gold-pouch-accumulated-gold="goldPouchAccumulatedGold"
        :is-bounty-scroll-active="bountyScrollActive"
        :isIdle="isIdle"
        :weaponAugment="weaponAugment"
        :defenseAugment="defenseAugment"
        :pendingWeaponAugments="inventory.pendingWeaponAugments ?? []"
        :pendingDefenseAugments="inventory.pendingDefenseAugments ?? []"
        :equippedWeapon="equippedWeapon"
        :pendingWeapons="inventory.pendingWeapons ?? []"
        :hasSettlement="!!settlementId"
        :pageSettlementClaimedBy="pageSettlement && pageSettlement.owner_id !== user.value?.id ? (pageSettlement.lord_history?.[0]?.playerName ?? 'another player') : null"
        @visit-settlement="openSettlement"
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
        @use-beer="handleUseBeer"
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
        :hasSettlement="!!settlementId"
        :pageSettlementClaimedBy="pageSettlement && pageSettlement.owner_id !== user.value?.id ? (pageSettlement.lord_history?.[0]?.playerName ?? 'another player') : null"
        @visit-settlement="openSettlement"
        :is-encounter-beacon-active="encounterBeaconActive"
        :gold-pouch-accumulated-gold="goldPouchAccumulatedGold"
        :is-bounty-scroll-active="bountyScrollActive"
        :isIdle="isIdle"
        :weaponAugment="weaponAugment"
        :defenseAugment="defenseAugment"
        :pendingWeaponAugments="inventory.pendingWeaponAugments ?? []"
        :pendingDefenseAugments="inventory.pendingDefenseAugments ?? []"
        :equippedWeapon="equippedWeapon"
        :pendingWeapons="inventory.pendingWeapons ?? []"
      />
    </template>
    <template #journey>
      <MapModal
        embedded
        :hideMap="true"
        :fullChain="chain"
        :currentTargetIndex="currentTargetIndex"
        :markedPOIs="markedPOIs"
        :engagedPOIs="engagedPOIs"
        :isIdle="isIdle"
        :hasSettlement="!!settlementId"
        @revisit-poi="handleRevisitPOI"
        @visit-settlement="openSettlement(); hubOpen = false"
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

  <WorldMapModal
    v-if="showWorldMap"
    :userId="user?.id"
    :settlementId="settlementId"
    :hasSettlement="!!settlementId"
    :fullChain="chain"
    :currentTargetIndex="currentTargetIndex"
    @close="showWorldMap = false"
    @visit-settlement="openSettlement(); showWorldMap = false"
  />

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

  <Transition name="rest-backdrop">
    <div v-if="showRuneCacheModal" class="rest-backdrop"></div>
  </Transition>
  <Transition name="rune-panel">
  <RuneCacheModal
    v-if="showRuneCacheModal"
    :tier="runeCacheReward?.tier ?? 1"
    @close="showRuneCacheModal = false"
    @reward="handleRuneCacheReward"
  />
  </Transition>

  <DogNameModal
    v-if="showDogNameModal"
    @named="onDogNamed"
  />

  <!-- Town Naming Modal -->
  <div v-if="showTownNamingModal" class="town-naming-overlay">
    <div class="town-naming-modal">
      <div class="town-naming-title"><i class="ra ra-castle-flag"></i> Name Your Settlement</div>
      <div class="town-naming-region">
        Region: <em>{{ (current ?? "Unknown Lands").replaceAll("_", " ") }}</em>
      </div>
      <input
        v-model="pendingTownName"
        class="town-naming-input"
        placeholder="Town name..."
        maxlength="40"
        @keydown.enter="submitTownName"
        autofocus
      />
      <div class="town-naming-actions">
        <button
          class="town-naming-btn"
          :disabled="!pendingTownName.trim()"
          @click="submitTownName"
        >
          Found Town
        </button>
        <button class="town-naming-cancel" @click="showTownNamingModal = false">
          Cancel
        </button>
      </div>
    </div>
  </div>

  <!-- Explorer backdrop — keeps background dark during room encounters -->
  <div v-if="showExplorer && !isInCombat" class="explorer-backdrop"></div>

  <ExplorerModal
    v-if="showExplorer && explorerState && !inEncounter"
    :explorerState="explorerState"
    @move="handleExplorerMove"
    @exit="handleExplorerExit"
  />

  <!-- Tavern Beer Shop (visitor buying from another player's tavern) -->
  <TavernBeerModal
    v-if="showTavernBeerModal && visitingSettlementData"
    :beers="visitingTavernBeers"
    :playerGold="playerGold"
    :townName="visitingSettlementData.town_name"
    @buy="handleVisitorTavernBuy"
    @close="showTavernBeerModal = false"
  />

  <Transition name="rest-backdrop">
    <div v-if="showTavernShop" class="rest-backdrop"></div>
  </Transition>
  <Transition name="tshop-panel">
  <TavernShopModal
    v-if="showTavernShop"
    :campTier="campTier"
    :playerGold="playerGold"
    :hasSettlementFlag="inventory.settlementFlag > 0"
    :hasSettlement="!!settlementId"
    :extraActions="inventory.extraActions ?? 0"
    @close="showTavernShop = false"
    @buy="handleTavernShopBuy"
    @buy-flag="handleBuySettlementFlag"
    @buy-extra-action="handleExtraActionBuy"
  />
  </Transition>

  <Transition name="rest-backdrop">
    <div v-if="showForge" class="rest-backdrop"></div>
  </Transition>
  <Transition name="forge-panel">
  <ForgeModal
    v-if="showForge"
    :scrapMetal="inventory.scrapMetal"
    :weaponBonus="weaponBonus"
    :shieldBonus="shieldBonus"
    :weaponAugment="weaponAugment"
    :defenseAugment="defenseAugment"
    :pendingWeaponAugments="inventory.pendingWeaponAugments ?? []"
    :pendingDefenseAugments="inventory.pendingDefenseAugments ?? []"
    :pendingWeapons="inventory.pendingWeapons ?? []"
    :equippedWeapon="equippedWeapon"
    @close="showForge = false"
    @forge="handleForge"
    @install-augment="handleInstallAugment"
    @equip-weapon="handleEquipWeapon"
    @craft-book="handleCraftBook"
    :libraryReady="libraryReady"
  />
  </Transition>

  <Transition name="forge-panel">
  <LibraryModal
    v-if="showLibrary"
    :libraryBook="libraryBook"
    :libraryProgress="libraryProgress"
    :libraryReady="libraryReady"
    :craftedLevels="craftedLevels"
    :scrapMetal="inventory.scrapMetal"
    @close="showLibrary = false"
    @start-reading="startReadingBook"
  />
  </Transition>

  <BreweryModal
    v-if="showBrewery && settlement"
    :breweryState="getBreweryStateFromBuildings(settlement?.buildings)"
    :playerGold="playerGold"
    :playerName="playerName"
    :currentClickCount="clickCount"
    :hasTavern="settlementHasTavern"
    @close="showBrewery = false"
    @update-brewery="handleBreweryUpdate"
    @spend-gold="(amt) => { playerGold -= amt }"
    @earn-gold="(amt) => { playerGold += amt }"
    @add-to-backpack-ingredient="handleBreweryIngredientToBackpack"
    @add-to-backpack-beer="handleBreweryBeerToBackpack"
    @list-in-tavern="handleBreweryListInTavern"
  />

  <BarracksModal
    v-if="showBarracks && settlement"
    :barrackData="getBarracksStateFromBuildings(settlement?.buildings)"
    :activeWarriors="warriors"
    :playerGold="playerGold"
    :currentClickCount="clickCount"
    @close="showBarracks = false"
    @update-barracks="handleBarracksUpdate"
    @deploy-warrior="(w) => warriors.push(w)"
    @dismiss-warrior="(id) => { warriors = warriors.filter(w => w.id !== id) }"
    @spend-gold="(amt) => { playerGold -= amt }"
  />

</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from "vue";
import ArticleViewer from "@/components/ArticleViewer.vue";
import Header from "@/components/Header.vue";
import VictoryModal from "@/components/VictoryModal.vue";
import ClassSelect from "@/components/ClassSelect.vue";
import SplashScreen from "@/components/SplashScreen.vue";
import DefeatModal from "@/components/DefeatModal.vue";
import RestModal from "@/components/RestModal.vue";
import ShopModal from "@/components/ShopModal.vue";
import InventoryModal from "@/components/InventoryModal.vue";
import MapModal from "@/components/MapModal.vue";
import WorldMapModal from "@/components/WorldMapModal.vue";
import NotesModal from "@/components/NotesModal.vue";
import HubModal from "@/components/HubModal.vue";
import DieSlayerModal from "@/components/DieSlayerModal.vue";
import CampfireOverlay from "@/components/CampfireOverlay.vue";
import RuneCacheModal from "@/components/RuneCacheModal.vue";
import DogNameModal from "@/components/DogNameModal.vue";
import JourneyRecapModal from "@/components/JourneyRecapModal.vue";
import TavernShopModal from "@/components/TavernShopModal.vue";
import ForgeModal from "@/components/ForgeModal.vue";
import LibraryModal from "@/components/LibraryModal.vue";
import BreweryModal from "@/components/BreweryModal.vue";
import BarracksModal from "@/components/BarracksModal.vue";
import TavernBeerModal from "@/components/TavernBeerModal.vue";
import SettlementModal from "@/components/SettlementModal.vue";
import ExplorerModal from "@/components/ExplorerModal.vue";
import { EXPLORER_MAPS, buildExplorerState } from "@/utils/explorerMaps.js";
import { generateEnemyGroup } from "@/utils/encounterGenerator";
import { useCombatScene } from "@/composables/useCombatScene";
const { actionsPlaying } = useCombatScene();

import { shopItems as allShopItems } from "@/utils/shopItems";
import { isBoss } from "@/utils/bossGenerator";
import { generateMiniBoss } from "@/utils/miniBossGenerator";
import { generateSettlementBoss } from "@/utils/settlementBossGenerator";
import { npcData, loreData } from "@/utils/encounterGenerator";
import { QUESTS } from "@/utils/quests";
import { getWeapon } from "@/utils/weapons";
import { classes } from "@/utils/classes";
import { supabase } from "@/lib/supabase";
import { classifyArticle } from "@/utils/continentClassifier";
import { useAuth } from "@/composables/useAuth";

import { useGameFlow } from "@/composables/useGameFlow";
import { useGameLog } from "@/composables/useGameLog";
import { useModals } from "@/composables/useModals";
import { usePlayerState } from "@/composables/usePlayerState";
import { useInventory } from "@/composables/useInventory";
import { useStatusEffects } from "@/composables/useStatusEffects";
import { useCombat } from "@/composables/useCombat";
import { useGameHandlers } from "@/composables/useGameHandlers";
import { useSettlement, getBreweryStateFromBuildings, getBarracksStateFromBuildings } from "@/composables/useSettlement";

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
  showRecap,
  recapType,
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
const showWorldMap = ref(false);
const showTavernShop = ref(false);
const pageSettlement = ref(null); // settlement claimed on the current article (any player)

const pageSettlementClaimedBy = computed(() => {
  if (!pageSettlement.value) return "";
  // Current user's own settlement — use live username
  if (pageSettlement.value.owner_id === user.value?.id && user.value?.user_metadata?.username) {
    return user.value.user_metadata.username;
  }
  // Another player's settlement — use stored signInEmail, fall back to playerName
  const stored = pageSettlement.value.lord_history?.[0]?.signInEmail
    ?? pageSettlement.value.lord_history?.[0]?.playerName
    ?? "Someone";
  return stored;
});
const showForge   = ref(false);
const showLibrary = ref(false);
const showBrewery  = ref(false);
const showBarracks = ref(false);

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
  log(`<i class="ra ra-fire"></i> You rested at the ${reward.name}. You gained +15 HP and ${bonusLabels[reward.type]}.`);
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
  weaponAugment,
  defenseAugment,
  equippedWeapon,
} = player;

function onDogNamed(name) {
  dogName.value = name;
  showDogNameModal.value = false;
  log(`<i class="ra ra-pawprint"></i> You named your companion <strong>${name}</strong>! They wag their tail happily.`);
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
    if (item.effect === "weaponAugment" || item.effect === "defenseAugment") return false;
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
  luckyStoneRollsLeft,
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
const recapDismissed = ref(false);

// ── Enemy selection (player must click to select) ─────────────────────────
const playerSelectedTarget = ref(false);

watch(encounter, (newEnc, oldEnc) => {
  if (newEnc?.type === 'combat' && oldEnc?.type !== 'combat') {
    playerSelectedTarget.value = false;
  }
});

function onSwitchTarget(idx) {
  handleSwitchTarget(idx);
  playerSelectedTarget.value = true;
}

watch(isGameComplete, (val) => {
  if (val && !recapDismissed.value) {
    showRecap.value = true;
    recapType.value = 'victory';
  }
});

watch(encounter, (newVal) => {
  if (newVal?.type === 'combat' && newVal?.enemy) {
    lastBattle.value = {
      enemyName: newVal.enemy.name ?? '',
      article: formattedTitle.value ?? '',
    };
  }
});

watch(playerHP, (newVal) => {
  if (playerClass.value && newVal <= 0 && !defeated.value && !showRecap.value) {
    log(
      `<i class="ra ra-skull"></i> <span class="player-name">${playerName.value}</span> was defeated.`
    );
    encounter.value = null;
    showRecap.value = true;
    recapType.value = 'defeat';
  }
});

function onRecapContinue() {
  showRecap.value = false;
  if (recapType.value === 'defeat') {
    defeated.value = true;
  } else if (recapType.value === 'victory') {
    recapDismissed.value = true;
  }
}

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
  enemyHitKey,
  lastDamageTaken,
  playerHitKey,
  lastGoldStolen,
  lastProcEvent,
  counterResult,
  daysCount,
  playerEnrageCharges,
  focusPips,
  guardCharges,
  allyCompanion,
  warriors,
  handleSwitchTarget,
  victoryLoot,
  enemyIntents,
  actionFlash,
  libraryBook,
  libraryProgress,
  libraryReady,
  craftedLevels,
  startReadingBook,
  craftLibraryBook,

} = useGameHandlers({
  gameFlow,
  log,
  logEnemyAction,
  gameLog,
  modals,
  player,
  inventory,
  enlightenmentFishAccumulatedHP,
  combat,
  statusEffects,
});

watch(actionsPlaying, (playing) => {
  if (!playing) playerSelectedTarget.value = false;
});

// ── Splash screen ─────────────────────────────────────────────────────────────
const showSplash = ref(false);
const pendingClassSelection = ref(null);

function handleClassSelectionWithSplash(payload) {
  pendingClassSelection.value = payload;
  showSplash.value = true;
}

function onSplashDone() {
  showSplash.value = false;
  if (pendingClassSelection.value) {
    handleClassSelection(pendingClassSelection.value);
    pendingClassSelection.value = null;
  }
}

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
    luckyStoneRollsLeft,
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

// ── Explorer ────────────────────────────────────────────────────────────────
const showExplorer       = ref(false);
const explorerState      = ref(null);   // { mapId, playerNode, rooms }
const explorerCombatRoom = ref(null);   // nodeId of room that triggered combat
const explorerActiveRoom = ref(null);   // nodeId of room currently showing dialogue

// ── Settlement ─────────────────────────────────────────────────────────────
const settlementFlagOffered   = ref(false); // NPC encounter has fired
const settlementFlagAccepted  = ref(false); // player said yes
const settlementId            = ref(null);  // uuid of their settlement row
const lastSettlementVisitClickCount = ref(0);
const showSettlementView      = ref(false);
const visitingSettlementData  = ref(null);  // full settlement object for a visitor view
const showVisitorSettlement   = ref(false);
const showTavernBeerModal     = ref(false);
const settlementBossActive    = ref(false); // true while challenging an abandoned settlement's guardian
const settlementShortRestDay  = ref(0);     // daysCount value when settlement short rest was last used
const showTownNamingModal     = ref(false);
const pendingTownName         = ref("");

const {
  settlement,
  isLoadingSettlement,
  createSettlement,
  loadSettlement,
  loadSettlementFull,
  saveBuildings,
  saveTerrain,
  saveBreweryState,
  saveBarracksState,
  saveTownMeta,
  getTownMetaFromBuildings,
  getSettlementByWikiTitle,
  markAbandoned,
  markAbandonedByOwner,
  claimSettlement,
} = useSettlement();

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

// Derive short/long rest from click position within the day — same formula as the sky track.
// This is immune to restModalCount drift (e.g. save-timing races that flip the parity).
const isLongRest = computed(() => {
  const adjusted = clickCount.value - longRestDismissCount.value * 24;
  if (adjusted <= 0) return false;
  const pos = (adjusted - 1) % 24;
  return pos === 23; // position 23 = click 24 of the day = long rest
});

const isIdle = computed(() =>
  !isInCombat.value &&
  !encounter.value &&
  !showRestModal.value &&
  !showShopModal.value
);
const maxActionsPerTurn = computed(() => 1 + (inventory.value.extraActions ?? 0));
const canShortRestAtSettlement = computed(() => settlementShortRestDay.value !== daysCount.value);
const canChallengeSettlement   = computed(() => isIdle.value && !settlementBossActive.value && !settlementId.value);
const isEnemyVenomed = computed(() => enemyStatusEffects.value?.some(e => e.type === "poison") ?? false);
const isEnemyBleeding = computed(() => enemyStatusEffects.value?.some(e => e.type === "bleed") ?? false);
const isEnemyOnFire = computed(() => enemyStatusEffects.value?.some(e => e.type === "fire") ?? false);

const CAMP_NAMES = ["", "Sleeping Bag", "Pillow", "Tent"];
const CAMP_COSTS = [0, 50, 75, 100];

function handleTavernShopBuy(tier) {
  const cost = CAMP_COSTS[tier];
  if (playerGold.value < cost) return;
  playerGold.value -= cost;
  campTier.value = tier;
  log(`<i class="ra ra-campfire"></i> You purchase a ${CAMP_NAMES[tier]}. Your long rest has improved.`);
  saveGame();
}

function handleExtraActionBuy(tier) {
  const costs = { 1: 150, 2: 300 };
  const cost = costs[tier];
  if (!cost || playerGold.value < cost) return;
  playerGold.value -= cost;
  inventory.value.extraActions = tier;
  const names = { 1: "Quick Hands Charm", 2: "Swift Strike Rune" };
  log(`<i class="ra ra-lightning-bolt"></i> You purchase the ${names[tier]}. You now have ${1 + tier} combat actions per turn.`);
  saveGame();
}

function handleForge({ type, scrapUsed }) {
  const upgrades = scrapUsed / 2;
  inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) - scrapUsed;
  if (type === "weapon") {
    weaponBonus.value += upgrades;
    log(`<i class="ra ra-hammer"></i> <span class="player-name">${playerName.value}</span> forged ${scrapUsed} scrap into +${upgrades} Weapon Bonus.`);
  } else {
    shieldBonus.value += upgrades;
    log(`<i class="ra ra-hammer"></i> <span class="player-name">${playerName.value}</span> forged ${scrapUsed} scrap into +${upgrades} Defense Bonus.`);
  }
}

const settlementHasTavern = computed(() =>
  (settlement.value?.buildings ?? []).some(b => b.type === "tavern")
);

async function handleBreweryUpdate(newState) {
  if (!settlementId.value || !settlement.value) return;
  await saveBreweryState(settlementId.value, newState);
}

async function handleBarracksUpdate(newState) {
  if (!settlementId.value || !settlement.value) return;
  await saveBarracksState(settlementId.value, newState);
}

function handleBreweryIngredientToBackpack({ key, qty }) {
  const road = inventory.value.roadIngredients ?? {};
  road[key] = (road[key] ?? 0) + qty;
  inventory.value.roadIngredients = { ...road };
  log(`<i class="ra ra-leaf"></i> Added ${qty}× ${key.replace(/_/g, " ")} to your backpack.`);
}

function handleBreweryBeerToBackpack(beer) {
  const beers = inventory.value.beers ?? [];
  const existing = beers.find(b => b.name === beer.name && b.quality === beer.quality);
  if (existing) {
    existing.qty += beer.qty;
  } else {
    beers.push({ ...beer });
  }
  inventory.value.beers = [...beers];
  log(`<i class="ra ra-brandy-bottle"></i> Added ${beer.qty}× "${beer.name}" to your backpack.`);
}

function handleBreweryListInTavern(beer) {
  log(`<i class="ra ra-castle-emblem"></i> "${beer.name}" listed in the tavern for ${beer.sellPrice}g each.`);
}

function handleUseBeer(idx) {
  const beers = [...(inventory.value.beers ?? [])];
  const beer = beers[idx];
  if (!beer) return;
  playerHP.value = Math.min(effectiveMaxHP.value, playerHP.value + beer.hp);
  log(`<i class="ra ra-beer"></i> You drink "${beer.name}" and restore ${beer.hp} HP.`);
  if (beer.poisonClicks > 0) {
    poisonedClicksLeft.value = (poisonedClicksLeft.value ?? 0) + beer.poisonClicks;
    poisonDamagePerClick.value = 1;
    log(`<i class="ra ra-skull"></i> The swill courses through you — poisoned for ${beer.poisonClicks} clicks.`);
  }
  if (beer.qty > 1) beers[idx] = { ...beer, qty: beer.qty - 1 };
  else beers.splice(idx, 1);
  inventory.value.beers = beers;
}

const visitingTavernBeers = computed(() => {
  const data = visitingSettlementData.value;
  if (!data) return [];
  const state = getBreweryStateFromBuildings(data.buildings ?? []);
  return (state?.tavernStock ?? []).filter(b => b.qty > 0);
});

async function handleVisitorTavernBuy({ beer, idx }) {
  if (playerGold.value < beer.sellPrice) return;
  playerGold.value -= beer.sellPrice;
  handleBreweryBeerToBackpack({ ...beer, qty: 1 });
  log(`<i class="ra ra-beer"></i> Bought "${beer.name}" from the tavern for ${beer.sellPrice}g.`);

  // Update visiting settlement: decrement tavernStock, add gold to pending
  const data = visitingSettlementData.value;
  if (!data) return;
  const brewState = getBreweryStateFromBuildings(data.buildings ?? []);
  if (!brewState) return;
  const tavernStock = [...(brewState.tavernStock ?? [])];
  if (tavernStock[idx]) {
    tavernStock[idx] = { ...tavernStock[idx], qty: tavernStock[idx].qty - 1 };
    if (tavernStock[idx].qty <= 0) tavernStock.splice(idx, 1);
  }
  brewState.tavernStock = tavernStock;
  // Save updated brewery state back to visiting settlement
  const filtered = (data.buildings ?? []).filter(b => b.type !== "__brewery__");
  const updatedBuildings = [...filtered, { type: "__brewery__", cellIndex: -1, breweryData: brewState }];
  visitingSettlementData.value = { ...data, buildings: updatedBuildings };
  await supabase.from("settlements").update({
    buildings: updatedBuildings,
    pending_gold: (data.pending_gold ?? 0) + beer.sellPrice,
    updated_at: new Date().toISOString(),
  }).eq("id", data.id);
}

function handleAugmentBuy(item) {
  handleShopPurchase(item);
}

function handleInstallAugment({ type, key }) {
  const pending = type === "weapon"
    ? inventory.value.pendingWeaponAugments
    : inventory.value.pendingDefenseAugments;
  const idx = pending.indexOf(key);
  if (idx !== -1) pending.splice(idx, 1);

  const AUGMENT_LABELS = {
    bleedEdge: "Serrated Edge", venomCoat: "Venom Coat",
    thunderstrike: "Thunderstrike Rune", emberTemper: "Ember Temper",
    cursedRune: "Cursed Rune", soulShard: "Soul Shard",
    thornplate: "Thornplate", stoneskin: "Stoneskin",
    bloodpactRune: "Bloodpact Rune", ironWill: "Iron Will",
    wardensWard: "Warden's Ward", frostbound: "Frostbound",
  };

  if (type === "weapon") {
    if (weaponAugment.value && weaponAugment.value !== key) {
      inventory.value.pendingWeaponAugments.push(weaponAugment.value);
    }
    weaponAugment.value = key;
    log(`<i class="ra ra-hammer"></i> <span class="player-name">${playerName.value}</span> installs <strong>${AUGMENT_LABELS[key] ?? key}</strong> on their weapon!`);
  } else {
    if (defenseAugment.value && defenseAugment.value !== key) {
      inventory.value.pendingDefenseAugments.push(defenseAugment.value);
    }
    defenseAugment.value = key;
    log(`<i class="ra ra-hammer"></i> <span class="player-name">${playerName.value}</span> installs <strong>${AUGMENT_LABELS[key] ?? key}</strong> on their armor!`);
  }
}

const goldPopupKey = ref(0);
watch(lastGoldStolen, (val) => { if (val) goldPopupKey.value++; });

function handleEquipWeapon(weaponId) {
  const pending = inventory.value.pendingWeapons ?? [];
  const idx = pending.indexOf(weaponId);
  if (idx !== -1) pending.splice(idx, 1);
  if (equippedWeapon.value && equippedWeapon.value !== weaponId) {
    pending.push(equippedWeapon.value);
  }
  equippedWeapon.value = weaponId;
  const weaponName = getWeapon(weaponId)?.name ?? weaponId;
  log(`<i class="ra ra-hammer"></i> <span class="player-name">${playerName.value}</span> equips the <strong>${weaponName}</strong>!`);
  saveGame();
}

function handleCraftBook() {
  if (!libraryReady.value) return;
  const { id, type } = libraryReady.value;
  // craftLibraryBook handles scrap deduction, level tracking, log, and clears libraryReady
  craftLibraryBook();
  // Equip based on type
  if (type === "weapon") {
    if (equippedWeapon.value && equippedWeapon.value !== id) {
      if (!inventory.value.pendingWeapons) inventory.value.pendingWeapons = [];
      inventory.value.pendingWeapons.push(equippedWeapon.value);
    }
    equippedWeapon.value = id;
  } else if (type === "weapon_relic") {
    if (weaponAugment.value && weaponAugment.value !== id) {
      if (!inventory.value.pendingWeaponAugments) inventory.value.pendingWeaponAugments = [];
      inventory.value.pendingWeaponAugments.push(weaponAugment.value);
    }
    weaponAugment.value = id;
  } else if (type === "defense_relic") {
    if (defenseAugment.value && defenseAugment.value !== id) {
      if (!inventory.value.pendingDefenseAugments) inventory.value.pendingDefenseAugments = [];
      inventory.value.pendingDefenseAugments.push(defenseAugment.value);
    }
    defenseAugment.value = id;
  }
  saveGame();
}

function handleTakeQuest() {
  const quest = boardQuest.value;
  if (!quest) return;
  inventory.value.questScrolls++;
  activeQuestId.value = quest.id;
  log('<i class="ra ra-scroll-unfurled"></i> You take the quest scroll from the notice board.');
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
  log(`<i class="ra ra-scroll-unfurled"></i> ${quest.turnInLog}`);
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
      log(`<i class="ra ra-scroll-unfurled"></i> ${quest?.victoryLog ?? "Quest complete. Return to the tavern to claim your reward."}`);
    } else if (option.questStep === "leave") {
      encounter.value = null;
      activeQuestId.value = null;
      log(`<i class="ra ra-scroll-unfurled"></i> ${quest?.leaveLog ?? "You turn back. The quest scroll remains on the board."}`);
    } else if (option.questStep === "open_explorer") {
      encounter.value = null;
      explorerState.value = buildExplorerState(quest.explorerMapId);
      showExplorer.value = true;
    } else {
      advanceQuestStep(option.questStep);
    }
    return;
  }

  if (option.result === "explorer_room_complete") {
    const nodeId = explorerActiveRoom.value;
    const state = explorerState.value;
    if (nodeId && state?.rooms[nodeId]) {
      const map = EXPLORER_MAPS[state.mapId];
      const room = state.rooms[nodeId];
      room.cleared = true;
      if (option.goldBonus) {
        playerGold.value += option.goldBonus;
        log(`<i class="ra ra-gold-bar"></i> You pocket ${option.goldBonus} gold.`);
      }
      if (room.outcome === "chest") {
        const [min, max] = map.chestGold;
        const gold = Math.floor(Math.random() * (max - min + 1)) + min;
        playerGold.value += gold;
        log(`<i class="ra ra-gold-bar"></i> You pry the chest open. Inside: ${gold} gold.`);
      } else if (room.outcome === "item") {
        inventory.value.healthPotions = (inventory.value.healthPotions || 0) + 1;
        log(`<i class="ra ra-flask"></i> You pocket the health potion.`);
      } else if (room.outcome === "lore") {
        log(`<i class="ra ra-scroll-unfurled"></i> ${map.loreText}`);
      }
    }
    explorerActiveRoom.value = null;
    encounter.value = null;
    return;
  }

  if (option.result === "explorer_room_combat") {
    const nodeId = explorerActiveRoom.value;
    if (nodeId) {
      explorerCombatRoom.value = nodeId;
      let enemy, enemies;
      if (option.miniBossType) {
        const boss = generateMiniBoss(option.miniBossType, enemyDifficultyLevel.value);
        enemy = boss; enemies = [boss];
      } else {
        enemies = generateEnemyGroup(enemyDifficultyLevel.value);
        enemy = enemies[0];
      }
      encounter.value = { type: "combat", enemies, targetIndex: 0, enemy };
      enemyHP.value = enemy.currentHP;
    }
    explorerActiveRoom.value = null;
    return;
  }

  if (option.result === "explorer_quest_combat") {
    const nodeId = explorerActiveRoom.value;
    if (nodeId) {
      explorerCombatRoom.value = nodeId;
      const boss = generateMiniBoss(option.miniBossType, enemyDifficultyLevel.value);
      encounter.value = { type: "combat", enemies: [boss], targetIndex: 0, enemy: boss };
      enemyHP.value = boss.currentHP;
      questCombatActive.value = true;
      combatEncountersFought.value++;
    }
    explorerActiveRoom.value = null;
    return;
  }

  if (option.result === "explorer_room_damage") {
    const nodeId = explorerActiveRoom.value;
    const dmg = option.amount ?? 5;
    playerHP.value = Math.max(0, playerHP.value - dmg);
    log(`<i class="ra ra-dripping-blade"></i> ${option.responseText ?? `You take ${dmg} damage.`}`);
    if (nodeId && explorerState.value?.rooms[nodeId]) {
      explorerState.value.rooms[nodeId].cleared = true;
    }
    explorerActiveRoom.value = null;
    encounter.value = null;
    return;
  }

  if (option.result === "explorer_room_loot") {
    const gold = option.amount ?? 0;
    playerGold.value += gold;
    log(`<i class="ra ra-gold-bar"></i> You find ${gold} gold hidden beneath a loose floorboard.`);
    explorerActiveRoom.value = null;
    encounter.value = null;
    return;
  }

  if (option.result === "open_explorer") {
    if (option.goldBonus) {
      playerGold.value += option.goldBonus;
      log(`<i class="ra ra-gold-bar"></i> You find ${option.goldBonus} gold in the corridor before heading inside.`);
    }
    encounter.value = null;
    explorerState.value = buildExplorerState(option.mapId);
    showExplorer.value = true;
    return;
  }

  if (option.result === "settlement_accept") {
    encounter.value = null;
    settlementFlagOffered.value = true;
    inventory.value.settlementFlag = (inventory.value.settlementFlag || 0) + 1;
    log('<i class="ra ra-castle-flag"></i> The herald presses a rolled parchment and an iron-tipped flag into your hands. Open your backpack and use the flag on the article where you wish to plant it.');
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
    log(`<i class="ra ra-compass"></i> ${responseText}`);
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

  // If days_increase fires from within an explorer room, mark it cleared before handing off
  if (option.result === "days_increase" && explorerActiveRoom.value) {
    const nodeId = explorerActiveRoom.value;
    if (explorerState.value?.rooms[nodeId]) {
      explorerState.value.rooms[nodeId].cleared = true;
    }
    explorerActiveRoom.value = null;
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

const EXPLORER_ROOM_ENCOUNTERS = {
  chest: (nodeName) => ({
    type: "lore",
    lore: {
      id: "explorer_chest",
      name: nodeName,
      text: "A barnacle-encrusted chest sits in the corner, sealed with a rusted latch.",
      options: [
        { text: "Force it open.", result: "explorer_room_complete" },
        { text: "Leave it alone.", flow: "close_encounter" },
      ],
    },
  }),
  combat: (nodeName) => ({
    type: "lore",
    lore: {
      id: "explorer_combat",
      name: nodeName,
      text: "The shadows shift. Something moves in the dark. You are not alone in here.",
      options: [
        { text: "Ready yourself.", result: "explorer_room_combat" },
        { text: "Back away slowly.", flow: "close_encounter" },
      ],
    },
  }),
  item: (nodeName) => ({
    type: "lore",
    lore: {
      id: "explorer_item",
      name: nodeName,
      text: "Behind a rotting crate, something catches your eye — a vial, still sealed in wax.",
      options: [
        { text: "Take it.", result: "explorer_room_complete" },
        { text: "Leave it.", flow: "close_encounter" },
      ],
    },
  }),
  lore: (nodeName) => ({
    type: "lore",
    lore: {
      id: "explorer_lore",
      name: nodeName,
      text: "You find the ship's log, waterlogged but legible. Most entries are routine — until they aren't.",
      options: [
        { text: "Read the final entry.", result: "explorer_room_complete" },
        { text: "Leave it.", flow: "close_encounter" },
      ],
    },
  }),
  empty: (nodeName) => ({
    type: "lore",
    lore: {
      id: "explorer_empty",
      name: nodeName,
      text: "You search the room thoroughly. Nothing here but dust, old rope, and the smell of salt.",
      options: [
        { text: "Continue exploring.", flow: "close_encounter" },
      ],
    },
  }),
};

function handleExplorerMove(nodeId) {
  if (!explorerState.value) return;
  const map = EXPLORER_MAPS[explorerState.value.mapId];
  explorerState.value.playerNode = nodeId;

  const room = explorerState.value.rooms[nodeId];
  if (!room) return; // entrance node has no outcome

  room.visited = true;
  explorerActiveRoom.value = nodeId;

  const nodeName = map.nodes[nodeId]?.label ?? "Unknown Room";

  if (room.cleared) {
    const clearedText = { chest: "An empty chest, lid still open.", combat: "No enemies remain.", item: "Nothing left here.", lore: "The log lies where you left it.", empty: "Still nothing.", damage: "The trap has already been sprung." };
    encounter.value = {
      type: "lore",
      lore: {
        id: "explorer_cleared",
        name: nodeName,
        text: clearedText[room.outcome] ?? "You've already been through here.",
        options: [{ text: "Continue exploring.", flow: "close_encounter" }],
      },
    };
    return;
  }

  const node = map.nodes[nodeId];
  if (node?.buildEncounter) {
    encounter.value = node.buildEncounter(nodeName, explorerState.value);
    return;
  }

  const builder = EXPLORER_ROOM_ENCOUNTERS[room.outcome];
  if (builder) encounter.value = builder(nodeName);
}

function handleExplorerExit() {
  showExplorer.value = false;
  explorerState.value = null;
  explorerCombatRoom.value = null;
}

// When explorer combat ends, mark the room cleared and restore explorer
watch(isInCombat, (newVal, oldVal) => {
  if (oldVal && !newVal && explorerCombatRoom.value) {
    const roomId = explorerCombatRoom.value;
    explorerCombatRoom.value = null;
    if (explorerState.value?.rooms[roomId]) {
      explorerState.value.rooms[roomId].cleared = true;
    }
  }
});

function handleChallengeSettlementBoss() {
  const data = visitingSettlementData.value;
  if (!data || !data.abandoned) return;
  const boss = generateSettlementBoss(data.buildings ?? [], data.guardian_boss ?? null);
  showVisitorSettlement.value = false;
  encounter.value = { type: "combat", enemy: boss };
  enemyHP.value = boss.currentHP;
  nextEnemyAttack.value =
    Math.floor(Math.random() * (boss.maxDamage - boss.minDamage + 1)) + boss.minDamage;
  enemyNextAction.value = "attack";
  combatEncountersFought.value++;
  settlementBossActive.value = true;
  log(`<i class="ra ra-sword"></i> A <strong>${boss.name}</strong> rises to defend the ruins of <em>${data.town_name}</em>!`);
  logEnemyAction(enemyNextAction, nextEnemyAttack);
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
  const emoji = activeQuest.value?.combatEmoji ?? '<i class="ra ra-sword"></i>';
  log(`${emoji} A <strong>${boss.name}</strong> blocks your path! What do you do?`);
  logEnemyAction(enemyNextAction, nextEnemyAttack);
}

// ── Settlement handlers ────────────────────────────────────────────────────

async function submitTownName() {
  const name = pendingTownName.value.trim();
  if (!name) return;

  if (!user.value?.id) {
    log('<i class="ra ra-aware"></i> You must be logged in to found a settlement.');
    return;
  }

  const wikiTitle = current.value ?? "Unknown Lands";

  // Final server-side guard: re-check the article isn't already claimed
  const existing = await getSettlementByWikiTitle(wikiTitle);
  if (existing) {
    const claimedBy = existing.lord_history?.[0]?.playerName ?? "another player";
    log(`<i class="ra ra-aware"></i> This region was claimed by <strong>${claimedBy}</strong> before you could plant your flag.`);
    showTownNamingModal.value = false;
    pendingTownName.value = "";
    pageSettlement.value = existing;
    return;
  }

  try {
    const continent = await classifyArticle(wikiTitle);
    const id = await createSettlement({
      userId: user.value.id,
      townName: name,
      playerName: playerName.value,
      wikiTitle,
      signInEmail: user.value.user_metadata?.username ?? null,
      continent,
    });
    settlementId.value = id;
    settlementFlagAccepted.value = true;
    inventory.value.settlementFlag = 0;
    showTownNamingModal.value = false;
    pendingTownName.value = "";
    lastSettlementVisitClickCount.value = clickCount.value;
    pageSettlement.value = settlement.value; // show banner immediately on this article
    log(`<i class="ra ra-castle-flag"></i> <strong>${name}</strong> has been founded in the region of <em>${wikiTitle.replaceAll("_", " ")}</em>. Your lands await.`);
    await triggerAutoSave();
  } catch (err) {
    console.error("Failed to create settlement:", err);
    log(`<i class="ra ra-aware"></i> Could not found the settlement: ${err?.message ?? "unknown error"}`);
  }
}

async function openSettlement() {
  if (!settlementId.value) return;
  const data = await loadSettlement(settlementId.value);
  if (data?.wiki_title) current.value = data.wiki_title;
  showSettlementView.value = true;
}

// Opens the settlement on the current page — owner gets their edit view,
// visitors get a read-only view of whoever claimed it.
async function openPageSettlement() {
  if (!pageSettlement.value) return;
  if (pageSettlement.value.owner_id === user.value?.id && settlementId.value === pageSettlement.value.id) {
    openSettlement();
  } else {
    const full = await loadSettlementFull(pageSettlement.value.id);
    if (!full) return;
    visitingSettlementData.value = full;
    showVisitorSettlement.value = true;
  }
}

async function closeSettlement() {
  showSettlementView.value = false;
  await triggerAutoSave();
}

async function handleSettlementCollect() {
  if (!settlementId.value || !settlement.value) return;
  const clicksSince = clickCount.value - lastSettlementVisitClickCount.value;
  const { computeYield, BUILDING_DEFS } = await import("@/utils/buildingDefs.js");
  const { gold, scrap, healthPotions } = computeYield(
    settlement.value.buildings ?? [],
    settlement.value.terrain ?? [],
    clickCount.value,
    lastSettlementVisitClickCount.value
  );
  if (gold > 0)          playerGold.value += gold;
  if (scrap > 0)         inventory.value.scrapMetal = (inventory.value.scrapMetal || 0) + scrap;
  if (healthPotions > 0) inventory.value.healthPotions = (inventory.value.healthPotions || 0) + healthPotions;
  lastSettlementVisitClickCount.value = clickCount.value;

  // Attribute earnings to each building for the info panel
  if (clicksSince > 0) {
    const hasMine = (settlement.value.buildings ?? []).some(b => b.type === "mine");
    const houseCount = (settlement.value.buildings ?? []).filter(b => b.type === "house").length;
    const houseGoldPerClick = Math.floor(houseCount * (BUILDING_DEFS.house.villagersPerBuilding ?? 5) / 25);
    const updatedBuildings = (settlement.value.buildings ?? []).map(b => {
      const def = BUILDING_DEFS[b.type];
      if (!def) return b;
      const e = { gold: 0, scrap: 0, healthPotions: 0 };
      const bClicks = (b.placedAtClick != null && b.placedAtClick > lastSettlementVisitClickCount.value)
        ? Math.max(0, clickCount.value - b.placedAtClick)
        : clicksSince;
      if (def.requiresBuildingOnMap === "mine" && !hasMine) { /* skip */ }
      else {
        if (def.yieldType === "gold" && def.yieldEvery)
          e.gold += Math.floor(bClicks / def.yieldEvery) * def.yieldAmount;
        if (def.yieldType === "healthPotion" && def.yieldEvery)
          e.healthPotions += Math.floor(bClicks / def.yieldEvery) * def.yieldAmount;
        if (def.bonusYieldType === "scrap" && def.bonusYieldEvery)
          e.scrap += Math.floor(bClicks / def.bonusYieldEvery) * def.bonusYieldAmount;
        if (b.type === "house" && houseGoldPerClick > 0)
          e.gold += houseGoldPerClick * clicksSince;
      }
      const prev = b.totalEarned ?? { gold: 0, scrap: 0, healthPotions: 0 };
      return { ...b, totalEarned: { gold: prev.gold + e.gold, scrap: prev.scrap + e.scrap, healthPotions: prev.healthPotions + e.healthPotions } };
    });
    settlement.value = { ...settlement.value, buildings: updatedBuildings };
    await saveBuildings(settlementId.value, updatedBuildings);
  }

  const parts = [];
  if (gold > 0)          parts.push(`${gold}g`);
  if (scrap > 0)         parts.push(`${scrap} Scrap Metal`);
  if (healthPotions > 0) parts.push(`${healthPotions} Health Potion${healthPotions > 1 ? "s" : ""}`);
  if (parts.length > 0) {
    log(`<i class="ra ra-gold-bar"></i> Collected from ${settlement.value?.town_name ?? "your settlement"}: ${parts.join(", ")}.`);
  } else {
    log(`<i class="ra ra-gold-bar"></i> Nothing to collect yet from ${settlement.value?.town_name ?? "your settlement"}. Build more and come back after more clicks.`);
  }
  await triggerAutoSave();
}

async function handleSettlementPlaceBuilding({ cellIndex, type, cost, name }) {
  if (!settlementId.value || !settlement.value) return;
  if (playerGold.value < cost) return;
  const buildings = [...(settlement.value.buildings ?? [])];
  buildings.push({ cellIndex, type, name: name ?? null, placedAtClick: clickCount.value, totalEarned: { gold: 0, scrap: 0, healthPotions: 0 } });
  settlement.value = { ...settlement.value, buildings };
  playerGold.value -= cost;
  await saveBuildings(settlementId.value, buildings);
  await triggerAutoSave();
}

async function handleSettlementRemoveBuilding({ cellIndex, refund }) {
  if (!settlementId.value || !settlement.value) return;
  const buildings = (settlement.value.buildings ?? []).filter(b => b.cellIndex !== cellIndex);
  settlement.value = { ...settlement.value, buildings };
  if (refund > 0) playerGold.value += refund;
  await saveBuildings(settlementId.value, buildings);
  await triggerAutoSave();
}

async function handleTownMetaUpdate({ townLog, deadNames }) {
  if (!settlementId.value || !settlement.value) return;
  await saveTownMeta(settlementId.value, { townLog, deadNames });
}

async function handleSettlementChangeTerrain({ cellIndex, terrainType }) {
  if (!settlementId.value || !settlement.value) return;
  const terrain = [...(settlement.value.terrain ?? [])];
  terrain[cellIndex] = terrainType;
  settlement.value = { ...settlement.value, terrain };
  await saveTerrain(settlementId.value, terrain);
}

watch(encounter, async (newVal, oldVal) => {
  if (settlementBossActive.value && oldVal?.type === "combat" && newVal === null) {
    settlementBossActive.value = false;
    const data = visitingSettlementData.value;
    if (!defeated.value && enemyHP.value <= 0 && data) {
      // Player won — claim the settlement
      if (user.value?.id) {
        await claimSettlement(
          data.id,
          user.value.id,
          playerName.value,
          user.value.user_metadata?.username ?? null,
          daysCount.value
        );
        // Grant the loot
        playerGold.value += oldVal.enemy?.goldReward ?? 0;
        inventory.value.scrapMetal = (inventory.value.scrapMetal ?? 0) + (oldVal.enemy?.scrapReward ?? 0);
        // Transfer settlement ownership to this player
        settlementId.value = data.id;
        pageSettlement.value = null; // banner will reload on next tick
        loadPageSettlement(current.value);
        log(`<i class="ra ra-castle-emblem"></i> <strong>${data.town_name}</strong> has been liberated! You are now its lord.`);
        await triggerAutoSave();
      }
    } else if (!defeated.value) {
      log(`<i class="ra ra-sword"></i> You retreat from the ruins. The guardian still holds the settlement.`);
    }
    visitingSettlementData.value = null;
    return;
  }
});

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
        log(`<i class="ra ra-scroll-unfurled"></i> ${quest?.victoryLog ?? "Quest enemy defeated. Return to the tavern to claim your reward."}`);
      }
    } else if (!defeated.value) {
      activeQuestId.value = null;
      log(`<i class="ra ra-scroll-unfurled"></i> ${quest?.leaveLog ?? "You retreat. The quest remains available."}`);
    }
  }
});

function handleUseInventoryItem(itemType, mapId) {
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
  } else if (itemType === "adventurersRations") {
    itemHandlers.useAdventurersRations();
  } else if (itemType === "enlightenmentFish") {
    itemHandlers.useEnlightenmentFish();
  } else if (itemType === "minorHealthPotion") {
    itemHandlers.useMinorHealthPotion();
  } else if (itemType === "wardStone") {
    itemHandlers.useWardStone();
  } else if (itemType === "encounterBeacon") {
    itemHandlers.useEncounterBeacon();
  } else if (itemType === "goldPouch") {
    itemHandlers.useGoldPouch();
  } else if (itemType === "bountyScroll") {
    itemHandlers.useBountyScroll();
  } else if (itemType === "luckyStone") {
    itemHandlers.useLuckyStone();
  } else if (itemType === "settlementFlag") {
    if (pageSettlement.value) {
      const claimedBy = pageSettlement.value.lord_history?.[0]?.playerName ?? "another player";
      log(`<i class="ra ra-aware"></i> This region has already been claimed by <strong>${claimedBy}</strong>. You cannot plant your flag here.`);
      return;
    }
    showTownNamingModal.value = true;
    closeInventoryModal();
    hubOpen.value = false;
  } else if (itemType === "questScroll") {
    inventory.value.questScrolls--;
    closeInventoryModal();
    hubOpen.value = false;
    advanceQuestStep(0);
    showQuestNotification.value = true;
    setTimeout(() => { showQuestNotification.value = false; }, 6000);
  } else if (itemType === "treasureMap") {
    const maps = inventory.value.treasureMaps ?? [];
    const map = maps.find((m) => m.id === mapId);
    if (!map || map.opened) return;
    map.opened = true;
    inventory.value.treasureMaps = [...maps];
    log(`<i class="ra ra-compass"></i> You break the wax seal and unroll the map. Your destination: <strong>${map.article.replace(/_/g, " ")}</strong>. Navigate there to claim your treasure.`);
    closeInventoryModal();
  }
}

async function handleConfirmTurn(actions) {
  await handleCombatActionWrapper(actions);
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

async function loadPageSettlement(wikiTitle) {
  const base = settlement.value?.wiki_title === wikiTitle
    ? settlement.value
    : await getSettlementByWikiTitle(wikiTitle);
  if (!base) { pageSettlement.value = null; return; }

  // If signInEmail was never stored, inject username from the current auth user for their own settlement
  const ownerName = base.lord_history?.[0]?.signInEmail;
  if (!ownerName && base.owner_id === user.value?.id && user.value?.user_metadata?.username) {
    const history = (base.lord_history ?? []).map((e, i) =>
      i === 0 ? { ...e, signInEmail: user.value.user_metadata.username } : e
    );
    pageSettlement.value = { ...base, lord_history: history };
  } else {
    pageSettlement.value = base;
  }
}

function handleBuySettlementFlag() {
  if (playerGold.value < 150) return;
  playerGold.value -= 150;
  inventory.value.settlementFlag = (inventory.value.settlementFlag || 0) + 1;
  settlementFlagOffered.value = true;
  log('<i class="ra ra-castle-flag"></i> You purchase a Settlement Flag. Open your backpack and use it on the Wikipedia article where you wish to plant it.');
}

async function handleRest(...args) {
  callHandleRest(...args);
  await triggerAutoSave();
}

async function handleSettlementShortRest() {
  settlementShortRestDay.value = daysCount.value;
  await handleRest('short');
}

watch(encounter, (newVal, oldVal) => {
  if (newVal === null && oldVal !== null) triggerAutoSave();
});

watch(inventory, () => {
  clearTimeout(inventoryAutoSaveTimer);
  inventoryAutoSaveTimer = setTimeout(() => triggerAutoSave(), 500);
}, { deep: true });

// Load settlement banner data whenever the current article changes
watch(current, (title) => {
  if (title) loadPageSettlement(title);
  else pageSettlement.value = null;
});

async function saveGame() {
  if (!user.value?.id) return;
  await supabase.from("saves").upsert({
    user_id: user.value.id,
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
      weaponAugment: weaponAugment.value,
      defenseAugment: defenseAugment.value,
      equippedWeapon: equippedWeapon.value,
      markedPOIs: [...markedPOIs.value],
      engagedPOIs: [...engagedPOIs.value],
      settlementFlagOffered: settlementFlagOffered.value,
      settlementFlagAccepted: settlementFlagAccepted.value,
      settlementId: settlementId.value,
      lastSettlementVisitClickCount: lastSettlementVisitClickCount.value,
      settlementShortRestDay: settlementShortRestDay.value,
      libraryBook: libraryBook.value,
      libraryProgress: libraryProgress.value,
      libraryReady: libraryReady.value,
      craftedLevels: { ...craftedLevels.value },
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
  weaponAugment.value = s.weaponAugment ?? "";
  defenseAugment.value = s.defenseAugment ?? "";
  equippedWeapon.value = s.equippedWeapon ?? null;
  goldPouchAccumulatedGold.value = s.goldPouchAccumulatedGold ?? 0;
  markedPOIs.value = s.markedPOIs ?? [];
  engagedPOIs.value = s.engagedPOIs ?? [];
  settlementFlagOffered.value  = s.settlementFlagOffered ?? false;
  settlementFlagAccepted.value = s.settlementFlagAccepted ?? false;
  settlementId.value           = s.settlementId ?? null;
  lastSettlementVisitClickCount.value = s.lastSettlementVisitClickCount ?? 0;
  settlementShortRestDay.value = s.settlementShortRestDay ?? 0;
  if (s.libraryBook != null) libraryBook.value = s.libraryBook;
  libraryProgress.value = s.libraryProgress ?? 0;
  if (s.libraryReady != null) libraryReady.value = s.libraryReady;
  if (s.craftedLevels) Object.assign(craftedLevels.value, s.craftedLevels);
}

async function handleRestart() {
  if (user.value?.id) {
    // Mark the player's settlement as abandoned before wiping their save.
    if (settlementId.value) {
      await markAbandoned(
        settlementId.value,
        settlement.value?.buildings ?? [],
        daysCount.value
      );
    } else {
      await markAbandonedByOwner(user.value.id, daysCount.value);
    }
    await supabase.from("saves").delete().eq("user_id", user.value.id);
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
  if (user.value?.id) await loadSave(user.value.id);
});

watch(user, async (newUser, oldUser) => {
  if (newUser && !oldUser) await loadSave(newUser.id);
});
</script>

<style scoped>
@import "./styles/gameViewStyles.css";

.settlement-side-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 680px;
  height: 100dvh;
  z-index: 150;
  background: #111111;
  border-left: 1px solid #2a2a2a;
  box-shadow: -6px 0 32px rgba(0, 0, 0, 0.7);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

@media (max-width: 700px) {
  .settlement-side-panel {
    width: 100vw;
    border-left: none;
  }
}
</style>

<style>
.gold-stolen-popup {
  position: fixed;
  bottom: calc(clamp(260px, 60vh, 500px) + clamp(120px, 18vh, 220px) + 20px);
  left: 25%;
  transform: translateX(-50%);
  font-size: 30px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 2px 10px #000, 0 0 24px rgba(255,210,0,0.95);
  white-space: nowrap;
  pointer-events: none;
  z-index: 9999;
  animation: gold-stolen-float 2.8s ease-out forwards;
}

@keyframes gold-stolen-float {
  0%   { opacity: 0; transform: translateX(-50%) translateY(0);    }
  15%  { opacity: 1; transform: translateX(-50%) translateY(-12px); }
  70%  { opacity: 1; transform: translateX(-50%) translateY(-36px); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-56px); }
}
</style>
