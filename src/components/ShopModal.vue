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
                  (You have <strong>{{ specialUsesLeft }}</strong> Charges Left).
                </span>
                <div class="haiku-container">
                  <div>" {{ selectedItemDetails.haikuOne }}</div>
                  <div>{{ selectedItemDetails.haikuTwo }}</div>
                  <div>{{ selectedItemDetails.haikuThree }} "</div>
                </div>
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

      <div class="shop-footer-buttons">
        <button
          @click="$emit('open-backpack')"
          class="close-button-game-style backpack-button"
        >
          Backpack
        </button>
        <button @click="$emit('close')" class="close-button-game-style">
          Done Shopping
        </button>
      </div>

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

const emit = defineEmits(["buy", "close", "open-backpack"]);

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
    showToast("Error: Unknown item.", true);
    return;
  }

  if (item.isSpecialLoot) {
    showToast(`You already acquired ${item.name}.`, true);
    return;
  }

  if (props.playerGold >= item.cost) {
    emit("buy", item);
    showToast(`Purchased ${item.name}.`);
  } else {
    showToast(`Not enough gold for ${item.name}.`, true);
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
  selectedItem.value = item;
  selectedItemDetails.value = { ...item };
  selectedItemDetails.value.description = item.description ?? "No description available.";
}
</script>

<style scoped>
.shop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(6, 10, 20, 0.9);
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
  max-height: 90vh;
  position: relative;
  font-size: 13px;
  color: #d0d0d0;
  display: flex;
  flex-direction: column;
  font-family: "IBM Plex Sans", sans-serif;
}

.shop-title {
  margin-top: 0;
  color: #9ab2c8;
  font-size: 20px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px #000;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-family: "IBM Plex Sans", sans-serif;
  display: block;
}

.shop-header {
  background: rgba(8, 14, 26, 0.5);
  border: 1px solid #2e3e52;
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 20px;
  text-align: center;
}

.shopkeeper-greeting {
  font-style: italic;
  color: #b0c4d8;
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
  border: 1px solid #2e3e52;
  background: rgba(8, 14, 26, 0.55);
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  align-content: start;
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
  padding: 7px 10px;
  background: rgba(10, 16, 28, 0.6);
  border: 1px solid #2e3e52;
  border-radius: 3px;
  font-size: 1em;
  color: #ccd8e8;
  cursor: pointer;
}

.item-slot:hover:not(.selected-item) {
  background-color: rgba(24, 36, 56, 0.7);
  border-color: #4a6a8a;
  filter: none;
}

.item-slot.selected-item {
  background-color: rgba(24, 44, 74, 0.8) !important;
  border-color: #4a7aaa !important;
  box-shadow: inset 0 0 6px rgba(80, 140, 200, 0.15) !important;
  color: #d8e8f8 !important;
  transform: scale(1) !important;
  will-change: background-color, border-color, box-shadow;
}

.item-slot.selected-item:hover {
  background-color: rgba(24, 44, 74, 0.8) !important;
  border-color: #4a7aaa !important;
  box-shadow: inset 0 0 6px rgba(80, 140, 200, 0.15) !important;
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
  color: #b8cce0;
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
  border: 1px solid #2e3e52;
  background: rgba(8, 14, 26, 0.55);
  border-radius: 4px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  text-align: left;
}

.details-title {
  color: #9ab2c8;
  font-size: 1.4em;
  margin-top: 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #2e3e52;
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
  color: #d0e0f0;
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
  background-color: rgba(18, 30, 50, 0.85);
  color: #ccd8ec;
  padding: 10px 15px;
  border: 1px solid #3a5a7a;
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
  background-color: rgba(30, 50, 80, 0.9);
  border-color: #5a7a9a;
  transform: translateY(-1px);
}

.buy-button-details:active {
  background-color: rgba(10, 20, 36, 0.9);
  transform: translateY(1px);
  box-shadow: 0 0 0px rgba(0, 0, 0, 0.4);
}

.buy-button-details:disabled {
  background-color: rgba(10, 14, 22, 0.6);
  color: #556070;
  border-color: #2a3a4a;
  cursor: not-allowed;
  box-shadow: none;
}

.shop-footer-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 25px;
  width: 100%;
}

.close-button-game-style {
  background-color: rgba(14, 22, 38, 0.85);
  color: #b8cce0;
  padding: 12px 25px;
  border: 2px solid #3a5a7a;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  transition: background-color 0.2s, transform 0.1s, box-shadow 0.2s;
  text-transform: uppercase;
  font-family: "IBM Plex Sans", sans-serif;
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.5);
}

.close-button-game-style:hover {
  background-color: rgba(28, 46, 72, 0.9);
  border-color: #5a7a9a;
  transform: translateY(-2px);
  box-shadow: 5px 5px 0px rgba(0, 0, 0, 0.6);
}

.close-button-game-style:active {
  background-color: rgba(8, 14, 24, 0.9);
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

.haiku-container {
  margin-top: 10rem;
  text-align: center;
  font-size: 18px;
  font-weight: 300;
  font-style: italic;
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

  .shop-footer-buttons {
    flex-direction: row;
    gap: 10px;
  }

  .close-button-game-style {
    flex: 1;
    padding: 10px 15px;
    font-size: 1em;
  }
}

@media screen and (max-width: 600px) {
  .shop-overlay {
    align-items: flex-start;
    overflow-y: auto;
    padding: 0.5rem;
    box-sizing: border-box;
  }

  .shop-content-game-style {
    width: 100%;
    height: auto;
    max-height: none;
    padding: 10px;
    box-sizing: border-box;
  }

  .shop-title {
    font-size: 16px;
    letter-spacing: 2px;
    margin-bottom: 6px;
  }

  .shop-header {
    padding: 4px 8px;
    margin-bottom: 10px;
  }

  .shopkeeper-greeting {
    font-size: 13px;
    margin-bottom: 3px;
  }

  .player-gold {
    font-size: 13px;
  }

  /* Flatten the layout so all sections can be freely ordered */
  .shop-main-layout {
    display: contents;
  }

  .shop-title          { order: 0; }
  .shop-footer-buttons { order: 1; margin-top: 0; margin-bottom: 10px; }
  .shop-header         { order: 2; }
  .item-details-panel {
    order: 3;
    height: auto;
    width: 100%;
    flex: none;
    padding: 10px;
    box-sizing: border-box;
  }
  .shop-list-panel {
    order: 4;
    height: auto;
    max-height: none;
    width: 100%;
    flex: none;
    overflow: visible;
    box-sizing: border-box;
  }

  .shop-items-container {
    overflow: visible;
  }

  .shop-items-container {
    padding: 4px;
  }

  .item-slot {
    font-size: 12px;
    padding: 6px 8px;
  }

  .item-name {
    font-size: 12px;
  }

  .item-cost {
    font-size: 11px;
  }

  .details-title {
    font-size: 13px;
    margin-bottom: 8px;
  }

  .details-content {
    font-size: 12px;
  }

  .selected-item-name {
    font-size: 13px;
  }

  .selected-item-cost {
    font-size: 12px;
    margin-bottom: 8px;
  }

  .selected-item-description {
    margin-bottom: 10px;
  }

  .haiku-container {
    margin-top: 1rem;
    font-size: 14px;
  }

  .buy-button-details {
    font-size: 12px;
    padding: 6px 10px;
  }

  .shop-footer-buttons {
    flex-direction: row;
    gap: 8px;
    margin-top: 0;
    margin-bottom: 10px;
  }

  .close-button-game-style {
    flex: 1;
    padding: 8px 10px;
    font-size: 12px;
    box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5);
  }

  .shop-items-container {
    grid-template-columns: 1fr;
  }

  .haiku-container {
    display: none;
  }

  .selected-item-description {
    margin-bottom: 8px;
  }

  .details-content {
    justify-content: flex-start;
    gap: 0;
  }
}
</style>
