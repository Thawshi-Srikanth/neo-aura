import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SunProps {
  position?: [number, number, number];
  size?: number;
  visible?: boolean;
}

const Sun: React.FC<SunProps> = ({
  position = [0, 0, 0],
  size = 0.02,
  visible = true,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Add a pulsing glow effect
  useFrame((state) => {
    if (materialRef.current) {
      const intensity = 0.8 + 0.2 * Math.sin(state.clock.elapsedTime * 2);
      materialRef.current.emissiveIntensity = intensity;
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#ffaa00"
        emissive="#ff8800"
        emissiveIntensity={1}
      />
      {/* Add a glowing halo effect */}
      <mesh scale={[1.5, 1.5, 1.5]}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.2} />
      </mesh>
    </mesh>
  );
};

export default Sun;
