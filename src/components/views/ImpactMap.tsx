import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ImpactData } from "../../types/simulation";
import { Button } from "../ui/button";
import { Maximize2Icon, Minimize2Icon } from "lucide-react";

interface ImpactAnimationProps {
  center: [number, number];
}

function ImpactAnimation({ center }: ImpactAnimationProps) {
  const map = useMap();
  const animationFrameId = useRef<number | null>(null);
  const circles = useRef<L.Circle[]>([]);

  useEffect(() => {
    map.setView(center, 6);

    let rippleRadius = 0;
    let rippleOpacity = 1;

    const animate = () => {
      // Clear previous circles
      circles.current.forEach((c) => map.removeLayer(c));
      circles.current = [];

      // Draw new circle
      const circle = L.circle(center, {
        radius: rippleRadius,
        color: `rgba(255, 50, 50, ${rippleOpacity})`,
        fillColor: `rgba(255, 50, 50, ${rippleOpacity * 0.2})`,
        fillOpacity: 0.2,
        weight: 1,
      }).addTo(map);
      circles.current.push(circle);

      rippleRadius += 30000; // meters
      rippleOpacity -= 0.02;

      if (rippleOpacity > 0) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        // Add a permanent marker at the end
        L.circleMarker(center, {
          radius: 8,
          color: "red",
          fillColor: "#f03",
          fillOpacity: 1,
        }).addTo(map);
      }
    };

    animate();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      circles.current.forEach((c) => map.removeLayer(c));
    };
  }, [center[0], center[1], map]);

  return null;
}

interface DamageZonesProps {
  center: [number, number];
  physics: ImpactData['physics'];
}

function DamageZones({ center, physics }: DamageZonesProps) {
  if (!physics) return null;

  return (
    <>
      {/* Crater */}
      <Circle
        center={center}
        radius={(physics.craterDiameter / 2)}
        pathOptions={{
          color: '#ff0000',
          fillColor: '#ff0000',
          fillOpacity: 0.6,
          weight: 2,
        }}
      >
        <Popup>
          <div className="text-sm">
            <strong>Impact Crater</strong><br />
            Diameter: {(physics.craterDiameter / 1000).toFixed(2)} km<br />
            Depth: {(physics.craterDepth / 1000).toFixed(2)} km<br />
            Complete destruction
          </div>
        </Popup>
      </Circle>

      {/* Ejecta Blanket */}
      <Circle
        center={center}
        radius={physics.ejectaRadius * 1000}
        pathOptions={{
          color: '#ff6600',
          fillColor: '#ff6600',
          fillOpacity: 0.3,
          weight: 2,
        }}
      >
        <Popup>
          <div className="text-sm">
            <strong>Ejecta Blanket</strong><br />
            Radius: {physics.ejectaRadius.toFixed(1)} km<br />
            Debris and rocks ejected from crater<br />
            Severe damage from falling material
          </div>
        </Popup>
      </Circle>

      {/* Airblast Severe Damage */}
      <Circle
        center={center}
        radius={physics.airblastRadius * 1000}
        pathOptions={{
          color: '#ff9900',
          fillColor: '#ff9900',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '5, 5',
        }}
      >
        <Popup>
          <div className="text-sm">
            <strong>Airblast Zone (Severe)</strong><br />
            Radius: {physics.airblastRadius.toFixed(1)} km<br />
            Overpressure: 20 psi<br />
            Buildings destroyed, severe injuries
          </div>
        </Popup>
      </Circle>

      {/* Thermal Radiation */}
      <Circle
        center={center}
        radius={physics.thermalRadius * 1000}
        pathOptions={{
          color: '#ffcc00',
          fillColor: '#ffcc00',
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '10, 5',
        }}
      >
        <Popup>
          <div className="text-sm">
            <strong>Thermal Radiation Zone</strong><br />
            Radius: {physics.thermalRadius.toFixed(1)} km<br />
            3rd degree burns to exposed skin<br />
            Fires and heat damage
          </div>
        </Popup>
      </Circle>

      {/* Seismic Effects (approximate) */}
      {physics.seismicMagnitude > 5 && (
        <Circle
          center={center}
          radius={Math.min(physics.airblastRadius * 3, 300) * 1000}
          pathOptions={{
            color: '#9900ff',
            fillColor: '#9900ff',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '15, 10',
          }}
        >
          <Popup>
            <div className="text-sm">
              <strong>Seismic Effects Zone</strong><br />
              Magnitude: {physics.seismicMagnitude.toFixed(1)} Richter<br />
              Ground shaking, structural damage<br />
              Effects diminish with distance
            </div>
          </Popup>
        </Circle>
      )}
    </>
  );
}

interface ImpactMapProps {
  impactData: ImpactData | null;
}

export default function ImpactMap({ impactData }: ImpactMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!impactData) return null;

  const position: [number, number] = [impactData.lat, impactData.lon];

  return (
    <div className={`absolute top-20 left-5 z-10 transition-all duration-300 ${isExpanded ? 'w-[50vw]' : 'w-[300px]'}`}>
      {/* Map Container */}
      <div className={`border-2 rounded-lg overflow-hidden shadow-2xl ${isExpanded ? 'h-[50vh]' : 'h-[200px]'}`}>
        {/* Expand/Collapse Button */}
        <div className="absolute top-2 right-2 z-[1000]">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="secondary"
            size="icon"
            className="bg-black/50 backdrop-blur-sm"
          >
            {isExpanded ? <Minimize2Icon className="w-4 h-4" /> : <Maximize2Icon className="w-4 h-4" />}
          </Button>
        </div>

        <MapContainer
          center={position}
          zoom={10}
          className="w-full h-full"
          scrollWheelZoom={true}
          zoomControl={true}
        >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {impactData.physics ? (
          <DamageZones center={position} physics={impactData.physics} />
        ) : (
          <ImpactAnimation center={position} />
        )}
        </MapContainer>
      </div>

      {/* Legend - Below the map */}
      <div className="mt-2  backdrop-blur-sm text-white p-2 rounded text-xs ">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>Crater</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600"></div>
            <span>Ejecta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
            <span>Airblast</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span>Thermal</span>
          </div>
          {impactData.physics && impactData.physics.seismicMagnitude > 5 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-600"></div>
              <span>Seismic</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
