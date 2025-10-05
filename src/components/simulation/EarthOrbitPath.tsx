import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { getEarthPosition } from "../../utils/orbital-calculations";
import { AU_TO_UNITS } from "../../config/constants";

export function EarthOrbitPath() {
  const points = useMemo(() => {
    const pathPoints = [];
    const segments = 256; // Number of points for smooth circle
    
    // Earth's orbital period is approximately 365.25 days
    const earthPeriod = 365.25;
    
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * earthPeriod; // Time from 0 to full period
      const [x, y, z] = getEarthPosition(t);
      pathPoints.push(new THREE.Vector3(x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS));
    }
    return pathPoints;
  }, []);

  return <Line points={points} color="#4A90E2" lineWidth={2} />;
}
