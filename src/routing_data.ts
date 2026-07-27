import { MusterPoint, RoadNode, RoadEdge } from "./types";

// Identified evacuation shelter muster points (safe zones) across Jakarta
export const MUSTER_POINTS: MusterPoint[] = [
  {
    id: "MP_001",
    name: "Monas Safe Command Zone",
    lat: -6.1754,
    lon: 106.8271,
    capacity: 25000,
    occupied: 3200,
  },
  {
    id: "MP_002",
    name: "GBK Evacuation Arena",
    lat: -6.2183,
    lon: 106.8022,
    capacity: 40000,
    occupied: 8400,
  },
  {
    id: "MP_003",
    name: "JIExpo Kemayoran Depot",
    lat: -6.1502,
    lon: 106.8485,
    capacity: 30000,
    occupied: 4100,
  },
  {
    id: "MP_004",
    name: "Tebet Eco Park High-Ground",
    lat: -6.2415,
    lon: 106.853,
    capacity: 15000,
    occupied: 1800,
  },
  {
    id: "MP_005",
    name: "Pluit Reservoir Safe Park",
    lat: -6.1205,
    lon: 106.7902,
    capacity: 12000,
    occupied: 520,
  },
  {
    id: "MP_006",
    name: "GOR Cengkareng Refuge",
    lat: -6.155,
    lon: 106.715,
    capacity: 18000,
    occupied: 2300,
  },
];

// Principal intersections / junctions in Jakarta
export const ROAD_NODES: RoadNode[] = [
  { id: "RN_001", name: "Harmoni Junction", lat: -6.167, lon: 106.82 },
  { id: "RN_002", name: "Semanggi Interchange", lat: -6.219, lon: 106.812 },
  { id: "RN_003", name: "Kuningan Cross", lat: -6.23, lon: 106.828 },
  { id: "RN_004", name: "Grogol Flyover", lat: -6.156, lon: 106.788 },
  { id: "RN_005", name: "Cawang Interchange", lat: -6.248, lon: 106.87 },
  { id: "RN_006", name: "Senen Intersection", lat: -6.178, lon: 106.843 },
  { id: "RN_007", name: "Kelapa Gading Cross", lat: -6.162, lon: 106.9 },
  { id: "RN_008", name: "Pluit Interchange", lat: -6.125, lon: 106.791 },
  { id: "RN_009", name: "Manggarai Node", lat: -6.209, lon: 106.849 },
  { id: "RN_010", name: "Kebayoran Baru Node", lat: -6.238, lon: 106.798 },
  { id: "RN_011", name: "Kemang Crossway", lat: -6.27, lon: 106.815 },
  { id: "RN_012", name: "Pancoran Flyover", lat: -6.244, lon: 106.847 },
  { id: "RN_013", name: "Tanjung Priok Circle", lat: -6.11, lon: 106.885 },
  { id: "RN_014", name: "Tomang Ring", lat: -6.175, lon: 106.79 },
  {
    id: "RN_015",
    name: "Kampung Melayu Interchange",
    lat: -6.224,
    lon: 106.862,
  },
  { id: "RN_016", name: "Pejaten Junction", lat: -6.285, lon: 106.835 },
  { id: "RN_017", name: "Cengkareng West Flyover", lat: -6.151, lon: 106.705 },
  { id: "RN_018", name: "Sunter Agung Node", lat: -6.145, lon: 106.86 },
  { id: "RN_019", name: "Rawamangun Node", lat: -6.195, lon: 106.885 },
  { id: "RN_020", name: "Pasar Minggu Depot", lat: -6.295, lon: 106.83 },
];

// Road connections with distances in kilometers
export const ROAD_EDGES: RoadEdge[] = [
  // Harmoni Core
  {
    fromId: "RN_001",
    toId: "RN_004",
    name: "Jl. Kyai Tapa",
    baseDistanceKm: 3.2,
  },
  {
    fromId: "RN_001",
    toId: "RN_006",
    name: "Jl. Suprapto",
    baseDistanceKm: 2.8,
  },
  {
    fromId: "RN_001",
    toId: "RN_009",
    name: "Jl. Thamrin-Sudirman",
    baseDistanceKm: 5.2,
  },

  // Semanggi & Kuningan
  {
    fromId: "RN_002",
    toId: "RN_003",
    name: "Jl. Gatot Subroto",
    baseDistanceKm: 2.0,
  },
  {
    fromId: "RN_002",
    toId: "RN_010",
    name: "Jl. Sisingamangaraja",
    baseDistanceKm: 2.6,
  },
  {
    fromId: "RN_002",
    toId: "RN_014",
    name: "Jl. Sudirman North",
    baseDistanceKm: 5.0,
  },
  {
    fromId: "RN_003",
    toId: "RN_012",
    name: "Jl. HR Rasuna Said",
    baseDistanceKm: 2.4,
  },
  {
    fromId: "RN_003",
    toId: "RN_009",
    name: "Jl. Casablanca",
    baseDistanceKm: 3.1,
  },

  // West Jakarta Flyovers
  {
    fromId: "RN_004",
    toId: "RN_014",
    name: "Jl. S. Parman",
    baseDistanceKm: 2.2,
  },
  {
    fromId: "RN_004",
    toId: "RN_008",
    name: "Jl. Latumenten",
    baseDistanceKm: 3.8,
  },
  {
    fromId: "RN_017",
    toId: "RN_014",
    name: "Jl. Daan Mogot East",
    baseDistanceKm: 9.5,
  },
  {
    fromId: "RN_017",
    toId: "RN_004",
    name: "Jl. Outer Ring West",
    baseDistanceKm: 8.2,
  },

  // East Interchange Channels
  {
    fromId: "RN_005",
    toId: "RN_012",
    name: "Jl. MT Haryono",
    baseDistanceKm: 2.8,
  },
  { fromId: "RN_005", toId: "RN_015", name: "Jl. Otista", baseDistanceKm: 2.9 },

  // Sunter & Senen
  {
    fromId: "RN_006",
    toId: "RN_018",
    name: "Jl. Benyamin Sueb",
    baseDistanceKm: 4.1,
  },
  {
    fromId: "RN_006",
    toId: "RN_009",
    name: "Jl. Matraman",
    baseDistanceKm: 3.8,
  },
  {
    fromId: "RN_007",
    toId: "RN_018",
    name: "Jl. Boulevard Barat",
    baseDistanceKm: 4.5,
  },
  {
    fromId: "RN_007",
    toId: "RN_019",
    name: "Jl. Perintis Kemerdekaan",
    baseDistanceKm: 3.9,
  },
  {
    fromId: "RN_008",
    toId: "RN_018",
    name: "Jl. RE Martadinata",
    baseDistanceKm: 6.8,
  },

  // Central River Crossings
  {
    fromId: "RN_009",
    toId: "RN_015",
    name: "Jl. Manggarai Utara",
    baseDistanceKm: 2.1,
  },

  // South Nodes & Kemang
  {
    fromId: "RN_010",
    toId: "RN_011",
    name: "Jl. Panglima Polim",
    baseDistanceKm: 3.6,
  },
  {
    fromId: "RN_011",
    toId: "RN_016",
    name: "Jl. Kemang Raya",
    baseDistanceKm: 2.8,
  },
  {
    fromId: "RN_012",
    toId: "RN_016",
    name: "Jl. Pasar Minggu Raya",
    baseDistanceKm: 4.6,
  },
  {
    fromId: "RN_016",
    toId: "RN_020",
    name: "Jl. Pejaten Barat",
    baseDistanceKm: 1.8,
  },

  // Harbor Access
  {
    fromId: "RN_013",
    toId: "RN_007",
    name: "Jl. Yos Sudarso",
    baseDistanceKm: 5.8,
  },
  {
    fromId: "RN_013",
    toId: "RN_018",
    name: "Jl. Enggano",
    baseDistanceKm: 4.9,
  },

  // Rawamangun Link
  { fromId: "RN_015", toId: "RN_019", name: "Jl. Pemuda", baseDistanceKm: 4.2 },
];

// Links connecting shelters (Muster Points) to the major road junction nodes
export const SHELTER_CONNECTORS: {
  shelterId: string;
  roadNodeId: string;
  distanceKm: number;
}[] = [
  { shelterId: "MP_001", roadNodeId: "RN_001", distanceKm: 0.8 }, // Monas to Harmoni
  { shelterId: "MP_001", roadNodeId: "RN_006", distanceKm: 1.2 }, // Monas to Senen
  { shelterId: "MP_002", roadNodeId: "RN_002", distanceKm: 0.9 }, // GBK to Semanggi
  { shelterId: "MP_002", roadNodeId: "RN_010", distanceKm: 1.4 }, // GBK to Kebayoran Baru
  { shelterId: "MP_003", roadNodeId: "RN_018", distanceKm: 1.1 }, // JIExpo to Sunter Agung
  { shelterId: "MP_003", roadNodeId: "RN_001", distanceKm: 2.4 }, // JIExpo to Harmoni
  { shelterId: "MP_004", roadNodeId: "RN_012", distanceKm: 1.0 }, // Tebet Eco Park to Pancoran
  { shelterId: "MP_004", roadNodeId: "RN_015", distanceKm: 1.8 }, // Tebet Eco Park to Kampung Melayu
  { shelterId: "MP_005", roadNodeId: "RN_008", distanceKm: 0.6 }, // Pluit Reservoir Park to Pluit Interchange
  { shelterId: "MP_006", roadNodeId: "RN_017", distanceKm: 0.5 }, // GOR Cengkareng to Cengkareng Flyover
];
