import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface AsteroidWireframe3DProps {
  diameter: number;
  asteroidId: string;
  className?: string;
}

const AsteroidWireframeMesh: React.FC<{ diameter: number; asteroidId: string }> = ({ diameter, asteroidId }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    // Create seeded random number generator using asteroid ID
    const seed = asteroidId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const seededRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };
    
    // Create potato-like asteroid using sphere with noise
    const baseSize = Math.max(0.5, Math.min(3, diameter / 1000));
    const radius = baseSize;
    const segments = 8; // Reduced from 16 to 8 for simpler geometry
    
    // Create sphere geometry with fewer segments
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    
    // Apply noise to vertices to create asymmetric potato-like asteroids
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];
      
      // Calculate noise based on position and seed
      const noise1 = seededRandom(Math.floor(x * 100 + y * 100 + z * 100));
      const noise2 = seededRandom(Math.floor(x * 200 + y * 200 + z * 200));
      const noise3 = seededRandom(Math.floor(x * 300 + y * 300 + z * 300));
      
      // Create asymmetric asteroid with different sides
      const sideFactor = x > 0 ? 1.0 : 0.6; // Right side (x > 0) is wider, left side (x < 0) is narrower
      const heightFactor = Math.abs(y) > 0.5 ? 0.8 : 1.2; // Top/bottom are different from middle
      
      // Create potato-like bumps and irregularities (reduced intensity)
      const bumpIntensity = (0.2 + noise1 * 0.2) * sideFactor * heightFactor;
      const bumpScale = 1 + bumpIntensity * (0.3 + noise2 * 0.3);
      
      // Add random spikes and protrusions (reduced intensity)
      const spikeIntensity = noise3 * 0.2 * sideFactor;
      const spikeDirection = new THREE.Vector3(x, y, z).normalize();
      
      // Apply asymmetric scaling
      const newX = x * bumpScale + spikeDirection.x * spikeIntensity;
      const newY = y * bumpScale + spikeDirection.y * spikeIntensity;
      const newZ = z * bumpScale + spikeDirection.z * spikeIntensity;
      
      vertices[i] = newX;
      vertices[i + 1] = newY;
      vertices[i + 2] = newZ;
    }
    
    // Update normals for proper lighting
    geometry.computeVertexNormals();
    
    // Apply smoothing to make the surface more natural
    const smoothGeometry = geometry.clone();
    
    // Smooth the geometry by averaging nearby vertices
    const positions = smoothGeometry.attributes.position.array;
    const smoothedPositions = new Float32Array(positions.length);
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Find nearby vertices for smoothing
      let smoothX = x, smoothY = y, smoothZ = z;
      let count = 1;
      
      for (let j = 0; j < positions.length; j += 3) {
        if (i !== j) {
          const dx = positions[j] - x;
          const dy = positions[j + 1] - y;
          const dz = positions[j + 2] - z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          // Smooth with nearby vertices (within a certain distance)
          if (distance < baseSize * 0.3) {
            smoothX += positions[j];
            smoothY += positions[j + 1];
            smoothZ += positions[j + 2];
            count++;
          }
        }
      }
      
      // Apply smoothing factor (0.3 = 30% smoothing, 70% original)
      const smoothFactor = 0.3;
      smoothedPositions[i] = x * (1 - smoothFactor) + (smoothX / count) * smoothFactor;
      smoothedPositions[i + 1] = y * (1 - smoothFactor) + (smoothY / count) * smoothFactor;
      smoothedPositions[i + 2] = z * (1 - smoothFactor) + (smoothZ / count) * smoothFactor;
    }
    
    // Update the geometry with smoothed positions
    smoothGeometry.attributes.position = new THREE.BufferAttribute(smoothedPositions, 3);
    smoothGeometry.computeVertexNormals();
    
    // Add random rotation
    smoothGeometry.rotateX(seededRandom(1000) * Math.PI);
    smoothGeometry.rotateY(seededRandom(2000) * Math.PI);
    smoothGeometry.rotateZ(seededRandom(3000) * Math.PI);
    
    return smoothGeometry;
  }, [diameter, asteroidId]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial 
        color="#ffffff" 
        roughness={0.1}
        metalness={0.2}
        wireframe={true}
        wireframeLinewidth={2}
      />
    </mesh>
  );
};

export const AsteroidWireframe3D: React.FC<AsteroidWireframe3DProps> = ({ diameter, asteroidId, className = "" }) => {
  const scale = Math.min(3, 15 / diameter); // Much larger scale for significant zoom
  
  return (
    <div className={`w-full aspect-square bg-black ${className}`}>
      <Canvas 
        camera={{ position: [0, 0, 3], fov: 45 }} // Proper camera distance and FOV to see the asteroid
        style={{ background: 'black', width: '100%', height: '100%' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[0, 5, 0]} intensity={0.8} color="#ffffff" />
        
        <AsteroidWireframeMesh diameter={diameter * scale} asteroidId={asteroidId} />
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={false} 
          enableRotate={true}
          autoRotate={true}
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
};
