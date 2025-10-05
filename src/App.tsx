import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import Earth from "./components/Earth";
import { Leva } from "leva";
import InstancedAsteroidOrbit from "./components/InstancedAstroidOrbit";
import Stars from "./components/Starts";
import { useAsteroidData } from "./hooks/useAsteroidData";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AsteroidImpactSimulation from "./components/views/AsteroidImpactSimulation";
import Dashboard from "./components/views/Dashboard";
import { ThemeProvider } from "./components/theme-provider";
import { Suspense } from "react";
import ImpactSim from "./components/newsim/ImpactSim";


export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <Router>
      <div className="w-full h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/impact-simulation"
            element={<AsteroidImpactSimulation />}
          />
          <Route
            path="/impact-simulation/:asteroidId"
            element={<AsteroidImpactSimulation />}
          />
          <Route
            path="/orbital-visualization"
            element={
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-screen bg-black">
                    <div className="text-white text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
                      <div>Loading Orbital Visualization...</div>
                    </div>
                  </div>
                }
              >
                <ImpactSim key="orbital-visualization-route" />
              </Suspense>
            }
          />
        </Routes>
      </div>
    </Router>
</ThemeProvider>
  );
}
