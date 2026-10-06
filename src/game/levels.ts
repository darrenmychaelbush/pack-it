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

interface LevelSpec extends Omit<LevelDefinition, "rows" | "cols" | "blockedCells" | "items" | "startingPlacements" | "missingInstanceId" | "parMoves" | "weightLimit" | "passportStampId" | "usableCells" | "intendedSolution" | "maxSolutions"> {
  grid: string[];
  legend: Record<string, string>;
  scramble?: "none" | "some" | "all";
  start?: string[];
  missing?: string;
  slack?: number;
  par?: number;
  maxSolutions?: number;
}

function buildLevel(spec: LevelSpec): LevelDefinition {
  const { grid, legend, scramble = "none", start, missing, slack = 2, par, maxSolutions = 1, ...meta } = spec;
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
    usableCells: parsed.rows * parsed.cols - parsed.blocked.length,
    intendedSolution: items.map((i) => ({ instanceId: i.instanceId, row: i.solution.row, col: i.solution.col, rotation: 0 as Rotation })),
    maxSolutions,
    passportStampId: `stamp-${meta.id}`,
  };
}

const START_FORGOT = [".CCCCE.", ".CFDDEE", "HHFFDDD", "GHHFDAD", "GGGGDAD", "...GAAA"];

export const LEVELS: LevelDefinition[] = [
  buildLevel({
    id: "nashville", levelNumber: 1, type: "standard", destination: "Nashville", country: "USA", flag: "🇺🇸", landmark: "🎸",
    tripType: "City Trip", days: 3, weather: "68° – 79°", tagline: "Boots, hats and live music on Broadway.",
    grid: ["AB.C#", "ABBCC", "ABCCE", "ADDCE", "DD.CE"],
    legend: { A: "jeans", B: "shirt", C: "boots", D: "cowboyhat", E: "guitar" },
    maxSolutions: 2,
  }),
  buildLevel({
    id: "miami", levelNumber: 2, type: "standard", destination: "Miami", country: "USA", flag: "🇺🇸", landmark: "🌴",
    tripType: "Beach Trip", days: 4, weather: "78° – 88°", tagline: "Sun, sand and Art Deco nights.",
    grid: ["AABBBB", "AADDDC", "DDDECC", "FFEEEE", ".FF.E."],
    legend: { A: "trunks", B: "sunglasses", C: "sunscreen", D: "towel", E: "aloha", F: "swimsuit" },
    maxSolutions: 2,
  }),
  buildLevel({
    id: "san-diego", levelNumber: 3, type: "standard", destination: "San Diego", country: "USA", flag: "🇺🇸", landmark: "🌊",
    tripType: "Beach Trip", days: 3, weather: "66° – 75°", tagline: "Surf breaks and sunset tacos.",
    grid: ["BBACCC", "BAAACF", "EEA#DF", "EEDDDF", "#GGDFF", "#.GGF#"],
    legend: { A: "shirt", B: "camera", C: "shorts", D: "towel", E: "sunhat", F: "sandals", G: "sunscreen" },
    scramble: "some", maxSolutions: 2,
  }),
  buildLevel({
    id: "new-york", levelNumber: 4, type: "standard", destination: "New York", country: "USA", flag: "🇺🇸", landmark: "🗽",
    tripType: "City Trip", days: 4, weather: "55° – 66°", tagline: "Museums by day, Broadway by night.",
    grid: ["AAABBC#", "DABBCCC", "DAGEECF", "DAG#EEF", "GGGGHFF", ".G.HHHH"],
    legend: { A: "coat", B: "sneakers", C: "sweater", D: "umbrella", E: "camera", F: "scarf", G: "jeans", H: "toiletry" },
    scramble: "some",
  }),
  buildLevel({
    id: "miami-forgot", levelNumber: 5, type: "forgot", destination: "Miami", country: "USA", flag: "🇺🇸", landmark: "🩴",
    tripType: "Forgot It!", days: 4, weather: "80° – 89°", tagline: "Your bag is packed… almost.",
    missingMessage: "You forgot your beach sandals. Make room so they fit!",
    grid: ["AAABECC", "DADBEEC", "DADBGGC", "DDDBGFC", "HHDDGFF", "#HHGG.F"],
    start: START_FORGOT,
    legend: { A: "aloha", B: "sandals", C: "towel", D: "dress", E: "sunscreen", F: "snorkel", G: "swimsuit", H: "sunglasses" },
    missing: "B",
    par: 6,
  }),
  buildLevel({
    id: "honolulu", levelNumber: 6, type: "standard", destination: "Honolulu", country: "USA", flag: "🇺🇸", landmark: "🌺",
    tripType: "Vacation", days: 5, weather: "75° – 85°", tagline: "Turn things around to make them fit.",
    grid: ["AAABCC#", "ADABBCC", "EDDDBCH", "EEEDBBH", "EFGGBHH", "#FFGG##"],
    legend: { A: "toiletry", B: "snorkel", C: "towel", D: "dress", E: "aloha", F: "sunscreen", G: "lei", H: "swimsuit" },
    scramble: "all", maxSolutions: 2,
  }),
  buildLevel({
    id: "mexico-city", levelNumber: 7, type: "standard", destination: "Mexico City", country: "Mexico", flag: "🇲🇽", landmark: "🌮",
    tripType: "City Trip", days: 5, weather: "54° – 75°", tagline: "Markets, murals and mole.",
    grid: ["#DAAABB", "DDABBBE", "CDDDBEE", "CCD#EEF", "CGDHEIF", "GGGHIIF", "#GHH##F"],
    legend: { A: "shirt", B: "jeans", C: "sombrero", D: "poncho", E: "sweater", F: "umbrella", G: "toiletry", H: "camera", I: "sunglasses" },
    scramble: "all", slack: 1,
  }),
  buildLevel({
    id: "vancouver", levelNumber: 8, type: "standard", destination: "Vancouver", country: "Canada", flag: "🇨🇦", landmark: "🏔️",
    tripType: "Adventure Trip", days: 5, weather: "48° – 62°", tagline: "Mountains, rain and odd-shaped gear.",
    grid: ["AABBBCC#", "DAABBBCC", "DDABEECC", "DDAEEFFF", "DGHHEFFF", "GGGHHIII", "#G#HHHII"],
    legend: { A: "scarf", B: "jacket", C: "sweater", D: "boots", E: "camera", F: "toiletry", G: "gloves", H: "coat", I: "umbrella" },
    scramble: "some", slack: 1,
  }),
  buildLevel({
    id: "london", levelNumber: 9, type: "standard", destination: "London", country: "United Kingdom", flag: "🇬🇧", landmark: "💂",
    tripType: "International Trip", days: 5, weather: "50° – 61°", tagline: "Watch out for the wheels and handle.",
    grid: ["#AAAABB#", "CAAABBDF", "CCCEEBDF", "CGGGEEDF", "#HGGEDDF", "HHHIEDJF", "HHIIIJJF", "#H.IJJJ#"],
    legend: { A: "trench", B: "boots", C: "tea", D: "scarf", E: "jeans", F: "umbrella", G: "camera", H: "sweater", I: "tee", J: "toiletry" },
    scramble: "some", slack: 1,
  }),
  buildLevel({
    id: "paris", levelNumber: 10, type: "standard", destination: "Paris", country: "France", flag: "🇫🇷", landmark: "🗼",
    tripType: "City Trip", days: 5, weather: "57° – 68°", tagline: "Every trick you've learned, all at once.",
    grid: ["#AAAABC#", "DDEEABCC", "DDDEEBHC", "#DFFGGHC", "IFFGGHHH", "IIIIGH#H", "IJIJGKKH", "#JJJGKK#"],
    legend: { A: "baguette", B: "umbrella", C: "scarf", D: "dress", E: "macarons", F: "sneakers", G: "trench", H: "jeans", I: "sweater", J: "toiletry", K: "beret" },
    scramble: "all", slack: 1,
  }),
  buildLevel({
    id: "santorini", levelNumber: 11, type: "standard", destination: "Santorini", country: "Greece", flag: "🇬🇷", landmark: "🏛️",
    tripType: "3-Day Beach Trip", days: 3, weather: "72° – 82°", tagline: "Whitewashed cliffs and Aegean blue.",
    grid: ["AAABBCC#", "DAAABBCC", "DDEEBCCF", "DDEE#GGF", "DIIHHGFF", "IIIHGGFJ", "IIIHHGFJ", "##.HGGJJ"],
    legend: { A: "sandals", B: "shorts", C: "linen", D: "sunhat", E: "camera", F: "sunscreen", G: "swimsuit", H: "toiletry", I: "towel", J: "sunglasses" },
    scramble: "some", slack: 1,
  }),
];

export function getLevel(id: string) {
  return LEVELS.find((l) => l.id === id);
}

export function getNextLevel(level: LevelDefinition) {
  return LEVELS.find((l) => l.levelNumber === level.levelNumber + 1);
}
