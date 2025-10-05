import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useRef, forwardRef, useImperativeHandle, useState, useEffect } from "react";
import * as THREE from "three";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { AsteroidOrbitalData } from "../../types/asteroid";
import { EARTH_VISUAL_RADIUS, ASTEROID_VISUAL_RADIUS, AU_TO_UNITS, DAYS_PER_SECOND } from "../../config/constants";

export const Asteroid = forwardRef(({
  orbitalData,
  onImpact,
  onCollisionDetected,
  earthRef,
  sizeMultiplier = 1.0,
  trajectoryOffset = new THREE.Vector3(),
  target = null,
  timeScale = 1,
  isImpacted = false,
  impactPosition = null,
  isOriginalAsteroid = false,
  isDeflected = false,
  deflectionResult = null,
}: {
  orbitalData: AsteroidOrbitalData;
  onImpact: (position: THREE.Vector3) => void;
  onCollisionDetected?: () => void;
  earthRef?: React.RefObject<THREE.Object3D>;
  sunRef?: React.RefObject<THREE.Object3D>;
  sizeMultiplier?: number;
  trajectoryOffset?: THREE.Vector3;
  target?: THREE.Vector3 | null;
  timeScale?: number;
  isImpacted?: boolean;
  impactPosition?: THREE.Vector3 | null;
  isOriginalAsteroid?: boolean;
  isDeflected?: boolean;
  deflectionResult?: any;
}, ref) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera, size } = useThree();
  const [showLabel, setShowLabel] = useState(false);
  const [isIntercepting, setIsIntercepting] = useState(false);
  const hasImpactedRef = useRef<boolean>(false);
  // Scratch vectors to avoid per-frame allocations
  const scratchTargetRef = useRef(new THREE.Vector3());
  const scratchWorldPosRef = useRef(new THREE.Vector3());
  // Local orbital time accumulator so asteroid moves before intercept starts
  const orbitTimeRef = useRef(0);

  useImperativeHandle(ref, () => meshRef.current);

  useEffect(() => {
    // Original asteroids never intercept - they always follow normal orbital mechanics
    if (isOriginalAsteroid) {
      setIsIntercepting(false);
      hasImpactedRef.current = false;
      return;
    }
    
    if (target && meshRef.current) {
      hasImpactedRef.current = false; // Reset impact flag
      setIsIntercepting(true);
    } else {
      setIsIntercepting(false);
      hasImpactedRef.current = false;
    }
  }, [target, earthRef, orbitalData, isOriginalAsteroid]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      // If asteroid has impacted, position it at impact site
      if (isImpacted && impactPosition) {
        meshRef.current.position.copy(impactPosition);
        return;
      }
      
      if (isIntercepting) {
        // Move asteroid toward target (Earth) for impact simulation
        const scaledDelta = delta * timeScale;
        orbitTimeRef.current += scaledDelta;
        const [x, y, z] = getAsteroidPosition(orbitTimeRef.current, orbitalData);
        meshRef.current.position.set(x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS);
        
        // Calculate visual intensity based on distance to Earth
        const earthWorld = scratchTargetRef.current.set(0, 0, 0);
        if (earthRef?.current) {
          earthRef.current.getWorldPosition(earthWorld);
        }
        const distance = meshRef.current.position.distanceTo(earthWorld);
        const maxDistance = 10; // units
        const normalizedDistance = Math.max(0, Math.min(1, 1 - distance / maxDistance));
        const intensity = 0.3 + (normalizedDistance * 0.7); // 0.3 to 1.0
        if (meshRef.current.material && 'emissiveIntensity' in meshRef.current.material) {
          (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
        }
      } else {
        // Follow normal orbital mechanics
        orbitTimeRef.current += delta * timeScale * DAYS_PER_SECOND;
        const [x, y, z] = getAsteroidPosition(orbitTimeRef.current, orbitalData);
        const offset = trajectoryOffset.clone().multiplyScalar(0.01);
        meshRef.current.position.set(
          x * AU_TO_UNITS + offset.x,
          y * AU_TO_UNITS + offset.y,
          z * AU_TO_UNITS + offset.z
        );
      }

      const worldPos = scratchWorldPosRef.current;
      meshRef.current.getWorldPosition(worldPos);
      const distance = worldPos.distanceTo(camera.position);
      const fovRad = (camera as THREE.PerspectiveCamera).fov
        ? THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov)
        : Math.PI / 3;
      const actualRadius = ASTEROID_VISUAL_RADIUS * sizeMultiplier;
      const projectedRadiusPx = (actualRadius * size.height) / (2 * Math.tan(fovRad / 2) * distance);

      const appearBelowPx = 4;
      const hideAbovePx = 6;
      if (!showLabel && projectedRadiusPx < appearBelowPx) {
        setShowLabel(true);
      } else if (showLabel && projectedRadiusPx > hideAbovePx) {
        setShowLabel(false);
      }

      // Collision detection (only if on impact trajectory and hasn't already impacted)
      if (isIntercepting && !hasImpactedRef.current) {
        const earthWorld = scratchTargetRef.current.set(0, 0, 0);
        if (earthRef?.current) {
          earthRef.current.getWorldPosition(earthWorld);
        }
        const distanceToEarth = meshRef.current.position.distanceTo(earthWorld);
        const collisionDistance = EARTH_VISUAL_RADIUS + (actualRadius * 0.5);
        const approachThreshold = 0.1; // Closer approach threshold for forced impact

        // Proximity check for visual effects (could be used for future enhancements)
        // const isNearEarth = distanceToEarth < EARTH_VISUAL_RADIUS * 5;

        // Force impact if asteroid gets too close
        if (distanceToEarth < approachThreshold) {
          hasImpactedRef.current = true;
          const earthToAsteroid = meshRef.current.position.clone().sub(earthWorld);
          const impactPoint = earthWorld.clone().add(
            earthToAsteroid.normalize().multiplyScalar(EARTH_VISUAL_RADIUS)
          );
          
          // Call collision detection callback to stop simulation
          if (onCollisionDetected) {
            onCollisionDetected();
          }
          
          onImpact(impactPoint);
        }
        // Regular collision detection
        else if (distanceToEarth < collisionDistance) {
          hasImpactedRef.current = true;
          const earthToAsteroid = meshRef.current.position.clone().sub(earthWorld);
          const impactPoint = earthWorld.clone().add(
            earthToAsteroid.normalize().multiplyScalar(EARTH_VISUAL_RADIUS)
          );
          
          // Call collision detection callback to stop simulation
          if (onCollisionDetected) {
            onCollisionDetected();
          }
          
          onImpact(impactPoint);
        }
      }
    }
  });

  return (
    <mesh 
      ref={meshRef}
    >
      <sphereGeometry args={[ASTEROID_VISUAL_RADIUS * sizeMultiplier, 32, 32]} />
      <meshStandardMaterial
        color={
          isDeflected && deflectionResult?.success
            ? "#00FF00" // Green for successful deflection
            : isDeflected && !deflectionResult?.success
              ? "#FF0000" // Red for failed deflection
              : isOriginalAsteroid 
                ? "#8B4513" // Brown for original asteroid
                : isIntercepting 
                  ? "#FF6B35" // Orange for asteroid on impact trajectory
                  : "#FFA500" // Orange for asteroid in normal orbit
        }
        emissive={
          isDeflected && deflectionResult?.success
            ? "#004400" // Dark green glow for successful deflection
            : isDeflected && !deflectionResult?.success
              ? "#440000" // Dark red glow for failed deflection
              : isOriginalAsteroid 
                ? "#4A2C17" // Brown glow for original
                : isIntercepting 
                  ? "#CC3300" // Red glow for impact trajectory
                  : "#FFA500" // Orange glow for normal orbit
        }
        emissiveIntensity={
          isDeflected
            ? 0.8 // Strong glow for deflected asteroids
            : isOriginalAsteroid 
              ? 0.3 // Subtle glow for original
              : isIntercepting 
                ? 0.5 // Strong glow for impact trajectory
                : 0.2 // Weak glow for normal orbit
        }
      />
      {showLabel && (
        <Html center sprite position={[0, 0, 0]}>
          <div className="text-white text-center inline-flex flex-col items-center justify-center leading-none m-0 pointer-events-none">
            <img src="/assets/asteroid-icon.svg" alt="Asteroid" className="w-6 h-6 block" />
            {isDeflected && deflectionResult?.success && (
              <div className="text-green-400 text-xs font-bold mt-1">DEFLECTED</div>
            )}
            {isDeflected && !deflectionResult?.success && (
              <div className="text-red-400 text-xs font-bold mt-1">DEFLECTION FAILED</div>
            )}
          </div>
        </Html>
      )}
    </mesh>
  );
});

Asteroid.displayName = "Asteroid";
