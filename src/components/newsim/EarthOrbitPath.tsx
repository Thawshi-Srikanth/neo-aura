import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

interface EarthOrbitPathProps {
  orbitRadius: number;
  visible?: boolean;
  color?: string;
  opacity?: number;
}

const EarthOrbitPath: React.FC<EarthOrbitPathProps> = ({
  orbitRadius,
  visible = true,
  color = "#4a90e2",
  opacity = 0.3,
}) => {
  const points = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const segments = 100;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      positions.push(new THREE.Vector3(x, 0, z));
    }

    return positions;
  }, [orbitRadius]);

  if (!visible) return null;

  return (
    <Line
      points={points}
      color={color}
      transparent
      opacity={opacity}
      lineWidth={3}
    />
  );
};

export default EarthOrbitPath;
