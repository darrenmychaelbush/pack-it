import type { Shape } from "./types";
import jeans from "@/assets/items/jeans.png";
import shirt from "@/assets/items/shirt.png";
import aloha from "@/assets/items/aloha.png";
import cowboyboots from "@/assets/items/cowboyboots.png";
import cowboyhat from "@/assets/items/cowboyhat.png";
import guitar from "@/assets/items/guitar.png";
import trunks from "@/assets/items/trunks.png";
import swimsuit from "@/assets/items/swimsuit.png";
import sandals from "@/assets/items/sandals.png";
import sunglasses from "@/assets/items/sunglasses.png";
import sunscreen from "@/assets/items/sunscreen.png";
import towel from "@/assets/items/towel.png";

/**
 * Realistic packed-size library. `shape` is the packed footprint in the artwork's native
 * orientation (rows = top→bottom). Levels may only use an item in a rotation of this shape.
 */
export interface PackedSize {
  shape: Shape;
  art?: string;
}

const rect = (w: number, h: number): Shape => Array.from({ length: h }, () => Array(w).fill(1));

export const PACKED_SIZES: Record<string, PackedSize> = {
  sunglasses: { shape: rect(2, 1), art: sunglasses },
  sunscreen: { shape: rect(1, 2), art: sunscreen },
  tee: { shape: rect(2, 2) },
  shirt: { shape: rect(2, 2), art: shirt },
  aloha: { shape: rect(2, 2), art: aloha },
  linen: { shape: rect(2, 2) },
  jeans: { shape: rect(2, 3), art: jeans },
  shorts: { shape: rect(2, 2) },
  trunks: { shape: rect(2, 2), art: trunks },
  swimsuit: { shape: rect(2, 2), art: swimsuit },
  sandals: { shape: rect(2, 2), art: sandals },
  sneakers: { shape: rect(2, 2) },
  cowboyboots: { shape: rect(3, 2), art: cowboyboots },
  boots: { shape: rect(3, 2) },
  camera: { shape: rect(2, 2) },
  toiletry: { shape: rect(2, 2) },
  sunhat: { shape: [[0, 1, 0], [1, 1, 1]] },
  cowboyhat: { shape: [[0, 1, 0], [1, 1, 1]], art: cowboyhat },
  jacket: { shape: rect(3, 3) },
  umbrella: { shape: rect(1, 4) },
  scarf: { shape: rect(1, 3) },
  guitar: { shape: rect(4, 1), art: guitar },
  towel: { shape: rect(4, 1), art: towel },
};

export const packedArea = (id: string) => PACKED_SIZES[id].shape.flat().filter(Boolean).length;

/** Levels whose items all follow the realistic size library (enforced by tests). */
export const SIZE_CHECKED_LEVELS = ["nashville", "miami"];
