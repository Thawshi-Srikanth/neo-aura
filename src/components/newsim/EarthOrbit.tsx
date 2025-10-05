import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { positionToLonLat } from "../../utils/coordinates";
import { SCALED_EARTH_RADIUS } from "../../config/constants";
import SimpleEarth from "../SimpleEarth";

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

    // Stop event propagation to prevent orbit controls from interfering
    event.stopPropagation();

    // Get the intersection point in world coordinates
    const intersectionPoint = event.point as THREE.Vector3;

    // Convert world position to local Earth coordinates
    // Account for Earth's orbital position
    const earthWorldPosition =
      earthRef.current?.position || new THREE.Vector3(0, 0, 0);
    const localPoint = intersectionPoint.clone().sub(earthWorldPosition);

    // Convert to longitude/latitude
    const coords = positionToLonLat(localPoint, SCALED_EARTH_RADIUS);
    onCoordinateClick(coords.longitude, coords.latitude);
  };

  // Apply an initial position once on mount or when visibility toggles on
  useEffect(() => {
    if (!visible || !earthRef.current) return;
    const angle = currentTime * orbitSpeed;
    earthRef.current.position.set(
      Math.cos(angle) * orbitRadius,
      0,
      Math.sin(angle) * orbitRadius
    );
    lastAppliedTimeRef.current = currentTime;
  }, [visible]);

  useFrame(() => {
    if (!visible || !earthRef.current) return;

    // Only update if time changed enough (prevents per-frame heavy math when UI throttled)
    const dt = currentTime - lastAppliedTimeRef.current;
    if (dt === 0) return;

    const angle = currentTime * orbitSpeed;
    const targetX = Math.cos(angle) * orbitRadius;
    const targetZ = Math.sin(angle) * orbitRadius;

    // Smoothly interpolate to reduce sudden jumps if UI time is coarse
    earthRef.current.position.x = THREE.MathUtils.lerp(
      earthRef.current.position.x,
      targetX,
      0.6
    );
    earthRef.current.position.z = THREE.MathUtils.lerp(
      earthRef.current.position.z,
      targetZ,
      0.6
    );
    earthRef.current.position.y = 0;
    lastAppliedTimeRef.current = currentTime;
  });

  if (!visible) return null;
  return (
    <group ref={earthRef} onClick={handleEarthClick}>
      <SimpleEarth />
    </group>
  );
};

export default EarthOrbit;
