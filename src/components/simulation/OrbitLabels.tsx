import { useMemo } from "react";
import { getAsteroidPosition, getEarthPosition } from "../../utils/orbital-calculations";
import { AU_TO_UNITS } from "../../config/constants";
import type { AsteroidOrbitalData } from "../../types/asteroid";
import type { CollisionOrbit } from "../../utils/orbitalCollision";
import { Text3D } from "./Text3D";

interface OrbitLabelsProps {
  currentAsteroid: {
    orbital_data: AsteroidOrbitalData;
    name: string;
  };
  collisionOrbit?: CollisionOrbit | null;
  isDeflected?: boolean;
  deflectionResult?: any;
  showLabels?: boolean;
}

export function OrbitLabels({
  currentAsteroid,
  collisionOrbit,
  isDeflected = false,
  deflectionResult,
  showLabels = true,
}: OrbitLabelsProps) {
  const labels = useMemo(() => {
    if (!showLabels) return [];

    const labelElements: any[] = [];

    // Earth orbit labels
    const earthPeriod = 365.25;
    const earthPositions = [
      { time: 0, label: "Earth (Jan 1)" },
      { time: earthPeriod / 4, label: "Earth (Apr 1)" },
      { time: earthPeriod / 2, label: "Earth (Jul 1)" },
      { time: (3 * earthPeriod) / 4, label: "Earth (Oct 1)" },
    ];

    earthPositions.forEach(({ time, label }) => {
      const [x, y, z] = getEarthPosition(time);
      const position: [number, number, number] = [x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS];
      labelElements.push(
        <Text3D 
          key={`earth-${time}`} 
          position={position} 
          text={label}
          color="#60a5fa"
          size={0.08}
        />
      );
    });

    // Original asteroid orbit labels
    const asteroidPeriod = parseFloat(currentAsteroid.orbital_data.orbital_period);
    const asteroidPositions = [
      { time: 0, label: `${currentAsteroid.name} (Start)` },
      { time: asteroidPeriod / 4, label: `${currentAsteroid.name} (Q1)` },
      { time: asteroidPeriod / 2, label: `${currentAsteroid.name} (Q2)` },
      { time: (3 * asteroidPeriod) / 4, label: `${currentAsteroid.name} (Q3)` },
    ];

    asteroidPositions.forEach(({ time, label }) => {
      const [x, y, z] = getAsteroidPosition(time, currentAsteroid.orbital_data);
      const position: [number, number, number] = [x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS];
      labelElements.push(
        <Text3D 
          key={`asteroid-${time}`} 
          position={position} 
          text={label}
          color="#fbbf24"
          size={0.08}
        />
      );
    });

    // Collision orbit labels
    if (collisionOrbit) {
      const collisionPeriod = 2 * Math.PI * Math.sqrt(Math.pow(collisionOrbit.semiMajorAxis, 3));
      const collisionPositions = [
        { time: 0, label: "Collision Path (Start)" },
        { time: collisionPeriod / 4, label: "Collision Path (Q1)" },
        { time: collisionPeriod / 2, label: "Collision Path (Q2)" },
        { time: (3 * collisionPeriod) / 4, label: "Collision Path (Q3)" },
      ];

      collisionPositions.forEach(({ time, label }) => {
        // Calculate collision orbit position
        // Calculate mean motion using Kepler's third law: n = sqrt(GM/a^3)
        const meanMotion = Math.sqrt(1.0 / (collisionOrbit.semiMajorAxis * collisionOrbit.semiMajorAxis * collisionOrbit.semiMajorAxis));
        const meanAnomaly = collisionOrbit.meanAnomaly + (time * meanMotion);
        const eccentricAnomaly = meanAnomaly + collisionOrbit.eccentricity * Math.sin(meanAnomaly);
        const trueAnomaly = 2 * Math.atan(
          Math.sqrt((1 + collisionOrbit.eccentricity) / (1 - collisionOrbit.eccentricity)) *
          Math.tan(eccentricAnomaly / 2)
        );

        const radius = (collisionOrbit.semiMajorAxis * (1 - Math.pow(collisionOrbit.eccentricity, 2))) /
          (1 + collisionOrbit.eccentricity * Math.cos(trueAnomaly));

        const x = radius * Math.cos(trueAnomaly) * Math.cos(collisionOrbit.inclination);
        const y = radius * Math.sin(trueAnomaly) * Math.cos(collisionOrbit.inclination);
        const z = radius * Math.sin(collisionOrbit.inclination);

        const position: [number, number, number] = [x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS];
        labelElements.push(
          <Text3D 
            key={`collision-${time}`} 
            position={position} 
            text={label}
            color="#f87171"
            size={0.08}
          />
        );
      });
    }

    // Deflected orbit labels
    if (isDeflected && deflectionResult?.deflected?.success) {
      const deflectedOrbitalData = {
        ...currentAsteroid.orbital_data,
        eccentricity: deflectionResult.deflected.eccentricity.toString(),
        inclination: deflectionResult.deflected.inclination.toString(),
        semi_major_axis: deflectionResult.deflected.semiMajorAxis.toString(),
      };

      const deflectedPeriod = parseFloat(deflectedOrbitalData.orbital_period);
      const deflectedPositions = [
        { time: 0, label: "Deflected Path (Start)" },
        { time: deflectedPeriod / 4, label: "Deflected Path (Q1)" },
        { time: deflectedPeriod / 2, label: "Deflected Path (Q2)" },
        { time: (3 * deflectedPeriod) / 4, label: "Deflected Path (Q3)" },
      ];

      deflectedPositions.forEach(({ time, label }) => {
        const [x, y, z] = getAsteroidPosition(time, deflectedOrbitalData);
        const position: [number, number, number] = [x * AU_TO_UNITS, y * AU_TO_UNITS, z * AU_TO_UNITS];
        labelElements.push(
          <Text3D 
            key={`deflected-${time}`} 
            position={position} 
            text={label}
            color="#22d3ee"
            size={0.08}
          />
        );
      });
    }

    return labelElements;
  }, [currentAsteroid, collisionOrbit, isDeflected, deflectionResult, showLabels]);

  return <>{labels}</>;
}
