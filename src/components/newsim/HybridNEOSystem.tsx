import React from "react";

import type { Asteroid } from "../../types/asteroid";

// This file is deprecated - use RouterSafeNEOSystem instead
// Keeping as placeholder to avoid import errors

interface HybridNEOSystemProps {
  asteroids: Asteroid[];
  currentTime: number;
  showNEOs?: boolean;
  neoColor?: string;
  neoSize?: number;
  blinkSpeed?: number;
  lodDistance?: number;
  maxRenderDistance?: number;
  onNEOClick?: (asteroid: Asteroid, position: [number, number, number]) => void;
  selectedNEOId?: string | null;
}

/**
 * @deprecated Use RouterSafeNEOSystem instead
 * This component has been replaced with a router-safe implementation
 */
const HybridNEOSystem: React.FC<HybridNEOSystemProps> = () => {
  console.warn(
    "HybridNEOSystem is deprecated. Use RouterSafeNEOSystem instead."
  );
  return null;
};

export default HybridNEOSystem;
