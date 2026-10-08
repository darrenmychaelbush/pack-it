import { describe, expect, it } from "vitest";
import { LEVELS } from "@/game/levels";
import { forgotRequiresRearranging, validateLevelDefinition } from "@/game/solver";
import { loadLevel } from "@/game/engine";

describe("level production gate", () => {
  for (const level of LEVELS) {
    it(`${level.levelNumber} ${level.destination}: 1 ≤ solutions ≤ ${level.maxSolutions}`, () => {
      const v = validateLevelDefinition(level);
      expect(v.error).toBeNull();
    });
    if (level.type === "forgot") {
      it(`${level.destination} Forgot It! needs 2+ pieces rearranged`, () => {
        const items = loadLevel(level);
        const m = level.items.find((i) => i.instanceId === level.missingInstanceId)!;
        expect(items[m.instanceId].placement).toBeNull();
        expect(forgotRequiresRearranging(level)).toBe(true);
      });
    }
  }
});

import { PACKED_SIZES, SIZE_CHECKED_LEVELS, packedArea } from "@/game/sizes";
import { footprintKey } from "@/game/solver";

describe("realistic packed sizes", () => {
  it("sunglasses take less room than jeans", () => expect(packedArea("sunglasses")).toBeLessThan(packedArea("jeans")));
  it("sunscreen takes less room than a jacket", () => expect(packedArea("sunscreen")).toBeLessThan(packedArea("jacket")));
  it("cowboy boots are bulkier than sandals", () => expect(packedArea("cowboyboots")).toBeGreaterThan(packedArea("sandals")));
  it("hiking boots are bulkier than sneakers", () => expect(packedArea("boots")).toBeGreaterThan(packedArea("sneakers")));
  it("a jacket is much bigger than a swimsuit", () => expect(packedArea("jacket")).toBeGreaterThanOrEqual(2 * packedArea("swimsuit")));
  it("long items stay one cell wide", () => {
    for (const id of ["umbrella", "guitar", "towel", "scarf"]) expect(Math.min(PACKED_SIZES[id].shape.length, PACKED_SIZES[id].shape[0].length)).toBe(1);
  });
  for (const id of SIZE_CHECKED_LEVELS) {
    it(`${id} items match the size library`, () => {
      const level = LEVELS.find((l) => l.id === id)!;
      for (const it of level.items) expect(footprintKey(it.shape), it.itemId).toBe(footprintKey(PACKED_SIZES[it.itemId].shape));
    });
  }
});
