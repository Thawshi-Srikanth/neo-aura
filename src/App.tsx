import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AsteroidImpactSimulation from "./components/views/AsteroidImpactSimulation";
import Dashboard from "./components/views/Dashboard";
import { ThemeProvider } from "./components/theme-provider";
import { Suspense } from "react";
import ImpactSim from "./components/newsim/ImpactSim";
import LoadingScreen from "./components/LoadingScreen";
import RouteLoader from "./components/RouteLoader";
import { NavigationProvider } from "./contexts/NavigationContext";

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <NavigationProvider>
        <Router>
          <div className="w-full h-screen">
            <Routes>
              <Route 
                path="/" 
                element={
                  <RouteLoader loadingMessage="Loading Dashboard" minLoadingTime={500}>
                    <Dashboard />
                  </RouteLoader>
                } 
              />
              <Route
                path="/impact-simulation/:asteroidId"
                element={
                  <RouteLoader loadingMessage="Loading Impact Simulation" minLoadingTime={2000}>
                    <AsteroidImpactSimulation />
                  </RouteLoader>
                }
              />
              <Route
                path="/impact-simulation"
                element={
                  <RouteLoader loadingMessage="Loading Impact Simulation" minLoadingTime={2000}>
                    <AsteroidImpactSimulation />
                  </RouteLoader>
                }
              />
              <Route
                path="/orbital-visualization"
                element={
                  <Suspense
                    fallback={
                      <LoadingScreen 
                        isVisible={true} 
                        message="Loading Orbital Visualization" 
                      />
                    }
                  >
                    <RouteLoader loadingMessage="Loading Orbital Visualization" minLoadingTime={1500}>
                      <ImpactSim key="orbital-visualization-route" />
                    </RouteLoader>
                  </Suspense>
                }
              />
            </Routes>
          </div>
        </Router>
      </NavigationProvider>
    </ThemeProvider>
  );
}
