import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface DestructionEffectsProps {
  airblastRadius: number;
  thermalRadius: number;
  ejectaRadius: number;
  className?: string;
}

const DestructionZone: React.FC<{ 
  radius: number; 
  color: string; 
  opacity: number;
  height: number;
}> = ({ radius, color, opacity, height }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    const segments = 32;
    return new THREE.CylinderGeometry(radius, radius, height, segments);
  }, [radius, height]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, height / 2, 0]}>
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={opacity}
        wireframe={true}
      />
    </mesh>
  );
};

const ImpactCenter: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#ff0000" />
    </mesh>
  );
};

export const DestructionEffects: React.FC<DestructionEffectsProps> = ({ 
  airblastRadius, 
  thermalRadius, 
  ejectaRadius, 
  className = "" 
}) => {
  const maxRadius = Math.max(airblastRadius, thermalRadius, ejectaRadius);
  const scale = Math.min(1, 5 / maxRadius); // Scale to fit view
  
  return (
    <div className={`w-full h-48 ${className}`}>
      <Canvas camera={{ position: [0, 8, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        
        <ImpactCenter />
        
        <DestructionZone 
          radius={ejectaRadius * scale} 
          color="#ffff00" 
          opacity={0.3} 
          height={0.1}
        />
        <DestructionZone 
          radius={thermalRadius * scale} 
          color="#ff8800" 
          opacity={0.4} 
          height={0.2}
        />
        <DestructionZone 
          radius={airblastRadius * scale} 
          color="#ff0000" 
          opacity={0.5} 
          height={0.3}
        />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
        />
      </Canvas>
    </div>
  );
};
