<template>
  <div class="fm-overlay">
    <div class="fm-panel">
      <button class="fm-close" @click="emit('close')">⎯ Leave Lake ⎯</button>
      <div class="fm-title">{{ lakeName }}</div>

      <!-- Lake scene — settlement map style -->
      <div class="fm-map-frame">
        <canvas ref="canvasRef" class="fm-canvas"></canvas>
        <!-- Bobber + line overlaid -->
        <div class="fm-line" :class="{ 'fm-line-visible': lineVisible }"></div>
        <div class="fm-bobber" :class="bobberClass"></div>
        <div v-if="rippleActive" class="fm-ripple"></div>
      </div>

      <div class="fm-message">{{ message }}</div>

      <!-- Cast phase -->
      <div v-if="phase === 'cast'" class="fm-actions">
        <button v-if="!castStarted && !missedBite" class="fm-btn" @click="startCast">
          Cast Line
        </button>
        <button
          v-if="castStarted"
          class="fm-btn"
          @click="onReelIn"
        >
          Reel
        </button>
        <button v-if="missedBite" class="fm-btn" @click="resetCast">
          Cast Again
        </button>
      </div>

      <!-- Reel phase -->
      <div v-if="phase === 'reel'" class="fm-reel-section">
        <div class="fm-reel-header">
          <span>{{ reelsComplete }} / {{ reelsNeeded }} reeled</span>
        </div>
        <div class="fm-timer-wrap">
          <div class="fm-timer-bar">
            <div class="fm-timer-fill fm-timer-fill-reel" :style="{ width: reelTimerPct + '%' }"></div>
          </div>
        </div>
        <div class="fm-track" ref="trackRef">
          <div class="fm-zone" :style="zoneStyle"></div>
          <div
            class="fm-handle"
            :style="handleStyle"
            @mousedown.prevent="startDrag"
            @touchstart.prevent="startDrag"
          ></div>
        </div>
        <div class="fm-hint">Drag handle into the zone, then release</div>
      </div>

      <!-- Result phase -->
      <div v-if="phase === 'result'" class="fm-result">
        <div class="fm-catch-icon">{{ catchIcon }}</div>
        <div class="fm-catch-msg">{{ catchMessage }}</div>
        <div class="fm-result-btns">
          <button class="fm-btn" @click="castAgain">Cast Again</button>
          <button class="fm-btn fm-btn-leave" @click="emit('close')">Leave Lake</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";

const props = defineProps({
  lakeName: { type: String, required: true },
  rodLevel: { type: Number, default: 1 },
});

const emit = defineEmits(["close", "catch"]);

// ─── Canvas lake ──────────────────────────────────────────────────────────────
const canvasRef = ref(null);

const GRID_COLS = 22;
const GRID_ROWS = 13;
const CELL_SIZE = 16;
const LAND_COLOR  = "#FAFCF7";
const WATER_COLOR = "#0F5E9C";

function generateLakeGrid() {
  const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));

  const cx = Math.floor(GRID_COLS / 2);
  const cy = Math.floor(GRID_ROWS / 2);

  // Seed center cluster
  for (const [dx, dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]) {
    const x = cx + dx, y = cy + dy;
    if (x >= 1 && x < GRID_COLS - 1 && y >= 1 && y < GRID_ROWS - 1) {
      grid[y][x] = 1;
    }
  }

  const TARGET = Math.floor(GRID_COLS * GRID_ROWS * 0.40);
  let iters = 0;

  while (iters < 60) {
    iters++;
    const next = grid.map(row => [...row]);
    for (let y = 1; y < GRID_ROWS - 1; y++) {
      for (let x = 1; x < GRID_COLS - 1; x++) {
        if (grid[y][x] === 0) {
          const adj = grid[y-1][x] + grid[y+1][x] + grid[y][x-1] + grid[y][x+1];
          if (adj > 0 && Math.random() < 0.38) {
            next[y][x] = 1;
          }
        }
      }
    }
    for (let y = 0; y < GRID_ROWS; y++) grid[y] = next[y];
    const count = grid.flat().reduce((a, b) => a + b, 0);
    if (count >= TARGET) break;
  }

  return grid;
}

function drawLake(canvas, grid) {
  const ctx = canvas.getContext("2d");
  const w = GRID_COLS * CELL_SIZE;
  const h = GRID_ROWS * CELL_SIZE;
  canvas.width = w;
  canvas.height = h;

  // Pass 1: base cells
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      ctx.fillStyle = grid[row][col] === 1 ? WATER_COLOR : LAND_COLOR;
      ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  // Pass 2: corner rounding (same as settlement)
  const crr = CELL_SIZE * 0.38;
  const isWater = (c, r) => c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS && grid[r][c] === 1;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (grid[row][col] !== 1) continue;
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;
      const CS = CELL_SIZE;

      if (!isWater(col-1, row) && !isWater(col, row-1)) {
        ctx.fillStyle = LAND_COLOR;
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.arc(x, y, crr, 0, Math.PI / 2); ctx.closePath(); ctx.fill();
      }
      if (!isWater(col+1, row) && !isWater(col, row-1)) {
        ctx.fillStyle = LAND_COLOR;
        ctx.beginPath(); ctx.moveTo(x + CS, y);
        ctx.arc(x + CS, y, crr, Math.PI / 2, Math.PI); ctx.closePath(); ctx.fill();
      }
      if (!isWater(col-1, row) && !isWater(col, row+1)) {
        ctx.fillStyle = LAND_COLOR;
        ctx.beginPath(); ctx.moveTo(x, y + CS);
        ctx.arc(x, y + CS, crr, -Math.PI / 2, 0); ctx.closePath(); ctx.fill();
      }
      if (!isWater(col+1, row) && !isWater(col, row+1)) {
        ctx.fillStyle = LAND_COLOR;
        ctx.beginPath(); ctx.moveTo(x + CS, y + CS);
        ctx.arc(x + CS, y + CS, crr, Math.PI, 3 * Math.PI / 2); ctx.closePath(); ctx.fill();
      }
    }
  }

  // Pass 3: subtle wave lines on water cells
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  for (let row = 1; row < GRID_ROWS - 1; row++) {
    for (let col = 1; col < GRID_COLS - 1; col++) {
      if (grid[row][col] === 1 && grid[row][col+1] === 1 && (row + col) % 3 === 0) {
        const wx = col * CELL_SIZE + 3;
        const wy = row * CELL_SIZE + CELL_SIZE * 0.55;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.lineTo(wx + CELL_SIZE - 5, wy);
        ctx.stroke();
      }
    }
  }
}

onMounted(() => {
  const grid = generateLakeGrid();
  nextTick(() => {
    if (canvasRef.value) drawLake(canvasRef.value, grid);
  });
  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
  document.addEventListener("touchmove", onDragMove, { passive: false });
  document.addEventListener("touchend", onDragEnd);
});

onBeforeUnmount(() => {
  clearAllTimers();
  cancelAnimationFrame(biteRaf);
  cancelAnimationFrame(reelRaf);
  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
  document.removeEventListener("touchmove", onDragMove);
  document.removeEventListener("touchend", onDragEnd);
});

// ─── Phase state ──────────────────────────────────────────────────────────────
const phase = ref("cast");
const message = ref("You arrive at the water's edge.");

// ─── Cast phase ───────────────────────────────────────────────────────────────
const castStarted = ref(false);
const bobberClass = ref("fm-bobber-idle");
const biteWindowOpen = ref(false); // true only during real bite window
const castPhase = ref("waiting");  // 'waiting' | 'faking' | 'biting'
const missedBite = ref(false);
const rippleActive = ref(false);
const lineVisible = ref(false);
// (no timer bar — bobber is the sole indicator)

let timers = [];
let biteRaf = 0;
let reelRaf = 0;

function clearAllTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function t(fn, ms) {
  const id = setTimeout(fn, ms);
  timers.push(id);
}

const ROD_BITE_MS = {
  1: { min: 15000, max: 60000 },
  2: { min: 15000, max: 45000 },
  3: { min: 10000, max: 30000 },
};

function startCast() {
  castStarted.value = true;
  lineVisible.value = true;
  bobberClass.value = "fm-bobber-idle";
  biteWindowOpen.value = false;
  castPhase.value = "waiting";
  missedBite.value = false;
  message.value = "";

  const range = ROD_BITE_MS[props.rodLevel] ?? ROD_BITE_MS[1];
  const totalDelay = range.min + Math.random() * (range.max - range.min);
  const fakeCount = 1 + Math.floor(Math.random() * 2);

  for (let i = 1; i <= fakeCount; i++) {
    const fakeAt = (totalDelay * i) / (fakeCount + 1);
    t(() => {
      if (castPhase.value === "waiting") {
        castPhase.value = "faking";
        bobberClass.value = "fm-bobber-dip";
        triggerRipple();
        t(() => {
          if (castPhase.value === "faking") {
            bobberClass.value = "fm-bobber-idle";
            castPhase.value = "waiting";
          }
        }, 700);
      }
    }, fakeAt);
  }

  t(doRealBite, totalDelay);
}

function triggerRipple() {
  rippleActive.value = false;
  setTimeout(() => { rippleActive.value = true; }, 20);
  t(() => { rippleActive.value = false; }, 900);
}

function doRealBite() {
  bobberClass.value = "fm-bobber-under";
  castPhase.value = "biting";
  triggerRipple();
  biteWindowOpen.value = true;
  message.value = "";

  const BITE_MS = 3500;
  const start = performance.now();
  function drain(now) {
    if (!biteWindowOpen.value) return;
    if (now - start >= BITE_MS) {
      onMissedBite();
    } else {
      biteRaf = requestAnimationFrame(drain);
    }
  }
  biteRaf = requestAnimationFrame(drain);
}

function onReelIn() {
  if (!castStarted.value) return;
  if (castPhase.value === "biting") {
    // Hit at the right moment — proceed
    biteWindowOpen.value = false;
    cancelAnimationFrame(biteRaf);
    clearAllTimers();
    determineCatch();
    startReelPhase();
  } else {
    // Pressed too early — spooked the fish
    cancelAnimationFrame(biteRaf);
    clearAllTimers();
    castStarted.value = false;
    lineVisible.value = false;
    bobberClass.value = "fm-bobber-idle";
    castPhase.value = "waiting";
    missedBite.value = true;
    message.value = "Too soon — you spooked it. Cast again.";
  }
}

function onMissedBite() {
  biteWindowOpen.value = false;
  castStarted.value = false;
  lineVisible.value = false;
  bobberClass.value = "fm-bobber-idle";
  castPhase.value = "waiting";
  missedBite.value = true;
  message.value = "It got away...";
}

function resetCast() {
  missedBite.value = false;
  message.value = "";
}

// ─── Catch determination ──────────────────────────────────────────────────────
const pendingCatch = ref(null);

const FISH_TABLE = [
  { name: "Salmon",            hp: 5,  reels: 2, rarity: "common" },
  { name: "Tuna",              hp: 7,  reels: 2, rarity: "common" },
  { name: "Bass",              hp: 10, reels: 2, rarity: "common" },
  { name: "Cod",               hp: 8,  reels: 2, rarity: "common" },
  { name: "Tilapia",           hp: 9,  reels: 2, rarity: "common" },
  { name: "Stargazer",         hp: 11, reels: 3, rarity: "uncommon" },
  { name: "Blobfish",          hp: 12, reels: 3, rarity: "uncommon" },
  { name: "Leafy Seadragon",   hp: 13, reels: 3, rarity: "uncommon" },
  { name: "Longtail Bass",     hp: 14, reels: 3, rarity: "uncommon" },
  { name: "Rotjaw",            hp: 15, reels: 3, rarity: "uncommon" },
  { name: "Horseshoe Crab",    hp: 21, reels: 4, rarity: "rare" },
  { name: "Lake Sturgeon",     hp: 22, reels: 4, rarity: "rare" },
  { name: "Stargazing Minnow", hp: 23, reels: 4, rarity: "rare" },
  { name: "Bluefin Killifish", hp: 24, reels: 4, rarity: "rare" },
  { name: "Mountain Madtom",   hp: 25, reels: 4, rarity: "rare" },
  { name: "Enlightenment Fish", hp: 0, reels: 5, rarity: "ultra", isEnlightenment: true },
];

const JUNK_NAMES = ["an old boot", "a glass eye", "a stick", "a broken sword", "some seaweed"];
const JUNK_ICONS  = { "an old boot": "🥾", "a glass eye": "👁️", "a stick": "🪵", "a broken sword": "⚔️", "some seaweed": "🌿" };
const RARITY_ICONS = { common: "🐟", uncommon: "🐠", rare: "🦈", ultra: "✨" };

const ROD_WEIGHTS = {
  1: { common: 0.60, uncommon: 0.15, rare: 0.05, ultra: 0.00, junk: 0.20 },
  2: { common: 0.55, uncommon: 0.15, rare: 0.09, ultra: 0.01, junk: 0.20 },
  3: { common: 0.40, uncommon: 0.30, rare: 0.15, ultra: 0.05, junk: 0.10 },
};

function determineCatch() {
  const w = ROD_WEIGHTS[props.rodLevel] ?? ROD_WEIGHTS[1];
  const roll = Math.random();
  let rarity;
  if (roll < w.junk)                              rarity = "junk";
  else if (roll < w.junk + w.ultra)               rarity = "ultra";
  else if (roll < w.junk + w.ultra + w.rare)      rarity = "rare";
  else if (roll < w.junk + w.ultra + w.rare + w.uncommon) rarity = "uncommon";
  else                                             rarity = "common";

  if (rarity === "junk") {
    const junk = JUNK_NAMES[Math.floor(Math.random() * JUNK_NAMES.length)];
    pendingCatch.value = { type: "junk", junkName: junk, reels: 2 };
    return;
  }
  const pool = FISH_TABLE.filter(f => f.rarity === rarity);
  const fish = pool[Math.floor(Math.random() * pool.length)];
  pendingCatch.value = { ...fish, type: "fish" };
}

// ─── Reel phase ───────────────────────────────────────────────────────────────
const trackRef = ref(null);
const reelsNeeded = ref(2);
const reelsComplete = ref(0);
const reelTimerPct = ref(100);
const handlePx = ref(0);
const zonePx = ref(50);
const ZONE_WIDTH_PX = 60;
const HANDLE_W = 28;
let trackWidth = 0;
let reelStart = 0;
const REEL_MS = 4000;

const zoneStyle = computed(() => ({
  left: zonePx.value + "px",
  width: ZONE_WIDTH_PX + "px",
}));

const handleStyle = computed(() => ({
  left: handlePx.value + "px",
}));

function startReelPhase() {
  reelsNeeded.value = pendingCatch.value?.reels ?? 2;
  reelsComplete.value = 0;
  phase.value = "reel";
  message.value = "";
  nextTick(() => {
    trackWidth = trackRef.value?.offsetWidth ?? 300;
    handlePx.value = 0;
    moveZone();
    startReelTimer();
  });
}

function moveZone() {
  const max = Math.max(10, trackWidth - ZONE_WIDTH_PX - 20);
  zonePx.value = 10 + Math.floor(Math.random() * max);
}

function startReelTimer() {
  reelTimerPct.value = 100;
  reelStart = performance.now();
  function drain(now) {
    const pct = Math.max(0, 100 - ((now - reelStart) / REEL_MS) * 100);
    reelTimerPct.value = pct;
    if (pct > 0 && phase.value === "reel") {
      reelRaf = requestAnimationFrame(drain);
    } else if (phase.value === "reel") {
      onReelTimeout();
    }
  }
  reelRaf = requestAnimationFrame(drain);
}

function onReelTimeout() {
  cancelAnimationFrame(reelRaf);
  phase.value = "cast";
  bobberClass.value = "fm-bobber-idle";
  lineVisible.value = false;
  castStarted.value = false;
  message.value = "The line went slack. It escaped.";
}

// ─── Drag ─────────────────────────────────────────────────────────────────────
let isDragging = false;

function startDrag(e) {
  isDragging = true;
  e.stopPropagation();
}

function onDragMove(e) {
  if (!isDragging || !trackRef.value) return;
  if (e.cancelable) e.preventDefault();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const rect = trackRef.value.getBoundingClientRect();
  const px = clientX - rect.left - HANDLE_W / 2;
  handlePx.value = Math.max(0, Math.min(trackWidth - HANDLE_W, px));
}

function onDragEnd() {
  if (!isDragging) return;
  isDragging = false;
  if (phase.value !== "reel") return;
  const center = handlePx.value + HANDLE_W / 2;
  if (center >= zonePx.value && center <= zonePx.value + ZONE_WIDTH_PX) {
    onZoneHit();
  }
}

function onZoneHit() {
  reelsComplete.value++;
  triggerRipple();
  if (reelsComplete.value >= reelsNeeded.value) {
    cancelAnimationFrame(reelRaf);
    showResult();
  } else {
    moveZone();
    reelStart = performance.now();
    message.value = "";
  }
}

// ─── Result ───────────────────────────────────────────────────────────────────
const catchIcon = ref("");
const catchMessage = ref("");

function showResult() {
  phase.value = "result";
  lineVisible.value = false;
  bobberClass.value = "fm-bobber-idle";
  const c = pendingCatch.value;
  if (!c || c.type === "junk") {
    const junk = c?.junkName ?? "an old boot";
    catchIcon.value = JUNK_ICONS[junk] ?? "🥾";
    catchMessage.value = `You pulled up ${junk}. The lake mocks you.`;
    emit("catch", { type: "junk", junkName: junk });
  } else if (c.isEnlightenment) {
    catchIcon.value = RARITY_ICONS.ultra;
    catchMessage.value = "The Fish of Eternal Enlightenment... A legendary catch.";
    emit("catch", { type: "fish", name: c.name, hp: c.hp, isEnlightenment: true });
  } else {
    catchIcon.value = RARITY_ICONS[c.rarity] ?? "🐟";
    catchMessage.value = `You caught a ${c.name}! Eat it to restore +${c.hp} HP.`;
    emit("catch", { type: "fish", name: c.name, hp: c.hp });
  }
}

function castAgain() {
  phase.value = "cast";
  castStarted.value = false;
  missedBite.value = false;
  lineVisible.value = false;
  bobberClass.value = "fm-bobber-idle";
  castPhase.value = "waiting";
  message.value = "Cast your line again.";
  pendingCatch.value = null;
}
</script>

<style scoped>
.fm-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 440px;
  background: rgba(6, 6, 10, 0.98);
  border-left: 1px solid rgba(60, 62, 75, 0.4);
  box-shadow: -10px 0 50px rgba(0, 0, 0, 0.75);
  display: flex;
  flex-direction: column;
  z-index: 1200;
  font-family: "IBM Plex Sans", sans-serif;
  animation: fmSlideIn 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes fmSlideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.fm-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
  overflow-y: auto;
  color: #c8c8d0;
}

.fm-close {
  background: none;
  border: none;
  color: #888;
  font-size: 0.78rem;
  cursor: pointer;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0;
  align-self: center;
}
.fm-close:hover { color: #ccc; }

.fm-title {
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  color: #d0d8e8;
  letter-spacing: 0.04em;
}

/* ─── Map frame (matches settlement aesthetic) ─── */
.fm-map-frame {
  position: relative;
  border: 2px solid #555;
  border-radius: 2px;
  overflow: hidden;
  background: #FAFCF7;
  line-height: 0;
}

.fm-canvas {
  display: block;
  width: 100%;
  height: auto;
  image-rendering: pixelated;
}

/* ─── Bobber + line positioned over canvas ─── */
.fm-line {
  position: absolute;
  left: calc(50% - 1px);
  top: 0;
  width: 2px;
  height: 50%;
  background: transparent;
  transition: background 0.3s;
  pointer-events: none;
  z-index: 2;
}
.fm-line-visible {
  background: rgba(100, 70, 30, 0.85);
}

.fm-bobber {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  background: linear-gradient(to bottom, #d93030 50%, #f0f0f0 50%);
  border: 2px solid #222;
  z-index: 3;
  pointer-events: none;
}

.fm-bobber-idle {
  animation: fmBobIdle 2.3s ease-in-out infinite;
}
.fm-bobber-dip {
  animation: fmBobDip 0.55s ease-out forwards;
}
.fm-bobber-under {
  animation: fmBobberGlow 0.85s ease-in-out infinite alternate;
}

@keyframes fmBobberGlow {
  from {
    transform: translateX(-50%) translateY(-30%);
    box-shadow: 0 0 4px 2px rgba(255, 230, 120, 0.5);
  }
  to {
    transform: translateX(-50%) translateY(-30%);
    box-shadow: 0 0 14px 6px rgba(255, 220, 80, 0.9);
  }
}

@keyframes fmBobIdle {
  0%, 100% { transform: translateX(-50%) translateY(-50%); }
  50% { transform: translateX(-50%) translateY(-60%); }
}
@keyframes fmBobDip {
  0% { transform: translateX(-50%) translateY(-50%); }
  45% { transform: translateX(-50%) translateY(-25%); }
  100% { transform: translateX(-50%) translateY(-50%); }
}

.fm-ripple {
  position: absolute;
  width: 24px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid rgba(80, 160, 220, 0.7);
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  animation: fmRipple 0.85s ease-out forwards;
  z-index: 2;
  pointer-events: none;
}

@keyframes fmRipple {
  0% { transform: translateX(-50%) translateY(-50%) scale(0.5); opacity: 0.9; }
  100% { transform: translateX(-50%) translateY(-50%) scale(3.5); opacity: 0; }
}

/* ─── Message ─── */
.fm-message {
  text-align: center;
  font-size: 0.84rem;
  color: #a0a0b0;
  min-height: 1.2em;
  font-style: italic;
}

/* ─── Actions ─── */
.fm-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.fm-btn {
  background: #252525;
  color: #e0e0e0;
  border: 1px solid #5a5a5a;
  border-radius: 3px;
  padding: 9px 24px;
  font-size: 0.85rem;
  font-family: inherit;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  width: 100%;
}
.fm-btn:hover { background: #3a3a3a; transform: translateY(-1px); }
.fm-btn:active { background: #1a1a1a; transform: translateY(1px); }

.fm-btn-urgent {
  background: #1a3a1a;
  border-color: #4a8a4a;
  color: #88e088;
  animation: fmPulse 0.6s ease-in-out infinite alternate;
}
.fm-btn-urgent:hover { background: #2a4a2a; }

@keyframes fmPulse {
  from { box-shadow: 0 0 4px rgba(80, 200, 80, 0.3); }
  to   { box-shadow: 0 0 12px rgba(80, 200, 80, 0.7); }
}

.fm-btn-leave {
  background: #1a1a24;
  border-color: #3a3a50;
  color: #8888aa;
}

/* ─── Timer bar ─── */
.fm-timer-wrap { width: 100%; }
.fm-timer-bar {
  width: 100%;
  height: 6px;
  background: #2a2a2a;
  border-radius: 3px;
  overflow: hidden;
}
.fm-timer-fill {
  height: 100%;
  background: linear-gradient(to right, #4a8a4a, #88e088);
  border-radius: 3px;
  transition: width 0.05s linear;
}
.fm-timer-fill-reel {
  background: linear-gradient(to right, #3a5a8a, #5a88cc);
}

/* ─── Reel phase ─── */
.fm-reel-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fm-reel-header {
  text-align: center;
  font-size: 0.82rem;
  color: #8888aa;
  font-weight: 600;
  letter-spacing: 0.05em;
}
.fm-track {
  position: relative;
  height: 22px;
  background: #1a1a24;
  border: 1px solid #3a3a50;
  border-radius: 11px;
  overflow: visible;
  user-select: none;
}
.fm-zone {
  position: absolute;
  top: 0;
  height: 100%;
  background: rgba(220, 75, 20, 0.35);
  border: 2px solid rgba(255, 95, 35, 0.85);
  border-radius: 11px;
  pointer-events: none;
}
.fm-handle {
  position: absolute;
  top: 2px;
  width: 28px;
  height: 18px;
  background: linear-gradient(to bottom, #8B6030, #5a3a18);
  border: 2px solid #3a2008;
  border-radius: 5px;
  cursor: grab;
  touch-action: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
}
.fm-handle:active { cursor: grabbing; }

.fm-hint {
  text-align: center;
  font-size: 0.75rem;
  color: #666;
  font-style: italic;
}

/* ─── Result ─── */
.fm-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}
.fm-catch-icon { font-size: 2.2rem; }
.fm-catch-msg {
  text-align: center;
  font-size: 0.88rem;
  color: #c8c8d0;
  line-height: 1.4;
}
.fm-result-btns {
  display: flex;
  gap: 8px;
  width: 100%;
}
.fm-result-btns .fm-btn { flex: 1; }
</style>
