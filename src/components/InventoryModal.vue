<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content-game-style">
      <h2 class="inventory-title">Inventory</h2>

      <div class="inventory-items-container">
        <div v-if="inventory.compass > 0" class="item-slot">
          <span class="item-name">Arcane Compass</span>
          <span class="item-quantity">x{{ inventory.compass }}</span>
          <button class="use-button" @click="useItem('compass')">Use</button>
        </div>

        <div v-if="inventory.healthPotions > 0" class="item-slot">
          <span class="item-name">Health Potion</span>
          <span class="item-quantity">x{{ inventory.healthPotions }}</span>
          <button class="use-button" @click="useItem('healthPotion')">
            Use
          </button>
        </div>

        <div v-if="inventory.turkeyLegs > 0" class="item-slot">
          <span class="item-name">Turkey Leg</span>
          <span class="item-quantity">x{{ inventory.turkeyLegs }}</span>
          <button class="use-button" @click="useItem('turkeyLeg')">Use</button>
        </div>

        <div v-if="inventory.herbalPoultices > 0" class="item-slot">
          <span class="item-name">Herbal Poultice</span>
          <span class="item-quantity">x{{ inventory.herbalPoultices }}</span>
          <button
            class="use-button"
            @click="useItem('herbalPoultice')"
            :disabled="isHealthRegenActive"
          >
            {{ isHealthRegenActive ? "Regen Active" : "Use" }}
          </button>
        </div>

        <div v-if="inventory.invisibilityCloaks > 0" class="item-slot">
          <span class="item-name">Cloak of Invisibility</span>
          <span class="item-quantity">x{{ inventory.invisibilityCloaks }}</span>
          <button
            class="use-button"
            @click="useItem('invisibilityCloak')"
            :disabled="isCloakActive"
          >
            {{ isCloakActive ? `Active (${cloakClicksRemaining})` : "Use" }}
          </button>
        </div>
        <div v-if="inventory.stickItem > 0" class="item-slot">
          <span class="item-name"
            >A Cool Stick (hangs out in your inventory)</span
          >
          <span class="item-quantity">x{{ inventory.stickItem }}</span>
        </div>

        <div
          v-if="
            inventory.compass === 0 &&
            inventory.healthPotions === 0 &&
            inventory.turkeyLegs === 0 &&
            inventory.invisibilityCloaks === 0 &&
            inventory.stickItem === 0 &&
            inventory.herbalPoultices === 0
          "
          class="item-slot no-items-game-style"
        >
          <span>Nothing in inventory.</span>
        </div>
      </div>

      <button @click="closeModal" class="close-button-game-style">Close</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, watch } from "vue";

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
});

watch(
  () => props.inventory,
  (newVal) => {
    console.log("InventoryModal received new inventory:", newVal);
  },
  { deep: true, immediate: true }
);

const emit = defineEmits(["close", "use-item"]);

function closeModal() {
  emit("close");
}

function useItem(itemType) {
  emit("use-item", itemType);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}

.modal-content-game-style {
  background: #2a2a2a;
  border: 4px solid #5a5a5a;
  border-radius: 6px;
  padding: 25px;
  box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.6);
  text-align: center;
  width: 90%;
  max-width: 450px;
  position: relative;
  font-size: 14px;
  color: #e0e0e0;
}

.inventory-title {
  margin-top: 0;
  color: #bdbdbc;
  font-size: 1.8em;
  margin-bottom: 25px;
  text-shadow: 2px 2px 0px #000;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-family: "MedievalSharp", cursive;
}

.inventory-items-container {
  margin-bottom: 20px;
  border: 2px solid #4a4a4a;
  background: #1f1f1f;
  padding: 10px;
  border-radius: 4px;
}

.item-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 10px;
  margin-bottom: 5px;
  background: #3a3a3a;
  border: 1px solid #5a5a5a;
  border-radius: 3px;
  font-size: 1.1em;
  color: #e0e0e0;
  text-shadow: 1px 1px 0px #000;
}

.item-slot:last-child {
  margin-bottom: 0;
}

.item-name {
  flex-grow: 1;
  text-align: left;
  padding-left: 5px;
  color: #aaddee;
  font-family: "MedievalSharp", cursive;
}

.item-quantity {
  font-weight: bold;
  color: #b4b4b2;
  margin-right: 15px;
}

.use-button {
  background-color: transparent;
  color: white;
  padding: 8px 15px;
  border: 2px solid #92a2b4;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s, transform 0.1s;
  text-transform: uppercase;
  font-family: inherit;
  box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.4);
}

.use-button:hover {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.use-button:active {
  background-color: #004085;
  transform: translateY(1px);
  box-shadow: 1px 1px 0px rgba(0, 0, 0, 0.4);
}

.item-slot.no-items-game-style {
  font-style: italic;
  color: #999;
  justify-content: center;
  padding: 20px;
  background: #1f1f1f;
  border: 1px dashed #4a4a4a;
}

.close-button-game-style {
  background-color: transparent;
  color: white;
  padding: 12px 25px;
  border: 2px solid #242323;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1.1em;
  margin-top: 25px;
  transition: background-color 0.2s, transform 0.1s;
  text-transform: uppercase;
  font-family: "MedievalSharp", cursive;
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.5);
}

.close-button-game-style:hover {
  background-color: #b3000a;
  transform: translateY(-2px);
}

.close-button-game-style:active {
  background-color: #8c0008;
  transform: translateY(2px);
  box-shadow: 1px 1px 0px rgba(0, 0, 0, 0.5);
}
</style>
