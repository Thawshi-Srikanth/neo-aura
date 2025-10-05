import React, { useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import useSWR from "swr";
import { fetcher, getAsteroidsUrl } from "../../api/asteroidApi";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { Asteroid } from "../../types/asteroid";

interface SimpleNEOPointProps {
  asteroid: Asteroid;
  currentTime: number;
  neoColor: string;
  neoSize: number;
  blinkSpeed: number;
  onNEOClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
}

const SimpleNEOPoint: React.FC<SimpleNEOPointProps> = ({
  asteroid,
  currentTime,
  neoColor,
  neoSize,
  blinkSpeed,
  onNEOClick,
}) => {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const materialRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const positionRef = React.useRef<[number, number, number]>([0, 0, 0]);
  const { camera } = useThree();

  // Update position once when props change
  React.useEffect(() => {
    if (!meshRef.current) return;

    try {
      // Calculate position
      const [x, y, z] = getAsteroidPosition(currentTime, asteroid.orbital_data);
      // Scale factor: 2.0 units = 1 AU (same scale as Earth's orbit)
      const scale = 2.0;
      const worldPos = new THREE.Vector3(x * scale, z * scale, y * scale);

      meshRef.current.position.copy(worldPos);
      meshRef.current.visible = true;
      // Make NEOs much more visible with larger scale
      meshRef.current.scale.setScalar(neoSize * 20.0);

      // Store position for click handler
      positionRef.current = [worldPos.x, worldPos.y, worldPos.z];
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

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (onNEOClick) {
      onNEOClick(asteroid, positionRef.current);
    }
  };

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
      }}
    >
      <sphereGeometry args={[1.0, 8, 8]} />
      <meshStandardMaterial
        ref={materialRef}
        color={neoColor}
        transparent
        opacity={1.0}
        emissive={neoColor}
        emissiveIntensity={0.2}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};

interface SimpleNEOSystemProps {
  showNEOs?: boolean;
  neoColor?: string;
  neoSize?: number;
  blinkSpeed?: number;
  maxNEOs?: number;
  currentTime?: number;
  onNEOClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
}

const SimpleNEOSystem: React.FC<SimpleNEOSystemProps> = ({
  showNEOs = true,
  neoColor = "#ffff00",
  neoSize = 0.005,
  blinkSpeed = 1.0,
  maxNEOs = 20,
  currentTime = 0,
  onNEOClick,
}) => {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);

  // Fetch NEO data from NASA API (same as NEOManagerWithData)
  const { data, isLoading } = useSWR(getAsteroidsUrl(0, maxNEOs), fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

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
      {/* NEO Points - Show all points */}
      {showNEOs &&
        asteroids.map((asteroid) => (
          <SimpleNEOPoint
            key={`point-${asteroid.id}`}
            asteroid={asteroid}
            currentTime={currentTime}
            neoColor={neoColor}
            neoSize={neoSize}
            blinkSpeed={blinkSpeed}
            onNEOClick={onNEOClick}
          />
        ))}
    </group>
  );
};

export default SimpleNEOSystem;
