export type TransportType = "plane";
export type MapRegion = "usa" | "north-america" | "atlantic" | "pacific" | "europe";

export interface LevelTransition {
  fromDestinationId: string;
  toDestinationId: string;
  transportType: TransportType;
  mapRegion: MapRegion;
}

const regionFor = (from: number, to: number): MapRegion => {
  if (to <= 5) return "usa";
  if (to <= 7) return "north-america";
  if (to === 8) return "atlantic";
  if (to === 9) return "pacific";
  return "europe";
};

export function transitionFor(fromDestinationId: string, toDestinationId: string, fromLevel: number, toLevel: number): LevelTransition {
  return { fromDestinationId, toDestinationId, transportType: "plane", mapRegion: regionFor(fromLevel, toLevel) };
}
