import React, { useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import useSWR from "swr";
import { fetcher, getAsteroidsUrl } from "../../api/asteroidApi";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { Asteroid } from "../../types/asteroid";

interface SimpleNEOTrailProps {
  asteroid: Asteroid;
  currentTime: number;
  trailColor: string;
  trailLength: number;
  trailOpacity: number;
  pointsPerTrail: number;
}

const SimpleNEOTrail: React.FC<SimpleNEOTrailProps> = ({
  asteroid,
  currentTime,
  trailColor,
  trailLength,
  trailOpacity,
  pointsPerTrail,
}) => {
  const [geometry, setGeometry] = React.useState<THREE.BufferGeometry | null>(
    null
  );
  const { camera } = useThree();

  React.useEffect(() => {
    try {
      const scale = 0.1;

      // Check distance to camera - only show trails for very close NEOs
      const [currentX, currentY, currentZ] = getAsteroidPosition(
        currentTime,
        asteroid.orbital_data
      );
      const currentPos = new THREE.Vector3(
        currentX * scale,
        currentZ * scale,
        currentY * scale
      );
      const distanceToCamera = camera.position.distanceTo(currentPos);

      // Only show trails for the closest 2-3 NEOs to avoid spider web effect
      if (distanceToCamera > 5.0) {
        setGeometry(null);
        return;
      }

      const points: THREE.Vector3[] = [];

      // Create a simple, short trail showing just the direction of movement
      // Only 5 points for a clean, simple path indicator
      const simpleTrailPoints = 5;
      const shortTimeSpan = 2; // Only 2 days of trail

      // Generate just a few trail points to show direction
      for (let i = 0; i < simpleTrailPoints; i++) {
        const timeOffset =
          (i / simpleTrailPoints) * shortTimeSpan * 24 * 3600 * 1000; // 2 days max
        const trailTime = currentTime - timeOffset;
        const [x, y, z] = getAsteroidPosition(trailTime, asteroid.orbital_data);
        points.push(new THREE.Vector3(x * scale, z * scale, y * scale));
      }

      // Only create trail if we have valid points
      if (points.length > 1) {
        const newGeometry = new THREE.BufferGeometry().setFromPoints(points);
        setGeometry(newGeometry);

        // Cleanup previous geometry
        return () => {
          newGeometry.dispose();
        };
      } else {
        setGeometry(null);
      }
    } catch (error) {
      console.warn(`Error updating trail for ${asteroid.name}:`, error);
      setGeometry(null);
    }
  }, [asteroid, currentTime, trailLength, pointsPerTrail, camera]);

  if (!geometry) return null;

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial
        color={trailColor}
        transparent
        opacity={0.2} // Very subtle - just a hint of direction
        depthWrite={false}
        linewidth={1}
      />
    </line>
  );
};

interface SimpleNEOPointProps {
  asteroid: Asteroid;
  currentTime: number;
  neoColor: string;
  neoSize: number;
  blinkSpeed: number;
}

const SimpleNEOPoint: React.FC<SimpleNEOPointProps> = ({
  asteroid,
  currentTime,
  neoColor,
  neoSize,
  blinkSpeed,
}) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const materialRef = React.useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();

  // Update position once when props change
  React.useEffect(() => {
    if (!meshRef.current) return;

    try {
      // Calculate position
      const [x, y, z] = getAsteroidPosition(currentTime, asteroid.orbital_data);
      const scale = 0.1;
      const worldPos = new THREE.Vector3(x * scale, z * scale, y * scale);
      const distance = camera.position.distanceTo(worldPos);

      // Temporarily disable distance culling to debug visibility
      // if (distance > 20.0) {
      //   meshRef.current.visible = false;
      //   return;
      // }

      meshRef.current.position.copy(worldPos);
      meshRef.current.visible = true;
      meshRef.current.scale.setScalar(neoSize * 2.0);
    } catch (error) {
      console.warn(`Error updating NEO ${asteroid.name}:`, error);
      if (meshRef.current) meshRef.current.visible = false;
    }
  }, [asteroid, currentTime, neoSize, camera]);

  // Smooth blinking animation using useFrame - CAREFULLY to avoid navigation issues
  useFrame((state) => {
    if (!materialRef.current || !meshRef.current?.visible) return;

    // Only animate blinking, no position updates or event handling
    const time = state.clock.elapsedTime;
    const blinkOpacity = 0.6 + 0.4 * Math.sin(time * blinkSpeed * 2);
    materialRef.current.opacity = blinkOpacity;
    materialRef.current.color.set(neoColor);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.0, 8, 8]} />
      <meshBasicMaterial
        ref={materialRef}
        color={neoColor}
        transparent
        opacity={1.0}
      />
    </mesh>
  );
};

interface SimpleNEOSystemProps {
  showNEOs?: boolean;
  showTrails?: boolean;
  neoColor?: string;
  neoSize?: number;
  blinkSpeed?: number;
  trailColor?: string;
  trailLength?: number;
  trailOpacity?: number;
  pointsPerTrail?: number;
  maxNEOs?: number;
  currentTime?: number;
}

const SimpleNEOSystem: React.FC<SimpleNEOSystemProps> = ({
  showNEOs = true,
  showTrails = true,
  neoColor = "#ffff00",
  neoSize = 0.005,
  blinkSpeed = 1.0,
  trailColor = "#61FAFA",
  trailLength = 50,
  trailOpacity = 0.6,
  pointsPerTrail = 50,
  maxNEOs = 20,
  currentTime = 0,
}) => {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);

  // Fetch NEO data from NASA API (same as NEOManagerWithData)
  const { data, error, isLoading } = useSWR(
    getAsteroidsUrl(0, maxNEOs),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (data?.near_earth_objects) {
      // Filter out asteroids that don't have valid orbital data
      const validAsteroids = data.near_earth_objects.filter(
        (asteroid: Asteroid) =>
          asteroid.orbital_data &&
          asteroid.orbital_data.semi_major_axis &&
          asteroid.orbital_data.eccentricity &&
          asteroid.orbital_data.inclination &&
          asteroid.orbital_data.mean_motion
      );
      const filteredAsteroids = validAsteroids.slice(0, maxNEOs);
      setAsteroids(filteredAsteroids);
    }
  }, [data, maxNEOs]);

  if (isLoading || !asteroids.length || !showNEOs) {
    return null;
  }

  return (
    <group>
      {/* NEO Points - Show all points (no trails for now) */}
      {showNEOs &&
        asteroids.map((asteroid) => (
          <SimpleNEOPoint
            key={`point-${asteroid.id}`}
            asteroid={asteroid}
            currentTime={currentTime}
            neoColor={neoColor}
            neoSize={neoSize}
            blinkSpeed={blinkSpeed}
          />
        ))}

      {/* Show trail for ONLY the first NEO to avoid spider web */}
      {showTrails &&
        asteroids
          .slice(0, 1)
          .map((asteroid) => (
            <SimpleNEOTrail
              key={`trail-${asteroid.id}`}
              asteroid={asteroid}
              currentTime={currentTime}
              trailColor={trailColor}
              trailLength={trailLength}
              trailOpacity={trailOpacity}
              pointsPerTrail={pointsPerTrail}
            />
          ))}
    </group>
  );
};

export default SimpleNEOSystem;
