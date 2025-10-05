import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { Badge } from '../ui/badge';

interface LegendProps {
  showCollisionAsteroid?: boolean;
  distance?: number;
  asteroidName?: string;
  asteroidId?: string;
  collisionDetected?: boolean;
  hasImpacted?: boolean;
  isImpactTrajectorySet?: boolean;
  isOptimizing?: boolean;
}

export const Legend: React.FC<LegendProps> = ({ 
  showCollisionAsteroid = false, 
  distance = 0,
  asteroidName = "Unknown",
  asteroidId = "N/A",
  collisionDetected = false,
  hasImpacted = false,
  isImpactTrajectorySet = false,
  isOptimizing = false
}) => {
  const { settings } = useSettingsStore();

  // Don't render if labels are disabled
  if (!settings.showLabels) {
    return null;
  }

  // Format distance in astronomical units with proper scale
  const formatDistance = (dist: number) => {
    if (dist === 0) return "0 AU";
    
    // Convert to AU (1 AU = 149,597,870.7 km)
    const au = dist / 149597870.7;
    
    if (au < 0.01) {
      // For very small distances, show in km with scientific notation
      const km = dist / 1000;
      const exponent = Math.floor(Math.log10(km));
      const mantissa = km / Math.pow(10, exponent);
      return (
        <span>
          {mantissa.toFixed(3)} × 10<sup>{exponent}</sup> km
        </span>
      );
    } else if (au < 1) {
      // For distances less than 1 AU, show in AU with 3 decimals
      return `${au.toFixed(3)} AU`;
    } else {
      // For larger distances, show in AU with 2 decimals
      return `${au.toFixed(2)} AU`;
    }
  };

  return (
    <div className="console-legend absolute top-4 left-4 z-50 rounded-lg p-3 max-w-xs">
      {/* Status Badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        {collisionDetected && (
          <Badge variant="destructive" className="text-xs px-2 py-0.5 font-mono bg-red-900/80 text-red-200 border-red-500/50">
            [COLLISION]
          </Badge>
        )}
        {hasImpacted && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5 font-mono bg-gray-800/80 text-gray-300 border-gray-600/50">
            [IMPACTED]
          </Badge>
        )}
        {isImpactTrajectorySet && (
          <Badge variant="default" className="text-xs px-2 py-0.5 font-mono bg-blue-900/80 text-blue-200 border-blue-500/50">
            [TRAJECTORY]
          </Badge>
        )}
        {isOptimizing && (
          <Badge variant="outline" className="text-xs px-2 py-0.5 font-mono bg-yellow-900/80 text-yellow-200 border-yellow-500/50">
            [OPTIMIZING]
          </Badge>
        )}
      </div>

      {/* Asteroid Info */}
      <div className="mb-3">
        <div className="text-green-400 text-sm font-medium mb-1">$ ASTEROID</div>
        <div className="text-green-300 text-xs">
          <div>NAME: {asteroidName}</div>
          <div>ID: {asteroidId}</div>
        </div>
      </div>

      {/* Distance */}
      {distance > 0 && (
        <div className="mb-3">
          <div className="text-green-400 text-sm font-medium mb-1">$ DISTANCE</div>
          <div className="text-green-300 text-xs">
            {formatDistance(distance)}
          </div>
        </div>
      )}

      {/* Objects Legend */}
      <div>
        <div className="text-green-400 text-sm font-medium mb-2">$ OBJECTS</div>
        <div className="space-y-1">
          {/* Earth */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-green-300 text-xs">EARTH</span>
          </div>

          {/* Sun */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-green-300 text-xs">SUN</span>
          </div>

          {/* Original Asteroid */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-green-300 text-xs">ORIGINAL_ASTEROID</span>
          </div>

          {/* Deflected Asteroid - only show if active */}
          {showCollisionAsteroid && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-green-300 text-xs">DEFLECTED_ASTEROID</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
