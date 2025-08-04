<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <div class="modal-header">
      </div>
      <div class="modal-body">
        <img src="https://linkslayer.mweatherford.rocks/map-nobg.png" alt="LINKSLAYER map" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineEmits } from "vue";

const emit = defineEmits(["close"]);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #e9e2d0;
  color: #000;
  padding: 25px;
  border-radius: 8px;
  width: 80%;
  max-width: 700px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ccc;
  padding-bottom: 10px;
  margin-bottom: 10px;
} */

.modal-header h2 {
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #555;
}

.close-button:hover {
  color: #000;
}

.modal-body {
    background-color: #e9e2d0;
}

.modal-body img {
  display: block;
  margin: 0 auto;
}
</style>