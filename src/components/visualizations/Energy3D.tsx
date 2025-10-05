import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Energy3DProps {
  kineticEnergy: number;
  tntEquivalent: number;
  className?: string;
}

const EnergyMesh: React.FC<{ 
  kineticEnergy: number; 
  tntEquivalent: number;
}> = () => {
  const energyRef = useRef<THREE.Mesh>(null);
  const waveRefs = useRef<THREE.Mesh[]>([]);
  
  const energyGeometry = useMemo(() => {
    const segments = 16;
    return new THREE.SphereGeometry(1, segments, segments);
  }, []);

  const waveGeometry = useMemo(() => {
    const segments = 16;
    return new THREE.SphereGeometry(1, segments, segments);
  }, []);

  useFrame((state) => {
    if (energyRef.current) {
      energyRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      energyRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    }
    
    // Animate energy waves
    waveRefs.current.forEach((wave, index) => {
      if (wave) {
        const time = state.clock.elapsedTime;
        const waveSpeed = 0.8 + index * 0.3;
        const scale = 1.5 + Math.sin(time * waveSpeed) * 0.5;
        wave.scale.setScalar(scale);
        wave.rotation.y = time * 0.2;
        wave.rotation.x = Math.sin(time * 0.1) * 0.3;
      }
    });
  });

  return (
    <group>
      {/* Core energy */}
      <mesh ref={energyRef} geometry={energyGeometry}>
        <meshStandardMaterial 
          color="#ffff00" 
          roughness={0.1} 
          metalness={0.9}
          wireframe={true}
          wireframeLinewidth={3}
        />
      </mesh>
      
      {/* Energy waves */}
      {[1, 2, 3, 4, 5].map((wave, index) => (
        <mesh 
          key={wave}
          ref={(el) => { if (el) waveRefs.current[index] = el; }}
          geometry={waveGeometry}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial 
            color={index === 0 ? "#ffff00" : index === 1 ? "#ffaa00" : index === 2 ? "#ff6600" : index === 3 ? "#ff3300" : "#ff0000"}
            transparent={true}
            opacity={0.8 - index * 0.15}
            wireframe={true}
            wireframeLinewidth={2 - index * 0.3}
          />
        </mesh>
      ))}
    </group>
  );
};

export const Energy3D: React.FC<Energy3DProps> = ({ 
  kineticEnergy, 
  tntEquivalent, 
  className = "" 
}) => {
  return (
    <div className={`w-full h-48 ${className}`}>
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={0.3} color="#ffffff" />
        
        <EnergyMesh kineticEnergy={kineticEnergy} tntEquivalent={tntEquivalent} />
        
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
          {tntEquivalent >= 1 ? `${tntEquivalent.toFixed(1)} MT` : `${(tntEquivalent * 1000).toFixed(0)} KT`}
        </Text>
      </Canvas>
    </div>
  );
};
