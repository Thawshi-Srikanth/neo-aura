# Interactive NEO Detail System

## Overview

Click on any NEO (yellow blinking point) in the 3D visualization to see detailed information about that Near Earth Object.

## Quick Start Guide

1. **Launch Application**: Run `pnpm dev` and navigate to `/orbital-visualization`
2. **Find NEOs**: Look for yellow blinking points around the Sun
3. **Interact**: Click on any NEO to see detailed information
4. **Customize**: Use the control panel to adjust visualization settings
5. **Explore**: Navigate the 3D space to understand orbital relationships

## Scientific Data Display

### Orbital Elements Visualization
The system displays real orbital elements from NASA's database:

- **Semi-major Axis (a)**: Average distance from the Sun in Astronomical Units (AU)
- **Eccentricity (e)**: Shape of the orbit (0 = circular, 1 = parabolic)
- **Inclination (i)**: Tilt of orbit relative to Earth's orbital plane
- **Longitude of Ascending Node (Ω)**: Where orbit crosses the ecliptic plane
- **Argument of Periapsis (ω)**: Orientation of orbit's closest point to Sun
- **Mean Anomaly (M)**: Position along orbit at a specific time

## Features

### Interactive NEOs

- **Clickable Points**: All NEO points are clickable and show a cursor pointer on hover
- **Visual Feedback**:
  - Hover: NEO becomes slightly larger and changes to orange
  - Selected: NEO becomes much larger and turns orange-red
  - Normal: Yellow blinking point

### Detail Panel

- **Comprehensive Information**: Shows all available data about the selected NEO
- **Easy to Close**: Red close button (X) in the top-right corner
- **Scrollable**: Panel scrolls if content is too long

## Information Displayed

### Basic Data

- **NEO ID**: Unique NASA identifier
- **Name**: Official name of the Near Earth Object
- **Hazardous Status**: Whether it's potentially hazardous to Earth
- **Estimated Diameter**: Size range in kilometers

### Orbital Information

- **Semi-major Axis**: Average distance from the Sun (AU)
- **Eccentricity**: How elliptical the orbit is (0 = circular, 1 = parabolic)
- **Inclination**: Tilt of orbit relative to Earth's orbit plane
- **Orbital Period**: Time to complete one orbit around the Sun

### Close Approach Data

- **Next Approach Date**: When it will next come close to Earth
- **Miss Distance**: How close it will get (in kilometers)
- **Relative Velocity**: Speed relative to Earth
- **Orbiting Body**: What it's orbiting (usually the Sun)

### Additional Features

- **NASA JPL Link**: Direct link to NASA's official page for more details
- **Absolute Magnitude**: Brightness measure (H parameter)

## How to Use

1. **Navigate**: Use mouse to rotate, zoom, and pan the 3D view
2. **Find NEOs**: Look for yellow blinking points around the Sun
3. **Click**: Click on any NEO to open its detail panel
4. **Explore**: Scroll through the detailed information
5. **Close**: Click the red X button to close the panel
6. **Select Another**: Click on a different NEO to see its details
7. **Control Panel**: Use the organized tabbed controls to customize the simulation

## Control Panel Tabs

### Visibility Tab

- Toggle NEOs, trails, Sun, Earth, and Earth's orbit on/off
- Quick visibility controls for all elements

### Appearance Tab

- **NEO Settings**: Color, size, and blinking speed
- **Trail Settings**: Color, length, and opacity
- Customize the visual appearance of all elements

### Animation Tab

- **Speed Control**: 10x to 1000x multiplier for all animations
- Controls Earth orbit speed and NEO movement speed

### Data Tab

- **Max NEOs**: Control how many NEOs to fetch and display (5-50)
- Data loading preferences

## Tips

- **Zoom In**: Get closer to see NEOs more clearly
- **Follow Trails**: Use the orbital trails to understand NEO paths
- **Compare**: Click different NEOs to compare their characteristics
- **Settings**: Use the NEO Controls panel to adjust visibility and appearance
- **Speed Up Time**: Use higher speed multipliers to see orbital motion over longer time periods
- **Watch Earth**: See how Earth moves in its orbit relative to NEO paths

## Animation Speed Control

The speed multiplier affects all moving objects in the simulation:

- **Earth's Orbit**: Earth moves faster around the Sun
- **NEO Orbits**: All NEOs move faster along their orbital paths
- **Time-based Effects**: Blinking and other animations maintain their relative speeds

Speed range: **10x to 1000x** normal speed for observing long-term orbital dynamics.

## Advanced Calculations

### Distance Calculations
```typescript
// Real-time distance calculation between NEO and Earth
function calculateDistance(neoPosition: Vector3, earthPosition: Vector3): number {
  const dx = neoPosition.x - earthPosition.x;
  const dy = neoPosition.y - earthPosition.y;
  const dz = neoPosition.z - earthPosition.z;
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz) * AU_TO_UNITS;
}
```

### Velocity Calculations
```typescript
// Relative velocity calculation
function calculateRelativeVelocity(neoVelocity: Vector3, earthVelocity: Vector3): number {
  const relativeVel = neoVelocity.clone().sub(earthVelocity);
  return relativeVel.length() * KM_PER_S_TO_M_PER_S;
}
```

### Impact Probability Assessment
```typescript
// Simplified impact probability based on orbital intersection
function calculateImpactProbability(neo: NEOData, earth: EarthData): number {
  const minDistance = Math.min(...neo.close_approach_data.map(approach => 
    parseFloat(approach.miss_distance.kilometers)
  ));
  
  // Simplified probability model
  const earthRadius = 6371; // km
  const impactRadius = earthRadius * 2; // Safety factor
  
  if (minDistance < impactRadius) {
    return Math.max(0, 1 - (minDistance / impactRadius));
  }
  
  return 0;
}
```

## Educational Features

### Orbital Mechanics Learning
- **Visual Orbital Paths**: See how NEOs follow elliptical orbits
- **Kepler's Laws**: Observe equal area swept in equal time
- **Gravitational Effects**: Watch how NEOs accelerate near the Sun
- **Orbital Resonance**: Identify NEOs with resonant orbits

### Scientific Notation
- **Distance Formatting**: Scientific notation with proper units
- **Velocity Display**: km/s with relative velocity calculations
- **Time Formatting**: Julian dates and standard calendar dates
- **Magnitude System**: Absolute magnitude (H) for brightness

The system fetches real data from NASA's NEO API, so all information is current and accurate!
