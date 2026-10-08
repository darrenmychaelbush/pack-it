import { useCallback, useEffect, useState } from "react";
import type { GameItems, LevelDefinition, PlayerProgress, Rotation } from "./types";
import { canPlaceItem } from "./engine";

/** Unfinished puzzle, stored separately from completed-level progress. */
export interface SavedPuzzleState {
  levelId: string;
  placedItems: { instanceId: string; itemId: string; row: number; col: number; rotation: Rotation }[];
  unpackedItems: { instanceId: string; rotation: Rotation }[];
  moveCount: number;
  hintUsed: boolean;
  started: boolean;
  updatedAt: string;
}

/** Storage abstraction: swap LocalProgressStore for a Cloud-backed store later. */
export interface ProgressStore {
  load(): PlayerProgress;
  save(p: PlayerProgress): void;
  loadPuzzle(levelId: string): SavedPuzzleState | null;
  savePuzzle(state: SavedPuzzleState): void;
  clearPuzzle(levelId: string): void;
}

const PUZZLE_KEY = "packit.puzzles.v1";
const readPuzzles = (): Record<string, SavedPuzzleState> => {
  try {
    return JSON.parse(localStorage.getItem(PUZZLE_KEY) ?? "{}");
  } catch {
    return {};
  }
};

const KEY = "packit.progress.v1";
export const emptyProgress = (): PlayerProgress => ({ unlockedLevel: 1, levels: {}, stamps: {} });

export const LocalProgressStore: ProgressStore = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...emptyProgress(), ...JSON.parse(raw) } : emptyProgress();
    } catch {
      return emptyProgress();
    }
  },
  save(p) {
    localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new Event("packit-progress"));
  },
  loadPuzzle(levelId) {
    return readPuzzles()[levelId] ?? null;
  },
  savePuzzle(state) {
    const all = readPuzzles();
    all[state.levelId] = state;
    localStorage.setItem(PUZZLE_KEY, JSON.stringify(all));
  },
  clearPuzzle(levelId) {
    const all = readPuzzles();
    delete all[levelId];
    localStorage.setItem(PUZZLE_KEY, JSON.stringify(all));
  },
};

let store: ProgressStore = LocalProgressStore;
export const setProgressStore = (s: ProgressStore) => (store = s);

export function saveProgress(p: PlayerProgress) {
  store.save(p);
}

export function recordCompletion(level: LevelDefinition, stars: number, moves: number, hintUsed: boolean) {
  const p = store.load();
  const prev = p.levels[level.id];
  const newStamp = !p.stamps[level.passportStampId];
  p.levels[level.id] = {
    completed: true,
    stars: Math.max(prev?.stars ?? 0, stars),
    bestMoves: prev?.bestMoves != null ? Math.min(prev.bestMoves, moves) : moves,
    hintUsed: (prev?.hintUsed ?? false) || hintUsed,
  };
  if (newStamp) {
    p.stamps[level.passportStampId] = {
      id: level.passportStampId,
      destination: level.destination,
      country: level.country,
      earnedAt: new Date().toISOString(),
    };
  }
  p.unlockedLevel = Math.max(p.unlockedLevel, level.levelNumber + 1);
  store.clearPuzzle(level.id);
  store.save(p);
  return { newStamp, progress: p };
}

export function useProgress() {
  const [progress, setProgress] = useState<PlayerProgress>(emptyProgress);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setProgress(store.load());
    sync();
    setReady(true);
    window.addEventListener("packit-progress", sync);
    return () => window.removeEventListener("packit-progress", sync);
  }, []);
  const reset = useCallback(() => store.save(emptyProgress()), []);
  return { progress, ready, reset };
}

export function toSavedPuzzle(level: LevelDefinition, items: GameItems, moveCount: number, hintUsed: boolean): SavedPuzzleState {
  return {
    levelId: level.id,
    placedItems: level.items.flatMap((i) => {
      const st = items[i.instanceId];
      return st.placement ? [{ instanceId: i.instanceId, itemId: i.itemId, ...st.placement, rotation: st.rotation }] : [];
    }),
    unpackedItems: level.items.filter((i) => !items[i.instanceId].placement).map((i) => ({ instanceId: i.instanceId, rotation: items[i.instanceId].rotation })),
    moveCount,
    hintUsed,
    started: true,
    updatedAt: new Date().toISOString(),
  };
}

/** Rebuild board state from a save; returns null if the save no longer matches the level. */
export function restoreSavedPuzzle(level: LevelDefinition, saved: SavedPuzzleState): GameItems | null {
  const ids = new Set(level.items.map((i) => i.instanceId));
  const seen = [...saved.placedItems.map((p) => p.instanceId), ...saved.unpackedItems.map((u) => u.instanceId)];
  if (seen.length !== ids.size || !seen.every((id) => ids.has(id))) return null;
  let items: GameItems = {};
  for (const u of saved.unpackedItems) items[u.instanceId] = { rotation: u.rotation, placement: null };
  for (const p of saved.placedItems) items[p.instanceId] = { rotation: p.rotation, placement: null };
  for (const p of saved.placedItems) {
    const item = level.items.find((i) => i.instanceId === p.instanceId)!;
    if (item.itemId !== p.itemId) return null;
    let shape = item.shape;
    for (let k = 0; k < p.rotation; k++) shape = shape[0].map((_, c) => shape.map((r) => r[c]).reverse());
    if (!canPlaceItem(level, items, p.instanceId, shape, p.row, p.col)) return null;
    items = { ...items, [p.instanceId]: { rotation: p.rotation, placement: { row: p.row, col: p.col } } };
  }
  return items;
}

export const loadSavedPuzzle = (levelId: string) => store.loadPuzzle(levelId);
export const savePuzzle = (s: SavedPuzzleState) => store.savePuzzle(s);
export const clearSavedPuzzle = (levelId: string) => store.clearPuzzle(levelId);
