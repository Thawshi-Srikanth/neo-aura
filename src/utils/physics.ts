// Basic impact physics utilities (order-of-magnitude, educational use)

// Unit conversions
import { kmToM, joulesToMegatons } from "./units-conversions";
export const KM_TO_M = 1000;
export const DENSITY_ROCK_KG_M3 = 3000; // typical stony asteroid
export const DENSITY_IRON_KG_M3 = 7800; // iron asteroid
export const GRAVITY_EARTH = 9.80665; // m/s^2
export const TNT_EQUIV_J_PER_MT = 4.184e15; // 1 megaton TNT in Joules

export type ImpactorMaterial = "rock" | "iron";

export interface ImpactInput {
  diameterKm: number; // asteroid diameter in km
  velocityKmPerS: number; // impact velocity in km/s
  impactAngleDeg?: number; // entry angle relative to horizontal, default 45
  material?: ImpactorMaterial; // default rock
}

export interface ImpactEstimates {
  massKg: number;
  kineticEnergyJ: number;
  kineticEnergyMt: number;
  transientCraterDiameterKm: number;
  finalCraterDiameterKm: number;
  momentMagnitudeEstimate: number; // Mw equivalent
}

function getMaterialDensity(material: ImpactorMaterial): number {
  return material === "iron" ? DENSITY_IRON_KG_M3 : DENSITY_ROCK_KG_M3;
}

// Compute asteroid mass (sphere): m = 4/3 π (r^3) ρ
export function estimateImpactorMassKg(
  diameterKm: number,
  material: ImpactorMaterial = "rock"
): number {
  const radiusM = kmToM(diameterKm) / 2;
  const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusM, 3);
  return volumeM3 * getMaterialDensity(material);
}

// Kinetic energy: 1/2 m v^2
export function kineticEnergyJ(massKg: number, velocityKmPerS: number): number {
  const v = velocityKmPerS * KM_TO_M; // m/s
  return 0.5 * massKg * v * v;
}

// use units helper joulesToMegatons

// Very simplified crater scaling (order-of-magnitude):
// transient diameter ~ C * (E)^(1/3.4) with C tuned for Earth gravity and rock
// This is a pedagogical approximation, not for scientific analysis.
export function estimateCraterDiametersKm(energyJ: number): {
  transientKm: number;
  finalKm: number;
} {
  const C = 1.8e-5; // tuned coefficient to yield realistic scales for 10-1000 Mt
  const transientKm = C * Math.pow(energyJ, 1 / 3.4);
  // Final crater is ~1.2-1.5x transient for complex craters
  const finalKm = transientKm * 1.3;
  return { transientKm, finalKm };
}

// Very approximate conversion to moment magnitude Mw based on energy
// Mw ≈ (2/3) log10(E) - 3.2, where E in Joules (heuristic for comparison)
export function estimateSeismicMw(energyJ: number): number {
  const logE = Math.log10(Math.max(energyJ, 1));
  return (2 / 3) * logE - 3.2;
}

export function estimateImpact(input: ImpactInput): ImpactEstimates {
  const { diameterKm, velocityKmPerS, material = "rock" } = input;
  const massKg = estimateImpactorMassKg(diameterKm, material);
  const E = kineticEnergyJ(massKg, velocityKmPerS);
  const Emt = joulesToMegatons(E);
  const { transientKm, finalKm } = estimateCraterDiametersKm(E);
  const Mw = estimateSeismicMw(E);
  return {
    massKg,
    kineticEnergyJ: E,
    kineticEnergyMt: Emt,
    transientCraterDiameterKm: transientKm,
    finalCraterDiameterKm: finalKm,
    momentMagnitudeEstimate: Mw,
  };
}
