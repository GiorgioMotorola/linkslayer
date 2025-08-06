<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="map-container">
        <img
          src="https://linkslayer.mweatherford.rocks/map-nobg.png"
          alt="LINKSLAYER map"
        />

        <div
          v-for="(article, index) in fullChain"
          :key="index"
          class="dot"
          :class="{ 'active-dot': index === currentTargetIndex }"
          :style="dotStyle(index)"
        >
          X
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

defineProps({
  fullChain: {
    type: Array,
    default: () => [],
  },
  currentTargetIndex: {
    type: Number,
    default: -1,
  },
});

defineEmits(["close"]);
const pathCoordinates = [
  { x: 50, y: 90 },
  { x: 27, y: 80 },
  { x: 36, y: 71 },
  { x: 25, y: 65 },
  { x: 29, y: 54 },
  { x: 46, y: 53 },
  { x: 70, y: 50 },
  { x: 55, y: 40 },
  { x: 50, y: 35 },
  { x: 45, y: 30 },
  { x: 50, y: 25 },
  { x: 60, y: 20 },
];

const dotStyle = (index) => {
  const coords = pathCoordinates[index];
  if (coords) {
    return {
      left: `${coords.x}%`,
      top: `${coords.y}%`,
    };
  }
  return {};
};
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

.map-container {
  position: relative;
  width: 100%;
  height: auto;
}

.map-container img {
  display: block;
  width: 100%;
  height: auto;
}

.dot {
  position: absolute;
  width: 20px; 
  height: 20px;
  color: #2b2a2a; 
  font-size: 16px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: translate(-50%, -50%);
  transition: color 0.3s ease, font-size 0.3s ease;
}

.active-dot {
  color: #da0902; 
  font-size: 25px; 
  animation: pulse 1.5s infinite; 
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}
</style>
