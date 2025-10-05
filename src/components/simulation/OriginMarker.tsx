import { useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

interface OriginMarkerProps {
  position: THREE.Vector3;
}

export function OriginMarker({ position }: OriginMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  return (
    <group position={position}>
      {/* Outer pulsing ring */}
      <mesh ref={meshRef}>
        <ringGeometry args={[0.08, 0.12, 32]} />
        <meshBasicMaterial 
          color="#00ffff" 
          transparent 
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner solid sphere */}
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial 
          color="#00ffff" 
          emissive="#00ffff"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Wireframe sphere for extra visual effect */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial 
          color="#00ffff" 
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Label */}
      <Html center sprite position={[0, 0.2, 0]}>
        <div className="text-cyan-400 text-xs font-bold bg-black/50 px-2 py-1 rounded border border-cyan-400/50 whitespace-nowrap">
          ORIGIN POINT
        </div>
      </Html>
    </group>
  );
}

