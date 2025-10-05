/**
 * INTEGRATION GUIDE: Replacing NEOManager with Performance Optimized System
 *
 * This guide shows how to migrate from the current NEOManager to the optimized system
 * while maintaining all functionality and improving performance significantly.
 */

// BEFORE: Original NEOManager usage
/*
<NEOManager
  showTrails={true}
  showNEOs={true}
  neoColor="#ffff00"
  neoSize={0.005}
  blinkSpeed={1.0}
  trailColor="#61FAFA"
  trailLength={50}
  trailOpacity={0.6}
  maxNEOs={20}
  currentTime={currentTime}
  onNEOClick={handleNEOClick}
  selectedNEOId={selectedNEOId}
  onAsteroidsLoaded={handleAsteroidsLoaded}
/>
*/

// AFTER: Performance Optimized System
/*
<PerformanceOptimizedNEOSystem
  asteroids={asteroids}            // Now passed directly instead of fetched internally
  currentTime={currentTime}
  showTrails={true}
  showNEOs={true}
  neoColor="#ffff00"
  neoSize={0.005}
  trailColor="#61FAFA"
  trailLength={100}               // Can handle longer trails efficiently
  trailOpacity={0.6}
  pointsPerTrail={50}            // Configurable trail detail
  lodDistance={5.0}              // NEW: LOD distance control
  maxRenderDistance={20.0}       // NEW: Culling distance
  onNEOClick={handleNEOClick}
  selectedNEOId={selectedNEOId}
/>
*/

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher, getAsteroidsUrl } from "../../api/asteroidApi";
import PerformanceOptimizedNEOSystem from "./PerformanceOptimizedNEOSystem";
import type { Asteroid } from "../../types/asteroid";

/**
 * STEP 1: Create a new data fetching hook
 * This separates data fetching from rendering for better performance control
 */
const useNEOData = (maxNEOs: number = 100) => {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);

  const { data, error, isLoading } = useSWR(
    getAsteroidsUrl(0, maxNEOs),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Cache for 5 minutes to reduce API calls
      dedupingInterval: 300000,
    }
  );

  useEffect(() => {
    if (data?.near_earth_objects) {
      // Filter and validate asteroid data
      const validAsteroids = data.near_earth_objects.filter(
        (asteroid: Asteroid) =>
          asteroid.orbital_data &&
          asteroid.orbital_data.semi_major_axis &&
          asteroid.orbital_data.eccentricity &&
          asteroid.orbital_data.inclination &&
          asteroid.orbital_data.mean_motion &&
          // Additional validation for performance
          !isNaN(parseFloat(asteroid.orbital_data.semi_major_axis)) &&
          !isNaN(parseFloat(asteroid.orbital_data.eccentricity)) &&
          parseFloat(asteroid.orbital_data.eccentricity) < 1.0 // Exclude hyperbolic orbits
      );

      setAsteroids(validAsteroids.slice(0, maxNEOs));
    }
  }, [data, maxNEOs]);

  return { asteroids, error, isLoading };
};

/**
 * STEP 2: Enhanced NEO Manager with Performance Monitoring
 */
interface EnhancedNEOManagerProps {
  showTrails?: boolean;
  showNEOs?: boolean;
  neoColor?: string;
  neoSize?: number;
  trailColor?: string;
  trailLength?: number;
  trailOpacity?: number;
  maxNEOs?: number;
  currentTime?: number;
  onNEOClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
  selectedNEOId?: string | null;
  onAsteroidsLoaded?: (asteroids: Asteroid[]) => void;
  // NEW performance options
  performanceMode?: "high" | "balanced" | "performance";
  enableLOD?: boolean;
  maxRenderDistance?: number;
}

const EnhancedNEOManager: React.FC<EnhancedNEOManagerProps> = ({
  showTrails = true,
  showNEOs = true,
  neoColor = "#ffff00",
  neoSize = 0.005,
  trailColor = "#61FAFA",
  trailLength = 100,
  trailOpacity = 0.6,
  maxNEOs = 100,
  currentTime = 0,
  onNEOClick,
  selectedNEOId,
  onAsteroidsLoaded,
  performanceMode = "balanced",
  enableLOD = true,
  maxRenderDistance = 20.0,
}) => {
  const { asteroids, error, isLoading } = useNEOData(maxNEOs);

  // Performance mode configurations
  const performanceConfig = React.useMemo(() => {
    switch (performanceMode) {
      case "high":
        return {
          pointsPerTrail: 80,
          lodDistance: 8.0,
          maxRenderDistance: 30.0,
          updateFrequency: 1,
        };
      case "performance":
        return {
          pointsPerTrail: 20,
          lodDistance: 3.0,
          maxRenderDistance: 15.0,
          updateFrequency: 4,
        };
      default: // balanced
        return {
          pointsPerTrail: 50,
          lodDistance: 5.0,
          maxRenderDistance: 20.0,
          updateFrequency: 2,
        };
    }
  }, [performanceMode]);

  // Track if asteroids have been loaded to prevent repeated calls
  const hasNotifiedRef = React.useRef(false);
  const lastAsteroidCountRef = React.useRef(0);

  // Notify parent when asteroids are loaded (only once per data change)
  useEffect(() => {
    if (
      asteroids.length > 0 &&
      onAsteroidsLoaded &&
      (!hasNotifiedRef.current ||
        asteroids.length !== lastAsteroidCountRef.current)
    ) {
      onAsteroidsLoaded(asteroids);
      hasNotifiedRef.current = true;
      lastAsteroidCountRef.current = asteroids.length;
    }
  }, [asteroids.length]); // Only depend on length, not the callback function

  // Performance monitoring can be added here if needed

  if (error) {
    console.error("Error fetching NEO data:", error);
    return null;
  }

  if (isLoading || !asteroids.length) {
    return null;
  }

  return (
    <group>
      {/* Performance Optimized NEO System */}
      <PerformanceOptimizedNEOSystem
        asteroids={asteroids}
        currentTime={currentTime}
        showTrails={showTrails}
        showNEOs={showNEOs}
        neoColor={neoColor}
        neoSize={neoSize}
        trailColor={trailColor}
        trailLength={trailLength}
        trailOpacity={trailOpacity}
        pointsPerTrail={performanceConfig.pointsPerTrail}
        lodDistance={
          enableLOD ? performanceConfig.lodDistance : maxRenderDistance
        }
        maxRenderDistance={maxRenderDistance}
        onNEOClick={onNEOClick}
        selectedNEOId={selectedNEOId}
      />

      {/* Performance monitoring can be added here in development */}
    </group>
  );
};

/**
 * STEP 3: Migration Instructions
 *
 * 1. Replace imports:
 *    - Remove: import NEOManager from './NEOManager';
 *    - Add: import EnhancedNEOManager from './EnhancedNEOManager';
 *
 * 2. Update component usage:
 *    - Replace <NEOManager> with <EnhancedNEOManager>
 *    - Add performance props as needed
 *
 * 3. Optional performance tuning:
 *    - Set performanceMode based on device capabilities
 *    - Adjust maxNEOs based on performance requirements
 *    - Enable/disable LOD based on scene complexity
 *
 * 4. Monitor performance:
 *    - Check frame rates with different settings
 *    - Adjust LOD distances based on visual needs
 *    - Tune trail length and point count for balance
 */

/**
 * STEP 4: Example Migration
 */
const MigratedNEOScene: React.FC = () => {
  const [currentTime] = useState(0);
  const [selectedNEOId, setSelectedNEOId] = useState<string | null>(null);

  const handleNEOClick = (
    asteroid: Asteroid,
    position: [number, number, number]
  ) => {
    setSelectedNEOId(asteroid.id);
    console.log(`Clicked NEO: ${asteroid.name} at`, position);
  };

  const handleAsteroidsLoaded = (asteroids: Asteroid[]) => {
    console.log(
      `Loaded ${asteroids.length} asteroids with optimized rendering`
    );
  };

  return (
    <EnhancedNEOManager
      showTrails={true}
      showNEOs={true}
      neoColor="#ffff00"
      neoSize={0.005}
      trailColor="#61FAFA"
      trailLength={100}
      trailOpacity={0.6}
      maxNEOs={500} // Can handle more with optimization
      currentTime={currentTime}
      onNEOClick={handleNEOClick}
      selectedNEOId={selectedNEOId}
      onAsteroidsLoaded={handleAsteroidsLoaded}
      performanceMode="balanced" // NEW: Choose performance level
      enableLOD={true} // NEW: Enable Level of Detail
      maxRenderDistance={25.0} // NEW: Culling distance
    />
  );
};

export default EnhancedNEOManager;
export { useNEOData, MigratedNEOScene };
