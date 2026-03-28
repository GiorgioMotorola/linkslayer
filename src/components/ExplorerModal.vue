<template>
  <div class="explorer-overlay">
    <div class="explorer-panel">

      <div class="explorer-header">
        <div class="explorer-title">{{ mapDef.title }}</div>
        <div class="explorer-subtitle">{{ mapDef.subtitle }}</div>
      </div>

      <div
        class="explorer-grid"
        ref="gridRef"
        :style="{
          gridTemplateColumns: `repeat(${mapDef.gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${mapDef.gridRows}, auto)`,
          width: '100%',
        }"
      >
        <!-- Corridor cells -->
        <div
          v-for="cell in corridorCells"
          :key="`c-${cell.col}-${cell.row}`"
          class="explorer-cell corridor"
          :class="cell.type"
          :style="{ gridColumn: cell.col, gridRow: cell.row }"
        >
          <span v-if="cell.type === 'corridor-v'">│</span>
          <span v-else>─</span>
        </div>

        <!-- Node cells -->
        <div
          v-for="(node, nodeId) in mapDef.nodes"
          :key="nodeId"
          :ref="el => { if (el) nodeRefs[nodeId] = el; else delete nodeRefs[nodeId] }"
          class="explorer-cell explorer-node"
          :class="nodeClasses(nodeId)"
          :style="{ gridColumn: node.col, gridRow: node.row }"
          @click="handleNodeClick(nodeId)"
        >
          <div class="node-icon" v-html="displayIcon(nodeId)"></div>
          <div class="node-label">{{ node.label }}</div>
          <div v-if="isPlayerHere(nodeId)" class="player-beacon"><i class="ra ra-player-king"></i></div>
          <div v-if="isCleared(nodeId)" class="cleared-badge">✓</div>
        </div>

        <!-- Traveling dot — single element moved via CSS var -->
        <div
          v-if="isTraveling && dotStyle"
          class="travel-dot"
          :style="dotStyle"
        ></div>
      </div>

      <!-- Exit confirmation -->
      <div v-if="confirmingExit" class="explorer-confirm">
        <div class="confirm-text">Leave {{ mapDef.title }}?</div>
        <div class="confirm-buttons">
          <button @click="emit('exit')">Yes, leave</button>
          <button @click="confirmingExit = false">Stay</button>
        </div>
      </div>

      <div class="explorer-legend">
        <span><i class="ra ra-player-king"></i> You are here</span>
        <span>Amber border = reachable</span>
        <span>✓ = explored</span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, reactive, nextTick } from "vue";
import { EXPLORER_MAPS } from "@/utils/explorerMaps.js";
import "./styles/explorerModalStyles.css";

const props = defineProps({
  explorerState: { type: Object, required: true },
});

const emit = defineEmits(["move", "exit"]);

const confirmingExit = ref(false);
const isTraveling = ref(false);
const dotStyle = ref(null);
const gridRef = ref(null);
const nodeRefs = reactive({});

const TRAVEL_MS = 350; // total travel duration

const mapDef = computed(() => EXPLORER_MAPS[props.explorerState.mapId]);

const corridorCells = computed(() => {
  const map = mapDef.value;
  const cells = {};

  Object.entries(map.nodes).forEach(([id, node]) => {
    node.connections.forEach((connId) => {
      if (id >= connId) return;
      const conn = map.nodes[connId];
      if (!conn) return;

      if (node.row === conn.row) {
        const minCol = Math.min(node.col, conn.col);
        const maxCol = Math.max(node.col, conn.col);
        for (let c = minCol + 1; c < maxCol; c++) {
          const key = `${c},${node.row}`;
          if (!cells[key]) cells[key] = { type: "corridor-h", col: c, row: node.row };
        }
      } else if (node.col === conn.col) {
        const minRow = Math.min(node.row, conn.row);
        const maxRow = Math.max(node.row, conn.row);
        for (let r = minRow + 1; r < maxRow; r++) {
          const key = `${node.col},${r}`;
          if (!cells[key]) cells[key] = { type: "corridor-v", col: node.col, row: r };
        }
      }
    });
  });

  return Object.values(cells);
});

function isPlayerHere(nodeId) {
  return props.explorerState.playerNode === nodeId;
}

function isAdjacentToPlayer(nodeId) {
  const current = mapDef.value.nodes[props.explorerState.playerNode];
  return current?.connections?.includes(nodeId) ?? false;
}

function isCleared(nodeId) {
  return props.explorerState.rooms[nodeId]?.cleared ?? false;
}

function isVisited(nodeId) {
  return props.explorerState.rooms[nodeId]?.visited ?? false;
}

function displayIcon(nodeId) {
  const node = mapDef.value.nodes[nodeId];
  if (isPlayerHere(nodeId)) return node.icon;
  if (node.isExit || node.isEntrance) return node.icon;
  if (!isVisited(nodeId)) return '<i class="ra ra-uncertainty"></i>';
  const outcomeIcons = {
    chest:  '<i class="ra ra-gem"></i>',
    combat: '<i class="ra ra-crossed-swords"></i>',
    item:   '<i class="ra ra-vial"></i>',
    lore:   '<i class="ra ra-scroll-unfurled"></i>',
    empty:  '<i class="ra ra-spider-face"></i>',
  };
  return outcomeIcons[props.explorerState.rooms[nodeId]?.outcome] ?? '<i class="ra ra-uncertainty"></i>';
}

function nodeClasses(nodeId) {
  const node = mapDef.value.nodes[nodeId];
  return {
    "is-player": isPlayerHere(nodeId),
    "is-adjacent": isAdjacentToPlayer(nodeId) && !isPlayerHere(nodeId),
    "is-entrance": node.isEntrance,
    "is-exit": node.isExit,
    "is-cleared": isCleared(nodeId),
    "is-visited": isVisited(nodeId),
  };
}

function getEdgePoint(el, gridEl, side) {
  const r = el.getBoundingClientRect();
  const g = gridEl.getBoundingClientRect();
  const cx = r.left + r.width  / 2 - g.left;
  const cy = r.top  + r.height / 2 - g.top;
  if (side === 'right')  return { x: r.right  - g.left, y: cy };
  if (side === 'left')   return { x: r.left   - g.left, y: cy };
  if (side === 'bottom') return { x: cx, y: r.bottom - g.top };
  if (side === 'top')    return { x: cx, y: r.top    - g.top };
}

async function handleNodeClick(nodeId) {
  if (isPlayerHere(nodeId) || isTraveling.value) return;

  const node = mapDef.value.nodes[nodeId];
  if (node.isExit) {
    confirmingExit.value = true;
    return;
  }

  if (!isAdjacentToPlayer(nodeId)) return;
  confirmingExit.value = false;

  const fromEl  = nodeRefs[props.explorerState.playerNode];
  const toEl    = nodeRefs[nodeId];
  const gridEl  = gridRef.value;

  if (!fromEl || !toEl || !gridEl) {
    emit("move", nodeId);
    return;
  }

  await nextTick();

  const fromNodeDef = mapDef.value.nodes[props.explorerState.playerNode];
  const toNodeDef   = mapDef.value.nodes[nodeId];

  // Determine which edges the corridor connects
  let fromSide, toSide;
  if (fromNodeDef.row === toNodeDef.row) {
    fromSide = toNodeDef.col > fromNodeDef.col ? 'right' : 'left';
    toSide   = toNodeDef.col > fromNodeDef.col ? 'left'  : 'right';
  } else {
    fromSide = toNodeDef.row > fromNodeDef.row ? 'bottom' : 'top';
    toSide   = toNodeDef.row > fromNodeDef.row ? 'top'    : 'bottom';
  }

  const from = getEdgePoint(fromEl, gridEl, fromSide);
  const to   = getEdgePoint(toEl,   gridEl, toSide);
  const dx   = to.x - from.x;
  const dy   = to.y - from.y;

  dotStyle.value = {
    left: from.x + 'px',
    top:  from.y + 'px',
    '--dx': dx + 'px',
    '--dy': dy + 'px',
    animationDuration: TRAVEL_MS + 'ms',
  };
  isTraveling.value = true;

  setTimeout(() => {
    isTraveling.value = false;
    dotStyle.value = null;
    emit("move", nodeId);
  }, TRAVEL_MS + 50);
}
</script>
