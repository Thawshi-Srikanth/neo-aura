/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useRef, useMemo } from "react";
import { extend, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";

interface OrbitTrailProps {
  points: THREE.Vector3[];
  orbitalPeriodInDays: number;
  trailLength: number;
  color: string;
  speed: number;
  trailThickness?: number; // New prop
}

// Shader Material for fading trail
const OrbitTrailShader = shaderMaterial(
  {
    phase: 0.0,
    trailLength: 0.15,
    color: new THREE.Color("#FFFF00"),
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
  `
    uniform float phase;
    uniform float trailLength;
    uniform vec3 color;
    varying vec2 vUv;

    void main() {
      float distance = vUv.x - phase;
      if (distance > 0.0) distance -= 1.0;

      if(distance < -trailLength || distance > 0.0) discard;

      float opacity = 1.0 + distance / trailLength;
      gl_FragColor = vec4(color, opacity * opacity);
    }
  `
);

extend({ OrbitTrailShader });

export default function OrbitTrail({
  points,
  orbitalPeriodInDays,
  trailLength,
  color,
  speed,
  trailThickness = 0.01, // default radius
}: OrbitTrailProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points, true),
    [points]
  );
  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 180, trailThickness, 8, true),
    [curve, trailThickness]
  );

  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    phaseRef.current += (delta * speed) / orbitalPeriodInDays;
    phaseRef.current %= 1.0;
    if (materialRef.current) {
      materialRef.current.uniforms.phase.value = phaseRef.current;
      materialRef.current.uniforms.trailLength.value = trailLength;
      materialRef.current.uniforms.color.value = new THREE.Color(color);
    }
  });

  return (
    <mesh geometry={tubeGeometry}>
      {/* @ts-expect-error */}
      <orbitTrailShader
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
