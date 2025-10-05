import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getCollisionOrbitPosition, type CollisionOrbit } from "../../utils/orbitalCollision";
import { COLLISION_ASTEROID_VISUAL_RADIUS, DAYS_PER_SECOND } from "../../config/constants";
import { useSettingsStore } from "../../store/settingsStore";

// Calculate realistic orbital velocity that matches the original asteroid's speed
function calculateRealisticOrbitalVelocity(
  position: THREE.Vector3,
  _orbit: CollisionOrbit
): THREE.Vector3 {
  // Use a much smaller, more realistic velocity
  // This simulates the asteroid maintaining its original orbital speed
  const baseSpeed = 0.01; // Very slow, realistic orbital speed
  
  // Calculate direction perpendicular to radius (orbital motion)
  const radiusVector = position.clone().normalize();
  const velocityDirection = new THREE.Vector3(-radiusVector.y, radiusVector.x, 0).normalize();
  
  // Return velocity with realistic magnitude
  return velocityDirection.multiplyScalar(baseSpeed);
}

interface CollisionAsteroidProps {
  collisionOrbit: CollisionOrbit;
  onImpact?: (position: THREE.Vector3) => void;
  onCollisionDetected?: () => void; // New callback for collision detection
  earthRef: React.RefObject<THREE.Mesh>;
  sizeMultiplier?: number;
  timeScale?: number;
  isImpacted?: boolean;
  impactPosition?: THREE.Vector3 | null;
}

export const CollisionAsteroid = forwardRef<THREE.Mesh, CollisionAsteroidProps>(
  ({
    collisionOrbit,
    onImpact,
    onCollisionDetected,
    earthRef,
    sizeMultiplier = 1.0,
    timeScale = 1.0,
    isImpacted = false,
    impactPosition = null,
  }, ref) => {
    const { settings } = useSettingsStore();
    const meshRef = useRef<THREE.Mesh>(null!);
    const simulationTime = useRef(0);
    const hasImpacted = useRef(false);
    const isFrozen = useRef(false);
    const [velocity, setVelocity] = useState<THREE.Vector3>(new THREE.Vector3());
    const [speed, setSpeed] = useState(0);

    useImperativeHandle(ref, () => meshRef.current);

      // Reset simulation when collision orbit changes
      useEffect(() => {
        simulationTime.current = 0;
        hasImpacted.current = false;
        isFrozen.current = false;
      }, [collisionOrbit]);

    useFrame((_, delta) => {
      if (!meshRef.current || isImpacted || hasImpacted.current) {
        return;
      }

      // Check for collision with Earth
      if (earthRef.current) {
        const earthPosition = earthRef.current.position;
        const currentPosition = meshRef.current.position;
        const distance = currentPosition.distanceTo(earthPosition);
        const collisionThreshold = settings.collisionThreshold; // Collision threshold - when asteroid gets close to Earth
        
        if (distance < collisionThreshold) {
          // Collision detected! Stop the entire simulation
          isFrozen.current = true;
          
          // Call the collision callback to stop the simulation
          if (onCollisionDetected) {
            onCollisionDetected();
          }
          
          // Trigger impact at current position
          if (onImpact) {
            onImpact(currentPosition.clone());
          }
          
          return; // Stop updating position
        }
      }

      // Update simulation time with proper scaling
      // Convert delta from seconds to days for orbital calculations
      const timeStep = delta * timeScale * DAYS_PER_SECOND; // Use consistent time scaling
      simulationTime.current += timeStep;

      // Get current position in collision orbit - follow the orbit exactly
      const position = getCollisionOrbitPosition(collisionOrbit, simulationTime.current);
      
      // Use realistic orbital velocity instead of collision orbit velocity
      // Calculate velocity based on orbital mechanics, not collision trajectory
      const currentVelocity = calculateRealisticOrbitalVelocity(position, collisionOrbit);
      setVelocity(currentVelocity);
      setSpeed(currentVelocity.length());
      
      meshRef.current.position.copy(position);
      
      // Add dynamic visual effects based on velocity
      if (meshRef.current.material && 'emissiveIntensity' in meshRef.current.material) {
        const normalizedSpeed = Math.min(speed / 10, 1); // Normalize speed for visual effect
        const intensity = 0.3 + (normalizedSpeed * 0.7); // 0.3 to 1.0 based on speed
        (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
        
        // Change color based on speed (faster = more red)
        const speedColor = new THREE.Color().lerpColors(
          new THREE.Color(0x8B4513), // Brown (slow)
          new THREE.Color(0xff4500), // Orange-red (fast)
          normalizedSpeed
        );
        (meshRef.current.material as THREE.MeshStandardMaterial).color = speedColor;
      }
    });

    // Handle impact state
    useEffect(() => {
      if (isImpacted && impactPosition && meshRef.current) {
        meshRef.current.position.copy(impactPosition);
        hasImpacted.current = true;
      }
    }, [isImpacted, impactPosition]);

    // Use the collision asteroid size (slightly larger for visibility)
    const scaledSize = COLLISION_ASTEROID_VISUAL_RADIUS * sizeMultiplier;
    
    return (
      <group>
        {/* Main asteroid */}
        <mesh ref={meshRef}>
          <sphereGeometry args={[scaledSize, 16, 16]} />
          <meshStandardMaterial
            color={isFrozen.current ? "#ff0000" : "#8B4513"} // Red when frozen, brown when moving
            roughness={0.8}
            metalness={0.2}
            emissive={isFrozen.current ? "#ff0000" : "#ff4500"}
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Velocity trail effect */}
        {!isFrozen.current && velocity.length() > 0 && (
          <mesh position={meshRef.current?.position || new THREE.Vector3()}>
            <coneGeometry args={[scaledSize * 0.3, velocity.length() * 0.1, 8]} />
            <meshBasicMaterial
              color="#ffaa00"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    );
  }
);

CollisionAsteroid.displayName = "CollisionAsteroid";
