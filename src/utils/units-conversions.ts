// Centralized units and conversion helpers
// Keep this module dependency-light; only import numeric constants

import {
  AU_IN_KM,
  AU_TO_UNITS,
  SECONDS_PER_DAY,
  KM_PER_S_TO_M_PER_S,
} from "../config/constants";

// Distance
export const kmToM = (km: number): number => km * 1000;
export const mToKm = (m: number): number => m / 1000;

export const kmToAu = (km: number): number => km / AU_IN_KM;
export const auToKm = (au: number): number => au * AU_IN_KM;

export const auToUnits = (au: number): number => au * AU_TO_UNITS;
export const unitsToAu = (units: number): number => units / AU_TO_UNITS;

export const kmToUnits = (km: number): number => auToUnits(kmToAu(km));
export const unitsToKm = (units: number): number => auToKm(unitsToAu(units));

// Velocity
export const kmpsToMps = (kmps: number): number => kmps * KM_PER_S_TO_M_PER_S;
export const mpsToKmps = (mps: number): number => mps / KM_PER_S_TO_M_PER_S;

// Time
export const daysToSeconds = (days: number): number => days * SECONDS_PER_DAY;
export const secondsToDays = (seconds: number): number =>
  seconds / SECONDS_PER_DAY;

// Angles
export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

// Mass
export const TONNE_KG = 1000; // metric tonne
export const kgToTonnes = (kg: number): number => kg / TONNE_KG;
export const tonnesToKg = (t: number): number => t * TONNE_KG;

// Energy
export const TNT_EQUIV_J_PER_MT = 4.184e15; // 1 megaton TNT in Joules
export const joulesToMegatons = (J: number): number => J / TNT_EQUIV_J_PER_MT;
export const megatonsToJoules = (mt: number): number => mt * TNT_EQUIV_J_PER_MT;

// Composite helpers
export const simDaysToRealSeconds = (
  simDays: number,
  daysPerSecond: number
): number => daysToSeconds(simDays) / daysPerSecond;

export const realSecondsToSimDays = (
  realSeconds: number,
  daysPerSecond: number
): number => secondsToDays(realSeconds) * daysPerSecond;
