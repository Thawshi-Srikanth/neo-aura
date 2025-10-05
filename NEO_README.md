# NEO (Near Earth Objects) Visualization

This implementation adds real-time visualization of Near Earth Objects fetched from NASA's API to your 3D simulation using a **heliocentric coordinate system**.

## Quick Start

1. **Get NASA API Key**: Register at [NASA API Portal](https://api.nasa.gov/)
2. **Configure Environment**: Add `VITE_NASA_API_KEY=your_key` to `.env.local`
3. **Launch Application**: Run `pnpm dev` and navigate to orbital visualization
4. **Interact with NEOs**: Click on yellow blinking points to see detailed information

## Mathematical Foundations

### Heliocentric Coordinate System
The simulation uses a **heliocentric coordinate system** where:
- **Origin (0,0,0)**: Center of the Sun
- **X-axis**: Points toward the vernal equinox
- **Y-axis**: Perpendicular to X in the orbital plane
- **Z-axis**: Perpendicular to the orbital plane (right-hand rule)

### Orbital Element Calculations
```typescript
// Kepler's equation for position calculation
M = E - e * sin(E)

// Where:
// M = mean anomaly (radians)
// E = eccentric anomaly (radians) 
// e = orbital eccentricity

// Position in heliocentric coordinates
x = a * (cos(E) - e)
y = a * sqrt(1 - e²) * sin(E)
z = 0 (for 2D orbital plane)
```

### Distance Scaling
```typescript
// Astronomical Unit to 3D units conversion
const AU_TO_UNITS = 2.0;
const scaledDistance = realDistanceAU * AU_TO_UNITS;

// Example: Earth at 1 AU = 2 units from Sun in 3D space
```

## Correct Astronomical Model

### Heliocentric System

- **Sun at Center**: The Sun is positioned at the center (0,0,0) of the 3D space
- **Earth Orbits Sun**: Earth orbits around the Sun at a realistic distance
- **NEOs Orbit Sun**: NEOs follow their actual heliocentric orbits around the Sun
- **True Relationships**: Shows the correct spatial relationships between celestial bodies

## Features

### NEO Visualization

- **Blinking Points**: NEOs are displayed as yellow blinking points in 3D space
- **Real-time Data**: Fetches live data from NASA's NEO API
- **Heliocentric Trails**: Shows the orbital paths of NEOs around the Sun
- **Dynamic Animation**: NEOs move along their calculated orbital paths around the Sun

### Customizable Parameters

- **NEO Appearance**: Color, size, and blinking speed
- **Trail Settings**: Color, length, opacity, and visibility
- **Visibility Controls**: Toggle NEOs, trails, sun, Earth, and Earth's orbit individually
- **Data Limits**: Control how many NEOs to display (5-50)

### Components Created

#### Core Components

- `NEOPoint.tsx` - Renders individual NEO as a blinking point
- `NEOTrail.tsx` - Renders orbital trail for each NEO
- `NEOManager.tsx` - Manages fetching and rendering of all NEOs
- `NEOControls.tsx` - UI controls for customizing NEO parameters
- `Sun.tsx` - Central sun reference point with glow effect

#### Integration

- `ImpactSim.tsx` - Updated to include NEO visualization with time animation

## Usage

The NEO visualization is automatically active in the ImpactSim component. Use the NEO Controls panel in the top-right corner to:

1. **Toggle Visibility**: Show/hide NEOs, trails, and sun
2. **Customize Appearance**: Change colors, sizes, and opacity
3. **Adjust Animation**: Control blinking speed and trail length
4. **Limit Data**: Set maximum number of NEOs to display

## Technical Details

### Orbital Calculations

#### Kepler's Equation Solver
```typescript
// Newton-Raphson method for solving Kepler's equation
function solveKeplersEquation(M: number, e: number, tolerance = 1e-6): number {
  let E = M; // Initial guess
  let delta = 1;
  
  while (Math.abs(delta) > tolerance) {
    delta = (M - (E - e * Math.sin(E))) / (1 - e * Math.cos(E));
    E += delta;
  }
  
  return E;
}
```

#### Position Calculation
```typescript
// Convert orbital elements to 3D position
function calculatePosition(orbitalElements: OrbitalElements, time: number): Vector3 {
  const { a, e, i, Ω, ω, M0 } = orbitalElements;
  
  // Calculate mean anomaly at time t
  const n = Math.sqrt(GM / (a * a * a)); // Mean motion
  const M = M0 + n * time;
  
  // Solve Kepler's equation
  const E = solveKeplersEquation(M, e);
  
  // Calculate position in orbital plane
  const x = a * (Math.cos(E) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  
  // Apply orbital inclination and rotation
  const cos_i = Math.cos(i);
  const sin_i = Math.sin(i);
  const cos_Ω = Math.cos(Ω);
  const sin_Ω = Math.sin(Ω);
  const cos_ω = Math.cos(ω);
  const sin_ω = Math.sin(ω);
  
  return new Vector3(
    x * (cos_Ω * cos_ω - sin_Ω * sin_ω * cos_i),
    x * (sin_Ω * cos_ω + cos_Ω * sin_ω * cos_i),
    x * sin_ω * sin_i
  );
}
```

### Performance Optimizations

#### Memory Management
```typescript
// Efficient NEO rendering with instanced geometry
const NEOGeometry = new THREE.SphereGeometry(0.01, 8, 6);
const NEOInstances = new THREE.InstancedMesh(NEOGeometry, material, maxNEOs);

// Update positions without recreating geometry
function updateNEOPositions(neos: NEOData[]) {
  const matrix = new THREE.Matrix4();
  
  neos.forEach((neo, index) => {
    const position = calculatePosition(neo.orbitalElements, currentTime);
    matrix.setPosition(position);
    NEOInstances.setMatrixAt(index, matrix);
  });
  
  NEOInstances.instanceMatrix.needsUpdate = true;
}
```

#### Data Caching Strategy
```typescript
// SWR configuration for optimal caching
const { data: neoData, error } = useSWR(
  'neo-feed',
  () => fetchNEOData(),
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
    dedupingInterval: 60 * 1000, // 1 minute
  }
);
```

### Data Source

- **NASA NEO REST API v1**: `https://api.nasa.gov/neo/rest/v1/feed`
- **Authentication**: API key required
- **Rate Limits**: 1000 requests per hour
- **Data Format**: JSON with orbital elements and close approach data
- **Filtering**: Valid orbital elements only (eccentricity < 1, semi-major axis > 0)

## API Requirements

Make sure you have a NASA API key configured in your environment:

```env
VITE_NASA_API_KEY=your_nasa_api_key
```

The system falls back to a demo key if none is provided.
