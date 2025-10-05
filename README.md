# Neo-Aura Frontend

A sophisticated asteroid impact simulation frontend built with React, TypeScript, and Three.js.

## 🚀 Features

### 3D Simulation
- **Real-time 3D visualization** of asteroid trajectories
- **Orbital mechanics** with accurate physics calculations
- **Interactive camera controls** with zoom, pan, and rotate
- **Multiple asteroid types** (original, deflected, collision)
- **Dynamic lighting** and starfield background

### Console-Style Interface
- **Terminal-inspired legend** with JetBrains Mono font
- **Transparent console panel** with green terminal colors
- **Real-time status badges** for simulation states
- **Scientific distance formatting** with superscript notation
- **Asteroid information display** with name and ID

### Advanced Settings
- **Collapsible settings panel** with smooth animations
- **Comprehensive controls** for all simulation parameters
- **Persistent settings** with local storage
- **Tooltips and help** for each control
- **Organized sections** (Display, Lighting, Stars, Grid, Physics, Timing)

### Physics Simulation
- **Impact analysis** with real-time calculations
- **Trajectory optimization** with collision detection
- **Energy calculations** and impact predictions
- **Geographic impact mapping** with land/ocean detection
- **Seismic wave visualization** and energy distribution

## 🛠️ Technology Stack

- **React 18** with TypeScript
- **Three.js** for 3D graphics
- **React Three Fiber** for React integration
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Shadcn/ui** for components
- **JetBrains Mono** for console styling

## 📁 Project Structure

```
src/
├── components/
│   ├── simulation/          # 3D simulation components
│   ├── controls/            # UI control components
│   ├── views/               # Main view components
│   └── ui/                  # Reusable UI components
├── hooks/                   # Custom React hooks
├── store/                   # Zustand state management
├── config/                  # Configuration and constants
├── types/                   # TypeScript type definitions
└── utils/                   # Utility functions
```

## 🎮 Key Components

### SimulationScene
- Main 3D scene orchestrator
- Handles all 3D object rendering
- Manages camera and lighting
- Coordinates between UI and 3D elements

### Legend
- Console-style information panel
- Real-time status display
- Asteroid information
- Scientific distance formatting

### SimulationSettings
- Comprehensive settings panel
- Collapsible sections with animations
- Persistent configuration
- Tooltips and help system

### Labels
- Distance calculation and display
- Real-time position tracking
- Scientific notation formatting

## 🔧 Development

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation
```bash
pnpm install
```

### Development Server
```bash
pnpm dev
```

### Build
```bash
pnpm build
```

## 🎨 Design Philosophy

### Console Aesthetics
- **Terminal-inspired interface** with monospace fonts
- **Transparent panels** with backdrop blur
- **Green terminal colors** for authentic console feel
- **Bracket notation** for status indicators

### Scientific Accuracy
- **Real astronomical units** for distances
- **Proper physics calculations** for trajectories
- **Scientific notation** with superscript formatting
- **Accurate orbital mechanics** simulation

### User Experience
- **Smooth animations** for all interactions
- **Intuitive controls** with clear labeling
- **Responsive design** for different screen sizes
- **Performance optimization** for real-time 3D rendering

## 📊 Performance Features

- **Efficient 3D rendering** with optimized geometries
- **Smart object culling** for distant objects
- **LOD (Level of Detail)** for complex scenes
- **Memory management** for long-running simulations
- **Smooth 60fps** animation performance

## 🔬 Scientific Features

- **Orbital mechanics** with Kepler's laws
- **Gravitational calculations** for realistic trajectories
- **Impact physics** with energy calculations
- **Seismic wave modeling** for impact analysis
- **Geographic impact prediction** with land/ocean detection

## 🎯 Future Enhancements

- **Multi-asteroid simulations**
- **Advanced trajectory optimization**
- **Real-time data integration**
- **Enhanced visualization modes**
- **Export capabilities** for analysis results

---

Built with ❤️ for asteroid impact simulation and planetary defense research.