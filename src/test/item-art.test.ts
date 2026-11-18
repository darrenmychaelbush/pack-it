import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { artLayout } from "@/components/game/ItemBlocks";
import { rotateN } from "@/game/engine";
import { PACKED_SIZES } from "@/game/sizes";

/** Visual bounds of the CSS-rotated art box. */
const rotatedBounds = (b: ReturnType<typeof artLayout>) => {
  const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
  const q = b.rotate % 180 !== 0;
  const w = q ? b.height : b.width, h = q ? b.width : b.height;
  return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
};

describe("item artwork alignment", () => {
  for (const [id, lib] of Object.entries(PACKED_SIZES)) {
    for (const cell of [24, 64]) for (const n of [0, 1, 2, 3]) {
      it(`${id} stays inside its footprint at ${n * 90}° / ${cell}px`, () => {
        const shape = rotateN(lib.shape, n);
        const b = rotatedBounds(artLayout(shape, lib.shape, n, cell));
        const W = shape[0].length * cell, H = shape.length * cell;
        expect(b.x0).toBeGreaterThanOrEqual(0);
        expect(b.y0).toBeGreaterThanOrEqual(0);
        expect(b.x1).toBeLessThanOrEqual(W + 1e-6);
        expect(b.y1).toBeLessThanOrEqual(H + 1e-6);
        expect(b.x1 - b.x0).toBeGreaterThan(W * 0.85);
        expect(b.y1 - b.y0).toBeGreaterThan(H * 0.85);
      });
    }
  }

  it("artwork is not clamped by img max-width when the pre-rotation box is wider", () => {
    expect(readFileSync("src/components/game/ItemBlocks.tsx", "utf8")).toMatch(/maxWidth: "none"/);
  });

  it("long narrow artwork is drawn in its footprint's orientation", () => {
    for (const id of ["guitar", "towel", "umbrella", "scarf", "snorkel"]) {
      const png = readFileSync(`src/assets/items/${id}.png`);
      const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
      expect(h / w, id).toBeGreaterThan(3);
    }
  });
});
