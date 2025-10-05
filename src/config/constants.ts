// Visual constants for the 3D scene
export const VISUAL_SCALE = 1; // scale down for visibility
export const EARTH_RADIUS = 1; // visual radius of Earth
export const EARTH_CLOUD_OFFSET = 0.01; // offset for cloud layer
export const SCALED_EARTH_RADIUS = 0.01; // offset for cloud layer

// Animation constants
export const EARTH_ROTATION_SPEED = 0.0015;
export const CLOUDS_ROTATION_SPEED = 0.0018;

// Camera settings
export const CAMERA_SETTINGS = {
  position: [0, 0, 5],
  fov: 60,
} as const;

// Orbit control limits
export const ORBIT_CONTROLS = {
  maxDistance: 20,
  minDistance: 0,
} as const;

// Light settings
export const LIGHT_SETTINGS = {
  ambient: {
    intensity: 0.2,
  },
  directional: {
    position: [5, 5, 5],
    intensity: 10,
  },
} as const;

// Astronomical units and other physical constants
export const AU_IN_KM = 149597870.7; // Astronomical Unit in kilometers
export const EARTH_RADIUS_KM = 6371; // Earth's radius in kilometers
export const SUN_RADIUS_KM = 696000; // Sun's radius in kilometers
export const KM_PER_S_TO_M_PER_S = 1000; // velocity conversion
export const SECONDS_PER_DAY = 86400;

// Solar system simulation scaling
// In reality: Sun radius = 696,000 km, Earth radius = 6,371 km, 1 AU = 149,597,870 km
// For visualization, we need to scale distances and sizes differently

// Distance scaling: 1 AU = 2 units in 3D space (so Earth orbits at distance 2 from Sun)
export const AU_TO_UNITS = 2.0;

// Size scaling for celestial bodies (exaggerated for visibility)
export const SUN_VISUAL_RADIUS = 0.15; // Sun visual radius in 3D units (larger for better visibility)
export const EARTH_VISUAL_RADIUS = 0.08; // Earth visual radius in 3D units (larger for better visibility)
export const ASTEROID_VISUAL_RADIUS = 0.008; // Asteroid visual radius in 3D units (much smaller than Earth)
export const COLLISION_ASTEROID_VISUAL_RADIUS = 0.012; // Collision asteroid slightly larger for visibility

// Time scaling
export const DAYS_PER_SECOND = 1; // How many simulation days pass per real second

// Derived constants
export const EARTH_ORBIT_RADIUS = 1.0 * AU_TO_UNITS; // Earth orbits at 1 AU
export const SCALED_AU = AU_TO_UNITS; // 1 AU in simulation units

// Legacy scale for backward compatibility
export const SCALE = EARTH_VISUAL_RADIUS / EARTH_RADIUS_KM;
