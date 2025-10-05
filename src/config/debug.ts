// Debug configuration for deflection testing
export const DEBUG_CONFIG = {
  // Set to true to enable debug controls
  ENABLE_DEBUG_CONTROLS: import.meta.env.VITE_DEBUG_MODE === 'true' || 
                         import.meta.env.DEV || // Enable in development mode
                         localStorage.getItem('debug_mode') === 'true' || // Fallback to localStorage
                         false,
  
  // Debug deflection controls
  FORCE_DEFLECTION_SUCCESS: false,
  FORCE_DEFLECTION_FAILURE: false,
  
  // Override physics calculations for testing
  OVERRIDE_SUCCESS_RATE: null as number | null, // 0-1, null for normal calculation
  OVERRIDE_ENERGY_REQUIRED: null as number | null, // Joules, null for normal calculation
};

// Debug helper functions
export const DebugControls = {
  /**
   * Force deflection to succeed (debug only)
   */
  forceSuccess(): void {
    if (!DEBUG_CONFIG.ENABLE_DEBUG_CONTROLS) return;
    DEBUG_CONFIG.FORCE_DEFLECTION_SUCCESS = true;
    DEBUG_CONFIG.FORCE_DEFLECTION_FAILURE = false;
    console.log('🔧 DEBUG: Forcing deflection success');
  },

  /**
   * Force deflection to fail (debug only)
   */
  forceFailure(): void {
    if (!DEBUG_CONFIG.ENABLE_DEBUG_CONTROLS) return;
    DEBUG_CONFIG.FORCE_DEFLECTION_SUCCESS = false;
    DEBUG_CONFIG.FORCE_DEFLECTION_FAILURE = true;
    console.log('🔧 DEBUG: Forcing deflection failure');
  },

  /**
   * Reset to normal physics calculations
   */
  resetToNormal(): void {
    if (!DEBUG_CONFIG.ENABLE_DEBUG_CONTROLS) return;
    DEBUG_CONFIG.FORCE_DEFLECTION_SUCCESS = false;
    DEBUG_CONFIG.FORCE_DEFLECTION_FAILURE = false;
    DEBUG_CONFIG.OVERRIDE_SUCCESS_RATE = null;
    DEBUG_CONFIG.OVERRIDE_ENERGY_REQUIRED = null;
    console.log('🔧 DEBUG: Reset to normal physics');
  },

  /**
   * Override success rate for testing
   */
  setSuccessRate(rate: number): void {
    if (!DEBUG_CONFIG.ENABLE_DEBUG_CONTROLS) return;
    DEBUG_CONFIG.OVERRIDE_SUCCESS_RATE = Math.max(0, Math.min(1, rate));
    console.log(`🔧 DEBUG: Override success rate to ${rate * 100}%`);
  },

  /**
   * Override energy required for testing
   */
  setEnergyRequired(energy: number): void {
    if (!DEBUG_CONFIG.ENABLE_DEBUG_CONTROLS) return;
    DEBUG_CONFIG.OVERRIDE_ENERGY_REQUIRED = energy;
    console.log(`🔧 DEBUG: Override energy required to ${energy} J`);
  },

  /**
   * Get current debug status
   */
  getStatus(): string {
    if (!DEBUG_CONFIG.ENABLE_DEBUG_CONTROLS) {
      return 'Debug controls disabled';
    }
    
    return `Debug Status:
- Force Success: ${DEBUG_CONFIG.FORCE_DEFLECTION_SUCCESS}
- Force Failure: ${DEBUG_CONFIG.FORCE_DEFLECTION_FAILURE}
- Override Success Rate: ${DEBUG_CONFIG.OVERRIDE_SUCCESS_RATE || 'Normal'}
- Override Energy: ${DEBUG_CONFIG.OVERRIDE_ENERGY_REQUIRED || 'Normal'}`;
  }
};

// Make debug controls available globally in debug mode
if (DEBUG_CONFIG.ENABLE_DEBUG_CONTROLS) {
  (window as any).debugDeflection = DebugControls;
  console.log('🔧 Debug controls available: window.debugDeflection');
  console.log('Available commands:');
  console.log('  debugDeflection.forceSuccess()');
  console.log('  debugDeflection.forceFailure()');
  console.log('  debugDeflection.resetToNormal()');
  console.log('  debugDeflection.setSuccessRate(0.5)');
  console.log('  debugDeflection.setEnergyRequired(1e12)');
  console.log('  debugDeflection.getStatus()');
}
