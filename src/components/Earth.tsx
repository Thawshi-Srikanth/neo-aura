import React, { forwardRef, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import {
  SCALED_EARTH_RADIUS,
  EARTH_CLOUD_OFFSET,
  EARTH_ROTATION_SPEED,
  CLOUDS_ROTATION_SPEED,
} from "../config/constants";
import { degToRad } from "../utils/units-conversions";

interface EarthProps {
  parentRef?: React.Ref<THREE.Group>;
}

const Earth = forwardRef<THREE.Group, EarthProps>(({ parentRef }, ref) => {
  const earthRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  const [dayTexture, nightTexture, cloudTexture, normalMap, specularMap] =
    useLoader(THREE.TextureLoader, [
      "/texture/earth_daymap.jpg",
      "/texture/earth_nightmap.jpg",
      "/texture/earth_clouds.jpg",
      "/texture/earth_normal_map.jpg",
      "/texture/earth_specular_map.jpg",
    ]);

  useFrame(() => {
    // Earth rotates around its own tilted axis (23.5° tilt)
    earthRef.current.rotation.y += EARTH_ROTATION_SPEED;
    cloudsRef.current.rotation.y += CLOUDS_ROTATION_SPEED;
  });

  return (
    <group ref={ref || parentRef}>
      {/* Earth with proper axial tilt (23.5°) */}
      <group rotation={[0, 0, degToRad(23.5)]}>
        <mesh ref={earthRef} rotation={[0, 0, Math.PI]}>
          <sphereGeometry args={[SCALED_EARTH_RADIUS, 64, 64]} />
          <meshPhongMaterial
            map={dayTexture}
            normalMap={normalMap}
            specularMap={specularMap}
            shininess={15}
            emissive={new THREE.Color(0xffffff)}
            emissiveMap={nightTexture}
          />
        </mesh>

        {/* Clouds with same tilt */}
        <mesh ref={cloudsRef} rotation={[0, 0, Math.PI]}>
          <sphereGeometry
            args={[
              SCALED_EARTH_RADIUS + SCALED_EARTH_RADIUS * EARTH_CLOUD_OFFSET,
              64,
              64,
            ]}
          />
          <meshPhongMaterial
            map={cloudTexture}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      </group>
      
      {/* Axial tilt line - dotted line showing Earth's tilt */}
      <group rotation={[0, 0, degToRad(23.5)]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[SCALED_EARTH_RADIUS * 0.002, SCALED_EARTH_RADIUS * 0.002, SCALED_EARTH_RADIUS * 2.2, 8, 1]} />
          <meshStandardMaterial 
            color="white" 
            transparent 
            opacity={0.6}
            alphaTest={0.1}
          />
        </mesh>
      </group>
    </group>
  );
});

Earth.displayName = "Earth";

export default Earth;
