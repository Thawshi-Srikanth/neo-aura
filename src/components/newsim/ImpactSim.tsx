import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useMemo } from "react";

import SimpleNEOSystem from "./SimpleNEOSystem";
import NEOControls, { type NEOSettings } from "./NEOControls";
import Sun from "./Sun";
import EarthOrbit from "./EarthOrbit";
import EarthOrbitPath from "./EarthOrbitPath";
import NEODetailPanel from "./NEODetailPanel";
import TimeDisplay from "./TimeDisplay";
import PlanetaryDefensePanel from "./PlanetaryDefensePanel";
import { useAsteroidStore } from "../../store/asteroidStore";
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
  // Simulation time kept independent from React
  const lastFrameClockRef = useRef(0);
  const simElapsedRef = useRef(0);
  const lastResetRef = useRef(0);
  const uiAccumulatorRef = useRef(0); // seconds since last UI sync
  const lastUiSyncRef = useRef(0);

  // Config
  const BASE_TIME_SCALE = 0.1; // base scaling factor
  const UI_SYNC_INTERVAL = 0.1; // seconds (~10fps state updates)

  useFrame((state) => {
    // Handle reset trigger
    if (resetTime !== undefined && resetTime !== lastResetRef.current) {
      simElapsedRef.current = 0;
      lastFrameClockRef.current = state.clock.elapsedTime;
      lastResetRef.current = resetTime;
      onTimeUpdate(resetTime); // immediate UI reflect
      return;
    }

    if (manualTime !== undefined) {
      // External manual scrub overrides progression
      onTimeUpdate(manualTime);
      lastFrameClockRef.current = state.clock.elapsedTime;
      simElapsedRef.current = manualTime - initialTime;
      uiAccumulatorRef.current = 0; // prevent extra sync this frame
      return;
    }

    if (!isPlaying) {
      lastFrameClockRef.current = state.clock.elapsedTime;
      return;
    }

    const now = state.clock.elapsedTime;
    if (lastFrameClockRef.current === 0) {
      lastFrameClockRef.current = now;
      return;
    }

    const frameDelta = now - lastFrameClockRef.current;
    lastFrameClockRef.current = now;
    if (frameDelta <= 0) return;

    // Advance simulation time (decoupled)
    const timeIncrement = frameDelta * BASE_TIME_SCALE * speedMultiplier;
    simElapsedRef.current += timeIncrement;

    // Accumulate for UI sync
    uiAccumulatorRef.current += frameDelta;
    if (uiAccumulatorRef.current >= UI_SYNC_INTERVAL) {
      const simTime = initialTime + simElapsedRef.current;
      onTimeUpdate(simTime);
      lastUiSyncRef.current = now;
      uiAccumulatorRef.current = 0;
    }
  });
  return null;
};

const ImpactSim = () => {
  const controlsRef = useRef<any>(null);

  // Get current time as initial reference - memoized to prevent recalculation
  const initialTime = useMemo(() => {
    const now = new Date();
    const j2000 = new Date("2000-01-01T12:00:00Z");
    return (now.getTime() - j2000.getTime()) / (1000 * 60 * 60 * 24);
  }, []);

  // Initialize with current time in days since J2000.0 epoch (2000-01-01)
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [isPlaying, setIsPlaying] = useState(true);
  // Use Zustand store for asteroid data
  const { selectedAsteroid, setSelectedAsteroid } = useAsteroidStore();

  const [showPlanetaryDefense, setShowPlanetaryDefense] = useState(false);
  const [showEarthDetails, setShowEarthDetails] = useState(false);
  const [clickedCoordinates, setClickedCoordinates] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);
  const [neoSettings, setNeoSettings] = useState<NEOSettings>({
    showNEOs: true,
    showOrbits: true,
    showSun: true,
    showEarth: true,
    showEarthOrbit: true,
    neoColor: "#03FF92",
    neoSize: 0.0015,
    blinkSpeed: 2.0,
    maxNEOs: 10, // Increased for better Planetary Defense analysis
    speedMultiplier: 10,
  });

  const handleCloseDetail = () => {
    setSelectedAsteroid(null);
  };

  const handleOpenPlanetaryDefense = () => {
    setShowPlanetaryDefense(true);
  };

  const handleClosePlanetaryDefense = () => {
    setShowPlanetaryDefense(false);
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
    const now = new Date();
    const j2000 = new Date("2000-01-01T12:00:00Z");
    const newResetTime =
      (now.getTime() - j2000.getTime()) / (1000 * 60 * 60 * 24);
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

  const handleNEOClick = (
    asteroid: Asteroid,
    position: [number, number, number]
  ) => {
    setSelectedAsteroid({ asteroid, position });
    console.log(`Selected NEO: ${asteroid.name}`);
  };

  const handleEarthClick = () => {
    setShowEarthDetails(true);
  };

  const handleCloseEarthDetails = () => {
    setShowEarthDetails(false);
  };

  // Removed handleAsteroidsLoaded - data is now managed by Zustand store

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">

      {/* Canvas with WebGL error recovery */}
      <Canvas
        key="impact-sim-canvas"
        className="absolute inset-0 w-full h-full bg-black"
        camera={{ position: [3, 2, 3], fov: 50 }}
        gl={{ preserveDrawingBuffer: false, powerPreference: "default" }}
      >
        <ambientLight intensity={2} />
        {/* Basic scene elements */}
        <Stars count={500} fade radius={100} />

        {neoSettings.showSun && (
          <Sun position={[0, 0, 0]} size={0.15} visible={true} />
        )}

        {neoSettings.showEarthOrbit && (
          <EarthOrbitPath
            orbitRadius={2.0}
            visible={true}
            color="#00BFFF"
            opacity={0.9}
          />
        )}

        {neoSettings.showEarth && (
          <EarthOrbit
            currentTime={currentTime}
            orbitRadius={2.0}
            orbitSpeed={0.01}
            visible={true}
            onEarthClick={handleEarthClick}
          />
        )}
        <meshStandardMaterial
          color="#00BFFF" // Bright blue
          emissive="#004080" // Blue glow
          emissiveIntensity={0.4} // Strong emission
          roughness={0.5} // Surface texture
          metalness={0.3} // Slight metallic sheen
        />
        {/* Simple NEO System - Clean NEO Points and Orbital Paths */}
        <SimpleNEOSystem
          showNEOs={neoSettings.showNEOs}
          showOrbits={neoSettings.showOrbits}
          neoColor={neoSettings.neoColor}
          neoSize={neoSettings.neoSize}
          blinkSpeed={neoSettings.blinkSpeed}
          maxNEOs={neoSettings.maxNEOs}
          currentTime={currentTime}
          onNEOClick={handleNEOClick}
        />

        <OrbitControls
          ref={controlsRef}
          target={[0, 0, 0]}
          minDistance={1.0}
          maxDistance={15}
          enablePan
          enableZoom
          enableRotate
        />

        <TimeController
          onTimeUpdate={setCurrentTime}
          speedMultiplier={neoSettings.speedMultiplier}
          initialTime={initialTime}
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

      {/* Earth Details Panel */}
      {showEarthDetails && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg border border-blue-500 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-blue-300">🌍 Earth</h2>
            <button
              onClick={handleCloseEarthDetails}
              className="text-gray-400 hover:text-white text-lg font-bold ml-4"
            >
              ×
            </button>
          </div>

          <div className="text-sm">
            <span className="text-gray-400">Population:</span>
            <span className="text-green-400 font-bold ml-2">8.1 Billion</span>
          </div>
        </div>
      )}

      {/* NEO Detail Panel */}
      {selectedAsteroid && (
        <NEODetailPanel
          asteroid={selectedAsteroid.asteroid}
          onClose={handleCloseDetail}
          visible={!!selectedAsteroid}
        />
      )}

      {/* Planetary Defense Panel */}
      <PlanetaryDefensePanel
        visible={showPlanetaryDefense}
        onClose={handleClosePlanetaryDefense}
      />

      {/* Coordinate Display Panel */}
      {clickedCoordinates && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg border border-blue-500">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-blue-300">
              Earth Coordinates
            </h3>
            <button
              onClick={() => setClickedCoordinates(null)}
              className="text-gray-400 hover:text-white ml-2"
            >
              ×
            </button>
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-300">Latitude:</span>{" "}
              <span className="text-white font-mono">
                {Math.abs(clickedCoordinates.latitude).toFixed(4)}°
                {clickedCoordinates.latitude >= 0 ? "N" : "S"}
              </span>
            </p>
            <p>
              <span className="text-gray-300">Longitude:</span>{" "}
              <span className="text-white font-mono">
                {Math.abs(clickedCoordinates.longitude).toFixed(4)}°
                {clickedCoordinates.longitude >= 0 ? "E" : "W"}
              </span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Click on Earth to get coordinates
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactSim;
