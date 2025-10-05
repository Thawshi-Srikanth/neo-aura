import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { Asteroid } from "../../types/asteroid";

interface OptimizedNEOTrailsProps {
  asteroids: Asteroid[];
  currentTime: number;
  trailLength?: number;
  trailColor?: string;
  trailOpacity?: number;
  pointsPerTrail?: number;
}

const OptimizedNEOTrails: React.FC<OptimizedNEOTrailsProps> = ({
  asteroids,
  currentTime,
  trailLength = 100,
  trailColor = "#61FAFA",
  trailOpacity = 0.6,
  pointsPerTrail = 50,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Trail geometries and materials for each asteroid
  const trailsDataRef = useRef<{
    validAsteroids: Asteroid[];
    geometries: THREE.BufferGeometry[];
    materials: THREE.LineBasicMaterial[];
    lines: THREE.Line[];
  }>({
    validAsteroids: [],
    geometries: [],
    materials: [],
    lines: [],
  });

  // Initialize trail geometries
  useEffect(() => {
    const validAsteroids = asteroids.filter(
      (asteroid) =>
        asteroid.orbital_data &&
        asteroid.orbital_data.semi_major_axis &&
        asteroid.orbital_data.eccentricity &&
        asteroid.orbital_data.inclination &&
        asteroid.orbital_data.mean_motion
    );

    // Clean up existing geometries and materials
    trailsDataRef.current.geometries.forEach((geo) => geo.dispose());
    trailsDataRef.current.materials.forEach((mat) => mat.dispose());

    // Clear the group
    if (groupRef.current) {
      groupRef.current.clear();
    }

    // Create new geometries and materials
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.LineBasicMaterial[] = [];
    const lines: THREE.Line[] = [];

    validAsteroids.forEach(() => {
      // Create geometry with pre-allocated positions
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(pointsPerTrail * 3);
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      // Create material with vertex colors for fading
      const material = new THREE.LineBasicMaterial({
        color: trailColor,
        transparent: true,
        opacity: trailOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      // Create line
      const line = new THREE.Line(geometry, material);

      geometries.push(geometry);
      materials.push(material);
      lines.push(line);

      // Add to group
      if (groupRef.current) {
        groupRef.current.add(line);
      }
    });

    trailsDataRef.current = {
      validAsteroids,
      geometries,
      materials,
      lines,
    };

    // Cleanup function
    return () => {
      geometries.forEach((geo) => geo.dispose());
      materials.forEach((mat) => mat.dispose());
    };
  }, [asteroids, pointsPerTrail, trailColor, trailOpacity]);

  // Update trail positions
  useFrame(() => {
    const { validAsteroids, geometries } = trailsDataRef.current;
    if (!validAsteroids.length) return;

    const scale = 0.1; // Same scale as NEO points

    validAsteroids.forEach((asteroid, asteroidIndex) => {
      const geometry = geometries[asteroidIndex];
      if (!geometry) return;

      const positionAttribute = geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      const positions = positionAttribute.array as Float32Array;

      try {
        // Generate trail points going backwards in time
        for (let i = 0; i < pointsPerTrail; i++) {
          const timeOffset = (i / pointsPerTrail) * trailLength;
          const trailTime = currentTime - timeOffset;

          // Calculate position for this trail point
          const [x, y, z] = getAsteroidPosition(
            trailTime,
            asteroid.orbital_data
          );

          // Store position (corrected coordinate mapping)
          const index = i * 3;
          positions[index] = x * scale;
          positions[index + 1] = z * scale;
          positions[index + 2] = y * scale;
        }

        // Mark geometry as needing update
        positionAttribute.needsUpdate = true;
        geometry.computeBoundingSphere();
      } catch (error) {
        console.warn(`Error updating trail for ${asteroid.name}:`, error);
        // Set all points to origin if error occurs
        for (let i = 0; i < pointsPerTrail * 3; i++) {
          positions[i] = 0;
        }
        positionAttribute.needsUpdate = true;
      }
    });
  });

  return <group ref={groupRef} />;
};

export default OptimizedNEOTrails;
