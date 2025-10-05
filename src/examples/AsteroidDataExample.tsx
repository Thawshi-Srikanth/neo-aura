import React from "react";
import { useAsteroidStore } from "../store/asteroidStore";

// Example component showing how to use asteroid data from Zustand store
const AsteroidDataExample: React.FC = () => {
  const {
    asteroids,
    selectedAsteroid,
    isLoading,
    error,
    setSelectedAsteroid,
    clearAsteroids,
  } = useAsteroidStore();

  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-xl font-bold mb-4">
        Asteroid Data from Zustand Store
      </h2>

      {/* Loading State */}
      {isLoading && <p className="text-blue-400">Loading asteroids...</p>}

      {/* Error State */}
      {error && <p className="text-red-400">Error: {error}</p>}

      {/* Asteroid Count */}
      <p className="mb-4">
        <span className="text-gray-400">Total Asteroids:</span>
        <span className="text-green-400 font-bold"> {asteroids.length}</span>
      </p>

      {/* Selected Asteroid */}
      {selectedAsteroid && (
        <div className="mb-4 p-3 bg-gray-800 rounded">
          <h3 className="text-lg font-semibold text-blue-400">
            Selected Asteroid:
          </h3>
          <p>
            <span className="text-gray-400">Name:</span>{" "}
            {selectedAsteroid.asteroid.name}
          </p>
          <p>
            <span className="text-gray-400">ID:</span>{" "}
            {selectedAsteroid.asteroid.id}
          </p>
          <p>
            <span className="text-gray-400">Hazardous:</span>
            <span
              className={
                selectedAsteroid.asteroid.is_potentially_hazardous_asteroid
                  ? "text-red-400"
                  : "text-green-400"
              }
            >
              {selectedAsteroid.asteroid.is_potentially_hazardous_asteroid
                ? " Yes"
                : " No"}
            </span>
          </p>
          <p>
            <span className="text-gray-400">Position:</span>[
            {selectedAsteroid.position.map((p) => p.toFixed(2)).join(", ")}]
          </p>
          <button
            onClick={() => setSelectedAsteroid(null)}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Asteroid List */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-blue-400 mb-2">
          All Asteroids:
        </h3>
        <div className="max-h-60 overflow-y-auto">
          {asteroids.map((asteroid) => (
            <div
              key={asteroid.id}
              className="p-2 mb-1 bg-gray-800 hover:bg-gray-700 rounded cursor-pointer"
              onClick={() =>
                setSelectedAsteroid({
                  asteroid,
                  position: [0, 0, 0], // Default position for example
                })
              }
            >
              <p className="font-medium">{asteroid.name}</p>
              <p className="text-sm text-gray-400">
                Diameter:{" "}
                {asteroid.estimated_diameter.kilometers.estimated_diameter_min.toFixed(
                  3
                )}{" "}
                -
                {asteroid.estimated_diameter.kilometers.estimated_diameter_max.toFixed(
                  3
                )}{" "}
                km
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-x-2">
        <button
          onClick={clearAsteroids}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded"
        >
          Clear All Data
        </button>
      </div>
    </div>
  );
};

// Example of a custom hook using the asteroid store
export const useAsteroidStats = () => {
  const { asteroids } = useAsteroidStore();

  return React.useMemo(() => {
    const hazardousCount = asteroids.filter(
      (a) => a.is_potentially_hazardous_asteroid
    ).length;
    const averageDiameter =
      asteroids.length > 0
        ? asteroids.reduce(
            (sum, a) =>
              sum + a.estimated_diameter.kilometers.estimated_diameter_max,
            0
          ) / asteroids.length
        : 0;

    return {
      total: asteroids.length,
      hazardous: hazardousCount,
      safe: asteroids.length - hazardousCount,
      averageDiameter: averageDiameter.toFixed(3),
    };
  }, [asteroids]);
};

export default AsteroidDataExample;
