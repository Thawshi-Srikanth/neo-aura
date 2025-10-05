import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EARTH_VISUAL_RADIUS } from "../../config/constants";

interface PlannedTrajectoryPathProps {
  start: THREE.Vector3;
  earthRef: React.RefObject<THREE.Object3D>;
  offset?: THREE.Vector3;
}

/**
 * Shows a simple straight line from the asteroid's starting position toward Earth
 * This represents the initial "intended" direction before physics takes over
 */
export function PlannedTrajectoryPath({
  start,
  earthRef,
  offset = new THREE.Vector3(),
}: PlannedTrajectoryPathProps) {
  const lineRef = useRef<THREE.Line>(null!);
  const startRef = useRef(start.clone());
  const offsetRef = useRef(offset.clone().multiplyScalar(0.05));

  useFrame(() => {
    if (!earthRef.current || !lineRef.current) return;

    // Get Earth's current position
    const earthPos = new THREE.Vector3();
    earthRef.current.getWorldPosition(earthPos);
    earthPos.add(offsetRef.current);

    // Create a straight line from start to Earth (with slight overshoot to show direction)
    const direction = new THREE.Vector3()
      .subVectors(earthPos, startRef.current)
      .normalize();
    const endPoint = earthPos
      .clone()
      .add(direction.multiplyScalar(EARTH_VISUAL_RADIUS * 0.5));

    // Update line geometry
    const points = [startRef.current, endPoint];
    const geometry = lineRef.current.geometry as THREE.BufferGeometry;
    geometry.setFromPoints(points);
    if (geometry.attributes.position) {
      geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <primitive object={new THREE.Line()} ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial
        color="#00d1ff"
        transparent
        opacity={0.4}
        linewidth={1}
      />
    </primitive>
  );
}
