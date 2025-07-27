<template>
  <div class="shop-overlay" @click.self="$emit('close')">
    <div class="shop-content-game-style">
      <div class="shop-title">Shop</div>

      <div class="shop-header">
        <div class="shopkeeper-greeting">{{ shopkeeperGreeting }}</div>
        <div class="player-gold">You have {{ playerGold }} Gold</div>
      </div>

      <div class="shop-main-layout">
        <div class="shop-list-panel">
          <div class="shop-items-container">
            <div
              v-for="item in props.shopItems"
              :key="item.id"
              class="item-slot"
              :class="{
                'selected-item': selectedItem && selectedItem.id === item.id,
              }"
              @click="selectItem(item)"
            >
              <div class="item-name">{{ item.name }}</div>
              <div class="item-cost">{{ item.cost }} Gold</div>
            </div>
          </div>
        </div>

        <div class="item-details-panel">
          <div class="details-title">Item Details</div>
          <div class="details-content">
            <template v-if="selectedItemDetails">
              <div class="selected-item-name">
                {{ selectedItemDetails.name }}
              </div>
              <div class="selected-item-cost">
                Cost: {{ selectedItemDetails.cost }} Gold
              </div>
              <div class="selected-item-description">
                {{ selectedItemDetails.description }}
                <span v-if="selectedItemDetails.effect === 'weapon'">
                  (You have <strong>+{{ weaponBonus }}</strong> Weapon Bonus).
                </span>
                <span v-else-if="selectedItemDetails.effect === 'shield'">
                  (You have <strong>+{{ shieldBonus }}</strong> Defense Bonus).
                </span>
                <span v-else-if="selectedItemDetails.effect === 'special'">
                  (You have <strong>{{ specialUsesLeft }}</strong> Charges
                  Left).
                </span>
                <span
                  v-else-if="selectedItemDetails.details === 'herbalPoultice'"
                >
                  (Heals {{ selectedItemDetails.amount }} HP per click for
                  {{ selectedItemDetails.durationClicks }} clicks, Total of
                  {{ selectedItemDetails.maxHeal }} HP).
                </span>
                <span
                  v-else-if="selectedItemDetails.details === 'frenchOnionSoup'"
                >
                  (Restores {{ selectedItemDetails.amount }} HP and
                  {{ selectedItemDetails.specialAmount }} special use).
                </span>
              </div>
              <button
                class="buy-button-details"
                @click="buyItem(selectedItem)"
                :disabled="!canBuySelectedItem"
              >
                {{ buyButtonText }}
              </button>
            </template>
            <div v-else class="no-selection-message">
              Select an item to view its details.
            </div>
          </div>
        </div>
      </div>

      <button @click="$emit('close')" class="close-button-game-style">
        Done Shopping
      </button>

      <transition name="toast-fade">
        <div
          v-if="toastMessage"
          class="toast-notification"
          :class="{ 'toast-error': isToastError }"
        >
          {{ toastMessage }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { getRandomShopPhrase } from "@/utils/shopKeeperPhrases";

const props = defineProps({
  playerGold: Number,
  shopItems: Array,
  weaponBonus: Number,
  shieldBonus: Number,
  specialUsesLeft: Number,
});

const emit = defineEmits(["buy", "close"]);

const toastMessage = ref(null);
const isToastError = ref(false);
let toastTimeout = null;
const shopkeeperGreeting = ref("");

const selectedItem = ref(null);
const selectedItemDetails = ref(null);

onMounted(() => {
  shopkeeperGreeting.value = getRandomShopPhrase();
});

const canBuySelectedItem = computed(() => {
  return selectedItem.value && props.playerGold >= selectedItem.value.cost;
});

const buyButtonText = computed(() => {
  if (!selectedItem.value) {
    return "Select an Item";
  } else if (selectedItem.value.isSpecialLoot) {
    return "Already Acquired";
  } else if (props.playerGold < selectedItem.value.cost) {
    return `Not enough Gold (${selectedItem.value.cost} Gold)`;
  } else {
    return `Buy ${selectedItem.value.name}`;
  }
});

watch(
  () => props.playerGold,
  () => {
    if (selectedItem.value) {
    }
  }
);

const buyItem = (item) => {
  if (!item) {
    console.error("Attempted to buy an undefined item:", item);
    showToast("Error: Unknown item!", true);
    return;
  }

  if (item.isSpecialLoot) {
    showToast(`You already acquired ${item.name}!`, true);
    return;
  }

  if (props.playerGold >= item.cost) {
    emit("buy", item);
    showToast(`Purchased ${item.name}!`);
  } else {
    showToast(`Not enough gold for ${item.name}!`, true);
  }
};

function showToast(message, isError = false) {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastMessage.value = message;
  isToastError.value = isError;

  toastTimeout = setTimeout(() => {
    toastMessage.value = null;
    isToastError.value = false;
    toastTimeout = null;
  }, 3000);
}

function selectItem(item) {
  console.log("Item clicked:", item);
  selectedItem.value = item;
  console.log("selectedItem after click (by ID):", selectedItem.value);
  selectedItemDetails.value = { ...item };

  if (item.details === "herbalPoultice") {
    selectedItemDetails.value.description = `A potent herbal remedy that heals ${item.amount} Health per click for ${item.durationClicks} clicks (Total of ${item.maxHeal} Health).`;
  } else if (item.details === "frenchOnionSoup") {
    selectedItemDetails.value.description = `A hearty soup that restores ${item.amount} HP and ${item.specialAmount} special use.`;
  } else if (item.details === "sharedSufferingAmulet") {
    selectedItemDetails.value.description = `Deals ${item.amount} damage to enemy, 25 to player. Ends combat if enemy defeated.`;
  } else if (item.description) {
    selectedItemDetails.value.description = item.description;
  } else {
    selectedItemDetails.value.description = "No description available.";
  }
}
</script>

<style scoped>
.shop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.829);
  display: flex;
  justify-content: center;
  align-items: start;
  z-index: 1000;
  border-radius: 8px;
}

.shop-content-game-style {
  padding: 15px;
  text-align: center;
  width: 80%;
  max-width: 1100px;
  height: 100%;
  max-height: 450px;
  position: relative;
  font-size: 13px;
  color: #d0d0d0;
  display: flex;
  flex-direction: column;
  font-family: "IBM Plex Sans", sans-serif;
}

.shop-title {
  margin-top: 0;
  color: #b0b0b0;
  font-size: 20px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px #000;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-family: "IBM Plex Sans", sans-serif;
  display: block;
}

.shop-header {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 20px;
  text-align: center;
}

.shopkeeper-greeting {
  font-style: italic;
  color: #c0c0c0;
  margin-bottom: 5px;
  display: block;
  font-size: 17px;
}

.player-gold {
  font-weight: bold;
  color: #ffd700;
  font-size: 1.1em;
  display: block;
}

.shop-main-layout {
  display: flex;
  flex-grow: 1;
  gap: 50px;
  margin-bottom: 0px;
}

.shop-list-panel {
  flex: 2;
  border: 1px solid #3a3a3a;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.shop-items-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.shop-items-container::-webkit-scrollbar {
  display: none;
}

.item-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  margin-bottom: 2px;
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid #3a3a3a;
  border-radius: 3px;
  font-size: 1em;
  color: #e0e0e0;
  cursor: pointer;
  flex-shrink: 0;
}

.item-slot:hover:not(.selected-item) {
  background-color: rgba(58, 58, 58, 0.7);
  border-color: #6a6a6a;
  filter: none;
}

.item-slot.selected-item {
  background-color: rgba(74, 74, 74, 0.8) !important;
  border-color: #808080 !important;
  box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.1) !important;
  color: #e0e0e0 !important;
  transform: scale(1) !important;
  will-change: background-color, border-color, box-shadow;
}

.item-slot.selected-item:hover {
  background-color: rgba(74, 74, 74, 0.8) !important;
  border-color: #808080 !important;
  box-shadow: inset 0 0 5px rgba(255, 255, 255, 0.1) !important;
  transform: none !important;
}

.item-slot:active {
  background-color: rgba(90, 90, 90, 0.9) !important;
  border-color: #a0a0a0 !important;
  transform: translateY(1px) !important;
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.5) !important;
}

.item-name {
  flex-grow: 1;
  text-align: left;
  color: #c0c0c0;
  font-family: "IBM Plex Sans", sans-serif;
  font-weight: bold;
  display: block;
}

.item-cost {
  font-weight: normal;
  color: #ffd700;
  margin-left: 10px;
  white-space: nowrap;
  display: block;
}

.item-details-panel {
  flex: 1;
  border: 1px solid #3a3a3a;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.details-title {
  color: #b0b0b0;
  font-size: 1.4em;
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #3a3a3a;
  padding-bottom: 5px;
  font-family: "IBM Plex Sans", sans-serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
}

.details-content {
  flex-grow: 1;
  overflow-y: auto;
  color: #c0c0c0;
  font-size: 0.95em;
  line-height: 1.5;
  -ms-overflow-style: none;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.details-content::-webkit-scrollbar {
  display: none;
}

.selected-item-name {
  font-size: 1.2em;
  font-weight: bold;
  color: #e0e0e0;
  margin-bottom: 5px;
  display: block;
}

.selected-item-cost {
  font-size: 1em;
  color: #ffd700;
  margin-bottom: 15px;
  display: block;
}

.selected-item-description {
  flex-grow: 1;
  margin-bottom: 20px;
  display: block;
}

.no-selection-message {
  font-style: italic;
  color: #888;
  text-align: center;
  margin-top: 20px;
  display: block;
}

.buy-button-details {
  background-color: #4a4a4a;
  color: #e0e0e0;
  padding: 10px 15px;
  border: 1px solid #6a6a6a;
  border-radius: 3px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s, border-color 0.2s, transform 0.1s;
  text-transform: uppercase;
  font-family: "IBM Plex Sans", sans-serif;
  box-shadow: 1px 1px 0px rgba(0, 0, 0, 0.4);
  width: 100%;
  margin-top: auto;
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

.close-button-game-style {
  background-color: #3a3a3a;
  color: #e0e0e0;
  padding: 12px 25px;
  border: 2px solid #6a6a6a;
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

.toast-notification {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 0.95em;
  font-weight: bold;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
}

.toast-notification.toast-error {
  background-color: rgba(189, 58, 58, 0.9);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

@media (max-width: 768px) {
  .shop-content-game-style {
    width: 95%;
    height: 90%;
    max-height: unset;
    padding: 15px;
  }

  .shop-main-layout {
    flex-direction: column;
    gap: 15px;
  }

  .shop-list-panel,
  .item-details-panel {
    flex: none;
    width: 100%;
    height: 50%;
  }

  .shop-list-panel {
    height: 60%;
  }

  .item-details-panel {
    height: 40%;
  }

  .shop-items-container {
    padding: 0;
  }

  .item-slot {
    font-size: 0.9em;
    padding: 8px 10px;
  }

  .buy-button-details {
    font-size: 0.9em;
    padding: 8px 15px;
  }

  .details-title {
    font-size: 1.2em;
  }

  .details-content {
    font-size: 0.9em;
  }

  .shop-title {
    font-size: 1.8em;
  }
}
</style>
