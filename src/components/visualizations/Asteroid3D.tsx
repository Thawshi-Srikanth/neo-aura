import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Asteroid3DProps {
  diameter: number;
  className?: string;
}

const AsteroidMesh: React.FC<{ diameter: number }> = ({ diameter }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    const segments = 16;
    const geometry = new THREE.SphereGeometry(diameter / 2, segments, segments);
    
    // Add irregular asteroid shape by modifying vertices
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];
      
      // Add noise for irregular shape
      const noise = Math.sin(x * 2) * Math.cos(y * 2) * Math.sin(z * 2) * 0.1;
      const distance = Math.sqrt(x * x + y * y + z * z);
      const normalizedDistance = distance / (diameter / 2);
      
      if (normalizedDistance > 0.1) {
        vertices[i] = x * (1 + noise);
        vertices[i + 1] = y * (1 + noise);
        vertices[i + 2] = z * (1 + noise);
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }, [diameter]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial 
        color="#8B7355" 
        roughness={0.9} 
        metalness={0.1}
        wireframe={true}
        wireframeLinewidth={2}
      />
    </mesh>
  );
};

export const Asteroid3D: React.FC<Asteroid3DProps> = ({ diameter, className = "" }) => {
  const scale = Math.min(1, 5 / diameter); // Scale to fit view
  
  return (
    <div className={`w-full h-48 ${className}`}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={0.4} color="#ffffff" />
        
        <AsteroidMesh diameter={diameter * scale} />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
        />
        
        <Text
          position={[0, diameter * scale + 1, 0]}
          fontSize={0.3}
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
