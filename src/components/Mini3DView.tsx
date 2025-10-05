import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { EARTH_VISUAL_RADIUS, AU_TO_UNITS } from "../config/constants";
import { getEarthPosition, getAsteroidPosition } from "../utils/orbital-calculations";
import { getCollisionOrbitPosition } from "../utils/orbitalCollision";
import type { AsteroidOrbitalData } from "../types/asteroid";
import type { CollisionOrbit } from "../utils/orbitalCollision";
import { Button } from "./ui/button";
import { Maximize2Icon, Minimize2Icon } from "lucide-react";

interface Mini3DViewProps {
  asteroidOrbitalData: AsteroidOrbitalData;
  collisionOrbit: CollisionOrbit | null;
  simulationTime: number;
  timeScale: number;
  isVisible: boolean;
  impactPosition?: THREE.Vector3 | null;
  resetKey?: number;
}

// Detailed Mini Earth component with longitude/latitude lines
function MiniEarth({
  timeScale,
  impactPosition,
  resetKey
}: {
  simulationTime: number;
  timeScale: number;
  impactPosition?: THREE.Vector3 | null;
  resetKey?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  // Load Earth textures
  const [dayMap, normalMap, specularMap] = useTexture([
    "/texture/earth_daymap.jpg",
    "/texture/earth_normal_map.jpg",
    "/texture/earth_specular_map.jpg",
  ]);

  // Reset Earth rotation when resetKey changes
  useEffect(() => {
    if (meshRef.current && resetKey !== undefined) {
      meshRef.current.rotation.set(0, 0, 0);
    }
  }, [resetKey]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Keep Earth centered in mini view (no orbital motion)
      groupRef.current.position.set(0, 0, 0);

      // Rotate Earth
      if (meshRef.current) {
        meshRef.current.rotation.y += delta * timeScale * 0.5;
      }

    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Earth sphere with textures */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_VISUAL_RADIUS * 3, 64, 64]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          specularMap={specularMap}
          shininess={100}
          emissive={new THREE.Color(0x111111)}
        />
      </mesh>


      {/* Longitude lines */}
      <LongitudeLines earthRadius={EARTH_VISUAL_RADIUS * 3} />

      {/* Latitude lines */}
      <LatitudeLines earthRadius={EARTH_VISUAL_RADIUS * 3} />

      {/* Impact location marker */}
      {impactPosition && (
        <ImpactMarker
          position={impactPosition}
          earthRadius={EARTH_VISUAL_RADIUS * 3}
        />
      )}
    </group>
  );
}

// Longitude lines component
function LongitudeLines({ earthRadius }: { earthRadius: number }) {
  const lines = [];

  // Create longitude lines (meridians) every 30 degrees
  for (let lon = 0; lon < 360; lon += 30) {
    const points = [];
    for (let lat = -90; lat <= 90; lat += 5) {
      const phi = (lat * Math.PI) / 180;
      const theta = (lon * Math.PI) / 180;
      const x = earthRadius * Math.cos(phi) * Math.cos(theta);
      const y = earthRadius * Math.sin(phi);
      const z = earthRadius * Math.cos(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }

    lines.push(
      <line key={lon}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FF8C00" linewidth={1} />
      </line>
    );
  }

  return <group>{lines}</group>;
}

// Latitude lines component
function LatitudeLines({ earthRadius }: { earthRadius: number }) {
  const lines = [];

  // Create latitude lines (parallels) every 30 degrees
  for (let lat = -60; lat <= 60; lat += 30) {
    const points = [];
    for (let lon = 0; lon <= 360; lon += 5) {
      const phi = (lat * Math.PI) / 180;
      const theta = (lon * Math.PI) / 180;
      const x = earthRadius * Math.cos(phi) * Math.cos(theta);
      const y = earthRadius * Math.sin(phi);
      const z = earthRadius * Math.cos(phi) * Math.sin(theta);
      points.push(new THREE.Vector3(x, y, z));
    }

    lines.push(
      <line key={lat}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#FF8C00" linewidth={1} />
      </line>
    );
  }

  return <group>{lines}</group>;
}

// Impact marker component
function ImpactMarker({
  position,
  earthRadius
}: {
  position: THREE.Vector3;
  earthRadius: number;
}) {
  // Convert impact position to spherical coordinates
  const normalizedPos = position.clone().normalize();
  const lat = Math.asin(normalizedPos.y) * 180 / Math.PI;
  const lon = Math.atan2(normalizedPos.z, normalizedPos.x) * 180 / Math.PI;

  // Convert to 3D position on Earth surface
  const phi = (lat * Math.PI) / 180;
  const theta = (lon * Math.PI) / 180;
  const x = earthRadius * Math.cos(phi) * Math.cos(theta);
  const y = earthRadius * Math.sin(phi);
  const z = earthRadius * Math.cos(phi) * Math.sin(theta);

  return (
    <group position={[x, y, z]}>
      {/* Impact crater */}
      <mesh>
        <sphereGeometry args={[earthRadius * 0.05, 16, 16]} />
        <meshStandardMaterial
          color="red"
          emissive="red"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Impact explosion effect */}
      <mesh>
        <sphereGeometry args={[earthRadius * 0.08, 16, 16]} />
        <meshStandardMaterial
          color="orange"
          emissive="orange"
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Impact shockwave */}
      <mesh>
        <sphereGeometry args={[earthRadius * 0.12, 16, 16]} />
        <meshStandardMaterial
          color="yellow"
          emissive="yellow"
          emissiveIntensity={0.2}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

// Path to Impact component
function PathToImpact({
  orbitalData,
  collisionOrbit,
  simulationTime,
  impactPosition
}: {
  orbitalData: AsteroidOrbitalData;
  collisionOrbit: CollisionOrbit | null;
  simulationTime: number;
  impactPosition?: THREE.Vector3 | null;
}) {
  const [lineGeometry, setLineGeometry] = useState<THREE.BufferGeometry | null>(null);

  useFrame(() => {
    if (impactPosition) {
      let asteroidPosition: THREE.Vector3;

      if (collisionOrbit) {
        // Use collision orbit position
        asteroidPosition = getCollisionOrbitPosition(collisionOrbit, simulationTime);
      } else {
        // Use normal orbit position
        const [x, y, z] = getAsteroidPosition(simulationTime, orbitalData);
        asteroidPosition = new THREE.Vector3(x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS);
      }

      // Get Earth's position
      const [earthX, earthY, earthZ] = getEarthPosition(simulationTime);
      const earthPosition = new THREE.Vector3(earthX * AU_TO_UNITS, earthY * AU_TO_UNITS, earthZ * AU_TO_UNITS);

      // Calculate positions relative to Earth (Earth is at origin in mini view)
      const asteroidRelativePos = asteroidPosition.clone().sub(earthPosition).multiplyScalar(0.3);
      const impactRelativePos = impactPosition.clone().sub(earthPosition).multiplyScalar(0.3);

      // Create curved trajectory points that curve toward the specific impact location
      const points: THREE.Vector3[] = [];
      const numPoints = 50; // Number of points for smooth curve

      // Calculate time to impact
      // Calculate time to impact
      // let _timeToImpact = 0;
      // if (collisionOrbit) {
      //   _timeToImpact = collisionOrbit.collisionTime - simulationTime;
      // } else {
      //   // For normal orbits, estimate time to impact based on distance
      //   const distanceToImpact = asteroidPosition.distanceTo(impactPosition);
      //   _timeToImpact = Math.max(1, distanceToImpact / (AU_TO_UNITS * 0.1)); // Rough estimate
      // }

      // Generate curved trajectory points that bend toward the impact location
      for (let i = 0; i <= numPoints; i++) {
        const progress = i / numPoints;
        // const _t = simulationTime + (timeToImpact * progress);

        // Get the asteroid's natural orbital position at this time
        // let asteroidPositionAtTime: THREE.Vector3;
        // if (collisionOrbit) {
        //   asteroidPositionAtTime = getCollisionOrbitPosition(collisionOrbit, t);
        // } else {
        //   const [x, y, z] = getAsteroidPosition(t, orbitalData);
        //   asteroidPositionAtTime = new THREE.Vector3(x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS);
        // }

        // Calculate the asteroid's position relative to Earth
        // const asteroidRelativePosAtTime = asteroidPositionAtTime.clone().sub(earthPosition);

        // Create a curved path that bends toward the impact location
        // Use a parabolic curve that starts at asteroid and curves toward impact
        const startPoint = asteroidRelativePos.clone();
        const endPoint = impactRelativePos.clone();

        // Create a parabolic curve using quadratic Bezier curve
        // Control point is positioned to create a natural gravitational curve
        const midPoint = startPoint.clone().add(endPoint).multiplyScalar(0.5);

        // Add gravitational bending - the curve should bend toward Earth's center
        const earthCenter = new THREE.Vector3(0, 0, 0); // Earth is at origin in mini view
        const directionToEarth = earthCenter.clone().sub(midPoint).normalize();
        const curveHeight = startPoint.distanceTo(endPoint) * 0.3; // Curve height
        const controlPoint = midPoint.clone().add(directionToEarth.multiplyScalar(curveHeight));

        // Calculate point on the curved trajectory
        const t_curve = progress;
        const point = new THREE.Vector3()
          .addScaledVector(startPoint, (1 - t_curve) * (1 - t_curve))
          .addScaledVector(controlPoint, 2 * (1 - t_curve) * t_curve)
          .addScaledVector(endPoint, t_curve * t_curve);

        points.push(point);
      }

      // Create curved line geometry
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      setLineGeometry(geometry);
    }
  });

  if (!impactPosition || !lineGeometry) return null;

  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
      color: "#FF4444",
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    }))} />
  );
}

// Mini Asteroid component
function MiniAsteroid({
  orbitalData,
  collisionOrbit,
  simulationTime,
  timeScale
}: {
  orbitalData: AsteroidOrbitalData;
  collisionOrbit: CollisionOrbit | null;
  simulationTime: number;
  timeScale: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (groupRef.current) {
      let asteroidPosition: THREE.Vector3;

      if (collisionOrbit) {
        // Use collision orbit position
        asteroidPosition = getCollisionOrbitPosition(collisionOrbit, simulationTime);
      } else {
        // Use normal orbit position
        const [x, y, z] = getAsteroidPosition(simulationTime, orbitalData);
        asteroidPosition = new THREE.Vector3(x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS);
      }

      // Get Earth's position
      const [earthX, earthY, earthZ] = getEarthPosition(simulationTime);
      const earthPosition = new THREE.Vector3(earthX * AU_TO_UNITS, earthY * AU_TO_UNITS, earthZ * AU_TO_UNITS);

      // Position asteroid relative to Earth (Earth is at origin in mini view)
      const relativePosition = asteroidPosition.clone().sub(earthPosition);
      
      // Scale down the distance for better visibility in mini view
      const scaledPosition = relativePosition.multiplyScalar(0.3);
      groupRef.current.position.copy(scaledPosition);

      // Rotate asteroid
      if (meshRef.current) {
        meshRef.current.rotation.y += delta * timeScale * 2;
        meshRef.current.rotation.x += delta * timeScale * 0.5;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_VISUAL_RADIUS * 0.15, 16, 16]} />
        <meshStandardMaterial
          color="#8B4513"
          emissive="#4A2C2A"
          emissiveIntensity={0.1}
        />
      </mesh>
    </group>
  );
}


export function Mini3DView({
  asteroidOrbitalData,
  collisionOrbit,
  simulationTime,
  timeScale,
  isVisible,
  impactPosition,
  resetKey
}: Mini3DViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-5 left-5 z-50 transition-all duration-300 ${isExpanded ? 'w-[50vw] h-[50vh]' : 'w-48 h-36'
      }`}>
      {/* Mini view container */}
      <div className="relative w-full h-full bg-black/80 rounded-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="absolute top-0 right-0 right-0 z-10 bg-black/50 p-2 flex justify-between items-center">

          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant={"secondary"}
            size={"icon"}
          >
            {isExpanded ? <Minimize2Icon /> : <Maximize2Icon />}
          </Button>
        </div>

        {/* 3D Canvas - Focused on Earth and Asteroid */}
      <Canvas
        camera={{ position: [0, 0, 1.5], fov: 40 }}
        className="w-full h-full"
      >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.0} />

          {/* Mini Earth - Centered */}
          <MiniEarth
            simulationTime={simulationTime}
            timeScale={timeScale}
            impactPosition={impactPosition}
            resetKey={resetKey}
          />

          {/* Mini Asteroid */}
          <MiniAsteroid
            orbitalData={asteroidOrbitalData}
            collisionOrbit={collisionOrbit}
            simulationTime={simulationTime}
            timeScale={timeScale}
          />

          {/* Path to Impact */}
          <PathToImpact
            orbitalData={asteroidOrbitalData}
            collisionOrbit={collisionOrbit}
            simulationTime={simulationTime}
            impactPosition={impactPosition}
          />

          {/* Controls - Keep zoomed in on Earth and impact */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            rotateSpeed={0.5}
            zoomSpeed={1.2}
            panSpeed={0.8}
            minDistance={1.2}
            maxDistance={3}
            target={[0, 0, 0]}
          />
        </Canvas>


      </div>
    </div>
  );
}

