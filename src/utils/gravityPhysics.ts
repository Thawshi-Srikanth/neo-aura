import * as THREE from "three";
import type { AsteroidOrbitalData } from "../types/asteroid";
import { AU_TO_UNITS } from "../config/constants";

/**
 * Real physics-based gravity simulation for asteroid impact
 * Uses N-body gravitational dynamics with proper orbital mechanics
 */

export interface GravitySimulationState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  mass: number;
}

// Physical constants (scaled for visualization)
// NOTE: These are NOT real physics values - they're scaled for visual effect
// Real physics produces velocities too small to see in our compressed space-time visualization

// Gravitational constant - heavily scaled up for visible effects
const G_VISUAL = 10.0; // Very strong for instant impact

// Masses - scaled for visualization
const EARTH_MASS_VISUAL = 500.0; // Very strong for instant impact
const SUN_MASS_VISUAL = 10.0; // Not used in impact simulation

/**
 * Calculate gravitational acceleration from one body to another
 * a = G * M / r² (using scaled visual constants)
 * Includes force limiting to prevent singularities
 */
export function calculateGravitationalAcceleration(
  bodyPosition: THREE.Vector3,
  targetBodyPosition: THREE.Vector3,
  visualMass: number
): THREE.Vector3 {
  // Vector from body to target
  const direction = new THREE.Vector3().subVectors(
    targetBodyPosition,
    bodyPosition
  );
  const distance = direction.length();

  // Prevent division by zero and singularities
  if (distance < 0.01) {
    return new THREE.Vector3(0, 0, 0);
  }

  // Calculate acceleration magnitude using visual constants: a = G_vis * M_vis / r²
  const rawAcceleration = (G_VISUAL * visualMass) / (distance * distance);

  // CRITICAL: Limit maximum acceleration to prevent shooting to infinity
  // This simulates the effect of "softening" the gravitational potential
  const maxAcceleration = 15.0; // Very high for instant impact
  const accelerationMagnitude = Math.min(rawAcceleration, maxAcceleration);

  // Return acceleration vector (in our visualization units/s²)
  return direction.normalize().multiplyScalar(accelerationMagnitude);
}

/**
 * Calculate a dynamic velocity for the asteroid with enhanced orbital motion
 * This simulates the asteroid's orbital motion with more realistic dynamics
 */
export function getVelocityFromOrbitalElements(
  position: THREE.Vector3,
  orbitalData: AsteroidOrbitalData,
  sunPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0)
): THREE.Vector3 {
  // Position relative to sun
  const r_vec = new THREE.Vector3().subVectors(position, sunPosition);
  const distance = r_vec.length();
  
  // Enhanced orbital velocity calculation
  // Use vis-viva equation for more realistic orbital speed
  const semiMajorAxis = parseFloat(orbitalData.semi_major_axis) || 1.0;
  const eccentricity = parseFloat(orbitalData.eccentricity) || 0.1;
  
  // Calculate orbital speed using vis-viva equation
  const r_au = distance / AU_TO_UNITS; // Convert to AU
  const a_au = semiMajorAxis; // Already in AU
  const vSquared = 2.0 / r_au - 1.0 / a_au;
  
  let orbitalSpeed = 0.001; // Default fallback
  if (vSquared > 0) {
    orbitalSpeed = Math.sqrt(vSquared) * AU_TO_UNITS; // Convert back to simulation units
  }
  
  // Add dynamic velocity multipliers
  const velocityMultiplier = 3.0; // Make asteroid move faster for better visibility
  orbitalSpeed *= velocityMultiplier;
  
  // Add distance-based velocity variation (faster when closer to sun)
  const distanceVariation = 1.0 + (1.0 / Math.max(r_au, 0.1));
  orbitalSpeed *= distanceVariation;
  
  // Add eccentricity-based velocity boost
  const eccentricityBoost = 1.0 + (eccentricity * 0.3);
  orbitalSpeed *= eccentricityBoost;
  
  // Create velocity direction perpendicular to radius (orbital motion)
  const velocityDirection = new THREE.Vector3(-r_vec.y, r_vec.x, r_vec.z * 0.1).normalize();
  
  return velocityDirection.multiplyScalar(orbitalSpeed);
}

/**
 * Update physics state using 4th order Runge-Kutta integration (RK4)
 * Most accurate integration method for orbital mechanics
 * Includes velocity limiting to prevent runaway motion
 */
export function updateGravityState(
  state: GravitySimulationState,
  earthPos: THREE.Vector3,
  sunPos: THREE.Vector3,
  deltaTime: number, // in seconds
  includeEarthGravity: boolean = true,
  includeSunGravity: boolean = true
): GravitySimulationState {
  // Cap delta time to prevent instability
  const dt = Math.min(Math.abs(deltaTime), 0.016); // Max ~60fps worth
  const direction = Math.sign(deltaTime); // Allow negative for reverse

  // RK4 integration
  const calculateAcceleration = (pos: THREE.Vector3) => {
    const acc = new THREE.Vector3(0, 0, 0);

    if (includeEarthGravity) {
      const distanceToEarth = pos.distanceTo(earthPos);
      // Only apply Earth gravity if not too close (prevents singularity)
      if (distanceToEarth > 0.1) {
        const earthAcc = calculateGravitationalAcceleration(
          pos,
          earthPos,
          EARTH_MASS_VISUAL
        );
        acc.add(earthAcc);
      }
    }

    if (includeSunGravity) {
      const distanceToSun = pos.distanceTo(sunPos);
      // Only apply Sun gravity if not too close (prevents singularity)
      if (distanceToSun > 0.1) {
        const sunAcc = calculateGravitationalAcceleration(
          pos,
          sunPos,
          SUN_MASS_VISUAL
        );
        acc.add(sunAcc);
      }
    }

    return acc;
  };

  // RK4 for velocity
  const k1_v = calculateAcceleration(state.position).multiplyScalar(dt);

  const k2_pos = state.position
    .clone()
    .add(state.velocity.clone().multiplyScalar(dt * 0.5));
  const k2_v = calculateAcceleration(k2_pos).multiplyScalar(dt);

  const k3_pos = state.position.clone().add(
    state.velocity
      .clone()
      .add(k2_v.clone().multiplyScalar(0.5))
      .multiplyScalar(dt * 0.5)
  );
  const k3_v = calculateAcceleration(k3_pos).multiplyScalar(dt);

  const k4_pos = state.position
    .clone()
    .add(state.velocity.clone().add(k3_v).multiplyScalar(dt));
  const k4_v = calculateAcceleration(k4_pos).multiplyScalar(dt);

  // Combine RK4 steps
  const deltaV = k1_v
    .clone()
    .add(k2_v.multiplyScalar(2))
    .add(k3_v.multiplyScalar(2))
    .add(k4_v)
    .multiplyScalar(1 / 6);

  const newVelocity = state.velocity
    .clone()
    .add(deltaV.multiplyScalar(direction));

  // CRITICAL: Limit maximum velocity to prevent shooting to infinity
  const maxVelocity = 12.0; // Very high for instant impact
  const currentSpeed = newVelocity.length();
  if (currentSpeed > maxVelocity) {
    newVelocity.normalize().multiplyScalar(maxVelocity);
  }

  // Update position
  const newPosition = state.position
    .clone()
    .add(newVelocity.clone().multiplyScalar(dt * direction));

  const newAcceleration = calculateAcceleration(newPosition);

  return {
    position: newPosition,
    velocity: newVelocity,
    acceleration: newAcceleration,
    mass: state.mass,
  };
}

/**
 * Initialize physics state with orbital velocity + impact impulse toward Earth
 */
export function initializeImpactTrajectory(
  startPos: THREE.Vector3,
  orbitalVelocity: THREE.Vector3,
  earthPos: THREE.Vector3,
  targetOffset: THREE.Vector3 = new THREE.Vector3(),
  asteroidMass: number = 1e10 // Default small asteroid mass in kg
): GravitySimulationState {
  // Calculate impact impulse (additional velocity toward Earth)
  const toEarth = new THREE.Vector3().subVectors(earthPos, startPos).add(targetOffset);
  const distance = toEarth.length();
  
  // CRITICAL: Make deflection impulse VERY strong for instant impact
  // This ensures the asteroid is pulled directly toward Earth almost instantly
  const impulseSpeed = Math.min(distance * 3.0, 8.0); // Very strong impulse for instant impact
  const impulse = toEarth.normalize().multiplyScalar(impulseSpeed);

  // Use almost entirely the impulse toward Earth, with almost no orbital velocity
  // This prevents the asteroid from following Earth like a tail
  const scaledOrbitalVelocity = orbitalVelocity.clone().multiplyScalar(0.001); // Almost zero
  const totalVelocity = scaledOrbitalVelocity.add(impulse);

  return {
    position: startPos.clone(),
    velocity: totalVelocity,
    acceleration: new THREE.Vector3(0, 0, 0),
    mass: asteroidMass,
  };
}

/**
 * Estimate time to impact based on current trajectory
 */
export function estimateTimeToImpact(
  state: GravitySimulationState,
  earthPos: THREE.Vector3,
  earthRadius: number
): number {
  const distance = state.position.distanceTo(earthPos);

  // Component of velocity toward Earth
  const toEarth = new THREE.Vector3()
    .subVectors(earthPos, state.position)
    .normalize();
  const velocityTowardEarth = state.velocity.dot(toEarth);

  if (velocityTowardEarth <= 0) return Infinity; // Moving away

  const timeToImpact = Math.max(
    0,
    (distance - earthRadius) / velocityTowardEarth
  );

  return timeToImpact;
}
