<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">

      <div class="modal-header">
        <span class="header-ornament">⟡</span>
        <span class="header-title">Map</span>
        <span class="header-ornament">⟡</span>
      </div>

      <div class="modal-body">
        <div class="map-container">
          <img
            src="https://linkslayer.mweatherford.rocks/map-nobg.png"
            alt="LINKSLAYER map"
          />
          <div
            v-for="(_, index) in fullChain"
            :key="index"
            class="dot"
            :class="{
              'dot-done': index < currentTargetIndex,
              'dot-active': index === currentTargetIndex,
              'dot-upcoming': index > currentTargetIndex,
            }"
            :style="dotStyle(index)"
          />
        </div>

        <div class="journey-trail">
          <div class="trail-header">
            <span class="trail-title">Journey Trail</span>
            <span class="trail-progress">
              {{ Math.max(currentTargetIndex, 0) }} / {{ fullChain.length }} visited
            </span>
          </div>
          <div class="trail-list">
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
                {{ index < currentTargetIndex ? "✓" : index === currentTargetIndex ? "▶" : "○" }}
              </span>
              <span class="trail-name">
                <strong>{{ article.replaceAll("_", " ") }}</strong>
                <span class="trail-location">{{ getLocation(article, index) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <button class="close-button" @click="$emit('close')">
        ⎯ &nbsp; Put away the map &nbsp; ⎯
      </button>

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

const locationTypes = [
  "Village", "Hamlet", "Town", "Borough", "Colony", "Settlement", "Outpost", "Encampment",
  "City", "Metropolis", "Capital", "Free City",
  "Castle", "Fortress", "Keep", "Stronghold", "Bastion", "Citadel", "Battlement", "Rampart",
  "Isle", "Glen", "Hollow", "Gorge", "Pass", "Reach", "Expanse", "Crossing",
  "Ruins", "Dungeon", "Cavern", "Crypt", "Barrow", "Tomb", "Lair", "Depths",
  "Shrine", "Temple", "Monastery", "Sanctum", "Reliquary",
  "Tower", "Spire", "Observatory", "Vault",
];

function getLocation(article, index) {
  let hash = index * 31;
  for (let i = 0; i < article.length; i++) {
    hash = (hash * 17 + article.charCodeAt(i)) & 0xffff;
  }
  return locationTypes[Math.abs(hash) % locationTypes.length];
}

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
    return { left: `${coords.x}%`, top: `${coords.y}%` };
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
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #cfc3a0;
  background-image:
    radial-gradient(ellipse at 15% 15%, rgba(200, 180, 120, 0.3) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 85%, rgba(140, 110, 60, 0.2) 0%, transparent 55%);
  color: #2a1e10;
  padding: 22px 26px 20px;
  border-radius: 6px;
  border: 3px double #8a7050;
  width: 86%;
  max-width: 780px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.55),
    inset 0 0 50px rgba(0, 0, 0, 0.07);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 2px solid #a09060;
  margin-bottom: 18px;
}

.header-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #2a1e10;
}

.header-ornament {
  color: #8a7050;
  font-size: 14px;
  opacity: 0.8;
}

.modal-body {
  display: flex;
  gap: 22px;
  align-items: flex-start;
}

.map-container {
  position: relative;
  flex: 0 0 56%;
}

.map-container img {
  display: block;
  width: 100%;
  height: auto;
}

.dot {
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: box-shadow 0.3s ease, background 0.3s ease;
}

.dot-upcoming {
  width: 9px;
  height: 9px;
  background: rgba(60, 40, 10, 0.22);
  border: 1px solid rgba(80, 55, 20, 0.35);
}

.dot-done {
  width: 10px;
  height: 10px;
  background: #4a7c4a;
  border: 1.5px solid #2d5a2d;
  box-shadow: 0 0 5px rgba(60, 140, 60, 0.45);
}

.dot-active {
  width: 14px;
  height: 14px;
  background: #cc1a10;
  border: 2px solid #ff4433;
  box-shadow: 0 0 12px 4px rgba(210, 20, 10, 0.65);
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.journey-trail {
  flex: 1;
  min-width: 0;
}

.trail-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #a89060;
}

.trail-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #5a4830;
}

.trail-progress {
  font-size: 11px;
  color: #7a6040;
  font-style: italic;
}

.trail-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 340px;
  overflow-y: auto;
}

.trail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  font-size: 13px;
  border-radius: 3px;
  border-left: 3px solid transparent;
}

.trail-marker {
  width: 14px;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.trail-done .trail-marker  { color: #4a7a4a; }
.trail-done .trail-name    { color: #8a806a; text-decoration: line-through; }

.trail-current {
  border-left-color: #cc1a10;
  background: rgba(200, 30, 10, 0.06);
}
.trail-current .trail-marker { color: #cc1a10; font-size: 10px; }
.trail-current .trail-name   { color: #1a1008; font-weight: 600; }

.trail-upcoming .trail-marker { color: #9a8a6a; font-size: 9px; }
.trail-upcoming .trail-name   { color: #5a5040; }

.trail-location {
  font-weight: 400;
  font-style: italic;
  opacity: 0.65;
  margin-left: 3px;
  font-size: 0.92em;
}

.close-button {
  display: block;
  margin: 18px auto 0;
  padding: 7px 22px;
  background: linear-gradient(135deg, #7a6040 0%, #5a4428 100%);
  border: none;
  border-radius: 3px;
  color: #e9dfc8;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  transition: background 0.15s ease, box-shadow 0.15s ease;
}

.close-button:hover {
  background: linear-gradient(135deg, #8a7050 0%, #6a5438 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

@media (max-width: 600px) {
  .modal-content {
    width: 94%;
    padding: 14px 14px 14px;
  }

  .modal-header {
    padding-bottom: 10px;
    margin-bottom: 12px;
    gap: 10px;
  }

  .header-title {
    font-size: 13px;
    letter-spacing: 3px;
  }

  .modal-body {
    flex-direction: column;
    gap: 14px;
  }

  .map-container {
    flex: none;
    width: 80%;
    margin: 0 auto;
  }

  .trail-title {
    font-size: 9px;
    letter-spacing: 2px;
  }

  .trail-progress {
    font-size: 10px;
  }

  .trail-item {
    font-size: 11px;
    padding: 4px 6px;
  }

  .trail-list {
    max-height: 180px;
  }

  .close-button {
    font-size: 10px;
    padding: 6px 16px;
    margin-top: 12px;
  }
}

@keyframes pulse-dot {
  0%   { box-shadow: 0 0 8px 2px rgba(210, 20, 10, 0.55); transform: translate(-50%, -50%) scale(1); }
  50%  { box-shadow: 0 0 18px 6px rgba(210, 20, 10, 0.75); transform: translate(-50%, -50%) scale(1.18); }
  100% { box-shadow: 0 0 8px 2px rgba(210, 20, 10, 0.55); transform: translate(-50%, -50%) scale(1); }
}
</style>
