import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Slider } from "../ui/slider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Settings, ChevronDown, Monitor, Lightbulb, Star, Grid3X3, Zap, Clock, HelpCircle } from "lucide-react";

export interface SimulationSettings {
  // Display settings
  asteroidSize: number;
  showOrbits: boolean;
  showIntersections: boolean;
  showLabels: boolean;
  showAxis: boolean;

  // Camera settings
  cameraFov: number;
  cameraNear: number;
  cameraFar: number;

  // Lighting settings
  ambientIntensity: number;
  directionalIntensity: number;
  pointIntensity: number;

  // Stars settings
  starCount: number;
  starRadius: number;

  // Grid settings
  gridSize: number;
  gridDivisions: number;

  // Animation settings
  pulseDuration: number;
  pulseScaleFactor: number;

  // Physics settings
  asteroidDensity: number;
  impactAngle: number;
  collisionThreshold: number;

  // Timing settings
  timerUpdateInterval: number;
  loadingScreenDuration: number;
  defaultCollisionTime: number;
  defaultImpactTime: number;
}

interface SimulationSettingsProps {
  settings: SimulationSettings;
  onSettingsChange: (settings: SimulationSettings) => void;
  onReset: () => void;
}

export const SimulationSettings = ({
  settings,
  onSettingsChange,
  onReset,
}: SimulationSettingsProps) => {
  const [localSettings, setLocalSettings] = useState<SimulationSettings>(settings);
  const [openSection, setOpenSection] = useState<string>("display");

  // Sync local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Helper function to create tooltip labels
  const createTooltipLabel = (label: string, tooltip: string) => (
    <div className="flex items-center gap-2">
      <Label>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );

  const handleSettingChange = (key: keyof SimulationSettings, value: unknown) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleReset = () => {
    onReset();
    setLocalSettings(settings);
  };

  return (
    <TooltipProvider>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Simulation Settings</SheetTitle>
          <SheetDescription>
            Adjust various parameters to customize the asteroid impact simulation.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4 py-4 overflow-y-auto">
          {/* Display Settings */}
          <Collapsible open={openSection === "display"} onOpenChange={(open) => open && setOpenSection("display")}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-accent transition-colors">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Display Settings
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openSection === "display" ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 px-4 py-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="space-y-2">
                {createTooltipLabel("Asteroid Size", "Controls the visual size of the asteroid in the simulation. Higher values make the asteroid appear larger.")}
                <Slider
                  id="asteroid-size"
                  min={0.1}
                  max={5.0}
                  step={0.1}
                  value={[localSettings.asteroidSize]}
                  onValueChange={([value]) => handleSettingChange('asteroidSize', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.asteroidSize.toFixed(1)}x
                </div>
              </div>

              <div className="space-y-2">
                {createTooltipLabel("Camera Field of View", "Controls the camera's field of view angle. Higher values show more of the scene but may cause distortion.")}
                <Slider
                  id="camera-fov"
                  min={10}
                  max={120}
                  step={1}
                  value={[localSettings.cameraFov]}
                  onValueChange={([value]) => handleSettingChange('cameraFov', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.cameraFov}°
                </div>
              </div>

              <div className="space-y-2">
                {createTooltipLabel("Show Labels", "Toggle visibility of object labels and tooltips in the 3D scene.")}
                <div className="flex items-center space-x-2">
                  <input
                    id="show-labels"
                    type="checkbox"
                    checked={localSettings.showLabels}
                    onChange={(e) => handleSettingChange('showLabels', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="show-labels" className="text-sm">
                    Show object labels
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                {createTooltipLabel("Show Axis", "Toggle visibility of coordinate system axes (X, Y, Z) and grid in the 3D scene.")}
                <div className="flex items-center space-x-2">
                  <input
                    id="show-axis"
                    type="checkbox"
                    checked={localSettings.showAxis ?? true}
                    onChange={(e) => handleSettingChange('showAxis', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="show-axis" className="text-sm">
                    Show coordinate axes
                  </label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Lighting Settings */}
          <Collapsible open={openSection === "lighting"} onOpenChange={(open) => open && setOpenSection("lighting")}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-accent transition-colors">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Lighting Settings
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openSection === "lighting" ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 px-4 py-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="space-y-2">
                {createTooltipLabel("Ambient Light Intensity", "Controls the overall brightness of the scene. Higher values make everything brighter.")}
                <Slider
                  id="ambient-intensity"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[localSettings.ambientIntensity]}
                  onValueChange={([value]) => handleSettingChange('ambientIntensity', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.ambientIntensity.toFixed(1)}
                </div>
              </div>

              <div className="space-y-2">
                {createTooltipLabel("Directional Light Intensity", "Controls the intensity of the main directional light source (like the sun). Creates shadows and highlights.")}
                <Slider
                  id="directional-intensity"
                  min={0}
                  max={3}
                  step={0.1}
                  value={[localSettings.directionalIntensity]}
                  onValueChange={([value]) => handleSettingChange('directionalIntensity', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.directionalIntensity.toFixed(1)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="point-intensity">Point Light Intensity</Label>
                <Slider
                  id="point-intensity"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[localSettings.pointIntensity]}
                  onValueChange={([value]) => handleSettingChange('pointIntensity', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.pointIntensity.toFixed(1)}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Stars Settings */}
          <Collapsible open={openSection === "stars"} onOpenChange={(open) => open && setOpenSection("stars")}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-accent transition-colors">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Stars Settings
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openSection === "stars" ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 px-4 py-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="space-y-2">
                <Label htmlFor="star-count">Star Count</Label>
                <Slider
                  id="star-count"
                  min={100}
                  max={5000}
                  step={100}
                  value={[localSettings.starCount]}
                  onValueChange={([value]) => handleSettingChange('starCount', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.starCount} stars
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="star-radius">Star Radius</Label>
                <Slider
                  id="star-radius"
                  min={50}
                  max={500}
                  step={10}
                  value={[localSettings.starRadius]}
                  onValueChange={([value]) => handleSettingChange('starRadius', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.starRadius} units
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Grid Settings */}
          <Collapsible open={openSection === "grid"} onOpenChange={(open) => open && setOpenSection("grid")}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-accent transition-colors">
              <div className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Grid Settings
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openSection === "grid" ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 px-4 py-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="space-y-2">
                <Label htmlFor="grid-size">Grid Size</Label>
                <Slider
                  id="grid-size"
                  min={5}
                  max={50}
                  step={1}
                  value={[localSettings.gridSize]}
                  onValueChange={([value]) => handleSettingChange('gridSize', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.gridSize} units
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grid-divisions">Grid Divisions</Label>
                <Slider
                  id="grid-divisions"
                  min={5}
                  max={50}
                  step={1}
                  value={[localSettings.gridDivisions]}
                  onValueChange={([value]) => handleSettingChange('gridDivisions', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.gridDivisions} divisions
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Physics Settings */}
          <Collapsible open={openSection === "physics"} onOpenChange={(open) => open && setOpenSection("physics")}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-accent transition-colors">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Physics Settings
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openSection === "physics" ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 px-4 py-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="space-y-2">
                {createTooltipLabel("Asteroid Density (kg/m³)", "The density of the asteroid material. Typical rocky asteroids have densities between 2000-4000 kg/m³.")}
                <Input
                  id="asteroid-density"
                  type="number"
                  min={1000}
                  max={8000}
                  step={100}
                  value={localSettings.asteroidDensity}
                  onChange={(e) => handleSettingChange('asteroidDensity', parseFloat(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                {createTooltipLabel("Impact Angle (degrees)", "The angle at which the asteroid impacts the Earth. 0° is a grazing impact, 90° is a direct vertical impact.")}
                <Slider
                  id="impact-angle"
                  min={0}
                  max={90}
                  step={1}
                  value={[localSettings.impactAngle]}
                  onValueChange={([value]) => handleSettingChange('impactAngle', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.impactAngle}°
                </div>
              </div>

              <div className="space-y-2">
                {createTooltipLabel("Collision Threshold", "The distance at which the asteroid is considered to have collided with Earth. Smaller values require more precise collision detection.")}
                <Slider
                  id="collision-threshold"
                  min={0.05}
                  max={0.5}
                  step={0.01}
                  value={[localSettings.collisionThreshold]}
                  onValueChange={([value]) => handleSettingChange('collisionThreshold', value)}
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground">
                  {localSettings.collisionThreshold.toFixed(2)} units
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Timing Settings */}
          <Collapsible open={openSection === "timing"} onOpenChange={(open) => open && setOpenSection("timing")}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium hover:bg-accent transition-colors">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timing Settings
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openSection === "timing" ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 px-4 py-2 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
              <div className="space-y-2">
                <Label htmlFor="timer-interval">Timer Update Interval (ms)</Label>
                <Input
                  id="timer-interval"
                  type="number"
                  min={50}
                  max={1000}
                  step={50}
                  value={localSettings.timerUpdateInterval}
                  onChange={(e) => handleSettingChange('timerUpdateInterval', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loading-duration">Loading Screen Duration (ms)</Label>
                <Input
                  id="loading-duration"
                  type="number"
                  min={1000}
                  max={10000}
                  step={500}
                  value={localSettings.loadingScreenDuration}
                  onChange={(e) => handleSettingChange('loadingScreenDuration', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collision-time">Default Collision Time (days)</Label>
                <Input
                  id="collision-time"
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  value={localSettings.defaultCollisionTime}
                  onChange={(e) => handleSettingChange('defaultCollisionTime', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact-time">Default Impact Time (days)</Label>
                <Input
                  id="impact-time"
                  type="number"
                  min={1}
                  max={365}
                  step={0.5}
                  value={localSettings.defaultImpactTime}
                  onChange={(e) => handleSettingChange('defaultImpactTime', parseFloat(e.target.value))}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <SheetFooter className="flex gap-2">
          <Button onClick={handleReset} variant="outline">
            Reset to Defaults
          </Button>
          <SheetClose asChild>
            <Button>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    </TooltipProvider>
  );
};
