import React, { useRef, useMemo, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import type { Asteroid } from "../../types/asteroid";

interface PerformanceOptimizedNEOSystemProps {
  asteroids: Asteroid[];
  currentTime: number;
  showTrails?: boolean;
  showNEOs?: boolean;
  neoColor?: string;
  neoSize?: number;
  blinkSpeed?: number;
  trailColor?: string;
  trailLength?: number;
  trailOpacity?: number;
  pointsPerTrail?: number;
  lodDistance?: number;
  maxRenderDistance?: number;
  onNEOClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
  selectedNEOId?: string | null;
}

// Level of Detail (LOD) configurations
const LOD_LEVELS = {
  HIGH: { neoGeometry: [0.005, 16, 16], trailPoints: 50, updateFreq: 1 },
  MEDIUM: { neoGeometry: [0.004, 8, 8], trailPoints: 25, updateFreq: 2 },
  LOW: { neoGeometry: [0.003, 4, 4], trailPoints: 10, updateFreq: 4 },
} as const;

const PerformanceOptimizedNEOSystem: React.FC<
  PerformanceOptimizedNEOSystemProps
> = ({
  asteroids,
  currentTime,
  showTrails = true,
  showNEOs = true,
  neoColor = "#ffff00",
  neoSize = 0.005,

  trailColor = "#61FAFA",
  trailLength = 100,
  trailOpacity = 0.6,
  pointsPerTrail = 50,
  lodDistance = 5.0,
  maxRenderDistance = 20.0,
  onNEOClick,
  selectedNEOId,
}) => {
  const { camera } = useThree();

  // Refs for different LOD groups
  const highLODGroupRef = useRef<THREE.Group>(null);
  const mediumLODGroupRef = useRef<THREE.Group>(null);
  const lowLODGroupRef = useRef<THREE.Group>(null);

  // Instanced meshes for different LOD levels
  const highLODInstancedRef = useRef<THREE.InstancedMesh>(null);
  const mediumLODInstancedRef = useRef<THREE.InstancedMesh>(null);
  const lowLODInstancedRef = useRef<THREE.InstancedMesh>(null);

  // Frame counter for update frequency control
  const frameCountRef = useRef(0);

  // Asteroid data organized by LOD
  const asteroidLODDataRef = useRef<{
    validAsteroids: Asteroid[];
    highLOD: { indices: number[]; positions: Float32Array };
    mediumLOD: { indices: number[]; positions: Float32Array };
    lowLOD: { indices: number[]; positions: Float32Array };
    trailGeometries: THREE.BufferGeometry[];
    trailMaterials: THREE.LineBasicMaterial[];
  }>({
    validAsteroids: [],
    highLOD: { indices: [], positions: new Float32Array(0) },
    mediumLOD: { indices: [], positions: new Float32Array(0) },
    lowLOD: { indices: [], positions: new Float32Array(0) },
    trailGeometries: [],
    trailMaterials: [],
  });

  // Initialize valid asteroids
  useEffect(() => {
    const validAsteroids = asteroids.filter(
      (asteroid) =>
        asteroid.orbital_data &&
        asteroid.orbital_data.semi_major_axis &&
        asteroid.orbital_data.eccentricity &&
        asteroid.orbital_data.inclination &&
        asteroid.orbital_data.mean_motion
    );

    // Clean up existing geometries and materials
    asteroidLODDataRef.current.trailGeometries.forEach((geo) => geo.dispose());
    asteroidLODDataRef.current.trailMaterials.forEach((mat) => mat.dispose());

    // Initialize trail geometries and materials
    const trailGeometries: THREE.BufferGeometry[] = [];
    const trailMaterials: THREE.LineBasicMaterial[] = [];

    if (showTrails) {
      validAsteroids.forEach(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(pointsPerTrail * 3);
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
        );

        const material = new THREE.LineBasicMaterial({
          color: trailColor,
          transparent: true,
          opacity: trailOpacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        trailGeometries.push(geometry);
        trailMaterials.push(material);
      });
    }

    asteroidLODDataRef.current = {
      validAsteroids,
      highLOD: {
        indices: [],
        positions: new Float32Array(validAsteroids.length * 3),
      },
      mediumLOD: {
        indices: [],
        positions: new Float32Array(validAsteroids.length * 3),
      },
      lowLOD: {
        indices: [],
        positions: new Float32Array(validAsteroids.length * 3),
      },
      trailGeometries,
      trailMaterials,
    };

    return () => {
      trailGeometries.forEach((geo) => geo.dispose());
      trailMaterials.forEach((mat) => mat.dispose());
    };
  }, [asteroids, showTrails, trailColor, trailOpacity, pointsPerTrail]);

  // Geometries and materials for different LOD levels
  const lodGeometries = useMemo(
    () => ({
      high: new THREE.SphereGeometry(...LOD_LEVELS.HIGH.neoGeometry),
      medium: new THREE.SphereGeometry(...LOD_LEVELS.MEDIUM.neoGeometry),
      low: new THREE.SphereGeometry(...LOD_LEVELS.LOW.neoGeometry),
    }),
    []
  );

  // Create materials that support blinking via opacity updates
  const lodMaterials = useMemo(() => {
    const createMaterial = () =>
      new THREE.MeshBasicMaterial({
        color: neoColor,
        transparent: true,
        opacity: 1.0,
      });

    return {
      high: createMaterial(),
      medium: createMaterial(),
      low: createMaterial(),
    };
  }, [neoColor]);

  // Dummy object for matrix calculations
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update LOD assignments and positions
  useFrame((_state) => {
    frameCountRef.current++;

    const { validAsteroids, highLOD, mediumLOD, lowLOD, trailGeometries } =
      asteroidLODDataRef.current;
    if (!validAsteroids.length) return;

    const cameraPos = camera.position;
    const scale = 0.1;

    // Reset LOD arrays
    highLOD.indices = [];
    mediumLOD.indices = [];
    lowLOD.indices = [];

    // Calculate positions and assign LOD levels
    validAsteroids.forEach((asteroid, index) => {
      try {
        // Calculate position using accurate orbital mechanics
        const [x, y, z] = getAsteroidPosition(
          currentTime,
          asteroid.orbital_data
        );
        const worldPos = new THREE.Vector3(x * scale, z * scale, y * scale);

        // Store position
        const i3 = index * 3;
        highLOD.positions[i3] = worldPos.x;
        highLOD.positions[i3 + 1] = worldPos.y;
        highLOD.positions[i3 + 2] = worldPos.z;

        // Calculate distance from camera
        const distance = cameraPos.distanceTo(worldPos);

        // Skip if too far away
        if (distance > maxRenderDistance) return;

        // Assign LOD level based on distance
        if (distance < lodDistance) {
          highLOD.indices.push(index);
        } else if (distance < lodDistance * 2) {
          mediumLOD.indices.push(index);
        } else {
          lowLOD.indices.push(index);
        }

        // Update trails (only for high and medium LOD, and at reduced frequency)
        if (showTrails && distance < lodDistance * 2) {
          const updateFreq =
            distance < lodDistance
              ? LOD_LEVELS.HIGH.updateFreq
              : LOD_LEVELS.MEDIUM.updateFreq;

          if (frameCountRef.current % updateFreq === 0) {
            const geometry = trailGeometries[index];
            if (geometry) {
              const positionAttribute = geometry.getAttribute(
                "position"
              ) as THREE.BufferAttribute;
              const positions = positionAttribute.array as Float32Array;
              const trailPointCount =
                distance < lodDistance
                  ? pointsPerTrail
                  : Math.floor(pointsPerTrail / 2);

              for (let i = 0; i < trailPointCount; i++) {
                const timeOffset = (i / trailPointCount) * trailLength;
                const trailTime = currentTime - timeOffset;
                const [tx, ty, tz] = getAsteroidPosition(
                  trailTime,
                  asteroid.orbital_data
                );

                const trailIndex = i * 3;
                positions[trailIndex] = tx * scale;
                positions[trailIndex + 1] = tz * scale;
                positions[trailIndex + 2] = ty * scale;
              }

              positionAttribute.needsUpdate = true;
              geometry.computeBoundingSphere();
            }
          }
        }
      } catch (error) {
        console.warn(`Error updating ${asteroid.name}:`, error);
      }
    });

    // Update instanced meshes for each LOD level (without per-instance blinking for now)
    updateInstancedMesh(highLODInstancedRef.current, highLOD, validAsteroids);
    updateInstancedMesh(
      mediumLODInstancedRef.current,
      mediumLOD,
      validAsteroids
    );
    updateInstancedMesh(lowLODInstancedRef.current, lowLOD, validAsteroids);
  });

  // Helper function to update instanced mesh
  const updateInstancedMesh = useCallback(
    (
      instancedMesh: THREE.InstancedMesh | null,
      lodData: { indices: number[]; positions: Float32Array },
      asteroids: Asteroid[]
    ) => {
      if (!instancedMesh || !lodData.indices.length) return;

      lodData.indices.forEach((asteroidIndex, instanceIndex) => {
        const asteroid = asteroids[asteroidIndex];
        const isSelected = selectedNEOId === asteroid.id;
        const i3 = asteroidIndex * 3;

        // Set position
        dummy.position.set(
          lodData.positions[i3],
          lodData.positions[i3 + 1],
          lodData.positions[i3 + 2]
        );

        // Set scale based on selection
        const scale = isSelected ? neoSize * 1.5 : neoSize;
        dummy.scale.setScalar(scale);

        // Update matrix
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(instanceIndex, dummy.matrix);

        // Set color (selected NEOs get orange color)
        const color = new THREE.Color(isSelected ? "#ff6600" : neoColor);
        instancedMesh.setColorAt(instanceIndex, color);
      });

      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
      }
    },
    [dummy, selectedNEOId, neoSize, neoColor]
  );

  // Handle clicks
  const handleClick = useCallback(
    (event: any, lodLevel: string) => {
      if (!onNEOClick) return;

      const instanceId = event.instanceId;
      if (instanceId === undefined) return;

      const { validAsteroids, highLOD, mediumLOD, lowLOD } =
        asteroidLODDataRef.current;
      let asteroidIndex: number;

      switch (lodLevel) {
        case "high":
          asteroidIndex = highLOD.indices[instanceId];
          break;
        case "medium":
          asteroidIndex = mediumLOD.indices[instanceId];
          break;
        case "low":
          asteroidIndex = lowLOD.indices[instanceId];
          break;
        default:
          return;
      }

      if (
        asteroidIndex !== undefined &&
        asteroidIndex < validAsteroids.length
      ) {
        const asteroid = validAsteroids[asteroidIndex];
        const i3 = asteroidIndex * 3;
        const position: [number, number, number] = [
          highLOD.positions[i3],
          highLOD.positions[i3 + 1],
          highLOD.positions[i3 + 2],
        ];
        onNEOClick(asteroid, position);
      }
    },
    [onNEOClick]
  );

  if (!showNEOs && !showTrails) return null;

  const {
    validAsteroids,
    highLOD,
    mediumLOD,
    lowLOD,
    trailGeometries,
    trailMaterials,
  } = asteroidLODDataRef.current;

  return (
    <group>
      {/* High LOD Group */}
      <group ref={highLODGroupRef}>
        {showNEOs && (
          <instancedMesh
            ref={highLODInstancedRef}
            args={[
              lodGeometries.high,
              lodMaterials.high,
              highLOD.indices.length || 1,
            ]}
            onClick={(e) => handleClick(e, "high")}
          />
        )}
      </group>

      {/* Medium LOD Group */}
      <group ref={mediumLODGroupRef}>
        {showNEOs && (
          <instancedMesh
            ref={mediumLODInstancedRef}
            args={[
              lodGeometries.medium,
              lodMaterials.medium,
              mediumLOD.indices.length || 1,
            ]}
            onClick={(e) => handleClick(e, "medium")}
          />
        )}
      </group>

      {/* Low LOD Group */}
      <group ref={lowLODGroupRef}>
        {showNEOs && (
          <instancedMesh
            ref={lowLODInstancedRef}
            args={[
              lodGeometries.low,
              lodMaterials.low,
              lowLOD.indices.length || 1,
            ]}
            onClick={(e) => handleClick(e, "low")}
          />
        )}
      </group>

      {/* Trails */}
      {showTrails && (
        <group>
          {validAsteroids.map((asteroid, index) => {
            const geometry = trailGeometries[index];
            const material = trailMaterials[index];

            if (!geometry || !material) return null;

            return (
              <primitive
                key={asteroid.id}
                object={new THREE.Line(geometry, material)}
              />
            );
          })}
        </group>
      )}
    </group>
  );
};

export default PerformanceOptimizedNEOSystem;
