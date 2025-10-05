import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";
import { AU_TO_UNITS } from "../../config/constants";

export function Labels({
  earthRef,
  asteroidRef,
  collisionAsteroidRef,
  showCollisionAsteroid,
  onDistanceChange,
}: {
  earthRef: React.RefObject<THREE.Mesh>;
  asteroidRef: React.RefObject<THREE.Mesh>;
  collisionAsteroidRef?: React.RefObject<THREE.Mesh>;
  showCollisionAsteroid?: boolean;
  onDistanceChange?: (distance: number) => void;
}) {
  const [distance, setDistance] = useState(0);
  const lineRef = useRef<THREE.Line>(null);

  useFrame(() => {
    // Calculate distance between Earth and active asteroid
    const activeAsteroidRef = showCollisionAsteroid ? collisionAsteroidRef : asteroidRef;
    if (earthRef.current && activeAsteroidRef?.current) {
      const earthP = earthRef.current.position;
      const asteroidP = activeAsteroidRef.current.position;
      const dist = earthP.distanceTo(asteroidP);
      // Convert from simulation units to real-world units (km)
      const realWorldDist = dist * (149597870.7 / AU_TO_UNITS); // Convert to km
      setDistance(realWorldDist);
      onDistanceChange?.(realWorldDist);

      if (lineRef.current) {
        lineRef.current.geometry.setPositions([
          earthP.x,
          earthP.y,
          earthP.z,
          asteroidP.x,
          asteroidP.y,
          asteroidP.z,
        ]);
        lineRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
  });

  return (
    <>
      {/* Distance Line */}
      {distance > 0 && (
        <Line
          ref={lineRef}
          points={[
            [0, 0, 0],
            [0, 0, 0],
          ]}
          color="white"
          dashed
          dashSize={0.1}
          gapSize={0.1}
        />
      )}
    </>
  );
}
