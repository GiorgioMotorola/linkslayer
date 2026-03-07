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
@import "./styles/shopModalStyles.css";
</style>
