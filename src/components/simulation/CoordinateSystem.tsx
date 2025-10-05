import { Html } from "@react-three/drei";
import * as THREE from "three";
import { SIMULATION_CONSTANTS } from "../../config/simulationConstants";
import { useSettingsStore } from "../../store/settingsStore";

export const CoordinateSystem = () => {
  const { settings } = useSettingsStore();
  
  if (!settings.showAxis) {
    return null;
  }
  
  return (
    <>
      {/* Ecliptic Plane Grid */}
      <gridHelper
        args={[
          settings.gridSize, 
          settings.gridDivisions, 
          SIMULATION_CONSTANTS.GRID.COLOR1, 
          SIMULATION_CONSTANTS.GRID.COLOR2
        ]}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      />

      {/* Coordinate System Axes */}
      <arrowHelper
        args={[
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, 0),
          SIMULATION_CONSTANTS.AXES.LENGTH,
          SIMULATION_CONSTANTS.AXES.COLORS.X,
          SIMULATION_CONSTANTS.AXES.HEAD_LENGTH,
          SIMULATION_CONSTANTS.AXES.HEAD_WIDTH,
        ]}
      />
      <arrowHelper
        args={[
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, 0),
          SIMULATION_CONSTANTS.AXES.LENGTH,
          SIMULATION_CONSTANTS.AXES.COLORS.Y,
          SIMULATION_CONSTANTS.AXES.HEAD_LENGTH,
          SIMULATION_CONSTANTS.AXES.HEAD_WIDTH,
        ]}
      />
      <arrowHelper
        args={[
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(0, 0, 0),
          SIMULATION_CONSTANTS.AXES.LENGTH,
          SIMULATION_CONSTANTS.AXES.COLORS.Z,
          SIMULATION_CONSTANTS.AXES.HEAD_LENGTH,
          SIMULATION_CONSTANTS.AXES.HEAD_WIDTH,
        ]}
      />

      {/* Axis labels */}
      <Html position={[2.2, 0, 0]} center>
        <div className="text-red-500 text-sm font-bold">
          X (Vernal Equinox)
        </div>
      </Html>
      <Html position={[0, 2.2, 0]} center>
        <div className="text-green-500 text-sm font-bold">
          Y (North Ecliptic Pole)
        </div>
      </Html>
      <Html position={[0, 0, 2.2]} center>
        <div className="text-blue-500 text-sm font-bold">
          Z (90° Longitude)
        </div>
      </Html>
    </>
  );
};
