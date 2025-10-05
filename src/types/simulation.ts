import * as THREE from "three";
import type { ImpactPhysicsResults } from "../utils/impactPhysics";

export interface ImpactData {
  lat: number;
  lon: number;
  isLand: boolean;
  physics?: ImpactPhysicsResults;
}

export interface SimulationUIState {
  timeToImpact: number | null;
  countdown: number | null;
  impactPosition: THREE.Vector3 | null;
  impactData: ImpactData | null;
  asteroidVisible: boolean;
  simulationRunning: boolean;
  resetKey: number;
}

export interface EarthProps {
  impactPosition: THREE.Vector3 | null;
  onImpactAnalyzed: (data: ImpactData) => void;
  simulationRunning: boolean;
  simulationTime: number;
}

export interface SimulationManagerProps {
  timeToImpact: number | null;
  setCountdown: (countdown: number | null) => void;
  simulationSpeed: number;
  daysPerSecond: number;
  simulationRunning?: boolean;
  onTimeUpdate?: (time: number) => void;
}

// Local orbital parameters type for simulation helpers
export interface OrbitalParameters {
  eccentricity: number;
  semi_major_axis: number; // in AU or scaled units per caller convention
  inclination: number; // degrees
  ascending_node_longitude: number; // degrees
  perihelion_argument: number; // degrees
}
