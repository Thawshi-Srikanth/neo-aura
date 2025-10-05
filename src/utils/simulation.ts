import { EARTH_RADIUS_KM, AU_IN_KM, SCALE } from "../config/constants";
import type { OrbitalParameters } from "../types/simulation";

export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const getEarthPosition = (time: number): [number, number, number] => {
  // Simplified Earth orbit (assuming circular orbit for this example)
  const earthOrbitPeriod = 365.25; // days
  const earthOrbitRadius = 1 * AU_IN_KM * SCALE; // 1 AU in scaled km
  const angle = (2 * Math.PI * time) / earthOrbitPeriod;

  return [
    earthOrbitRadius * Math.cos(angle),
    earthOrbitRadius * Math.sin(angle),
    0,
  ];
};

export const calculateAsteroidPosition = (
  orbitalParams: OrbitalParameters,
  time: number
): [number, number, number] => {
  const {
    eccentricity,
    semi_major_axis, // This is now scaled
    inclination,
    ascending_node_longitude,
    perihelion_argument,
  } = orbitalParams;

  const meanMotion = Math.sqrt(
    1 / (semi_major_axis * semi_major_axis * semi_major_axis)
  );
  const meanAnomaly = meanMotion * time;

  // Solve Kepler's equation (simplified for this example)
  let E = meanAnomaly;
  for (let i = 0; i < 10; i++) {
    E = meanAnomaly + eccentricity * Math.sin(E);
  }

  // Calculate position in orbital plane
  const xOrbit = semi_major_axis * (Math.cos(E) - eccentricity);
  const yOrbit =
    semi_major_axis * Math.sqrt(1 - eccentricity * eccentricity) * Math.sin(E);

  // Convert angles to radians
  const i = degToRad(inclination);
  const omega = degToRad(ascending_node_longitude);
  const w = degToRad(perihelion_argument);

  // Transform to heliocentric coordinates
  const x =
    xOrbit *
      (Math.cos(w) * Math.cos(omega) -
        Math.sin(w) * Math.sin(omega) * Math.cos(i)) -
    yOrbit *
      (Math.sin(w) * Math.cos(omega) +
        Math.cos(w) * Math.sin(omega) * Math.cos(i));
  const y =
    xOrbit *
      (Math.cos(w) * Math.sin(omega) +
        Math.sin(w) * Math.cos(omega) * Math.cos(i)) +
    yOrbit *
      (-Math.sin(w) * Math.sin(omega) +
        Math.cos(w) * Math.cos(omega) * Math.cos(i));
  const z =
    xOrbit * (Math.sin(w) * Math.sin(i)) + yOrbit * (Math.cos(w) * Math.sin(i));

  return [x, y, z];
};

export const predictCollision = (
  orbitalParams: OrbitalParameters,
  maxTime: number = 365 * 5,
  timeStep: number = 0.1
): number | null => {
  const scaledEarthRadius = EARTH_RADIUS_KM * SCALE;

  for (let t = 0.1; t < maxTime; t += timeStep) {
    const [x_ast, y_ast, z_ast] = calculateAsteroidPosition(orbitalParams, t);
    const [x_earth, y_earth, z_earth] = getEarthPosition(t);

    const distance = Math.sqrt(
      Math.pow(x_ast - x_earth, 2) +
        Math.pow(y_ast - y_earth, 2) +
        Math.pow(z_ast - z_earth, 2)
    );

    if (distance < scaledEarthRadius) {
      return t;
    }
  }

  return null;
};
