import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { Asteroid } from "../../types/asteroid";

interface InstancedNEOTrailsProps {
  asteroids: Asteroid[];
  currentTime: number;
  trailLength?: number;
  trailColor?: string;
  trailOpacity?: number;
  pointsPerTrail?: number;
}

const InstancedNEOTrails: React.FC<InstancedNEOTrailsProps> = ({
  asteroids,
  currentTime,
  trailLength = 50,
  trailColor = "#61FAFA",
  trailOpacity = 0.6,
  pointsPerTrail = 20, // Reduced for performance
}) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  // Trail data storage
  const trailDataRef = useRef<{
    totalInstances: number;
    validAsteroids: Asteroid[];
    trailPositions: Float32Array;
    trailOpacities: Float32Array;
  }>({
    totalInstances: 0,
    validAsteroids: [],
    trailPositions: new Float32Array(0),
    trailOpacities: new Float32Array(0),
  });

  // Initialize trail data
  useEffect(() => {
    const validAsteroids = asteroids.filter(
      (asteroid) =>
        asteroid.orbital_data &&
        asteroid.orbital_data.semi_major_axis &&
        asteroid.orbital_data.eccentricity &&
        asteroid.orbital_data.inclination &&
        asteroid.orbital_data.mean_motion
    );

    const totalInstances = validAsteroids.length * pointsPerTrail;

    trailDataRef.current = {
      totalInstances,
      validAsteroids,
      trailPositions: new Float32Array(totalInstances * 3),
      trailOpacities: new Float32Array(totalInstances),
    };
  }, [asteroids, pointsPerTrail]);

  // Geometry for trail points (small spheres)
  const geometry = useMemo(() => new THREE.SphereGeometry(0.001, 4, 4), []);

  // Material with transparency for fading effect
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: trailColor,
        transparent: true,
        opacity: trailOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [trailColor, trailOpacity]
  );

  // Dummy object for matrix calculations
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update trail positions and opacities
  useFrame(() => {
    if (
      !instancedMeshRef.current ||
      !trailDataRef.current.validAsteroids.length
    )
      return;

    const { validAsteroids, trailPositions, trailOpacities } =
      trailDataRef.current;
    const scale = 0.1; // Same scale as NEO points

    let instanceIndex = 0;

    // Generate trail for each asteroid
    for (
      let asteroidIndex = 0;
      asteroidIndex < validAsteroids.length;
      asteroidIndex++
    ) {
      const asteroid = validAsteroids[asteroidIndex];

      try {
        // Generate trail points going backwards in time
        for (let trailIndex = 0; trailIndex < pointsPerTrail; trailIndex++) {
          const timeOffset = (trailIndex / pointsPerTrail) * trailLength;
          const trailTime = currentTime - timeOffset;

          // Calculate position for this trail point
          const [x, y, z] = getAsteroidPosition(
            trailTime,
            asteroid.orbital_data
          );

          // Store position (corrected coordinate mapping)
          const posIndex = instanceIndex * 3;
          trailPositions[posIndex] = x * scale;
          trailPositions[posIndex + 1] = z * scale;
          trailPositions[posIndex + 2] = y * scale;

          // Calculate opacity fade (newer points are more opaque)
          const fadeRatio = 1 - trailIndex / pointsPerTrail;
          trailOpacities[instanceIndex] = fadeRatio * trailOpacity;

          // Set transformation matrix
          dummy.position.set(
            trailPositions[posIndex],
            trailPositions[posIndex + 1],
            trailPositions[posIndex + 2]
          );
          dummy.scale.setScalar(fadeRatio * 0.5 + 0.5); // Smaller points for older trail
          dummy.updateMatrix();

          instancedMeshRef.current.setMatrixAt(instanceIndex, dummy.matrix);

          // Set color with fade
          const color = new THREE.Color(trailColor);
          color.multiplyScalar(fadeRatio);
          instancedMeshRef.current.setColorAt(instanceIndex, color);

          instanceIndex++;
        }
      } catch (error) {
        console.warn(`Error generating trail for ${asteroid.name}:`, error);
        // Skip this asteroid's trail points
        for (let i = 0; i < pointsPerTrail; i++) {
          dummy.position.set(0, 0, 0);
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          instancedMeshRef.current.setMatrixAt(instanceIndex, dummy.matrix);
          instanceIndex++;
        }
      }
    }

    // Update instanced mesh
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (!trailDataRef.current.totalInstances) return null;

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, material, trailDataRef.current.totalInstances]}
      frustumCulled={false} // Disable frustum culling for better performance with many instances
    />
  );
};

export default InstancedNEOTrails;
