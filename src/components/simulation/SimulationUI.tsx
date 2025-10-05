import { ImpactAnalysisPanel } from "../ImpactAnalysisPanel";
import ImpactMap from "../views/ImpactMap";
import LoadingScreen from "../LoadingScreen";
import TrajectoryOptimizationProgress from "../controls/TrajectoryOptimizationProgress";
import SpeedControls from "../controls/SpeedControls";
import { Mini3DView } from "../Mini3DView";
import { DeflectAsteroidButton } from "../cli/DeflectAsteroidButton";
import { useParams } from "react-router-dom";
import type { Asteroid } from "../../types/asteroid";
import type { CollisionOrbit } from "../../utils/orbitalCollision";
import * as THREE from "three";

interface SimulationUIProps {
  // Impact data
  impactData: unknown;
  currentAsteroid: Asteroid;

  // Simulation state
  isImpactTrajectorySet: boolean;
  isOptimizing: boolean;
  hasImpacted: boolean;
  showLoadingScreen: boolean;

  // Time and scale
  timeScale: number;
  simulationTime: number;

  // Collision orbit
  collisionOrbit: CollisionOrbit | null;
  impactPosition: THREE.Vector3 | null;
  resetKey: number;

  // Event handlers
  onStartSimulation: () => void;
  onResetSimulation: () => void;
  onTimeScaleChange: (scale: number) => void;
  onOptimizationComplete: (result: unknown) => void;
  onOptimizationCancel: () => void;
  onImpactDataClose: () => void;
  onDeflectionAttempt?: (success: boolean) => void;
}

export const SimulationUI = ({
  impactData,
  currentAsteroid,
  isImpactTrajectorySet,
  isOptimizing,
  hasImpacted,
  showLoadingScreen,
  timeScale,
  simulationTime,
  collisionOrbit,
  impactPosition,
  resetKey,
  onStartSimulation,
  onResetSimulation,
  onTimeScaleChange,
  onOptimizationComplete,
  onOptimizationCancel,
  onImpactDataClose,
  onDeflectionAttempt,
}: SimulationUIProps) => {
  const { asteroidId } = useParams();
  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen
        isVisible={showLoadingScreen}
        message="Altering asteroid orbit"
      />

      {/* Impact Map */}
      <ImpactMap impactData={impactData as any} />

      {/* Trajectory Optimization Progress */}
      <TrajectoryOptimizationProgress
        isVisible={isOptimizing}
        onComplete={onOptimizationComplete}
        onCancel={onOptimizationCancel}
      />

      {/* Speed Controls */}
      <SpeedControls
        timeScale={timeScale}
        onTimeScaleChange={onTimeScaleChange}
        isVisible={true}
        onStartSimulation={onStartSimulation}
        onResetSimulation={onResetSimulation}
        hasImpacted={hasImpacted}
        isImpactTrajectorySet={isImpactTrajectorySet}
      />

      {/* Hidden DeflectAsteroidButton for terminal logic */}
      <DeflectAsteroidButton 
        onDeflectionAttempt={onDeflectionAttempt} 
        asteroidId={asteroidId}
      />



      {/* Impact Analysis Panel */}
      {impactData && (impactData as any).physics && (
        <ImpactAnalysisPanel
          impactData={impactData as any}
          asteroid={currentAsteroid}
          onClose={onImpactDataClose}
        />
      )}

      {/* Mini 3D View */}
      <Mini3DView
        asteroidOrbitalData={currentAsteroid.orbital_data}
        collisionOrbit={collisionOrbit}
        simulationTime={simulationTime}
        timeScale={timeScale}
        isVisible={true}
        impactPosition={impactPosition}
        resetKey={resetKey}
      />
    </>
  );
};
