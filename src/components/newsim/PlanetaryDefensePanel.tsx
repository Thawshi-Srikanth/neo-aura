import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Shield,
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Zap,
  Target,
} from "lucide-react";
import {
  assessMultipleThreat,
  type ImpactAssessment,
} from "../../utils/planetary-defense";
import { useAsteroidStore } from "../../store/asteroidStore";
import type { Asteroid } from "../../types/asteroid";

// Memoized threat item component to prevent unnecessary re-renders
const ThreatItem = React.memo<{
  assessment: ImpactAssessment;
  isSelected: boolean;
  onClick: () => void;
}>(({ assessment, isSelected, onClick }) => (
  <div
    onClick={onClick}
    className={`p-3 rounded cursor-pointer transition-colors border-l-4 will-change-transform ${
      isSelected
        ? "bg-gray-700 border-blue-500"
        : "bg-gray-800 hover:bg-gray-700"
    }`}
    style={{ borderLeftColor: assessment.threatLevel.color }}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium text-sm truncate">
          {assessment.asteroid.name}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <span
            className="px-2 py-1 rounded text-xs font-bold"
            style={{
              backgroundColor: assessment.threatLevel.color,
            }}
          >
            {assessment.threatLevel.level}
          </span>
          <span>{(assessment.impactProbability * 100).toFixed(2)}%</span>
        </div>
      </div>
      {assessment.impactProbability > 0.01 && (
        <div className="text-red-400 text-xl">⚠️</div>
      )}
    </div>
  </div>
));

interface PlanetaryDefensePanelProps {
  visible: boolean;
  onClose: () => void;
}

const PlanetaryDefensePanel: React.FC<PlanetaryDefensePanelProps> = ({
  visible,
  onClose,
}) => {
  // Use Zustand store for asteroid data
  const { asteroids } = useAsteroidStore();
  const [threatAssessments, setThreatAssessments] = useState<
    ImpactAssessment[]
  >([]);
  const [selectedThreat, setSelectedThreat] = useState<ImpactAssessment | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Memoize the formatted helper functions to prevent re-renders
  const formatTime = useCallback((days: number) => {
    if (days === Infinity) return "No impact predicted";
    if (days < 0) return "Impact occurred";

    const years = Math.floor(days / 365);
    const remainingDays = Math.floor(days % 365);

    if (years > 0) {
      return `${years} years, ${remainingDays} days`;
    }
    return `${remainingDays} days`;
  }, []);

  const formatNumber = useCallback((num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
  }, []);

  // Memoize asteroids to prevent unnecessary recalculations
  const memoizedAsteroids = useMemo(() => asteroids, [asteroids.length]);

  useEffect(() => {
    if (!visible || memoizedAsteroids.length === 0) return;

    setLoading(true);

    // Use setTimeout to avoid blocking the main thread
    const timeoutId = setTimeout(() => {
      try {
        // Process in batches to prevent freezing
        const batchSize = 5;
        const batches: Asteroid[][] = [];

        for (let i = 0; i < memoizedAsteroids.length; i += batchSize) {
          batches.push(memoizedAsteroids.slice(i, i + batchSize));
        }

        let allAssessments: ImpactAssessment[] = [];

        const processBatch = (batchIndex: number) => {
          if (batchIndex >= batches.length) {
            // All batches processed
            setThreatAssessments(allAssessments);
            if (allAssessments.length > 0) {
              setSelectedThreat(allAssessments[0]);
            }
            setLoading(false);
            return;
          }

          const batch = batches[batchIndex];
          const batchAssessments = assessMultipleThreat(batch);
          allAssessments = [...allAssessments, ...batchAssessments];

          // Process next batch on next tick
          setTimeout(() => processBatch(batchIndex + 1), 10);
        };

        processBatch(0);
      } catch (error) {
        console.error("Error assessing planetary threats:", error);
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [memoizedAsteroids, visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl border border-gray-700 w-full max-w-6xl h-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-red-900 bg-opacity-50 p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="text-red-400" size={24} />
            <div>
              <h2 className="text-xl font-bold">🌍 PLANETARY DEFENSE SYSTEM</h2>
              <p className="text-sm text-gray-300">
                NEO Impact Threat Assessment & Mitigation Planning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Threat List */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col">
            {/* Fixed Header */}
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-400" />
                Threat Assessment ({threatAssessments.length} NEOs)
              </h3>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin text-2xl">🛸</div>
                  <p className="text-sm text-gray-400 mt-2">
                    Analyzing {memoizedAsteroids.length} NEOs for threats...
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full animate-pulse"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div
                  className="h-full overflow-y-auto p-2 space-y-2"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#4B5563 #1F2937",
                  }}
                >
                  {threatAssessments.slice(0, 50).map((assessment) => (
                    <ThreatItem
                      key={assessment.asteroid.id}
                      assessment={assessment}
                      isSelected={
                        selectedThreat?.asteroid.id === assessment.asteroid.id
                      }
                      onClick={() => setSelectedThreat(assessment)}
                    />
                  ))}
                  {threatAssessments.length > 50 && (
                    <div className="p-3 text-center text-sm text-gray-400 bg-gray-800 rounded">
                      Showing top 50 threats out of {threatAssessments.length}{" "}
                      total NEOs
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Detailed Assessment */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ scrollBehavior: "smooth" }}
          >
            {selectedThreat ? (
              <div className="p-6 space-y-6">
                {/* Threat Overview */}
                <div
                  className="bg-gray-800 p-4 rounded-lg border-l-4"
                  style={{ borderLeftColor: selectedThreat.threatLevel.color }}
                >
                  <h3 className="text-xl font-bold mb-2">
                    {selectedThreat.asteroid.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-400">Threat Level:</span>
                      <div
                        className={`font-bold text-lg inline-block ml-2 px-3 py-1 rounded`}
                        style={{
                          backgroundColor: selectedThreat.threatLevel.color,
                        }}
                      >
                        {selectedThreat.threatLevel.level}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Impact Probability:</span>
                      <div className="font-bold text-lg">
                        {(selectedThreat.impactProbability * 100).toFixed(4)}%
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mt-2">
                    {selectedThreat.threatLevel.description}
                  </p>
                </div>

                {/* Impact Details */}
                {selectedThreat.impactDate && selectedThreat.impactLocation && (
                  <div className="bg-red-900 bg-opacity-30 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
                      <Target size={18} />
                      IMPACT PREDICTION
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-400" />
                        <div>
                          <div className="text-gray-400">Impact Date:</div>
                          <div className="font-bold">
                            {selectedThreat.impactDate.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatTime(selectedThreat.timeToImpact)} remaining
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-green-400" />
                        <div>
                          <div className="text-gray-400">Impact Location:</div>
                          <div className="font-bold">
                            {selectedThreat.impactLocation.lat.toFixed(2)}°N,{" "}
                            {selectedThreat.impactLocation.lon.toFixed(2)}°E
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Impact Effects */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap size={18} className="text-yellow-400" />
                      Impact Effects
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Energy Released:</span>
                        <div className="font-bold">
                          {formatNumber(selectedThreat.energyReleased)} MT TNT
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Crater Diameter:</span>
                        <div className="font-bold">
                          {selectedThreat.craterDiameter.toFixed(1)} km
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">
                          Evacuation Radius:
                        </span>
                        <div className="font-bold">
                          {selectedThreat.evacuationRadius.toFixed(0)} km
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users size={18} className="text-purple-400" />
                      Population Impact
                    </h4>
                    <div className="text-sm">
                      <div>
                        <span className="text-gray-400">
                          Affected Population:
                        </span>
                        <div className="font-bold text-lg">
                          {formatNumber(selectedThreat.affectedPopulation)}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Estimated population within evacuation radius
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mitigation Options */}
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield size={18} className="text-green-400" />
                    Mitigation Strategies
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedThreat.mitigationOptions.map((option, index) => (
                      <div
                        key={index}
                        className="bg-gray-700 p-3 rounded text-sm flex items-center gap-2"
                      >
                        <span className="flex-1">{option}</span>
                        {selectedThreat.timeToImpact < 365 && (
                          <span className="text-red-400 text-xs font-bold">
                            URGENT
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Required */}
                {selectedThreat.impactProbability > 0.001 && (
                  <div className="bg-yellow-900 bg-opacity-50 p-4 rounded-lg border border-yellow-600">
                    <h4 className="font-semibold text-yellow-300 mb-2">
                      ⚠️ ACTION REQUIRED
                    </h4>
                    <p className="text-sm">
                      This NEO poses a significant threat. Immediate assessment
                      by planetary defense agencies is recommended.
                      {selectedThreat.timeToImpact < 1825 && (
                        <strong className="text-red-300">
                          {" "}
                          Time-critical situation - Less than 5 years to impact!
                        </strong>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Shield size={48} className="mx-auto mb-4 opacity-50" />
                  <p>
                    Select a NEO from the list to view detailed threat
                    assessment
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanetaryDefensePanel;
