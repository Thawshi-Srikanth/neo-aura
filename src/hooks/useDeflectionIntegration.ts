import { useEffect, useState } from 'react';

export interface DeflectionResult {
  asteroidId: string;
  asteroidName: string;
  originalOrbit: {
    eccentricity: number;
    inclination: number;
    semiMajorAxis: number;
    velocity: number;
    missDistance: number;
  };
  deflected: {
    eccentricity: number;
    inclination: number;
    semiMajorAxis: number;
    velocity: number;
    missDistance: number;
    success: boolean;
    method: string;
    impactProbabilityReduction: number;
    energyRequired: number;
    confidence: number;
    isDeflectedPath: boolean;
  };
  method: string;
  success: boolean;
  impactProbabilityReduction: number;
}

export const useDeflectionIntegration = () => {
  const [deflectionResult, setDeflectionResult] = useState<DeflectionResult | null>(null);
  const [isDeflected, setIsDeflected] = useState(false);

  useEffect(() => {
    const handleDeflection = (event: CustomEvent<DeflectionResult>) => {
      console.log('Deflection event received:', event.detail);
      setDeflectionResult(event.detail);
      setIsDeflected(true);
    };

    window.addEventListener('asteroidDeflected', handleDeflection as EventListener);
    
    return () => {
      window.removeEventListener('asteroidDeflected', handleDeflection as EventListener);
    };
  }, []);

  const resetDeflection = () => {
    setDeflectionResult(null);
    setIsDeflected(false);
  };

  return {
    deflectionResult,
    isDeflected,
    resetDeflection
  };
};
