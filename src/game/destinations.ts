export interface DestinationCoordinates { latitude: number; longitude: number }

export const DESTINATION_COORDINATES: Record<string, DestinationCoordinates> = {
  nashville: { latitude: 36.1627, longitude: -86.7816 },
  miami: { latitude: 25.7617, longitude: -80.1918 },
  "san-diego": { latitude: 32.7157, longitude: -117.1611 },
  "new-york": { latitude: 40.7128, longitude: -74.0060 },
  honolulu: { latitude: 21.3099, longitude: -157.8581 },
  "mexico-city": { latitude: 19.4326, longitude: -99.1332 },
  vancouver: { latitude: 49.2827, longitude: -123.1207 },
  london: { latitude: 51.5072, longitude: -0.1276 },
  tokyo: { latitude: 35.6762, longitude: 139.6503 },
  paris: { latitude: 48.8566, longitude: 2.3522 },
  santorini: { latitude: 36.3932, longitude: 25.4615 },
};