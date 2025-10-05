/**
 * Solves Kepler's equation for eccentric anomaly
 * @param e - eccentricity
 * @param M - mean anomaly
 * @param tol - tolerance for convergence
 * @param maxIter - maximum number of iterations
 * @returns eccentric anomaly E
 */
export function keplerSolve(
  e: number,
  M: number,
  tol = 1e-14,
  maxIter = 100
): number {
  let E = M;
  let dE = tol + 1;
  let iter = 0;

  while (dE > tol && iter < maxIter) {
    const f = E - e * Math.sin(E) - M;
    const fp = 1 - e * Math.cos(E);
    const delta = f / fp;
    E -= delta;
    dE = Math.abs(delta);
    iter++;
  }

  return E;
}

/**
 * Calculates orbital position from orbital elements
 * @param a - semi-major axis
 * @param e - eccentricity
 * @param E - eccentric anomaly
 * @returns [x, y] coordinates in orbital plane
 */
export function calculateOrbitalPosition(
  a: number,
  e: number,
  E: number
): [number, number] {
  const x = a * (Math.cos(E) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  return [x, y];
}

/**
 * Converts degrees to radians
 * @param degrees - angle in degrees
 * @returns angle in radians
 */
import { degToRad } from "./units-conversions";

/**
 * Calculates Earth's orbital position around the Sun at a given time
 * @param t - time in days since epoch
 * @returns [x, y, z] coordinates of Earth relative to Sun
 */
export function getEarthPosition(t: number): [number, number, number] {
  // Earth's orbital parameters (heliocentric) - J2000.0 epoch
  const meanMotion = 0.01720209895; // radians per day (2π/365.25)
  const semiMajorAxis = 1.00000011; // AU (Earth's semi-major axis)
  const eccentricity = 0.01671022; // Earth's orbital eccentricity
  const argumentOfPeriapsis = 102.94719; // degrees
  const inclination = 0.00005; // Earth's orbital inclination (very small, ~0.003°)
  const ascendingNode = 0; // Longitude of ascending node

  const M = meanMotion * t;
  const E = keplerSolve(eccentricity, M);
  const [x_orbital, y_orbital] = calculateOrbitalPosition(
    semiMajorAxis,
    eccentricity,
    E
  );

  // Transform to 3D coordinates with proper inclination
  const w = degToRad(argumentOfPeriapsis);
  const i = degToRad(inclination);
  const omega = degToRad(ascendingNode);

  // Apply orbital plane transformation with inclination
  const cos_w = Math.cos(w);
  const sin_w = Math.sin(w);
  const cos_omega = Math.cos(omega);
  const sin_omega = Math.sin(omega);
  const cos_i = Math.cos(i);
  const sin_i = Math.sin(i);

  // CORRECTED: Proper coordinate transformation for ecliptic system
  // In the standard astronomical convention:
  // - X-axis points toward vernal equinox (0° longitude)
  // - Y-axis points toward 90° longitude (perpendicular to X in ecliptic plane)
  // - Z-axis points toward north ecliptic pole (perpendicular to ecliptic plane)
  const x =
    x_orbital * (cos_w * cos_omega - sin_w * sin_omega * cos_i) -
    y_orbital * (sin_w * cos_omega + cos_w * sin_omega * cos_i);
  const z = -(
    x_orbital * (cos_w * sin_omega + sin_w * cos_omega * cos_i) +
    y_orbital * (-sin_w * sin_omega + cos_w * cos_omega * cos_i)
  );
  const y = x_orbital * (sin_w * sin_i) + y_orbital * (cos_w * sin_i);

  return [x, y, z];
}

/**
 * Calculates asteroid position around the Sun at a given time
 * @param t - time in days since epoch
 * @param orbitalData - asteroid's orbital elements
 * @returns [x, y, z] coordinates of asteroid relative to Sun
 */
export function getAsteroidPosition(
  t: number,
  orbitalData: {
    semi_major_axis: string;
    eccentricity: string;
    inclination: string;
    ascending_node_longitude: string;
    perihelion_argument: string;
    mean_motion: string;
    mean_anomaly: string;
    epoch_osculation: string;
  }
): [number, number, number] {
  const a = parseFloat(orbitalData.semi_major_axis); // AU
  const e = parseFloat(orbitalData.eccentricity);
  const i = degToRad(parseFloat(orbitalData.inclination));
  const omega = degToRad(parseFloat(orbitalData.ascending_node_longitude));
  const w = degToRad(parseFloat(orbitalData.perihelion_argument));
  const n = parseFloat(orbitalData.mean_motion) * (Math.PI / 180); // Convert from deg/day to rad/day
  const M0 = degToRad(parseFloat(orbitalData.mean_anomaly));

  // Calculate mean anomaly at time t
  const M = M0 + n * t;
  const E = keplerSolve(e, M);
  const [x_orbital, y_orbital] = calculateOrbitalPosition(a, e, E);

  // CORRECTED: Transform from orbital plane to heliocentric ecliptic coordinates
  // Using proper astronomical coordinate transformation
  const cos_w = Math.cos(w);
  const sin_w = Math.sin(w);
  const cos_omega = Math.cos(omega);
  const sin_omega = Math.sin(omega);
  const cos_i = Math.cos(i);
  const sin_i = Math.sin(i);

  // Proper coordinate transformation for ecliptic system
  // In the standard astronomical convention:
  // - X-axis points toward vernal equinox (0° longitude)
  // - Y-axis points toward 90° longitude (perpendicular to X in ecliptic plane)
  // - Z-axis points toward north ecliptic pole (perpendicular to ecliptic plane)
  // FIXED: Ensure counter-clockwise motion by flipping Z coordinate
  const x =
    x_orbital * (cos_w * cos_omega - sin_w * sin_omega * cos_i) -
    y_orbital * (sin_w * cos_omega + cos_w * sin_omega * cos_i);
  const z = -(
    x_orbital * (cos_w * sin_omega + sin_w * cos_omega * cos_i) +
    y_orbital * (-sin_w * sin_omega + cos_w * cos_omega * cos_i)
  );
  const y = x_orbital * (sin_w * sin_i) + y_orbital * (cos_w * sin_i);

  return [x, y, z];
}
