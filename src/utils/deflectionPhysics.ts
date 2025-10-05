import * as THREE from 'three';
import { DEBUG_CONFIG } from '../config/debug';

export interface DeflectionMethod {
  id: string;
  name: string;
  description: string;
  successRate: number;
  cost: number;
  timeRequired: number;
  physicsParams: {
    velocityChange: number; // km/s
    directionChange: number; // degrees
    efficiency: number; // 0-1
    reliability: number; // 0-1
  };
}

export interface AsteroidOrbitData {
  eccentricity: number;
  inclination: number;
  semiMajorAxis: number;
  velocity: number;
  position: THREE.Vector3;
  approachDate: string;
  missDistance: number; // AU
}

export interface DeflectionResult {
  success: boolean;
  newOrbit: AsteroidOrbitData;
  impactProbabilityReduction: number;
  timeToDeflection: number; // hours
  energyRequired: number; // Joules
  method: string;
  confidence: number; // 0-1
}

export class DeflectionPhysics {
  private static readonly EARTH_RADIUS = 6371; // km
  private static readonly AU_TO_KM = 149597870.7; // km
  private static readonly G = 6.67430e-11; // Gravitational constant
  private static readonly EARTH_MASS = 5.972e24; // kg

  /**
   * Calculate deflection using real orbital mechanics
   */
  static calculateDeflection(
    asteroid: AsteroidOrbitData,
    method: DeflectionMethod,
    timeToImpact: number // days
  ): DeflectionResult {
    // Calculate current orbital parameters
    //const currentVelocity = asteroid.velocity;
    //const currentPosition = asteroid.position;

    // Calculate required velocity change based on method
    const velocityChange = this.calculateRequiredVelocityChange(
      asteroid,
      method,
      timeToImpact
    );

    // Calculate new orbital elements
    const newOrbit = this.calculateNewOrbit(asteroid, velocityChange, method);

    // Calculate success probability based on physics
    const success = this.calculateSuccessProbability(asteroid, method, timeToImpact);

    // Calculate impact probability reduction
    const impactReduction = this.calculateImpactProbabilityReduction(
      asteroid,
      newOrbit
    );

    // Calculate energy required
    const energyRequired = this.calculateEnergyRequired(velocityChange);

    return {
      success,
      newOrbit,
      impactProbabilityReduction: impactReduction,
      timeToDeflection: method.timeRequired,
      energyRequired,
      method: method.name,
      confidence: method.physicsParams.reliability
    };
  }

  /**
   * Calculate required velocity change to deflect asteroid
   */
  private static calculateRequiredVelocityChange(
    asteroid: AsteroidOrbitData,
    method: DeflectionMethod,
    timeToImpact: number
  ): THREE.Vector3 {
    // Calculate current velocity vector
    const velocity = new THREE.Vector3(0, 0, asteroid.velocity);

    // Calculate deflection direction (away from Earth)
    const earthPosition = new THREE.Vector3(0, 0, 0);
    const asteroidToEarth = earthPosition.clone().sub(asteroid.position).normalize();

    // Calculate required velocity change magnitude (much smaller for realistic deflection)
    const requiredChange = this.calculateRequiredChangeMagnitude(
      asteroid,
      timeToImpact,
      method.physicsParams.efficiency
    );

    // Calculate new velocity direction (deflected away from Earth)
    // Use smaller deflection angles for more realistic changes
    const deflectionAngle = method.physicsParams.directionChange * Math.PI / 180 * 0.1; // 10% of original
    const perpendicular = new THREE.Vector3(-asteroidToEarth.y, asteroidToEarth.x, 0).normalize();

    const newDirection = asteroidToEarth.clone()
      .multiplyScalar(Math.cos(deflectionAngle))
      .add(perpendicular.clone().multiplyScalar(Math.sin(deflectionAngle)))
      .normalize();

    // Calculate velocity change vector (smaller magnitude)
    const velocityChange = newDirection.clone()
      .multiplyScalar(requiredChange * 0.1) // 10% of calculated change for subtle deflection
      .sub(velocity);

    return velocityChange;
  }

  /**
   * Calculate required change magnitude based on orbital mechanics
   */
  private static calculateRequiredChangeMagnitude(
    asteroid: AsteroidOrbitData,
    timeToImpact: number,
    efficiency: number
  ): number {
    // Calculate current miss distance
    const currentMissDistance = asteroid.missDistance * this.AU_TO_KM;

    // Calculate required miss distance (safety margin)
    const requiredMissDistance = this.EARTH_RADIUS * 10; // 10x Earth radius

    // Calculate required velocity change using orbital mechanics
    const velocityChange = (currentMissDistance - requiredMissDistance) / (timeToImpact * 24 * 3600);

    // Apply method efficiency
    return velocityChange / efficiency;
  }

  /**
   * Calculate new orbital elements after deflection
   */
  private static calculateNewOrbit(
    asteroid: AsteroidOrbitData,
    velocityChange: THREE.Vector3,
    method: DeflectionMethod
  ): AsteroidOrbitData {
    // Calculate new velocity
    const newVelocity = asteroid.velocity + velocityChange.length();

    // Calculate new orbital elements using vis-viva equation
    const mu = this.G * this.EARTH_MASS;
    const r = asteroid.position.length() * this.AU_TO_KM;
    const v = newVelocity;

    // Calculate new semi-major axis with validation
    const denominator = 2 - (r * v * v) / mu;
    let newSemiMajorAxis = r / denominator;

    // Validate and clamp values to prevent NaN
    if (!isFinite(newSemiMajorAxis) || newSemiMajorAxis <= 0) {
      newSemiMajorAxis = asteroid.semiMajorAxis * this.AU_TO_KM; // Fallback to original
    }

    // Calculate new eccentricity with validation
    const h = r * v; // Specific angular momentum
    const eccentricityTerm = 1 - (h * h) / (mu * newSemiMajorAxis);
    let newEccentricity = Math.sqrt(Math.max(0, eccentricityTerm));

    // Validate eccentricity
    if (!isFinite(newEccentricity)) {
      newEccentricity = asteroid.eccentricity; // Fallback to original
    }

    // Calculate new inclination (deflection changes orbital plane)
    // Much smaller inclination change for subtle deflection
    const inclinationChange = method.physicsParams.directionChange * 0.01; // 1% of original for subtle change
    let newInclination = asteroid.inclination + inclinationChange;

    // Validate inclination
    if (!isFinite(newInclination)) {
      newInclination = asteroid.inclination; // Fallback to original
    }

    // Calculate new position (deflected trajectory)
    const deflectionFactor = method.physicsParams.efficiency;
    const newPosition = asteroid.position.clone()
      .add(velocityChange.clone().multiplyScalar(deflectionFactor));

    // Validate position - check if all components are finite
    if (!isFinite(newPosition.x) || !isFinite(newPosition.y) || !isFinite(newPosition.z)) {
      newPosition.copy(asteroid.position); // Fallback to original
    }

    return {
      eccentricity: Math.max(0.1, Math.min(0.9, newEccentricity)),
      inclination: Math.max(0, Math.min(180, newInclination)),
      semiMajorAxis: Math.max(0.5, newSemiMajorAxis / this.AU_TO_KM),
      velocity: Math.max(0.1, newVelocity), // Ensure positive velocity
      position: newPosition,
      approachDate: asteroid.approachDate,
      missDistance: this.calculateNewMissDistance(asteroid, velocityChange)
    };
  }

  /**
   * Calculate new miss distance after deflection
   */
  private static calculateNewMissDistance(
    asteroid: AsteroidOrbitData,
    velocityChange: THREE.Vector3
  ): number {
    // Calculate deflection angle
    const deflectionAngle = velocityChange.length() / Math.max(0.1, asteroid.velocity);

    // Calculate new miss distance using orbital mechanics
    const currentMissDistance = asteroid.missDistance;
    const deflectionFactor = Math.cos(Math.min(Math.PI / 2, deflectionAngle)); // Clamp to prevent negative values

    const newMissDistance = currentMissDistance * deflectionFactor;

    // Validate and ensure positive miss distance
    return Math.max(0.001, newMissDistance); // Minimum 0.001 AU for safety
  }

  /**
   * Calculate success probability based on physics
   */
  private static calculateSuccessProbability(
    asteroid: AsteroidOrbitData,
    method: DeflectionMethod,
    timeToImpact: number
  ): boolean {
    // Debug controls override
    if (DEBUG_CONFIG.ENABLE_DEBUG_CONTROLS) {
      if (DEBUG_CONFIG.FORCE_DEFLECTION_SUCCESS) {
        return true;
      }
      if (DEBUG_CONFIG.FORCE_DEFLECTION_FAILURE) {
        return false;
      }
      if (DEBUG_CONFIG.OVERRIDE_SUCCESS_RATE !== null) {
        return Math.random() < DEBUG_CONFIG.OVERRIDE_SUCCESS_RATE;
      }
    }

    // Calculate base success rate from method
    const baseSuccessRate = method.physicsParams.reliability;

    // Apply time factor (earlier deflection = higher success)
    const timeFactor = Math.max(0.1, 1 - (timeToImpact / 365)); // 1 year max

    // Apply asteroid size factor (smaller = easier to deflect)
    const sizeFactor = Math.max(0.1, 1 / Math.log(asteroid.velocity + 1));

    // Apply method efficiency
    const efficiencyFactor = method.physicsParams.efficiency;

    // Calculate final success probability
    const successProbability = baseSuccessRate * timeFactor * sizeFactor * efficiencyFactor;

    return Math.random() < successProbability;
  }

  /**
   * Calculate impact probability reduction
   */
  private static calculateImpactProbabilityReduction(
    originalAsteroid: AsteroidOrbitData,
    deflectedAsteroid: AsteroidOrbitData
  ): number {
    // Calculate original impact probability
    const originalMissDistance = originalAsteroid.missDistance;
    const earthRadiusAU = this.EARTH_RADIUS / this.AU_TO_KM;
    const originalImpactProbability = Math.max(0, 1 - (originalMissDistance / earthRadiusAU));

    // Calculate new impact probability
    const newMissDistance = deflectedAsteroid.missDistance;
    const newImpactProbability = Math.max(0, 1 - (newMissDistance / earthRadiusAU));

    // Calculate reduction percentage
    const reduction = ((originalImpactProbability - newImpactProbability) / originalImpactProbability) * 100;

    return Math.max(0, Math.min(100, reduction));
  }

  /**
   * Calculate energy required for deflection
   */
  private static calculateEnergyRequired(
    velocityChange: THREE.Vector3
  ): number {
    // Debug controls override
    if (DEBUG_CONFIG.ENABLE_DEBUG_CONTROLS && DEBUG_CONFIG.OVERRIDE_ENERGY_REQUIRED !== null) {
      return DEBUG_CONFIG.OVERRIDE_ENERGY_REQUIRED;
    }

    // Estimate asteroid mass (assuming spherical asteroid with density 2.6 g/cm³)
    const asteroidRadius = 0.5; // km (estimated)
    const density = 2600; // kg/m³
    const volume = (4 / 3) * Math.PI * Math.pow(asteroidRadius * 1000, 3);
    const mass = density * volume;

    // Calculate kinetic energy change
    const velocityChangeMagnitude = velocityChange.length();
    const energyChange = 0.5 * mass * Math.pow(velocityChangeMagnitude, 2);

    return energyChange;
  }

  /**
   * Get deflection methods with realistic physics parameters
   */
  static getDeflectionMethods(): DeflectionMethod[] {
    return [
      {
        id: 'kinetic',
        name: 'Kinetic Impactor',
        description: 'High-speed collision to alter trajectory',
        successRate: 0.85,
        cost: 500,
        timeRequired: 24,
        physicsParams: {
          velocityChange: 0.01, // km/s - much smaller for realistic deflection
          directionChange: 0.5, // degrees - subtle change
          efficiency: 0.8,
          reliability: 0.85
        }
      },
      {
        id: 'gravity',
        name: 'Gravity Tractor',
        description: 'Use spacecraft mass to gradually pull asteroid',
        successRate: 0.70,
        cost: 800,
        timeRequired: 168,
        physicsParams: {
          velocityChange: 0.005, // km/s - very small gradual change
          directionChange: 0.2, // degrees - minimal change
          efficiency: 0.6,
          reliability: 0.7
        }
      },
      {
        id: 'nuclear',
        name: 'Nuclear Deflection',
        description: 'Nuclear explosion to alter trajectory',
        successRate: 0.95,
        cost: 2000,
        timeRequired: 48,
        physicsParams: {
          velocityChange: 0.02, // km/s - still small but more than kinetic
          directionChange: 1.0, // degrees - larger but still subtle
          efficiency: 0.9,
          reliability: 0.95
        }
      }
    ];
  }
}
