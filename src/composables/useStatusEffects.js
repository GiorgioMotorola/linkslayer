import { ref, computed, watch } from "vue";

export function useStatusEffects() {
  const poisonedClicksLeft = ref(0);
  const poisonDamagePerClick = ref(0);
  const isCloakActive = ref(false);
  const cloakClicksRemaining = ref(0);
  const blurClicksLeft = ref(0);
  const healthRegenActive = ref(false);
  const healthRegenAmount = ref(0);
  const healthRegenClicksRemaining = ref(0);
  const healthRegenMaxHeal = ref(0);
  const healthRegenHealedCount = ref(0);
  const serratedDaggerActive = ref(false);
  const luckyFleeActive = ref(false);
  const wardingShieldHitsRemaining = ref(0);
  const wardStoneActive = ref(false);
  const wardStoneClicksRemaining = ref(0);
  const encounterBeaconActive = ref(false);
  const bountyScrollActive = ref(false);
  const isPlayerPoisoned = computed(() => poisonedClicksLeft.value > 0);
  const isBlurred = computed(() => blurClicksLeft.value > 0);

  function setupClickWatcher(deps) {
    const {
      clickCount,
      playerHP,
      effectiveMaxHP,
      inventory,
      log,
      showRestModal,
    } = deps;

    watch(clickCount, (newClicks) => {
      if (newClicks > 0 && newClicks % 12 === 0) {
        showRestModal.value = true;
      }

      let netHealthChange = 0;

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

      playerHP.value = Math.min(
        effectiveMaxHP.value,
        Math.max(0, playerHP.value + netHealthChange)
      );

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
        const { enlightenmentFishAccumulatedHP } = deps;
        enlightenmentFishAccumulatedHP.value++;
        log(
          `🐟 The Fish of Eternal Enlightenment shimmers, gaining 1 HP. (Total: ${enlightenmentFishAccumulatedHP.value} HP)`
        );
      }

      if (wardStoneActive.value) {
        wardStoneClicksRemaining.value--;
        log(`🪨 Ward Stone active: ${wardStoneClicksRemaining.value} clicks remaining.`);
        if (wardStoneClicksRemaining.value <= 0) {
          wardStoneActive.value = false;
          wardStoneClicksRemaining.value = 0;
          log(`🪨 The Ward Stone crumbles to dust.`);
        }
      }

      if (inventory.value.goldPouches > 0) {
        const { goldPouchAccumulatedGold } = deps;
        goldPouchAccumulatedGold.value++;
        log(`👜 Gold Pouch: +1 gold stored. (Total: ${goldPouchAccumulatedGold.value} gold)`);
      }
    });
  }

  return {
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
  };
}
