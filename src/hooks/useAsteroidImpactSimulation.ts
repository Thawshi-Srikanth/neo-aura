import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useSimulationState } from "./useSimulation";
import { asteroidData } from "../data/asteroids";
import { createIntersectingCollisionOrbit, type CollisionOrbit } from "../utils/orbitalCollision";
import { DAYS_PER_SECOND } from "../config/constants";
import { SIMULATION_CONSTANTS } from "../config/simulationConstants";

export interface AsteroidImpactSimulationState {
  // Impact trajectory state
  isImpactTrajectorySet: boolean;
  impactCountdownSeconds: number | null;
  originPosition: THREE.Vector3 | null;
  hasImpacted: boolean;
  collisionDetected: boolean;
  
  // Dual asteroid system state
  showOriginalAsteroid: boolean;
  showCollisionAsteroid: boolean;
  collisionOrbit: CollisionOrbit | null;
  
  // UI state
  isOptimizing: boolean;
  showLoadingScreen: boolean;
  timeScale: number;
  simulationTime: number;
  
  // Display settings
  showOrbits: boolean;
  showIntersections: boolean;
  asteroidSize: number;
}

export interface AsteroidImpactSimulationActions {
  // Impact trajectory actions
  setIsImpactTrajectorySet: (value: boolean) => void;
  setImpactCountdownSeconds: (value: number | null) => void;
  setOriginPosition: (value: THREE.Vector3 | null) => void;
  setHasImpacted: (value: boolean) => void;
  setCollisionDetected: (value: boolean) => void;
  
  // Dual asteroid system actions
  setShowOriginalAsteroid: (value: boolean) => void;
  setShowCollisionAsteroid: (value: boolean) => void;
  setCollisionOrbit: (value: CollisionOrbit | null) => void;
  
  // UI actions
  setIsOptimizing: (value: boolean) => void;
  setShowLoadingScreen: (value: boolean) => void;
  setTimeScale: (value: number) => void;
  setSimulationTime: (value: number) => void;
  
  // Simulation actions
  handleStartSimulation: () => void;
  handleReset: () => void;
  handleOptimizationComplete: (result: unknown) => void;
  handleOptimizationCancel: () => void;
  handleImpact: (position: THREE.Vector3) => void;
  handleCollisionDetected: () => void;
}

export const useAsteroidImpactSimulation = (asteroidId?: string) => {
  // Find asteroid by ID from URL, default to first asteroid if not found
  const selectedAsteroidIndex = useMemo(() => {
    if (asteroidId) {
      const index = asteroidData.findIndex(asteroid => asteroid.id === asteroidId);
      return index !== -1 ? index : 0;
    }
    return 0;
  }, [asteroidId]);

  const currentAsteroid = useMemo(
    () => asteroidData[selectedAsteroidIndex],
    [selectedAsteroidIndex]
  );

  // State
  const [isImpactTrajectorySet, setIsImpactTrajectorySet] = useState(false);
  const [impactCountdownSeconds, setImpactCountdownSeconds] = useState<number | null>(null);
  const [originPosition, setOriginPosition] = useState<THREE.Vector3 | null>(null);
  const [hasImpacted, setHasImpacted] = useState(false);
  const [collisionDetected, setCollisionDetected] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showOriginalAsteroid, setShowOriginalAsteroid] = useState(true);
  const [collisionOrbit, setCollisionOrbit] = useState<CollisionOrbit | null>(null);
  const [showCollisionAsteroid, setShowCollisionAsteroid] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [simulationTime, setSimulationTime] = useState(0);
  const [showOrbits] = useState(true);
  const [showIntersections] = useState(false);
  const [asteroidSize] = useState(1.0);

  // Timer state ref
  const timerStateRef = useRef<{
    startTime: number;
    baseDuration: number;
    accumulatedTime: number;
    lastTimeScale: number;
  } | null>(null);

  const {
    state: {
      impactPosition,
      impactData,
      asteroidVisible,
      simulationRunning,
      resetKey,
    },
    actions: {
      setImpactPosition,
      setImpactData,
      setAsteroidVisible,
      setSimulationRunning,
      resetSimulation,
      setTimeToImpact,
    },
  } = useSimulationState();

  // Handle collision detection with alert
  useEffect(() => {
    if (collisionDetected && !hasImpacted) {
      // Show impact alert
      alert("🚨 IMPACT DETECTED! 🚨\n\nThe asteroid has collided with Earth!");
      setHasImpacted(true);
    }
  }, [collisionDetected, hasImpacted]);

  // Update simulation time for mini view
  useEffect(() => {
    if (!simulationRunning) return;

    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // Real seconds elapsed
      const scaledElapsed = elapsed * timeScale * DAYS_PER_SECOND; // Convert to simulation days
      setSimulationTime(scaledElapsed);
    }, SIMULATION_CONSTANTS.TIMER_UPDATE_INTERVAL); // Update based on constant

    return () => clearInterval(timer);
  }, [simulationRunning, timeScale]);

  const handleStartSimulation = useCallback(() => {
    if (!hasImpacted) {
      // Show loading screen
      setShowLoadingScreen(true);
      
      // Simulate loading time with the loading screen
      setTimeout(() => {
        // Create a collision orbit that truly intersects with Earth's orbit
        const newCollisionOrbit = createIntersectingCollisionOrbit(
          currentAsteroid.orbital_data,
          SIMULATION_CONSTANTS.DEFAULT_COLLISION_TIME // Use constant for collision time
        );

        // Set up collision system
        setCollisionOrbit(newCollisionOrbit);
        setShowCollisionAsteroid(true);
        setShowOriginalAsteroid(true);

        setIsImpactTrajectorySet(true);
        setSimulationRunning(true);
        setAsteroidVisible(true);

        // Resume simulation at normal speed
        setTimeScale(1.0);
        
        // Hide loading screen
        setShowLoadingScreen(false);
      }, SIMULATION_CONSTANTS.LOADING_SCREEN_DURATION); // Use constant for loading duration
    }
  }, [currentAsteroid.orbital_data, hasImpacted, setSimulationRunning, setAsteroidVisible]);

  const handleReset = useCallback(() => {
    resetSimulation();
    setIsImpactTrajectorySet(false);
    setImpactCountdownSeconds(null);
    setOriginPosition(null);
    setHasImpacted(false);
    setCollisionDetected(false);
    setShowLoadingScreen(false);
    timerStateRef.current = null;
    setShowOriginalAsteroid(true);
    setCollisionOrbit(null);
    setShowCollisionAsteroid(false);
  }, [resetSimulation]);

  const handleOptimizationComplete = useCallback(
    (result: unknown) => {
      setIsOptimizing(false);

      // Use optimized impact time
      const impactTime = (result as any).impactTime || SIMULATION_CONSTANTS.DEFAULT_IMPACT_TIME;
      setImpactCountdownSeconds(impactTime);

      setIsImpactTrajectorySet(true);
      setSimulationRunning(true);
      setAsteroidVisible(true);
      setShowOriginalAsteroid(true);
      setTimeScale(1.0);
    },
    [setSimulationRunning, setAsteroidVisible]
  );

  const handleOptimizationCancel = useCallback(() => {
    setIsOptimizing(false);
  }, []);

  const handleImpact = useCallback(
    (position: THREE.Vector3) => {
      if (!impactPosition) {
        setImpactPosition(position);
        setHasImpacted(true);
        setTimeToImpact(null);
        setSimulationRunning(false);
      }
    },
    [impactPosition, setImpactPosition, setTimeToImpact, setSimulationRunning]
  );

  const handleCollisionDetected = useCallback(() => {
    setSimulationRunning(false);
    setTimeScale(0);
    setTimeToImpact(null);
    setImpactCountdownSeconds(null);
    setCollisionDetected(true);
  }, [setSimulationRunning]);


  const state: AsteroidImpactSimulationState = {
    isImpactTrajectorySet,
    impactCountdownSeconds,
    originPosition,
    hasImpacted,
    collisionDetected,
    showOriginalAsteroid,
    showCollisionAsteroid,
    collisionOrbit,
    isOptimizing,
    showLoadingScreen,
    timeScale,
    simulationTime,
    showOrbits,
    showIntersections,
    asteroidSize,
  };

  const actions: AsteroidImpactSimulationActions = {
    setIsImpactTrajectorySet,
    setImpactCountdownSeconds,
    setOriginPosition,
    setHasImpacted,
    setCollisionDetected,
    setShowOriginalAsteroid,
    setShowCollisionAsteroid,
    setCollisionOrbit,
    setIsOptimizing,
    setShowLoadingScreen,
    setTimeScale,
    setSimulationTime,
    handleStartSimulation,
    handleReset,
    handleOptimizationComplete,
    handleOptimizationCancel,
    handleImpact,
    handleCollisionDetected,
  };

  return {
    currentAsteroid,
    state,
    actions,
    simulationState: {
      impactPosition,
      impactData,
      asteroidVisible,
      simulationRunning,
      resetKey,
    },
    simulationActions: {
      setImpactPosition,
      setImpactData,
      setAsteroidVisible,
      setSimulationRunning,
      resetSimulation,
      setTimeToImpact,
    },
  };
};
