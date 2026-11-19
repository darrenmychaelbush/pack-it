import { describe, expect, it } from "vitest";
import { canPlaceItem, getItemShape, isLevelComplete, loadLevel, placeItem } from "@/game/engine";
import { getLevel } from "@/game/levels";
import type { Rotation } from "@/game/types";

describe("Mexico City: move and rotate before dropping", () => {
  const level = getLevel("mexico-city")!;

  // Coordinates are zero-based. Every existing item remains packed throughout.
  const moves: { itemId: string; row: number; col: number; rotation: Rotation }[] = [
    { itemId: "charger", row: 2, col: 4, rotation: 1 },
    { itemId: "jacket", row: 0, col: 2, rotation: 1 },
    { itemId: "charger", row: 0, col: 4, rotation: 1 },
    { itemId: "umbrella", row: 1, col: 4, rotation: 1 },
    { itemId: "jacket", row: 1, col: 2, rotation: 1 },
    { itemId: "charger", row: 2, col: 5, rotation: 0 },
    { itemId: "umbrella", row: 0, col: 2, rotation: 0 },
    { itemId: "jacket", row: 1, col: 2, rotation: 0 },
    { itemId: "jeans", row: 3, col: 2, rotation: 0 },
    { itemId: "aloha", row: 5, col: 2, rotation: 0 },
    { itemId: "camerabag", row: 5, col: 4, rotation: 0 },
  ];

  it("has an 11-move legal solution with nothing unpacked", () => {
    let items = loadLevel(level);
    const packedBefore = level.items.filter((i) => items[i.instanceId].placement).length;
    moves.forEach(({ itemId, row, col, rotation }, moveIndex) => {
      const instanceId = level.items.find((i) => i.itemId === itemId)!.instanceId;
      const shape = getItemShape(level, instanceId, rotation);
      expect(canPlaceItem(level, items, instanceId, shape, row, col), "move " + (moveIndex + 1) + ": " + itemId).toBe(true);
      items = placeItem(items, instanceId, { row, col }, rotation);
      expect(level.items.filter((i) => items[i.instanceId].placement).length).toBe(
        packedBefore + (moveIndex === moves.length - 1 ? 1 : 0),
      );
    });
    expect(moves.length).toBeLessThanOrEqual(level.parMoves);
    expect(isLevelComplete(level, items)).toBe(true);
    for (const solution of level.intendedSolution) {
      expect(items[solution.instanceId]).toEqual({
        placement: { row: solution.row, col: solution.col },
        rotation: solution.rotation,
      });
    }
  });

  it("allows a rotated destination even when the old spot cannot rotate", () => {
    let items = loadLevel(level);
    for (const move of moves.slice(0, 6)) {
      const instanceId = level.items.find((i) => i.itemId === move.itemId)!.instanceId;
      items = placeItem(items, instanceId, { row: move.row, col: move.col }, move.rotation);
    }
    const umbrellaId = level.items.find((i) => i.itemId === "umbrella")!.instanceId;
    const horizontal = getItemShape(level, umbrellaId, 0);
    const oldSpot = items[umbrellaId].placement!;
    expect(canPlaceItem(level, items, umbrellaId, horizontal, oldSpot.row, oldSpot.col)).toBe(false);
    expect(canPlaceItem(level, items, umbrellaId, horizontal, 0, 2)).toBe(true);
    expect(items[umbrellaId].rotation).toBe(1);
  });
});
