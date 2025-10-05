import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { findAllOrbitalIntersections } from "../../utils/orbitalCollision";

interface IntersectionPointsProps {
  asteroidOrbitalData: unknown;
  maxSearchDays?: number;
  isVisible?: boolean;
}

export const IntersectionPoints = forwardRef<THREE.Group, IntersectionPointsProps>(
  ({ asteroidOrbitalData, maxSearchDays = 365 * 2, isVisible = true }, ref) => {
    const groupRef = useRef<THREE.Group>(null!);
    const intersectionPoints = useRef<THREE.Mesh[]>([]);
    const intersections = useRef<Array<{ collisionTime: number; collisionPosition: THREE.Vector3; distance: number }>>([]);

    useImperativeHandle(ref, () => groupRef.current);

    // Calculate intersections when orbital data changes
    useEffect(() => {
      if (!asteroidOrbitalData) return;

      const newIntersections = findAllOrbitalIntersections(asteroidOrbitalData, maxSearchDays);
      intersections.current = newIntersections;

      // Clear existing intersection points
      intersectionPoints.current.forEach(point => {
        if (point.parent) {
          point.parent.remove(point);
        }
      });
      intersectionPoints.current = [];

      // Create visual markers for each intersection
      newIntersections.forEach((intersection, index) => {
        const geometry = new THREE.SphereGeometry(0.01, 8, 8);
        const material = new THREE.MeshBasicMaterial({
          color: intersection.distance < 0.001 ? "#ff0000" : "#ffff00", // Red for very close, yellow for close
          transparent: true,
          opacity: 0.8
        });
        
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(intersection.collisionPosition);
        
        // Add pulsing animation
        marker.userData = {
          originalScale: 1,
          pulseSpeed: 0.02 + (index * 0.005), // Different pulse speeds for each marker
          time: 0
        };
        
        groupRef.current.add(marker);
        intersectionPoints.current.push(marker);
      });
    }, [asteroidOrbitalData, maxSearchDays]);

    // Animate intersection points
    useFrame((_, delta) => {
      if (!isVisible || !groupRef.current) return;

      intersectionPoints.current.forEach(point => {
        if (point.userData) {
          point.userData.time += delta;
          const scale = point.userData.originalScale + Math.sin(point.userData.time * point.userData.pulseSpeed) * 0.3;
          point.scale.setScalar(scale);
        }
      });
    });

    if (!isVisible) return null;

    return (
      <group ref={groupRef}>
        {/* Intersection point labels */}
        {intersections.current.map((intersection, index) => (
          <IntersectionLabel
            key={index}
            position={intersection.collisionPosition}
            time={intersection.collisionTime}
            distance={intersection.distance}
          />
        ))}
      </group>
    );
  }
);

IntersectionPoints.displayName = "IntersectionPoints";

// Component for intersection point labels
interface IntersectionLabelProps {
  position: THREE.Vector3;
  time: number;
  distance: number;
}

function IntersectionLabel({ position, time, distance }: IntersectionLabelProps) {
  const labelRef = useRef<THREE.Sprite>(null!);

  useFrame(() => {
    if (labelRef.current) {
      // Make label face camera
      labelRef.current.lookAt(0, 0, 0); // Look at origin (camera position)
    }
  });

  return (
    <sprite ref={labelRef} position={position}>
      <spriteMaterial
        map={createTextTexture(
          `T+${time.toFixed(1)}d\n${(distance * 149.6).toFixed(2)}M km`,
          distance < 0.001 ? "#ff0000" : "#ffff00"
        )}
        transparent
        opacity={0.9}
      />
    </sprite>
  );
}

// Helper function to create text texture
function createTextTexture(text: string, color: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  
  canvas.width = 256;
  canvas.height = 128;
  
  context.fillStyle = 'rgba(0, 0, 0, 0.8)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  context.fillStyle = color;
  context.font = '16px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  const lines = text.split('\n');
  const lineHeight = 20;
  const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
  
  lines.forEach((line, index) => {
    context.fillText(line, canvas.width / 2, startY + index * lineHeight);
  });
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
