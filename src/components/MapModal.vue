<template>
  <div :class="props.embedded ? 'map-embedded' : 'modal-overlay'" @click.self="props.embedded ? null : $emit('close')">
    <div class="modal-content">

      <div class="modal-header">
        <span class="header-ornament">⟡</span>
        <span class="header-title">Map</span>
        <span class="header-ornament">⟡</span>
      </div>

      <div class="modal-body">
        <div v-if="!props.hideMap" class="map-container">
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

          <div v-if="markedPOIs.length > 0" class="poi-section">
            <div class="poi-section-title">Points of Interest</div>
            <div
              v-for="poi in markedPOIs"
              :key="poi.id"
              class="poi-item"
              :class="{ 'poi-engaged': engagedPOIs.includes(poi.id), 'poi-revisitable': !engagedPOIs.includes(poi.id) && isIdle, 'poi-unavailable': !engagedPOIs.includes(poi.id) && !isIdle }"
              @click="!engagedPOIs.includes(poi.id) && isIdle && $emit('revisit-poi', poi)"
            >
              <i class="ra ra-compass"></i> {{ poi.name }}
            </div>
          </div>

          <div v-if="props.hasSettlement" class="poi-section settlement-section">
            <div class="poi-section-title">Settlement</div>
            <div class="poi-item poi-revisitable" @click="$emit('visit-settlement')">
              <i class="ra ra-castle-emblem"></i> Visit Your Settlement
            </div>
          </div>
        </div>
      </div>

      <button v-if="!props.embedded" class="close-button" @click="$emit('close')">
        ⎯ &nbsp; Put away the map &nbsp; ⎯
      </button>

    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  embedded: { type: Boolean, default: false },
  hideMap:   { type: Boolean, default: false },
  fullChain: { type: Array, default: () => [] },
  currentTargetIndex: { type: Number, default: -1 },
  markedPOIs: { type: Array, default: () => [] },
  engagedPOIs: { type: Array, default: () => [] },
  isIdle: { type: Boolean, default: false },
  hasSettlement: { type: Boolean, default: false },
});

defineEmits(["close", "revisit-poi", "visit-settlement"]);

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
@import "./styles/mapModalStyles.css";
</style>
