import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useRef, forwardRef, useImperativeHandle, useState } from "react";
import * as THREE from "three";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { AsteroidOrbitalData } from "../../types/asteroid";
import {  ASTEROID_VISUAL_RADIUS, AU_TO_UNITS } from "../../config/constants";

export const DeflectedAsteroid = forwardRef(({
  orbitalData,
  earthRef,
  sizeMultiplier = 1.0,
  timeScale = 1,
  isDeflected = false,
}: {
  orbitalData: AsteroidOrbitalData;
  earthRef?: React.RefObject<THREE.Object3D>;
  sizeMultiplier?: number;
  timeScale?: number;
  isDeflected?: boolean;
}, ref) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [showLabel, setShowLabel] = useState(false);
  const orbitTimeRef = useRef(0);

  useImperativeHandle(ref, () => meshRef.current);

  useFrame((_, delta) => {
    if (meshRef.current) {
      // Follow deflected orbital mechanics
      const scaledDelta = delta * timeScale;
      orbitTimeRef.current += scaledDelta;
      const [x, y, z] = getAsteroidPosition(orbitTimeRef.current, orbitalData);
      meshRef.current.position.set(x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS);
      
      // Calculate distance to Earth for visual effects
      if (earthRef?.current) {
        const earthWorld = new THREE.Vector3();
        earthRef.current.getWorldPosition(earthWorld);
        const distance = meshRef.current.position.distanceTo(earthWorld);
        const maxDistance = 10; // units
        const normalizedDistance = Math.max(0, Math.min(1, 1 - distance / maxDistance));
        const intensity = 0.3 + (normalizedDistance * 0.7); // 0.3 to 1.0
        
        if (meshRef.current.material && 'emissiveIntensity' in meshRef.current.material) {
          (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity;
        }
      }
    }
  });

  return (
    <mesh 
      ref={meshRef}
      position={[0, 0, 0]}
      onClick={() => setShowLabel(!showLabel)}
      onPointerOver={() => setShowLabel(true)}
      onPointerOut={() => setShowLabel(false)}
    >
      <sphereGeometry args={[ASTEROID_VISUAL_RADIUS * sizeMultiplier, 32, 32]} />
      <meshStandardMaterial
        color="#0088FF" // Blue for deflected asteroid
        emissive="#004488" // Dark blue glow
        emissiveIntensity={0.6}
        roughness={0.8}
        metalness={0.2}
      />
      {showLabel && (
        <Html center sprite position={[0, 0, 0]}>
          <div className="text-white text-center inline-flex flex-col items-center justify-center leading-none m-0 pointer-events-none">
            <img src="/assets/asteroid-icon.svg" alt="Deflected Asteroid" className="w-6 h-6 block" />
            {isDeflected && (
              <div className="text-blue-400 text-xs font-bold mt-1">DEFLECTED</div>
            )}
          </div>
        </Html>
      )}
    </mesh>
  );
});

DeflectedAsteroid.displayName = "DeflectedAsteroid";
