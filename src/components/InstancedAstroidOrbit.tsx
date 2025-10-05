import { useRef, useMemo, useState } from "react";
import { useFrame, useThree, extend } from "@react-three/fiber";
import * as THREE from "three";
import { Text, useTexture, shaderMaterial, Billboard } from "@react-three/drei";
import { SCALE, AU_IN_KM, DAYS_PER_SECOND } from "../config/constants";
import { keplerSolve } from "../utils/orbital-calculations";
import type { Asteroid } from "../types/asteroid";
import { useSimulationStore } from "../store/simulationStore";
import React from "react";
import OrbitTrail from "./OrbitTrail";
import { degToRad } from "../utils/units-conversions";

// Constants
const DISTANCE_THRESHOLD = 3; // Distance to show labels
const ORBIT_POINTS = 180;
const LABEL_POOL_SIZE = 5; // Max number of labels visible at once

// Shader Material for the trail effect
const TrailMaterial = shaderMaterial(
  {
    phase: 0.0,
    trailLength: 0.15, // Default value
    color: new THREE.Color("#FFFF00"),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float phase;
    uniform float trailLength;
    uniform vec3 color;
    varying vec2 vUv;

    void main() {
      float distance = vUv.x - phase;
      if (distance > 0.0) {
        distance -= 1.0; // Wrap around for closed loop
      }

      if (distance < -trailLength || distance > 0.0) {
        discard;
      }

      float opacity = 1.0 + distance / trailLength;
      gl_FragColor = vec4(color, opacity * opacity);
    }
  `
);

extend({ TrailMaterial });

// Types
interface AsteroidData {
  name: string;
  orbitalPeriodInDays: number;
  points: THREE.Vector3[];
  curve: THREE.CatmullRomCurve3;
  trailMaterial: React.RefObject<THREE.ShaderMaterial | null>;
  position: THREE.Vector3;
}
interface VisibleAsteroid {
  name: string;
  position: THREE.Vector3;
}
interface InstancedAsteroidOrbitProps {
  asteroids: Asteroid[];
}

export default function InstancedAsteroidOrbit({
  asteroids,
}: InstancedAsteroidOrbitProps) {
  const timeRef = useRef(0);
  const instancesRef = useRef<THREE.InstancedMesh>(null!);

  const { speed, trailThickness, trailLength } = useSimulationStore();
  const [visibleAsteroids, setVisibleAsteroids] = useState<VisibleAsteroid[]>(
    []
  );
  const asteroidData = useMemo((): AsteroidData[] => {
    return asteroids.map((asteroid) => {
      const { orbital_data, name } = asteroid;
      const a =
        Number.parseFloat(orbital_data.semi_major_axis) * AU_IN_KM * SCALE;
      const e = Number.parseFloat(orbital_data.eccentricity);

      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= ORBIT_POINTS; i++) {
        const M = (2 * Math.PI * i) / ORBIT_POINTS;
        const E = keplerSolve(e, M);
        const r = a * (1 - e * Math.cos(E));
        points.push(
          new THREE.Vector3(
            r * (Math.cos(E) - e),
            r * Math.sqrt(1 - e * e) * Math.sin(E),
            0
          )
        );
      }

      const rotation = new THREE.Euler(
        degToRad(Number.parseFloat(orbital_data.inclination)),
        degToRad(Number.parseFloat(orbital_data.ascending_node_longitude)),
        degToRad(Number.parseFloat(orbital_data.perihelion_argument)),
        "YXZ"
      );

      const transformedPoints = points.map((p) =>
        p.clone().applyEuler(rotation)
      );
      const curve = new THREE.CatmullRomCurve3(transformedPoints, true);

      return {
        name,
        points: transformedPoints,
        curve,
        orbitalPeriodInDays: Number.parseFloat(orbital_data.orbital_period),
        trailMaterial: React.createRef<THREE.ShaderMaterial>(),
        position: new THREE.Vector3(),
      };
    });
  }, [asteroids]);

  const { camera } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    timeRef.current += delta * speed * DAYS_PER_SECOND;
    const newVisibleAsteroids: VisibleAsteroid[] = [];

    // Update all asteroid positions and identify visible ones in a single loop
    asteroidData.forEach((data, i) => {
      const phase = (timeRef.current / data.orbitalPeriodInDays) % 1.0;
      data.curve.getPointAt(phase, data.position);

      if (data.trailMaterial.current) {
        data.trailMaterial.current.uniforms.phase.value = phase;
        data.trailMaterial.current.uniforms.trailLength.value = trailLength;
      }

      dummy.position.copy(data.position);
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.set(0.05, 0.05, 0.05);
      dummy.updateMatrix();
      instancesRef.current.setMatrixAt(i, dummy.matrix);

      if (camera.position.distanceTo(data.position) < DISTANCE_THRESHOLD) {
        if (newVisibleAsteroids.length < LABEL_POOL_SIZE) {
          // Clone the position to avoid mutation issues with state
          newVisibleAsteroids.push({
            name: data.name,
            position: data.position.clone(),
          });
        }
      }
    });

    instancesRef.current.instanceMatrix.needsUpdate = true;
    setVisibleAsteroids(newVisibleAsteroids);
  });

  const meteorTexture = useTexture("/assets/meteor.png");

  return (
    <>
      {/* {asteroidData.map((data) => {
        const tubeCurve = new THREE.CatmullRomCurve3(data.points, true);
        return (
          <group key={data.name}>
            <lineLoop>
                            <bufferGeometry>
                                <bufferAttribute
                                    attach="attributes-position"
                                    args={[new Float32Array(data.points.flatMap(p => p.toArray())), 3]}
                                />
                            </bufferGeometry>
                            <lineBasicMaterial color="#ddd" transparent opacity={0.3} />
                        </lineLoop>
            <mesh>
              <tubeGeometry
                args={[tubeCurve, ORBIT_POINTS, trailThickness, 8, true]}
              />
              @ts-expect-error
              <trailMaterial
                ref={data.trailMaterial}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        );
      })} */}

      {asteroidData.map((data) => (
        <OrbitTrail
          key={data.name}
          points={data.points}
          orbitalPeriodInDays={data.orbitalPeriodInDays}
          trailLength={trailLength}
          color="#FFFF00"
          speed={speed}
          trailThickness={trailThickness}
        />
      ))}

      {visibleAsteroids.map((asteroid) => (
        <Billboard key={asteroid.name} position={asteroid.position}>
          <Text fontSize={0.03} color="white" anchorX="center" anchorY="bottom">
            {asteroid.name}
          </Text>
        </Billboard>
      ))}

      {/* astroid orbit */}

      <instancedMesh
        ref={instancesRef}
        args={[undefined, undefined, asteroids.length]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={meteorTexture}
          transparent
          depthWrite={false}
          alphaTest={0.1}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </>
  );
}
