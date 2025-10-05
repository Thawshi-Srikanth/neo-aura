"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, PlayCircle, RotateCcw as ResetIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { SimulationSettings } from '../simulation/SimulationSettings';
import { useSettingsStore } from '../../store/settingsStore';

interface SpeedControlsProps {
  timeScale: number;
  onTimeScaleChange: (scale: number) => void;
  isVisible: boolean;
  onStartSimulation?: () => void;
  onResetSimulation?: () => void;
  hasImpacted?: boolean;
  isImpactTrajectorySet?: boolean;
}

const SPEED_PRESETS = [
  { label: '0.25x', value: 0.25 },
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
  { label: '4x', value: 4 },
  { label: '8x', value: 8 },
  { label: '16x', value: 16 },
];

const SpeedControls: React.FC<SpeedControlsProps> = ({
  timeScale,
  onTimeScaleChange,
  isVisible,
  onStartSimulation,
  onResetSimulation,
  hasImpacted = false,
  isImpactTrajectorySet = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(timeScale > 0);
  const [currentSpeedIndex, setCurrentSpeedIndex] = useState(2); // Default to 1x
  const { settings, setSettings, resetSettings } = useSettingsStore();

  // Update current speed index when timeScale changes externally
  useEffect(() => {
    const index = SPEED_PRESETS.findIndex(preset => preset.value === timeScale);
    if (index !== -1) {
      setCurrentSpeedIndex(index);
    }
    setIsPlaying(timeScale > 0);
  }, [timeScale]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onTimeScaleChange(0);
      setIsPlaying(false);
    } else {
      // Resume at the last selected speed or default to 1x
      const speed = SPEED_PRESETS[currentSpeedIndex]?.value || 1;
      onTimeScaleChange(speed);
      setIsPlaying(true);
    }
  }, [isPlaying, currentSpeedIndex, onTimeScaleChange]);

  const handleSpeedChange = useCallback((speed: number, index: number) => {
    onTimeScaleChange(speed);
    setCurrentSpeedIndex(index);
    setIsPlaying(speed > 0);
  }, [onTimeScaleChange]);

  const handlePreviousSpeed = useCallback(() => {
    const newIndex = Math.max(0, currentSpeedIndex - 1);
    const speed = SPEED_PRESETS[newIndex].value;
    handleSpeedChange(speed, newIndex);
  }, [currentSpeedIndex, handleSpeedChange]);

  const handleNextSpeed = useCallback(() => {
    const newIndex = Math.min(SPEED_PRESETS.length - 1, currentSpeedIndex + 1);
    const speed = SPEED_PRESETS[newIndex].value;
    handleSpeedChange(speed, newIndex);
  }, [currentSpeedIndex, handleSpeedChange]);

  const handleReset = useCallback(() => {
    onTimeScaleChange(1);
    setCurrentSpeedIndex(2); // Reset to 1x
    setIsPlaying(true);
  }, [onTimeScaleChange]);

  // Keyboard shortcuts removed to prevent conflicts with terminal input

  if (!isVisible) return null;

  const currentPreset = SPEED_PRESETS[currentSpeedIndex];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className='bg-black/90 backdrop-blur-xl  rounded-xl p-4 shadow-2xl'>
        <div className="flex items-center gap-4">
          {/* Simulation Control Group */}
          <ButtonGroup>
            {/* Start Simulation Button */}
            {onStartSimulation && (
              <Button
                onClick={onStartSimulation}
                disabled={isImpactTrajectorySet && !hasImpacted}
                variant={isImpactTrajectorySet && !hasImpacted ? "secondary" : "default"}
                size="sm"

              >
                <PlayCircle className="w-4 h-4" />
                Start Simulation
              </Button>
            )}

            {/* Reset Simulation Button */}
            {onResetSimulation && (
              <Button
                onClick={onResetSimulation}
                disabled={!hasImpacted}
                variant={!hasImpacted ? "secondary" : "destructive"}
                size="sm"
                className="gap-2"
              >
                <ResetIcon className="w-4 h-4" />
                Reset Mission
              </Button>
            )}
          </ButtonGroup>

          {/* Playback Control Group */}
          <ButtonGroup>
            <Button
              onClick={handlePlayPause}
              disabled={!isImpactTrajectorySet || hasImpacted}
              variant="secondary"
              size="icon"

            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
          </ButtonGroup>

          {/* Speed Control Group - Always Functional */}
          <ButtonGroup>
            <Button
              onClick={handlePreviousSpeed}
              variant="secondary"
              size="icon"

            >
              <SkipBack className="w-4 h-4" />
            </Button>

            {/* Speed Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"

                >
                  <span className="font-mono text-sm">{currentPreset?.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" >
                <DropdownMenuGroup>

                  <DropdownMenuRadioGroup
                    value={timeScale.toString()}
                    onValueChange={(value) => {
                      const speed = parseFloat(value);
                      const index = SPEED_PRESETS.findIndex(preset => preset.value === speed);
                      if (index !== -1) {
                        handleSpeedChange(speed, index);
                      }
                    }}
                  >
                    {SPEED_PRESETS.map((preset) => (
                      <DropdownMenuRadioItem
                        key={preset.value}
                        value={preset.value.toString()}
                      >
                        <span className="font-mono text-sm">{preset.label}</span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={handleNextSpeed}
              variant="secondary"
              size="icon"

            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleReset}
              variant="secondary"
              size="icon"

            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </ButtonGroup>

          {/* Deflect Asteroid Button - Always Visible */}
          <ButtonGroup>
            <Button
              onClick={() => {
                // This will be handled by the DeflectAsteroidButton component
                // We need to trigger the terminal opening
                const event = new CustomEvent('openDeflectTerminal');
                window.dispatchEvent(event);
              }}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              🚨 Deflect Asteroid
            </Button>
          </ButtonGroup>

          {/* Settings Button */}
          <div className="ml-4">
            <SimulationSettings
              settings={settings}
              onSettingsChange={setSettings}
              onReset={resetSettings}
            />
          </div>
        </div>


      </div>
    </div>
  );
};

export default SpeedControls;
