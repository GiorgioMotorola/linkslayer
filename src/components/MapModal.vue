<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="map-container">
        <img
          src="https://linkslayer.mweatherford.rocks/map-nobg.png"
          alt="LINKSLAYER map"
        />

        <div
          v-for="(_, index) in fullChain"
          :key="index"
          class="dot"
          :class="{ 'active-dot': index === currentTargetIndex }"
          :style="dotStyle(index)"
        >
          X
        </div>
      </div>

      <div class="journey-trail">
        <div class="trail-title">Journey Trail</div>
        <div
          v-for="(article, index) in fullChain"
          :key="index"
          class="trail-item"
          :class="{
            'trail-done': index < currentTargetIndex,
            'trail-current': index === currentTargetIndex,
            'trail-upcoming': index > currentTargetIndex,
          }"
        >
          <span class="trail-marker">
            {{ index < currentTargetIndex ? "✓" : index === currentTargetIndex ? "→" : "·" }}
          </span>
          <span class="trail-name">{{ article.replaceAll("_", " ") }}</span>
        </div>
      </div>

      <button class="close-button" @click="$emit('close')">Put away the map</button>
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
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.map-container {
  position: relative;
  width: 55%;
  margin: 0 auto;
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

.journey-trail {
  margin-top: 18px;
  border-top: 1px solid #c8b99a;
  padding-top: 14px;
}

.trail-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #7a6a52;
  margin-bottom: 10px;
}

.trail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  font-size: 14px;
}

.trail-marker {
  width: 18px;
  text-align: center;
  font-weight: 700;
  flex-shrink: 0;
}

.trail-done .trail-marker { color: #5a8a5a; }
.trail-done .trail-name   { color: #7a7a6a; text-decoration: line-through; }

.trail-current .trail-marker { color: #da0902; font-size: 16px; }
.trail-current .trail-name   { color: #1a1a1a; font-weight: 600; }

.trail-upcoming .trail-marker { color: #aaa; }
.trail-upcoming .trail-name   { color: #555; }

.close-button {
  display: block;
  margin: 16px auto 0;
  padding: 7px 18px;
  background: none;
  border: 1px solid #a09070;
  border-radius: 4px;
  color: #7a6a52;
  font-size: 12px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.close-button:hover {
  background: rgba(0, 0, 0, 0.07);
  color: #3a2e1e;
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
