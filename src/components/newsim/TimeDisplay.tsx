import React from "react";
import {
  Calendar,
  RotateCcw,
  Play,
  Pause,
  FastForward,
  Rewind,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

interface TimeDisplayProps {
  currentTime: number;
  speedMultiplier?: number;
  isPlaying?: boolean;
  onTimeChange?: (time: number) => void;
  onPlayPause?: () => void;
  onReset?: () => void;
  onSpeedChange?: (speed: number) => void;
  minTime?: number;
  maxTime?: number;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({
  currentTime,
  speedMultiplier = 1,
  isPlaying = true,
  onTimeChange,
  onPlayPause,
  onReset,
  onSpeedChange,
  minTime,
  maxTime,
}) => {
  const navigate = useNavigate();
  // Convert days since J2000.0 epoch to actual date
  const j2000 = new Date("2000-01-01T12:00:00Z");
  const currentDate = new Date(
    j2000.getTime() + currentTime * 24 * 60 * 60 * 1000
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  };

  // Check if we're showing current time or future/past
  const now = new Date();
  const isCurrentTime =
    Math.abs(currentDate.getTime() - now.getTime()) < 24 * 60 * 60 * 1000; // Within 24 hours
  const isInFuture = currentDate > now;

  // Time control setup
  const currentTimeInDays =
    (now.getTime() - j2000.getTime()) / (1000 * 60 * 60 * 24);
  const minTimeRange = minTime ?? currentTimeInDays - 365;
  const maxTimeRange = maxTime ?? currentTimeInDays + 365 * 10;

  const formatTimeLabel = (time: number) => {
    const date = new Date(j2000.getTime() + time * 24 * 60 * 60 * 1000);
    const diffDays = Math.floor(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (Math.abs(diffDays) < 1) {
      return "Today";
    } else if (diffDays > 0) {
      return `+${diffDays}d`;
    } else {
      return `${diffDays}d`;
    }
  };

  const speedOptions = [0.1, 0.5, 1, 5, 10, 50, 100, 500, 1000];

  return (
    <div className="absolute top-4 left-4 z-30 bg-black bg-opacity-90 backdrop-blur-sm text-white p-4 rounded-lg border border-gray-700 min-w-96">
      <div className="flex flex-col gap-3">
        {/* Back Button - Top */}
        <div className="flex">
          <Button
            onClick={() => navigate('/')}
            variant="secondary"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <ArrowLeft size={14} />
            Back
          </Button>
        </div>

        {/* Time Display Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-400" />
            <div className="font-semibold text-blue-300 flex items-center gap-2">
              Simulation Time
              {isCurrentTime && (
                <span className="text-xs bg-green-600 px-2 py-1 rounded">
                  LIVE
                </span>
              )}
              {isInFuture && !isCurrentTime && (
                <span className="text-xs bg-yellow-600 px-2 py-1 rounded">
                  FUTURE
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-400">🛰️ NASA NEO Data</div>
        </div>

        {/* Date and Time Display */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Date</div>
            <div className="font-medium text-white">
              {formatDate(currentDate)}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Time (UTC)</div>
            <div className="font-medium text-white">
              {formatTime(currentDate).split(" ")[0]}
            </div>
          </div>
        </div>

        {/* Time Controls - Only show if functions are provided */}
        {onTimeChange && (
          <>
            {/* Time Slider */}
            <div className="flex items-center gap-3 mt-5">
              <span className="text-xs text-gray-400 w-12">Scrub:</span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={minTimeRange}
                  max={maxTimeRange}
                  step={0.5}
                  value={currentTime}
                  onChange={(e) => onTimeChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer time-slider"
                />
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-blue-600 px-2 py-1 rounded">
                  {formatTimeLabel(currentTime)}
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Rewind */}
                <button
                  onClick={() =>
                    onTimeChange(Math.max(minTimeRange, currentTime - 30))
                  }
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition-colors"
                  title="Rewind 30 days"
                >
                  <Rewind size={14} />
                </button>

                {/* Play/Pause */}
                {onPlayPause && (
                  <button
                    onClick={onPlayPause}
                    className={`p-2 rounded transition-colors ${
                      isPlaying
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                )}

                {/* Fast Forward */}
                <button
                  onClick={() =>
                    onTimeChange(Math.min(maxTimeRange, currentTime + 30))
                  }
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition-colors"
                  title="Fast forward 30 days"
                >
                  <FastForward size={14} />
                </button>

                {/* Reset */}
                {onReset && (
                  <button
                    onClick={onReset}
                    className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded transition-colors ml-2"
                    title="Reset to current date"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              {/* Speed Control */}
              {onSpeedChange && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Speed:</span>
                  <select
                    value={speedMultiplier}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    className="bg-gray-700 text-white px-2 py-1 rounded text-xs border border-gray-600"
                  >
                    {speedOptions.map((speed) => (
                      <option key={speed} value={speed}>
                        {speed}x
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </>
        )}

        {/* Status Info */}
        <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 flex items-center justify-between">
          <span>Live orbital tracking</span>
          {speedMultiplier !== 1 && (
            <span className="text-yellow-400">
              ⚡ {speedMultiplier}x {speedMultiplier < 1 ? "Slow" : "Fast"}
            </span>
          )}
        </div>
      </div>

      <style>{`
        .time-slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1E40AF;
        }
        .time-slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #1E40AF;
        }
      `}</style>
    </div>
  );
};

export default TimeDisplay;
