import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Earth from "../Earth";

interface EarthOrbitProps {
  currentTime: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  visible?: boolean;
}

const EarthOrbit: React.FC<EarthOrbitProps> = ({
  currentTime,
  orbitRadius = 0.3, // Distance from Sun in our 3D space units
  orbitSpeed = 0.01, // Speed of Earth's orbit
  visible = true,
}) => {
  const earthRef = useRef<THREE.Group>(null);

  // Calculate Earth's position in its orbit around the Sun
  useFrame(() => {
    if (earthRef.current && visible) {
      const angle = currentTime * orbitSpeed;
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      const y = 0; // Keep Earth in the ecliptic plane

      earthRef.current.position.set(x, y, z);
    }
  });

  if (!visible) return null;

  return (
    <group ref={earthRef}>
      <Earth />
    </group>
  );
};

export default EarthOrbit;
