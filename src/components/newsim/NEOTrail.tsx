import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { Asteroid } from "../../types/asteroid";

interface NEOTrailProps {
  asteroid: Asteroid;
  currentTime: number;
  trailLength?: number;
  trailColor?: string;
  trailOpacity?: number;
  lineWidth?: number;
  visible?: boolean;
}

const NEOTrail: React.FC<NEOTrailProps> = ({
  asteroid,
  currentTime,
  trailLength = 100,
  trailColor = "#ffff00",
  trailOpacity = 0.6,
  lineWidth = 2,
  visible = true,
}) => {
  const points = useMemo(() => {
    if (!visible) return [];

    const positions: THREE.Vector3[] = [];
    const scale = 0.1; // Same scale as NEOPoint

    try {
      // Generate trail points going backwards in time
      for (let i = 0; i < trailLength; i++) {
        const timeOffset = (i / trailLength) * 365; // Trail over roughly a year
        const trailTime = currentTime - timeOffset;

        const [x, y, z] = getAsteroidPosition(trailTime, asteroid.orbital_data);
        positions.push(new THREE.Vector3(x * scale, z * scale, y * scale));
      }
    } catch (error) {
      console.warn(`Error generating trail for ${asteroid.name}:`, error);
    }

    return positions;
  }, [asteroid, currentTime, trailLength, visible]);

  if (!visible || points.length === 0) return null;

  return (
    <Line
      points={points}
      color={trailColor}
      transparent
      opacity={trailOpacity}
      lineWidth={lineWidth}
    />
  );
};

export default NEOTrail;
