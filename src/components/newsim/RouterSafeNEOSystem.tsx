import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { Asteroid } from "../../types/asteroid";

// Individual NEO Point Component - Router Safe
interface NEOPointProps {
  asteroid: Asteroid;
  currentTime: number;
  neoColor: string;
  neoSize: number;
  blinkSpeed: number;
  isSelected: boolean;
  onNEOClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
  maxRenderDistance: number;
  lodDistance: number;
}

const NEOPoint: React.FC<NEOPointProps> = ({
  asteroid,
  currentTime,
  neoColor,
  neoSize,
  blinkSpeed,
  isSelected,
  maxRenderDistance,
  lodDistance,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const { camera } = useThree();

  // Calculate and update position, blinking, scaling
  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    try {
      // Calculate position
      const [x, y, z] = getAsteroidPosition(currentTime, asteroid.orbital_data);
      const scale = 0.1;
      const worldPos = new THREE.Vector3(x * scale, z * scale, y * scale);
      const distance = camera.position.distanceTo(worldPos);

      // Skip if too far away
      if (distance > maxRenderDistance) {
        meshRef.current.visible = false;
        return;
      }

      // Update position
      meshRef.current.position.copy(worldPos);
      meshRef.current.visible = true;

      // Apply blinking effect
      const time = state.clock.elapsedTime;
      const blinkOpacity = isSelected
        ? 0.8 + 0.2 * Math.sin(time * 4) // Faster blink for selected
        : 0.6 + 0.4 * Math.sin(time * blinkSpeed * 2); // Normal blink

      materialRef.current.opacity = blinkOpacity;

      // Set color
      if (isSelected) {
        materialRef.current.color.setHex(0xff6600);
      } else {
        materialRef.current.color.set(neoColor);
      }

      // Scale based on selection and distance
      const baseScale = isSelected ? neoSize * 3.0 : neoSize * 2.0;
      const lodScale =
        distance < lodDistance ? 1.0 : distance < lodDistance * 2 ? 0.8 : 0.6;
      meshRef.current.scale.setScalar(baseScale * lodScale);
    } catch (error) {
      console.warn(`Error updating NEO ${asteroid.name}:`, error);
      if (meshRef.current) meshRef.current.visible = false;
    }
  });

  // TEMPORARILY DISABLE CLICK HANDLING TO FIX NAVIGATION
  // const handlePointerDown = (event: any) => {
  //   if (onNEOClick && event.button === 0 && meshRef.current) {
  //     const pos = meshRef.current.position;
  //     onNEOClick(asteroid, [pos.x, pos.y, pos.z]);
  //   }
  // };

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

// Trail Component
interface NEOTrailProps {
  asteroid: Asteroid;
  currentTime: number;
  trailColor: string;
  trailLength: number;
  trailOpacity: number;
  pointsPerTrail: number;
  maxRenderDistance: number;
  lodDistance: number;
}

const NEOTrail: React.FC<NEOTrailProps> = ({
  asteroid,
  currentTime,
  trailColor,
  trailLength,
  trailOpacity,
  pointsPerTrail,
  maxRenderDistance,
  lodDistance,
}) => {
  const lineRef = useRef<THREE.Line>(null);
  const { camera } = useThree();

  // Pre-allocate geometry
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(pointsPerTrail * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [pointsPerTrail]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: trailColor,
        transparent: true,
        opacity: trailOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [trailColor, trailOpacity]
  );

  useFrame(() => {
    if (!lineRef.current) return;

    try {
      // Calculate current position for distance check
      const [x, y, z] = getAsteroidPosition(currentTime, asteroid.orbital_data);
      const scale = 0.1;
      const worldPos = new THREE.Vector3(x * scale, z * scale, y * scale);
      const distance = camera.position.distanceTo(worldPos);

      // Skip if too far away
      if (distance > maxRenderDistance) {
        lineRef.current.visible = false;
        return;
      }

      lineRef.current.visible = true;

      // Update trail points
      const positionAttribute = geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      const positions = positionAttribute.array as Float32Array;
      const trailPointCount =
        distance < lodDistance
          ? pointsPerTrail
          : Math.floor(pointsPerTrail / 2);

      for (let i = 0; i < trailPointCount; i++) {
        const timeOffset = (i / trailPointCount) * trailLength;
        const trailTime = currentTime - timeOffset;
        const [tx, ty, tz] = getAsteroidPosition(
          trailTime,
          asteroid.orbital_data
        );

        const trailIndex = i * 3;
        positions[trailIndex] = tx * scale;
        positions[trailIndex + 1] = tz * scale;
        positions[trailIndex + 2] = ty * scale;
      }

      positionAttribute.needsUpdate = true;
      geometry.computeBoundingSphere();
    } catch (error) {
      console.warn(`Error updating trail for ${asteroid.name}:`, error);
      if (lineRef.current) lineRef.current.visible = false;
    }
  });

  return (
    <primitive ref={lineRef} object={new THREE.Line(geometry, material)} />
  );
};

// Main Router-Safe NEO System
interface RouterSafeNEOSystemProps {
  asteroids: Asteroid[];
  currentTime: number;
  showTrails?: boolean;
  showNEOs?: boolean;
  neoColor?: string;
  neoSize?: number;
  blinkSpeed?: number;
  trailColor?: string;
  trailLength?: number;
  trailOpacity?: number;
  pointsPerTrail?: number;
  lodDistance?: number;
  maxRenderDistance?: number;
  onNEOClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
  selectedNEOId?: string | null;
}

const RouterSafeNEOSystem: React.FC<RouterSafeNEOSystemProps> = ({
  asteroids,
  currentTime,
  showTrails = true,
  showNEOs = true,
  neoColor = "#ffff00",
  neoSize = 0.005,
  blinkSpeed = 1.0,
  trailColor = "#61FAFA",
  trailLength = 100,
  trailOpacity = 0.6,
  pointsPerTrail = 50,
  lodDistance = 5.0,
  maxRenderDistance = 20.0,
  onNEOClick,
  selectedNEOId,
}) => {
  // Filter valid asteroids
  const validAsteroids = useMemo(
    () =>
      asteroids.filter(
        (asteroid) =>
          asteroid.orbital_data &&
          asteroid.orbital_data.semi_major_axis &&
          asteroid.orbital_data.eccentricity &&
          asteroid.orbital_data.inclination &&
          asteroid.orbital_data.mean_motion
      ),
    [asteroids]
  );

  if (!showNEOs && !showTrails) return null;

  return (
    <group>
      {/* NEO Points - Each is a React component with proper event handling */}
      {showNEOs &&
        validAsteroids.map((asteroid) => (
          <NEOPoint
            key={asteroid.id}
            asteroid={asteroid}
            currentTime={currentTime}
            neoColor={neoColor}
            neoSize={neoSize}
            blinkSpeed={blinkSpeed}
            isSelected={selectedNEOId === asteroid.id}
            onNEOClick={onNEOClick}
            maxRenderDistance={maxRenderDistance}
            lodDistance={lodDistance}
          />
        ))}

      {/* NEO Trails */}
      {showTrails &&
        validAsteroids.map((asteroid) => (
          <NEOTrail
            key={`trail-${asteroid.id}`}
            asteroid={asteroid}
            currentTime={currentTime}
            trailColor={trailColor}
            trailLength={trailLength}
            trailOpacity={trailOpacity}
            pointsPerTrail={pointsPerTrail}
            maxRenderDistance={maxRenderDistance}
            lodDistance={lodDistance}
          />
        ))}
    </group>
  );
};

export default RouterSafeNEOSystem;
