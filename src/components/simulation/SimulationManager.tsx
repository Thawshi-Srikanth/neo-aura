import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { SimulationManagerProps } from "../../types/simulation";

export function SimulationManager({
  timeToImpact,
  setCountdown,
  simulationSpeed,
  daysPerSecond,
  simulationRunning = true,
  onTimeUpdate,
}: SimulationManagerProps) {
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (simulationRunning) {
      // Update simulation time
      timeRef.current += delta * simulationSpeed * daysPerSecond;
    }

    // Notify parent component of time update
    if (onTimeUpdate) {
      onTimeUpdate(timeRef.current);
    }

    if (timeToImpact !== null) {
      const remaining = timeToImpact - timeRef.current;
      setCountdown(remaining > 0 ? remaining : 0);
    } else {
      setCountdown(null);
    }
  });

  return null;
}
