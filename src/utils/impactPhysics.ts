/**
 * Impact Physics Calculations
 * Based on scientific models for asteroid impact analysis
 */

export interface ImpactPhysicsInput {
  diameter: number; // meters
  velocity: number; // km/s
  density?: number; // kg/m³ (default: 3000 for rocky asteroids)
  angle?: number; // degrees from horizontal (default: 45)
}

export interface ImpactPhysicsResults {
  mass: number; // kg
  kineticEnergy: number; // Joules
  tntEquivalent: number; // megatons
  craterDiameter: number; // meters
  craterDepth: number; // meters
  seismicMagnitude: number; // Richter scale
  airblastRadius: number; // km (severe damage)
  thermalRadius: number; // km (3rd degree burns)
  tsunamiWaveHeight: number; // meters (if ocean impact)
  ejectaRadius: number; // km
  impactDescription: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'catastrophic';
}

const TNT_ENERGY = 4.184e9; // Joules per ton of TNT
const MEGATONS = 1e6; // tons per megaton

/**
 * Calculate asteroid mass from diameter and density
 */
export function calculateMass(diameter: number, density: number = 3000): number {
  const radius = diameter / 2;
  const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
  return volume * density;
}

/**
 * Calculate kinetic energy
 * KE = 0.5 * m * v²
 */
export function calculateKineticEnergy(mass: number, velocity: number): number {
  const velocityMetersPerSec = velocity * 1000; // Convert km/s to m/s
  return 0.5 * mass * Math.pow(velocityMetersPerSec, 2);
}

/**
 * Convert energy to TNT equivalent
 */
export function energyToTNT(energyJoules: number): number {
  return energyJoules / TNT_ENERGY / MEGATONS; // megatons
}

/**
 * Estimate crater diameter using scaling laws
 * Based on Pike (1980) and Holsapple (1993) crater scaling relationships
 */
export function calculateCraterSize(
  energy: number,
  _density = 3000,
  angle: number = 45
): { diameter: number; depth: number } {
  // Suppress unused parameter warning
  void _density;
  // Energy in megatons
  const energyMT = energyToTNT(energy);
  
  // Simple crater scaling (approximate)
  // D (km) ≈ 0.4 * E^0.33 for energy E in megatons
  const diameterKm = 0.4 * Math.pow(energyMT, 0.33);
  const diameter = diameterKm * 1000; // Convert to meters
  
  // Depth is typically 1/5 to 1/3 of diameter for simple craters
  const depth = diameter / 5;
  
  // Adjust for impact angle (oblique impacts create smaller craters)
  const angleRadians = (angle * Math.PI) / 180;
  const angleFactor = Math.pow(Math.sin(angleRadians), 1 / 3);
  
  return {
    diameter: diameter * angleFactor,
    depth: depth * angleFactor,
  };
}

/**
 * Estimate seismic magnitude
 * Based on empirical relationships between impact energy and seismic effects
 */
export function calculateSeismicMagnitude(energy: number): number {
  // Relationship: M ≈ 0.67 * log10(E) - 5.87
  // where E is in Joules
  const magnitude = 0.67 * Math.log10(energy) - 5.87;
  return Math.max(0, magnitude); // Magnitude can't be negative
}

/**
 * Calculate airblast radius (severe damage zone)
 * Based on overpressure models
 */
export function calculateAirblastRadius(energyMT: number): number {
  // Radius in km for severe damage (20 psi overpressure)
  // R ≈ 2.2 * E^0.33
  return 2.2 * Math.pow(energyMT, 0.33);
}

/**
 * Calculate thermal radiation radius
 * Radius where 3rd degree burns occur
 */
export function calculateThermalRadius(energyMT: number): number {
  // R ≈ 1.5 * E^0.41
  return 1.5 * Math.pow(energyMT, 0.41);
}

/**
 * Estimate tsunami wave height for ocean impacts
 * Simplified model based on impact energy and water depth
 */
export function calculateTsunamiHeight(
  energy: number,
  isOcean: boolean,
  waterDepth: number = 4000 // average ocean depth in meters
): number {
  if (!isOcean) return 0;
  
  const energyMT = energyToTNT(energy);
  
  // Simplified tsunami height model
  // H (m) ≈ 0.1 * sqrt(E_MT) * sqrt(depth/1000)
  const height = 0.1 * Math.sqrt(energyMT) * Math.sqrt(waterDepth / 1000);
  
  return Math.min(height, 300); // Cap at 300m (extreme case)
}

/**
 * Calculate ejecta blanket radius
 */
export function calculateEjectaRadius(craterDiameter: number): number {
  // Ejecta typically extends 2-3 crater radii
  return (craterDiameter / 2) * 2.5 / 1000; // Convert to km
}

/**
 * Generate impact description based on energy
 */
export function getImpactDescription(energyMT: number): string {
  if (energyMT < 0.001) {
    return 'Airburst in atmosphere, minimal surface damage';
  } else if (energyMT < 0.01) {
    return 'Local damage, similar to a small bomb';
  } else if (energyMT < 1) {
    return 'Regional devastation, city-scale destruction';
  } else if (energyMT < 100) {
    return 'Major regional catastrophe, country-scale effects';
  } else if (energyMT < 10000) {
    return 'Continental devastation, global climate effects';
  } else {
    return 'Mass extinction event, global catastrophe';
  }
}

/**
 * Determine risk level
 */
export function getRiskLevel(energyMT: number): 'low' | 'moderate' | 'high' | 'catastrophic' {
  if (energyMT < 0.01) return 'low';
  if (energyMT < 1) return 'moderate';
  if (energyMT < 100) return 'high';
  return 'catastrophic';
}

/**
 * Main function to calculate all impact effects
 */
export function calculateImpactPhysics(
  input: ImpactPhysicsInput,
  isOcean: boolean = false
): ImpactPhysicsResults {
  const { diameter, velocity, density = 3000, angle = 45 } = input;
  
  // Calculate fundamental properties
  const mass = calculateMass(diameter, density);
  const kineticEnergy = calculateKineticEnergy(mass, velocity);
  const tntEquivalent = energyToTNT(kineticEnergy);
  
  // Calculate crater dimensions
  const { diameter: craterDiameter, depth: craterDepth } = calculateCraterSize(
    kineticEnergy,
    density,
    angle
  );
  
  // Calculate other effects
  const seismicMagnitude = calculateSeismicMagnitude(kineticEnergy);
  const airblastRadius = calculateAirblastRadius(tntEquivalent);
  const thermalRadius = calculateThermalRadius(tntEquivalent);
  const tsunamiWaveHeight = calculateTsunamiHeight(kineticEnergy, isOcean);
  const ejectaRadius = calculateEjectaRadius(craterDiameter);
  
  const impactDescription = getImpactDescription(tntEquivalent);
  const riskLevel = getRiskLevel(tntEquivalent);
  
  return {
    mass,
    kineticEnergy,
    tntEquivalent,
    craterDiameter,
    craterDepth,
    seismicMagnitude,
    airblastRadius,
    thermalRadius,
    tsunamiWaveHeight,
    ejectaRadius,
    impactDescription,
    riskLevel,
  };
}

/**
 * Compare two impact scenarios
 */
export function compareImpacts(
  impact1: ImpactPhysicsResults,
  impact2: ImpactPhysicsResults
): {
  energyReduction: number; // percentage
  craterReduction: number; // percentage
  casualtyReduction: number; // estimated percentage
} {
  const energyReduction = ((impact1.tntEquivalent - impact2.tntEquivalent) / impact1.tntEquivalent) * 100;
  const craterReduction = ((impact1.craterDiameter - impact2.craterDiameter) / impact1.craterDiameter) * 100;
  
  // Casualty reduction is roughly proportional to affected area (radius squared)
  const area1 = Math.PI * Math.pow(impact1.airblastRadius, 2);
  const area2 = Math.PI * Math.pow(impact2.airblastRadius, 2);
  const casualtyReduction = ((area1 - area2) / area1) * 100;
  
  return {
    energyReduction: Math.max(0, energyReduction),
    craterReduction: Math.max(0, craterReduction),
    casualtyReduction: Math.max(0, casualtyReduction),
  };
}

