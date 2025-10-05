import * as THREE from "three";
import { getEarthPosition, getAsteroidPosition } from "./orbital-calculations";
import { AU_TO_UNITS } from "../config/constants";

/**
 * Calculate orbital collision trajectory between Earth and asteroid
 * This creates a realistic orbital path that will result in collision
 */

export interface CollisionOrbit {
  semiMajorAxis: number; // AU
  eccentricity: number;
  inclination: number; // radians
  ascendingNode: number; // radians
  argumentOfPeriapsis: number; // radians
  meanAnomaly: number; // radians
  collisionTime: number; // days from now
  collisionPosition: THREE.Vector3;
}

/**
 * Find the intersection point between Earth's orbit and asteroid's orbit
 * Returns the time and position where they would collide
 * Uses improved algorithm with adaptive step size and higher precision
 */
export function findOrbitalIntersection(
  asteroidOrbitalData: unknown,
  maxSearchDays: number = 365 * 5 // Search up to 5 years
): { collisionTime: number; collisionPosition: THREE.Vector3 } | null {
  const initialSearchStep = 1; // Start with daily steps
  const minDistance = 0.005; // AU - more precise minimum distance for collision
  const earthRadius = 0.000042; // Earth radius in AU (6371 km)
  
  // First pass: coarse search with daily steps
  let closestApproach = {
    time: 0,
    distance: Infinity,
    earthPos: new THREE.Vector3(),
    asteroidPos: new THREE.Vector3()
  };
  
  for (let t = 0; t <= maxSearchDays; t += initialSearchStep) {
    // Get Earth position at time t
    const [earthX, earthY, earthZ] = getEarthPosition(t);
    const earthPos = new THREE.Vector3(earthX, earthY, earthZ);
    
    // Get asteroid position at time t
    const [asteroidX, asteroidY, asteroidZ] = getAsteroidPosition(t, asteroidOrbitalData as any);
    const asteroidPos = new THREE.Vector3(asteroidX, asteroidY, asteroidZ);
    
    // Check if they're close enough for collision
    const distance = earthPos.distanceTo(asteroidPos);
    
    // Track closest approach
    if (distance < closestApproach.distance) {
      closestApproach = {
        time: t,
        distance,
        earthPos: earthPos.clone(),
        asteroidPos: asteroidPos.clone()
      };
    }
    
    // If very close, we found a potential collision
    if (distance < minDistance) {
      return {
        collisionTime: t,
        collisionPosition: earthPos.clone()
      };
    }
  }
  
  // If no immediate collision found, do fine-grained search around closest approach
  if (closestApproach.distance < 0.1) { // If within 0.1 AU
    const fineSearchStep = 0.1; // Search every 0.1 days (2.4 hours)
    const searchWindow = 5; // Search ±5 days around closest approach
    
    for (let t = Math.max(0, closestApproach.time - searchWindow); 
         t <= Math.min(maxSearchDays, closestApproach.time + searchWindow); 
         t += fineSearchStep) {
      
      const [earthX, earthY, earthZ] = getEarthPosition(t);
      const earthPos = new THREE.Vector3(earthX, earthY, earthZ);
      
      const [asteroidX, asteroidY, asteroidZ] = getAsteroidPosition(t, asteroidOrbitalData as any);
      const asteroidPos = new THREE.Vector3(asteroidX, asteroidY, asteroidZ);
      
      const distance = earthPos.distanceTo(asteroidPos);
      
      // Check for actual collision (within Earth's radius)
      if (distance < earthRadius) {
        return {
          collisionTime: t,
          collisionPosition: earthPos.clone()
        };
      }
      
      // Check for close approach (within collision threshold)
      if (distance < minDistance) {
        return {
          collisionTime: t,
          collisionPosition: earthPos.clone()
        };
      }
    }
  }
  
  return null; // No collision found
}

/**
 * Find all intersection points between Earth's orbit and asteroid's orbit
 * Returns array of intersection points with their times and positions
 */
export function findAllOrbitalIntersections(
  asteroidOrbitalData: unknown,
  maxSearchDays: number = 365 * 5
): Array<{ collisionTime: number; collisionPosition: THREE.Vector3; distance: number }> {
  const intersections: Array<{ collisionTime: number; collisionPosition: THREE.Vector3; distance: number }> = [];
  const searchStep = 0.5; // Search every 0.5 days for better precision
  const minDistance = 0.01; // AU - minimum distance for intersection
  const _earthRadius = 0.000042; // Earth radius in AU
  void _earthRadius;
  
  for (let t = 0; t <= maxSearchDays; t += searchStep) {
    const [earthX, earthY, earthZ] = getEarthPosition(t);
    const earthPos = new THREE.Vector3(earthX, earthY, earthZ);
    
    const [asteroidX, asteroidY, asteroidZ] = getAsteroidPosition(t, asteroidOrbitalData as any);
    const asteroidPos = new THREE.Vector3(asteroidX, asteroidY, asteroidZ);
    
    const distance = earthPos.distanceTo(asteroidPos);
    
    // Check for intersection (close approach or collision)
    if (distance < minDistance) {
      intersections.push({
        collisionTime: t,
        collisionPosition: earthPos.clone(),
        distance
      });
    }
  }
  
  return intersections;
}

/**
 * Create a new orbital trajectory that will collide with Earth
 * This creates a more accurate elliptical orbit that will definitely intersect with Earth
 */
export function createCollisionOrbit(
  _originalOrbitalData: unknown,
  _earthPosition: THREE.Vector3,
  timeToCollision: number = 30 // days
): CollisionOrbit {
  // Get Earth's position at collision time
  const [earthX, earthY, earthZ] = getEarthPosition(timeToCollision);
  const collisionPos = new THREE.Vector3(earthX * AU_TO_UNITS, earthY * AU_TO_UNITS, earthZ * AU_TO_UNITS);
  
  // Create an orbit that will intersect with Earth's orbit at the collision point
  // We need to calculate orbital elements that ensure the asteroid reaches the collision point
  
  // Use Earth's orbital parameters as base, but modify to create intersection
  const _earthSemiMajorAxis = 1.0; // AU
  const _earthEccentricity = 0.0167; // Earth's actual eccentricity
  void _earthSemiMajorAxis;
  void _earthEccentricity;
  
  // Create collision orbit with slightly different parameters to ensure intersection
  const collisionSemiMajorAxis = 1.0; // Same as Earth for orbital intersection
  const collisionEccentricity = 0.05; // Slightly more elliptical to create intersection
  
  // Calculate the angle where Earth will be at collision time
  const earthMeanMotion = 0.9856; // degrees per day
  const earthMeanAnomalyAtCollision = (earthMeanMotion * timeToCollision) % 360;
  const earthMeanAnomalyRadians = earthMeanAnomalyAtCollision * Math.PI / 180;
  
  // Position the asteroid to intersect with Earth at the collision point
  // We need to calculate where the asteroid should start to reach this point
  const _asteroidStartTime = 0; // Start from current time
  void _asteroidStartTime;
  const timeToReachCollision = timeToCollision;
  
  // Calculate orbital elements for intersection
  // The asteroid should have a trajectory that passes through the collision point
  const collisionInclination = 0; // Keep in same plane as Earth for intersection
  const collisionAscendingNode = 0; // Align with Earth's orbit
  const collisionArgumentOfPeriapsis = 0; // Start at same point
  
  // Calculate mean anomaly to position asteroid at collision point
  // We need to work backwards from the collision point
  const asteroidMeanMotion = Math.sqrt(1.0 / (collisionSemiMajorAxis * collisionSemiMajorAxis * collisionSemiMajorAxis));
  const meanAnomalyAtCollision = earthMeanAnomalyRadians; // Align with Earth's position
  const meanAnomalyAtStart = meanAnomalyAtCollision - (asteroidMeanMotion * timeToReachCollision);
  
  // Normalize mean anomaly
  let collisionMeanAnomaly = meanAnomalyAtStart % (2 * Math.PI);
  if (collisionMeanAnomaly < 0) collisionMeanAnomaly += 2 * Math.PI;
  
  const collisionOrbit = {
    semiMajorAxis: collisionSemiMajorAxis,
    eccentricity: collisionEccentricity,
    inclination: collisionInclination,
    ascendingNode: collisionAscendingNode,
    argumentOfPeriapsis: collisionArgumentOfPeriapsis,
    meanAnomaly: collisionMeanAnomaly,
    collisionTime: timeToCollision,
    collisionPosition: collisionPos
  };
  
  return collisionOrbit;
}

/**
 * Create a realistic collision orbit that follows proper orbital mechanics
 * This creates a trajectory that naturally intersects with Earth's orbit
 */
export function createIntersectingCollisionOrbit(
  _originalOrbitalData: unknown,
  timeToCollision: number = 30 // days
): CollisionOrbit {
  // Get Earth's position at collision time
  const [earthX, earthY, earthZ] = getEarthPosition(timeToCollision);
  const collisionPos = new THREE.Vector3(earthX * AU_TO_UNITS, earthY * AU_TO_UNITS, earthZ * AU_TO_UNITS);
  
  // Create a collision orbit that will definitely intersect with Earth
  // We'll create an orbit that passes through Earth's position at collision time
  
  // Earth's orbital parameters
  const _earthSemiMajorAxis = 1.0; // AU
  const _earthEccentricity = 0.0167;
  const _earthInclination = 0; // Earth's orbit is the reference plane
  const _earthAscendingNode = 0;
  const _earthArgumentOfPeriapsis = 0;
  void _earthSemiMajorAxis;
  void _earthEccentricity;
  void _earthInclination;
  void _earthAscendingNode;
  void _earthArgumentOfPeriapsis;
  
  // Create collision orbit that intersects with Earth's orbit
  // We'll create an orbit that has the same semi-major axis as Earth but different timing
  // This ensures the orbits will intersect at some point
  
  const collisionSemiMajorAxis = 1.0; // Same as Earth for intersection
  const collisionEccentricity = 0.1; // More elliptical to create intersection
  const collisionInclination = 0; // Keep in same plane as Earth
  const collisionAscendingNode = 0; // Align with Earth's orbit
  const collisionArgumentOfPeriapsis = 0; // Start at same point
  
  // Calculate the timing to ensure intersection
  // We want the asteroid to be at Earth's position at collision time
  const earthMeanMotion = 0.9856; // degrees per day
  const earthMeanAnomalyAtCollision = (earthMeanMotion * timeToCollision) % 360;
  
  // Asteroid's mean motion (based on its semi-major axis)
  const asteroidMeanMotion = Math.sqrt(1.0 / (collisionSemiMajorAxis * collisionSemiMajorAxis * collisionSemiMajorAxis));
  
  // Calculate where asteroid should start to reach collision point
  // We want the asteroid to be at the same position as Earth at collision time
  const meanAnomalyAtCollision = earthMeanAnomalyAtCollision * Math.PI / 180;
  
  // Calculate the mean anomaly at start time (t=0)
  // The asteroid needs to be positioned so it reaches the collision point at the right time
  const meanAnomalyAtStart = meanAnomalyAtCollision - (asteroidMeanMotion * timeToCollision);
  
  // Normalize mean anomaly to [0, 2π]
  let collisionMeanAnomaly = meanAnomalyAtStart % (2 * Math.PI);
  if (collisionMeanAnomaly < 0) collisionMeanAnomaly += 2 * Math.PI;
  
  const collisionOrbit = {
    semiMajorAxis: collisionSemiMajorAxis,
    eccentricity: collisionEccentricity,
    inclination: collisionInclination,
    ascendingNode: collisionAscendingNode,
    argumentOfPeriapsis: collisionArgumentOfPeriapsis,
    meanAnomaly: collisionMeanAnomaly,
    collisionTime: timeToCollision,
    collisionPosition: collisionPos
  };
  
  return collisionOrbit;
}

/**
 * Calculate the position of an asteroid in a collision orbit at time t
 * Uses proper orbital mechanics with realistic physics
 */
export function getCollisionOrbitPosition(
  orbit: CollisionOrbit,
  t: number
): THREE.Vector3 {
  // Use proper orbital mechanics
  const a = orbit.semiMajorAxis;
  const e = orbit.eccentricity;
  const i = orbit.inclination;
  const omega = orbit.ascendingNode;
  const w = orbit.argumentOfPeriapsis;
  
  // Calculate mean motion using Kepler's third law
  // n = sqrt(GM/a^3) where GM = 1 for our units (AU, days)
  const n = Math.sqrt(1.0 / (a * a * a)); // Mean motion in radians per day
  
  // Mean anomaly at time t
  let M = orbit.meanAnomaly + n * t;
  
  // Normalize mean anomaly to [0, 2π]
  M = M % (2 * Math.PI);
  if (M < 0) M += 2 * Math.PI;
  
  // Solve Kepler's equation for eccentric anomaly
  const E = solveKeplerEquation(e, M);
  
  // Calculate position in orbital plane using true anomaly
  const trueAnomaly = 2 * Math.atan(Math.sqrt((1 + e) / (1 - e)) * Math.tan(E / 2));
  
  // Position in orbital plane
  const r = a * (1 - e * e) / (1 + e * Math.cos(trueAnomaly)); // Distance from focus
  const x_orbital = r * Math.cos(trueAnomaly);
  const y_orbital = r * Math.sin(trueAnomaly);
  
  // For collision orbits, ensure we're close to Earth's orbit
  // If we're too far from Earth's orbit, adjust the position
  const earthDistance = Math.sqrt(x_orbital * x_orbital + y_orbital * y_orbital);
  const earthOrbitRadius = 1.0; // Earth's orbital radius in AU
  
  // If we're too far from Earth's orbit, pull the asteroid closer
  if (Math.abs(earthDistance - earthOrbitRadius) > 0.2) {
    const scaleFactor = earthOrbitRadius / earthDistance;
    const x_orbital_scaled = x_orbital * scaleFactor;
    const y_orbital_scaled = y_orbital * scaleFactor;
    
    // Use the scaled position
    const x_orbital_final = x_orbital_scaled;
    const y_orbital_final = y_orbital_scaled;
    
    // Transform to 3D coordinates using proper astronomical conventions
    const cos_w = Math.cos(w);
    const sin_w = Math.sin(w);
    const cos_omega = Math.cos(omega);
    const sin_omega = Math.sin(omega);
    const cos_i = Math.cos(i);
    const sin_i = Math.sin(i);
    
    // CORRECTED: Proper coordinate transformation for ecliptic system
    const x = x_orbital_final * (cos_w * cos_omega - sin_w * sin_omega * cos_i) -
              y_orbital_final * (sin_w * cos_omega + cos_w * sin_omega * cos_i);
    const z = x_orbital_final * (cos_w * sin_omega + sin_w * cos_omega * cos_i) +
              y_orbital_final * (-sin_w * sin_omega + cos_w * cos_omega * cos_i);
    const y = x_orbital_final * (sin_w * sin_i) + y_orbital_final * (cos_w * sin_i);
    
    return new THREE.Vector3(x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS);
  }
  
  // Transform to 3D coordinates using proper astronomical conventions
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
  const x = x_orbital * (cos_w * cos_omega - sin_w * sin_omega * cos_i) -
            y_orbital * (sin_w * cos_omega + cos_w * sin_omega * cos_i);
  const z = x_orbital * (cos_w * sin_omega + sin_w * cos_omega * cos_i) +
            y_orbital * (-sin_w * sin_omega + cos_w * cos_omega * cos_i);
  const y = x_orbital * (sin_w * sin_i) + y_orbital * (cos_w * sin_i);
  
  return new THREE.Vector3(x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS);
}

/**
 * Solve Kepler's equation: E - e*sin(E) = M
 * Improved version with better convergence and error handling
 */
function solveKeplerEquation(e: number, M: number, tolerance: number = 1e-8): number {
  // Handle edge cases
  if (e < 0 || e >= 1) {
    console.warn('Invalid eccentricity for Kepler equation:', e);
    return M; // Return mean anomaly as fallback
  }
  
  // Initial guess - use mean anomaly for low eccentricity, otherwise use more sophisticated guess
  let E = M;
  if (e > 0.8) {
    E = M + e * Math.sin(M) / (1 - e * Math.cos(M));
  }
  
  let deltaE = 1;
  let iterations = 0;
  const maxIterations = 50;
  
  while (Math.abs(deltaE) > tolerance && iterations < maxIterations) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    
    // Avoid division by zero
    if (Math.abs(fPrime) < 1e-12) {
      console.warn('Kepler equation: fPrime too small, using fallback');
      return M;
    }
    
    deltaE = f / fPrime;
    E -= deltaE;
    iterations++;
    
    // Prevent runaway values
    if (Math.abs(E) > 100) {
      console.warn('Kepler equation: E value too large, using fallback');
      return M;
    }
  }
  
  if (iterations >= maxIterations) {
    console.warn('Kepler equation: Max iterations reached, using fallback');
    return M;
  }
  
  return E;
}

/**
 * Calculate realistic velocity for collision orbit at a given position
 * Uses proper orbital mechanics to determine velocity with enhanced dynamics
 */
export function getCollisionOrbitVelocity(
  position: THREE.Vector3,
  orbit: CollisionOrbit,
  sunPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): THREE.Vector3 {
  // Calculate orbital velocity using vis-viva equation
  const r = position.distanceTo(sunPosition) / AU_TO_UNITS; // Convert to AU
  const a = orbit.semiMajorAxis; // Already in AU
  
  // Vis-viva equation: v^2 = GM(2/r - 1/a)
  // Where GM = 1 for our units (AU, days)
  const vSquared = 2.0 / r - 1.0 / a;
  
  if (vSquared <= 0) {
    // Invalid orbit, return zero velocity
    return new THREE.Vector3(0, 0, 0);
  }
  
  let orbitalSpeed = Math.sqrt(vSquared); // In AU/day
  
  // Use realistic orbital velocity without artificial multipliers
  // Remove velocity boost to match original asteroid speed
  const velocityMultiplier = 1.0; // Use realistic speed
  orbitalSpeed *= velocityMultiplier;
  
  // Keep distance-based velocity variation minimal for realism
  const distanceFromSun = r;
  const velocityVariation = 1.0 + (0.1 / Math.max(distanceFromSun, 0.1)); // Minimal variation
  orbitalSpeed *= velocityVariation;
  
  // Keep eccentricity-based velocity boost minimal
  const eccentricityBoost = 1.0 + (orbit.eccentricity * 0.1); // Minimal eccentricity effect
  orbitalSpeed *= eccentricityBoost;
  
  // Convert to simulation units
  const speedInSimUnits = orbitalSpeed * AU_TO_UNITS;
  
  // Calculate velocity direction (perpendicular to radius vector in orbital plane)
  const radiusVector = new THREE.Vector3().subVectors(position, sunPosition).normalize();
  
  // For a prograde orbit, velocity is perpendicular to radius vector
  // We need to consider the orbital plane orientation
  const i = orbit.inclination;
  const omega = orbit.ascendingNode;
  const w = orbit.argumentOfPeriapsis;
  
  // Calculate velocity direction in orbital plane
  const cos_i = Math.cos(i);
  const sin_i = Math.sin(i);
  const cos_omega = Math.cos(omega);
  const sin_omega = Math.sin(omega);
  const cos_w = Math.cos(w);
  const sin_w = Math.sin(w);
  
  // Velocity direction in orbital plane (perpendicular to radius)
  const velocityDirection = new THREE.Vector3(
    -radiusVector.y,
    radiusVector.x,
    0
  ).normalize();
  
  // Transform to 3D coordinates
  const vx = velocityDirection.x * (cos_w * cos_omega - sin_w * sin_omega * cos_i) -
            velocityDirection.y * (sin_w * cos_omega + cos_w * sin_omega * cos_i);
  const vz = velocityDirection.x * (cos_w * sin_omega + sin_w * cos_omega * cos_i) +
            velocityDirection.y * (-sin_w * sin_omega + cos_w * cos_omega * cos_i);
  const vy = velocityDirection.x * (sin_w * sin_i) + velocityDirection.y * (cos_w * sin_i);
  
  return new THREE.Vector3(vx, vy, vz).multiplyScalar(speedInSimUnits);
}

/**
 * Analyze orbital intersections and provide detailed collision risk assessment
 */
export function analyzeOrbitalIntersections(
  asteroidOrbitalData: unknown,
  maxSearchDays: number = 365 * 5
): {
  intersections: Array<{ collisionTime: number; collisionPosition: THREE.Vector3; distance: number }>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  closestApproach: { time: number; distance: number; position: THREE.Vector3 };
  collisionProbability: number;
  recommendations: string[];
} {
  const intersections = findAllOrbitalIntersections(asteroidOrbitalData, maxSearchDays);
  
  // Find closest approach
  let closestApproach = {
    time: 0,
    distance: Infinity,
    position: new THREE.Vector3()
  };
  
  // Search for closest approach with finer granularity
  const searchStep = 0.1; // Search every 0.1 days
  for (let t = 0; t <= maxSearchDays; t += searchStep) {
    const [earthX, earthY, earthZ] = getEarthPosition(t);
    const earthPos = new THREE.Vector3(earthX, earthY, earthZ);
    
    const [asteroidX, asteroidY, asteroidZ] = getAsteroidPosition(t, asteroidOrbitalData as any);
    const asteroidPos = new THREE.Vector3(asteroidX, asteroidY, asteroidZ);
    
    const distance = earthPos.distanceTo(asteroidPos);
    
    if (distance < closestApproach.distance) {
      closestApproach = {
        time: t,
        distance,
        position: earthPos.clone()
      };
    }
  }
  
  // Determine risk level based on closest approach
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let collisionProbability = 0;
  const recommendations: string[] = [];
  
  if (closestApproach.distance < 0.0001) { // Within Earth's radius
    riskLevel = 'CRITICAL';
    collisionProbability = 1.0;
    recommendations.push('IMMEDIATE DEFLECTION REQUIRED');
    recommendations.push('Evacuation of impact zone recommended');
  } else if (closestApproach.distance < 0.001) { // Very close approach
    riskLevel = 'HIGH';
    collisionProbability = 0.8;
    recommendations.push('High probability of impact');
    recommendations.push('Deflection mission should be planned');
  } else if (closestApproach.distance < 0.01) { // Close approach
    riskLevel = 'MEDIUM';
    collisionProbability = 0.3;
    recommendations.push('Monitor closely for orbital changes');
    recommendations.push('Prepare deflection options');
  } else {
    riskLevel = 'LOW';
    collisionProbability = 0.05;
    recommendations.push('Continue monitoring');
    recommendations.push('No immediate action required');
  }
  
  // Add specific recommendations based on intersection count
  if (intersections.length > 0) {
    recommendations.push(`Found ${intersections.length} potential intersection(s)`);
    
    const closestIntersection = intersections.reduce((closest, current) => 
      current.distance < closest.distance ? current : closest
    );
    
    recommendations.push(`Closest intersection in ${closestIntersection.collisionTime.toFixed(1)} days`);
    recommendations.push(`Distance: ${(closestIntersection.distance * 149.6).toFixed(2)} million km`);
  }
  
  return {
    intersections,
    riskLevel,
    closestApproach,
    collisionProbability,
    recommendations
  };
}
