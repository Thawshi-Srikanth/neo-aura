import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls";

import NEOManager from "./NEOManager";
import NEOControls, { type NEOSettings } from "./NEOControls";
import Sun from "./Sun";
import EarthOrbit from "./EarthOrbit";
import EarthOrbitPath from "./EarthOrbitPath";
import NEODetailPanel from "./NEODetailPanel";
import TimeDisplay from "./TimeDisplay";
import PlanetaryDefensePanel from "./PlanetaryDefensePanel";
import type { Asteroid } from "../../types/asteroid";

// Enhanced time controller for manual and automatic time control
const TimeController = ({
  onTimeUpdate,
  speedMultiplier = 10,
  initialTime,
  isPlaying,
  manualTime,
  resetTime,
}: {
  onTimeUpdate: (time: number) => void;
  speedMultiplier?: number;
  initialTime: number;
  isPlaying: boolean;
  manualTime?: number;
  resetTime?: number;
}) => {
  const lastTimeRef = useRef(0);
  const currentSimulationTimeRef = useRef(0);
  const lastResetTimeRef = useRef(0);

  useFrame((state) => {
    // Handle reset
    if (resetTime !== undefined && resetTime !== lastResetTimeRef.current) {
      currentSimulationTimeRef.current = 0;
      lastTimeRef.current = state.clock.elapsedTime;
      lastResetTimeRef.current = resetTime;
      onTimeUpdate(resetTime);
      return;
    }

    if (manualTime !== undefined) {
      // Manual time control via slider
      onTimeUpdate(manualTime);
      lastTimeRef.current = state.clock.elapsedTime;
      currentSimulationTimeRef.current = manualTime - initialTime;
      return;
    }

    if (!isPlaying) {
      lastTimeRef.current = state.clock.elapsedTime;
      return;
    }

    const baseTimeScale = 0.1;
    const deltaTime = state.clock.elapsedTime - lastTimeRef.current;
    const timeIncrement = deltaTime * baseTimeScale * speedMultiplier;

    currentSimulationTimeRef.current += timeIncrement;
    const currentTime = initialTime + currentSimulationTimeRef.current;
    onTimeUpdate(currentTime);
    lastTimeRef.current = state.clock.elapsedTime;
  });
  return null;
};

const ImpactSim = () => {
  const controlsRef = useRef<ThreeOrbitControls>(null);

  // Get current time as initial reference
  const getCurrentTime = () => {
    const now = new Date();
    const j2000 = new Date("2000-01-01T12:00:00Z");
    return (now.getTime() - j2000.getTime()) / (1000 * 60 * 60 * 24);
  };

  // Initialize with current time in days since J2000.0 epoch (2000-01-01)
  const [currentTime, setCurrentTime] = useState(getCurrentTime);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedNEO, setSelectedNEO] = useState<{
    asteroid: Asteroid;
    position: [number, number, number];
  } | null>(null);
  const [showPlanetaryDefense, setShowPlanetaryDefense] = useState(false);
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [neoSettings, setNeoSettings] = useState<NEOSettings>({
    showNEOs: true,
    showTrails: true,
    showSun: true,
    showEarth: true,
    showEarthOrbit: true,
    neoColor: "#ffff00",
    neoSize: 0.005,
    blinkSpeed: 1.0,
    trailColor: "#61FAFA",
    trailLength: 50,
    trailOpacity: 0.6,
    maxNEOs: 20,
    speedMultiplier: 10,
  });

  const handleNEOClick = (
    asteroid: Asteroid,
    position: [number, number, number]
  ) => {
    setSelectedNEO({ asteroid, position });
  };

  const handleCloseDetail = () => {
    setSelectedNEO(null);
  };

  const handleOpenPlanetaryDefense = () => {
    setShowPlanetaryDefense(true);
  };

  const handleClosePlanetaryDefense = () => {
    setShowPlanetaryDefense(false);
  };

  const handleAsteroidsLoaded = (loadedAsteroids: Asteroid[]) => {
    setAsteroids(loadedAsteroids);
  };

  // Time control handlers
  const [manualTime, setManualTime] = useState<number | undefined>(undefined);
  const [resetTime, setResetTime] = useState<number | undefined>(undefined);

  const handleTimeChange = (time: number) => {
    setCurrentTime(time);
    setManualTime(time);
    // Clear manual time after a short delay to resume automatic progression
    setTimeout(() => setManualTime(undefined), 100);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    const newResetTime = getCurrentTime();
    setCurrentTime(newResetTime);
    setManualTime(undefined); // Clear any manual time
    setResetTime(newResetTime); // Trigger reset in TimeController
    setIsPlaying(true);
    // Clear reset trigger after a short delay
    setTimeout(() => setResetTime(undefined), 100);
  };

  const handleSpeedChange = (speed: number) => {
    setNeoSettings((prev) => ({ ...prev, speedMultiplier: speed }));
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Canvas with basic 3D scene */}
      <Canvas
        className="absolute inset-0 w-full h-full bg-black"
        camera={{ position: [1, 0.5, 1], fov: 30 }}
      >
        <ambientLight intensity={2} />
        <Stars count={2000} fade radius={200} />

        <Sun position={[0, 0, 0]} size={0.02} visible={neoSettings.showSun} />

        <EarthOrbitPath
          orbitRadius={0.3}
          visible={neoSettings.showEarthOrbit}
          color="#4a90e2"
          opacity={0.3}
        />

        <EarthOrbit
          currentTime={currentTime}
          orbitRadius={0.3}
          orbitSpeed={0.01}
          visible={neoSettings.showEarth}
        />

        <NEOManager
          showTrails={neoSettings.showTrails}
          showNEOs={neoSettings.showNEOs}
          neoColor={neoSettings.neoColor}
          neoSize={neoSettings.neoSize}
          blinkSpeed={neoSettings.blinkSpeed}
          trailColor={neoSettings.trailColor}
          trailLength={neoSettings.trailLength}
          trailOpacity={neoSettings.trailOpacity}
          maxNEOs={neoSettings.maxNEOs}
          currentTime={currentTime}
          onNEOClick={handleNEOClick}
          selectedNEOId={selectedNEO?.asteroid.id || null}
          onAsteroidsLoaded={handleAsteroidsLoaded}
        />

        <OrbitControls
          ref={controlsRef}
          target={[0, 0, 0]}
          minDistance={0.2}
          maxDistance={5}
          enablePan
          enableZoom
          enableRotate
        />

        <TimeController
          onTimeUpdate={setCurrentTime}
          speedMultiplier={neoSettings.speedMultiplier}
          initialTime={getCurrentTime()}
          isPlaying={isPlaying}
          manualTime={manualTime}
          resetTime={resetTime}
        />
      </Canvas>

      {/* Enhanced Time Display with Controls */}
      <TimeDisplay
        currentTime={currentTime}
        speedMultiplier={neoSettings.speedMultiplier}
        isPlaying={isPlaying}
        onTimeChange={handleTimeChange}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
      />

      {/* NEO Control Panel */}
      <NEOControls
        onSettingsChange={setNeoSettings}
        onOpenPlanetaryDefense={handleOpenPlanetaryDefense}
      />

      {/* NEO Detail Panel */}
      {selectedNEO && (
        <NEODetailPanel
          asteroid={selectedNEO.asteroid}
          onClose={handleCloseDetail}
          visible={!!selectedNEO}
        />
      )}

      {/* Planetary Defense Panel */}
      <PlanetaryDefensePanel
        asteroids={asteroids}
        visible={showPlanetaryDefense}
        onClose={handleClosePlanetaryDefense}
      />
    </div>
  );
};

export default ImpactSim;
