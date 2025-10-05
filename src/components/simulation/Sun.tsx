import { useFrame, useThree } from "@react-three/fiber";
import { useRef, forwardRef, useImperativeHandle, useState } from "react";
import * as THREE from "three";
import { SUN_VISUAL_RADIUS } from "../../config/constants";

export const Sun = forwardRef((_, ref) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera, size } = useThree();
  const [showLabel, setShowLabel] = useState(false);

  useImperativeHandle(ref, () => meshRef.current);

  useFrame((_, delta) => {
    // Compute on-screen projected radius (pixels)
    if (meshRef.current) {
      const worldPos = new THREE.Vector3();
      meshRef.current.getWorldPosition(worldPos);
      const distance = worldPos.distanceTo(camera.position);
      const fovRad = (camera as THREE.PerspectiveCamera).fov
        ? THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov)
        : Math.PI / 3;
      const projectedRadiusPx = (SUN_VISUAL_RADIUS * size.height) / (2 * Math.tan(fovRad / 2) * distance);

      // Hysteresis on pixel thresholds
      const appearBelowPx = 12; // show banner when the sphere appears tiny
      const hideAbovePx = 16;   // hide when sphere becomes large enough
      if (!showLabel && projectedRadiusPx < appearBelowPx) {
        setShowLabel(true);
      } else if (showLabel && projectedRadiusPx > hideAbovePx) {
        setShowLabel(false);
      }
    }

    // Rotate the Sun slowly
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.01; // Slow rotation
    }
  });

  return (
    <group>
      {/* CORRECTED: Sun is properly positioned at the origin of the coordinate system */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[SUN_VISUAL_RADIUS, 64, 64]} />
        <meshStandardMaterial 
          color="#FDB813" 
          emissive="#FFA500" 
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {/* Sun's light source - properly positioned at origin */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={2} 
        color="#FDB813"
        distance={100}
        decay={2}
      />
      
      {/* Sun's corona effect */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[SUN_VISUAL_RADIUS * 1.2, 32, 32]} />
        <meshBasicMaterial 
          color="#FFA500" 
          transparent 
          opacity={0.1}
        />
      </mesh>
      
    </group>
  );
});

Sun.displayName = "Sun";
