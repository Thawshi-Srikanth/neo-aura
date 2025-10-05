import { create } from 'zustand';

interface SimulationState {
  speed: number;
  setSpeed: (speed: number) => void;
  trailThickness: number;
  setTrailThickness: (thickness: number) => void;
  trailLength: number;
  setTrailLength: (length: number) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  speed: 1,
  setSpeed: (speed) => set({ speed }),
  trailThickness: 0.005,
  setTrailThickness: (thickness) => set({ trailThickness: thickness }),
  trailLength: 0.2,
  setTrailLength: (length) => set({ trailLength: length }),
}));
