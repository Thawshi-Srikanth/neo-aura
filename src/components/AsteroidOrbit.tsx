import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Billboard, Text, useTexture } from "@react-three/drei";
import { VISUAL_SCALE } from "../config/constants";
import { keplerSolve } from "../utils/orbital-calculations";
import type { Asteroid } from "../types/asteroid";
import { useSimulationStore } from "../store/simulationStore";
import { degToRad } from "../utils/units-conversions";

interface AsteroidOrbitProps {
  asteroid: Asteroid;
}

export default function AsteroidOrbit({ asteroid }: AsteroidOrbitProps) {
  const { orbital_data, name, estimated_diameter } = asteroid;
  const a = parseFloat(orbital_data.semi_major_axis);
  const e = parseFloat(orbital_data.eccentricity);

  const inclination = degToRad(parseFloat(orbital_data.inclination));
  const omega = degToRad(parseFloat(orbital_data.perihelion_argument));
  const raan = degToRad(parseFloat(orbital_data.ascending_node_longitude));

  const numPoints = 360;
  const orbitPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < numPoints; i++) {
      const M = (2 * Math.PI * i) / (numPoints - 1);
      const E = keplerSolve(e, M);
      const r = a * (1 - e * Math.cos(E));
      const x = r * (Math.cos(E) - e);
      const y = r * Math.sqrt(1 - e * e) * Math.sin(E);
      points.push(new THREE.Vector3(x, y, 0));
    }
    return points;
  }, [a, e, numPoints]);

  const rotatedPoints = useMemo(() => {
    const rot = new THREE.Euler(raan, inclination, omega, "XYZ");
    return orbitPoints.map((p) =>
      p.clone().applyEuler(rot).multiplyScalar(VISUAL_SCALE)
    );
  }, [orbitPoints, raan, inclination, omega]);

  const asteroidRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.ShaderMaterial>(null);
  const timeInDays = useRef(0);
  const { speed, trailThickness, trailLength } = useSimulationStore();

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(rotatedPoints, true),
    [rotatedPoints]
  );

  useFrame((_, delta) => {
    timeInDays.current += delta * speed;

    const orbitalPeriodInDays = parseFloat(orbital_data.orbital_period);
    const phase = (timeInDays.current / orbitalPeriodInDays) % 1.0;

    if (trailRef.current) {
      trailRef.current.uniforms.phase.value = phase;
    }

    if (asteroidRef.current) {
      const newPosition = curve.getPointAt(phase);
      asteroidRef.current.position.copy(newPosition);
    }
  });

  const radius =
    estimated_diameter.kilometers.estimated_diameter_max / 2 / 1000;

  return (
    <>
      <mesh>
        <tubeGeometry args={[curve, 360, trailThickness, 5, false]} />
        <shaderMaterial
          ref={trailRef}
          key={trailLength} // Recreate shader material when trailLength changes
          args={[
            {
              uniforms: {
                phase: { value: 0.0 },
                trailLength: { value: trailLength },
              },
              vertexShader: `
                varying vec2 vUv;
                void main() {
                  vUv = uv;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `,
              fragmentShader: `
                uniform float phase;
                uniform float trailLength;
                varying vec2 vUv;

                void main() {
                  float distance = vUv.x - phase;

                  if (distance > 0.0) {
                    distance -= 1.0;
                  }

                  if (distance > 0.0 || distance < -trailLength) {
                    discard;
                  }

                  float opacity = 1.0 + distance / trailLength;
                  gl_FragColor = vec4(1.0, 1.0, 0.0, opacity);
                }
              `,
              transparent: true,
            },
          ]}
        />
      </mesh>
      <group ref={asteroidRef}>
        <Billboard>
          <sprite scale={[0.05, 0.05, 1]}>
            <spriteMaterial
              map={useTexture("/assets/meteor.png")}
              transparent
            />
          </sprite>
          <Text
            position={[0, radius * VISUAL_SCALE + 0.01, 0]}
            fontSize={0.03}
            color="white"
            anchorX="center"
            anchorY="bottom"
          >
            {name}
          </Text>
        </Billboard>
      </group>
    </>
  );
}
