import { rotateN } from "./engine";
import { uniqueOrientations } from "./solver";
import type { Cell, LevelDefinition, Rotation, Shape } from "./types";

/**
 * Forgot It! rearrangement search. A "move" relocates (and/or rotates) one packed item to another
 * legal spot inside the suitcase — packed items may never leave it. Returns the fewest moves
 * before the missing item can be placed, or null if not reachable within `maxStates`.
 */
export interface RearrangeBoard {
  rows: number;
  cols: number;
  blocked: Cell[];
  pieces: { id: string; shape: Shape }[];
  start: { row: number; col: number; rotation: Rotation }[];
  missing: Shape;
}

interface Opt { cells: number[]; row: number; col: number; rotation: Rotation }

function optionsFor(shape: Shape, rows: number, cols: number, blocked: Set<number>): Opt[] {
  const out: Opt[] = [];
  for (const o of uniqueOrientations(shape)) {
    const h = o.shape.length, w = o.shape[0].length;
    for (let r = 0; r + h <= rows; r++)
      for (let c = 0; c + w <= cols; c++) {
        const cells: number[] = [];
        let ok = true;
        o.shape.forEach((line, i) => line.forEach((v, j) => {
          if (!v) return;
          const idx = (r + i) * cols + c + j;
          if (blocked.has(idx)) ok = false;
          cells.push(idx);
        }));
        if (ok) out.push({ cells, row: r, col: c, rotation: o.rotation });
      }
  }
  return out;
}

export function minRearrangeMoves(b: RearrangeBoard, maxStates = 400_000): number | null {
  const N = b.rows * b.cols;
  const blocked = new Set(b.blocked.map((c) => c.row * b.cols + c.col));
  const opts = b.pieces.map((p) => optionsFor(p.shape, b.rows, b.cols, blocked));
  const missOpts = optionsFor(b.missing, b.rows, b.cols, blocked);
  const startIdx = b.start.map((s, i) => {
    const cells = new Set<number>();
    rotateN(b.pieces[i].shape, s.rotation).forEach((line, r) => line.forEach((v, c) => v && cells.add((s.row + r) * b.cols + s.col + c)));
    const k = opts[i].findIndex((o) => o.cells.length === cells.size && o.cells.every((x) => cells.has(x)));
    if (k < 0) throw new Error("start placement not found");
    return k;
  });
  const occOf = (st: number[], skip = -1) => {
    const occ = new Uint8Array(N);
    st.forEach((k, i) => i !== skip && opts[i][k].cells.forEach((x) => (occ[x] = 1)));
    return occ;
  };
  const goal = (st: number[]) => {
    const occ = occOf(st);
    return missOpts.some((o) => o.cells.every((x) => !occ[x]));
  };
  // Pieces with identical footprints are interchangeable: canonicalise by sorted cell sets per class.
  const key = (st: number[]) => st.join(",");
  if (goal(startIdx)) return 0;
  const seen = new Set([key(startIdx)]);
  let frontier = [startIdx];
  for (let d = 1; frontier.length; d++) {
    const next: number[][] = [];
    for (const st of frontier)
      for (let i = 0; i < st.length; i++) {
        const occ = occOf(st, i);
        opts[i].forEach((o, k) => {
          if (k === st[i] || o.cells.some((x) => occ[x])) return;
          const ns = st.slice();
          ns[i] = k;
          const kk = key(ns);
          if (seen.has(kk)) return;
          seen.add(kk);
          if (seen.size > maxStates) throw new Error("state cap");
          next.push(ns);
        });
      }
    if (next.some(goal)) return d;
    frontier = next;
  }
  return null;
}

export function levelRearrangeMoves(level: LevelDefinition) {
  const packed = level.items.filter((i) => i.instanceId !== level.missingInstanceId);
  const missing = level.items.find((i) => i.instanceId === level.missingInstanceId)!;
  return minRearrangeMoves({
    rows: level.rows,
    cols: level.cols,
    blocked: level.blockedCells,
    pieces: packed.map((p) => ({ id: p.instanceId, shape: p.shape })),
    start: packed.map((p) => level.startingPlacements[p.instanceId]),
    missing: missing.shape,
  });
}
