export type Shape = number[][];
export type Rotation = 0 | 1 | 2 | 3;

export interface PackingItemDefinition {
  id: string;
  name: string;
  category: "clothes" | "shoes" | "toiletries" | "electronics" | "essentials" | "accessories";
  emoji: string;
  /** Fabric color of the packing cube (content data, not theme). */
  color: string;
  weight: number;
  rotationAllowed: boolean;
  destinationTags: string[];
}

export interface LevelItem {
  instanceId: string;
  itemId: string;
  /** Shape in its solution orientation. */
  shape: Shape;
  solution: { row: number; col: number };
  trayRotation: Rotation;
}

export interface Cell {
  row: number;
  col: number;
}

export interface StartingPlacement extends Cell {
  rotation: Rotation;
}

export type LevelType = "standard" | "forgot";

export interface LevelDefinition {
  id: string;
  levelNumber: number;
  type: LevelType;
  destination: string;
  country: string;
  flag: string;
  landmark: string;
  tripType: string;
  days: number;
  weather: string;
  tagline: string;
  rows: number;
  cols: number;
  blockedCells: Cell[];
  items: LevelItem[];
  startingPlacements: Record<string, StartingPlacement>;
  missingInstanceId?: string | undefined;
  missingMessage?: string | undefined;
  weightLimit: number | null;
  parMoves: number;
  /** For Forgot It!: verified minimum number of packed-item relocations before the missing item fits. */
  minimumMeaningfulMoves: number;
  /** Usable suitcase cells (grid minus blocked). */
  usableCells: number;
  /** Designer's intended final layout, derived from the authored grid. */
  intendedSolution: { instanceId: string; row: number; col: number; rotation: Rotation }[];
  /** Production gate: the solver must find between 1 and this many final arrangements. */
  maxSolutions: number;
  passportStampId: string;
}

export interface ItemState {
  rotation: Rotation;
  placement: Cell | null;
}

export type GameItems = Record<string, ItemState>;

export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestMoves: number | null;
  hintUsed: boolean;
}

export interface PassportStamp {
  id: string;
  destination: string;
  country: string;
  earnedAt: string;
}

export interface PlayerProgress {
  unlockedLevel: number;
  levels: Record<string, LevelProgress>;
  stamps: Record<string, PassportStamp>;
}
