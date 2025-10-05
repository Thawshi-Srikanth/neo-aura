import { X, AlertTriangle, MapPin, Clock } from "lucide-react";
import type { Asteroid } from "../../types/asteroid";
import {
  predictImpact,
  timeToDate,
  getCurrentRelativePositions,
} from "../../utils/impact-prediction";
import { useEffect, useState } from "react";

interface NEODetailPanelProps {
  asteroid: Asteroid;
  onClose: () => void;
  visible: boolean;
}

const NEODetailPanel: React.FC<NEODetailPanelProps> = ({
  asteroid,
  onClose,
  visible,
}) => {
  const [impactData, setImpactData] = useState<any>(null);
  const [currentPositions, setCurrentPositions] = useState<any>(null);

  useEffect(() => {
    if (!visible || !asteroid) return;

    // Calculate impact prediction
    const currentTime = Date.now() / (1000 * 60 * 60 * 24); // Current time in days since epoch
    const timeRange = {
      start: currentTime,
      end: currentTime + 365 * 5, // Look ahead 5 years
      step: 1, // Check every day
    };

    try {
      const impact = predictImpact(asteroid, timeRange);
      setImpactData(impact);

      const positions = getCurrentRelativePositions(asteroid, currentTime);
      setCurrentPositions(positions);
    } catch (error) {
      console.warn("Error calculating impact prediction:", error);
    }
  }, [visible, asteroid]);

  if (!visible) return null;

  // Format numbers for display
  const formatNumber = (num: number | string, decimals = 2) => {
    const n = typeof num === "string" ? parseFloat(num) : num;
    return isNaN(n) ? "N/A" : n.toFixed(decimals);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Calculate some derived values
  const avgDiameter =
    asteroid.estimated_diameter.kilometers.estimated_diameter_min &&
    asteroid.estimated_diameter.kilometers.estimated_diameter_max
      ? (asteroid.estimated_diameter.kilometers.estimated_diameter_min +
          asteroid.estimated_diameter.kilometers.estimated_diameter_max) /
        2
      : null;

  const nextApproach = asteroid.close_approach_data?.[0];

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-2xl border border-gray-700 max-w-md w-full max-h-96 overflow-y-auto">
        {/* Header with close button */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-yellow-400 pr-4">
            {asteroid.name}
          </h3>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors flex-shrink-0"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">NEO ID:</span>
              <div className="font-mono text-blue-300">{asteroid.id}</div>
            </div>
            <div>
              <span className="text-gray-400">Hazardous:</span>
              <div
                className={
                  asteroid.is_potentially_hazardous_asteroid
                    ? "text-red-400"
                    : "text-green-400"
                }
              >
                {asteroid.is_potentially_hazardous_asteroid ? "Yes" : "No"}
              </div>
            </div>
          </div>

          {/* Size Information */}
          <div>
            <span className="text-gray-400">Estimated Diameter:</span>
            <div className="text-sm">
              {avgDiameter ? (
                <span>{formatNumber(avgDiameter, 3)} km (avg)</span>
              ) : (
                <span>
                  {formatNumber(
                    asteroid.estimated_diameter.kilometers
                      .estimated_diameter_min,
                    3
                  )}{" "}
                  -{" "}
                  {formatNumber(
                    asteroid.estimated_diameter.kilometers
                      .estimated_diameter_max,
                    3
                  )}{" "}
                  km
                </span>
              )}
            </div>
          </div>

          {/* Absolute Magnitude */}
          <div>
            <span className="text-gray-400">Absolute Magnitude (H):</span>
            <div>{formatNumber(asteroid.absolute_magnitude_h, 2)}</div>
          </div>

          {/* Orbital Information */}
          <div className="border-t border-gray-700 pt-3">
            <h4 className="text-yellow-300 font-semibold mb-2">Orbital Data</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Semi-major Axis:</span>
                <div>
                  {formatNumber(asteroid.orbital_data.semi_major_axis, 3)} AU
                </div>
              </div>
              <div>
                <span className="text-gray-400">Eccentricity:</span>
                <div>{formatNumber(asteroid.orbital_data.eccentricity, 4)}</div>
              </div>
              <div>
                <span className="text-gray-400">Inclination:</span>
                <div>{formatNumber(asteroid.orbital_data.inclination, 2)}°</div>
              </div>
              <div>
                <span className="text-gray-400">Orbital Period:</span>
                <div>
                  {formatNumber(asteroid.orbital_data.orbital_period, 2)} days
                </div>
              </div>
            </div>
          </div>

          {/* Close Approach Data */}
          {nextApproach && (
            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-yellow-300 font-semibold mb-2">
                Next Close Approach
              </h4>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-gray-400">Date:</span>{" "}
                  {formatDate(nextApproach.close_approach_date)}
                </div>
                <div>
                  <span className="text-gray-400">Miss Distance:</span>{" "}
                  {formatNumber(nextApproach.miss_distance.kilometers)} km
                </div>
                <div>
                  <span className="text-gray-400">Velocity:</span>{" "}
                  {formatNumber(
                    nextApproach.relative_velocity.kilometers_per_hour
                  )}{" "}
                  km/h
                </div>
                <div>
                  <span className="text-gray-400">Orbiting:</span>{" "}
                  {nextApproach.orbiting_body}
                </div>
              </div>
            </div>
          )}

          {/* Current Position */}
          {currentPositions && (
            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-yellow-300 font-semibold mb-2 flex items-center gap-1">
                <MapPin size={16} />
                Current Status
              </h4>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-gray-400">Distance from Earth:</span>{" "}
                  {formatNumber((currentPositions as any).distanceKm, 0)} km
                </div>
                <div>
                  <span className="text-gray-400">Distance in AU:</span>{" "}
                  {formatNumber((currentPositions as any).distance, 4)} AU
                </div>
              </div>
            </div>
          )}

          {/* Impact Prediction */}
          {impactData && (
            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-yellow-300 font-semibold mb-2 flex items-center gap-1">
                <AlertTriangle size={16} />
                Impact Analysis (5-year prediction)
              </h4>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-gray-400">Closest Approach:</span>{" "}
                  {timeToDate((impactData as any).time).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-gray-400">Minimum Distance:</span>{" "}
                  {formatNumber((impactData as any).distance * 149597870.7, 0)} km
                </div>
                <div>
                  <span className="text-gray-400">Impact Probability:</span>{" "}
                  <span
                    className={
                      (impactData as any).impactProbability > 0.1
                        ? "text-red-400"
                        : (impactData as any).impactProbability > 0.01
                        ? "text-yellow-400"
                        : "text-green-400"
                    }
                  >
                    {((impactData as any).impactProbability * 100).toFixed(6)}%
                  </span>
                </div>
                {(impactData as any).impactLocation && (
                  <div className="bg-red-900 bg-opacity-50 p-2 rounded mt-2">
                    <div className="flex items-center gap-1 text-red-300 mb-1">
                      <Clock size={12} />
                      <span className="font-semibold">
                        POTENTIAL IMPACT DETECTED
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Impact Date:</span>{" "}
                      {timeToDate((impactData as any).time).toLocaleString()}
                    </div>
                    <div>
                      <span className="text-gray-400">Impact Location:</span>{" "}
                      {formatNumber((impactData as any).impactLocation.lat, 2)}°N,{" "}
                      {formatNumber((impactData as any).impactLocation.lon, 2)}°E
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="border-t border-gray-700 pt-3">
            <a
              href={asteroid.nasa_jpl_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              View on NASA JPL →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NEODetailPanel;
