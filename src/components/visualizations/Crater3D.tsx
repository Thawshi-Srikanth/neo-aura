import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Crater3DProps {
  diameter: number;
  depth: number;
  className?: string;
}

const CraterMesh: React.FC<{ diameter: number; depth: number }> = ({ diameter, depth }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    const segments = 32;
    const geometry = new THREE.ConeGeometry(diameter / 2, depth, segments);
    
    // Create crater shape by modifying vertices
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];
      
      // Create crater bowl shape
      const distance = Math.sqrt(x * x + z * z);
      const normalizedDistance = distance / (diameter / 2);
      
      if (normalizedDistance < 1) {
        // Create bowl shape
        const craterDepth = depth * (1 - normalizedDistance * normalizedDistance);
        vertices[i + 1] = y - craterDepth;
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }, [diameter, depth]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial 
        color="#2a2a2a" 
        roughness={0.8} 
        metalness={0.2}
        wireframe={false}
      />
    </mesh>
  );
};

export const Crater3D: React.FC<Crater3DProps> = ({ diameter, depth, className = "" }) => {
  const scale = Math.min(1, 10 / Math.max(diameter, depth)); // Scale to fit view
  
  return (
    <div className={`w-full h-48 ${className}`}>
      <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#ffffff" />
        
        <CraterMesh diameter={diameter * scale} depth={depth * scale} />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
        />
        
        <Text
          position={[0, depth * scale + 1, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {diameter >= 1000 ? `${(diameter / 1000).toFixed(1)}km` : `${diameter.toFixed(0)}m`}
        </Text>
      </Canvas>
    </div>
  );
};
