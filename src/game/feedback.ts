/** Audio/haptic placeholders. Wire real sounds in later without touching game logic. */
export type FeedbackEvent = "pickup" | "place" | "invalid" | "rotate" | "complete" | "zip" | "star" | "stamp";

const vibe: Partial<Record<FeedbackEvent, number | number[]>> = {
  place: 12,
  invalid: [8, 40, 8],
  rotate: 8,
  complete: [20, 60, 30],
  stamp: 35,
};

export function feedback(event: FeedbackEvent) {
  const pattern = vibe[event];
  if (pattern && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}
