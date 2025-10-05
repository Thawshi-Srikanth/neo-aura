import type { ImpactData } from "../types/simulation";
import { estimateImpact } from "../utils/physics";

interface InfoPanelProps {
  asteroidId: string;
  impactPosition: string | null;
  timeToImpact: number | null;
  countdown: number | null;
  impactData: ImpactData | null;
  onReset: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  asteroidId,
  impactPosition,
  timeToImpact,
  countdown,
  impactData,
  onReset,
}) => {
  return (
    <div className="absolute top-6 left-6 w-80 z-40">
      {/* Main Status Panel */}
      <div className="glass-panel p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">MISSION STATUS</h2>
          <div className="status-indicator status-info">
            {impactPosition ? "IMPACT" : "MONITORING"}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="data-display">
            <div className="text-xs text-white/60 uppercase tracking-wider mb-1">Asteroid ID</div>
            <div className="text-sm font-mono text-white">{asteroidId}</div>
          </div>
          
          {timeToImpact !== null && countdown !== null && countdown > 0 && (
            <div className="data-display border-red-500/50 bg-red-900/20">
              <div className="text-xs text-red-400 uppercase tracking-wider mb-1">Impact Warning</div>
              <div className="text-lg font-mono text-red-300">{countdown.toFixed(2)}s</div>
            </div>
          )}
        </div>
      </div>

      {/* Impact Analysis Panel */}
      {impactData && (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">IMPACT ANALYSIS</h3>
            <div className="status-indicator status-danger">ANALYZED</div>
          </div>
          
          <div className="space-y-4">
            <div className="data-display">
              <div className="text-xs text-white/60 uppercase tracking-wider mb-2">Impact Location</div>
              <div className="text-sm text-white">
                {impactData.lat.toFixed(2)}°N, {impactData.lon.toFixed(2)}°E
              </div>
              <div className="text-xs text-white/80 mt-1">
                {impactData.isLand ? "🏔️ Land Impact" : "🌊 Ocean Impact"}
              </div>
            </div>
            
            <div className="data-display">
              <div className="text-xs text-white/60 uppercase tracking-wider mb-2">Energy Analysis</div>
              {(() => {
                const est = estimateImpact({
                  diameterKm: 0.3,
                  velocityKmPerS: 20,
                });
                return (
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/80">Energy:</span>
                      <span className="text-white font-mono">{est.kineticEnergyMt.toFixed(1)} Mt TNT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Crater:</span>
                      <span className="text-white font-mono">~{est.finalCraterDiameterKm.toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Seismic:</span>
                      <span className="text-white font-mono">~{est.momentMagnitudeEstimate.toFixed(1)} Mw</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <button 
              onClick={onReset}
              className="w-full bg-red-900/30 border border-red-600/50 text-red-400 hover:bg-red-900/50 hover:border-red-600 transition-all duration-200"
            >
              Reset Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
