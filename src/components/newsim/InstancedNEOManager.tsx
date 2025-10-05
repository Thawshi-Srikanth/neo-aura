import React, { useRef, useMemo, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { Asteroid } from "../../types/asteroid";

interface InstancedNEOManagerProps {
  asteroids: Asteroid[];
  currentTime: number;
  showNEOs?: boolean;
  neoColor?: string;
  neoSize?: number;
  blinkSpeed?: number;
  onNEOClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
  selectedNEOId?: string | null;
}

const InstancedNEOManager: React.FC<InstancedNEOManagerProps> = ({
  asteroids,
  currentTime,
  showNEOs = true,
  neoColor = "#ffff00",
  neoSize = 0.005,
  blinkSpeed = 1.0,
  onNEOClick,
  selectedNEOId,
}) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  // Store asteroid data for efficient updates
  const asteroidDataRef = useRef<{
    positions: Float32Array;
    scales: Float32Array;
    colors: Float32Array;
    phases: Float32Array;
    validAsteroids: Asteroid[];
  }>({
    positions: new Float32Array(0),
    scales: new Float32Array(0),
    colors: new Float32Array(0),
    phases: new Float32Array(0),
    validAsteroids: [],
  });

  // Initialize instanced data
  useEffect(() => {
    const validAsteroids = asteroids.filter(
      (asteroid) =>
        asteroid.orbital_data &&
        asteroid.orbital_data.semi_major_axis &&
        asteroid.orbital_data.eccentricity &&
        asteroid.orbital_data.inclination &&
        asteroid.orbital_data.mean_motion
    );

    const count = validAsteroids.length;
    asteroidDataRef.current = {
      positions: new Float32Array(count * 3),
      scales: new Float32Array(count * 3),
      colors: new Float32Array(count * 3),
      phases: new Float32Array(count),
      validAsteroids,
    };
  }, [asteroids]);

  // Geometry and material for NEO points
  const geometry = useMemo(
    () => new THREE.SphereGeometry(neoSize, 8, 8),
    [neoSize]
  );
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: neoColor,
        transparent: true,
        opacity: 1,
      }),
    [neoColor]
  );

  // Dummy object for matrix calculations
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update positions and visual properties
  useFrame((state) => {
    if (
      !instancedMeshRef.current ||
      !asteroidDataRef.current.validAsteroids.length
    )
      return;

    const { validAsteroids, positions, scales, colors, phases } =
      asteroidDataRef.current;
    const time = state.clock.elapsedTime;

    // Update all instances efficiently
    for (let i = 0; i < validAsteroids.length; i++) {
      const asteroid = validAsteroids[i];
      const i3 = i * 3;

      try {
        // Calculate position using accurate orbital mechanics
        const [x, y, z] = getAsteroidPosition(
          currentTime,
          asteroid.orbital_data
        );
        const scale = 0.1; // Same scale as original NEOPoint

        // Update position (corrected coordinate mapping)
        positions[i3] = x * scale;
        positions[i3 + 1] = z * scale;
        positions[i3 + 2] = y * scale;

        // Determine if selected
        const isSelected = selectedNEOId === asteroid.id;
        const baseSize = isSelected ? neoSize * 1.5 : neoSize;

        // Update scale for size variations
        scales[i3] = baseSize;
        scales[i3 + 1] = baseSize;
        scales[i3 + 2] = baseSize;

        // Update color (selected NEOs get different color)
        const color = new THREE.Color(isSelected ? "#ff6600" : neoColor);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        // Update blinking phase for animation
        const opacity = isSelected
          ? 0.7 + 0.3 * Math.sin(time * 4) // Faster pulse for selected
          : 0.5 + 0.5 * Math.sin(time * blinkSpeed * 2);
        phases[i] = opacity;

        // Set transformation matrix
        dummy.position.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        dummy.scale.set(scales[i3], scales[i3 + 1], scales[i3 + 2]);
        dummy.updateMatrix();

        instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
        instancedMeshRef.current.setColorAt(i, color);
      } catch (error) {
        console.warn(`Error updating position for ${asteroid.name}:`, error);
        // Set to origin if calculation fails
        positions[i3] = 0;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = 0;
        phases[i] = 0;
      }
    }

    // Update instanced mesh
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  // Handle clicks on instanced objects
  const handleClick = useCallback(
    (event: any) => {
      if (!onNEOClick || !instancedMeshRef.current) return;

      const instanceId = event.instanceId;
      if (
        instanceId !== undefined &&
        instanceId < asteroidDataRef.current.validAsteroids.length
      ) {
        const asteroid = asteroidDataRef.current.validAsteroids[instanceId];
        const { positions } = asteroidDataRef.current;
        const i3 = instanceId * 3;
        const position: [number, number, number] = [
          positions[i3],
          positions[i3 + 1],
          positions[i3 + 2],
        ];
        onNEOClick(asteroid, position);
      }
    },
    [onNEOClick]
  );

  if (!showNEOs) return null;

  return (
    <group>
      {/* Instanced NEO Points */}
      {showNEOs && asteroidDataRef.current.validAsteroids.length > 0 && (
        <instancedMesh
          ref={instancedMeshRef}
          args={[
            geometry,
            material,
            asteroidDataRef.current.validAsteroids.length,
          ]}
          onClick={handleClick}
        />
      )}
    </group>
  );
};

export default InstancedNEOManager;
