import { rotateN, shapesEqual } from "./engine";
import type { Cell, LevelDefinition, LevelItem, Rotation, Shape, StartingPlacement } from "./types";

interface Blob { shape: Shape; row: number; col: number }

function parseGrid(grid: string[]) {
  const blobs: Record<string, Cell[]> = {};
  const blocked: Cell[] = [];
  grid.forEach((line, r) => [...line].forEach((ch, c) => {
    if (ch === "#") blocked.push({ row: r, col: c });
    else if (ch !== ".") (blobs[ch] ??= []).push({ row: r, col: c });
  }));
  const out: Record<string, Blob> = {};
  for (const [k, cells] of Object.entries(blobs)) {
    const r0 = Math.min(...cells.map((c) => c.row));
    const c0 = Math.min(...cells.map((c) => c.col));
    const h = Math.max(...cells.map((c) => c.row)) - r0 + 1;
    const w = Math.max(...cells.map((c) => c.col)) - c0 + 1;
    const shape: Shape = Array.from({ length: h }, () => Array(w).fill(0));
    cells.forEach((c) => { shape[c.row - r0][c.col - c0] = 1; });
    out[k] = { shape, row: r0, col: c0 };
  }
  return { blobs: out, blocked, rows: grid.length, cols: grid[0].length };
}

interface LevelSpec extends Omit<LevelDefinition, "rows" | "cols" | "blockedCells" | "items" | "startingPlacements" | "missingInstanceId" | "parMoves" | "weightLimit" | "passportStampId" | "usableCells" | "intendedSolution" | "maxSolutions" | "minimumMeaningfulMoves"> {
  grid: string[];
  legend: Record<string, string>;
  scramble?: "none" | "some" | "all";
  start?: string[];
  missing?: string;
  slack?: number;
  par?: number;
  maxSolutions?: number;
  minimumMeaningfulMoves?: number;
}

function buildLevel(spec: LevelSpec): LevelDefinition {
  const { grid, legend, scramble = "none", start, missing, slack = 2, par, maxSolutions = 1, minimumMeaningfulMoves = 0, ...meta } = spec;
  const parsed = parseGrid(grid);
  const keys = Object.keys(parsed.blobs).sort();
  const items: LevelItem[] = keys.map((k, i) => {
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
      const it = items.find((i) => i.instanceId === `${legend[k]}-${k}`);
      if (!it) throw new Error(`Unknown start item ${k} in ${meta.id}`);
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
    minimumMeaningfulMoves,
    usableCells: parsed.rows * parsed.cols - parsed.blocked.length,
    intendedSolution: items.map((i) => ({ instanceId: i.instanceId, row: i.solution.row, col: i.solution.col, rotation: 0 as Rotation })),
    maxSolutions,
    passportStampId: `stamp-${meta.id}`,
  };
}

export const LEVELS: LevelDefinition[] = [
  // Levels 1–2 are the approved baseline and intentionally unchanged.
  buildLevel({
    id: "nashville", levelNumber: 1, type: "standard", destination: "Nashville", country: "USA", flag: "🇺🇸", landmark: "🎸",
    tripType: "City Trip", days: 3, weather: "68° – 79°", tagline: "Boots, hats and live music on Broadway.",
    grid: ["AAE##.", "AAECCC", "AAECCC", "#DEBB#", "DDDBB."],
    legend: { A: "jeans", B: "shirt", C: "cowboyboots", D: "cowboyhat", E: "guitar" },
  }),
  buildLevel({
    id: "miami", levelNumber: 2, type: "standard", destination: "Miami", country: "USA", flag: "🇺🇸", landmark: "🌴",
    tripType: "Beach Trip", days: 4, weather: "78° – 88°", tagline: "Sun, sand and Art Deco nights.",
    grid: ["AADDDD", "AA.EE#", ".FFEEC", "#FFGGC", "BB#GG#"],
    legend: { A: "trunks", B: "sunglasses", C: "sunscreen", D: "towel", E: "swimsuit", F: "sandals", G: "aloha" },
  }),
  buildLevel({
    id: "san-diego", levelNumber: 3, type: "standard", destination: "San Diego", country: "USA", flag: "🇺🇸", landmark: "🌊",
    tripType: "Coastal Trip", days: 3, weather: "66° – 75°", tagline: "Make the long beach towel work for you.",
    grid: ["DDFFFF#", "#BBCCGG", ".BBCCGG", "#AAEEGG", ".AAEE#."],
    legend: { A: "shirt", B: "shorts", C: "sneakers", D: "sunscreen", E: "camera", F: "towel", G: "jacket" },
    scramble: "some", maxSolutions: 2,
  }),
  buildLevel({
    id: "new-york", levelNumber: 4, type: "forgot", destination: "New York", country: "USA", flag: "🇺🇸", landmark: "🗽",
    tripType: "Forgot It!", days: 4, weather: "55° – 66°", tagline: "Packed for Manhattan… except for one thing.",
    missingMessage: "You forgot your dress shoes. Make room without unpacking!",
    grid: ["HHBBAA", "HHBBAA", "CCC#AA", "CCCGG#", "EEFFDD", "EEFFDD"],
    start: ["CCBBAA", "CCBBAA", "CC.#AA", "EEFF.#", "EEFFDD", "GG..DD"],
    legend: { A: "jeans", B: "shirt", C: "jacket", D: "sneakers", E: "camera", F: "toiletry", G: "charger", H: "dressshoes" },
    missing: "H", par: 6, minimumMeaningfulMoves: 4,
  }),
  buildLevel({
    id: "honolulu", levelNumber: 5, type: "standard", destination: "Honolulu", country: "USA", flag: "🇺🇸", landmark: "🌺",
    tripType: "Vacation", days: 5, weather: "75° – 85°", tagline: "Turn the long gear around to make it fit.",
    grid: ["#HGGGG", "HHHCC#", "#BBCC.", "EBBFF#", "EAAFFD", "EAA.#D"],
    legend: { A: "swimsuit", B: "shorts", C: "sandals", D: "sunscreen", E: "snorkel", F: "shirt", G: "towel", H: "sunhat" },
    scramble: "all", maxSolutions: 2,
  }),
  buildLevel({
    id: "mexico-city", levelNumber: 6, type: "forgot", destination: "Mexico City", country: "Mexico", flag: "🇲🇽", landmark: "🌮",
    tripType: "Forgot It!", days: 5, weather: "54° – 75°", tagline: "Markets, murals… and a camera left behind.",
    missingMessage: "You forgot your camera bag. Repack without removing anything!",
    grid: ["FFGGGG", "FFEEE#", "BBEEEH", "BBAAAH", "DDAAA#", "DDCCII", ".#CCII"],
    start: ["FFEEE.", "FFEEE#", "BBHH..", "BBGGGG", "DDAA.#", "DDAACC", ".#AACC"],
    legend: { A: "jeans", B: "shirt", C: "aloha", D: "sneakers", E: "jacket", F: "toiletry", G: "umbrella", H: "charger", I: "camerabag" },
    missing: "I", par: 11, minimumMeaningfulMoves: 9,
  }),
  buildLevel({
    id: "vancouver", levelNumber: 7, type: "standard", destination: "Vancouver", country: "Canada", flag: "🇨🇦", landmark: "🏔️",
    tripType: "Adventure Trip", days: 5, weather: "48° – 62°", tagline: "Bulky trail gear leaves no room to waste.",
    grid: ["D#GG#E", "DCCBBE", "DCCBBE", "HHHBBE", "HHHAAA", "#FFAAA", ".FFAAA"],
    legend: { A: "raincoat", B: "boots", C: "camera", D: "scarf", E: "umbrella", F: "sweater", G: "gloves", H: "hikingpants" },
    scramble: "some",
  }),
  buildLevel({
    id: "london", levelNumber: 8, type: "forgot", destination: "London", country: "United Kingdom", flag: "🇬🇧", landmark: "💂",
    tripType: "Forgot It! · Hard", days: 5, weather: "50° – 61°", tagline: "Even a small adapter can cause a big problem.",
    missingMessage: "You forgot your travel adapter. Find the six-move chain!",
    grid: ["DDHHC#I", "DDHHCCI", "AAAGGCI", "AAAGGBB", "AAAJJBB", "#FFJJBB", "FFFEEEE"],
    start: ["DDHH.#.", "DDHH.C.", "AAAGGCC", "AAAGGEC", "AAABBEI", "#FFBBEI", "FFFBBEI"],
    legend: { A: "trench", B: "jeans", C: "dressshoes", D: "sweater", E: "umbrella", F: "camera", G: "toiletry", H: "shirt", I: "scarf", J: "adapterkit" },
    missing: "J", par: 8, minimumMeaningfulMoves: 6,
  }),
  buildLevel({
    id: "tokyo", levelNumber: 9, type: "standard", destination: "Tokyo", country: "Japan", flag: "🇯🇵", landmark: "🗼",
    tripType: "International City Trip", days: 6, weather: "58° – 70°", tagline: "Every narrow space matters in Tokyo.",
    grid: ["#CC##DD#", "JCCGGDD#", "JEEGGAAA", "#EEGGAAA", "HHFFIIII", "HHFFBBB#", "#KK#BBB#"],
    legend: { A: "jacket", B: "jeans", C: "shirt", D: "aloha", E: "sneakers", F: "camera", G: "daybag", H: "toiletry", I: "umbrella", J: "powerbank", K: "adapter" },
    scramble: "all", par: 13,
  }),
  buildLevel({
    id: "paris", levelNumber: 10, type: "standard", destination: "Paris", country: "France", flag: "🇫🇷", landmark: "🗼",
    tripType: "Milestone City Trip", days: 6, weather: "57° – 68°", tagline: "Your first packing masterclass.",
    grid: ["CCBB##J#", "CCBBHHJI", "CCBBHHJI", "#GGEEAAI", "KGGEEAAI", "KDDFFAA#", "#DDFF###"],
    legend: { A: "jacket", B: "dress", C: "jeans", D: "shirt", E: "dressshoes", F: "sneakers", G: "camera", H: "toiletry", I: "umbrella", J: "scarf", K: "accessory" },
    scramble: "all", par: 14,
  }),
  buildLevel({
    id: "santorini", levelNumber: 11, type: "standard", destination: "Santorini", country: "Greece", flag: "🇬🇷", landmark: "🏛️",
    tripType: "Beach Trip", days: 3, weather: "72° – 82°", tagline: "Whitewashed cliffs and Aegean blue.",
    grid: ["AAABBCC#", "DAAABBCC", "DDEEBCCF", "DDEE#GGF", "DIIHHGFF", "IIIHGGFJ", "IIIHHGFJ", "##.HGGJJ"],
    legend: { A: "sandals", B: "shorts", C: "linen", D: "sunhat", E: "camera", F: "sunscreen", G: "swimsuit", H: "toiletry", I: "towel", J: "sunglasses" },
    scramble: "some", slack: 1,
  }),
];

export function getLevel(id: string) { return LEVELS.find((l) => l.id === id); }
export function getNextLevel(level: LevelDefinition) { return LEVELS.find((l) => l.levelNumber === level.levelNumber + 1); }
