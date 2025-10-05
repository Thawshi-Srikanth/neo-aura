// Simulation timing constants
export const SIMULATION_CONSTANTS = {
  // Timer update frequency (milliseconds)
  TIMER_UPDATE_INTERVAL: 100,
  
  // Loading screen duration (milliseconds)
  LOADING_SCREEN_DURATION: 3000,
  
  // Default collision time (days)
  DEFAULT_COLLISION_TIME: 20,
  
  // Default impact time (days)
  DEFAULT_IMPACT_TIME: 12.5,
  
  // Animation settings
  ANIMATION: {
    // Pulsing animation settings
    PULSE_DURATION: 2000,
    PULSE_SCALE_FACTOR: 0.15,
    PULSE_FRAME_RATE: 60,
  },
  
  // Display settings
  DISPLAY: {
    DEFAULT_ASTEROID_SIZE: 1.0,
    DEFAULT_SHOW_ORBITS: true,
    DEFAULT_SHOW_INTERSECTIONS: false,
  },
  
  // Camera settings
  CAMERA: {
    POSITION: [0, 5, 8] as [number, number, number],
    FOV: 45,
    NEAR: 0.001,
    FAR: 1000,
  },
  
  // Orbit controls settings
  ORBIT_CONTROLS: {
    MAX_DISTANCE: 50,
    MIN_DISTANCE: 0.01,
    ZOOM_SPEED: 1.2,
    PAN_SPEED: 0.8,
    ROTATE_SPEED: 0.5,
  },
  
  // Lighting settings
  LIGHTING: {
    AMBIENT_INTENSITY: 0.6,
    DIRECTIONAL_INTENSITY: 1.0,
    DIRECTIONAL_POSITION: [10, 10, 5] as [number, number, number],
    POINT_INTENSITY: 0.8,
    POINT_POSITION: [0, 0, 0] as [number, number, number],
    POINT_COLOR: "#ffffff",
  },
  
  // Stars settings
  STARS: {
    COUNT: 1200,
    FADE: true,
    RADIUS: 200,
  },
  
  // Grid settings
  GRID: {
    SIZE: 20,
    DIVISIONS: 20,
    COLOR1: "#444444",
    COLOR2: "#222222",
  },
  
  // Axis settings
  AXES: {
    LENGTH: 2,
    HEAD_LENGTH: 0.1,
    HEAD_WIDTH: 0.05,
    COLORS: {
      X: 0xff0000, // Red
      Y: 0x00ff00, // Green
      Z: 0x0000ff, // Blue
    },
  },
  
  // Intersection search settings
  INTERSECTION_SEARCH: {
    MAX_DAYS: 365 * 2,
  },
} as const;
