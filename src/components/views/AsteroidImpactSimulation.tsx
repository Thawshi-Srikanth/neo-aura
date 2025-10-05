import { useParams } from "react-router-dom";
import { useRef } from "react";
import * as THREE from "three";
// import { OrbitControls } from "@react-three/drei";
import { useAsteroidImpactSimulation } from "../../hooks/useAsteroidImpactSimulation";
import { useDeflectionIntegration } from "../../hooks/useDeflectionIntegration";
import { SimulationScene } from "../simulation/SimulationScene";
import { SimulationUI } from "../simulation/SimulationUI";
import { calculateImpactPhysics } from "../../utils/impactPhysics";
import { getAsteroidPosition } from "../../utils/orbital-calculations";
import { AU_TO_UNITS } from "../../config/constants";
import { useSettingsStore } from "../../store/settingsStore";

export default function AsteroidImpactSimulation() {
  const { asteroidId } = useParams();
  
  // Refs for 3D objects
  const earthRef = useRef<THREE.Mesh>(null!);
  const asteroidRef = useRef<THREE.Mesh>(null!);
  const collisionAsteroidRef = useRef<THREE.Mesh>(null!);
  const sunRef = useRef<THREE.Mesh>(null!);
  const controlsRef = useRef<any>(null);

  // Use the organized simulation hook
  const {
    currentAsteroid,
    state,
    actions,
    simulationState,
    simulationActions,
  } = useAsteroidImpactSimulation(asteroidId);

  // Use deflection integration hook
  const { deflectionResult, isDeflected } = useDeflectionIntegration();

  // Get settings for physics calculations
  const { settings } = useSettingsStore();

  // Enhanced impact analysis handler
  const handleImpactAnalyzed = (details: { lat: number; lon: number; isLand: boolean }) => {
    // Calculate impact physics
    const asteroidDiameter =
      (currentAsteroid.estimated_diameter.meters.estimated_diameter_min +
        currentAsteroid.estimated_diameter.meters.estimated_diameter_max) /
      2;
    const asteroidVelocity = parseFloat(
      currentAsteroid.close_approach_data[0]?.relative_velocity
        .kilometers_per_second || "20"
    );

    const physics = calculateImpactPhysics(
      {
        diameter: asteroidDiameter,
        velocity: asteroidVelocity,
        density: settings.asteroidDensity,
        angle: settings.impactAngle,
      },
      !details.isLand // isOcean
    );

    simulationActions.setImpactData({
      ...details,
      physics,
    });
  };

  // Enhanced optimization complete handler
  const handleOptimizationComplete = (result: unknown) => {
      // Get asteroid's CURRENT rendered position (this is the actual origin point)
      let astPos: THREE.Vector3;
      if (asteroidRef.current) {
        // Use the actual rendered position if asteroid is visible
        astPos = asteroidRef.current.position.clone();
      } else {
        // Fallback to calculated position if asteroid not yet rendered
        const [astX, astY, astZ] = getAsteroidPosition(
          0,
          currentAsteroid.orbital_data
        );
        astPos = new THREE.Vector3(
          astX * AU_TO_UNITS,
          astY * AU_TO_UNITS,
          astZ * AU_TO_UNITS
        );
      }

      // Store origin position for marker - this is where trajectory starts
    actions.setOriginPosition(astPos.clone());

      // Use optimized impact time
      const impactTime = (result as any).impactTime || 12.5;
    actions.setImpactCountdownSeconds(impactTime);

    actions.setIsImpactTrajectorySet(true);
    simulationActions.setSimulationRunning(true);
    simulationActions.setAsteroidVisible(true);
    actions.setShowOriginalAsteroid(true);
    actions.setTimeScale(1.0);
  };

  // Handle deflection attempt
  const handleDeflectionAttempt = (success: boolean) => {
    if (success) {
      // Deflection successful - stop the simulation
      simulationActions.setSimulationRunning(false);
      actions.setIsImpactTrajectorySet(false);
      actions.setImpactCountdownSeconds(null);
      // Show success message or effect
      console.log('Asteroid successfully deflected!');
    } else {
      // Deflection failed - continue with impact
      console.log('Deflection failed - impact imminent!');
    }
  };

  // Create deflected asteroid with modified orbital data (as a copy for visualization)
  const deflectedAsteroid = deflectionResult && 
                           deflectionResult.deflected && 
                           deflectionResult.deflected.success ? {
    ...currentAsteroid,
    orbital_data: {
      ...currentAsteroid.orbital_data,
      eccentricity: deflectionResult.deflected.eccentricity.toString(),
      inclination: deflectionResult.deflected.inclination.toString(),
      semi_major_axis: deflectionResult.deflected.semiMajorAxis.toString(),
    },
    close_approach_data: currentAsteroid.close_approach_data.map(approach => ({
      ...approach,
      relative_velocity: {
        ...approach.relative_velocity,
        kilometers_per_second: deflectionResult.deflected.velocity.toString()
      }
    }))
  } : currentAsteroid;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">

      {/* Simulation UI Components */}
      <SimulationUI
        impactData={simulationState.impactData}
        currentAsteroid={currentAsteroid}
        isImpactTrajectorySet={state.isImpactTrajectorySet}
        isOptimizing={state.isOptimizing}
        hasImpacted={state.hasImpacted}
        showLoadingScreen={state.showLoadingScreen}
        timeScale={state.timeScale}
        simulationTime={state.simulationTime}
        collisionOrbit={state.collisionOrbit}
        impactPosition={simulationState.impactPosition}
        resetKey={simulationState.resetKey}
        onStartSimulation={actions.handleStartSimulation}
        onResetSimulation={actions.handleReset}
        onTimeScaleChange={actions.setTimeScale}
        onOptimizationComplete={handleOptimizationComplete}
        onOptimizationCancel={actions.handleOptimizationCancel}
        onImpactDataClose={() => simulationActions.setImpactData(null)}
        onDeflectionAttempt={handleDeflectionAttempt}
      />

      {/* 3D Simulation Scene */}
      <SimulationScene
        currentAsteroid={isDeflected && deflectionResult ? deflectedAsteroid : currentAsteroid}
        impactPosition={simulationState.impactPosition}
        impactData={simulationState.impactData}
        asteroidVisible={simulationState.asteroidVisible}
        simulationRunning={simulationState.simulationRunning}
        resetKey={simulationState.resetKey}
        timeScale={state.timeScale}
        showOrbits={state.showOrbits}
        showIntersections={state.showIntersections}
        asteroidSize={state.asteroidSize}
        showOriginalAsteroid={state.showOriginalAsteroid}
        showCollisionAsteroid={state.showCollisionAsteroid}
        collisionOrbit={state.collisionOrbit}
        originPosition={state.originPosition}
        isImpactTrajectorySet={state.isImpactTrajectorySet}
          onImpactAnalyzed={handleImpactAnalyzed}
        onImpact={actions.handleImpact}
        onCollisionDetected={actions.handleCollisionDetected}
        collisionDetected={state.collisionDetected}
        hasImpacted={state.hasImpacted}
        isOptimizing={state.isOptimizing}
            earthRef={earthRef}
        asteroidRef={asteroidRef}
        collisionAsteroidRef={collisionAsteroidRef}
            sunRef={sunRef}
        controlsRef={controlsRef}
        isDeflected={isDeflected}
        deflectionResult={deflectionResult}
      />
    </div>
  );
}
