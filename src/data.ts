import { WeatherStation, RiverSensor, CatchmentPolygon, SimulationPreset } from './types';

// Jakarta spatial boundaries
export const JAKARTA_LAT_MIN = -6.37;
export const JAKARTA_LAT_MAX = -6.08;
export const JAKARTA_LON_MIN = 106.68;
export const JAKARTA_LON_MAX = 107.00;

export const R_EARTH = 6378137.0;

/**
 * Convert lat/lon coordinates (WGS84) to Web Mercator EPSG:3857 (meters)
 */
export function toEPSG3857(lat: number, lon: number): [number, number] {
  const x = lon * (R_EARTH * Math.PI / 180.0);
  const latClamped = Math.max(-85.0511, Math.min(85.0511, lat));
  const y = Math.log(Math.tan((90.0 + latClamped) * Math.PI / 360.0)) * R_EARTH;
  return [x, y];
}

/**
 * Stable Linear Congruential Generator (LCG) to generate identical data across app sessions
 */
export class SeededRandom {
  private seed: number;
  constructor(seed: number = 42) {
    this.seed = seed;
  }
  // Returns pseudorandom float between 0 and 1
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  // Range: [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  // Normal distribution approximation (Box-Muller)
  normal(mean: number, std: number): number {
    const u1 = this.next() || 1e-10;
    const u2 = this.next() || 1e-10;
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z * std;
  }
  // Pick from array
  choice<T>(arr: T[]): T {
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }
}

// Fixed Weather Station templates (the 10 BMKG stations)
export const BASE_STATIONS: { name: string; lat: number; lon: number }[] = [
  { name: "Kemayoran BMKG", lat: -6.155, lon: 106.840 },
  { name: "Tanjung Priok Maritime", lat: -6.102, lon: 106.885 },
  { name: "Cengkareng Airport", lat: -6.126, lon: 106.656 },
  { name: "Halim Perdanakusuma", lat: -6.262, lon: 106.888 },
  { name: "Pasar Minggu Agro", lat: -6.285, lon: 106.835 },
  { name: "Kebon Jeruk Station", lat: -6.191, lon: 106.772 },
  { name: "Kelapa Gading Pos", lat: -6.162, lon: 106.901 },
  { name: "Kebayoran Baru Grid", lat: -6.230, lon: 106.804 },
  { name: "Pluit Coast Ward", lat: -6.115, lon: 106.791 },
  { name: "Pulo Gadung Industrial", lat: -6.195, lon: 106.895 }
];

// Major floodgates and river water level sensors
export const BASE_SENSORS: { name: string; lat: number; lon: number; baseLvl: number; flash: number }[] = [
  { name: "Pintu Air Manggarai", lat: -6.208, lon: 106.848, baseLvl: 180, flash: 55 },
  { name: "Pintu Air Karet", lat: -6.200, lon: 106.818, baseLvl: 160, flash: 45 },
  { name: "Pintu Air Pasar Ikan", lat: -6.125, lon: 106.808, baseLvl: 140, flash: 35 },
  { name: "Waduk Pluit Pump Gate", lat: -6.112, lon: 106.798, baseLvl: 120, flash: 40 },
  { name: "Pintu Air Istiqlal", lat: -6.168, lon: 106.831, baseLvl: 150, flash: 42 },
  { name: "Cipinang Hulu Monitoring", lat: -6.292, lon: 106.878, baseLvl: 170, flash: 50 },
  { name: "Pos Sunter Hulu", lat: -6.280, lon: 106.910, baseLvl: 190, flash: 48 },
  { name: "Pos Angke Hulu", lat: -6.310, lon: 106.715, baseLvl: 210, flash: 52 },
  { name: "Pos Pesanggrahan", lat: -6.315, lon: 106.762, baseLvl: 200, flash: 58 },
  { name: "Ciliwung Pos Depok", lat: -6.370, lon: 106.830, baseLvl: 240, flash: 65 },
  { name: "Ciliwung Katulampa (Remote)", lat: -6.400, lon: 106.850, baseLvl: 260, flash: 80 },
  { name: "Pintu Air Marina Ancol", lat: -6.118, lon: 106.852, baseLvl: 130, flash: 38 }
];

// Realistic Kelurahan subdistricts for mapping
export const KELURAHANS = [
  "Kampung Melayu", "Pluit", "Cawang", "Petamburan", "Rawajati", 
  "Bidara Cina", "Manggarai", "Karet Tengsin", "Kebon Baru", "Bukit Duri",
  "Penjaringan", "Kapuk", "Cengkareng Barat", "Kelapa Gading Barat", "Sunter Agung",
  "Pondok Pinang", "Pejaten Timur", "Grogol", "Tomang", "Kemayoran"
];

/**
 * Standard Simulation Presets representing extreme scenarios in Jakarta
 */
export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: "normal_dry",
    name: "Normal Dry Season",
    description: "Typical dry season baseline. Sparse localized showers, normal river channels, and all floodgates operating below warning level (Siaga 4).",
    rainMultiplier: 0.15,
    coastalTideCm: 80,
    stationRainfalls: [5, 2, 8, 4, 1, 3, 2, 0, 10, 3],
    sensorSpikes: []
  },
  {
    id: "monsoon_flood",
    name: "Heavy Monsoon Event",
    description: "Intense, widespread rainfall across the Ciliwung river catchment basin. Severe overflow at Manggarai and Bukit Duri (Siaga 1 warnings).",
    rainMultiplier: 1.35,
    coastalTideCm: 120,
    stationRainfalls: [75, 60, 95, 80, 110, 85, 70, 90, 65, 80],
    sensorSpikes: ["SENS_000", "SENS_009", "SENS_004", "SENS_005"] // Manggarai, Depok, Istiqlal, Cipinang
  },
  {
    id: "coastal_tidal",
    name: "Coastal Tidal (Rob) Flood",
    description: "High astronomically-driven spring tides flooding the Northern marshes of Pluit, Penjaringan, and Marina, aggravated by local downpours.",
    rainMultiplier: 0.85,
    coastalTideCm: 220,
    stationRainfalls: [45, 85, 40, 20, 15, 30, 75, 20, 90, 50],
    sensorSpikes: ["SENS_002", "SENS_003", "SENS_011"] // Pasar Ikan, Pluit Pump, Marina Ancol
  },
  {
    id: "south_thunderstorm",
    name: "Localized South Downpour",
    description: "Sudden, extremely heavy localized afternoon cloudburst in Southern Jakarta hills. Rapid flash rises in Pos Pesanggrahan and Pos Angke.",
    rainMultiplier: 1.50,
    coastalTideCm: 90,
    stationRainfalls: [12, 5, 8, 45, 115, 30, 15, 95, 10, 20],
    sensorSpikes: ["SENS_007", "SENS_008", "SENS_009"] // Angke, Pesanggrahan, Depok
  }
];

/**
 * Master Data Scaffolding Engine
 * Generates identical datasets for testing pipelines at high speeds.
 */
export function generateJakartaScaffolding(numRts: number = 30000): {
  rts: {
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
  }[];
  sensors: RiverSensor[];
  stations: WeatherStation[];
  catchments: CatchmentPolygon[];
} {
  const rand = new SeededRandom(1337); // Seeded for absolute consistency
  
  // 1. Weather Stations
  const stations: WeatherStation[] = BASE_STATIONS.map((st, i) => ({
    station_id: `STAT_${i.toString().padStart(3, '0')}`,
    name: st.name,
    lat: st.lat,
    lon: st.lon,
    current_rainfall_mm_hr: 12.5 // default baseline
  }));
  
  // 2. River Sensors
  const sensors: RiverSensor[] = [];
  // Expand standard list to 120 elements to show scale
  for (let i = 0; i < 120; i++) {
    const base = BASE_SENSORS[i % BASE_SENSORS.length];
    const sId = `SENS_${i.toString().padStart(3, '0')}`;
    
    // Slight variance in coordinate positioning for extended sensors
    const lat = i < BASE_SENSORS.length ? base.lat : base.lat + rand.range(-0.04, 0.04);
    const lon = i < BASE_SENSORS.length ? base.lon : base.lon + rand.range(-0.04, 0.04);
    
    // GEV Baseline stats: location (mu), scale (sigma), and shape (xi)
    // xi > 0 represents heavy-tailed Frechet extreme value flood patterns typical of river banks
    const mu = base.baseLvl + rand.range(-20, 20);
    const sigma = base.flash + rand.range(-5, 10);
    const xi = rand.range(0.06, 0.22); // GEV shape parameter
    
    sensors.push({
      sensor_id: sId,
      name: i < BASE_SENSORS.length ? base.name : `${base.name.replace("Monitoring", "").replace("Pos", "").trim()} Aux ${i - BASE_SENSORS.length + 1}`,
      lat,
      lon,
      water_level_cm: mu + rand.range(-30, 40), // current live water level baseline
      mu,
      sigma,
      xi,
      exceedance_prob: 0.01 // baseline
    });
  }
  
  // 3. 12 River Basin Catchment Polygons
  const catchments: CatchmentPolygon[] = [];
  // Use the first 12 sensors as the centers of major catchment polygons
  for (let i = 0; i < 12; i++) {
    const sensor = sensors[i];
    const [cx, cy] = toEPSG3857(sensor.lat, sensor.lon);
    
    // Make a 5-point irregular hexagonal catchment zone centered on the gate (approx 4-7km radius)
    const numVertices = 6;
    const vx: number[] = [];
    const vy: number[] = [];
    const radius = 5500 + rand.range(-1500, 2000); // meters radius
    
    for (let v = 0; v < numVertices; v++) {
      const angle = (v * 2 * Math.PI) / numVertices + rand.range(-0.2, 0.2);
      const r = radius * rand.range(0.8, 1.2);
      vx.push(cx + r * Math.cos(angle));
      vy.push(cy + r * Math.sin(angle));
    }
    // Close the loop
    vx.push(vx[0]);
    vy.push(vy[0]);
    
    catchments.push({
      sensor_id: sensor.sensor_id,
      vx,
      vy
    });
  }
  
  // 4. 30,000 Neighborhood Units (RTs)
  // Generating coordinates distributed across Jakarta (clustered around catchments)
  const rts: any[] = [];
  for (let i = 0; i < numRts; i++) {
    const rtId = `RT_${i.toString().padStart(5, '0')}`;
    
    // Slightly cluster RT coordinates around the rivers/sensors to represent historical settlement densities
    let lat, lon;
    if (rand.next() < 0.4) {
      // Clustered near a random river gate
      const targetSensor = sensors[Math.floor(rand.next() * 12)];
      lat = targetSensor.lat + rand.normal(0, 0.015);
      lon = targetSensor.lon + rand.normal(0, 0.015);
    } else {
      // Uniformly across general bounds
      lat = rand.range(JAKARTA_LAT_MIN, JAKARTA_LAT_MAX);
      lon = rand.range(JAKARTA_LON_MIN, JAKARTA_LON_MAX);
    }
    
    // Clamp to boundaries
    lat = Math.max(JAKARTA_LAT_MIN, Math.min(JAKARTA_LAT_MAX, lat));
    lon = Math.max(JAKARTA_LON_MIN, Math.min(JAKARTA_LON_MAX, lon));
    
    // Elevation: Southern Jakarta (~50m) dropping down to Northern tide-locked lowlands (~-2m)
    const elevationTrend = (JAKARTA_LAT_MAX - lat) / (JAKARTA_LAT_MAX - JAKARTA_LAT_MIN); // 0 (North) to 1 (South)
    let elevation = -1.8 + elevationTrend * 64.0 + rand.normal(0, 1.4);
    elevation = Math.max(-4.0, Math.min(80.0, elevation));
    
    const kelurahan = rand.choice(KELURAHANS);
    const [x_3857, y_3857] = toEPSG3857(lat, lon);
    
    rts.push({
      rt_id: rtId,
      kelurahan,
      lat,
      lon,
      x_3857,
      y_3857,
      demnas_elevation_m: elevation,
      associated_sensor_id: "SENS_000",
      interpolated_rainfall_mm_hr: 0,
      evt_exceedance_prob: 0,
      risk_priority_score: 0
    });
  }
  
  return { rts, sensors, stations, catchments };
}
