/**
 * Shared Type Definitions for Jakarta Flash-Flood Evacuation Priority Ranking Engine
 */

export interface WeatherStation {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  current_rainfall_mm_hr: number;
}

export interface RiverSensor {
  sensor_id: string;
  name: string;
  lat: number;
  lon: number;
  water_level_cm: number;
  mu: number;      // GEV location parameter
  sigma: number;   // GEV scale parameter
  xi: number;      // GEV shape parameter
  exceedance_prob: number; // Computed real-time exceedance probability
}

export interface CatchmentPolygon {
  sensor_id: string;
  vx: number[]; // EPSG:3857 vertex X coordinates
  vy: number[]; // EPSG:3857 vertex Y coordinates
}

export interface NeighborhoodRT {
  rt_id: string;
  kelurahan: string;
  lat: number;
  lon: number;
  x_3857: number;
  y_3857: number;
  demnas_elevation_m: number;
  associated_sensor_id: string;
  interpolated_rainfall_mm_hr: number;
  evt_exceedance_prob: number;
  risk_priority_score: number;
  dispatched?: boolean;
  siren_activated?: boolean;
}

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  rainMultiplier: number;
  coastalTideCm: number;
  stationRainfalls: number[]; // custom rainfall values for BMKG stations
  sensorSpikes: string[];     // IDs of sensors experiencing extreme spikes
}

export interface RiskWeights {
  w1: number; // Exceedance Probability Weight (TMA)
  w2: number; // Rainfall Weight (BMKG IDW)
  w3: number; // Elevation Weight (DEMNAS)
}

export interface MusterPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  capacity: number;
  occupied: number;
}

export interface RoadNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface RoadEdge {
  fromId: string;
  toId: string;
  name: string;
  baseDistanceKm: number;
}

export interface EvacuationRoute {
  pathNodes: RoadNode[];
  totalDistanceKm: number;
  musterPoint: MusterPoint;
  safetyScore: number; // 0-100 score based on proximity to active river flood zones
}

export interface BenchmarkMetrics {
  pipJoinCpuMs: number;
  pipJoinGpuMs: number;
  idwInterpolationCpuMs: number;
  idwInterpolationGpuMs: number;
  evtExceedanceCpuMs: number;
  evtExceedanceGpuMs: number;
  riskRankingCpuMs: number;
  riskRankingGpuMs: number;
  totalCpuMs: number;
  totalGpuMs: number;
}
