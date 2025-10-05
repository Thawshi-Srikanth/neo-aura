import React, { forwardRef } from "react";
import * as THREE from "three";
import { SCALED_EARTH_RADIUS } from "../config/constants";

interface EarthProps {
  parentRef?: React.Ref<THREE.Group>;
}

// Simple Earth - just a blue sphere
const Earth = forwardRef<THREE.Group, EarthProps>(({ parentRef }, ref) => {
  return (
    <group ref={ref || parentRef}>
      {/* Earth as a simple blue sphere */}
      <mesh>
        <sphereGeometry args={[SCALED_EARTH_RADIUS, 32, 32]} />
        <meshPhongMaterial color="#4a90e2" shininess={10} />
      </mesh>
    </group>
  );
});

Earth.displayName = "Earth";

export default Earth;
