import { create } from "zustand";
import type { Asteroid } from "../types/asteroid";

interface AsteroidState {
  asteroids: Asteroid[];
  selectedAsteroid: {
    asteroid: Asteroid;
    position: [number, number, number];
  } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAsteroids: (asteroids: Asteroid[]) => void;
  addAsteroid: (asteroid: Asteroid) => void;
  setSelectedAsteroid: (
    selection: { asteroid: Asteroid; position: [number, number, number] } | null
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAsteroids: () => void;
}

export const useAsteroidStore = create<AsteroidState>((set) => ({
  asteroids: [],
  selectedAsteroid: null,
  isLoading: false,
  error: null,

  setAsteroids: (asteroids) => set({ asteroids, error: null }),
  addAsteroid: (asteroid) =>
    set((state) => ({
      asteroids: [...state.asteroids, asteroid],
    })),
  setSelectedAsteroid: (selection) => set({ selectedAsteroid: selection }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  clearAsteroids: () =>
    set({ asteroids: [], selectedAsteroid: null, error: null }),
}));
