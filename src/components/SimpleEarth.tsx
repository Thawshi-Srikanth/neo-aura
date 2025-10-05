import React, { forwardRef, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { EARTH_ROTATION_SPEED, EARTH_VISUAL_RADIUS } from "../config/constants";
import { degToRad } from "../utils/units-conversions";

interface EarthProps {
  parentRef?: React.Ref<THREE.Group>;
}

const SimpleEarth = forwardRef<THREE.Group, EarthProps>(
  ({ parentRef }, ref) => {
    const earthRef = useRef<THREE.Mesh>(null!);
    const [dayTexture, normalMap] = useLoader(THREE.TextureLoader, [
      "/texture/earth_daymap.jpg",
      "/texture/earth_normal_map.jpg",
    ]);

    useFrame(() => {
      // Earth rotates around its own tilted axis (23.5° tilt)
      earthRef.current.rotation.y += EARTH_ROTATION_SPEED;
    });

    return (
      <group ref={ref || parentRef}>
        {/* Earth with proper axial tilt (23.5°) */}
        <group rotation={[0, 0, degToRad(23.5)]}>
          <mesh ref={earthRef} rotation={[0, 0, 0]}>
            <sphereGeometry args={[EARTH_VISUAL_RADIUS, 64, 64]} />
            <meshPhongMaterial
              map={dayTexture}
              normalMap={normalMap}
              shininess={15}
            />
          </mesh>
        </group>

        {/* Axial tilt line - dotted line showing Earth's tilt */}
        <group rotation={[0, 0, degToRad(23.5)]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry
              args={[
                EARTH_VISUAL_RADIUS * 0.002,
                EARTH_VISUAL_RADIUS * 0.002,
                EARTH_VISUAL_RADIUS * 2.2,
                8,
                1,
              ]}
            />
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
  }
);

SimpleEarth.displayName = "SimpleEarth";

export default SimpleEarth;
