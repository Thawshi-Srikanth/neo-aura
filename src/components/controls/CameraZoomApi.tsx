import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useCallback, useEffect } from "react";
export interface ZoomApi {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

export default function CameraZoomApi({
  controlsRef,
  target = [0, 0, 0],
  minDistance = 0.1,
  maxDistance = 100,
  scaleStep = 0.85,
  onReady,
}: {
  controlsRef?: React.RefObject<{ object: THREE.Camera; update?: () => void }>;
  target?: [number, number, number] | THREE.Vector3;
  minDistance?: number;
  maxDistance?: number;
  scaleStep?: number;
  onReady?: (api: ZoomApi | null) => void;
}) {
  const { camera } = useThree();

  const getTarget = useCallback((): THREE.Vector3 => {
    if (target instanceof THREE.Vector3) return target;
    return new THREE.Vector3(target[0], target[1], target[2]);
  }, [target]);

  const applyDollyScale = useCallback(
    (scale: number) => {
      const t = getTarget();
      const cam = camera as THREE.PerspectiveCamera;
      const dir = new THREE.Vector3().subVectors(cam.position, t);
      const distance = dir.length();
      if (distance === 0) return;
      dir.normalize();

      const next = THREE.MathUtils.clamp(
        distance * scale,
        minDistance,
        maxDistance
      );
      const newPos = new THREE.Vector3().addVectors(
        t,
        dir.multiplyScalar(next)
      );
      cam.position.copy(newPos);
      cam.updateProjectionMatrix();

      if (controlsRef?.current) {
        controlsRef.current.object.position.copy(newPos);
        controlsRef.current.update?.();
      }
    },
    [camera, controlsRef, getTarget, maxDistance, minDistance]
  );

  const api: ZoomApi = {
    zoomIn: () => applyDollyScale(scaleStep),
    zoomOut: () => applyDollyScale(1 / scaleStep),
    reset: () => {
      const t = getTarget();
      const cam = camera as THREE.PerspectiveCamera;
      const dir = new THREE.Vector3().subVectors(cam.position, t).normalize();
      const newPos = new THREE.Vector3().addVectors(
        t,
        dir.multiplyScalar((minDistance + maxDistance) / 2)
      );
      cam.position.copy(newPos);
      cam.updateProjectionMatrix();
      if (controlsRef?.current) {
        controlsRef.current.object.position.copy(newPos);
        controlsRef.current.update?.();
      }
    },
  };

  useEffect(() => {
    onReady?.(api);
    return () => onReady?.(null);
  }, [api.zoomIn, api.zoomOut, api.reset]);

  return null;
}
