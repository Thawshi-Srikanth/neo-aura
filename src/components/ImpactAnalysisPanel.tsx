import React from 'react';
import type { ImpactData } from '../types/simulation';
import type { Asteroid } from '../types/asteroid';
import { Card, CardContent } from '@/components/ui/card';
import { Asteroid3D } from '@/components/visualizations/Asteroid3D';
import { Impact3D } from '@/components/visualizations/Impact3D';
import { Seismic3D } from '@/components/visualizations/Seismic3D';
import { DamageZone3D } from '@/components/visualizations/DamageZone3D';
import { Energy3D } from '@/components/visualizations/Energy3D';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';


interface ImpactAnalysisPanelProps {
  impactData: ImpactData | null;
  asteroid: Asteroid;
  onClose?: () => void;
}


// Utility function to format scientific notation with superscript
const formatScientificNotation = (value: number, precision: number = 2): string => {
  if (value === 0) return '0';

  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exponent);

  // Convert exponent to superscript
  const superscriptMap: { [key: string]: string } = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵',
    '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻'
  };

  const formatExponent = (exp: number): string => {
    const expStr = exp.toString();
    return expStr.split('').map(char => superscriptMap[char] || char).join('');
  };

  if (exponent >= 6) {
    return `${mantissa.toFixed(precision)} × 10${formatExponent(exponent)}`;
  } else if (exponent >= 3) {
    return `${(value / 1000).toFixed(precision)}K`;
  } else if (exponent >= 0) {
    return value.toFixed(precision);
  } else {
    return `${mantissa.toFixed(precision)} × 10${formatExponent(exponent)}`;
  }
};

// Utility function to format large numbers with appropriate units
const formatLargeNumber = (value: number, unit: string = ''): string => {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T${unit}`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B${unit}`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M${unit}`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K${unit}`;
  } else {
    return `${value.toFixed(2)}${unit}`;
  }
};

export const ImpactAnalysisPanel: React.FC<ImpactAnalysisPanelProps> = ({
  impactData,
  asteroid,
}) => {
  if (!impactData) return null;
  if (!impactData.physics) return null;

  const { physics } = impactData;

  return (
    <div className="fixed top-4 right-4 z-50">

      <Carousel className="w-full max-w-xs">
        <CarouselContent>
          {/* Asteroid Overview Slide */}
          <CarouselItem >
            <div className="p-1">
              <Card className="bg-black/95  text-white h-full">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center w-full">
                    <div className="mb-4 relative">
                      <Asteroid3D
                        diameter={asteroid.estimated_diameter.meters.estimated_diameter_max}
                        className="h-24 mx-auto"
                      />
                    </div>
                    <div className="text-2xl font-bold mb-2 text-white">{asteroid.name}</div>
                    <div className="text-sm text-white/70 mb-2">
                      {asteroid.estimated_diameter.meters.estimated_diameter_min.toFixed(0)}-{asteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(0)}m
                    </div>
                    <div className="text-xs text-white/60 mb-1">Diameter Range</div>
                    <div className="text-xs text-white/60">
                      Velocity: {asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_second || 'N/A'} km/s
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>

          {/* Impact Location Slide */}
          <CarouselItem>
            <div className="p-1 h-full  ">
              <Card className="bg-black/95  text-white h-full">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center w-full">
                    <div className="mb-4 relative">
                      <div className="w-20 h-20 mx-auto flex items-center justify-center">
                        <div className="text-4xl">🌍</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold mb-2 text-white">
                      Impact Location
                    </div>
                    <div className="text-lg text-white/90 mb-1">
                      {impactData.lat.toFixed(2)}°N, {impactData.lon.toFixed(2)}°E
                    </div>
                    <div className="text-sm text-white/70 mb-2">
                      {impactData.isLand ? 'Land Impact' : 'Ocean Impact'}
                    </div>
                    <div className="text-xs text-white/60">
                      {physics.impactDescription}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>

          {/* Risk Assessment Slide */}
          <CarouselItem>
            <div className="p-1 h-full">
              <Card className="bg-black/95  text-white">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center w-full">
                    <div className="mb-4 relative">
                      <Energy3D
                        kineticEnergy={physics.kineticEnergy}
                        tntEquivalent={physics.tntEquivalent}
                        className="h-24 mx-auto"
                      />
                    </div>
                    <div className="text-2xl font-bold mb-2 text-white">{physics.riskLevel.toUpperCase()}</div>
                    <div className="text-sm text-white/70 mb-2">
                      {physics.tntEquivalent >= 1
                        ? `${physics.tntEquivalent.toFixed(1)} MT`
                        : `${(physics.tntEquivalent * 1000).toFixed(0)} KT`}
                    </div>
                    <div className="text-xs text-white/60 mb-1">TNT Equivalent</div>
                    <div className="text-xs text-white/60">
                      Risk Level: {physics.riskLevel}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>

          {/* Physical Properties Slide */}
          <CarouselItem>
            <div className="p-1 h-full">
              <Card className="bg-black/95  text-white h-full">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center w-full">
                    <div className="mb-4 relative">
                      <Asteroid3D
                        diameter={asteroid.estimated_diameter.meters.estimated_diameter_max}
                        className="h-24 mx-auto"
                      />
                    </div>
                    <div className="text-2xl font-bold mb-2 text-white">
                      {formatLargeNumber(physics.mass, ' kg')}
                    </div>
                    <div className="text-sm text-white/70 mb-2">Mass</div>
                    <div className="text-xs text-white/60 mb-1">
                      Velocity: {asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_second || 'N/A'} km/s
                    </div>
                    <div className="text-xs text-white/60">
                      KE: {formatScientificNotation(physics.kineticEnergy)} J
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>

          {/* Impact Crater Slide */}
          <CarouselItem>
            <div className="p-1 h-full">
              <Card className="bg-black/95  text-white">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center w-full">
                    <div className="mb-4 relative">
                      <Impact3D
                        craterDiameter={physics.craterDiameter}
                        craterDepth={physics.craterDepth}
                        airblastRadius={physics.airblastRadius}
                        className="h-24 mx-auto"
                      />
                    </div>
                    <div className="text-lg font-bold mb-2 text-white">
                      {physics.craterDiameter >= 1000
                        ? `${(physics.craterDiameter / 1000).toFixed(1)} km`
                        : `${physics.craterDiameter.toFixed(0)} m`}
                    </div>
                    <div className="text-sm text-white/70 mb-1">Crater Diameter</div>
                    <div className="text-xs text-white/60 mb-1">
                      Depth: {physics.craterDepth >= 1000
                        ? `${(physics.craterDepth / 1000).toFixed(1)} km`
                        : `${physics.craterDepth.toFixed(0)} m`}
                    </div>
                    <div className="text-xs text-white/60">
                      Volume: {formatLargeNumber(physics.craterDiameter * physics.craterDiameter * physics.craterDepth / 3, ' m³')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>

          {/* Seismic Effects Slide */}
          <CarouselItem>
            <div className="p-1">
              <Card className="bg-black/95  text-white h-full">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center w-full">
                    <div className="mb-4 relative">
                      <Seismic3D
                        magnitude={physics.seismicMagnitude}
                        epicenterRadius={physics.airblastRadius}
                        className="h-24 mx-auto"
                      />
                    </div>
                    <div className="text-2xl font-bold mb-2 text-white">{physics.seismicMagnitude.toFixed(1)}</div>
                    <div className="text-sm text-white/70 mb-2">Richter Scale</div>
                    <div className="text-xs text-white/60 mb-1">
                      {physics.seismicMagnitude > 7 ? 'Major earthquake' : physics.seismicMagnitude > 5 ? 'Moderate earthquake' : 'Minor earthquake'}
                    </div>
                    <div className="text-xs text-white/60">
                      Felt up to {formatLargeNumber(physics.airblastRadius * 10, ' km')} away
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>

          {/* Damage Zones Slide */}
          <CarouselItem>
            <div className="p-1 h-full">
              <Card className="bg-black/95  text-white h-full">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center w-full">
                    <div className="mb-4 relative">
                      <DamageZone3D
                        airblastRadius={physics.airblastRadius}
                        thermalRadius={physics.thermalRadius}
                        craterDiameter={physics.craterDiameter}
                        className="h-24 mx-auto"
                      />
                    </div>
                    <div className="text-2xl font-bold mb-2 text-white">
                      {physics.airblastRadius.toFixed(1)} km
                    </div>
                    <div className="text-sm text-white/70 mb-2">Airblast Radius</div>
                    <div className="text-xs text-white/60 mb-1">
                      Thermal: {physics.thermalRadius.toFixed(1)} km
                    </div>
                    <div className="text-xs text-white/60">
                      Area: {formatLargeNumber(Math.PI * physics.airblastRadius * physics.airblastRadius, ' km²')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>

          {/* Energy Analysis Slide */}
          <CarouselItem>
            <div className="p-1">
              <Card className="bg-black/95  text-white h-full">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center w-full">
                    <div className="mb-4 relative">
                      <Energy3D
                        kineticEnergy={physics.kineticEnergy}
                        tntEquivalent={physics.tntEquivalent}
                        className="h-24 mx-auto"
                      />
                    </div>
                    <div className="text-2xl font-bold mb-2 text-white">
                      {formatScientificNotation(physics.kineticEnergy)}
                    </div>
                    <div className="text-sm text-white/70 mb-2">Joules</div>
                    <div className="text-xs text-white/60 mb-1">
                      TNT: {physics.tntEquivalent >= 1 ? `${physics.tntEquivalent.toFixed(1)} MT` : `${(physics.tntEquivalent * 1000).toFixed(0)} KT`}
                    </div>
                    <div className="text-xs text-white/60">
                      Power: {formatLargeNumber(physics.kineticEnergy / 1e12, ' TW')} (instantaneous)
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>

          {/* Close Approach Dates Slide */}
          <CarouselItem>
            <div className="p-1 h-full">
              <Card className="bg-black/95  text-white h-full">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center w-full">
                    <div className="mb-4 relative">
                      <div className="w-20 h-20 mx-auto flex items-center justify-center">
                        <div className="text-4xl">🛰️</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold mb-2 text-white">
                      {asteroid.close_approach_data[0]?.close_approach_date || 'N/A'}
                    </div>
                    <div className="text-sm text-white/70 mb-2">Last Close Approach</div>
                    <div className="text-xs text-white/60 mb-1">
                      Distance: {asteroid.close_approach_data[0]?.miss_distance.kilometers || 'N/A'} km
                    </div>
                    <div className="text-xs text-white/60">
                      Next: {asteroid.close_approach_data[1]?.close_approach_date || 'Unknown'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>

          {/* Impact Facts Slide */}
          <CarouselItem>
            <div className="p-1 h-full">
              <Card className="bg-black/95  text-white h-full  ">
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center w-full">
                    <div className="mb-4 relative">
                      <div className="w-20 h-20 mx-auto flex items-center justify-center">
                        <div className="text-4xl">💥</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-2 text-white">Key Facts</div>
                    <div className="text-sm text-white/70 mb-2">
                      Impact Analysis
                    </div>
                    <div className="text-xs text-white/60 mb-1">
                      • {impactData.isLand ? 'Land Impact' : 'Ocean Impact'} • {physics.impactDescription}
                    </div>
                    <div className="text-xs text-white/60 mb-1">
                      • Diameter: {asteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(0)}m
                    </div>
                    <div className="text-xs text-white/60 mb-1">
                      • Speed: {asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_second || 'N/A'} km/s
                    </div>
                    <div className="text-xs text-white/60">
                      • Energy: {formatScientificNotation(physics.kineticEnergy)} J
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
        <div className="flex justify-center gap-4 mt-6">
          <CarouselPrevious variant="secondary" className="relative left-0 " />
          <CarouselNext variant="secondary" className="relative right-0 " />
        </div>
      </Carousel>
    </div>
  );
};

