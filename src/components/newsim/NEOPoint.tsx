import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { Asteroid } from "../../types/asteroid";

interface NEOPointProps {
  asteroid: Asteroid;
  time: number;
  color?: string;
  blinkSpeed?: number;
  size?: number;
  visible?: boolean;
  onClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
  isSelected?: boolean;
}

const NEOPoint: React.FC<NEOPointProps> = ({
  asteroid,
  time,
  color = "#ffff00", // Yellow by default
  blinkSpeed = 1.0,
  size = 0.005,
  visible = true,
  onClick,
  isSelected = false,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate asteroid position
  const position = useMemo(() => {
    try {
      const [x, y, z] = getAsteroidPosition(time, asteroid.orbital_data);
      // Scale down the coordinates for better visualization
      // Convert AU to a more reasonable scale for our 3D scene
      const scale = 0.1; // Adjust this scale factor as needed

      // CORRECTED: Proper astronomical coordinate system
      // X-axis: toward vernal equinox, Y-axis: toward north ecliptic pole, Z-axis: perpendicular
      // For Three.js: X=right, Y=up, Z=forward (toward viewer)
      return [x * scale, z * scale, y * scale] as const; // Corrected coordinate mapping
    } catch (error) {
      console.warn(`Error calculating position for ${asteroid.name}:`, error);
      return [0, 0, 0] as const;
    }
  }, [asteroid, time]);

  // Animate blinking effect and selection
  useFrame((state) => {
    if (materialRef.current) {
      if (isSelected) {
        // Stronger pulsing for selected NEO
        const opacity = 0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 4);
        materialRef.current.opacity = opacity;
      } else {
        const opacity =
          0.5 + 0.5 * Math.sin(state.clock.elapsedTime * blinkSpeed * 2);
        materialRef.current.opacity = opacity;
      }
    }
  });

  if (!visible) return null;

  // Handle click interaction - ROUTER SAFE VERSION
  const handleClick = (event: React.MouseEvent) => {
    // Don't stop propagation to avoid interfering with React Router
    if (onClick && event.button === 0) {
      // Only handle left clicks
      onClick(asteroid, [position[0], position[1], position[2]]);
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      <sphereGeometry
        args={[isSelected ? size * 1.5 : isHovered ? size * 1.2 : size, 8, 8]}
      />
      <meshBasicMaterial
        ref={materialRef}
        color={isSelected ? "#ff6600" : isHovered ? "#ffaa00" : color}
        transparent
        opacity={1}
      />
    </mesh>
  );
};

export default NEOPoint;
