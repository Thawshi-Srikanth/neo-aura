import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import * as THREE from "three";
import { EARTH_VISUAL_RADIUS, AU_TO_UNITS } from "../../config/constants";
import { getEarthPosition } from "../../utils/orbital-calculations";
import { degToRad } from "../../utils/units-conversions";

export const Earth = forwardRef(
  (
    {
      impactPosition,
      onImpactAnalyzed,
      simulationRunning,
      timeScale = 1,
      daysPerSecond = 5,
    }: {
      impactPosition: THREE.Vector3 | null;
      onImpactAnalyzed: (details: {
        lat: number;
        lon: number;
        isLand: boolean;
      }) => void;
      simulationRunning: boolean;
      timeScale?: number;
      daysPerSecond?: number;
    },
    ref
  ) => {
    const groupRef = useRef<THREE.Group>(null!);
    const meshRef = useRef<THREE.Mesh>(null!);
    const cloudsRef = useRef<THREE.Mesh>(null!);
    const { camera, size } = useThree();
    // Scratch vectors to reduce allocations
    const scratchWorldPosRef = useRef(new THREE.Vector3());

    // Always show mesh; show banner when object appears small on screen
    const [showLabel, setShowLabel] = useState(false);

    useImperativeHandle(ref, () => groupRef.current);

    const [dayMap, normalMap, specularMap] = useTexture([
      "/texture/earth_daymap.jpg",
      "/texture/earth_normal_map.jpg",
      "/texture/earth_specular_map.jpg",
    ]);

    const scaledEarthRadius = EARTH_VISUAL_RADIUS;

    useEffect(() => {
      if (impactPosition && meshRef.current) {

        const rotationY = meshRef.current.rotation.y;
        const inverseRotation = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          -rotationY
        );
        const correctedPosition = impactPosition
          .clone()
          .applyQuaternion(inverseRotation);

        const p = correctedPosition.normalize();
        const lat = 90 - (Math.acos(p.y) * 180) / Math.PI;
        const lon =
          180 - (((Math.atan2(p.z, p.x) * 180) / Math.PI + 180) % 360);


        const img = new Image();
        img.src = "/texture/earth_daymap.jpg";
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) return;
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0, img.width, img.height);

          const u = (lon + 180) / 360;
          const v = (90 - lat) / 180;

          const x = Math.floor(u * img.width);
          const y = Math.floor(v * img.height);

          const pixel = context.getImageData(x, y, 1, 1).data;
          const isLand = pixel[2] < Math.max(pixel[0], pixel[1]) * 0.8;

          onImpactAnalyzed({ lat, lon, isLand });
        };
      }
    }, [impactPosition, onImpactAnalyzed]);

    const timeRef = useRef(0);

    useFrame((_state, delta) => {
      // Update Earth's orbital position around the Sun
      if (groupRef.current) {
        if (simulationRunning) {
          timeRef.current += delta * timeScale * daysPerSecond;
        }
        const [x, y, z] = getEarthPosition(timeRef.current);
        groupRef.current.position.set(
          x * AU_TO_UNITS,
          y * AU_TO_UNITS,
          z * AU_TO_UNITS
        );

        // Compute on-screen projected radius (pixels)
        const worldPos = scratchWorldPosRef.current;
        groupRef.current.getWorldPosition(worldPos);
        const distance = worldPos.distanceTo(camera.position);
        const fovRad = (camera as THREE.PerspectiveCamera).fov
          ? THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov)
          : Math.PI / 3;
        const projectedRadiusPx =
          (scaledEarthRadius * size.height) /
          (2 * Math.tan(fovRad / 2) * distance);

        // Hysteresis on pixel thresholds
        const appearBelowPx = 12; // show banner when the sphere appears tiny
        const hideAbovePx = 16; // hide when sphere becomes large enough
        if (!showLabel && projectedRadiusPx < appearBelowPx) {
          setShowLabel(true);
        } else if (showLabel && projectedRadiusPx > hideAbovePx) {
          setShowLabel(false);
        }
      }

      if (simulationRunning) {
        // CORRECTED: Earth rotates around its own tilted axis (23.5° tilt)
        // Earth completes one rotation in ~24 hours
        // At 5 days/second time scale: 1 day = 0.2 seconds
        // So 1 rotation = 0.2 seconds, rotation speed = 2π / 0.2 = 10π radians per second
        // But we need to scale this properly with timeScale
        const rotationSpeed = 0.5; // Much slower, more reasonable rotation speed
        if (meshRef.current) {
          // This rotates the Earth around its own LOCAL Y-axis.
          // Because the parent group is tilted, this results in a correct, tilted spin
          // relative to the solar system's coordinates.
          meshRef.current.rotation.y += delta * timeScale * rotationSpeed;
        }
        if (cloudsRef.current) {
          // Clouds rotate slightly faster for parallax effect
          cloudsRef.current.rotation.y += delta * timeScale * rotationSpeed * 1.05;
        }
      }
    });

    return (
      <group ref={groupRef}>
        {/* CORRECTED: Earth with proper axial tilt (23.5°) and orientation */}
        {/* Earth's axis is tilted 23.5° from the Y-axis (perpendicular to the orbital plane) */}
        {/* The tilt is around the X-axis, so Earth's north pole points toward +Y direction */}
        {/* This means North Pole points away from Sun (+Y) and South Pole points toward Sun (-Y) */}
        <group rotation={[degToRad(-23.5), 0, 0]}>
          <mesh 
            ref={meshRef} 
            rotation={[0, 0, 0]}
          >
            <sphereGeometry args={[EARTH_VISUAL_RADIUS, 64, 64]} />
            <meshPhongMaterial
              map={dayMap}
              normalMap={normalMap}
              specularMap={specularMap}
              shininess={100}
              emissive={new THREE.Color(0x111111)} // Slight glow for better visibility
            />
          </mesh>

          {/* Earth's rotation axis visualization */}
          <mesh>
            <cylinderGeometry
              args={[0.002, 0.002, EARTH_VISUAL_RADIUS * 3, 8]}
            />
            <meshBasicMaterial color="cyan" wireframe />
          </mesh>
        </group>

        {/* Impact visualization - enhanced */}
        {impactPosition && (
          <>
            {/* Impact crater on Earth surface */}
            <mesh position={impactPosition}>
              <sphereGeometry args={[EARTH_VISUAL_RADIUS * 0.08, 16, 16]} />
              <meshStandardMaterial
                color="red"
                emissive="red"
                emissiveIntensity={0.5}
              />
            </mesh>

            {/* Impact explosion effect */}
            <mesh position={impactPosition}>
              <sphereGeometry args={[EARTH_VISUAL_RADIUS * 0.15, 16, 16]} />
              <meshStandardMaterial
                color="orange"
                emissive="orange"
                emissiveIntensity={0.3}
                transparent
                opacity={0.7}
              />
            </mesh>

            {/* Impact shockwave */}
            <mesh position={impactPosition}>
              <sphereGeometry args={[EARTH_VISUAL_RADIUS * 0.25, 16, 16]} />
              <meshStandardMaterial
                color="yellow"
                emissive="yellow"
                emissiveIntensity={0.2}
                transparent
                opacity={0.4}
              />
            </mesh>
          </>
        )}

      </group>
    );
  }
);

Earth.displayName = "Earth";
