import { useMemo } from "react";
import * as THREE from "three";
import { type CollisionOrbit, getCollisionOrbitPosition } from "../../utils/orbitalCollision";
import { getEarthPosition } from "../../utils/orbital-calculations";

interface CollisionOrbitPathProps {
  collisionOrbit: CollisionOrbit;
  visible?: boolean;
}

export function CollisionOrbitPath({ collisionOrbit, visible = true }: CollisionOrbitPathProps) {
  const { orbitPoints, earthOrbitPoints } = useMemo(() => {
    if (!visible) return { orbitPoints: [], earthOrbitPoints: [] };

    const asteroidPoints: THREE.Vector3[] = [];
    const earthPoints: THREE.Vector3[] = [];
    const intersections: THREE.Vector3[] = [];
    const numPoints = 200;

    // Show one complete orbital period
    const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(collisionOrbit.semiMajorAxis, 3));
    const timeStep = orbitalPeriod / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const t = i * timeStep;

      // Asteroid position
      const asteroidPosition = getCollisionOrbitPosition(collisionOrbit, t);
      asteroidPoints.push(asteroidPosition);

      // Earth position - already in correct coordinate system from getEarthPosition
      const [earthX, earthY, earthZ] = getEarthPosition(t);
      const earthPosition = new THREE.Vector3(earthX * 2, earthY * 2, earthZ * 2); // Apply AU_TO_UNITS scaling
      earthPoints.push(earthPosition);

      // Check for intersections (close approaches)
      const distance = asteroidPosition.distanceTo(earthPosition);
      if (distance < 0.1) { // Close approach threshold
        intersections.push(asteroidPosition.clone());
      }
    }

    return {
      orbitPoints: asteroidPoints,
      earthOrbitPoints: earthPoints
    };
  }, [collisionOrbit, visible]);

  if (!visible || orbitPoints.length === 0) {
    return null;
  }

  return (
    <group>
      {/* Asteroid collision orbit */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(orbitPoints.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff6b6b" linewidth={3} />
      </line>

      {/* Earth's orbit for comparison */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(earthOrbitPoints.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#4a90e2" linewidth={2} opacity={0.7} transparent />
      </line>

      {/* Intersection points - disabled */}
      {/* {intersectionPoints.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      ))} */}
    </group>
  );
}
