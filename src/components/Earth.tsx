import React, { forwardRef, useRef, useMemo } from "react";
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

// Global texture cache to prevent reloading
let textureCache: {
  dayTexture?: THREE.Texture;
  nightTexture?: THREE.Texture;
  cloudTexture?: THREE.Texture;
  normalMap?: THREE.Texture;
  specularMap?: THREE.Texture;
} = {};

let geometryCache: {
  earthGeometry?: THREE.SphereGeometry;
  cloudGeometry?: THREE.SphereGeometry;
  axisGeometry?: THREE.CylinderGeometry;
} = {};

const Earth = forwardRef<THREE.Group, EarthProps>(({ parentRef }, ref) => {
  const earthRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  // Load textures only once globally
  const [dayTexture, nightTexture, cloudTexture, normalMap, specularMap] =
    useLoader(THREE.TextureLoader, [
      "/texture/earth_daymap.jpg",
      "/texture/earth_nightmap.jpg",
      "/texture/earth_clouds.jpg",
      "/texture/earth_normal_map.jpg",
      "/texture/earth_specular_map.jpg",
    ]);

  // Cache textures globally to prevent reloading
  if (!textureCache.dayTexture) {
    textureCache = {
      dayTexture,
      nightTexture,
      cloudTexture,
      normalMap,
      specularMap,
    };
  }

  // Cache geometries to prevent recreation
  const earthGeometry = useMemo(() => {
    if (!geometryCache.earthGeometry) {
      geometryCache.earthGeometry = new THREE.SphereGeometry(
        SCALED_EARTH_RADIUS,
        64,
        64
      );
    }
    return geometryCache.earthGeometry;
  }, []);

  const cloudGeometry = useMemo(() => {
    if (!geometryCache.cloudGeometry) {
      geometryCache.cloudGeometry = new THREE.SphereGeometry(
        SCALED_EARTH_RADIUS + SCALED_EARTH_RADIUS * EARTH_CLOUD_OFFSET,
        64,
        64
      );
    }
    return geometryCache.cloudGeometry;
  }, []);

  const axisGeometry = useMemo(() => {
    if (!geometryCache.axisGeometry) {
      geometryCache.axisGeometry = new THREE.CylinderGeometry(
        SCALED_EARTH_RADIUS * 0.002,
        SCALED_EARTH_RADIUS * 0.002,
        SCALED_EARTH_RADIUS * 2.2,
        8,
        1
      );
    }
    return geometryCache.axisGeometry;
  }, []);

  // Cache materials to prevent recreation
  const earthMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      map: textureCache.dayTexture || dayTexture,
      normalMap: textureCache.normalMap || normalMap,
      specularMap: textureCache.specularMap || specularMap,
      shininess: 15,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: textureCache.nightTexture || nightTexture,
    });
  }, [dayTexture, nightTexture, normalMap, specularMap]);

  const cloudMaterial = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      map: textureCache.cloudTexture || cloudTexture,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
  }, [cloudTexture]);

  const axisMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: "white",
      transparent: true,
      opacity: 0.6,
      alphaTest: 0.1,
    });
  }, []);

  useFrame(() => {
    // Earth rotates around its own tilted axis (23.5° tilt)
    if (earthRef.current) earthRef.current.rotation.y += EARTH_ROTATION_SPEED;
    if (cloudsRef.current)
      cloudsRef.current.rotation.y += CLOUDS_ROTATION_SPEED;
  });

  return (
    <group ref={ref || parentRef}>
      {/* Earth with proper axial tilt (23.5°) */}
      <group rotation={[0, 0, degToRad(23.5)]}>
        <mesh
          ref={earthRef}
          rotation={[0, 0, Math.PI]}
          geometry={earthGeometry}
          material={earthMaterial}
        />

        {/* Clouds with same tilt */}
        <mesh
          ref={cloudsRef}
          rotation={[0, 0, Math.PI]}
          geometry={cloudGeometry}
          material={cloudMaterial}
        />
      </group>

      {/* Axial tilt line - dotted line showing Earth's tilt */}
      <group rotation={[0, 0, degToRad(23.5)]}>
        <mesh
          position={[0, 0, 0]}
          geometry={axisGeometry}
          material={axisMaterial}
        />
      </group>
    </group>
  );
});

Earth.displayName = "Earth";

export default Earth;
