import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TrajectoryTrailProps {
  asteroidRef: React.RefObject<THREE.Mesh>;
  isActive: boolean;
  originPosition?: THREE.Vector3 | null;
  maxPoints?: number;
  finalPoint?: THREE.Vector3;
}

export function TrajectoryTrail({ 
  asteroidRef, 
  isActive,
  originPosition = null,
  maxPoints = 500,
  finalPoint,
}: TrajectoryTrailProps) {
  const lineRef = useRef<THREE.Line>(null!);
  const geometryRef = useRef<THREE.BufferGeometry>(null!);
  const positionsRef = useRef<Float32Array>(new Float32Array(maxPoints * 3));
  const countRef = useRef<number>(0);
  const lastElapsedRef = useRef<number>(0);
  const initializedRef = useRef<boolean>(false);

  // Reallocate buffer when maxPoints changes
  useEffect(() => {
    positionsRef.current = new Float32Array(maxPoints * 3);
    if (geometryRef.current) {
      geometryRef.current.dispose();
    }
    geometryRef.current = new THREE.BufferGeometry();
    geometryRef.current.setAttribute(
      "position",
      new THREE.BufferAttribute(positionsRef.current, 3)
    );
    geometryRef.current.setDrawRange(0, 0);
    if (lineRef.current) {
      lineRef.current.geometry = geometryRef.current;
    }
    countRef.current = 0;
    initializedRef.current = false;
  }, [maxPoints]);

  // Initialize with origin when activated
  useEffect(() => {
    if (isActive && originPosition && geometryRef.current) {
      positionsRef.current[0] = originPosition.x;
      positionsRef.current[1] = originPosition.y;
      positionsRef.current[2] = originPosition.z;
      countRef.current = 1;
      geometryRef.current.setDrawRange(0, countRef.current);
      const posAttr = geometryRef.current.getAttribute("position");
      posAttr.needsUpdate = true;
      initializedRef.current = true;
    }
  }, [isActive, originPosition]);

  useFrame((_, delta) => {
    if (!asteroidRef.current || !geometryRef.current || !isActive) return;
    lastElapsedRef.current += delta;
    if (lastElapsedRef.current < 0.03) return;
    lastElapsedRef.current = 0;

    const currentPos = asteroidRef.current.position;

    // Add point only if moved enough
    if (countRef.current === 0 ||
        Math.hypot(
          currentPos.x - positionsRef.current[(countRef.current - 1) * 3],
          currentPos.y - positionsRef.current[(countRef.current - 1) * 3 + 1],
          currentPos.z - positionsRef.current[(countRef.current - 1) * 3 + 2]
        ) > 0.01) {
      if (countRef.current < maxPoints) {
        const i = countRef.current * 3;
        positionsRef.current[i] = currentPos.x;
        positionsRef.current[i + 1] = currentPos.y;
        positionsRef.current[i + 2] = currentPos.z;
        countRef.current += 1;
      } else {
        // Shift left by one point (3 floats)
        positionsRef.current.copyWithin(0, 3);
        const i = (maxPoints - 1) * 3;
        positionsRef.current[i] = currentPos.x;
        positionsRef.current[i + 1] = currentPos.y;
        positionsRef.current[i + 2] = currentPos.z;
      }

      const posAttr = geometryRef.current.getAttribute("position");
      // @ts-expect-error - Direct array assignment for performance
      posAttr.array = positionsRef.current;
      posAttr.needsUpdate = true;
      geometryRef.current.setDrawRange(0, Math.min(countRef.current, maxPoints));
    }
  });

  // When we receive a final impact point, append it and update geometry once
  useEffect(() => {
    if (finalPoint && geometryRef.current && countRef.current > 0) {
      const lastX = positionsRef.current[(countRef.current - 1) * 3];
      const lastY = positionsRef.current[(countRef.current - 1) * 3 + 1];
      const lastZ = positionsRef.current[(countRef.current - 1) * 3 + 2];
      if (Math.hypot(finalPoint.x - lastX, finalPoint.y - lastY, finalPoint.z - lastZ) > 0.001) {
        if (countRef.current < maxPoints) {
          const i = countRef.current * 3;
          positionsRef.current[i] = finalPoint.x;
          positionsRef.current[i + 1] = finalPoint.y;
          positionsRef.current[i + 2] = finalPoint.z;
          countRef.current += 1;
        } else {
          positionsRef.current.copyWithin(0, 3);
          const i = (maxPoints - 1) * 3;
          positionsRef.current[i] = finalPoint.x;
          positionsRef.current[i + 1] = finalPoint.y;
          positionsRef.current[i + 2] = finalPoint.z;
        }
        const posAttr = geometryRef.current.getAttribute("position");
        // @ts-expect-error - Direct array assignment for performance
        posAttr.array = positionsRef.current;
        posAttr.needsUpdate = true;
        geometryRef.current.setDrawRange(0, Math.min(countRef.current, maxPoints));
      }
    }
  }, [finalPoint, maxPoints]);

  return (
    <line ref={lineRef as any}>
      {/* geometry is set imperatively */}
      <bufferGeometry ref={geometryRef as any} />
      <lineBasicMaterial 
        color="#ff3300" 
        linewidth={3}
        transparent
        opacity={0.9}
      />
    </line>
  );
}

