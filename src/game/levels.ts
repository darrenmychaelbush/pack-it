import { rotateN, shapesEqual } from "./engine";
import type { Cell, LevelDefinition, LevelItem, Rotation, Shape, StartingPlacement } from "./types";

interface Blob {
  shape: Shape;
  row: number;
  col: number;
}

function parseGrid(grid: string[]) {
  const blobs: Record<string, Cell[]> = {};
  const blocked: Cell[] = [];
  grid.forEach((line, r) =>
    [...line].forEach((ch, c) => {
      if (ch === "#") blocked.push({ row: r, col: c });
      else if (ch !== ".") (blobs[ch] ??= []).push({ row: r, col: c });
    }),
  );
  const out: Record<string, Blob> = {};
  for (const [k, cells] of Object.entries(blobs)) {
    const r0 = Math.min(...cells.map((c) => c.row));
    const c0 = Math.min(...cells.map((c) => c.col));
    const h = Math.max(...cells.map((c) => c.row)) - r0 + 1;
    const w = Math.max(...cells.map((c) => c.col)) - c0 + 1;
    const shape: Shape = Array.from({ length: h }, () => Array(w).fill(0));
    cells.forEach((c) => (shape[c.row - r0][c.col - c0] = 1));
    out[k] = { shape, row: r0, col: c0 };
  }
  return { blobs: out, blocked, rows: grid.length, cols: grid[0].length };
}

interface LevelSpec extends Omit<LevelDefinition, "rows" | "cols" | "blockedCells" | "items" | "startingPlacements" | "missingInstanceId" | "parMoves" | "weightLimit" | "passportStampId"> {
  grid: string[];
  legend: Record<string, string>;
  scramble?: "none" | "some" | "all";
  start?: string[];
  missing?: string;
  slack?: number;
  par?: number;
}

function buildLevel(spec: LevelSpec): LevelDefinition {
  const { grid, legend, scramble = "none", start, missing, slack = 2, par, ...meta } = spec;
  const parsed = parseGrid(grid);
  const items: LevelItem[] = Object.keys(parsed.blobs)
    .sort()
    .map((k, i) => {
      const b = parsed.blobs[k];
      let trayRotation: Rotation = 0;
      if (scramble === "all") trayRotation = i % 2 ? 3 : 1;
      if (scramble === "some" && i % 2 === 1) trayRotation = 1;
      return { instanceId: `${legend[k]}-${k}`, itemId: legend[k], shape: b.shape, solution: { row: b.row, col: b.col }, trayRotation };
    });
  const startingPlacements: Record<string, StartingPlacement> = {};
  if (start) {
    const s = parseGrid(start);
    for (const [k, b] of Object.entries(s.blobs)) {
      const it = items.find((i) => i.instanceId === `${legend[k]}-${k}`)!;
      const rot = ([0, 1, 2, 3] as Rotation[]).find((n) => shapesEqual(rotateN(it.shape, n), b.shape));
      if (rot === undefined) throw new Error(`Start shape mismatch for ${k} in ${meta.id}`);
      startingPlacements[it.instanceId] = { row: b.row, col: b.col, rotation: rot };
    }
  }
  return {
    ...meta,
    rows: parsed.rows,
    cols: parsed.cols,
    blockedCells: parsed.blocked,
    items,
    startingPlacements,
    missingInstanceId: missing ? `${legend[missing]}-${missing}` : undefined,
    weightLimit: null,
    parMoves: par ?? items.length + slack,
    passportStampId: `stamp-${meta.id}`,
  };
}

const START_FORGOT = [".DDDD.", ".DDDD.", ".BB..F", "EBBAAF", "EE.AA.", "E.CC..", "..CC.."];

export const LEVELS: LevelDefinition[] = [
  buildLevel({
    id: "nashville", levelNumber: 1, type: "standard", destination: "Nashville", country: "USA", flag: "🇺🇸", landmark: "🎸",
    tripType: "City Trip", days: 3, weather: "68° – 79°", tagline: "Boots, hats and live music on Broadway.",
    grid: ["AABB..", "AABBDD", "..BBDD", "CCC.DD", "......", "......"],
    legend: { A: "shirt", B: "jeans", C: "sneakers", D: "cowboyhat" },
  }),
  buildLevel({
    id: "miami", levelNumber: 2, type: "standard", destination: "Miami", country: "USA", flag: "🇺🇸", landmark: "🌴",
    tripType: "Beach Trip", days: 4, weather: "78° – 88°", tagline: "Sun, sand and Art Deco nights.",
    grid: ["AABBDD", "AABBDD", "CCCEDD", ".C.EDD", "......", "......"],
    legend: { A: "aloha", B: "trunks", C: "swimsuit", D: "towel", E: "sunscreen" },
  }),
  buildLevel({
    id: "san-diego", levelNumber: 3, type: "standard", destination: "San Diego", country: "USA", flag: "🇺🇸", landmark: "🌊",
    tripType: "Beach Trip", days: 3, weather: "66° – 75°", tagline: "Surf breaks and sunset tacos.",
    grid: ["AAAAA.", "BBBB..", "CC.DD.", "CC..D.", "EE....", "......", "......"],
    legend: { A: "towel", B: "sandals", C: "shirt", D: "camera", E: "sunscreen" },
    scramble: "some",
  }),
  buildLevel({
    id: "new-york", levelNumber: 4, type: "standard", destination: "New York", country: "USA", flag: "🇺🇸", landmark: "🗽",
    tripType: "City Trip", days: 4, weather: "55° – 66°", tagline: "Museums by day, Broadway by night.",
    grid: ["AAABBD", "AAABBD", "A.ABBD", "FFFEED", "FFF.E.", "CCC...", "......"],
    legend: { A: "coat", B: "jeans", C: "sneakers", D: "umbrella", E: "camera", F: "toiletry" },
    scramble: "some",
  }),
  buildLevel({
    id: "miami-forgot", levelNumber: 5, type: "forgot", destination: "Miami", country: "USA", flag: "🇺🇸", landmark: "🩴",
    tripType: "Forgot It!", days: 4, weather: "80° – 89°", tagline: "Your bag is packed… almost.",
    missingMessage: "You forgot your beach sandals. Make room so they fit!",
    grid: ["AABBCC", "AABBCC", "DDDDF.", "DDDDF.", "EEE...", ".E....", "GGGG.."],
    start: START_FORGOT,
    legend: { A: "aloha", B: "trunks", C: "sunhat", D: "towel", E: "swimsuit", F: "sunscreen", G: "sandals" },
    missing: "G",
    par: 5,
  }),
  buildLevel({
    id: "honolulu", levelNumber: 6, type: "standard", destination: "Honolulu", country: "USA", flag: "🇺🇸", landmark: "🌺",
    tripType: "Vacation", days: 5, weather: "75° – 85°", tagline: "Turn things around to make them fit.",
    grid: ["AAABBBB", "AAABBBB", "CC.DD.E", "CC.DD.E", "CCFFF.E", "...F..E", "......."],
    legend: { A: "toiletry", B: "towel", C: "dress", D: "lei", E: "snorkel", F: "swimsuit" },
    scramble: "all",
  }),
  buildLevel({
    id: "mexico-city", levelNumber: 7, type: "standard", destination: "Mexico City", country: "Mexico", flag: "🇲🇽", landmark: "🌮",
    tripType: "City Trip", days: 5, weather: "54° – 75°", tagline: "Markets, murals and mole.",
    grid: ["AAABBCC", "AAABBCC", "AAABBDD", "EEEE.DD", "FF.GGG.", "FF.GGG.", "FF.....", "......."],
    legend: { A: "poncho", B: "jeans", C: "shirt", D: "sombrero", E: "scarf", F: "sweater", G: "toiletry" },
    scramble: "some",
  }),
  buildLevel({
    id: "vancouver", levelNumber: 8, type: "standard", destination: "Vancouver", country: "Canada", flag: "🇨🇦", landmark: "🏔️",
    tripType: "Adventure Trip", days: 5, weather: "48° – 62°", tagline: "Mountains, rain and odd-shaped gear.",
    grid: ["AAAB.CC", "AAAB.C.", "A.ABBC.", "DDDDD.E", "FFF.GGE", "FFF.G.E", "....G.E", "......."],
    legend: { A: "jacket", B: "boots", C: "camera", D: "scarf", E: "umbrella", F: "sweater", G: "gloves" },
    scramble: "some",
    slack: 1,
  }),
  buildLevel({
    id: "london", levelNumber: 9, type: "standard", destination: "London", country: "United Kingdom", flag: "🇬🇧", landmark: "💂",
    tripType: "International Trip", days: 5, weather: "50° – 61°", tagline: "Watch out for the wheels and handle.",
    grid: ["#AAAB.#", "CAAAB.D", "C.EEBBD", "C.EE..D", "FFFF..D", "GG.HHH.", "GG..H..", "#GG...#"],
    legend: { A: "trench", B: "boots", C: "sneakers", D: "scarf", E: "tea", F: "umbrella", G: "sweater", H: "tee" },
    scramble: "some",
    slack: 1,
  }),
  buildLevel({
    id: "paris", levelNumber: 10, type: "standard", destination: "Paris", country: "France", flag: "🇫🇷", landmark: "🗼",
    tripType: "City Trip", days: 5, weather: "57° – 68°", tagline: "Every trick you've learned, all at once.",
    grid: ["AAABBBCC", "AAABBBCC", "A.ABBBDD", "EEEE..DD", "FFGGG.HH", "FF.G..HH", "FF......", "........"],
    legend: { A: "trench", B: "dress", C: "beret", D: "macarons", E: "baguette", F: "jeans", G: "tee", H: "camera" },
    scramble: "all",
    slack: 1,
  }),
  buildLevel({
    id: "santorini", levelNumber: 11, type: "standard", destination: "Santorini", country: "Greece", flag: "🇬🇷", landmark: "🏛️",
    tripType: "3-Day Beach Trip", days: 3, weather: "72° – 82°", tagline: "Whitewashed cliffs and Aegean blue.",
    grid: ["AAA.BB..", "AAA.BB..", "CCC.DDDD", ".C......", "EE.FF.GG", "EE..F...", "H.......", "H.......", "........"],
    legend: { A: "linen", B: "shorts", C: "swimsuit", D: "sandals", E: "sunhat", F: "camera", G: "sunglasses", H: "sunscreen" },
    scramble: "some",
  }),
];

export function getLevel(id: string) {
  return LEVELS.find((l) => l.id === id);
}

export function getNextLevel(level: LevelDefinition) {
  return LEVELS.find((l) => l.levelNumber === level.levelNumber + 1);
}
