<template>
  <div class="wm-overlay" @click.self="$emit('close')">
    <div class="wm-modal">
      <div class="wm-header">
        <span class="wm-title">⟡ World Map ⟡</span>
        <button class="wm-close" @click="$emit('close')">✕</button>
      </div>

      <div class="wm-body">
        <div class="wm-viewport" ref="viewportEl">
          <div
            class="wm-canvas"
            :style="canvasStyle"
            @wheel.prevent="onWheel"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
            @touchstart.prevent="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend="onTouchEnd"
          >
            <img :src="mapImageUrl" class="wm-map-img" alt="" draggable="false" @load="onImageLoad" />

            <!-- Settlement dots overlay -->
            <svg class="wm-dots-svg" :viewBox="`0 0 ${mapW} ${mapH}`" xmlns="http://www.w3.org/2000/svg">
              <!-- Continent borders -->
              <g class="wm-region-borders">
                <rect
                  v-for="(b, name) in CONTINENT_BOUNDS"
                  :key="'border-' + name"
                  :x="b.x * mapW / 2500"
                  :y="b.y * mapH / 2500"
                  :width="b.w * mapW / 2500"
                  :height="b.h * mapH / 2500"
                  class="wm-region-rect"
                  rx="6"
                />
              </g>

              <!-- Continent labels -->
              <g v-for="(pos, name) in LABEL_POSITIONS" :key="name" class="wm-label-group">
                <text
                  :x="pos.x * mapW / 2500"
                  :y="pos.y * mapH / 2500"
                  :font-size="labelFontSize"
                  class="wm-continent-label"
                  text-anchor="middle"
                  dominant-baseline="middle"
                >{{ name }}</text>
              </g>

              <!-- Other players' settlements (blue) -->
              <g v-for="s in otherSettlements" :key="s.id" @click="selectDot(s)" @touchend.stop="selectDot(s)" class="wm-dot-group">
                <circle :cx="s.x" :cy="s.y" :r="dotRadius * 4" class="wm-hit" />
                <circle :cx="s.x" :cy="s.y" :r="dotRadius" class="wm-dot wm-dot-blue" />
              </g>

              <!-- Player's journey targets (red) -->
              <g v-for="(article, idx) in journeyChain" :key="'j' + idx" @click="selectJourney(article, idx)" @touchend.stop="selectJourney(article, idx)" class="wm-dot-group">
                <circle :cx="journeyPos(article, idx).x" :cy="journeyPos(article, idx).y" :r="dotRadius * 4" class="wm-hit" />
                <circle :cx="journeyPos(article, idx).x" :cy="journeyPos(article, idx).y" :r="dotRadius" class="wm-dot wm-dot-red" />
              </g>

              <!-- Player's own settlement (green) -->
              <g v-if="ownSettlement" @click="selectDot(ownSettlement, true)" @touchend.stop="selectDot(ownSettlement, true)" class="wm-dot-group">
                <circle :cx="ownSettlement.x" :cy="ownSettlement.y" :r="dotRadius * 4" class="wm-hit" />
                <circle :cx="ownSettlement.x" :cy="ownSettlement.y" :r="dotRadius * 1.3" class="wm-dot wm-dot-green" />
              </g>
            </svg>
          </div>
        </div>

        <!-- Zoom controls -->
        <div class="wm-zoom-controls">
          <button class="wm-zoom-btn" @click="zoom(0.2)">+</button>
          <button class="wm-zoom-btn" @click="zoom(-0.2)">−</button>
          <button class="wm-zoom-btn wm-zoom-reset" @click="resetView">⌂</button>
        </div>

        <!-- Tooltip / info card -->
        <div v-if="selected" class="wm-card">
          <button class="wm-card-close" @click="selected = null">✕</button>
          <template v-if="selected.type === 'settlement'">
            <div class="wm-card-continent">{{ selected.continent }}</div>
            <div class="wm-card-name">{{ selected.town_name }}</div>
            <div class="wm-card-article">{{ selected.wiki_title?.replaceAll('_', ' ') }}</div>
            <div class="wm-card-lord">Lord: {{ selected.lord }}</div>
            <button
              v-if="selected.isOwn && hasSettlement"
              class="wm-card-visit"
              @click="$emit('visit-settlement'); selected = null; $emit('close')"
            >
              <i class="ra ra-castle-emblem"></i> Visit Settlement
            </button>
          </template>
          <template v-else-if="selected.type === 'journey'">
            <div class="wm-card-continent">{{ resolveContinent(selected.article, journeyContinents[selected.article] ?? null) }}</div>
            <div class="wm-card-name">{{ selected.article?.replaceAll('_', ' ') }}</div>
            <div class="wm-card-lord">
              {{ selected.idx < currentTargetIndex ? '✓ Visited' : selected.idx === currentTargetIndex ? '▶ Current' : '○ Upcoming' }}
            </div>
          </template>
        </div>

        <!-- Legend -->
        <div class="wm-legend">
          <span class="wm-legend-item"><span class="wm-legend-dot wm-legend-blue"></span> Settlements</span>
          <span class="wm-legend-item"><span class="wm-legend-dot wm-legend-green"></span> Yours</span>
          <span class="wm-legend-item"><span class="wm-legend-dot wm-legend-red"></span> Journey</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { classifyArticle } from '@/utils/continentClassifier';

// Module-level cache so repeated map opens don't re-fetch
const journeyContientCache = {};
const mapImageUrl = new URL('../assets/jpegworld-new.JPG', import.meta.url).href;

const props = defineProps({
  userId:             { type: String, default: null },
  settlementId:       { type: String, default: null },
  hasSettlement:      { type: Boolean, default: false },
  fullChain:          { type: Array, default: () => [] },
  currentTargetIndex: { type: Number, default: 0 },
});

defineEmits(['close', 'visit-settlement']);

// ── Zoom & pan ───────────────────────────────────────────────────────────────
const viewportEl = ref(null);
const scale      = ref(0.3);
const offsetX    = ref(0);
const offsetY    = ref(0);
const dragging   = ref(false);
const lastMouse  = ref({ x: 0, y: 0 });

const MAX_SCALE = 2.0;

function getMinScale() {
  const { w, h } = getViewportSize();
  return Math.max(w / mapW.value, h / mapH.value);
}
const mapW = ref(2500);
const mapH = ref(2500);

function onImageLoad(e) {
  mapW.value = e.target.naturalWidth  || 2500;
  mapH.value = e.target.naturalHeight || 2500;
  requestAnimationFrame(() => requestAnimationFrame(resetView));
}

const canvasStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
  transformOrigin: '0 0',
  width:  mapW.value + 'px',
  height: mapH.value + 'px',
}));

const dotRadius = computed(() => Math.max(2, 5 / scale.value));
const labelFontSize = computed(() => Math.max(8, 18 / scale.value));

function getViewportSize() {
  const el = viewportEl.value;
  return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 800, h: 600 };
}

function clampOffset() {
  const { w, h } = getViewportSize();
  const scaledW = mapW.value * scale.value;
  const scaledH = mapH.value * scale.value;
  offsetX.value = Math.max(w - scaledW, Math.min(0, offsetX.value));
  offsetY.value = Math.max(h - scaledH, Math.min(0, offsetY.value));
}

function applyZoom(newScale, pivotX, pivotY) {
  const clamped = Math.min(MAX_SCALE, Math.max(getMinScale(), newScale));
  const ratio = clamped / scale.value;
  offsetX.value = pivotX - (pivotX - offsetX.value) * ratio;
  offsetY.value = pivotY - (pivotY - offsetY.value) * ratio;
  scale.value = clamped;
  clampOffset();
}

function zoom(delta) {
  const { w, h } = getViewportSize();
  applyZoom(scale.value + delta, w / 2, h / 2);
}

function resetView() {
  const { w, h } = getViewportSize();
  const s = Math.max(w / mapW.value, h / mapH.value);
  scale.value = s;
  offsetX.value = (w - mapW.value * s) / 2;
  offsetY.value = (h - mapH.value * s) / 2;
}

function onWheel(e) {
  const rect = viewportEl.value?.getBoundingClientRect();
  const pivotX = rect ? e.clientX - rect.left : 0;
  const pivotY = rect ? e.clientY - rect.top  : 0;
  const delta = e.deltaY > 0 ? -0.06 : 0.06;
  applyZoom(scale.value + delta, pivotX, pivotY);
}

function onMouseDown(e) {
  dragging.value = true;
  lastMouse.value = { x: e.clientX, y: e.clientY };
}

function onMouseMove(e) {
  if (!dragging.value) return;
  offsetX.value += e.clientX - lastMouse.value.x;
  offsetY.value += e.clientY - lastMouse.value.y;
  lastMouse.value = { x: e.clientX, y: e.clientY };
  clampOffset();
}

function onMouseUp() { dragging.value = false; }

let lastTouchDist = null;
function onTouchStart(e) {
  if (e.touches.length === 1) {
    dragging.value = true;
    lastMouse.value = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2) {
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
  }
}

function onTouchMove(e) {
  if (e.touches.length === 1 && dragging.value) {
    offsetX.value += e.touches[0].clientX - lastMouse.value.x;
    offsetY.value += e.touches[0].clientY - lastMouse.value.y;
    lastMouse.value = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    clampOffset();
  } else if (e.touches.length === 2 && lastTouchDist !== null) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
    const { w, h } = getViewportSize();
    applyZoom(scale.value + (dist - lastTouchDist) * 0.003, w / 2, h / 2);
    lastTouchDist = dist;
  }
}

function onTouchEnd() { dragging.value = false; lastTouchDist = null; }

// ── Deterministic position from article title ────────────────────────────────

// Continent bounding boxes within the 2500x2500 map space (rough placements)
// Bounds in 2500×2500 design space, mapped to actual image via titleToPos scaling.
// Placed to sit on landmass based on the jpegworld-new.JPG layout:
//   - Ocean: top-left corner, top-right corner, far-right edge, bottom-center inlet
//   - Large inland sea: left side mid-to-lower
//   - Large lake: right side mid
const CONTINENT_BOUNDS = {
  "Kala Tundra":    { x: 300,  y: 100,  w: 480, h: 700 },
  "Bywyd Forest":   { x: 820,  y: 100,  w: 460, h: 680 },
  "Terra Plains":   { x: 1320, y: 100,  w: 500, h: 700 },
  "Salud Wetlands": { x: 1860, y: 150,  w: 380, h: 620 },
  "Storia Hills":   { x: 50,  y: 900,  w: 750, h: 700 },
  "Hisab Prairie":  { x: 870,  y: 900,  w: 560, h: 700 },
  "Natura Fens":    { x: 1480, y: 900,  w: 520, h: 700 },
  "Jnana Pines":    { x: 2050, y: 950,  w: 300, h: 600 },
  "Civitas Steppe": { x: 50,  y: 1700, w: 500, h: 650 },
  "Igra Shallows":  { x: 600,  y: 1720, w: 620, h: 580 },
  "Forge Marsh":    { x: 1620, y: 1720, w: 580, h: 560 },
};

// Label positions are independent of dot bounds so they can be freely staggered.
// Coordinates in 2500×2500 design space, scaled to actual map by (x * mapW/2500).
const LABEL_POSITIONS = {
  "Kala Tundra":    { x: 540,  y: 280  },
  "Bywyd Forest":   { x: 1050, y: 520  },
  "Terra Plains":   { x: 1570, y: 320  },
  "Salud Wetlands": { x: 2050, y: 480  },
  "Storia Hills":   { x: 400,  y: 1050 },
  "Hisab Prairie":  { x: 1150, y: 1320 },
  "Natura Fens":    { x: 1740, y: 1080 },
  "Jnana Pines":    { x: 2200, y: 1280 },
  "Civitas Steppe": { x: 300,  y: 1950 },
  "Igra Shallows":  { x: 800, y: 2050 },
  "Forge Marsh":    { x: 1910, y: 1880 },
};

// Null-continent settlements get spread across the middle of the map
const DEFAULT_BOUNDS = { x: 400, y: 300, w: 1700, h: 1200 };

function hashTitle(title) {
  let h = 0x811c9dc5;
  for (let i = 0; i < title.length; i++) {
    h ^= title.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function titleToPos(wikiTitle, continent) {
  const bounds = CONTINENT_BOUNDS[continent] ?? DEFAULT_BOUNDS;
  const h = hashTitle(wikiTitle ?? '');
  const h2 = hashTitle((wikiTitle ?? '') + '_y');
  const padding = 30;
  const rawX = bounds.x + padding + (h  % (bounds.w - padding * 2));
  const rawY = bounds.y + padding + (h2 % (bounds.h - padding * 2));
  // Scale from 2500×2500 design space to actual image dimensions
  return {
    x: rawX * mapW.value / 2500,
    y: rawY * mapH.value / 2500,
  };
}

// ── Data ─────────────────────────────────────────────────────────────────────
const allSettlements = ref([]);
const loading = ref(false);

const selected = ref(null);

const journeyChain = computed(() => props.fullChain ?? []);

const REALM_NAMES = Object.keys(CONTINENT_BOUNDS);

function resolveContinent(wikiTitle, continent) {
  if (continent && CONTINENT_BOUNDS[continent]) return continent;
  // No continent match — hash the title to a deterministic realm
  const h = hashTitle(wikiTitle ?? '');
  return REALM_NAMES[h % REALM_NAMES.length];
}

// Reactive wrapper so dots re-render as classifications arrive
const journeyContinents = ref({});

function journeyPos(article) {
  const continent = resolveContinent(article, journeyContinents.value[article] ?? null);
  return titleToPos(article, continent);
}

const mappedSettlements = computed(() =>
  allSettlements.value.map(s => {
    const continent = resolveContinent(s.wiki_title, s.continent);
    const pos = titleToPos(s.wiki_title, continent);
    const lord = s.lord_history?.[s.lord_history.length - 1]?.playerName ?? s.lord_history?.[0]?.playerName ?? 'Unknown';
    return { ...s, continent, ...pos, lord };
  })
);

const ownSettlement = computed(() =>
  props.settlementId
    ? mappedSettlements.value.find(s => s.id === props.settlementId) ?? null
    : null
);

const otherSettlements = computed(() =>
  mappedSettlements.value.filter(s => s.id !== props.settlementId)
);

function selectDot(s, isOwn = false) {
  selected.value = { type: 'settlement', ...s, isOwn };
}

function selectJourney(article, idx) {
  selected.value = { type: 'journey', article, idx };
}

async function fetchSettlements() {
  loading.value = true;
  const { data, error } = await supabase
    .from('settlements')
    .select('id, wiki_title, town_name, continent, owner_id, lord_history');
  console.log('[WorldMap] userId:', props.userId);
  console.log('[WorldMap] mapW:', mapW.value, 'mapH:', mapH.value);
  console.log('[WorldMap] settlements:', data, 'error:', error);
  const own = data?.find(s => s.owner_id === props.userId);
  if (own) {
    const pos = titleToPos(own.wiki_title, own.continent);
    console.log('[WorldMap] ownSettlement pos:', pos, 'continent:', own.continent);
  }
  console.log('[WorldMap] fullChain:', props.fullChain);
  if (!error && data) allSettlements.value = data;
  loading.value = false;
}

async function classifyJourneyChain() {
  const articles = props.fullChain ?? [];
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    if (journeyContientCache[article]) {
      journeyContinents.value[article] = journeyContientCache[article];
      continue;
    }
    // Stagger API calls by 150ms each to avoid hammering Wikipedia
    await new Promise(r => setTimeout(r, i === 0 ? 0 : 150));
    const continent = await classifyArticle(article);
    journeyContientCache[article] = continent;
    journeyContinents.value = { ...journeyContinents.value, [article]: continent };
  }
}

onMounted(async () => {
  await fetchSettlements();
  requestAnimationFrame(() => requestAnimationFrame(resetView));
  classifyJourneyChain(); // fire-and-forget, dots update as results arrive
});
</script>

<style scoped>
.wm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.wm-modal {
  width: 92vw;
  max-width: 1100px;
  height: 88vh;
  background: #06080f;
  border: 2px solid #7a5c28;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.8), 0 0 20px rgba(122, 92, 40, 0.2);
}

.wm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #0a0c14;
  border-bottom: 1px solid #7a5c28;
}

.wm-title {
  font-family: "IBM Plex Sans", Arial, sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #c8a84b;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.wm-close {
  background: none;
  border: none;
  color: #7a5c28;
  font-size: 1rem;
  cursor: pointer;
}
.wm-close:hover { color: #c8a84b; }

.wm-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #5a8fa8;
}

.wm-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  position: relative;
}
.wm-viewport:active { cursor: grabbing; }

/* Inset vignette over the map */
.wm-viewport::before {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  z-index: 10;
}

/* Corner ornaments */
.wm-viewport::after {
  content: '✦';
  position: absolute;
  bottom: 6px;
  right: 8px;
  color: #c8a84b;
  font-size: 0.7rem;
  z-index: 11;
  pointer-events: none;
  opacity: 0.6;
}

.wm-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 2500px;
  height: 2500px;
  will-change: transform;
  background-color: #2a4a6e;
}

.wm-map-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
  pointer-events: none;
}


.wm-dots-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.wm-region-borders {
  pointer-events: none;
}

.wm-region-rect {
  fill: rgba(200, 168, 75, 0.04);
  stroke: rgba(60, 35, 5, 0.45);
  stroke-width: 6;
  stroke-dasharray: 18 10;
  stroke-linejoin: round;
  display: none;
}

.wm-label-group {
  pointer-events: none;
}

.wm-continent-label {
  fill: #3a2000;
  font-family: "Georgia", "Times New Roman", serif;
  font-weight: bold;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.45;
  paint-order: stroke;
  stroke: rgba(240, 220, 180, 0.5);
  stroke-width: 4px;
  stroke-linejoin: round;
}

.wm-dot-group {
  cursor: pointer;
  pointer-events: all;
}

.wm-hit {
  fill: transparent;
  pointer-events: all;
}

.wm-dot {
  pointer-events: none;
  transition: r 0.15s;
}

.wm-dot-blue {
  fill: #4488ff;
  stroke: #aaccff;
  stroke-width: 2;
  filter: drop-shadow(0 0 4px rgba(68, 136, 255, 0.8));
}

.wm-dot-green {
  fill: #44cc77;
  stroke: #aaffcc;
  stroke-width: 2;
  filter: drop-shadow(0 0 6px rgba(68, 204, 120, 0.9));
}

.wm-dot-red {
  fill: #ff4455;
  stroke: #ffaaaa;
  stroke-width: 2;
  filter: drop-shadow(0 0 4px rgba(255, 68, 85, 0.8));
}

.wm-zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.wm-zoom-btn {
  width: 32px;
  height: 32px;
  background: #0a0c14;
  border: 1px solid #7a5c28;
  color: #c8a84b;
  font-size: 1.1rem;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wm-zoom-btn:hover { background: #1a140a; border-color: #c8a84b; }
.wm-zoom-reset { font-size: 0.85rem; }

.wm-card {
  position: absolute;
  top: 16px;
  left: 16px;
  background: #0d1525;
  border: 1px solid #2a3a5c;
  border-radius: 8px;
  padding: 14px 16px;
  min-width: 200px;
  max-width: 260px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  font-family: "IBM Plex Sans", Arial, sans-serif;
}

.wm-card-close {
  position: absolute;
  top: 8px;
  right: 10px;
  background: none;
  border: none;
  color: #6080a0;
  cursor: pointer;
  font-size: 0.85rem;
}
.wm-card-close:hover { color: #a0c4ff; }

.wm-card-continent {
  font-size: 0.72rem;
  color: #6080a0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}

.wm-card-name {
  font-size: 1rem;
  font-weight: 700;
  color: #e0eeff;
  margin-bottom: 4px;
}

.wm-card-article {
  font-size: 0.82rem;
  color: #8aabcc;
  margin-bottom: 6px;
}

.wm-card-lord {
  font-size: 0.8rem;
  color: #a0c4ff;
  margin-bottom: 8px;
}

.wm-card-visit {
  background: #1a4a2a;
  border: 1px solid #44cc77;
  color: #aaffcc;
  padding: 6px 12px;
  border-radius: 5px;
  font-size: 0.82rem;
  cursor: pointer;
  width: 100%;
  font-family: "IBM Plex Sans", Arial, sans-serif;
}
.wm-card-visit:hover { background: #246635; }

.wm-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  gap: 14px;
  font-family: "IBM Plex Sans", Arial, sans-serif;
  font-size: 0.78rem;
  color: #000000;
  background: white;
  border: 1px solid black;
  padding: .3rem;
}

.wm-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.wm-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.wm-legend-blue  { background: #4488ff; box-shadow: 0 0 4px #4488ff; }
.wm-legend-green { background: #44cc77; box-shadow: 0 0 4px #44cc77; }
.wm-legend-red   { background: #ff4455; box-shadow: 0 0 4px #ff4455; }
</style>
