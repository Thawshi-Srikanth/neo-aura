import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SimulationSettings } from '../components/simulation/SimulationSettings';

const defaultSettings: SimulationSettings = {
  // Display settings
  asteroidSize: 1.0,
  showOrbits: true,
  showIntersections: false,
  showLabels: true,
  showAxis: true,
  
  // Camera settings
  cameraFov: 45,
  cameraNear: 0.001,
  cameraFar: 1000,
  
  // Lighting settings
  ambientIntensity: 0.6,
  directionalIntensity: 1.0,
  pointIntensity: 0.8,
  
  // Stars settings
  starCount: 1200,
  starRadius: 200,
  
  // Grid settings
  gridSize: 20,
  gridDivisions: 20,
  
  // Animation settings
  pulseDuration: 2000,
  pulseScaleFactor: 0.15,
  
  // Physics settings
  asteroidDensity: 3000,
  impactAngle: 45,
  collisionThreshold: 0.15,
  
  // Timing settings
  timerUpdateInterval: 100,
  loadingScreenDuration: 3000,
  defaultCollisionTime: 20,
  defaultImpactTime: 12.5,
};

interface SettingsState {
  settings: SimulationSettings;
  setSettings: (settings: SimulationSettings) => void;
  updateSetting: <K extends keyof SimulationSettings>(
    key: K,
    value: SimulationSettings[K]
  ) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set,) => ({
      settings: defaultSettings,
      setSettings: (settings) => set({ settings }),
      updateSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'simulation-settings',
      migrate: (persistedState: any, _version: number) => {
        // Migrate old settings to include new properties
        if (persistedState && persistedState.settings) {
          return {
            ...persistedState,
            settings: {
              ...defaultSettings,
              ...persistedState.settings,
            }
          };
        }
        return persistedState;
      },
    }
  )
);
