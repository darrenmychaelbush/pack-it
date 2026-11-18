import { describe, expect, it } from "vitest";
import { trayStepTarget } from "@/game/tray";

// Cards 84px wide with 8px gap.
const offsets = [0, 92, 184, 276, 368, 460];
const max = 300;

describe("tray arrows", () => {
  it("right arrow moves exactly one card", () => expect(trayStepTarget(offsets, 0, max, 1)).toBe(92));
  it("left arrow moves exactly one card", () => expect(trayStepTarget(offsets, 184, max, -1)).toBe(92));
  it("repeated clicks chain from the pending target", () => {
    let t = 0;
    t = trayStepTarget(offsets, t, max, 1);
    t = trayStepTarget(offsets, t, max, 1);
    expect(t).toBe(184);
  });
  it("clamps at the right end", () => expect(trayStepTarget(offsets, 276, max, 1)).toBe(300));
  it("clamps at the left end", () => expect(trayStepTarget(offsets, 40, max, -1)).toBe(0));
  it("from mid-card manual scroll, right snaps to the next card edge", () => expect(trayStepTarget(offsets, 100, max, 1)).toBe(184));
});
