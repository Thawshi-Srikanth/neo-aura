# NEO (Near Earth Objects) Visualization

This implementation adds real-time visualization of Near Earth Objects fetched from NASA's API to your 3D simulation using a **heliocentric coordinate system**.

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

- Uses real orbital elements from NASA's data
- Calculates positions using Kepler's equations
- Converts heliocentric coordinates to proper 3D visualization scale
- Time-based animation with configurable speed

### Performance Optimizations

- Efficient SWR caching for API data
- Optimized Three.js geometry updates
- Configurable limits on NEO count
- Memory-efficient trail rendering

### Data Source

- NASA NEO REST API v1
- Real orbital parameters and close approach data
- Filtered for valid orbital elements
- Cached to minimize API calls

## API Requirements

Make sure you have a NASA API key configured in your environment:

```env
VITE_NASA_API_KEY=your_nasa_api_key
```

The system falls back to a demo key if none is provided.
