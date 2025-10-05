import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import Earth from "./components/Earth";
import LevaControls from "./components/controls/LevaControls";
import { Leva } from "leva";
import InstancedAsteroidOrbit from "./components/InstancedAstroidOrbit";
import Stars from "./components/Starts";
import { useAsteroidData } from "./hooks/useAsteroidData";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AsteroidImpactSimulation from "./components/views/AsteroidImpactSimulation";
import BottomBar from "./components/BottomBar";
import "./styles/leva-horizontal.css";
import { Suspense } from "react";
import ImpactSim from "./components/newsim/ImpactSim";

// Configure Leva for horizontal layout
const levaConfig = {
  collapsed: true, // Start collapsed to save space
  hidden: false,
  oneLineLabels: true,
  flat: false,
  titleBar: {
    filter: false,
  },
  hideCopyButton: true, // Hide copy buttons to make it cleaner
};

function MainScene() {
  const { asteroids, isLoading, isError, loadMore, isReachingEnd } =
    useAsteroidData();

  return (
    <div className="relative w-full h-full bg-black">
      <Leva {...levaConfig} />
      <LevaControls />

      {/* SpaceX-style Header */}
      <div className="absolute top-6 left-6 z-10">
        <div className="glass-panel p-4">
          <h1 className="text-2xl font-bold text-white mb-2">
            AURA MISSION CONTROL
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={loadMore}
              disabled={isReachingEnd || isLoading}
              className="px-4 py-2 bg-black/60 border border-white/30 text-white text-sm hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading
                ? "Loading..."
                : isReachingEnd
                ? "No More Asteroids"
                : "Load More Asteroids"}
            </button>
            {isError && (
              <div className="status-indicator status-danger">
                Failed to load asteroids
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Panel */}
      <div className="absolute top-6 right-6 z-10">
        <div className="glass-panel p-4">
          <div className="text-xs text-white/60 uppercase tracking-wider mb-2">
            System Status
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-white">
                Orbital Tracking Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-white">
                {asteroids.length} Objects Tracked
              </span>
            </div>
          </div>
        </div>
      </div>

      <Canvas
        className="fixed inset-0 w-screen h-screen bg-black"
        camera={{ position: [0, 0, 50], fov: 45 }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={10} />
        <Earth />

        {isLoading && (
          <Html center>
            <div className="glass-panel p-4">
              <div className="text-white text-center">
                <div className="animate-spin w-6 h-6 border-2 border-white/30 border-t-white rounded-full mx-auto mb-2"></div>
                <div className="text-sm">Loading orbital data...</div>
              </div>
            </div>
          </Html>
        )}
        {asteroids.length > 0 && (
          <InstancedAsteroidOrbit asteroids={asteroids} />
        )}

        <Stars />
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          maxDistance={100}
          minDistance={0.1}
        />
      </Canvas>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="w-full h-screen">
        <Routes>
          <Route path="/" element={<MainScene />} />
          <Route
            path="/impact-simulation"
            element={<AsteroidImpactSimulation />}
          />
          <Route
            path="/impact-simulation/:asteroidId"
            element={<AsteroidImpactSimulation />}
          />
          <Route
            path="/impact-simulation"
            element={<AsteroidImpactSimulation />}
          />
          <Route
            path="/imp-sim"
            element={
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-screen bg-black">
                    <div className="text-white text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
                      <div>Loading Impact Simulation...</div>
                    </div>
                  </div>
                }
              >
                <ImpactSim key="imp-sim-route" />
              </Suspense>
            }
          />
        </Routes>
        <BottomBar />
      </div>
    </Router>
  );
}
