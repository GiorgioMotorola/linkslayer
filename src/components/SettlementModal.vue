<template>
  <div class="settlement-overlay">
    <div class="settlement-panel">

      <!-- Header -->
      <div class="settlement-header">
        <div class="settlement-title-block">
          <div class="settlement-town-name">🏰 {{ settlement.town_name }}</div>
          <div class="settlement-region">📍 {{ settlement.wiki_title.replaceAll("_", " ") }}</div>
        </div>
      </div>

      <!-- Lord info -->
      <div class="settlement-lord-bar" v-if="currentLord">
        <template v-if="props.readOnly">
          <span class="lord-label">🏴 Claimed by</span>
          <span class="lord-name">{{ (currentLord.signInEmail ?? currentLord.playerName ?? "").split("@")[0] }}</span>
          <!-- <span class="lord-since"> as {{ currentLord.playerName }}</span> -->
        </template>
        <template v-else>
          <span class="lord-label">👑 Lord</span>
          <span class="lord-name">{{ currentLord.playerName }}</span>
          <span class="lord-since"> · Day {{ currentLord.startDay }}</span>
        </template>
      </div>

      <!-- Read-only visitor badge -->
      <div v-if="props.readOnly" class="settlement-visitor-badge">👁 Visiting — Read Only</div>

      <!-- Castle short rest / forge shortcuts (if castle is built) -->
      <div class="settlement-castle-actions" v-if="hasCastle && !props.readOnly">
        <button class="castle-action-btn" @click="$emit('open-forge')">⚒️ Forge</button>
        <button class="castle-action-btn" @click="$emit('short-rest')">🛌 Short Rest</button>
      </div>

      <!-- Grid (canvas) -->
      <div class="settlement-grid-wrapper">
        <canvas
          ref="canvasRef"
          width="640"
          height="512"
          class="settlement-canvas"
          :style="{ cursor: selectedBuildingType ? 'pointer' : 'default' }"
          @click="handleCanvasClick"
          @mousemove="handleCanvasMouseMove"
          @mouseleave="onCanvasMouseLeave"
        />
      </div>
              <div class="canvas-cell-label" v-if="hoveredLabel">{{ hoveredLabel }}</div>
        <div class="placement-error" v-if="placementError">{{ placementError }}</div>

      <!-- Building info panel (cursor mode) -->
      <div v-if="selectedBuilding" class="building-info-panel">
        <button class="building-info-close" @click="selectedBuilding = null">✕</button>
        <div class="building-info-header">
          <img :src="paletteUrls[selectedBuilding.building.type]" class="building-info-img" />
          <div>
            <div class="building-info-name">{{ selectedBuilding.def.name }}</div>
            <div class="building-info-worker">👤 {{ workerName(selectedBuilding.building.cellIndex) }}</div>
          </div>
        </div>
        <div class="building-info-desc">{{ selectedBuilding.def.description }}</div>
        <button
          v-if="!props.readOnly && selectedBuilding.def.category === 'structure'"
          class="building-info-deconstruct"
          @click="pendingDeconstruct = { building: selectedBuilding.building, def: selectedBuilding.def }"
        >⛏ Deconstruct (refund {{ selectedBuilding.def.cost }}g)</button>
        <div class="building-info-earnings">
          <div class="building-info-earnings-title">All-time earnings</div>
          <div v-if="selectedBuilding.building.totalEarned?.gold > 0">💰 {{ selectedBuilding.building.totalEarned.gold }}g</div>
          <div v-if="selectedBuilding.building.totalEarned?.scrap > 0">🔩 {{ selectedBuilding.building.totalEarned.scrap }} scrap</div>
          <div v-if="selectedBuilding.building.totalEarned?.healthPotions > 0">⚗️ {{ selectedBuilding.building.totalEarned.healthPotions }} potions</div>
          <div v-if="!selectedBuilding.building.totalEarned?.gold && !selectedBuilding.building.totalEarned?.scrap && !selectedBuilding.building.totalEarned?.healthPotions" class="building-info-none">Nothing collected yet.</div>
        </div>
      </div>

      <!-- Building palette popup -->
      <div class="building-palette" v-if="!props.readOnly">
        <div class="settlement-resources">
          <div class="resource-item" :class="{ 'resource-has-value': pendingGold > 0 }">
            💰 <span>{{ pendingGold }}g pending</span>
          </div>
          <div class="resource-item" :class="{ 'resource-has-value': pendingScrap > 0 }">
            🔩 <span>{{ pendingScrap }} scrap pending</span>
          </div>
          <div class="resource-item" :class="{ 'resource-has-value': pendingPotions > 0 }">
            ⚗️ <span>{{ pendingPotions }} potions pending</span>
          </div>
          <button
            class="collect-btn"
            :disabled="pendingGold === 0 && pendingScrap === 0 && pendingPotions === 0"
            @click="$emit('collect')"
          >
            Collect All
          </button>
        </div>
        <div class="build-btn-wrapper">
            <button
              class="build-popup-btn cursor-btn"
              :class="{ selected: selectedBuildingType === null }"
              @click="selectedBuildingType = null"
            >🖱️ Cursor</button>
            <button class="build-popup-btn" @click="showPalette = !showPalette">
              🏗️ Build {{ showPalette ? '▲' : '▼' }}
            </button>
            <div v-if="showPalette" class="build-popup">
              <div class="build-popup-title">Buildings</div>
              <div class="palette-scroll">
                <button
                  v-for="(def, key) in BUILDING_DEFS"
                  :key="key"
                  class="palette-btn"
                  :class="{ selected: selectedBuildingType === key }"
                  :title="def.name + ' — ' + def.description + ' (' + def.cost + 'g)'"
                  @click="toggleBuildingSelect(key)"
                >
                  <img :src="paletteUrls[key]" class="palette-img" />
                  <span class="palette-cost">{{ def.cost }}g</span>
                </button>
              </div>
              <div class="build-popup-subtitle">Terrain</div>
              <div class="palette-scroll">
                <button
                  v-for="(def, key) in TERRAIN_PAINTS"
                  :key="key"
                  class="palette-btn"
                  :class="{ selected: selectedBuildingType === key }"
                  :title="def.description"
                  @click="toggleBuildingSelect(key)"
                >
                  <img :src="paletteUrls[def.paintsTerrain]" class="palette-img" />
                  <span class="palette-cost">free</span>
                </button>
              </div>
              <div v-if="selectedBuildingType" class="palette-selected-info">
                <strong>{{ (BUILDING_DEFS[selectedBuildingType] ?? TERRAIN_PAINTS[selectedBuildingType])?.name }}</strong>
                — {{ (BUILDING_DEFS[selectedBuildingType] ?? TERRAIN_PAINTS[selectedBuildingType])?.description }}
                <button class="palette-cancel" @click="selectedBuildingType = null">✕ Cancel</button>
              </div>
            </div>
          </div>
      </div>

      <!-- History book toggle -->
      <div class="settlement-history">
        <div class="settlement-history-bar">
          <button class="history-toggle-btn" @click="showHistory = !showHistory">
            📖 {{ showHistory ? 'Hide' : 'Show' }} History Book
          </button>
          <button class="settlement-close-btn" @click="$emit('close')">⎯ Leave Settlement ⎯</button>
        </div>
        <div v-if="showHistory" class="history-list">
          <div class="history-title">📖 Lords of {{ settlement.town_name }}</div>
          <div
            v-for="(entry, i) in settlement.lord_history"
            :key="i"
            class="history-entry"
          >
            <span class="history-lord-name">{{ entry.playerName }}</span>
            <span class="history-days">
              Day {{ entry.startDay }}
              <template v-if="entry.endDay"> – Day {{ entry.endDay }}</template>
              <template v-else> – present</template>
            </span>
            <span v-if="entry.endReason" class="history-end-reason">{{ entry.endReason }}</span>
          </div>
          <div v-if="!settlement.lord_history?.length" class="history-empty">No history yet.</div>
        </div>
      </div>

    </div>

    <!-- Placement confirmation dialog -->
    <div v-if="pendingPlacement" class="placement-confirm-overlay" @click.self="cancelPlacement">
      <div class="placement-confirm-dialog">
        <div class="placement-confirm-title">Place {{ pendingPlacement.def.name }}?</div>
        <div class="placement-confirm-body">
          <img :src="paletteUrls[pendingPlacement.type]" class="placement-confirm-img" />
          <div>
            <div class="placement-confirm-desc">{{ pendingPlacement.def.description }}</div>
            <div class="placement-confirm-cost">Cost: {{ pendingPlacement.def.cost }}g</div>
          </div>
        </div>
        <div class="placement-confirm-actions">
          <button class="placement-confirm-yes" @click="confirmPlacement">✓ Place</button>
          <button class="placement-confirm-no" @click="cancelPlacement">✕ Cancel</button>
        </div>
      </div>
    </div>

    <!-- Deconstruct confirmation dialog -->
    <div v-if="pendingDeconstruct" class="placement-confirm-overlay" @click.self="cancelDeconstruct">
      <div class="placement-confirm-dialog">
        <div class="placement-confirm-title">Deconstruct {{ pendingDeconstruct.def.name }}?</div>
        <div class="placement-confirm-body">
          <img :src="paletteUrls[pendingDeconstruct.building.type]" class="placement-confirm-img" />
          <div>
            <div class="placement-confirm-desc">This building will be removed and you'll receive a full refund.</div>
            <div class="placement-confirm-cost">Refund: {{ pendingDeconstruct.def.cost }}g</div>
          </div>
        </div>
        <div class="placement-confirm-actions">
          <button class="placement-confirm-yes" @click="confirmDeconstruct">⛏ Deconstruct</button>
          <button class="placement-confirm-no" @click="cancelDeconstruct">✕ Cancel</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { BUILDING_DEFS, TERRAIN_PAINTS, computeYield } from "@/utils/buildingDefs.js";

const CELL_SIZE = 32;
const COLS = 20;
const ROWS = 16;

const TERRAIN_COLORS = {
  grass:        "#136d15",
  river:        "#2979c8",
  rock:         "#16c60c",
  tree:         "#2d6e2d",
  pine_tree:    "#1a5c1a",
  coconut_tree: "#4a8c2a",
  dead_tree:    "#7a6040",
  winter_tree:  "#8ab0c8",
  wheatfield:   "#c8a040",
  white_flower: "#e08080",
  yellow_white_flower: "#e08080",
  pink_flower: "#e08080",
};

// MiniWorld sprite sheet definitions: { src, sx, sy, sw, sh }
// sw/sh = source crop size (16 = 1 tile, 32 = 2×2 tiles for large buildings)
const SPRITE_DEFS = {
  grass:         { src: new URL("../assets/settlement/miniworld/Ground/TexturedGrass.png",     import.meta.url).href, sx:  16, sy: 16, sw: 32, sh: 16 },
  white_flower:        { src: new URL("../assets/flowers.png",     import.meta.url).href, sx:  0, sy: 16, sw: 16, sh: 16 },
  yellow_white_flower:        { src: new URL("../assets/flowers.png",     import.meta.url).href, sx:  16, sy: 16, sw: 16, sh: 16 },
  pink_flower:        { src: new URL("../assets/flowers.png",     import.meta.url).href, sx:  32, sy: 0, sw: 16, sh: 16 },
  river:         { src: new URL("../assets/settlement/miniworld/Ground/Shore.png",             import.meta.url).href, sx:  48, sy: 0, sw: 16, sh: 16 },
  road:          { src: new URL("../assets/settlement/miniworld/Ground/Grass.png",             import.meta.url).href, sx: 64, sy: 0, sw: 16, sh: 16 },
  bridge:        { src: new URL("../assets/settlement/miniworld/Miscellaneous/Bridge.png",     import.meta.url).href, sx: 8, sy: 16, sw: 16, sh: 16 },
  castle:        { src: new URL("../assets/settlement/miniworld/Buildings/Red/RedKeep.png",      import.meta.url).href, sx:  0, sy:  0, sw: 32, sh: 32},
  house:         { src: new URL("../assets/settlement/miniworld/Buildings/Wood/Houses.png",    import.meta.url).href, sx:  16, sy:  32, sw: 16, sh: 16},
  apothecary:    { src: new URL("../assets/settlement/miniworld/Buildings/Cyan/CyanBarracks.png", import.meta.url).href, sx:  16, sy: 0, sw: 16, sh: 16 },
  smithy:        { src: new URL("../assets/settlement/miniworld/Buildings/Enemy/Orc/AllBuildingsPreview.png", import.meta.url).href, sx:  16, sy:  145, sw: 16, sh: 16 },
  church:        { src: new URL("../assets/settlement/miniworld/Buildings/Wood/Chapels.png",   import.meta.url).href, sx:  16, sy:  16, sw: 16, sh: 16 },
  general_store: { src: new URL("../assets/settlement/miniworld/Buildings/Lime/LimeMarket.png",    import.meta.url).href, sx:  0, sy:  0, sw: 16, sh: 16 },
  mill:          { src: new URL("../assets/settlement/miniworld/Buildings/Wood/Resources.png",    import.meta.url).href, sx:  16, sy: 16, sw: 16, sh: 16 },
  horse_stable:  { src: new URL("../assets/settlement/miniworld/Buildings/Purple/PurpleBarracks.png",  import.meta.url).href, sx:  16, sy:  0, sw: 16, sh: 16},
  mine:          { src: new URL("../assets/settlement/miniworld/Buildings/Wood/CaveV2.png",    import.meta.url).href, sx:  0, sy:  0, sw: 16, sh: 16 },
  tree:          { src: new URL("../assets/settlement/miniworld/Nature/Trees.png",             import.meta.url).href, sx:  48, sy:  0, sw: 16, sh: 16 },
  rock:          { src: new URL("../assets/settlement/miniworld/Nature/Rocks.png",             import.meta.url).href, sx:  16, sy:  0, sw: 16, sh: 16 },
  pine_tree:     { src: new URL("../assets/settlement/miniworld/Nature/PineTrees.png",         import.meta.url).href, sx:   16, sy:  0, sw: 16, sh: 16 },
  coconut_tree:  { src: new URL("../assets/settlement/miniworld/Nature/CoconutTrees.png",      import.meta.url).href, sx:   32, sy:  0, sw: 16, sh: 16 },
  dead_tree:     { src: new URL("../assets/settlement/miniworld/Nature/DeadTrees.png",         import.meta.url).href, sx:   0, sy:  0, sw: 16, sh: 16 },
  winter_tree:   { src: new URL("../assets/settlement/miniworld/Nature/WinterTrees.png",       import.meta.url).href, sx:   32, sy:  0, sw: 16, sh: 16 },
  wheatfield:    { src: new URL("../assets/settlement/miniworld/Nature/Wheatfield.png",        import.meta.url).href, sx:   48, sy:  0, sw: 16, sh: 16 },
  well:          { src: new URL("../assets/settlement/miniworld/Miscellaneous/Well.png",       import.meta.url).href, sx:   0, sy:  0, sw: 16, sh: 16 },
  tavern:        { src: new URL("../assets/settlement/miniworld/Buildings/Wood/Taverns.png",   import.meta.url).href, sx:   0, sy:  0, sw: 16, sh: 16 },
};

// tileImages[key] = { img, sx, sy, sw, sh }
const tileImages = {};
const imagesReady = { value: false };
const paletteUrls = ref({});

async function preloadImages() {
  imagesReady.value = false;

  // Load each unique sheet path once
  const pathToImg = {};
  await Promise.all(
    [...new Set(Object.values(SPRITE_DEFS).map(d => d.src))].map(src =>
      new Promise(resolve => {
        const img = new Image();
        pathToImg[src] = img;   // assign before setting src (cached images fire onload synchronously)
        img.onload  = resolve;
        img.onerror = resolve;
        img.src = src;
      })
    )
  );

  // Wire tileImages with sprite coords
  for (const [key, def] of Object.entries(SPRITE_DEFS)) {
    tileImages[key] = { img: pathToImg[def.src], sx: def.sx, sy: def.sy, sw: def.sw, sh: def.sh };
  }

  // Pre-render 32×32 palette thumbnails as data URLs
  const off = document.createElement("canvas");
  off.width = 32; off.height = 32;
  const pctx = off.getContext("2d");
  pctx.imageSmoothingEnabled = false;
  const urls = {};
  for (const [key, tile] of Object.entries(tileImages)) {
    const { img, sx, sy, sw, sh } = tile;
    if (!img?.complete || img.naturalWidth === 0) continue;
    pctx.clearRect(0, 0, 32, 32);
    pctx.drawImage(img, sx, sy, sw, sh, 0, 0, 32, 32);
    urls[key] = off.toDataURL();
  }
  paletteUrls.value = urls;

  imagesReady.value = true;
  drawGrid();
}

const props = defineProps({
  settlement:   { type: Object, required: true },
  playerGold:   { type: Number, default: 0 },
  isOwner:      { type: Boolean, default: true },
  readOnly:     { type: Boolean, default: false },
  clicksSince:  { type: Number, default: 0 },
});

const emit = defineEmits(["close", "collect", "place-building", "remove-building", "change-terrain", "open-forge", "short-rest"]);

const showHistory          = ref(false);
const showPalette          = ref(false);
const selectedBuildingType = ref(null);
const canvasRef      = ref(null);
const hoveredCell    = ref(null);
const placementError     = ref(null);
const pendingPlacement   = ref(null); // { cellIndex, type, def }
const pendingDeconstruct = ref(null); // { building, def }
const selectedBuilding = ref(null); // { building, def } — info panel
let   placementErrorTimer = null;

// ── Worker name generator (seeded by cellIndex so stable per building) ──────
const WORKER_FIRST = ["Aldric","Brynn","Cedric","Dara","Elara","Finn","Gwynn","Hadwin","Isolde","Joren","Kira","Leofric","Maren","Niall","Oren","Petra","Quen","Rowan","Sable","Tomas","Ursa","Vael","Wren","Xyra","Yvaine","Zephyr"];
const WORKER_LAST  = ["Smith","Cooper","Thatcher","Miller","Fletcher","Ward","Mason","Tanner","Sawyer","Fisher","Baker","Potter","Weaver","Carter","Archer","Brewer","Chandler","Dyer","Fuller","Glazer"];
function workerName(cellIndex) {
  const a = (cellIndex * 2654435761) >>> 0;
  const b = (cellIndex * 2246822519) >>> 0;
  return `${WORKER_FIRST[a % WORKER_FIRST.length]} ${WORKER_LAST[b % WORKER_LAST.length]}`;
}

function showPlacementError(msg) {
  placementError.value = msg;
  clearTimeout(placementErrorTimer);
  placementErrorTimer = setTimeout(() => { placementError.value = null; }, 2000);
}

// ── Computed ───────────────────────────────────────────────────────────────
const currentLord = computed(() => {
  const h = props.settlement.lord_history ?? [];
  return h.find(e => !e.endDay) ?? h[h.length - 1] ?? null;
});

const pending = computed(() =>
  computeYield(
    props.settlement.buildings ?? [],
    props.settlement.terrain ?? [],
    props.clicksSince
  )
);
const pendingGold    = computed(() => pending.value.gold);
const pendingScrap   = computed(() => pending.value.scrap);
const pendingPotions = computed(() => pending.value.healthPotions);

const hasCastle = computed(() =>
  (props.settlement.buildings ?? []).some(b => b.type === "castle")
);

const hoveredLabel = computed(() => {
  if (hoveredCell.value === null) return null;
  const i = hoveredCell.value;
  const building = buildingAt(i);
  if (building) return BUILDING_DEFS[building.type]?.name ?? building.type;
  const tile = props.settlement.terrain[i] ?? "grass";
  return tile.charAt(0).toUpperCase() + tile.slice(1);
});

// ── Large-building set (occupy 2×2 cells) ──────────────────────────────────
const LARGE_BUILDINGS = new Set(["castle"]);

function isLarge(type) { return LARGE_BUILDINGS.has(type); }

// ── Grid helpers ───────────────────────────────────────────────────────────
function buildingAt(cellIndex) {
  const col = cellIndex % COLS;
  const row = Math.floor(cellIndex / COLS);
  return (props.settlement.buildings ?? []).find(b => {
    if (!isLarge(b.type)) return b.cellIndex === cellIndex;
    const bc = b.cellIndex % COLS;
    const br = Math.floor(b.cellIndex / COLS);
    return col >= bc && col <= bc + 1 && row >= br && row <= br + 1;
  }) ?? null;
}

// ── Canvas drawing ─────────────────────────────────────────────────────────
function drawGrid() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const terrain = props.settlement.terrain ?? [];
  const hovered = hoveredCell.value;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  // Pass 1: terrain tiles
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x   = col * CELL_SIZE;
    const y   = row * CELL_SIZE;
    const tile = terrain[i] ?? "grass";

    const isRiver = tile === "river";
    // Base fill color (fallback)
    ctx.fillStyle = isRiver ? TERRAIN_COLORS.river : TERRAIN_COLORS.grass;
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // Base: grass sprite under everything (skip for river which has its own full tile)
    if (!isRiver) {
      const g = tileImages["grass"];
      if (g?.img?.complete && g.img.naturalWidth > 0) {
        ctx.drawImage(g.img, g.sx, g.sy, g.sw, g.sh, x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    // Overlay: river / rock / tree on top of grass
    if (tile !== "grass") {
      const t = tileImages[tile];
      if (t?.img?.complete && t.img.naturalWidth > 0) {
        ctx.drawImage(t.img, t.sx, t.sy, t.sw, t.sh, x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  // Pass 2: buildings (each drawn once at its anchor)
  const drawn = new Set();
  for (const building of (props.settlement.buildings ?? [])) {
    if (drawn.has(building.cellIndex)) continue;
    drawn.add(building.cellIndex);

    const bc   = building.cellIndex % COLS;
    const br   = Math.floor(building.cellIndex / COLS);
    const bx   = bc * CELL_SIZE;
    const by   = br * CELL_SIZE;
    const size = isLarge(building.type) ? CELL_SIZE * 2 : CELL_SIZE;

    const t = tileImages[building.type];
    if (t?.img?.complete && t.img.naturalWidth > 0) {
      ctx.drawImage(t.img, t.sx, t.sy, t.sw, t.sh, bx, by, size, size);
    }

    // Name label for structure buildings only (skip terrain-category and unlabelled)
    const _bdef = BUILDING_DEFS[building.type];
    // if (_bdef?.category === "structure" && _bdef?.emoji) {
    //   const label = _bdef.emoji;
    //   const cx = bx + size / 2;
    //   const cy = by + 8;
    //   ctx.font = "20px sans-serif";
    //   ctx.textAlign = "center";
    //   ctx.fillStyle = "rgba(0,0,0,0.55)";
    //   ctx.fillText(label, cx + 1, cy + 1);
    //   ctx.fillStyle = "#FFFFFF";
    //   ctx.fillText(label, cx, cy);
    // }
  }

  // Pass 3: hover highlight (2×2 for large building selection, 1×1 otherwise)
  if (hovered !== null) {
    const hc = hovered % COLS;
    const hr = Math.floor(hovered / COLS);
    const large = selectedBuildingType.value && isLarge(selectedBuildingType.value);
    const hSize = large ? CELL_SIZE * 2 : CELL_SIZE;
    ctx.fillStyle = "rgba(255,255,255,0.30)";
    ctx.fillRect(hc * CELL_SIZE, hr * CELL_SIZE, hSize, hSize);
  }
}

// ── Canvas interaction helpers ─────────────────────────────────────────────
function cellFromEvent(event) {
  const canvas = canvasRef.value;
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const cx     = (event.clientX - rect.left) * scaleX;
  const cy     = (event.clientY - rect.top)  * scaleY;
  const col    = Math.floor(cx / CELL_SIZE);
  const row    = Math.floor(cy / CELL_SIZE);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
  return row * COLS + col;
}

function handleCanvasClick(event) {
  const i = cellFromEvent(event);
  if (i !== null) handleCellClick(i);
}

function handleCanvasMouseMove(event) {
  const i = cellFromEvent(event);
  if (i !== hoveredCell.value) {
    hoveredCell.value = i;
    drawGrid();
  }
}

function onCanvasMouseLeave() {
  hoveredCell.value = null;
  drawGrid();
}

// ── Interactions ───────────────────────────────────────────────────────────
function toggleBuildingSelect(key) {
  selectedBuildingType.value = selectedBuildingType.value === key ? null : key;
  if (selectedBuildingType.value !== null) showPalette.value = false;
}

function handleCellClick(cellIndex) {
  const existing = buildingAt(cellIndex);

  // Cursor mode (or read-only visitor) — show info panel, never modify
  if (selectedBuildingType.value === null || props.readOnly) {
    if (existing) {
      const def = BUILDING_DEFS[existing.type];
      selectedBuilding.value = def ? { building: existing, def } : null;
    } else {
      selectedBuilding.value = null;
    }
    return;
  }

  if (existing) {
    // Only road and bridge can be removed by clicking with a build tool
    if (existing.type === "road" || existing.type === "bridge") {
      emit("remove-building", { cellIndex: existing.cellIndex });
    } else {
      showPlacementError("Use Deconstruct to remove this building");
    }
    return;
  }

  if (selectedBuildingType.value) {
    const paintDef = TERRAIN_PAINTS[selectedBuildingType.value];
    if (paintDef) {
      if (buildingAt(cellIndex)) { showPlacementError("Can't paint over a building"); return; }
      emit("change-terrain", { cellIndex, terrainType: paintDef.paintsTerrain });
      return;
    }

    const def = BUILDING_DEFS[selectedBuildingType.value];
    if (props.playerGold < def.cost) { showPlacementError(`Not enough gold (need ${def.cost}g)`); return; }

    const tile = props.settlement.terrain?.[cellIndex];
    if (def.category === "structure" && tile === "river") { showPlacementError("Can't build on river"); return; }
    if (def.requiresTerrain && tile !== def.requiresTerrain) { showPlacementError(`Must be placed on ${def.requiresTerrain}`); return; }
    if (def.requiresAdjacentTerrain) {
      const col = cellIndex % COLS;
      const row = Math.floor(cellIndex / COLS);
      const neighbors = [
        row > 0          ? cellIndex - COLS : -1,
        row < ROWS - 1   ? cellIndex + COLS : -1,
        col > 0          ? cellIndex - 1    : -1,
        col < COLS - 1   ? cellIndex + 1    : -1,
      ].filter(n => n >= 0);
      const adjTerrain = neighbors.map(n => props.settlement.terrain?.[n] ?? "grass");
      if (!adjTerrain.includes(def.requiresAdjacentTerrain)) {
        showPlacementError(`Must be adjacent to ${def.requiresAdjacentTerrain}`); return;
      }
    }
    if (def.requiresBuildingOnMap) {
      const hasRequired = props.settlement.buildings?.some(b => b.type === def.requiresBuildingOnMap);
      if (!hasRequired) { showPlacementError(`Requires a ${BUILDING_DEFS[def.requiresBuildingOnMap]?.name ?? def.requiresBuildingOnMap} on the map`); return; }
    }
    if (def.maxPerMap) {
      const count = props.settlement.buildings?.filter(b => b.type === selectedBuildingType.value).length ?? 0;
      if (count >= def.maxPerMap) { showPlacementError(`Only ${def.maxPerMap} allowed per settlement`); return; }
    }

    if (isLarge(selectedBuildingType.value)) {
      const col = cellIndex % COLS;
      const row = Math.floor(cellIndex / COLS);
      if (col + 1 >= COLS || row + 1 >= ROWS) return;
      const footprint = [cellIndex, cellIndex + 1, cellIndex + COLS, cellIndex + COLS + 1];
      if (footprint.some(c => buildingAt(c))) return;
    }

    const skipConfirm = selectedBuildingType.value === "road" || selectedBuildingType.value === "bridge";
    if (skipConfirm) {
      emit("place-building", { cellIndex, type: selectedBuildingType.value, cost: def.cost });
    } else {
      pendingPlacement.value = { cellIndex, type: selectedBuildingType.value, def };
    }
  }
}

function confirmPlacement() {
  const p = pendingPlacement.value;
  if (!p) return;
  emit("place-building", { cellIndex: p.cellIndex, type: p.type, cost: p.def.cost });
  pendingPlacement.value = null;
}

function cancelPlacement() {
  pendingPlacement.value = null;
}

function confirmDeconstruct() {
  const p = pendingDeconstruct.value;
  if (!p) return;
  emit("remove-building", { cellIndex: p.building.cellIndex, refund: p.def.cost });
  selectedBuilding.value = null;
  pendingDeconstruct.value = null;
}

function cancelDeconstruct() {
  pendingDeconstruct.value = null;
}

// ── Redraw when data or selection changes ──────────────────────────────────
watch(canvasRef, (el) => { if (el) preloadImages(); });

watch(
  [() => props.settlement.buildings, () => props.settlement.terrain, selectedBuildingType],
  () => imagesReady.value ? drawGrid() : preloadImages(),
  { deep: true }
);

onMounted(preloadImages);
</script>

<style scoped>
@import "./styles/settlementModalStyles.css";
</style>
