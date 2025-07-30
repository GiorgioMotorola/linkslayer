<template>
  <div class="inventory-overlay" @click.self="closeModal">
    <div class="inventory-content-game-style">
      <h2 class="inventory-title">Backpack</h2>

      <div class="inventory-items-container">
        <div v-if="inventory.minorHealthPotions > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Potion of Minor Health</span>
              <span class="item-count"
                >x{{ inventory.minorHealthPotions }}</span
              >
            </div>
            <div class="item-description">Restores 10 HP.</div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('minorHealthPotion')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.healthPotions > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Potion of Major Health</span>
              <span class="item-count">x{{ inventory.healthPotions }}</span>
            </div>
            <div class="item-description">Restores 25 HP.</div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('healthPotion')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.turkeyLegs > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Turkey Leg</span>
              <span class="item-count">x{{ inventory.turkeyLegs }}</span>
            </div>
            <div class="item-description">A hearty meal that restores HP.</div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('turkeyLeg')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.barkTeas > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Bark Tea</span>
              <span class="item-count">x{{ inventory.barkTeas }}</span>
            </div>
            <div class="item-description">
              A bitter brew with minor healing properties, restores 10 HP.
            </div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('barkTea')">
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.frenchOnionSoups > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">French Onion Soup</span>
              <span class="item-count">x{{ inventory.frenchOnionSoups }}</span>
            </div>
            <div class="item-description">
              A rich and restorative soup, restores 15 HP.
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('frenchOnionSoup')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.adventurersRations > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Adventurer's Rations</span>
              <span class="item-count"
                >x{{ inventory.adventurersRations }}</span
              >
            </div>
            <div class="item-description">
              Simple, wholesome provisions that restore a 7 HP and clear the
              mind of any blur.
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('adventurersRations')"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.herbalPoultices > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Herbal Poultice</span>
              <span class="item-count">x{{ inventory.herbalPoultices }}</span>
            </div>
            <div class="item-description">
              Heals 1 HP for each click up to 30 clicks.
              <template
                v-if="isHealthRegenActive && healthRegenClicksRemaining > 0"
              >
                ({{ healthRegenClicksRemaining }} clicks remaining).
              </template>
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('herbalPoultice')"
              :disabled="isHealthRegenActive"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.enlightenmentFish > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">The Fish of Eternal Enlightenment</span>
              <span class="item-count"
                >x{{ inventory.enlightenmentFish }} (Heals
                {{ enlightenmentFishHp }} HP)</span
              >
            </div>
            <div class="item-description">
              Heals based on accumulated HP, currently
              {{ enlightenmentFishHp }} HP.
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('enlightenmentFish')"
              :disabled="enlightenmentFishHp <= 0"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.antidotes > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Antidote</span>
              <span class="item-count">x{{ inventory.antidotes }}</span>
            </div>
            <div class="item-description">
              Cures all types of poison. Must be poisoned to use.
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('antidote')"
              :disabled="!isPoisoned"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.smokeBombs > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Smoke Bomb</span>
              <span class="item-count">x{{ inventory.smokeBombs }}</span>
            </div>
            <div class="item-description">
              Allows you to flee from non-boss combat. Must be in combat to use.
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('smokeBomb')"
              :disabled="!isInCombat || isBossEncounter"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.invisibilityCloaks > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Cloak of Invisibility</span>
              <span class="item-count"
                >x{{ inventory.invisibilityCloaks }}</span
              >
            </div>
            <div class="item-description">
              Grants temporary invisibility from all encounters for 10 clicks.
              <template v-if="isCloakActive && cloakClicksRemaining > 0">
                ({{ cloakClicksRemaining }} clicks remaining).
              </template>
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('invisibilityCloak')"
              :disabled="isCloakActive"
            >
              Use
            </button>
          </div>
        </div>

        <div
          v-if="inventory.sharedSufferingAmulets > 0"
          class="item-slot-wrapper"
        >
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Amulet of Shared Suffering</span>
              <span class="item-count"
                >x{{ inventory.sharedSufferingAmulets }}</span
              >
            </div>
            <div class="item-description">
              Deals {{ amuletOfSharedSufferingDamage }} damage to the enemy
              based on accumulated player damage taken.
            </div>
          </div>
          <div class="item-button-box">
            <button
              class="buy-button-details"
              @click.stop="useItem('sharedSufferingAmulet')"
              :disabled="!isInCombat"
            >
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.compass > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">Arcane Compass</span>
              <span class="item-count">x{{ inventory.compass }}</span>
            </div>
            <div class="item-description">
              Skips you to a random non-start/end article.
            </div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details" @click.stop="useItem('compass')">
              Use
            </button>
          </div>
        </div>

        <div v-if="inventory.stickItem > 0" class="item-slot-wrapper">
          <div class="item-details-box">
            <div class="item-name-quantity">
              <span class="item-name">A Cool Stick</span>
              <span class="item-count">x{{ inventory.stickItem }}</span>
            </div>
            <div class="item-description">
              It's just a cool stick that I found. Hangs out in your inventory
              until the end, granting you stick like encouragement.
            </div>
          </div>
          <div class="item-button-box">
            <button class="buy-button-details disabled-placeholder" disabled>
              N/A
            </button>
          </div>
        </div>

        <div
          v-if="isInventoryEmpty"
          class="item-slot-wrapper no-items-message-wrapper"
        >
          <div class="no-items-message">
            <span>Your Backpack is empty.</span>
          </div>
        </div>
      </div>

      <button @click="closeModal" class="close-button-game-style">Close</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, watch, computed } from "vue";

const props = defineProps({
  inventory: {
    type: Object,
    required: true,
  },
  isCloakActive: {
    type: Boolean,
    default: false,
  },
  cloakClicksRemaining: {
    type: Number,
    default: 0,
  },
  isHealthRegenActive: {
    type: Boolean,
    default: false,
  },
  healthRegenClicksRemaining: {
    type: Number,
    default: 0,
  },
  isPoisoned: {
    type: Boolean,
    default: false,
  },
  isInCombat: {
    type: Boolean,
    default: false,
  },
  isBossEncounter: {
    type: Boolean,
    default: false,
  },
  playerHP: {
    type: Number,
    required: true,
  },
  effectiveMaxHP: {
    type: Number,
    required: true,
  },
  isBlurred: {
    type: Boolean,
    default: false,
  },
  enlightenmentFishHp: {
    type: Number,
    default: 0,
  },
  amuletOfSharedSufferingDamage: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["close", "use-item"]);

const isInventoryEmpty = computed(() => {
  for (const key in props.inventory) {
    if (
      Object.prototype.hasOwnProperty.call(props.inventory, key) &&
      typeof props.inventory[key] === "number"
    ) {
      if (props.inventory[key] > 0) {
        return false;
      }
    }
  }
  return true;
});

function closeModal() {
  emit("close");
}

function useItem(itemType) {
  emit("use-item", itemType);
}
</script>

<style scoped>
.inventory-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.781);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.inventory-content-game-style {
  background: rgba(0, 0, 0, 0.377);
  border: 1px solid #4a4a4a;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.308);
  text-align: center;
  width: 95%;
  max-width: 800px;
  height: 90%;
  max-height: 900px;
  position: relative;
  font-size: 13px;
  color: #d0d0d0;
  display: flex;
  flex-direction: column;
  font-family: "IBM Plex Sans", sans-serif;
}

.inventory-title {
  margin-top: 0;
  color: #b0b0b0;
  font-size: 20px;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px #000;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-family: "IBM Plex Sans", sans-serif;
  border-bottom: 1px solid #4a4a4a;
  padding-bottom: 5px;
}

.inventory-items-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 5px;
  padding-right: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
  scrollbar-color: #4a4a4a #1a1a1a;
}

.inventory-items-container::-webkit-scrollbar {
  width: 6px;
  background-color: transparent;
}

.inventory-items-container::-webkit-scrollbar-track {
  background-color: transparent;
}

.inventory-items-container::-webkit-scrollbar-thumb {
  background-color: #4a4a4a;
  border-radius: 3px;
  border: none;
}

.inventory-items-container::-webkit-scrollbar-thumb:hover {
  background-color: #6a6a6a;
}

.inventory-items-container::-webkit-scrollbar-button {
  display: none;
}

.item-slot-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.item-details-box {
  /* border: 2px solid #3a3a3a; */
  border-radius: 3px;
  padding: 10px 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  text-align: left;
  min-width: 0;
  color: #e0e0e0;
  transition: background-color 0.2s, border-color 0.2s;
}

.item-details-box:hover {
  background-color: rgba(58, 58, 58, 0.7);
  border-color: #6a6a6a;
}

.item-name-quantity {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 5px;
}

.item-name {
  flex-grow: 1;
  color: #c0c0c0;
  font-family: "IBM Plex Sans", sans-serif;
  font-weight: bold;
}

.item-count {
  font-weight: normal;
  color: #a8bbcf;
  margin-left: 10px;
  white-space: nowrap;
}

.item-description {
  font-size: 0.85em;
  color: #a0a0a0;
}

.item-button-box {
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 80px;
  min-height: 50px;
  transition: background-color 0.2s, border-color 0.2s;
}

.item-button-box:hover {
  border-color: #6a6a6a;
}

.buy-button-details {
  background-color: #252525;
  color: #e0e0e0;
  padding: 8px 15px;
  border: 1px solid #6a6a6a;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s, border-color 0.2s, transform 0.1s;
  text-transform: uppercase;
  font-family: "IBM Plex Sans", sans-serif;
  box-shadow: 1px 1px 0px rgba(0, 0, 0, 0.4);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.buy-button-details:hover {
  background-color: #5a5a5a;
  transform: translateY(-1px);
}

.buy-button-details:active {
  background-color: #3a3a3a;
  transform: translateY(1px);
  box-shadow: 0 0 0px rgba(0, 0, 0, 0.4);
}

.buy-button-details:disabled {
  background-color: #333;
  color: #777;
  border-color: #555;
  cursor: not-allowed;
  box-shadow: none;
}

.disabled-placeholder {
  visibility: hidden;
  pointer-events: none;
  background-color: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.no-items-message-wrapper {
  justify-content: center;
}
.no-items-message {
  font-style: italic;
  color: #a3a2a2;
  text-align: center;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
  font-size: 15px;
}

.close-button-game-style {
  background-color: transparent;
  color: #f3f3f3;
  padding: 12px 25px;
  border: 1px solid #6a6a6a;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  margin-top: 25px;
  transition: background-color 0.2s, transform 0.1s, box-shadow 0.2s;
  text-transform: uppercase;
  font-family: "IBM Plex Sans", sans-serif;
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.5);
}

.close-button-game-style:hover {
  background-color: #5a5a5a;
  transform: translateY(-2px);
  box-shadow: 5px 5px 0px rgba(0, 0, 0, 0.6);
}

.close-button-game-style:active {
  background-color: #2a2a2a;
  transform: translateY(2px);
  box-shadow: 1px 1px 0px rgba(0, 0, 0, 0.5);
}

@media (max-width: 768px) {
  .inventory-content-game-style {
    width: 95%;
    height: 90%;
    max-width: unset;
    padding: 15px;
  }

  .inventory-items-container {
    padding: 0;
  }

  .item-slot-wrapper {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .item-details-box {
    width: 100%;
    padding: 8px 10px;
  }

  .item-button-box {
    width: 100%;
    min-width: unset;
    min-height: unset;
    margin-top: 5px;
  }

  .buy-button-details {
    width: 80%;
    font-size: 0.9em;
    padding: 8px 15px;
  }

  .inventory-title {
    font-size: 1.8em;
  }

  .disabled-placeholder {
    width: 0;
    height: 0;
    padding: 0;
    margin: 0;
    border: none;
    background-color: transparent;
  }
  .no-items-message-wrapper {
    width: 100%;
  }
}
</style>
