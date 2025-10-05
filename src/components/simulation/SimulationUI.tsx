import { ImpactAnalysisPanel } from "../ImpactAnalysisPanel";
import ImpactMap from "../views/ImpactMap";
import LoadingScreen from "../LoadingScreen";
import TrajectoryOptimizationProgress from "../controls/TrajectoryOptimizationProgress";
import SpeedControls from "../controls/SpeedControls";
import { Mini3DView } from "../Mini3DView";
import { DeflectAsteroidButton } from "../cli/DeflectAsteroidButton";
import { DAYS_PER_SECOND } from "../../config/constants";
import { SIMULATION_CONSTANTS } from "../../config/simulationConstants";
import type { Asteroid } from "../../types/asteroid";
import type { CollisionOrbit } from "../../utils/orbitalCollision";
import * as THREE from "three";

interface SimulationUIProps {
  // Impact data
  impactData: unknown;
  currentAsteroid: Asteroid;

  // Simulation state
  isImpactTrajectorySet: boolean;
  impactCountdownSeconds: number | null;
  collisionDetected: boolean;
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
  impactCountdownSeconds,
  collisionDetected,
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
  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen
        isVisible={showLoadingScreen}
        message="Altering asteroid orbit"
        duration={SIMULATION_CONSTANTS.LOADING_SCREEN_DURATION}
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
      <DeflectAsteroidButton onDeflectionAttempt={onDeflectionAttempt} />


      {/* Countdown Timer */}
      {isImpactTrajectorySet &&
        !impactPosition &&
        impactCountdownSeconds &&
        !collisionDetected && (
          <div className="fixed top-4 right-4 z-50">
            <div className="glass-panel border-red-500/50 bg-red-900/20 px-4 py-2 shadow-2xl rounded-lg">
              <div
                id="countdown-timer"
                className="text-2xl font-bold text-white font-mono"
              >
                {(impactCountdownSeconds / DAYS_PER_SECOND).toFixed(1)}d
              </div>
            </div>
          </div>
        )}

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
