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
          <span class="lord-since"> as {{ currentLord.playerName }}</span>
        </template>
        <template v-else>
          <span class="lord-label">👑 Lord</span>
          <span class="lord-name">{{ currentLord.playerName }}</span>
          <span class="lord-since"> · Day {{ currentLord.startDay }}</span>
        </template>
      </div>

        <div class="canvas-cell-label" v-if="hoveredLabel">{{ hoveredLabel }}</div>
        <div class="placement-error" v-if="placementError">{{ placementError }}</div>

      <!-- Read-only visitor badge -->
      <div v-if="props.readOnly" class="settlement-visitor-badge">👁 Visiting — Read Only</div>

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

      <!-- Building info panel (cursor mode) -->
      <div v-if="selectedBuilding" class="building-info-panel">
        <button class="building-info-close" @click="selectedBuilding = null">✕</button>
        <div class="building-info-header">
          <img :src="paletteUrls[selectedBuilding.building.type]" class="building-info-img" />
          <div>
            <div class="building-info-name">{{ selectedBuilding.building.name || selectedBuilding.def.name }}</div>
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
            >Select</button>
            <button class="build-popup-btn" @click="showPalette = !showPalette">
              Build {{ showPalette ? '▲' : '▼' }}
            </button>
            <template v-if="hasCastle">
              <button class="build-popup-btn" @click="$emit('open-forge')">Forge</button>
              <button class="build-popup-btn" :disabled="!props.canShortRest" :title="!props.canShortRest ? 'Already rested today' : ''" @click="$emit('short-rest')">Short Rest</button>
              <span v-if="!props.canShortRest" class="castle-rest-used">Already rested today</span>
            </template>
            <div v-if="showPalette" class="build-popup">
              <div class="build-popup-title">Buildings</div>
              <button
                v-for="(def, key) in BUILDING_DEFS"
                :key="key"
                class="palette-list-row"
                :class="{ selected: selectedBuildingType === key }"
                @click="toggleBuildingSelect(key)"
              >
                <span class="palette-list-name">{{ def.name }}</span>
                <span class="palette-list-desc"> - {{ def.description }}</span>
                <span class="palette-list-cost"> ({{ def.cost }}g)</span>
              </button>
              <div class="build-popup-title">Terrain</div>
              <button
                v-for="(def, key) in TERRAIN_PAINTS"
                :key="key"
                class="palette-list-row"
                :class="{ selected: selectedBuildingType === key }"
                @click="toggleBuildingSelect(key)"
              >
                <span class="palette-list-name">{{ def.name }}</span>
                <span class="palette-list-desc"> - {{ def.description }}</span>
                <span class="palette-list-cost"> (free)</span>
              </button>
              <div v-if="selectedBuildingType" class="palette-selected-info">
                <strong>{{ (BUILDING_DEFS[selectedBuildingType] ?? TERRAIN_PAINTS[selectedBuildingType])?.name }}</strong>
                — {{ (BUILDING_DEFS[selectedBuildingType] ?? TERRAIN_PAINTS[selectedBuildingType])?.description }}
                <button class="palette-cancel" @click="selectedBuildingType = null">Cancel</button>
              </div>
            </div>
          </div>
      </div>

      <!-- History book toggle -->
      <div class="settlement-history">
        <div v-if="props.readOnly && settlement.abandoned && guardianBossName" class="challenge-blurb">
          <span class="challenge-blurb-text">A <strong>{{ guardianBossName }}</strong> guards these ruins.</span>
          <button
            class="challenge-boss-btn"
            :disabled="!props.canChallenge"
            :title="props.playerHasSettlement ? 'You already are a lord of a settlement.' : (!props.canChallenge ? 'You cannot challenge right now.' : '')"
            @click="$emit('challenge-boss')"
          >⚔ Challenge</button>
          <span v-if="props.playerHasSettlement" class="challenge-owned-msg">You already are a lord of a settlement.</span>
        </div>
        <div class="settlement-history-bar">
          <button class="history-toggle-btn" @click="showHistory = !showHistory">
            📖 {{ showHistory ? 'Hide' : 'Show' }} History Book
          </button>
          <button class="settlement-close-btn" @click="$emit('close')">⎯ Leave Settlement ⎯</button>
        </div>
        <div v-if="showHistory" class="history-list">
          <div class="history-title">📖 Lords of {{ settlement.town_name }}</div>
          <template v-for="(entry, i) in settlement.lord_history" :key="i">
            <!-- Lord tenure entry -->
            <div v-if="!entry.type" class="history-entry">
              <span class="history-lord-name">{{ entry.playerName }}</span>
              <span class="history-days">
                Day {{ entry.startDay }}
                <template v-if="entry.endDay"> – Day {{ entry.endDay }}</template>
                <template v-else> – present</template>
              </span>
              <span v-if="entry.endReason" class="history-end-reason">{{ entry.endReason }}</span>
            </div>
            <!-- Event: abandoned -->
            <div v-else-if="entry.type === 'abandoned'" class="history-event history-event-abandoned">
              🏚 Settlement abandoned on Day {{ entry.day }}
            </div>
            <!-- Event: terrorized -->
            <div v-else-if="entry.type === 'terrorized'" class="history-event history-event-terrorized">
              ☠ Terrorized by a {{ SETTLEMENT_BOSS_DEFS[entry.bossKey]?.name ?? entry.bossKey }} since Day {{ entry.day }}
            </div>
            <!-- Event: claimed -->
            <div v-else-if="entry.type === 'claimed'" class="history-event history-event-claimed">
              ⚔ {{ entry.playerName }} defeated the guardian on Day {{ entry.day }}
            </div>
          </template>
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
        <div class="placement-name-row">
          <label class="placement-name-label">Name</label>
          <input
            class="placement-name-input"
            v-model="pendingPlacementName"
            :placeholder="pendingPlacement.def.name"
            maxlength="24"
            @keyup.enter="confirmPlacement"
          />
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
import { SETTLEMENT_BOSS_DEFS } from "@/utils/settlementBossGenerator.js";

const CELL_SIZE = 32;
const COLS = 20;
const ROWS = 16;


const paletteUrls = ref({});
let parchmentCanvas = null;

// ── Parchment texture (generated once, reused every draw) ─────────────────
function generateParchmentTexture(w, h) {
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const pctx = off.getContext("2d");

  // Base warm parchment
  pctx.fillStyle = "#e8d49a";
  pctx.fillRect(0, 0, w, h);

  // Fiber streaks — faint horizontal bands
  for (let fy = 0; fy < h; fy += 3) {
    const alpha = (Math.sin(fy * 0.7) * 0.012 + 0.012);
    pctx.fillStyle = `rgba(120,80,20,${alpha.toFixed(3)})`;
    pctx.fillRect(0, fy, w, 2);
  }

  // Noise grain via ImageData (seeded LCG for stability)
  const imageData = pctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  let seed = 0xdeadbeef;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };
  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * 28;
    data[i]     = Math.min(255, Math.max(0, data[i]     + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n * 0.75));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n * 0.3));
  }
  pctx.putImageData(imageData, 0, 0);

  // Vignette — darker aged edges
  const vg = pctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.78);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(90,50,10,0.45)");
  pctx.fillStyle = vg;
  pctx.fillRect(0, 0, w, h);

  return off;
}

// ── Canvas map-style drawing helpers ──────────────────────────────────────

const BUILDING_STYLES = {
  house:         { wall: "#e8dcc0", roof: "#2a3a6a", ink: "#1a2848" },
  tavern:        { wall: "#d4c0a0", roof: "#7a3010", ink: "#501808" },
  castle:        { wall: "#ccc4b0", roof: "#1a3a8a", ink: "#0a1a50" },
  church:        { wall: "#f0ece0", roof: "#c0b8a0", ink: "#404040" },
  smithy:        { wall: "#b0a890", roof: "#383838", ink: "#181818" },
  apothecary:    { wall: "#c8d8b8", roof: "#3a7838", ink: "#1a4018" },
  general_store: { wall: "#d8c8a0", roof: "#7a4828", ink: "#4a2810" },
  horse_stable:  { wall: "#c8b890", roof: "#7a5228", ink: "#3a2010" },
  well:          { wall: "#c8b890", roof: "#707060", ink: "#3a3028" },
};

function drawCanvasBuilding(ctx, bx, by, wPx, hPx, type) {
  const cfg = BUILDING_STYLES[type];
  if (!cfg) return;

  // ── Well ──────────────────────────────────────────────────────────────────
  if (type === "well") {
    const cx = bx + wPx / 2, cy = by + hPx / 2;
    const r = Math.min(wPx, hPx) * 0.28;
    ctx.fillStyle = "#b0a890";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = cfg.ink; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = "#302820";
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.52, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#6a4820"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - r, cy - r * 0.6); ctx.lineTo(cx + r, cy - r * 0.6); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.7, cy - r * 0.6); ctx.lineTo(cx - r * 0.7, cy + r * 0.3);
    ctx.moveTo(cx + r * 0.7, cy - r * 0.6); ctx.lineTo(cx + r * 0.7, cy + r * 0.3);
    ctx.stroke();
    return;
  }

  // ── Church (2×2) ──────────────────────────────────────────────────────────
  if (type === "church") {
    const lw = Math.max(0.8, Math.min(wPx, hPx) * 0.018);
    const pad = Math.max(1, Math.min(wPx, hPx) * 0.04);
    ctx.strokeStyle = cfg.ink; ctx.lineWidth = lw;
    // Nave — lower 55% height, full width
    const nX = bx + pad, nY = by + hPx * 0.43, nW = wPx - pad * 2, nH = hPx * 0.53;
    const nRoofH = nH * 0.28;
    ctx.fillStyle = cfg.roof;
    ctx.fillRect(nX, nY, nW, nRoofH);
    ctx.fillStyle = cfg.wall;
    ctx.fillRect(nX, nY + nRoofH, nW, nH - nRoofH);
    ctx.strokeRect(nX, nY, nW, nH);
    ctx.beginPath(); ctx.moveTo(nX, nY + nRoofH); ctx.lineTo(nX + nW, nY + nRoofH); ctx.stroke();
    // Steeple tower — upper 60%, centered, narrow
    const stW = wPx * 0.26, stH = hPx * 0.62;
    const stX = bx + wPx / 2 - stW / 2, stY = by + pad;
    const spireH = stH * 0.32;
    // Tower body
    ctx.fillStyle = cfg.wall;
    ctx.fillRect(stX, stY + spireH, stW, stH - spireH);
    // Spire (triangle)
    ctx.fillStyle = cfg.roof;
    ctx.beginPath();
    ctx.moveTo(stX + stW / 2, stY);
    ctx.lineTo(stX, stY + spireH);
    ctx.lineTo(stX + stW, stY + spireH);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeRect(stX, stY + spireH, stW, stH - spireH);
    // Arrow-slit window in tower body
    ctx.fillStyle = cfg.ink;
    ctx.fillRect(stX + stW * 0.36, stY + spireH + (stH - spireH) * 0.3, stW * 0.28, (stH - spireH) * 0.28);
    return;
  }

  // ── Castle (3×3) ──────────────────────────────────────────────────────────
  if (type === "castle") {
    const lw = Math.max(0.8, Math.min(wPx, hPx) * 0.012);
    const pad = Math.max(2, Math.min(wPx, hPx) * 0.03);
    ctx.strokeStyle = cfg.ink; ctx.lineWidth = lw;
    // Curtain walls (outer shell)
    ctx.fillStyle = cfg.wall;
    ctx.fillRect(bx + pad, by + pad, wPx - pad * 2, hPx - pad * 2);
    ctx.strokeRect(bx + pad, by + pad, wPx - pad * 2, hPx - pad * 2);
    // Corner towers
    const tw = Math.max(4, wPx * 0.16);
    for (const [tx, ty] of [
      [bx + pad, by + pad],
      [bx + wPx - pad - tw, by + pad],
      [bx + pad, by + hPx - pad - tw],
      [bx + wPx - pad - tw, by + hPx - pad - tw],
    ]) {
      ctx.fillStyle = cfg.roof;
      ctx.fillRect(tx, ty, tw, tw);
      ctx.strokeRect(tx, ty, tw, tw);
      // Crenels
      const cw = tw * 0.25;
      ctx.fillStyle = cfg.wall;
      for (let c = 0; c < 3; c += 2) ctx.fillRect(tx + cw * c, ty, cw, lw * 4);
    }
    // Central keep
    const kPad = wPx * 0.22;
    const kX = bx + kPad, kY = by + kPad, kW = wPx - kPad * 2, kH = hPx - kPad * 2;
    const kRoofH = kH * 0.42;
    ctx.fillStyle = cfg.roof;
    ctx.fillRect(kX, kY, kW, kRoofH);
    ctx.fillStyle = cfg.wall;
    ctx.fillRect(kX, kY + kRoofH, kW, kH - kRoofH);
    ctx.strokeRect(kX, kY, kW, kH);
    ctx.beginPath(); ctx.moveTo(kX, kY + kRoofH); ctx.lineTo(kX + kW, kY + kRoofH); ctx.stroke();
    // Gatehouse arch at bottom centre
    const gW = tw * 1.1, gX = bx + wPx / 2 - tw * 0.55, gY = by + hPx - pad - tw * 0.5;
    ctx.fillStyle = cfg.ink;
    ctx.fillRect(gX, gY, gW, tw * 0.5 + pad);
    ctx.fillStyle = cfg.wall;
    ctx.fillRect(gX + gW * 0.2, gY, gW * 0.6, tw * 0.38);
    ctx.beginPath();
    ctx.arc(gX + gW / 2, gY, gW * 0.3, Math.PI, 0);
    ctx.fill();
    return;
  }

  // ── Horse Stable (2×2, L-shape) ───────────────────────────────────────────
  if (type === "horse_stable") {
    const lw = Math.max(0.8, Math.min(wPx, hPx) * 0.018);
    const pad = Math.max(1, Math.min(wPx, hPx) * 0.04);
    ctx.strokeStyle = cfg.ink; ctx.lineWidth = lw;
    // Main body — top 52% height, full width
    const mainX = bx + pad, mainY = by + pad, mainW = wPx - pad * 2, mainH = hPx * 0.52;
    const roofH = mainH * 0.42;
    ctx.fillStyle = cfg.roof;
    ctx.fillRect(mainX, mainY, mainW, roofH);
    ctx.fillStyle = cfg.wall;
    ctx.fillRect(mainX, mainY + roofH, mainW, mainH - roofH);
    ctx.strokeRect(mainX, mainY, mainW, mainH);
    ctx.beginPath(); ctx.moveTo(mainX, mainY + roofH); ctx.lineTo(mainX + mainW, mainY + roofH); ctx.stroke();
    // Stall dividers
    for (let s = 1; s < 3; s++) {
      const sx = mainX + (mainW / 3) * s;
      ctx.beginPath(); ctx.moveTo(sx, mainY + roofH); ctx.lineTo(sx, mainY + mainH); ctx.stroke();
    }
    // L-wing — left 44% width, lower 44% height
    const wingX = bx + pad, wingY = by + hPx * 0.52, wingW = wPx * 0.44, wingH = hPx * 0.44;
    const wingRoofH = wingH * 0.38;
    ctx.fillStyle = cfg.roof;
    ctx.fillRect(wingX, wingY, wingW, wingRoofH);
    ctx.fillStyle = cfg.wall;
    ctx.fillRect(wingX, wingY + wingRoofH, wingW, wingH - wingRoofH);
    ctx.strokeRect(wingX, wingY, wingW, wingH);
    ctx.beginPath(); ctx.moveTo(wingX, wingY + wingRoofH); ctx.lineTo(wingX + wingW, wingY + wingRoofH); ctx.stroke();
    // Dashed paddock fence on the open right side
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(bx + wPx * 0.44 + pad, by + hPx * 0.52);
    ctx.lineTo(bx + wPx - pad, by + hPx * 0.52);
    ctx.lineTo(bx + wPx - pad, by + hPx - pad);
    ctx.lineTo(bx + wPx * 0.44 + pad, by + hPx - pad);
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }

  // ── Tavern (2×3, back porch at top + main building below) ────────────────
  if (type === "tavern") {
    const lw = Math.max(0.8, Math.min(wPx, hPx) * 0.014);
    const pad = Math.max(1, Math.min(wPx, hPx) * 0.03);
    ctx.strokeStyle = cfg.ink; ctx.lineWidth = lw;
    // Back porch — top 28% of height, full width, lean-to
    const pX = bx + pad, pY = by + pad;
    const pW = wPx - pad * 2, pH = hPx * 0.28;
    const pRoofH = pH * 0.30;
    ctx.fillStyle = "#c0a878";
    ctx.fillRect(pX, pY, pW, pRoofH);
    ctx.fillStyle = "rgba(220,195,155,0.55)";
    ctx.fillRect(pX, pY + pRoofH, pW, pH - pRoofH);
    ctx.strokeStyle = cfg.ink; ctx.lineWidth = lw * 0.8;
    ctx.strokeRect(pX, pY, pW, pH);
    ctx.beginPath(); ctx.moveTo(pX, pY + pRoofH); ctx.lineTo(pX + pW, pY + pRoofH); ctx.stroke();
    // Porch posts
    ctx.lineWidth = lw * 1.2;
    ctx.beginPath();
    ctx.moveTo(pX, pY + pRoofH); ctx.lineTo(pX, pY + pH);
    ctx.moveTo(pX + pW, pY + pRoofH); ctx.lineTo(pX + pW, pY + pH);
    ctx.stroke();
    // Main building — lower 68% of height, full width
    const mX = bx + pad, mY = by + hPx * 0.30, mW = wPx - pad * 2, mH = hPx * 0.68 - pad;
    const roofH = mH * 0.38;
    ctx.strokeStyle = cfg.ink; ctx.lineWidth = lw;
    ctx.fillStyle = cfg.roof;
    ctx.fillRect(mX, mY, mW, roofH);
    ctx.fillStyle = cfg.wall;
    ctx.fillRect(mX, mY + roofH, mW, mH - roofH);
    ctx.strokeRect(mX, mY, mW, mH);
    ctx.beginPath(); ctx.moveTo(mX, mY + roofH); ctx.lineTo(mX + mW, mY + roofH); ctx.stroke();
    return;
  }

  // ── Generic building ──────────────────────────────────────────────────────
  const pad = Math.max(1, Math.min(wPx, hPx) * 0.06);
  const ix = bx + pad, iy = by + pad, iw = wPx - pad * 2, ih = hPx - pad * 2;
  const roofH = ih * 0.55;
  const lw = Math.max(0.8, Math.min(wPx, hPx) * 0.025);

  ctx.fillStyle = cfg.wall;
  ctx.fillRect(ix, iy + roofH, iw, ih - roofH);
  ctx.fillStyle = cfg.roof;
  ctx.fillRect(ix, iy, iw, roofH);
  ctx.strokeStyle = cfg.ink; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(ix, iy + roofH); ctx.lineTo(ix + iw, iy + roofH); ctx.stroke();
  ctx.strokeRect(ix, iy, iw, ih);
}

function drawCanvasTree(ctx, x, y, _type, cellSize) {
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;
  const r  = cellSize * 0.40;
  const bumps = 9;

  // Seeded rand so the shape is stable per cell position
  let seed = (x * 73856093) ^ (y * 19349663);
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff; };

  // Build lumpy canopy: vary radius at each point, connect with quadratic curves
  const pts = Array.from({ length: bumps }, (_, i) => {
    const angle = (i / bumps) * Math.PI * 2 - Math.PI / 2;
    const wobble = r * (0.72 + rand() * 0.40); // radius between 72%–112% of r
    return { x: cx + Math.cos(angle) * wobble, y: cy + Math.sin(angle) * wobble };
  });

  ctx.fillStyle = "#4a7840";
  ctx.beginPath();
  ctx.moveTo((pts[0].x + pts[bumps - 1].x) / 2, (pts[0].y + pts[bumps - 1].y) / 2);
  for (let i = 0; i < bumps; i++) {
    const curr = pts[i];
    const next = pts[(i + 1) % bumps];
    ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) / 2, (curr.y + next.y) / 2);
  }
  ctx.closePath();
  ctx.fill();

  // Darker ink outline
  ctx.strokeStyle = "#2a4828"; ctx.lineWidth = 1.5; ctx.stroke();

  // Small shadow ellipse under canopy for depth
  ctx.fillStyle = "rgba(30,50,20,0.18)";
  ctx.beginPath(); ctx.ellipse(cx + r * 0.2, cy + r * 0.55, r * 0.55, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
}

function generatePaletteThumbnails() {
  const off = document.createElement("canvas");
  off.width = 48; off.height = 48;
  const pctx = off.getContext("2d");
  const urls = {};

  for (const key of Object.keys(BUILDING_STYLES)) {
    pctx.clearRect(0, 0, 48, 48);
    pctx.fillStyle = "#FCF5E5";
    pctx.fillRect(0, 0, 48, 48);
    drawCanvasBuilding(pctx, 0, 0, 48, 48, key);
    urls[key] = off.toDataURL();
  }

  // Road
  pctx.clearRect(0, 0, 48, 48);
  pctx.fillStyle = "#050505"; pctx.fillRect(0, 0, 48, 48);
  pctx.strokeStyle = "#050505"; pctx.lineWidth = 1;
  pctx.strokeRect(1, 1, 46, 46);
  urls["road"] = off.toDataURL();

  // Fence
  pctx.clearRect(0, 0, 48, 48);
  pctx.fillStyle = "#b8c880"; pctx.fillRect(0, 0, 48, 48);
  pctx.strokeStyle = "#7a5020"; pctx.lineWidth = 2;
  pctx.beginPath(); pctx.moveTo(0, 24); pctx.lineTo(48, 24); pctx.stroke();
  pctx.fillStyle = "#7a5020";
  pctx.fillRect(10, 10, 6, 28); pctx.fillRect(32, 10, 6, 28);
  urls["fence"] = off.toDataURL();

  // Bridge
  pctx.clearRect(0, 0, 48, 48);
  pctx.fillStyle = "#a8c8e8"; pctx.fillRect(0, 0, 48, 48);
  pctx.fillStyle = "#c0a870"; pctx.fillRect(4, 8, 40, 32);
  pctx.strokeStyle = "#7a5828"; pctx.lineWidth = 1;
  for (let px = 8; px < 44; px += 8) {
    pctx.beginPath(); pctx.moveTo(px, 8); pctx.lineTo(px, 40); pctx.stroke();
  }
  pctx.strokeRect(4, 8, 40, 32);
  urls["bridge"] = off.toDataURL();

  paletteUrls.value = urls;
}

function preloadImages() {
  generatePaletteThumbnails();
  // Parchment texture sized to the canvas (generated once)
  const canvas = canvasRef.value;
  if (canvas) parchmentCanvas = generateParchmentTexture(canvas.width, canvas.height);
  drawGrid();
}

const props = defineProps({
  settlement:   { type: Object, required: true },
  playerGold:   { type: Number, default: 0 },
  isOwner:      { type: Boolean, default: true },
  readOnly:     { type: Boolean, default: false },
  canShortRest: { type: Boolean, default: true },
  canChallenge:        { type: Boolean, default: false },
  playerHasSettlement: { type: Boolean, default: false },
  clicksSince:  { type: Number, default: 0 },
});

const emit = defineEmits(["close", "collect", "place-building", "remove-building", "change-terrain", "open-forge", "short-rest", "challenge-boss"]);

const showHistory          = ref(false);
const showPalette          = ref(false);
const selectedBuildingType = ref(null);
const canvasRef      = ref(null);
const hoveredCell    = ref(null);
const placementError     = ref(null);
const pendingPlacement     = ref(null); // { cellIndex, type, def }
const pendingPlacementName = ref("");
const pendingDeconstruct   = ref(null); // { building, def }
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
const lordEntries = computed(() =>
  (props.settlement.lord_history ?? []).filter(e => !e.type)
);

const currentLord = computed(() => {
  const entries = lordEntries.value;
  return entries.find(e => !e.endDay) ?? entries[entries.length - 1] ?? null;
});

const guardianBossName = computed(() => {
  const key = props.settlement.guardian_boss;
  return key ? (SETTLEMENT_BOSS_DEFS[key]?.name ?? key) : null;
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
  if (hoveredCell.value === null) return 'None';
  const i = hoveredCell.value;
  const building = buildingAt(i);
  if (building) return BUILDING_DEFS[building.type]?.name ?? building.type;
  const tile = props.settlement.terrain[i] ?? "grass";
  return tile.charAt(0).toUpperCase() + tile.slice(1);
});

// ── Building size registry ──────────────────────────────────────────────────
const BUILDING_SIZES = {
  church:       { w: 2, h: 2 },
  castle:       { w: 3, h: 3 },
  tavern:       { w: 2, h: 3 },
  horse_stable: { w: 2, h: 2 },
};

function buildingSize(type) { return BUILDING_SIZES[type] ?? { w: 1, h: 1 }; }
function isLarge(type) { const { w, h } = buildingSize(type); return w > 1 || h > 1; }

// ── Grid helpers ───────────────────────────────────────────────────────────
function buildingAt(cellIndex) {
  const col = cellIndex % COLS;
  const row = Math.floor(cellIndex / COLS);
  return (props.settlement.buildings ?? []).find(b => {
    const { w, h } = buildingSize(b.type);
    if (w === 1 && h === 1) return b.cellIndex === cellIndex;
    const bc = b.cellIndex % COLS;
    const br = Math.floor(b.cellIndex / COLS);
    return col >= bc && col < bc + w && row >= br && row < br + h;
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

  const TALL_TREES = new Set(["tree"]);

  // Parchment base
  if (parchmentCanvas) {
    ctx.drawImage(parchmentCanvas, 0, 0);
  } else {
    ctx.fillStyle = "#e8d49a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Pass 1a: hand-drawn terrain tiles
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x   = col * CELL_SIZE;
    const y   = row * CELL_SIZE;
    const cx  = x + CELL_SIZE / 2;
    const cy  = y + CELL_SIZE / 2;
    const tile = terrain[i] ?? "grass";

    if (tile === "river") {
      ctx.fillStyle = "#a8c8e8";
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = "rgba(60,120,200,0.30)";
      ctx.lineWidth = 0.7;
      // Seeded wave offset so adjacent tiles align naturally
      let wseed = (x * 73856093) ^ (y * 19349663);
      const wrand = () => { wseed = (wseed * 1664525 + 1013904223) >>> 0; return wseed / 0xffffffff; };
      const phaseOffset = wrand() * Math.PI * 2;
      for (let hy = y + 4; hy < y + CELL_SIZE - 1; hy += 5) {
        const amp = 1.2;
        const freq = (2 * Math.PI) / CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, hy + Math.sin(phaseOffset) * amp);
        // Two quadratic curves across the tile width for an S-wave
        ctx.quadraticCurveTo(
          x + CELL_SIZE * 0.25, hy - amp,
          x + CELL_SIZE * 0.5,  hy + Math.sin(phaseOffset + Math.PI) * amp
        );
        ctx.quadraticCurveTo(
          x + CELL_SIZE * 0.75, hy + amp,
          x + CELL_SIZE,        hy + Math.sin(phaseOffset + freq * CELL_SIZE) * amp
        );
        ctx.stroke();
      }
    } else if (tile === "rock") {
      ctx.fillStyle = "#b8c880";
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      // Cluster of 5 rocks with seeded positions
      let rseed = (x * 73856093) ^ (y * 19349663);
      const rrand = () => { rseed = (rseed * 1664525 + 1013904223) >>> 0; return rseed / 0xffffffff; };
      const rockDefs = [
        { ox: -0.28, oy: -0.10, rx: 0.20, ry: 0.13, angle: -0.3 },
        { ox:  0.18, oy: -0.18, rx: 0.16, ry: 0.11, angle:  0.4 },
        { ox: -0.08, oy:  0.18, rx: 0.18, ry: 0.12, angle:  0.1 },
        { ox:  0.22, oy:  0.14, rx: 0.13, ry: 0.09, angle: -0.2 },
        { ox: -0.22, oy:  0.22, rx: 0.11, ry: 0.08, angle:  0.5 },
      ];
      for (const rd of rockDefs) {
        const shade = 0.82 + rrand() * 0.18;
        const r = Math.round(160 * shade), g = Math.round(152 * shade), b = Math.round(128 * shade);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.ellipse(
          cx + rd.ox * CELL_SIZE, cy + rd.oy * CELL_SIZE,
          rd.rx * CELL_SIZE, rd.ry * CELL_SIZE,
          rd.angle, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.strokeStyle = "#6a6050"; ctx.lineWidth = 0.5; ctx.stroke();
        // Highlight glint
        ctx.fillStyle = "rgba(255,255,240,0.25)";
        ctx.beginPath();
        ctx.ellipse(
          cx + rd.ox * CELL_SIZE - rd.rx * CELL_SIZE * 0.3,
          cy + rd.oy * CELL_SIZE - rd.ry * CELL_SIZE * 0.3,
          rd.rx * CELL_SIZE * 0.35, rd.ry * CELL_SIZE * 0.25,
          rd.angle, 0, Math.PI * 2
        );
        ctx.fill();
      }
    } else if (tile === "wheatfield") {
      ctx.fillStyle = "#e8d478";
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = "#a87e30"; ctx.lineWidth = 0.8;
      for (let wx = x + 3; wx < x + CELL_SIZE - 1; wx += 4) {
        ctx.beginPath(); ctx.moveTo(wx, y + CELL_SIZE * 0.75); ctx.lineTo(wx, y + CELL_SIZE * 0.25); ctx.stroke();
      }
    } else if (tile === "white_flower" || tile === "yellow_white_flower" || tile === "pink_flower") {
      ctx.fillStyle = "#b8c880";
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      const petalColor = tile === "pink_flower" ? "#e890b8" : tile === "yellow_white_flower" ? "#e8c840" : "#f0ece0";
      const centerColor = tile === "pink_flower" ? "#f8e040" : tile === "yellow_white_flower" ? "#f8f0a0" : "#f8e040";
      // Seeded placement for 3 flowers per cell
      let fseed = (x * 73856093) ^ (y * 19349663);
      const frand = () => { fseed = (fseed * 1664525 + 1013904223) >>> 0; return fseed / 0xffffffff; };
      const flowerPositions = [
        { dx: 0.28 + frand() * 0.08, dy: 0.28 + frand() * 0.08 },
        { dx: 0.58 + frand() * 0.10, dy: 0.22 + frand() * 0.10 },
        { dx: 0.38 + frand() * 0.08, dy: 0.60 + frand() * 0.08 },
      ];
      for (const pos of flowerPositions) {
        const fcx = x + pos.dx * CELL_SIZE;
        const fcy = y + pos.dy * CELL_SIZE;
        const petalSize = CELL_SIZE * 0.10;
        const petalDist = CELL_SIZE * 0.09;
        const rotation = frand() * Math.PI * 2;
        // 5 petals
        ctx.fillStyle = petalColor;
        for (let p = 0; p < 5; p++) {
          const angle = rotation + (p / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(
            fcx + Math.cos(angle) * petalDist,
            fcy + Math.sin(angle) * petalDist,
            petalSize, petalSize * 0.6, angle, 0, Math.PI * 2
          );
          ctx.fill();
        }
        ctx.strokeStyle = "rgba(80,40,20,0.3)"; ctx.lineWidth = 0.3; ctx.stroke();
        // Center
        ctx.fillStyle = centerColor;
        ctx.beginPath(); ctx.arc(fcx, fcy, petalSize * 0.55, 0, Math.PI * 2); ctx.fill();
      }
    } else if (tile === "hill") {
      ctx.fillStyle = "#b8c880"; ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = "#7a6840"; ctx.lineWidth = 0.7;
      for (let h = 0; h < 3; h++) {
        const ow = CELL_SIZE * (0.42 - h * 0.08);
        const oy = cy + (h - 1) * 4;
        ctx.beginPath(); ctx.ellipse(cx, oy + 3, ow, CELL_SIZE * 0.16, 0, Math.PI, 0, true); ctx.stroke();
      }

    } else if (tile === "mountain") {
      ctx.fillStyle = "#b8c880"; ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      // Two staggered peaks
      const peaks = [{ px: cx - CELL_SIZE * 0.18, h: CELL_SIZE * 0.78 }, { px: cx + CELL_SIZE * 0.2, h: CELL_SIZE * 0.62 }];
      for (const pk of peaks) {
        ctx.fillStyle = "#9a9080";
        ctx.beginPath();
        ctx.moveTo(pk.px, y + CELL_SIZE - pk.h);
        ctx.lineTo(pk.px - CELL_SIZE * 0.22, y + CELL_SIZE - 2);
        ctx.lineTo(pk.px + CELL_SIZE * 0.22, y + CELL_SIZE - 2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#5a5040"; ctx.lineWidth = 0.6; ctx.stroke();
        // Snow cap
        ctx.fillStyle = "#f0ece0";
        ctx.beginPath();
        ctx.moveTo(pk.px, y + CELL_SIZE - pk.h);
        ctx.lineTo(pk.px - CELL_SIZE * 0.08, y + CELL_SIZE - pk.h + CELL_SIZE * 0.2);
        ctx.lineTo(pk.px + CELL_SIZE * 0.08, y + CELL_SIZE - pk.h + CELL_SIZE * 0.2);
        ctx.closePath(); ctx.fill();
      }

    } else if (tile === "farm") {
      ctx.fillStyle = "#d8c860"; ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = "#8a6820"; ctx.lineWidth = 0.5;
      // Crop rows
      for (let fy = y + 4; fy < y + CELL_SIZE - 2; fy += 5) {
        ctx.beginPath(); ctx.moveTo(x + 3, fy); ctx.lineTo(x + CELL_SIZE - 3, fy); ctx.stroke();
      }
      // Center divider
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(cx, y + 2); ctx.lineTo(cx, y + CELL_SIZE - 2); ctx.stroke();
      ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    } else if (tile === "cobblestone") {
      ctx.fillStyle = "#b8b0a0"; ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      let cseed = (x * 73856093) ^ (y * 19349663);
      const crand = () => { cseed = (cseed * 1664525 + 1013904223) >>> 0; return cseed / 0xffffffff; };
      const cobbles = [
        [0.18, 0.18, 0.26, 0.20], [0.52, 0.12, 0.30, 0.20], [0.86, 0.20, 0.22, 0.22],
        [0.12, 0.48, 0.28, 0.20], [0.46, 0.44, 0.26, 0.22], [0.80, 0.50, 0.24, 0.20],
        [0.22, 0.74, 0.32, 0.20], [0.62, 0.72, 0.28, 0.20],
      ];
      for (const [ox, oy2, ow, oh] of cobbles) {
        const shade = 0.84 + crand() * 0.16;
        ctx.fillStyle = `rgb(${Math.round(185*shade)},${Math.round(175*shade)},${Math.round(158*shade)})`;
        ctx.beginPath();
        ctx.ellipse(x + ox * CELL_SIZE, y + oy2 * CELL_SIZE, ow * CELL_SIZE / 2, oh * CELL_SIZE / 2, crand() * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#8a8070"; ctx.lineWidth = 0.5; ctx.stroke();
      }

    } else if (tile === "cemetery") {
      ctx.fillStyle = "#b0b898"; ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = "#484840"; ctx.lineWidth = 0.9;
      const crosses = [[0.22, 0.28], [0.65, 0.22], [0.38, 0.62], [0.72, 0.65]];
      for (const [dcx, dcy] of crosses) {
        const pcx = x + dcx * CELL_SIZE, pcy = y + dcy * CELL_SIZE;
        const ch = CELL_SIZE * 0.14, cw = CELL_SIZE * 0.07;
        ctx.beginPath();
        ctx.moveTo(pcx, pcy - ch); ctx.lineTo(pcx, pcy + ch);
        ctx.moveTo(pcx - cw * 1.4, pcy - ch * 0.3); ctx.lineTo(pcx + cw * 1.4, pcy - ch * 0.3);
        ctx.stroke();
      }

    } else if (tile === "dock") {
      ctx.fillStyle = "#a8c8e8"; ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      const dw = CELL_SIZE * 0.38;
      ctx.fillStyle = "#c0a060";
      ctx.fillRect(cx - dw / 2, y, dw, CELL_SIZE);
      ctx.strokeStyle = "#7a5020"; ctx.lineWidth = 0.5;
      for (let ply = y + 4; ply < y + CELL_SIZE; ply += 5) {
        ctx.beginPath(); ctx.moveTo(cx - dw / 2, ply); ctx.lineTo(cx + dw / 2, ply); ctx.stroke();
      }
      ctx.lineWidth = 0.8; ctx.strokeRect(cx - dw / 2, y, dw, CELL_SIZE);
      // Support piles
      ctx.strokeStyle = "#5a3810"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - dw / 2, y + CELL_SIZE * 0.4); ctx.lineTo(cx - dw / 2 - 3, y + CELL_SIZE);
      ctx.moveTo(cx + dw / 2, y + CELL_SIZE * 0.4); ctx.lineTo(cx + dw / 2 + 3, y + CELL_SIZE);
      ctx.stroke();

    } else {
      // grass (and tree cells — ground layer only, tree sprite drawn later)
      ctx.fillStyle = "#b8c880";
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }

  // Pass 1b: round the land/water boundary corners
  // For each river tile, if two orthogonal land neighbors share a corner, draw a
  // pie-slice arc of the land color into that corner, creating a curved shoreline.
  {
    const crr = CELL_SIZE * 0.38; // corner rounding radius
    const getTile = (c, r) => (c < 0 || c >= COLS || r < 0 || r >= ROWS) ? "grass" : (terrain[r * COLS + c] ?? "grass");
    const shoreColor = (t) => {
      if (t === "farm")        return "#d8c860";
      if (t === "cobblestone") return "#b8b0a0";
      if (t === "cemetery")    return "#b0b898";
      if (t === "wheatfield")  return "#e8d478";
      if (t === "river" || t === "dock") return "#a8c8e8";
      return "#b8c880"; // grass / rock / hill / mountain / flowers — all green-ish
    };
    for (let i = 0; i < COLS * ROWS; i++) {
      const tile = terrain[i] ?? "grass";
      if (tile !== "river") continue;
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x   = col * CELL_SIZE;
      const y   = row * CELL_SIZE;
      const CS  = CELL_SIZE;
      const L = getTile(col - 1, row), R = getTile(col + 1, row);
      const T = getTile(col, row - 1), B = getTile(col, row + 1);
      // Top-left corner: land above AND land to the left
      if (L !== "river" && T !== "river") {
        ctx.fillStyle = shoreColor(L);
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.arc(x, y, crr, 0, Math.PI / 2); ctx.closePath(); ctx.fill();
      }
      // Top-right corner
      if (R !== "river" && T !== "river") {
        ctx.fillStyle = shoreColor(R);
        ctx.beginPath(); ctx.moveTo(x + CS, y);
        ctx.arc(x + CS, y, crr, Math.PI / 2, Math.PI); ctx.closePath(); ctx.fill();
      }
      // Bottom-left corner
      if (L !== "river" && B !== "river") {
        ctx.fillStyle = shoreColor(L);
        ctx.beginPath(); ctx.moveTo(x, y + CS);
        ctx.arc(x, y + CS, crr, -Math.PI / 2, 0); ctx.closePath(); ctx.fill();
      }
      // Bottom-right corner
      if (R !== "river" && B !== "river") {
        ctx.fillStyle = shoreColor(R);
        ctx.beginPath(); ctx.moveTo(x + CS, y + CS);
        ctx.arc(x + CS, y + CS, crr, Math.PI, 3 * Math.PI / 2); ctx.closePath(); ctx.fill();
      }
    }
  }

  // Faint grid lines for usability
  ctx.strokeStyle = "rgba(100,80,40,0.12)";
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL_SIZE, 0); ctx.lineTo(c * CELL_SIZE, canvas.height); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL_SIZE); ctx.lineTo(canvas.width, r * CELL_SIZE); ctx.stroke();
  }

  // Pass 2: trees first so buildings paint over them
  for (let i = 0; i < COLS * ROWS; i++) {
    const tile = terrain[i] ?? "grass";
    if (!TALL_TREES.has(tile)) continue;
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    drawCanvasTree(ctx, col * CELL_SIZE, row * CELL_SIZE, tile, CELL_SIZE);
  }

  // Pass 2b: buildings (each drawn once at its anchor)
  const drawn = new Set();
  for (const building of (props.settlement.buildings ?? [])) {
    if (drawn.has(building.cellIndex)) continue;
    drawn.add(building.cellIndex);

    const bc  = building.cellIndex % COLS;
    const br  = Math.floor(building.cellIndex / COLS);
    const bx  = bc * CELL_SIZE;
    const by  = br * CELL_SIZE;
    const { w: bw, h: bh } = buildingSize(building.type);
    const wPx = bw * CELL_SIZE;
    const hPx = bh * CELL_SIZE;

    if (building.type === "road") {
      const roadCells = new Set((props.settlement.buildings ?? []).filter(b => b.type === "road").map(b => b.cellIndex));
      const col = building.cellIndex % COLS;
      const hasN = roadCells.has(building.cellIndex - COLS);
      const hasS = roadCells.has(building.cellIndex + COLS);
      const hasE = col < COLS - 1 && roadCells.has(building.cellIndex + 1);
      const hasW = col > 0 && roadCells.has(building.cellIndex - 1);
      const mcx = bx + CELL_SIZE / 2, mcy = by + CELL_SIZE / 2;
      const eN = { x: mcx, y: by },
            eS = { x: mcx, y: by + CELL_SIZE },
            eE = { x: bx + CELL_SIZE, y: mcy },
            eW = { x: bx, y: mcy };
      const connections = [hasN, hasS, hasE, hasW].filter(Boolean).length;
      ctx.strokeStyle = "#ead0a8"; ctx.lineWidth = 6; ctx.lineCap = "round";

      if (connections === 0) {
        ctx.beginPath(); ctx.arc(mcx, mcy, 2, 0, Math.PI * 2); ctx.stroke();
      } else if (hasN && hasS && !hasE && !hasW) {
        ctx.beginPath(); ctx.moveTo(eN.x, eN.y); ctx.lineTo(eS.x, eS.y); ctx.stroke();
      } else if (hasE && hasW && !hasN && !hasS) {
        ctx.beginPath(); ctx.moveTo(eW.x, eW.y); ctx.lineTo(eE.x, eE.y); ctx.stroke();
      } else if (connections === 2 && !(hasN && hasS) && !(hasE && hasW)) {
        // Corner — curve inward through cell center
        let start, end;
        if      (hasN && hasE) { start = eN; end = eE; }
        else if (hasN && hasW) { start = eN; end = eW; }
        else if (hasS && hasE) { start = eS; end = eE; }
        else                   { start = eS; end = eW; }
        const cp = { x: mcx, y: mcy };
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(cp.x, cp.y, end.x, end.y);
        ctx.stroke();
      } else {
        // T-junction or cross — straight lines through center
        ctx.beginPath();
        if (hasN) { ctx.moveTo(mcx, mcy); ctx.lineTo(eN.x, eN.y); }
        if (hasS) { ctx.moveTo(mcx, mcy); ctx.lineTo(eS.x, eS.y); }
        if (hasE) { ctx.moveTo(mcx, mcy); ctx.lineTo(eE.x, eE.y); }
        if (hasW) { ctx.moveTo(mcx, mcy); ctx.lineTo(eW.x, eW.y); }
        ctx.stroke();
      }

    } else if (building.type === "fence") {
      const fenceCells = new Set((props.settlement.buildings ?? []).filter(b => b.type === "fence").map(b => b.cellIndex));
      const col = building.cellIndex % COLS;
      const hasH = (col > 0 && fenceCells.has(building.cellIndex - 1)) || (col < COLS - 1 && fenceCells.has(building.cellIndex + 1));
      const hasV = fenceCells.has(building.cellIndex - COLS) || fenceCells.has(building.cellIndex + COLS);
      ctx.strokeStyle = "#7a5020"; ctx.lineWidth = 1.5;
      if (hasH || (!hasH && !hasV)) {
        ctx.beginPath(); ctx.moveTo(bx, by + hPx / 2); ctx.lineTo(bx + wPx, by + hPx / 2); ctx.stroke();
      }
      if (hasV || (!hasH && !hasV)) {
        ctx.beginPath(); ctx.moveTo(bx + wPx / 2, by); ctx.lineTo(bx + wPx / 2, by + hPx); ctx.stroke();
      }
      // Post
      ctx.fillStyle = "#7a5020";
      ctx.fillRect(bx + wPx * 0.38, by + hPx * 0.38, wPx * 0.24, hPx * 0.24);

    } else if (building.type === "bridge") {
      ctx.fillStyle = "#c0a870"; ctx.fillRect(bx, by, wPx, hPx);
      ctx.strokeStyle = "#7a5828"; ctx.lineWidth = 0.8;
      for (let px = bx + 3; px < bx + wPx - 1; px += 5) {
        ctx.beginPath(); ctx.moveTo(px, by); ctx.lineTo(px, by + hPx); ctx.stroke();
      }
      ctx.strokeRect(bx, by, wPx, hPx);

    } else {
      drawCanvasBuilding(ctx, bx, by, wPx, hPx, building.type);

      // Entrance path
      const def = BUILDING_DEFS[building.type];
      if (def?.category === "structure") {
        const roadCells = new Set((props.settlement.buildings ?? []).filter(b => b.type === "road").map(b => b.cellIndex));
        const hasRoadS = Array.from({ length: bw }, (_, i) => (br + bh) * COLS + bc + i).some(c => roadCells.has(c));
        if (hasRoadS) {
          const bcx = bx + wPx / 2;
          const roadCenterY = by + hPx + CELL_SIZE / 2;
          ctx.strokeStyle = "#ead0a8"; ctx.lineWidth = 6; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(bcx, roadCenterY);
          ctx.lineTo(bcx, by + hPx);
          ctx.stroke();
        }
      }
    }
  }

  // Pass 2c: building name labels
  {
    const NO_LABEL = new Set(["road", "fence", "bridge"]);
    const drawn = new Set();
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const labelFontSize = window.innerWidth < 640 ? 10 : 11;
    const lineH = labelFontSize + 3;
    ctx.font = `italic ${labelFontSize}px Georgia, serif`;

    // Collect all individual labels
    const labels = [];
    for (const building of (props.settlement.buildings ?? [])) {
      if (drawn.has(building.cellIndex)) continue;
      drawn.add(building.cellIndex);
      if (NO_LABEL.has(building.type)) continue;
      const def = BUILDING_DEFS[building.type];
      if (!def) continue;
      const label = building.name || def.name;
      const bc = building.cellIndex % COLS;
      const br = Math.floor(building.cellIndex / COLS);
      const { w: bw } = buildingSize(building.type);
      const cx = (bc + bw / 2) * CELL_SIZE;
      const ty = br * CELL_SIZE - 2;
      const tw = ctx.measureText(label).width;
      labels.push({ cx, ty, label, tw });
    }

    // Cluster labels that overlap horizontally on the same row
    const clusters = [];
    for (const lbl of labels) {
      let merged = false;
      for (const cluster of clusters) {
        const overlapsAny = cluster.items.some(existing =>
          Math.abs(lbl.ty - existing.ty) < lineH &&
          Math.abs(lbl.cx - existing.cx) < (lbl.tw + existing.tw) / 2 + 4
        );
        if (overlapsAny) { cluster.items.push(lbl); merged = true; break; }
      }
      if (!merged) clusters.push({ items: [lbl] });
    }

    // Draw each cluster as a stacked label
    const pad = 2;
    for (const { items } of clusters) {
      const lines = items.map(l => l.label);
      const n = lines.length;
      const maxTw = Math.max(...items.map(l => ctx.measureText(l.label).width));
      const avgCx = items.reduce((s, l) => s + l.cx, 0) / n;
      const minTy = Math.min(...items.map(l => l.ty));

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(avgCx - maxTw / 2 - pad, minTy - n * lineH - pad, maxTw + pad * 2, n * lineH + pad * 2);

      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < n; i++) {
        ctx.fillText(lines[i], avgCx, minTy - (n - 1 - i) * lineH);
      }
    }
  }

  // Pass 3: settlement name label
  const townName = props.settlement.town_name ?? "";
  if (townName) {
    const labelY = canvas.height - 10;
    ctx.font = "bold 13px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    // Shadow
    ctx.fillStyle = "rgba(120,80,20,0.4)";
    ctx.fillText(townName, canvas.width / 2 + 1, labelY + 1);
    // Text
    ctx.fillStyle = "#3a2808";
    ctx.fillText(townName, canvas.width / 2, labelY);
  }

  // Pass 3b: compass rose (bottom-right corner)
  {
    const rx = canvas.width - 22, ry = canvas.height - 22, rs = 14;
    const dirs = [
      { angle: -Math.PI / 2, label: "N" },
      { angle:  Math.PI / 2, label: "S" },
      { angle:  0,           label: "E" },
      { angle:  Math.PI,     label: "W" },
    ];
    // Arms
    ctx.strokeStyle = "#5a3a10"; ctx.lineWidth = 1;
    for (const d of dirs) {
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + Math.cos(d.angle) * rs, ry + Math.sin(d.angle) * rs);
      ctx.stroke();
    }
    // Arrow heads (N/S/E/W triangles)
    for (const d of dirs) {
      const tipX = rx + Math.cos(d.angle) * rs;
      const tipY = ry + Math.sin(d.angle) * rs;
      const perpX = -Math.sin(d.angle) * 2.5;
      const perpY =  Math.cos(d.angle) * 2.5;
      ctx.fillStyle = d.label === "N" ? "#3a2808" : "#8a6830";
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(rx + perpX, ry + perpY);
      ctx.lineTo(rx - perpX, ry - perpY);
      ctx.closePath(); ctx.fill();
    }
    // Center dot
    ctx.fillStyle = "#3a2808";
    ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI * 2); ctx.fill();
    // N label
    ctx.font = "bold 7px Georgia, serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#3a2808";
    ctx.fillText("N", rx + Math.cos(-Math.PI / 2) * (rs + 5), ry + Math.sin(-Math.PI / 2) * (rs + 5));
  }

  // Pass 3c: border frame
  {
    const m = 4; // margin from canvas edge
    ctx.strokeStyle = "#7a5020"; ctx.lineWidth = 1.5;
    ctx.strokeRect(m, m, canvas.width - m * 2, canvas.height - m * 2);
    ctx.strokeStyle = "rgba(120,80,20,0.4)"; ctx.lineWidth = 0.6;
    ctx.strokeRect(m + 3, m + 3, canvas.width - (m + 3) * 2, canvas.height - (m + 3) * 2);
    // Corner ornaments
    const corners = [[m, m], [canvas.width - m, m], [m, canvas.height - m], [canvas.width - m, canvas.height - m]];
    ctx.fillStyle = "#7a5020";
    for (const [cx2, cy2] of corners) {
      ctx.beginPath(); ctx.arc(cx2, cy2, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Pass 4: hover highlight sized to the selected building's footprint
  if (hovered !== null) {
    const hc = hovered % COLS;
    const hr = Math.floor(hovered / COLS);
    const { w: hw, h: hh } = selectedBuildingType.value ? buildingSize(selectedBuildingType.value) : { w: 1, h: 1 };
    ctx.fillStyle = "rgba(255,255,255,0.30)";
    ctx.fillRect(hc * CELL_SIZE, hr * CELL_SIZE, hw * CELL_SIZE, hh * CELL_SIZE);
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
    if (existing.type === "road" || existing.type === "bridge" || existing.type === "fence") {
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
      const { w, h } = buildingSize(selectedBuildingType.value);
      const col = cellIndex % COLS;
      const row = Math.floor(cellIndex / COLS);
      if (col + w > COLS || row + h > ROWS) return;
      const footprint = [];
      for (let dr = 0; dr < h; dr++)
        for (let dc = 0; dc < w; dc++)
          footprint.push(cellIndex + dr * COLS + dc);
      if (footprint.some(c => buildingAt(c))) return;
    }

    const skipConfirm = selectedBuildingType.value === "road" || selectedBuildingType.value === "bridge" || selectedBuildingType.value === "fence";
    if (skipConfirm) {
      emit("place-building", { cellIndex, type: selectedBuildingType.value, cost: def.cost });
    } else {
      pendingPlacementName.value = "";
      pendingPlacement.value = { cellIndex, type: selectedBuildingType.value, def };
    }
  }
}

function confirmPlacement() {
  const p = pendingPlacement.value;
  if (!p) return;
  const name = pendingPlacementName.value.trim() || p.def.name;
  emit("place-building", { cellIndex: p.cellIndex, type: p.type, cost: p.def.cost, name });
  pendingPlacement.value = null;
  pendingPlacementName.value = "";
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
  () => drawGrid(),
  { deep: true }
);

onMounted(preloadImages);
</script>

<style scoped>
@import "./styles/settlementModalStyles.css";
</style>
