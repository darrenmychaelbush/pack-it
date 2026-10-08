import { rotateN, shapesEqual } from "./engine";
import type { Cell, LevelDefinition, Rotation, Shape } from "./types";

export interface SolvedPlacement {
  instanceId: string;
  row: number;
  col: number;
  rotation: Rotation;
}

export interface BoardSpec {
  rows: number;
  cols: number;
  blocked: Cell[];
  /** Cells that are pre-filled (e.g. fixed items); treated like blocked. */
  pieces: { id: string; shape: Shape; rotations?: Rotation[] }[];
}

/** Unique orientations of a shape (geometrically identical rotations collapse into one). */
export function uniqueOrientations(shape: Shape, allowed: Rotation[] = [0, 1, 2, 3]) {
  const out: { rotation: Rotation; shape: Shape }[] = [];
  for (const r of allowed) {
    const s = rotateN(shape, r);
    if (!out.some((o) => shapesEqual(o.shape, s))) out.push({ rotation: r, shape: s });
  }
  return out;
}

/** Canonical footprint key (identical under rotation). */
export function footprintKey(shape: Shape) {
  return uniqueOrientations(shape).map((o) => o.shape.map((r) => r.join("")).join("/")).sort()[0];
}

/** For each piece, index of the previous piece with the same footprint (or -1). */
export function footprintPredecessors(shapes: Shape[]) {
  const last = new Map<string, number>();
  return shapes.map((s, i) => {
    const k = footprintKey(s);
    const p = last.get(k) ?? -1;
    last.set(k, i);
    return p;
  });
}

interface Option {
  piece: number;
  cells: number[];
  placement: SolvedPlacement;
}

/**
 * Backtracking exact-cover-with-holes solver. Every piece must be placed; usable cells left
 * empty are "holes" (count is fixed by area). Branches on the empty cell with the fewest
 * legal options (MRV). Counts distinct footprint layouts (same-shaped pieces are interchangeable).
 * Stops once `limit` solutions are found.
 */
export function solveBoard(board: BoardSpec, limit: number): SolvedPlacement[][] {
  const { rows, cols, pieces } = board;
  const N = rows * cols;
  const occ = new Int32Array(N); // 0 empty, -1 blocked/hole, k+1 piece
  board.blocked.forEach((b) => (occ[b.row * cols + b.col] = -1));
  const usable = N - board.blocked.length;
  const area = pieces.reduce((s, p) => s + p.shape.flat().filter(Boolean).length, 0);
  let holesLeft = usable - area;
  if (holesLeft < 0) return [];

  const options: Option[] = [];
  const byCell: number[][] = Array.from({ length: N }, () => []);
  pieces.forEach((p, pi) => {
    for (const o of uniqueOrientations(p.shape, p.rotations)) {
      const h = o.shape.length;
      const w = o.shape[0].length;
      for (let r = 0; r + h <= rows; r++)
        for (let c = 0; c + w <= cols; c++) {
          const cells: number[] = [];
          let ok = true;
          for (let i = 0; i < h && ok; i++)
            for (let j = 0; j < w; j++)
              if (o.shape[i][j]) {
                const idx = (r + i) * cols + c + j;
                if (occ[idx] === -1) { ok = false; break; }
                cells.push(idx);
              }
          if (!ok) continue;
          const oi = options.push({ piece: pi, cells, placement: { instanceId: p.id, row: r, col: c, rotation: o.rotation } }) - 1;
          cells.forEach((idx) => byCell[idx].push(oi));
        }
    }
  });

  const used = new Uint8Array(pieces.length);
  // Pieces with the same footprint are interchangeable: swapping them is the same layout.
  // Symmetry breaking: within a footprint class, pieces are placed in index order.
  const prev = footprintPredecessors(pieces.map((p) => p.shape));
  const chosen: number[] = [];
  const solutions: SolvedPlacement[][] = [];
  const fits = (o: Option) =>
    !used[o.piece] && (prev[o.piece] === -1 || used[prev[o.piece]] === 1) && o.cells.every((idx) => occ[idx] === 0);

  const recurse = () => {
    if (solutions.length >= limit) return;
    if (chosen.length === pieces.length) {
      solutions.push(chosen.map((oi) => options[oi].placement).sort((a, b) => a.instanceId.localeCompare(b.instanceId)));
      return;
    }
    let best = -1;
    let bestCount = Infinity;
    for (let idx = 0; idx < N; idx++) {
      if (occ[idx] !== 0) continue;
      let n = 0;
      for (const oi of byCell[idx]) if (fits(options[oi])) n++;
      if (n === 0 && holesLeft === 0) return;
      if (n < bestCount) { bestCount = n; best = idx; if (n === 0) break; }
    }
    if (best === -1) return;
    for (const oi of byCell[best]) {
      const o = options[oi];
      if (!fits(o)) continue;
      used[o.piece] = 1;
      o.cells.forEach((idx) => (occ[idx] = o.piece + 1));
      chosen.push(oi);
      recurse();
      chosen.pop();
      o.cells.forEach((idx) => (occ[idx] = 0));
      used[o.piece] = 0;
      if (solutions.length >= limit) return;
    }
    if (holesLeft > 0) {
      holesLeft--;
      occ[best] = -1;
      recurse();
      occ[best] = 0;
      holesLeft++;
    }
  };
  recurse();
  return solutions;
}

export function solutionKey(s: SolvedPlacement[]) {
  return s.map((p) => `${p.instanceId}@${p.row},${p.col},${p.rotation}`).join("|");
}

/** Enumerate final arrangements; stops at `solutionLimit + 1` so callers can detect "too many". */
export function solveLevel(level: LevelDefinition, solutionLimit = level.maxSolutions) {
  return solveBoard(
    { rows: level.rows, cols: level.cols, blocked: level.blockedCells, pieces: level.items.map((i) => ({ id: i.instanceId, shape: i.shape })) },
    solutionLimit + 1,
  );
}

export function validateLevelDefinition(level: LevelDefinition) {
  const solutions = solveLevel(level);
  const solutionCount = solutions.length;
  const valid = solutionCount >= 1 && solutionCount <= level.maxSolutions;
  return {
    solvable: solutionCount >= 1,
    solutionCount,
    valid,
    error: solutionCount === 0 ? "INVALID — UNSOLVABLE" : valid ? null : "INVALID — TOO MANY SOLUTIONS",
    solutions,
  };
}

/** All empty usable cells for a set of placements. */
function occupiedFrom(level: LevelDefinition, placed: SolvedPlacement[]) {
  const blocked: Cell[] = [...level.blockedCells];
  for (const p of placed) {
    const item = level.items.find((i) => i.instanceId === p.instanceId)!;
    rotateN(item.shape, p.rotation).forEach((line, r) => line.forEach((v, c) => v && blocked.push({ row: p.row + r, col: p.col + c })));
  }
  return blocked;
}

/**
 * Forgot It! check: the missing item must not fit in the starting gaps, and moving any
 * single packed item must not be enough either — the player has to rearrange 2+ pieces.
 */
export function forgotRequiresRearranging(level: LevelDefinition) {
  const missing = level.items.find((i) => i.instanceId === level.missingInstanceId);
  if (!missing) return false;
  const start = Object.entries(level.startingPlacements).map(([instanceId, s]) => ({ instanceId, ...s }));
  const fitsWith = (fixed: SolvedPlacement[], movable: string[]) =>
    solveBoard(
      {
        rows: level.rows,
        cols: level.cols,
        blocked: occupiedFrom(level, fixed),
        pieces: movable.map((id) => ({ id, shape: level.items.find((i) => i.instanceId === id)!.shape })),
      },
      1,
    ).length > 0;
  if (fitsWith(start, [missing.instanceId])) return false;
  return start.every((p) => !fitsWith(start.filter((q) => q !== p), [p.instanceId, missing.instanceId]));
}
