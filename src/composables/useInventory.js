// src/composables/useInventory.js

import { ref, computed } from "vue";
import {
  useCompass as externalUseCompass,
  useHealthPotion as externalUseHealthPotion,
  useTurkeyLeg as externalUseTurkeyLeg,
  useBreadcrumb as externalUseBreadcrumb,
  useInvisibilityCloak as externalUseInvisibilityCloak,
  useHerbalPoultice as externalUseHerbalPoultice,
  useBarkTea as externalUseBarkTea,
  useFrenchOnionSoup as externalUseFrenchOnionSoup,
  useAntidote as externalUseAntidote,
  useSmokeBomb as externalUseSmokeBomb,
  useAdventurersRations as externalUseAdventurersRations,
  useEnlightenmentFish as externalUseEnlightenmentFish,
  useAmuletOfSharedSuffering as externalUseAmuletOfSharedSuffering,
  useMinorHealthPotion as externalUseMinorHealthPotion,
  useFlashPowder as externalUseFlashPowder,
  useVenomVial as externalUseVenomVial,
  useSerratedDagger as externalUseSerratedDagger,
  useLuckyCoin as externalUseLuckyCoin,
  useWardingShield as externalUseWardingShield,
  useWardStone as externalUseWardStone,
  useEncounterBeacon as externalUseEncounterBeacon,
  useGoldPouch as externalUseGoldPouch,
  useBountyScroll as externalUseBountyScroll,
} from "@/utils/itemHandlers";

export function useInventory() {
  const inventory = ref({
    compass: 0,
    healthPotions: 0,
    turkeyLegs: 0,
    breadcrumbs: 0,
    invisibilityCloaks: 0,
    stickItem: 0,
    coolerStickItem: 0,
    evenCoolerStickItem: 0,
    herbalPoultices: 0,
    barkTea: 0,
    frenchOnionSoups: 0,
    antidotes: 0,
    smokeBombs: 0,
    adventurersRations: 0,
    enlightenmentFish: 0,
    sharedSufferingAmulets: 0,
    minorHealthPotions: 0,
    weaponPieces: 0,
    defensePieces: 0,
    flashPowders: 0,
    venomVials: 0,
    serratedDaggers: 0,
    luckyCoins: 0,
    wardingShields: 0,
    wardStones: 0,
    encounterBeacons: 0,
    goldPouches: 0,
    bountyScrolls: 0,
  });

  const goldPouchAccumulatedGold = ref(0);

  // Item-specific state
  const enlightenmentFishAccumulatedHP = ref(0);

  // Item heal constants
  const HEALTH_POTION_HEAL_AMOUNT = 25;
  const TURKEY_LEG_HEAL_AMOUNT = 6;
  const BREADCRUMB_HEAL_AMOUNT = 5;
  const BARK_TEA_HEAL_AMOUNT = 10;
  const FRENCH_ONION_SOUP_HEAL_AMOUNT = 15;
  const FRENCH_ONION_SOUP_SPECIAL_AMOUNT = 1;
  const ADVENTURERS_RATIONS_HEAL_AMOUNT = 7;
  const MINOR_HEALTH_POTION_HEAL_AMOUNT = 10;
  const AMULET_ENEMY_DAMAGE = 50;
  const AMULET_PLAYER_DAMAGE = 25;
  const CLOAK_DURATION = 10;

  // Item usage wrapper functions
  // These will be called with appropriate state from GameView
  function createItemHandlers(deps) {
    const {
      playerState,
      gameData,
      modalState,
      utilityFunctions,
      combatData,
      statusEffects,
    } = deps;

    return {
      useCompass: () => {
        externalUseCompass(
          {
            inventory,
            current: gameData.current,
            path: playerState.path,
            clickCount: playerState.clickCount,
            shortcutsUsedCount: playerState.shortcutsUsedCount,
            currentTargetIndex: playerState.currentTargetIndex,
          },
          {
            chain: gameData.chain,
            formattedTitle: gameData.formattedTitle,
          },
          {
            bossOverlay: modalState.bossOverlay,
          },
          {
            log: utilityFunctions.log,
            isBoss: utilityFunctions.isBoss,
            nextTick: utilityFunctions.nextTick,
            closeInventoryModal: modalState.closeInventoryModal,
          },
          {
            encounter: combatData.encounter,
          }
        );
      },

      useHealthPotion: () => {
        externalUseHealthPotion(
          {
            inventory,
            playerHP: playerState.playerHP,
            effectiveMaxHP: playerState.effectiveMaxHP,
          },
          {
            log: utilityFunctions.log,
          },
          {
            HEALTH_POTION_HEAL_AMOUNT,
          }
        );
      },

      useBreadcrumb: () => {
        externalUseBreadcrumb(
          {
            inventory,
            playerHP: playerState.playerHP,
            effectiveMaxHP: playerState.effectiveMaxHP,
          },
          {
            log: utilityFunctions.log,
          },
          {
            BREADCRUMB_HEAL_AMOUNT,
          }
        );
      },

      useTurkeyLeg: () => {
        externalUseTurkeyLeg(
          {
            inventory,
            playerHP: playerState.playerHP,
            effectiveMaxHP: playerState.effectiveMaxHP,
          },
          {
            log: utilityFunctions.log,
          },
          {
            TURKEY_LEG_HEAL_AMOUNT,
          }
        );
      },

      useBarkTea: () => {
        externalUseBarkTea(
          {
            inventory,
            playerHP: playerState.playerHP,
            effectiveMaxHP: playerState.effectiveMaxHP,
          },
          {
            log: utilityFunctions.log,
          },
          {
            BARK_TEA_HEAL_AMOUNT,
          }
        );
      },

      useFrenchOnionSoup: () => {
        externalUseFrenchOnionSoup(
          {
            inventory,
            playerHP: playerState.playerHP,
            specialUsesLeft: playerState.specialUsesLeft,
            effectiveMaxHP: playerState.effectiveMaxHP,
          },
          {
            log: utilityFunctions.log,
          },
          {
            FRENCH_ONION_SOUP_HEAL_AMOUNT,
            FRENCH_ONION_SOUP_SPECIAL_AMOUNT,
          }
        );
      },

      useAntidote: () => {
        externalUseAntidote(
          {
            inventory,
            poisonedClicksLeft: statusEffects.poisonedClicksLeft,
            poisonDamagePerClick: statusEffects.poisonDamagePerClick,
          },
          {
            log: utilityFunctions.log,
            closeInventoryModal: modalState.closeInventoryModal,
          }
        );
      },

      useInvisibilityCloak: () => {
        externalUseInvisibilityCloak(
          {
            isCloakActive: statusEffects.isCloakActive,
            inventory,
            cloakClicksRemaining: statusEffects.cloakClicksRemaining,
          },
          {
            log: utilityFunctions.log,
          },
          {
            CLOAK_DURATION,
          }
        );
      },

      useHerbalPoultice: () => {
        externalUseHerbalPoultice(
          {
            inventory,
            healthRegenActive: statusEffects.healthRegenActive,
            healthRegenAmount: statusEffects.healthRegenAmount,
            healthRegenClicksRemaining: statusEffects.healthRegenClicksRemaining,
            healthRegenMaxHeal: statusEffects.healthRegenMaxHeal,
            healthRegenHealedCount: statusEffects.healthRegenHealedCount,
          },
          {
            log: utilityFunctions.log,
          }
        );
      },

      useSmokeBomb: () => {
        externalUseSmokeBomb(
          {
            inventory,
          },
          {
            log: utilityFunctions.log,
            isBoss: utilityFunctions.isBoss,
            closeInventoryModal: modalState.closeInventoryModal,
          },
          {
            encounter: combatData.encounter,
          },
          {
            bossOverlay: modalState.bossOverlay,
          }
        );
      },

      useAdventurersRations: () => {
        externalUseAdventurersRations(
          {
            inventory,
            playerHP: playerState.playerHP,
            blurClicksLeft: statusEffects.blurClicksLeft,
            effectiveMaxHP: playerState.effectiveMaxHP,
          },
          {
            log: utilityFunctions.log,
            closeInventoryModal: modalState.closeInventoryModal,
          },
          {
            ADVENTURERS_RATIONS_HEAL_AMOUNT,
          }
        );
      },

      useEnlightenmentFish: () => {
        externalUseEnlightenmentFish(
          {
            inventory,
            playerHP: playerState.playerHP,
            effectiveMaxHP: playerState.effectiveMaxHP,
          },
          {
            log: utilityFunctions.log,
          },
          {
            enlightenmentFishAccumulatedHP,
          }
        );
      },

      useAmuletOfSharedSuffering: () => {
        externalUseAmuletOfSharedSuffering(
          {
            inventory,
            playerHP: playerState.playerHP,
            effectiveMaxHP: playerState.effectiveMaxHP,
          },
          {
            log: utilityFunctions.log,
            closeInventoryModal: modalState.closeInventoryModal,
            handleLootDrop: utilityFunctions.handleLootDrop,
            handleCloseEncounter: utilityFunctions.handleCloseEncounter,
            isBoss: utilityFunctions.isBoss,
          },
          {
            encounter: combatData.encounter,
            enemyHP: combatData.enemyHP,
          },
          {
            AMULET_ENEMY_DAMAGE,
            AMULET_PLAYER_DAMAGE,
          }
        );
      },

      useMinorHealthPotion: () => {
        externalUseMinorHealthPotion(
          {
            inventory,
            playerHP: playerState.playerHP,
            effectiveMaxHP: playerState.effectiveMaxHP,
          },
          {
            log: utilityFunctions.log,
          },
          {
            MINOR_HEALTH_POTION_HEAL_AMOUNT,
          }
        );
      },

      useFlashPowder: () => {
        externalUseFlashPowder(
          { inventory },
          { log: utilityFunctions.log, closeInventoryModal: modalState.closeInventoryModal },
          { encounter: combatData.encounter, enemyIsStunned: combatData.enemyIsStunned }
        );
      },

      useVenomVial: () => {
        externalUseVenomVial(
          { inventory },
          { log: utilityFunctions.log, closeInventoryModal: modalState.closeInventoryModal },
          { encounter: combatData.encounter, enemyStatusEffects: combatData.enemyStatusEffects }
        );
      },

      useSerratedDagger: () => {
        externalUseSerratedDagger(
          { inventory },
          { log: utilityFunctions.log, closeInventoryModal: modalState.closeInventoryModal },
          { encounter: combatData.encounter, serratedDaggerActive: statusEffects.serratedDaggerActive }
        );
      },

      useLuckyCoin: () => {
        externalUseLuckyCoin(
          { inventory },
          { log: utilityFunctions.log, closeInventoryModal: modalState.closeInventoryModal },
          { encounter: combatData.encounter, luckyFleeActive: statusEffects.luckyFleeActive }
        );
      },

      useWardingShield: () => {
        externalUseWardingShield(
          { inventory },
          { log: utilityFunctions.log, closeInventoryModal: modalState.closeInventoryModal },
          { wardingShieldHitsRemaining: statusEffects.wardingShieldHitsRemaining }
        );
      },

      useWardStone: () => {
        externalUseWardStone(
          { inventory },
          { log: utilityFunctions.log },
          { wardStoneActive: statusEffects.wardStoneActive, wardStoneClicksRemaining: statusEffects.wardStoneClicksRemaining }
        );
      },

      useEncounterBeacon: () => {
        externalUseEncounterBeacon(
          { inventory },
          { log: utilityFunctions.log },
          { encounterBeaconActive: statusEffects.encounterBeaconActive }
        );
      },

      useGoldPouch: () => {
        externalUseGoldPouch(
          { inventory, playerGold: playerState.playerGold },
          { log: utilityFunctions.log, closeInventoryModal: modalState.closeInventoryModal },
          { goldPouchAccumulatedGold }
        );
      },

      useBountyScroll: () => {
        externalUseBountyScroll(
          { inventory },
          { log: utilityFunctions.log, closeInventoryModal: modalState.closeInventoryModal },
          { bountyScrollActive: statusEffects.bountyScrollActive }
        );
      },
    };
  }

  return {
    inventory,
    enlightenmentFishAccumulatedHP,
    goldPouchAccumulatedGold,
    HEALTH_POTION_HEAL_AMOUNT,
    TURKEY_LEG_HEAL_AMOUNT,
    BARK_TEA_HEAL_AMOUNT,
    FRENCH_ONION_SOUP_HEAL_AMOUNT,
    FRENCH_ONION_SOUP_SPECIAL_AMOUNT,
    ADVENTURERS_RATIONS_HEAL_AMOUNT,
    MINOR_HEALTH_POTION_HEAL_AMOUNT,
    AMULET_ENEMY_DAMAGE,
    AMULET_PLAYER_DAMAGE,
    CLOAK_DURATION,
    createItemHandlers,
  };
}
