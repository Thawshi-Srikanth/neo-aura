import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { positionToLonLat } from "../../utils/coordinates";

interface EarthOrbitProps {
  currentTime: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  visible?: boolean;
  onCoordinateClick?: (longitude: number, latitude: number) => void;
}

const EarthOrbit: React.FC<EarthOrbitProps> = ({
  currentTime,
  orbitRadius = 0.3,
  orbitSpeed = 0.01,
  visible = true,
  onCoordinateClick,
}) => {
  const earthRef = useRef<THREE.Group>(null);
  const lastAppliedTimeRef = useRef<number>(currentTime);

  const handleEarthClick = (event: any) => {
    if (!onCoordinateClick) return;

    try {
      // Stop event propagation to prevent orbit controls from interfering
      event.stopPropagation();

      // Get the intersection point in world coordinates
      const intersectionPoint = event.point as THREE.Vector3;
      if (!intersectionPoint) return;

      // Convert world position to local Earth coordinates
      // Account for Earth's orbital position
      const earthWorldPosition =
        earthRef.current?.position || new THREE.Vector3(0, 0, 0);
      const localPoint = intersectionPoint.clone().sub(earthWorldPosition);

      // Convert to longitude/latitude
      const coords = positionToLonLat(localPoint, 0.02);
      onCoordinateClick(coords.longitude, coords.latitude);
    } catch (error) {
      console.warn("Error handling Earth click:", error);
    }
  };

  // Apply an initial position once on mount or when visibility toggles on
  useEffect(() => {
    if (!visible || !earthRef.current) return;
    try {
      const angle = currentTime * orbitSpeed;
      earthRef.current.position.set(
        Math.cos(angle) * orbitRadius,
        0,
        -Math.sin(angle) * orbitRadius
      );
      lastAppliedTimeRef.current = currentTime;
    } catch (error) {
      console.warn("Error setting initial Earth position:", error);
    }
  }, [visible, currentTime, orbitSpeed, orbitRadius]);

  useFrame(() => {
    if (!visible || !earthRef.current) return;

    try {
      // Only update if time changed enough (prevents per-frame heavy math when UI throttled)
      const dt = currentTime - lastAppliedTimeRef.current;
      if (Math.abs(dt) < 0.001) return; // Small threshold to prevent unnecessary updates

      const angle = currentTime * orbitSpeed;
      const targetX = Math.cos(angle) * orbitRadius;
      const targetZ = -Math.sin(angle) * orbitRadius;

      // Smoothly interpolate to reduce sudden jumps if UI time is coarse
      earthRef.current.position.x = THREE.MathUtils.lerp(
        earthRef.current.position.x,
        targetX,
        0.1
      );
      earthRef.current.position.z = THREE.MathUtils.lerp(
        earthRef.current.position.z,
        targetZ,
        0.1
      );
      earthRef.current.position.y = 0;
      lastAppliedTimeRef.current = currentTime;
    } catch (error) {
      console.warn("Error updating Earth orbit position:", error);
    }
  });

  if (!visible) return null;
  return (
    <group ref={earthRef} onClick={handleEarthClick}>
      {/* Earth sphere with correct scale (much smaller than Sun) */}
      <mesh>
        <sphereGeometry args={[0.02, 32, 32]} />
        <meshPhongMaterial color="#4472CA" />
      </mesh>
    </group>
  );
};

export default EarthOrbit;
