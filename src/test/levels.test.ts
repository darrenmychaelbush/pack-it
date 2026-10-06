import { describe, expect, it } from "vitest";
import { LEVELS } from "@/game/levels";
import { forgotRequiresRearranging, validateLevelDefinition } from "@/game/solver";
import { canPlaceItem, loadLevel } from "@/game/engine";

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
        void canPlaceItem;
      });
    }
  }
});
