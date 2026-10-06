import { useCallback, useEffect, useState } from "react";
import type { LevelDefinition, PlayerProgress } from "./types";

/** Storage abstraction: swap LocalProgressStore for a Cloud-backed store later. */
export interface ProgressStore {
  load(): PlayerProgress;
  save(p: PlayerProgress): void;
}

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
