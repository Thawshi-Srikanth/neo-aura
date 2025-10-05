import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Impact3DProps {
  craterDiameter: number;
  craterDepth: number;
  airblastRadius: number;
  className?: string;
}

const ImpactMesh: React.FC<{ 
  craterDiameter: number; 
  craterDepth: number; 
  airblastRadius: number;
}> = ({ craterDiameter, craterDepth, airblastRadius }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const shockWaveRef = useRef<THREE.Mesh>(null);
  
  const craterGeometry = useMemo(() => {
    const segments = 32;
    const geometry = new THREE.ConeGeometry(craterDiameter / 2, craterDepth, segments);
    
    // Create crater shape by modifying vertices
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];
      
      // Create crater bowl shape
      const distance = Math.sqrt(x * x + z * z);
      const normalizedDistance = distance / (craterDiameter / 2);
      
      if (normalizedDistance < 1) {
        // Create bowl shape
        const craterDepthFactor = craterDepth * (1 - normalizedDistance * normalizedDistance);
        vertices[i + 1] = y - craterDepthFactor;
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }, [craterDiameter, craterDepth]);

  const shockWaveGeometry = useMemo(() => {
    const segments = 32;
    return new THREE.SphereGeometry(airblastRadius, segments, segments);
  }, [airblastRadius]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
    if (shockWaveRef.current) {
      shockWaveRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      shockWaveRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group>
      {/* Crater */}
      <mesh ref={meshRef} geometry={craterGeometry}>
        <meshStandardMaterial 
          color="#4a4a4a" 
          roughness={0.9} 
          metalness={0.1}
          wireframe={true}
          wireframeLinewidth={2}
        />
      </mesh>
      
      {/* Shock wave */}
      <mesh ref={shockWaveRef} geometry={shockWaveGeometry}>
        <meshStandardMaterial 
          color="#ff4444" 
          transparent={true}
          opacity={0.3}
          wireframe={true}
          wireframeLinewidth={1}
        />
      </mesh>
    </group>
  );
};

export const Impact3D: React.FC<Impact3DProps> = ({ 
  craterDiameter, 
  craterDepth, 
  airblastRadius, 
  className = "" 
}) => {
  const scale = Math.min(1, 10 / Math.max(craterDiameter, airblastRadius));
  
  return (
    <div className={`w-full h-48 ${className}`}>
      <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#ffffff" />
        
        <ImpactMesh 
          craterDiameter={craterDiameter * scale} 
          craterDepth={craterDepth * scale}
          airblastRadius={airblastRadius * scale}
        />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
        />
        
        <Text
          position={[0, craterDepth * scale + 1, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Impact Zone
        </Text>
      </Canvas>
    </div>
  );
};
