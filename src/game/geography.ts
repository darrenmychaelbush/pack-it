import { geoArea, geoInterpolate, geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import atlasAsset from "@/assets/maps/countries.asset.json";
import { DESTINATION_COORDINATES } from "./destinations";

export const TRAVEL_DURATION_MS = 2000;
export const REDUCED_TRAVEL_DURATION_MS = 900;
export const ATLAS_WIDTH = 600;
export const ATLAS_HEIGHT = 640;
let atlasPromise: Promise<FeatureCollection> | undefined;

/** Warm during gameplay; subsequent journeys reuse the same decoded geography. */
export function warmTravelAtlas(): Promise<FeatureCollection> {
  atlasPromise ??= fetch(atlasAsset.url).then(async (response) => {
    if (!response.ok) throw new Error(`Atlas unavailable (${response.status})`);
    const data = await response.json() as FeatureCollection;
    // GeoJSON uses right-hand rings; d3 uses clockwise exterior rings.
    for (const feature of data.features) {
      if (geoArea(feature) <= Math.PI * 2) continue;
      const geometry: Geometry = feature.geometry;
      if (geometry.type === "Polygon") geometry.coordinates.forEach((ring) => ring.reverse());
      if (geometry.type === "MultiPolygon") geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => ring.reverse()));
    }
    return data;
  }).catch((error) => { atlasPromise = undefined; throw error; });
  return atlasPromise;
}

export function createTravelGeography(fromId: string, toId: string) {
  const from = DESTINATION_COORDINATES[fromId];
  const to = DESTINATION_COORDINATES[toId];
  if (!from || !to) throw new Error(`Missing destination coordinates: ${fromId} → ${toId}`);
  const origin: [number, number] = [from.longitude, from.latitude];
  const destination: [number, number] = [to.longitude, to.latitude];
  const interpolate = geoInterpolate(origin, destination);
  const center = interpolate(0.5);
  const projection = geoMercator().rotate([-center[0], 0]).scale(1).translate([0, 0]);
  const coordinates = Array.from({ length: 121 }, (_, i) => interpolate(i / 120));
  const raw = coordinates.map((point) => projection(point) ?? [0, 0]);
  const xMin = Math.min(...raw.map((p) => p[0]));
  const xMax = Math.max(...raw.map((p) => p[0]));
  const yMin = Math.min(...raw.map((p) => p[1]));
  const yMax = Math.max(...raw.map((p) => p[1]));
  const scale = Math.min(360 / Math.max(xMax - xMin, 0.03), 340 / Math.max(yMax - yMin, 0.03));
  projection.scale(scale).translate([
    ATLAS_WIDTH / 2 - scale * (xMin + xMax) / 2,
    ATLAS_HEIGHT / 2 - scale * (yMin + yMax) / 2,
  ]).clipExtent([[0, 0], [ATLAS_WIDTH, ATLAS_HEIGHT]]);
  const points = coordinates.map((point) => projection(point) ?? [0, 0]);
  const path = (fraction: number) => {
    const count = Math.max(2, Math.ceil(Math.min(1, Math.max(0, fraction)) * (points.length - 1)) + 1);
    return points.slice(0, count).map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  };
  const planeAt = (fraction: number) => {
    const index = Math.min(points.length - 2, Math.max(0, fraction) * (points.length - 1));
    const whole = Math.floor(index);
    const a = points[whole];
    const b = points[whole + 1];
    const t = index - whole;
    return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, heading: Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI + 90 };
  };
  return { projection, countryPath: geoPath(projection), origin: points[0], destination: points[points.length - 1], path, planeAt, coordinates };
}