import * as THREE from "three";

/**
 * Convert longitude/latitude to 3D position on a sphere
 * @param longitude - Longitude in degrees (-180 to 180)
 * @param latitude - Latitude in degrees (-90 to 90)
 * @param radius - Sphere radius
 * @returns 3D position as [x, y, z]
 */
export function lonLatToPosition(
  longitude: number,
  latitude: number,
  radius: number
): [number, number, number] {
  // Convert to radians
  const lonRad = (longitude * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;

  // Convert to 3D coordinates
  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lonRad);

  return [x, y, z];
}

/**
 * Convert 3D position to longitude/latitude
 * @param position - 3D position as THREE.Vector3 or [x, y, z]
 * @param radius - Sphere radius
 * @returns Object with longitude and latitude in degrees
 */
export function positionToLonLat(
  position: THREE.Vector3 | [number, number, number],
  radius: number
): { longitude: number; latitude: number } {
  let x, y, z;

  if (Array.isArray(position)) {
    [x, y, z] = position;
  } else {
    x = position.x;
    y = position.y;
    z = position.z;
  }

  // Normalize to unit sphere
  const normalizedY = y / radius;
  const normalizedX = x / radius;
  const normalizedZ = z / radius;

  // Calculate latitude (in radians, then convert to degrees)
  const latitude =
    Math.asin(Math.max(-1, Math.min(1, normalizedY))) * (180 / Math.PI);

  // Calculate longitude (in radians, then convert to degrees)
  const longitude = Math.atan2(normalizedZ, normalizedX) * (180 / Math.PI);

  return {
    longitude: longitude,
    latitude: latitude,
  };
}

/**
 * Get the position of a major city on Earth
 * @param city - City name
 * @param radius - Earth radius in your 3D space
 * @returns 3D position or null if city not found
 */
export function getCityPosition(
  city: string,
  radius: number
): [number, number, number] | null {
  const cities: Record<string, { lat: number; lon: number }> = {
    "new york": { lat: 40.7128, lon: -74.006 },
    london: { lat: 51.5074, lon: -0.1278 },
    tokyo: { lat: 35.6762, lon: 139.6503 },
    paris: { lat: 48.8566, lon: 2.3522 },
    sydney: { lat: -33.8688, lon: 151.2093 },
    moscow: { lat: 55.7558, lon: 37.6173 },
    beijing: { lat: 39.9042, lon: 116.4074 },
    mumbai: { lat: 19.076, lon: 72.8777 },
    "sao paulo": { lat: -23.5505, lon: -46.6333 },
    cairo: { lat: 30.0444, lon: 31.2357 },
  };

  const cityData = cities[city.toLowerCase()];
  if (!cityData) return null;

  return lonLatToPosition(cityData.lon, cityData.lat, radius);
}

/**
 * Format longitude/latitude for display
 * @param longitude - Longitude in degrees
 * @param latitude - Latitude in degrees
 * @returns Formatted string like "40.71°N, 74.01°W"
 */
export function formatCoordinates(longitude: number, latitude: number): string {
  const latDir = latitude >= 0 ? "N" : "S";
  const lonDir = longitude >= 0 ? "E" : "W";

  return `${Math.abs(latitude).toFixed(2)}°${latDir}, ${Math.abs(
    longitude
  ).toFixed(2)}°${lonDir}`;
}
