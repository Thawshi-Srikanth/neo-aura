import React, { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { Asteroid } from "../../types/asteroid";

interface NEOOrbitPathProps {
  asteroid: Asteroid;
  visible?: boolean;
  color?: string;
  opacity?: number;
  segments?: number;
  scale?: number;
}

const NEOOrbitPath: React.FC<NEOOrbitPathProps> = ({
  asteroid,
  visible = true,
  color = "#00ff00",
  opacity = 0.9,
  segments = 10,
  scale = 2.0,
}) => {
  const points = useMemo(() => {
    if (!asteroid.orbital_data) return [];

    const positions: THREE.Vector3[] = [];

    try {
      // Calculate orbital period in days
      const meanMotion = parseFloat(asteroid.orbital_data.mean_motion); // degrees per day
      const orbitalPeriod = 360 / meanMotion; // days for one complete orbit

      // Generate points along the orbital path
      for (let i = 0; i <= segments; i++) {
        const timeOffset = (i / segments) * orbitalPeriod;
        const [x, y, z] = getAsteroidPosition(
          timeOffset,
          asteroid.orbital_data
        );

        // Apply the same scale as the NEO points (2.0 units = 1 AU)
        // Proper coordinate mapping: X=X, Y=inclination(up/down), Z=Z(depth)
        const worldPos = new THREE.Vector3(x * scale, y * scale, z * scale);
        positions.push(worldPos);
      }
    } catch (error) {
      console.warn(`Error calculating orbit path for ${asteroid.name}:`, error);
      return [];
    }

    return positions;
  }, [asteroid, segments, scale]);

  if (!visible || points.length === 0) return null;

  return (
    <Line
      points={points}
      color={color}
      transparent
      opacity={opacity}
      lineWidth={0.7}
      dashed
      dashSize={0.009}
      gapSize={0.05}
    />
  );
};

export default NEOOrbitPath;
