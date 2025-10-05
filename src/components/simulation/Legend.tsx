import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

interface LegendProps {
  showCollisionAsteroid?: boolean;
  asteroidName?: string;
  distance?: number;
  asteroidId?: string;
  collisionDetected?: boolean;
  hasImpacted?: boolean;
  isImpactTrajectorySet?: boolean;
  isOptimizing?: boolean;
}

export const Legend: React.FC<LegendProps> = ({ 
  showCollisionAsteroid = false, 
  asteroidName = "Unknown",
  distance = 0,
  collisionDetected = false,
  hasImpacted = false,
  isImpactTrajectorySet = false,
  isOptimizing = false
}) => {
  const { settings } = useSettingsStore();
  const navigate = useNavigate();

  // Don't render if labels are disabled
  if (!settings.showLabels) {
    return null;
  }

  // Format distance in kilometers
  const formatDistance = (dist: number) => {
    if (dist === 0) return "0 km";
    if (dist < 1000) return `${dist.toFixed(1)} km`;
    if (dist < 1000000) return `${(dist / 1000).toFixed(1)}k km`;
    return `${(dist / 1000000).toFixed(1)}M km`;
  };

  return (
    <div className="absolute top-4 left-4 z-50 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/')}
          variant="secondary"
          size="sm"
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        {/* Asteroid Name */}
        <div className="text-white text-sm font-medium">
          {asteroidName}
        </div>

        {/* Debug Info - Small Text - Show only current state */}
        <div className="flex items-center gap-3 text-xs text-gray-300">
          {/* Distance */}
          {distance > 0 && (
            <span className="font-mono">DIST: {formatDistance(distance)}</span>
          )}
          
          {/* Current Status - Show only the most relevant one */}
          {hasImpacted && <span className="text-gray-400 font-mono">[IMPACTED]</span>}
          {!hasImpacted && collisionDetected && <span className="text-red-400 font-mono">[COLLISION]</span>}
          {!hasImpacted && !collisionDetected && isOptimizing && <span className="text-yellow-400 font-mono">[OPTIMIZING]</span>}
          {!hasImpacted && !collisionDetected && !isOptimizing && isImpactTrajectorySet && <span className="text-blue-400 font-mono">[TRAJECTORY]</span>}
        </div>

        {/* Objects Legend - Horizontal */}
        <div className="flex items-center gap-3">
          {/* Earth */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-white text-xs">EARTH</span>
          </div>

          {/* Sun */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-white text-xs">SUN</span>
          </div>

          {/* Original Asteroid */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-white text-xs">ASTEROID</span>
          </div>

          {/* Deflected Asteroid - only show if active */}
          {showCollisionAsteroid && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-white text-xs">DEFLECTED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
