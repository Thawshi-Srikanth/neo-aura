import { predictImpact, timeToDate } from "./impact-prediction";
import type { Asteroid } from "../types/asteroid";

export interface ThreatLevel {
  level: "LOW" | "MODERATE" | "HIGH" | "EXTREME" | "EXTINCTION";
  color: string;
  description: string;
}

export interface ImpactAssessment {
  asteroid: Asteroid;
  impactProbability: number;
  impactDate: Date | null;
  impactLocation: { lat: number; lon: number } | null;
  threatLevel: ThreatLevel;
  energyReleased: number; // Megatons TNT equivalent
  craterDiameter: number; // kilometers
  evacuationRadius: number; // kilometers
  timeToImpact: number; // days
  mitigationOptions: string[];
  affectedPopulation: number; // estimated
}

/**
 * Calculate energy released by asteroid impact (in megatons TNT)
 */
function calculateImpactEnergy(diameter: number, velocity: number): number {
  // Assume asteroid density ~2.5 g/cm³ and convert to energy
  const mass = (4 / 3) * Math.PI * Math.pow(diameter * 500, 3) * 2500; // kg
  const kineticEnergy = 0.5 * mass * Math.pow(velocity * 1000, 2); // Joules
  const megatonsTNT = kineticEnergy / 4.184e15; // Convert to megatons TNT
  return megatonsTNT;
}

/**
 * Calculate crater diameter from impact energy
 */
function calculateCraterDiameter(energy: number): number {
  // Empirical formula: D = 1.8 * (E^0.22) where D is crater diameter in km, E is energy in megatons
  return 1.8 * Math.pow(energy, 0.22);
}

/**
 * Determine threat level based on asteroid size and impact probability
 */
function assessThreatLevel(
  diameter: number,
  impactProbability: number,
  energy: number
): ThreatLevel {
  if (diameter > 10 || energy > 1000000) {
    return {
      level: "EXTINCTION",
      color: "#8B0000",
      description: "Global catastrophe - Mass extinction event possible",
    };
  } else if (diameter > 1 || energy > 10000) {
    return {
      level: "EXTREME",
      color: "#FF0000",
      description: "Regional devastation - Continental damage possible",
    };
  } else if (diameter > 0.1 || energy > 100) {
    return {
      level: "HIGH",
      color: "#FF4500",
      description: "Significant damage - City-level destruction possible",
    };
  } else if (impactProbability > 0.01) {
    return {
      level: "MODERATE",
      color: "#FFA500",
      description: "Moderate threat - Local damage possible",
    };
  } else {
    return {
      level: "LOW",
      color: "#32CD32",
      description: "Low threat - Minimal risk",
    };
  }
}

/**
 * Calculate evacuation radius based on impact energy
 */
function calculateEvacuationRadius(energy: number): number {
  // Conservative estimate: 50km base + energy-dependent scaling
  const baseRadius = 50;
  const scalingFactor = Math.sqrt(energy / 100);
  return Math.min(baseRadius * scalingFactor, 2000); // Cap at 2000km
}

/**
 * Estimate affected population (simplified)
 */
function estimateAffectedPopulation(
  _lat: number,
  _lon: number,
  radius: number
): number {
  // Very simplified population density estimation
  // Real implementation would use actual population data
  const avgPopDensity = 50; // people per km²
  const area = Math.PI * radius * radius;
  return Math.floor(area * avgPopDensity);
}

/**
 * Generate mitigation options based on threat level and time to impact
 */
function generateMitigationOptions(
  _threatLevel: ThreatLevel,
  timeToImpact: number,
  diameter: number
): string[] {
  const options: string[] = [];

  if (timeToImpact > 3650) {
    // >10 years
    options.push("🚀 Gravity Tractor - Gradual orbital modification");
    options.push("💥 Nuclear Pulse Detonation - Deflect trajectory");
    options.push("🛸 Ion Beam Shepherd - Long-term gentle push");
  }

  if (timeToImpact > 1825) {
    // >5 years
    options.push("🎯 Kinetic Impactor - Direct collision to alter path");
    options.push("☀️ Solar Sail Deployment - Use solar radiation pressure");
  }

  if (timeToImpact > 365) {
    // >1 year
    options.push("💣 Nuclear Explosive Device - Emergency deflection");
    if (diameter < 0.1) {
      options.push("🔥 Laser Ablation - Surface material removal");
    }
  }

  if (timeToImpact < 365) {
    // <1 year - Focus on protection
    options.push("🏃 Mass Evacuation - Relocate population from impact zone");
    options.push("🏢 Underground Shelters - Protect from blast effects");
    options.push("📡 Early Warning Systems - Alert affected populations");
    options.push("🚑 Emergency Response - Medical and rescue preparations");
  }

  if (options.length === 0) {
    options.push("⚠️ Emergency Protocols Only - Impact imminent");
  }

  return options;
}

/**
 * Comprehensive threat assessment for a single asteroid
 */
export function assessPlanetaryThreat(asteroid: Asteroid): ImpactAssessment {
  const currentTime = Date.now() / (1000 * 60 * 60 * 24); // Days since epoch
  // PERFORMANCE OPTIMIZATION: Reduced time range and step size
  const timeRange = {
    start: currentTime,
    end: currentTime + 365 * 10, // Look ahead 10 years (reduced from 100)
    step: 7, // Check every week (reduced from daily for performance)
  };

  const impactData = predictImpact(asteroid, timeRange);

  // Get asteroid physical properties
  const avgDiameter = asteroid.estimated_diameter.kilometers
    .estimated_diameter_max
    ? (asteroid.estimated_diameter.kilometers.estimated_diameter_min +
        asteroid.estimated_diameter.kilometers.estimated_diameter_max) /
      2
    : asteroid.estimated_diameter.kilometers.estimated_diameter_min || 0.1;

  // Estimate impact velocity (typical NEO velocity ~20 km/s)
  const impactVelocity = 20; // km/s

  // Calculate impact parameters
  const energyReleased = calculateImpactEnergy(avgDiameter, impactVelocity);
  const craterDiameter = calculateCraterDiameter(energyReleased);
  const threatLevel = assessThreatLevel(
    avgDiameter,
    impactData.impactProbability,
    energyReleased
  );

  const impactDate = impactData.time > 0 ? timeToDate(impactData.time) : null;
  const timeToImpact = impactDate
    ? (impactDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    : Infinity;

  const evacuationRadius = impactData.impactLocation
    ? calculateEvacuationRadius(energyReleased)
    : 0;
  const affectedPopulation = impactData.impactLocation
    ? estimateAffectedPopulation(
        impactData.impactLocation.lat,
        impactData.impactLocation.lon,
        evacuationRadius
      )
    : 0;

  const mitigationOptions = generateMitigationOptions(
    threatLevel,
    timeToImpact,
    avgDiameter
  );

  return {
    asteroid,
    impactProbability: impactData.impactProbability,
    impactDate,
    impactLocation: impactData.impactLocation,
    threatLevel,
    energyReleased,
    craterDiameter,
    evacuationRadius,
    timeToImpact,
    mitigationOptions,
    affectedPopulation,
  };
}

/**
 * Assess threats from multiple asteroids and prioritize
 */
export function assessMultipleThreat(
  asteroids: Asteroid[]
): ImpactAssessment[] {
  const assessments = asteroids.map(assessPlanetaryThreat);

  // Sort by threat level and impact probability
  return assessments.sort((a, b) => {
    const threatPriority = {
      EXTINCTION: 5,
      EXTREME: 4,
      HIGH: 3,
      MODERATE: 2,
      LOW: 1,
    };

    const priorityDiff =
      threatPriority[b.threatLevel.level] - threatPriority[a.threatLevel.level];
    if (priorityDiff !== 0) return priorityDiff;

    return b.impactProbability - a.impactProbability;
  });
}
