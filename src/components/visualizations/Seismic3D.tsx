import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Seismic3DProps {
  magnitude: number;
  epicenterRadius: number;
  className?: string;
}

const SeismicMesh: React.FC<{ 
  magnitude: number; 
  epicenterRadius: number;
}> = () => {
  const earthRef = useRef<THREE.Mesh>(null);
  const waveRefs = useRef<THREE.Mesh[]>([]);
  
  const earthGeometry = useMemo(() => {
    const segments = 32;
    return new THREE.SphereGeometry(2, segments, segments);
  }, []);

  const waveGeometry = useMemo(() => {
    const segments = 32;
    return new THREE.SphereGeometry(1, segments, segments);
  }, []);

  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
    
    // Animate seismic waves
    waveRefs.current.forEach((wave, index) => {
      if (wave) {
        const time = state.clock.elapsedTime;
        const waveSpeed = 0.5 + index * 0.2;
        const scale = 1 + Math.sin(time * waveSpeed) * 0.3;
        wave.scale.setScalar(scale);
        wave.rotation.y = time * 0.1;
        wave.rotation.x = Math.sin(time * 0.05) * 0.1;
      }
    });
  });

  return (
    <group>
      {/* Earth */}
      <mesh ref={earthRef} geometry={earthGeometry}>
        <meshStandardMaterial 
          color="#4a90e2" 
          roughness={0.8} 
          metalness={0.1}
          wireframe={true}
          wireframeLinewidth={2}
        />
      </mesh>
      
      {/* Seismic waves */}
      {[1, 2, 3, 4].map((wave, index) => (
        <mesh 
          key={wave}
          ref={(el) => { if (el) waveRefs.current[index] = el; }}
          geometry={waveGeometry}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial 
            color={index === 0 ? "#ff4444" : index === 1 ? "#ff8844" : index === 2 ? "#ffaa44" : "#ffdd44"}
            transparent={true}
            opacity={0.6 - index * 0.1}
            wireframe={true}
            wireframeLinewidth={1}
          />
        </mesh>
      ))}
      
      {/* Epicenter */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

export const Seismic3D: React.FC<Seismic3DProps> = ({ 
  magnitude, 
  epicenterRadius, 
  className = "" 
}) => {
  return (
    <div className={`w-full h-48 ${className}`}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#ffffff" />
        
        <SeismicMesh magnitude={magnitude} epicenterRadius={epicenterRadius} />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
        />
        
        <Text
          position={[0, 3, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          M{magnitude.toFixed(1)}
        </Text>
      </Canvas>
    </div>
  );
};
