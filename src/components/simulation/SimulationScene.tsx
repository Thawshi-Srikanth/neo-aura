import { Canvas } from "@react-three/fiber";
import { OrbitControls as ThreeOrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { forwardRef, useState } from "react";
import { Earth } from "./Earth";
import { Asteroid } from "./Asteroid";
import { DeflectedAsteroid } from "./DeflectedAsteroid";
import { CollisionAsteroid } from "./CollisionAsteroid";
import { OrbitPath } from "./OrbitPath";
import { DeflectedOrbitPath } from "./DeflectedOrbitPath";
import { EarthOrbitPath } from "./EarthOrbitPath";
import { Sun } from "./Sun";
import { Labels } from "./Labels";
import { OriginMarker } from "./OriginMarker";
import { CollisionOrbitPath } from "./CollisionOrbitPath";
import { IntersectionPoints } from "./IntersectionPoints";
import { CoordinateSystem } from "./CoordinateSystem";
import { Legend } from "./Legend";
import { OrbitLabels } from "./OrbitLabels";
import { SIMULATION_CONSTANTS } from "../../config/simulationConstants";
import { useSettingsStore } from "../../store/settingsStore";
import type { CollisionOrbit } from "../../utils/orbitalCollision";
import type { Asteroid as AsteroidType } from "../../types/asteroid";

interface SimulationSceneProps {
  // Asteroid data
  currentAsteroid: AsteroidType;

  // Simulation state 
  impactPosition: THREE.Vector3 | null;
  impactData: unknown;
  asteroidVisible: boolean;
  simulationRunning: boolean;
  resetKey: number;
  timeScale: number;

  // Display settings
  showOrbits: boolean;
  showIntersections: boolean;
  asteroidSize: number;

  // Dual asteroid system
  showOriginalAsteroid: boolean;
  showCollisionAsteroid: boolean;
  collisionOrbit: CollisionOrbit | null;
  originPosition: THREE.Vector3 | null;
  isImpactTrajectorySet: boolean;

  // Event handlers
  onImpactAnalyzed: (details: { lat: number; lon: number; isLand: boolean }) => void;
  onImpact: (position: THREE.Vector3) => void;
  onCollisionDetected: () => void;

  // Deflection props
  isDeflected?: boolean;
  deflectionResult?: any;

  // Status props for legend
  collisionDetected?: boolean;
  hasImpacted?: boolean;
  isOptimizing?: boolean;

  // Refs
  earthRef: React.RefObject<THREE.Mesh>;
  asteroidRef: React.RefObject<THREE.Mesh>;
  collisionAsteroidRef: React.RefObject<THREE.Mesh>;
  sunRef: React.RefObject<THREE.Mesh>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  controlsRef: React.RefObject<any>;
}

export const SimulationScene = forwardRef<HTMLDivElement, SimulationSceneProps>(({
  currentAsteroid,
  impactPosition,
  asteroidVisible,
  simulationRunning,
  resetKey,
  timeScale,
  showOrbits,
  showIntersections,
  showOriginalAsteroid,
  showCollisionAsteroid,
  collisionOrbit,
  originPosition,
  isImpactTrajectorySet,
  onImpactAnalyzed,
  onImpact,
  onCollisionDetected,
  collisionDetected,
  hasImpacted,
  isOptimizing,
  earthRef,
  asteroidRef,
  collisionAsteroidRef,
  sunRef,
  controlsRef,
  isDeflected,
  deflectionResult,
}, ref) => {
  const { settings } = useSettingsStore();
  const [distance, setDistance] = useState(0);

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        className="w-screen h-screen bg-black"
        camera={{
          position: SIMULATION_CONSTANTS.CAMERA.POSITION,
          fov: settings.cameraFov,
          near: settings.cameraNear,
          far: settings.cameraFar,
        }}
        dpr={[1, Math.min(2, window.devicePixelRatio || 1)]}
      >
        <ambientLight intensity={settings.ambientIntensity} />
        <directionalLight
          position={SIMULATION_CONSTANTS.LIGHTING.DIRECTIONAL_POSITION}
          intensity={settings.directionalIntensity}
        />
        <pointLight
          position={SIMULATION_CONSTANTS.LIGHTING.POINT_POSITION}
          intensity={settings.pointIntensity}
          color={SIMULATION_CONSTANTS.LIGHTING.POINT_COLOR}
        />
        <Stars
          count={settings.starCount}
          fade={SIMULATION_CONSTANTS.STARS.FADE}
          radius={settings.starRadius}
        />
        <ThreeOrbitControls
          ref={controlsRef}
          maxDistance={SIMULATION_CONSTANTS.ORBIT_CONTROLS.MAX_DISTANCE}
          minDistance={SIMULATION_CONSTANTS.ORBIT_CONTROLS.MIN_DISTANCE}
          enablePan
          enableZoom
          enableRotate
          zoomSpeed={SIMULATION_CONSTANTS.ORBIT_CONTROLS.ZOOM_SPEED}
          panSpeed={SIMULATION_CONSTANTS.ORBIT_CONTROLS.PAN_SPEED}
          rotateSpeed={SIMULATION_CONSTANTS.ORBIT_CONTROLS.ROTATE_SPEED}
        />

        {/* Sun positioned at origin (0,0,0) - center of coordinate system */}
        <Sun ref={sunRef} />

        {/* Coordinate System */}
        <CoordinateSystem />

        {/* Earth orbit path */}
        {showOrbits && <EarthOrbitPath />}

        {/* Earth */}
        <Earth
          ref={earthRef}
          key={`earth-${resetKey}`}
          impactPosition={impactPosition}
          onImpactAnalyzed={onImpactAnalyzed}
          simulationRunning={simulationRunning}
          timeScale={timeScale}
          daysPerSecond={1} // This should come from constants
        />

        {/* Original asteroid orbit path */}
        {showOrbits && <OrbitPath orbitalData={currentAsteroid.orbital_data} />}
        
        {/* Deflected asteroid orbit path (if deflection was successful) */}
        {showOrbits && isDeflected && deflectionResult && deflectionResult.deflected && deflectionResult.deflected.success && (
          <DeflectedOrbitPath 
            orbitalData={{
              ...currentAsteroid.orbital_data,
              eccentricity: deflectionResult.deflected.eccentricity.toString(),
              inclination: deflectionResult.deflected.inclination.toString(),
              semi_major_axis: deflectionResult.deflected.semiMajorAxis.toString(),
            }}
            color="#0088FF" // Blue for deflected path
            opacity={0.8}
            lineWidth={2}
          />
        )}

        {/* Collision orbit path */}
        {showOrbits && collisionOrbit && (
          <CollisionOrbitPath collisionOrbit={collisionOrbit} />
        )}

        {/* Intersection points */}
        {showIntersections && (
          <IntersectionPoints
            asteroidOrbitalData={currentAsteroid.orbital_data}
            maxSearchDays={365 * 2}
            isVisible={true}
          />
        )}

        {/* Original asteroid - continues in normal orbit */}
        {showOriginalAsteroid && (
          <Asteroid
            ref={asteroidRef}
            key={`original-asteroid-${resetKey}`}
            orbitalData={currentAsteroid.orbital_data}
            onImpact={() => { }} // Original asteroid doesn't impact
            onCollisionDetected={onCollisionDetected}
            earthRef={earthRef}
            sunRef={sunRef}
            sizeMultiplier={settings.asteroidSize}
            trajectoryOffset={new THREE.Vector3(0, 0, 0)}
            target={null}
            timeScale={timeScale}
            isImpacted={false}
            impactPosition={null}
            isOriginalAsteroid={true}
            isDeflected={isDeflected}
            deflectionResult={deflectionResult}
          />
        )}

        {/* Deflected asteroid - shows deflected trajectory */}
        {isDeflected && deflectionResult && deflectionResult.deflected && deflectionResult.deflected.success && (
          <DeflectedAsteroid
            key={`deflected-asteroid-${resetKey}`}
            orbitalData={{
              ...currentAsteroid.orbital_data,
              eccentricity: deflectionResult.deflected.eccentricity.toString(),
              inclination: deflectionResult.deflected.inclination.toString(),
              semi_major_axis: deflectionResult.deflected.semiMajorAxis.toString(),
            }}
            earthRef={earthRef}
            sizeMultiplier={settings.asteroidSize}
            timeScale={timeScale}
            isDeflected={true}
          />
        )}

        {/* Collision asteroid - follows orbital collision trajectory */}
        {showCollisionAsteroid &&
          collisionOrbit &&
          (asteroidVisible || impactPosition) && (
            <CollisionAsteroid
              ref={collisionAsteroidRef}
              key={`collision-asteroid-${resetKey}`}
              collisionOrbit={collisionOrbit}
              onImpact={onImpact}
              onCollisionDetected={onCollisionDetected}
              earthRef={earthRef}
              sizeMultiplier={settings.asteroidSize}
              timeScale={impactPosition ? 0 : timeScale}
              isImpacted={!!impactPosition}
              impactPosition={impactPosition}
            />
          )}

        {/* Origin marker */}
        {originPosition && isImpactTrajectorySet && !impactPosition && (
          <OriginMarker position={originPosition} />
        )}

        {/* Labels */}
        <Labels
          earthRef={earthRef}
          asteroidRef={asteroidRef}
          collisionAsteroidRef={collisionAsteroidRef}
          showCollisionAsteroid={showCollisionAsteroid}
          onDistanceChange={setDistance}
        />

        {/* Orbit Labels */}
        <OrbitLabels
          currentAsteroid={currentAsteroid}
          collisionOrbit={collisionOrbit}
          isDeflected={isDeflected}
          deflectionResult={deflectionResult}
          showLabels={settings.showLabels}
        />
      </Canvas>

      {/* Legend */}
      <Legend
        showCollisionAsteroid={showCollisionAsteroid}
        asteroidName={currentAsteroid.name}
        distance={distance}
        asteroidId={currentAsteroid.id}
        collisionDetected={collisionDetected}
        hasImpacted={hasImpacted}
        isImpactTrajectorySet={isImpactTrajectorySet}
        isOptimizing={isOptimizing}
      />
    </div>
  );
});

SimulationScene.displayName = "SimulationScene";
