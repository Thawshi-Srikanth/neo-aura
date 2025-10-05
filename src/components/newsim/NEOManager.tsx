import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher, getAsteroidsUrl } from "../../api/asteroidApi";
import NEOPoint from "./NEOPoint";
import type { Asteroid } from "../../types/asteroid";

interface NEOManagerProps {
  showNEOs?: boolean;
  neoColor?: string;
  neoSize?: number;
  blinkSpeed?: number;
  maxNEOs?: number;
  currentTime?: number;
  onNEOClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
  selectedNEOId?: string | null;
  onAsteroidsLoaded?: (asteroids: Asteroid[]) => void;
}

const NEOManager: React.FC<NEOManagerProps> = ({
  showNEOs = true,
  neoColor = "#ffff00",
  neoSize = 0.005,
  blinkSpeed = 1.0,
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
        (asteroid) =>
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
  }, [data, maxNEOs]); // Removed onAsteroidsLoaded from dependencies

  if (error) {
    console.error("Error fetching NEO data:", error);
  }

  if (isLoading || !asteroids.length) {
    return null;
  }

  return (
    <group>
      {asteroids.map((asteroid) => (
        <group key={asteroid.id}>
          {showNEOs && (
            <NEOPoint
              asteroid={asteroid}
              time={currentTime}
              color={neoColor}
              blinkSpeed={blinkSpeed}
              size={neoSize}
              visible={showNEOs}
              onClick={onNEOClick}
              isSelected={selectedNEOId === asteroid.id}
            />
          )}
        </group>
      ))}
    </group>
  );
};

export default NEOManager;
