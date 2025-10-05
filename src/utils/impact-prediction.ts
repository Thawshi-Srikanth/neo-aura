import { getAsteroidPosition, getEarthPosition } from "./orbital-calculations";
import type { Asteroid } from "../types/asteroid";

/**
 * Calculates the distance between two 3D points
 */
function distance3D(
  p1: [number, number, number],
  p2: [number, number, number]
): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Converts Earth-centered coordinates to latitude/longitude
 */
function cartesianToLatLon(
  x: number,
  y: number,
  z: number
): { lat: number; lon: number } {
  const r = Math.sqrt(x * x + y * y + z * z);
  const lat = Math.asin(z / r) * (180 / Math.PI);
  const lon = Math.atan2(y, x) * (180 / Math.PI);
  return { lat, lon };
}

/**
 * Predicts potential impact details for a given asteroid
 */
export function predictImpact(
  asteroid: Asteroid,
  timeRange: { start: number; end: number; step: number }
) {
  const EARTH_RADIUS_AU = 4.26352e-5; // Earth radius in AU (~6371 km)
  const EARTH_SOI_AU = 0.006; // Earth's sphere of influence in AU (~900,000 km)

  let closestApproach = {
    time: 0,
    distance: Infinity,
    earthPos: [0, 0, 0] as [number, number, number],
    asteroidPos: [0, 0, 0] as [number, number, number],
    impactProbability: 0,
    impactLocation: null as { lat: number; lon: number } | null,
  };

  // Scan through time range to find closest approach
  for (let t = timeRange.start; t <= timeRange.end; t += timeRange.step) {
    try {
      const earthPos = getEarthPosition(t);
      const asteroidPos = getAsteroidPosition(t, asteroid.orbital_data);
      const dist = distance3D(earthPos, asteroidPos);

      if (dist < closestApproach.distance) {
        closestApproach = {
          time: t,
          distance: dist,
          earthPos,
          asteroidPos,
          impactProbability: 0,
          impactLocation: null,
        };
      }
    } catch (error) {
      console.warn(`Error calculating positions at time ${t}:`, error);
    }
  }

  // Calculate impact probability and location
  if (closestApproach.distance < EARTH_SOI_AU) {
    // Very rough impact probability calculation
    const normalizedDistance = closestApproach.distance / EARTH_RADIUS_AU;
    closestApproach.impactProbability = Math.max(
      0,
      Math.min(1, 1 / normalizedDistance)
    );

    if (closestApproach.distance <= EARTH_RADIUS_AU) {
      // Calculate impact location
      const relativePos = [
        closestApproach.asteroidPos[0] - closestApproach.earthPos[0],
        closestApproach.asteroidPos[1] - closestApproach.earthPos[1],
        closestApproach.asteroidPos[2] - closestApproach.earthPos[2],
      ];

      closestApproach.impactLocation = cartesianToLatLon(
        relativePos[0],
        relativePos[1],
        relativePos[2]
      );
      closestApproach.impactProbability = 1.0; // Certain impact
    }
  }

  return closestApproach;
}

/**
 * Converts time in days to a human-readable date
 */
export function timeToDate(
  timeDays: number,
  epochDate = new Date("2000-01-01")
): Date {
  const date = new Date(epochDate);
  date.setTime(date.getTime() + timeDays * 24 * 60 * 60 * 1000);
  return date;
}

/**
 * Gets the current relative positions of Earth and asteroid
 */
export function getCurrentRelativePositions(
  asteroid: Asteroid,
  currentTime: number
) {
  try {
    const earthPos = getEarthPosition(currentTime);
    const asteroidPos = getAsteroidPosition(currentTime, asteroid.orbital_data);
    const distance = distance3D(earthPos, asteroidPos);

    // Convert to Earth-relative coordinates for better understanding
    const relativePos = [
      asteroidPos[0] - earthPos[0],
      asteroidPos[1] - earthPos[1],
      asteroidPos[2] - earthPos[2],
    ];

    return {
      earthPos,
      asteroidPos,
      relativePos: relativePos as [number, number, number],
      distance,
      distanceKm: distance * 149597870.7, // Convert AU to km
    };
  } catch (error) {
    console.warn(`Error calculating current positions:`, error);
    return null;
  }
}
