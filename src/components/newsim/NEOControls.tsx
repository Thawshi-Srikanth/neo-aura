import { useState } from "react";

interface NEOControlsProps {
  onSettingsChange: (settings: NEOSettings) => void;
  onOpenPlanetaryDefense?: () => void;
}

export interface NEOSettings {
  showNEOs: boolean;
  showOrbits: boolean;
  showSun: boolean;
  showEarth: boolean;
  showEarthOrbit: boolean;
  neoColor: string;
  neoSize: number;
  blinkSpeed: number;
  maxNEOs: number;
  speedMultiplier: number;
}

type TabType = "visibility" | "appearance" | "animation" | "data";

const NEOControls: React.FC<NEOControlsProps> = ({
  onSettingsChange,
  onOpenPlanetaryDefense,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("visibility");
  const [settings, setSettings] = useState<NEOSettings>({
    showNEOs: true,
    showOrbits: true,
    showSun: true,
    showEarth: true,
    showEarthOrbit: true,
    neoColor: "#ffff00",
    neoSize: 0.005,
    blinkSpeed: 1.0,
    maxNEOs: 10,
    speedMultiplier: 10,
  });

  const updateSetting = <K extends keyof NEOSettings>(
    key: K,
    value: NEOSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const tabs = [
    { id: "visibility" as TabType, label: "Visibility", icon: "👁️" },
    { id: "appearance" as TabType, label: "Appearance", icon: "🎨" },
    { id: "animation" as TabType, label: "Animation", icon: "⚡" },
    { id: "data" as TabType, label: "Data", icon: "📊" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "visibility":
        return (
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.showNEOs}
                onChange={(e) => updateSetting("showNEOs", e.target.checked)}
                className="rounded"
              />
              <span>Show NEOs</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.showOrbits}
                onChange={(e) => updateSetting("showOrbits", e.target.checked)}
                className="rounded"
              />
              <span>Show NEO Orbital Paths</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.showSun}
                onChange={(e) => updateSetting("showSun", e.target.checked)}
                className="rounded"
              />
              <span>Show Sun</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.showEarth}
                onChange={(e) => updateSetting("showEarth", e.target.checked)}
                className="rounded"
              />
              <span>Show Earth</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.showEarthOrbit}
                onChange={(e) =>
                  updateSetting("showEarthOrbit", e.target.checked)
                }
                className="rounded"
              />
              <span>Show Earth Orbit</span>
            </label>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-yellow-300 font-semibold mb-2">
                NEO Settings
              </h4>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm">NEO Color:</span>
                  <input
                    type="color"
                    value={settings.neoColor}
                    onChange={(e) => updateSetting("neoColor", e.target.value)}
                    className="w-full h-8 rounded border-0 mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-sm">
                    NEO Size: {settings.neoSize.toFixed(3)}
                  </span>
                  <input
                    type="range"
                    min="0.001"
                    max="0.02"
                    step="0.001"
                    value={settings.neoSize}
                    onChange={(e) =>
                      updateSetting("neoSize", parseFloat(e.target.value))
                    }
                    className="w-full mt-1"
                  />
                </label>
                <label className="block">
                  <span className="text-sm">
                    Blink Speed: {settings.blinkSpeed.toFixed(1)}
                  </span>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={settings.blinkSpeed}
                    onChange={(e) =>
                      updateSetting("blinkSpeed", parseFloat(e.target.value))
                    }
                    className="w-full mt-1"
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-3">
              <h4 className="text-yellow-300 font-semibold mb-2">
                Trail Settings
              </h4>
              <div className="space-y-3"></div>
            </div>
          </div>
        );

      case "animation":
        return (
          <div className="space-y-3">
            <h4 className="text-yellow-300 font-semibold mb-2">
              Animation Speed
            </h4>
            <label className="block">
              <span className="text-sm">
                Speed: {settings.speedMultiplier}x
              </span>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={settings.speedMultiplier}
                onChange={(e) =>
                  updateSetting("speedMultiplier", parseInt(e.target.value))
                }
                className="w-full mt-1"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>10x</span>
                <span>1000x</span>
              </div>
            </label>
            <div className="text-xs text-gray-400 mt-2">
              Controls the speed of all orbital movements including Earth and
              NEOs
            </div>
          </div>
        );

      case "data":
        return (
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm">Max NEOs: {settings.maxNEOs}</span>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={settings.maxNEOs}
                onChange={(e) =>
                  updateSetting("maxNEOs", parseInt(e.target.value))
                }
                className="w-full mt-1"
              />
            </label>
            <div className="text-xs text-gray-400 mt-2">
              Fetches real data from NASA's NEO API. Higher values may take
              longer to load.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-20 space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-lg block w-full"
      >
        NEO Controls {isOpen ? "←" : "→"}
      </button>

      {onOpenPlanetaryDefense && (
        <button
          onClick={onOpenPlanetaryDefense}
          className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg flex items-center gap-2 w-full"
        >
          🛡️ Planetary Defense
        </button>
      )}

      {isOpen && (
        <div className="mt-2 bg-gray-800 rounded-lg text-white shadow-2xl border border-gray-700 w-80">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold">NEO Settings</h3>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-xs">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Tab Content - Scrollable */}
          <div className="p-4 max-h-70 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default NEOControls;
