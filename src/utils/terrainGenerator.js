const COLS = 20;
const ROWS = 16;

function idx(x, y) {
  return y * COLS + x;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Generates a 20x40 flat array of tile type strings.
 * Tile types: 'grass' | 'river' | 'rock' | 'tree'
 */
export function generateTerrain() {
  const grid = Array(COLS * ROWS).fill("grass");

  // ── River ─────────────────────────────────────────────────────────────────
  // Meanders from top to bottom
  let col = 4 + Math.floor(Math.random() * 12); // start col 4–15
  for (let row = 0; row < ROWS; row++) {
    // Paint a 3-tile-wide river centered on col, occasionally 4 wide
    const halfWidth = Math.random() < 0.4 ? 2 : 1; // 40% chance of 4-wide, else 3-wide
    for (let dx = -halfWidth; dx <= halfWidth; dx++) {
      const nx = col + dx;
      if (nx >= 0 && nx < COLS) grid[idx(nx, row)] = "river";
    }
    // Meander: 40% chance to drift left or right
    const drift = Math.random() < 0.4 ? (Math.random() < 0.5 ? 1 : -1) : 0;
    col = clamp(col + drift, 2, COLS - 3);
  }

  // ── Rock clusters ─────────────────────────────────────────────────────────
  const rockClusters = 2 + Math.floor(Math.random() * 2); // 2–3 clusters
  for (let c = 0; c < rockClusters; c++) {
    let cx, cy, tries = 0;
    do {
      cx = 1 + Math.floor(Math.random() * (COLS - 2));
      cy = 1 + Math.floor(Math.random() * (ROWS - 2));
      tries++;
    } while (grid[idx(cx, cy)] === "river" && tries < 30);

    const r = 1 + Math.floor(Math.random() * 2); // radius 1–2
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && Math.random() < 0.65) {
          if (grid[idx(nx, ny)] !== "river") grid[idx(nx, ny)] = "rock";
        }
      }
    }
  }

  // ── Tree clusters ─────────────────────────────────────────────────────────
  const treeClusters = 3 + Math.floor(Math.random() * 3); // 3–5 clusters
  for (let c = 0; c < treeClusters; c++) {
    const cx = 1 + Math.floor(Math.random() * (COLS - 2));
    const cy = 1 + Math.floor(Math.random() * (ROWS - 2));
    const r = 1 + Math.floor(Math.random() * 2); // radius 1–2
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && Math.random() < 0.65) {
          if (grid[idx(nx, ny)] === "grass") grid[idx(nx, ny)] = "tree";
        }
      }
    }
  }

  return grid;
}
