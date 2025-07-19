<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2>Inventory</h2>

      <div class="inventory-items">
        <div v-if="inventory.compass > 0" class="item">
          <span>Arcane Compass ({{ inventory.compass }})</span>
          <button @click="useItem('compass')">Use</button>
        </div>

        <div v-if="inventory.healthPotions > 0" class="item">
          <span>Health Potion ({{ inventory.healthPotions }})</span>
          <button @click="useItem('healthPotion')">Use</button>
        </div>

        <div
          v-if="inventory.compass === 0 && inventory.healthPotions === 0"
          class="item no-items"
        >
          <span>Nothing in inventory.</span>
        </div>
      </div>

      <button @click="closeModal" class="close-button">Close</button>
    </div>
  </div>
</template>
<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  inventory: {
    type: Object,
    required: true,
  },
});

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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  text-align: center;
  width: 80%;
  max-width: 500px;
  position: relative;
}

h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.8em;
  margin-bottom: 20px;
}

.inventory-items {
  margin-bottom: 25px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  font-size: 1.1em;
  color: #555;
}

.item:last-child {
  border-bottom: none;
}

.item button {
  background-color: #4caf50;
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;
}

.item button:hover {
  background-color: #45a049;
}

.item.no-items {
  font-style: italic;
  color: #888;
}

.close-button {
  background-color: #f44336;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  margin-top: 15px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #da190b;
}

.inventory-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 25px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 500;
}
.inventory-button:hover {
  background-color: #0056b3;
}
</style>
