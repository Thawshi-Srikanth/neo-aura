import { Line } from "@react-three/drei";
import { useEffect, useState } from "react";
import { Vector3 } from "three";
import { calculateOrbitalPosition } from "../../utils/orbital-calculations";

interface NEOTrailProps {
  orbitalElements: {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    ascendingNode: number;
    argumentOfPeriapsis: number;
  };
}

const NEOTrail = ({ orbitalElements }: NEOTrailProps) => {
  const [points, setPoints] = useState<Vector3[]>([]);

  useEffect(() => {
    // Generate 100 points along the orbit
    const pointsArr: Vector3[] = [];
    for (let i = 0; i < 100; i++) {
      const E = (2 * Math.PI * i) / 100; // Eccentric anomaly from 0 to 2π
      const [x, y] = calculateOrbitalPosition(
        orbitalElements.semiMajorAxis,
        orbitalElements.eccentricity,
        E
      );
      pointsArr.push(new Vector3(x, y, 0));
    }
    setPoints(pointsArr);
  }, [orbitalElements]);

  return (
    <Line
      points={points}
      color="red"
      lineWidth={1}
      transparent
      opacity={0.5}
      position={[0, 0, 0]} // Add this line
    />
  );
};

export default NEOTrail;
