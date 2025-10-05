import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface DamageZone3DProps {
  airblastRadius: number;
  thermalRadius: number;
  craterDiameter: number;
  className?: string;
}

const DamageZoneMesh: React.FC<{ 
  airblastRadius: number; 
  thermalRadius: number; 
  craterDiameter: number;
}> = ({ airblastRadius, thermalRadius, craterDiameter }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const thermalRef = useRef<THREE.Mesh>(null);
  const blastRef = useRef<THREE.Mesh>(null);
  
  const craterGeometry = useMemo(() => {
    const segments = 32;
    const geometry = new THREE.ConeGeometry(craterDiameter / 2, craterDiameter / 4, segments);
    
    // Create crater shape
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];
      
      const distance = Math.sqrt(x * x + z * z);
      const normalizedDistance = distance / (craterDiameter / 2);
      
      if (normalizedDistance < 1) {
        const craterDepth = (craterDiameter / 4) * (1 - normalizedDistance * normalizedDistance);
        vertices[i + 1] = y - craterDepth;
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }, [craterDiameter]);

  const thermalGeometry = useMemo(() => {
    const segments = 32;
    return new THREE.SphereGeometry(thermalRadius, segments, segments);
  }, [thermalRadius]);

  const blastGeometry = useMemo(() => {
    const segments = 32;
    return new THREE.SphereGeometry(airblastRadius, segments, segments);
  }, [airblastRadius]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
    if (thermalRef.current) {
      thermalRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      const time = state.clock.elapsedTime;
      const scale = 1 + Math.sin(time * 0.5) * 0.1;
      thermalRef.current.scale.setScalar(scale);
    }
    if (blastRef.current) {
      blastRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      const time = state.clock.elapsedTime;
      const scale = 1 + Math.sin(time * 0.3) * 0.15;
      blastRef.current.scale.setScalar(scale);
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
      
      {/* Thermal zone */}
      <mesh ref={thermalRef} geometry={thermalGeometry}>
        <meshStandardMaterial 
          color="#ff4444" 
          transparent={true}
          opacity={0.2}
          wireframe={true}
          wireframeLinewidth={1}
        />
      </mesh>
      
      {/* Blast zone */}
      <mesh ref={blastRef} geometry={blastGeometry}>
        <meshStandardMaterial 
          color="#ff8844" 
          transparent={true}
          opacity={0.15}
          wireframe={true}
          wireframeLinewidth={1}
        />
      </mesh>
    </group>
  );
};

export const DamageZone3D: React.FC<DamageZone3DProps> = ({ 
  airblastRadius, 
  thermalRadius, 
  craterDiameter, 
  className = "" 
}) => {
  const scale = Math.min(1, 8 / Math.max(airblastRadius, thermalRadius, craterDiameter));
  
  return (
    <div className={`w-full h-48 ${className}`}>
      <Canvas camera={{ position: [0, 5, 8], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#ffffff" />
        
        <DamageZoneMesh 
          airblastRadius={airblastRadius * scale} 
          thermalRadius={thermalRadius * scale}
          craterDiameter={craterDiameter * scale}
        />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
        />
        
        <Text
          position={[0, craterDiameter * scale + 1, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Damage Zones
        </Text>
      </Canvas>
    </div>
  );
};
