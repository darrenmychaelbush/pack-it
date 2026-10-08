import { describe, expect, it } from "vitest";
import { LEVELS } from "@/game/levels";
import { DESTINATION_COORDINATES } from "@/game/destinations";
import { createTravelGeography, TRAVEL_DURATION_MS } from "@/game/geography";

describe("Geographic travel", () => {
  it("has coordinates for every playable destination", () => {
    for (const level of LEVELS) expect(DESTINATION_COORDINATES[level.id]).toBeDefined();
  });
  const journeys = [
    ["nashville", "miami", 1, 1],
    ["miami", "san-diego", -1, -1],
    ["san-diego", "new-york", 1, -1],
    ["new-york", "honolulu", -1, 1],
    ["honolulu", "mexico-city", 1, 1],
    ["vancouver", "london", 1, -1],
    ["london", "tokyo", 1, 1],
    ["tokyo", "paris", -1, -1],
  ] as const;
  for (const [from, to, dx, dy] of journeys) {
    it(`${from} → ${to} follows geography and fits both endpoints`, () => {
      const route = createTravelGeography(from, to);
      expect(Math.sign(route.destination[0] - route.origin[0])).toBe(dx);
      expect(Math.sign(route.destination[1] - route.origin[1])).toBe(dy);
      for (const p of [route.origin, route.destination]) {
        expect(p[0]).toBeGreaterThanOrEqual(100);
        expect(p[0]).toBeLessThanOrEqual(500);
        expect(p[1]).toBeGreaterThanOrEqual(100);
        expect(p[1]).toBeLessThanOrEqual(540);
      }
      const coords = DESTINATION_COORDINATES[from];
      expect(route.coordinates[0][0]).toBeCloseTo(coords.longitude, 4);
      expect(route.coordinates[0][1]).toBeCloseTo(coords.latitude, 4);
      expect(route.planeAt(0).x).toBeCloseTo(route.origin[0]);
      expect(route.planeAt(1).x).toBeCloseTo(route.destination[0]);
      expect(route.planeAt(1).y).toBeCloseTo(route.destination[1]);
      expect(route.planeAt(0.5).heading).toBeTypeOf("number");
    });
  }
  it("finishes all distances within the requested 1.6–2.2 seconds", () => {
    expect(TRAVEL_DURATION_MS).toBeGreaterThanOrEqual(1600);
    expect(TRAVEL_DURATION_MS).toBeLessThanOrEqual(2200);
  });
  it("changes airplane heading along the Eurasian great-circle route", () => {
    const route = createTravelGeography("london", "tokyo");
    expect(Math.abs(route.planeAt(0).heading - route.planeAt(0.9).heading)).toBeGreaterThan(20);
  });
});