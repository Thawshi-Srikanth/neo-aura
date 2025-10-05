import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useRef, useState } from "react";
import * as THREE from "three";
import { AU_TO_UNITS } from "../../config/constants";
import { Text3D } from "./Text3D";

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

  // Format distance to match Legend display
  const formatDistance = (dist: number) => {
    if (dist === 0) return "0 km";
    
    if (dist < 1000) {
      return `${dist.toFixed(1)} km`;
    } else if (dist < 1000000) {
      return `${(dist / 1000).toFixed(1)}k km`;
    } else {
      return `${(dist / 1000000).toFixed(1)}M km`;
    }
  };

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
        const positions = [
          earthP.x,
          earthP.y,
          earthP.z,
          asteroidP.x,
          asteroidP.y,
          asteroidP.z,
        ];
        const positionAttribute = lineRef.current.geometry.getAttribute('position');
        if (positionAttribute && 'set' in positionAttribute) {
          (positionAttribute as any).set(positions);
          positionAttribute.needsUpdate = true;
        }
      }
    }
  });

  return (
    <>
      {/* Distance Line - Dotted line from Earth to Asteroid */}
      {distance > 0 && earthRef.current && (showCollisionAsteroid ? collisionAsteroidRef?.current : asteroidRef.current) && (
        <Line
          ref={lineRef as any}
          points={[
            [earthRef.current.position.x, earthRef.current.position.y, earthRef.current.position.z],
            [
              showCollisionAsteroid ? (collisionAsteroidRef?.current?.position.x || 0) : (asteroidRef.current?.position.x || 0),
              showCollisionAsteroid ? (collisionAsteroidRef?.current?.position.y || 0) : (asteroidRef.current?.position.y || 0),
              showCollisionAsteroid ? (collisionAsteroidRef?.current?.position.z || 0) : (asteroidRef.current?.position.z || 0),
            ]
          ]}
          color="white"
          dashed
          dashSize={0.05}
          gapSize={0.05}
        />
      )}

      {/* Distance Label - Show at asteroid position */}
      {distance > 0 && earthRef.current && (showCollisionAsteroid ? collisionAsteroidRef?.current : asteroidRef.current) && (
        <Text3D
          position={[
            (showCollisionAsteroid ? (collisionAsteroidRef?.current?.position.x || 0) : (asteroidRef.current?.position.x || 0)) + 0.1,
            (showCollisionAsteroid ? (collisionAsteroidRef?.current?.position.y || 0) : (asteroidRef.current?.position.y || 0)) + 0.1,
            (showCollisionAsteroid ? (collisionAsteroidRef?.current?.position.z || 0) : (asteroidRef.current?.position.z || 0)) + 0.1,
          ]}
          text={formatDistance(distance)}
          color="#ffffff"
          size={0.12}
        />
      )}
    </>
  );
}
