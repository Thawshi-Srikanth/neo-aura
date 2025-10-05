// USGS and related open data scaffolding

// Elevation (USGS National Map) - sample endpoint pattern for elevation by point
// Note: Production use may require API keys or CORS proxy depending on deployment
export const ELEVATION_POINT_URL = (lon: number, lat: number) =>
  `https://nationalmap.gov/epqs/pqs.php?x=${lon}&y=${lat}&units=Meters&output=json`;

export interface ElevationResponse {
  USGS_Elevation_Point_Query_Service: {
    Elevation_Query: {
      X: number;
      Y: number;
      Elevation: number;
      Units: string;
    };
  };
}

export async function fetchElevationAt(
  lon: number,
  lat: number
): Promise<number | null> {
  try {
    const res = await fetch(ELEVATION_POINT_URL(lon, lat));
    if (!res.ok) return null;
    const data: ElevationResponse = await res.json();
    return (
      data?.USGS_Elevation_Point_Query_Service?.Elevation_Query?.Elevation ??
      null
    );
  } catch {
    return null;
  }
}

// Tsunami hazard layers are often provided by NOAA/NCEI rather than USGS.
// This is a placeholder for vector/raster hazard ingestion via XYZ/WMTS.
export interface TileLayerConfig {
  name: string;
  urlTemplate: string; // e.g., https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
  attribution?: string;
  minZoom?: number;
  maxZoom?: number;
}

export const BASEMAP_OSM: TileLayerConfig = {
  name: "OSM",
  urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
  minZoom: 0,
  maxZoom: 19,
};
