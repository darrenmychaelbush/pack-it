/** Scroll target one card from `base`: card left edges are `offsets` (relative to the scroll content), clamped to [0, max]. */
export function trayStepTarget(offsets: number[], base: number, max: number, dir: 1 | -1): number {
  const eps = 1;
  const pick = dir > 0 ? offsets.find((o) => o > base + eps) : [...offsets].reverse().find((o) => o < base - eps);
  return Math.min(max, Math.max(0, pick ?? (dir > 0 ? max : 0)));
}
