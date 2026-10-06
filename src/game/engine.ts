import type { Cell, GameItems, LevelDefinition, Rotation, Shape } from "./types";

export function rotateShape(s: Shape): Shape {
  const R = s.length;
  const C = s[0].length;
  const out: Shape = [];
  for (let c = 0; c < C; c++) {
    const row: number[] = [];
    for (let r = R - 1; r >= 0; r--) row.push(s[r][c]);
    out.push(row);
  }
  return out;
}

export function rotateN(s: Shape, n: number): Shape {
  let out = s;
  for (let i = 0; i < ((n % 4) + 4) % 4; i++) out = rotateShape(out);
  return out;
}

export function shapesEqual(a: Shape, b: Shape) {
  return a.length === b.length && a.every((row, r) => row.length === b[r].length && row.every((v, c) => v === b[r][c]));
}

export function getOccupiedCells(shape: Shape, row: number, col: number): Cell[] {
  const cells: Cell[] = [];
  shape.forEach((line, r) => line.forEach((v, c) => v && cells.push({ row: row + r, col: col + c })));
  return cells;
}

export function getItemShape(level: LevelDefinition, id: string, rotation: Rotation): Shape {
  const item = level.items.find((i) => i.instanceId === id)!;
  return rotateN(item.shape, rotation);
}

export function buildOccupancy(level: LevelDefinition, items: GameItems, excludeId?: string) {
  const grid: (string | null)[][] = Array.from({ length: level.rows }, () => Array(level.cols).fill(null));
  level.blockedCells.forEach((b) => (grid[b.row][b.col] = "#"));
  for (const [id, st] of Object.entries(items)) {
    if (id === excludeId || !st.placement) continue;
    getOccupiedCells(getItemShape(level, id, st.rotation), st.placement.row, st.placement.col).forEach(
      (c) => (grid[c.row][c.col] = id),
    );
  }
  return grid;
}

export function canPlaceItem(level: LevelDefinition, items: GameItems, id: string, shape: Shape, row: number, col: number) {
  const grid = buildOccupancy(level, items, id);
  return getOccupiedCells(shape, row, col).every(
    (c) => c.row >= 0 && c.col >= 0 && c.row < level.rows && c.col < level.cols && grid[c.row][c.col] === null,
  );
}

export function placeItem(items: GameItems, id: string, cell: Cell, rotation?: Rotation): GameItems {
  return { ...items, [id]: { rotation: rotation ?? items[id].rotation, placement: { ...cell } } };
}
export const moveItem = placeItem;

export function removeItem(items: GameItems, id: string): GameItems {
  return { ...items, [id]: { ...items[id], placement: null } };
}

export function getNearestGridCell(x: number, y: number, cellSize: number): Cell {
  return { row: Math.round(y / cellSize), col: Math.round(x / cellSize) };
}

export function isLevelComplete(level: LevelDefinition, items: GameItems) {
  return level.items.every((i) => items[i.instanceId]?.placement);
}

export function calculateStars(completed: boolean, hintUsed: boolean, moves: number, par: number) {
  if (!completed) return 0;
  return 1 + (hintUsed ? 0 : 1) + (moves <= par ? 1 : 0);
}

export function loadLevel(level: LevelDefinition): GameItems {
  const items: GameItems = {};
  for (const it of level.items) {
    const start = level.startingPlacements[it.instanceId];
    items[it.instanceId] = start
      ? { rotation: start.rotation, placement: { row: start.row, col: start.col } }
      : { rotation: it.trayRotation, placement: null };
  }
  return items;
}
export const resetLevel = loadLevel;

/** Suggest one useful item: an unpacked item whose solution spot is free, else any unpacked item. */
export function getHintPlacement(level: LevelDefinition, items: GameItems) {
  const unplaced = level.items.filter((i) => !items[i.instanceId].placement);
  const misplaced = level.items.filter((i) => {
    const p = items[i.instanceId].placement;
    return p && (p.row !== i.solution.row || p.col !== i.solution.col || items[i.instanceId].rotation !== 0);
  });
  const free = unplaced.find((i) => canPlaceItem(level, items, i.instanceId, i.shape, i.solution.row, i.solution.col));
  const pick = free ?? misplaced[0] ?? unplaced[0];
  if (!pick) return null;
  return { instanceId: pick.instanceId, row: pick.solution.row, col: pick.solution.col, shape: pick.shape };
}

export function usableCells(level: LevelDefinition) {
  return level.rows * level.cols - level.blockedCells.length;
}

export function calculateWeight(level: LevelDefinition, items: GameItems, weights: Record<string, number>) {
  return level.items.reduce((sum, i) => sum + (items[i.instanceId].placement ? weights[i.itemId] ?? 0 : 0), 0);
}
