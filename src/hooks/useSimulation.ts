import { useState } from "react";
import type { ImpactData } from "../types/simulation";
import * as THREE from "three";

export const useSimulationState = () => {
  const [timeToImpact, setTimeToImpact] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [impactPosition, setImpactPosition] = useState<THREE.Vector3 | null>(
    null
  );
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [asteroidVisible, setAsteroidVisible] = useState(true);
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [resetKey, setResetKey] = useState(0);

  const resetSimulation = () => {
    setTimeToImpact(null);
    setCountdown(null);
    setImpactPosition(null);
    setImpactData(null);
    setAsteroidVisible(true);
    setSimulationRunning(true);
    setResetKey((prev) => prev + 1);
  };

  return {
    state: {
      timeToImpact,
      countdown,
      impactPosition,
      impactData,
      asteroidVisible,
      simulationRunning,
      resetKey,
    },
    actions: {
      setTimeToImpact,
      setCountdown,
      setImpactPosition,
      setImpactData,
      setAsteroidVisible,
      setSimulationRunning,
      resetSimulation,
    },
  };
};