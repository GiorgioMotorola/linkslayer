// src/composables/useStatusEffects.js

import { ref, computed, watch } from "vue";

export function useStatusEffects() {
  // Poison
  const poisonedClicksLeft = ref(0);
  const poisonDamagePerClick = ref(0);

  // Invisibility Cloak
  const isCloakActive = ref(false);
  const cloakClicksRemaining = ref(0);

  // Blur (drunk)
  const blurClicksLeft = ref(0);

  // Health Regeneration (Herbal Poultice)
  const healthRegenActive = ref(false);
  const healthRegenAmount = ref(0);
  const healthRegenClicksRemaining = ref(0);
  const healthRegenMaxHeal = ref(0);
  const healthRegenHealedCount = ref(0);

  // Serrated Dagger (next attack applies bleed)
  const serratedDaggerActive = ref(false);

  // Lucky Coin (next flee auto-succeeds)
  const luckyFleeActive = ref(false);

  // Warding Shield (halve incoming damage for N hits)
  const wardingShieldHitsRemaining = ref(0);

  // Ward Stone (suppress encounters for N clicks)
  const wardStoneActive = ref(false);
  const wardStoneClicksRemaining = ref(0);

  // Encounter Beacon (force next encounter to be NPC)
  const encounterBeaconActive = ref(false);

  // Computed properties
  const isPlayerPoisoned = computed(() => poisonedClicksLeft.value > 0);
  const isBlurred = computed(() => blurClicksLeft.value > 0);

  /**
   * Setup watcher for click count to handle status effects
   * Should be called from GameView after all composables are initialized
   */
  function setupClickWatcher(deps) {
    const {
      clickCount,
      playerHP,
      effectiveMaxHP,
      inventory,
      log,
      showRestModal,
      showShopModal,
    } = deps;

    watch(clickCount, (newClicks) => {
      // Show rest modal every 12 clicks
      if (newClicks > 0 && newClicks % 12 === 0) {
        showRestModal.value = true;
      }
      // Show shop modal every 10 clicks (if not rest modal)
      if (newClicks > 0 && newClicks % 10 === 0 && !showRestModal.value) {
        showShopModal.value = true;
      }

      let netHealthChange = 0;

      // Handle poison damage
      if (poisonedClicksLeft.value > 0) {
        const effectivePoisonDamage = Number(poisonDamagePerClick.value);
        if (isNaN(effectivePoisonDamage)) {
          console.error(
            "CRITICAL ERROR: poisonDamagePerClick.value is NaN. Resetting to 0.",
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

      // Handle health regeneration
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
              `🌱 You feel a surge of vitality. Healed ${actualHeal} HP from Herbal Poultice.`
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

      // Apply net health change
      playerHP.value = Math.min(
        effectiveMaxHP.value,
        Math.max(0, playerHP.value + netHealthChange)
      );

      // Handle invisibility cloak
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

      // Handle blur effect
      if (blurClicksLeft.value > 0) {
        blurClicksLeft.value--;
        log(
          `🍺 You are still drunk. ${blurClicksLeft.value} clicks left til you sober up.`
        );
      }

      // Handle enlightenment fish accumulation
      if (inventory.value.enlightenmentFish > 0) {
        const { enlightenmentFishAccumulatedHP } = deps;
        enlightenmentFishAccumulatedHP.value++;
        log(
          `🐟 The Fish of Eternal Enlightenment shimmers, gaining 1 HP. (Total: ${enlightenmentFishAccumulatedHP.value} HP)`
        );
      }

      // Handle ward stone countdown
      if (wardStoneActive.value) {
        wardStoneClicksRemaining.value--;
        log(`🪨 Ward Stone active: ${wardStoneClicksRemaining.value} clicks remaining.`);
        if (wardStoneClicksRemaining.value <= 0) {
          wardStoneActive.value = false;
          wardStoneClicksRemaining.value = 0;
          log(`🪨 The Ward Stone crumbles to dust.`);
        }
      }

      // Handle gold pouch accumulation
      if (inventory.value.goldPouches > 0) {
        const { goldPouchAccumulatedGold } = deps;
        goldPouchAccumulatedGold.value++;
        log(`👜 Gold Pouch: +1 gold stored. (Total: ${goldPouchAccumulatedGold.value} gold)`);
      }
    });
  }

  return {
    // Poison
    poisonedClicksLeft,
    poisonDamagePerClick,
    isPlayerPoisoned,

    // Cloak
    isCloakActive,
    cloakClicksRemaining,

    // Blur
    blurClicksLeft,
    isBlurred,

    // Health Regen
    healthRegenActive,
    healthRegenAmount,
    healthRegenClicksRemaining,
    healthRegenMaxHeal,
    healthRegenHealedCount,

    // Serrated Dagger
    serratedDaggerActive,

    // Lucky Coin
    luckyFleeActive,

    // Warding Shield
    wardingShieldHitsRemaining,

    // Ward Stone
    wardStoneActive,
    wardStoneClicksRemaining,

    // Encounter Beacon
    encounterBeaconActive,

    // Setup
    setupClickWatcher,
  };
}
