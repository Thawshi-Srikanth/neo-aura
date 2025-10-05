import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher, getAsteroidsUrl } from "../../api/asteroidApi";
import RouterSafeNEOSystem from "./RouterSafeNEOSystem";
import type { Asteroid } from "../../types/asteroid";

interface NEOManagerWithDataProps {
  showTrails?: boolean;
  showNEOs?: boolean;
  neoColor?: string;
  neoSize?: number;
  blinkSpeed?: number;
  trailColor?: string;
  trailLength?: number;
  trailOpacity?: number;
  maxNEOs?: number;
  currentTime?: number;
  onNEOClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
  selectedNEOId?: string | null;
  onAsteroidsLoaded?: (asteroids: Asteroid[]) => void;
}

const NEOManagerWithData: React.FC<NEOManagerWithDataProps> = ({
  showTrails = true,
  showNEOs = true,
  neoColor = "#ffff00",
  neoSize = 0.005,
  blinkSpeed = 1.0,
  trailColor = "#61FAFA",
  trailLength = 50,
  trailOpacity = 0.6,
  maxNEOs = 20,
  currentTime = 0,
  onNEOClick,
  selectedNEOId,
  onAsteroidsLoaded,
}) => {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);

  // Fetch NEO data from NASA API
  const { data, error, isLoading } = useSWR(
    getAsteroidsUrl(0, maxNEOs),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  useEffect(() => {
    if (data?.near_earth_objects) {
      // Filter out asteroids that don't have valid orbital data
      const validAsteroids = data.near_earth_objects.filter(
        (asteroid: Asteroid) =>
          asteroid.orbital_data &&
          asteroid.orbital_data.semi_major_axis &&
          asteroid.orbital_data.eccentricity &&
          asteroid.orbital_data.inclination &&
          asteroid.orbital_data.mean_motion
      );
      const filteredAsteroids = validAsteroids.slice(0, maxNEOs);
      setAsteroids(filteredAsteroids);

      // Notify parent component about loaded asteroids
      if (onAsteroidsLoaded) {
        onAsteroidsLoaded(filteredAsteroids);
      }
    }
  }, [data, maxNEOs, onAsteroidsLoaded]);

  if (error) {
    console.error("Error fetching NEO data:", error);
  }

  if (isLoading || !asteroids.length) {
    return null;
  }

  return (
    <RouterSafeNEOSystem
      asteroids={asteroids}
      currentTime={currentTime}
      showTrails={showTrails}
      showNEOs={showNEOs}
      neoColor={neoColor}
      neoSize={neoSize}
      blinkSpeed={blinkSpeed}
      trailColor={trailColor}
      trailLength={trailLength}
      trailOpacity={trailOpacity}
      pointsPerTrail={50}
      lodDistance={5.0}
      maxRenderDistance={20.0}
      onNEOClick={onNEOClick}
      selectedNEOId={selectedNEOId}
    />
  );
};

export default NEOManagerWithData;
