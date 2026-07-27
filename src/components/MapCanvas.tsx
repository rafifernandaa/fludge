import React, { useRef, useEffect, useState, useMemo } from "react";
import * as d3 from "d3";
import {
  Plus,
  Minus,
  RotateCcw,
  Video,
  Truck,
  Ship,
  Package,
  Layers,
  Compass,
  Radio,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import {
  NeighborhoodRT,
  RiverSensor,
  WeatherStation,
  CatchmentPolygon,
  EvacuationRoute,
  MusterPoint,
  LogisticsAsset,
} from "../types";
import { MUSTER_POINTS } from "../routing_data";

interface MapCanvasProps {
  isDarkMode?: boolean;
  rts: NeighborhoodRT[];
  sensors: RiverSensor[];
  stations: WeatherStation[];
  catchments: CatchmentPolygon[];
  selectedSensorId: string | null;
  onSelectSensor: (sensorId: string) => void;
  selectedRt: NeighborhoodRT | null;
  onSelectRt: (rt: NeighborhoodRT | null) => void;
  activeRoute: EvacuationRoute | null;
  onCctvClick?: (sensorId: string) => void;
}

// Major Jakarta River Flow Networks (South to North)
const MAJOR_RIVERS = [
  {
    name: "Sungai Ciliwung",
    coords: [
      [-6.40, 106.85],   // Katulampa
      [-6.37, 106.83],   // Depok
      [-6.292, 106.878], // Cipinang Hulu
      [-6.26, 106.86],   // Rawajati/Pejaten
      [-6.22, 106.85],   // Bidara Cina
      [-6.2088, 106.8456], // Manggarai
      [-6.168, 106.831], // Istiqlal
      [-6.118, 106.852], // Ancol Marina
    ],
  },
  {
    name: "Sungai Pesanggrahan",
    coords: [
      [-6.315, 106.762], // Pos Pesanggrahan
      [-6.25, 106.76],
      [-6.19, 106.77],   // Kebon Jeruk
      [-6.12, 106.74],   // Cengkareng Drain
    ],
  },
  {
    name: "Sungai Sunter",
    coords: [
      [-6.28, 106.91],   // Sunter Hulu
      [-6.22, 106.89],
      [-6.16, 106.88],   // Sunter Agung
      [-6.11, 106.89],   // Yos Sudarso outlet
    ],
  },
  {
    name: "Sungai Angke",
    coords: [
      [-6.31, 106.715],  // Angke Hulu
      [-6.22, 106.71],
      [-6.16, 106.72],   // Daan Mogot
      [-6.11, 106.77],   // Muara Angke
    ],
  },
];

export const MapCanvas: React.FC<MapCanvasProps> = ({
  rts,
  sensors,
  stations,
  catchments,
  selectedSensorId,
  onSelectSensor,
  selectedRt,
  onSelectRt,
  activeRoute,
  onCctvClick,
  isDarkMode = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredSensor, setHoveredSensor] = useState<RiverSensor | null>(null);
  const [hoveredStation, setHoveredStation] = useState<WeatherStation | null>(null);
  const [hoveredMusterPoint, setHoveredMusterPoint] = useState<MusterPoint | null>(null);
  const [hoveredRt, setHoveredRt] = useState<NeighborhoodRT | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [activeLayer, setActiveLayer] = useState<"depth" | "evacuation" | "density">("depth");
  const [showCctvLayer, setShowCctvLayer] = useState<boolean>(true);
  const [showLogisticsLayer, setShowLogisticsLayer] = useState<boolean>(true);

  const logisticsAssets = useMemo<LogisticsAsset[]>(() => {
    const assets: LogisticsAsset[] = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const typeRand = (i * 17) % 100 / 100;
      const type =
        typeRand < 0.4
          ? "rescue_boat"
          : typeRand < 0.7
            ? "evac_truck"
            : "medical_cache";
      const lat = -6.37 + ((i * 13) % 29) / 100;
      const lon = 106.70 + ((i * 19) % 28) / 100;
      assets.push({
        id: `asset-${i}`,
        type,
        lat,
        lon,
        status: i % 3 === 0 ? "en_route" : "available",
      });
    }
    return assets;
  }, []);

  const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const d3CanvasRef = useRef<d3.Selection<
    HTMLCanvasElement,
    unknown,
    null,
    undefined
  > | null>(null);

  // Resize handler for canvas
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Create D3 projection fitting all Jakarta bounds nicely
  const projection = useMemo(() => {
    const padding = 20;
    return d3.geoMercator().fitExtent(
      [
        [padding, padding],
        [dimensions.width - padding, dimensions.height - padding],
      ],
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [106.65, -6.42], // South-West bound (Depok/Katulampa)
            },
            properties: {},
          },
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [107.03, -6.06], // North-East bound (Ancol/Tanjung Priok)
            },
            properties: {},
          },
        ],
      } as any
    );
  }, [dimensions]);

  const getXY = (lat: number, lon: number): [number, number] => {
    const proj = projection([lon, lat]);
    if (!proj) return [0, 0];
    return [proj[0], proj[1]];
  };

  const handleZoomIn = () => {
    if (d3CanvasRef.current && zoomRef.current) {
      d3CanvasRef.current.transition().duration(300).call(zoomRef.current.scaleBy as any, 1.4);
    }
  };

  const handleZoomOut = () => {
    if (d3CanvasRef.current && zoomRef.current) {
      d3CanvasRef.current.transition().duration(300).call(zoomRef.current.scaleBy as any, 1 / 1.4);
    }
  };

  const handleResetZoom = () => {
    if (d3CanvasRef.current && zoomRef.current) {
      d3CanvasRef.current.transition().duration(400).call(zoomRef.current.transform as any, d3.zoomIdentity);
    }
  };

  // Initialize D3 Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const d3Canvas = d3.select(canvas);
    d3CanvasRef.current = d3Canvas;
    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.5, 12])
      .on("zoom", (event) => {
        setTransform(event.transform);
      });

    zoomRef.current = zoom;
    d3Canvas.call(zoom as any);
  }, []);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Clear background
    ctx.fillStyle = isDarkMode ? "#090d16" : "#f8f9fa";
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Save context for transform zoom & pan
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    // 2. Architectural Grid Lines
    ctx.strokeStyle = isDarkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(226, 232, 240, 0.6)";
    ctx.lineWidth = 0.5 / transform.k;
    const gridSize = 40;
    const startX = -transform.x / transform.k;
    const endX = (dimensions.width - transform.x) / transform.k;
    const startY = -transform.y / transform.k;
    const endY = (dimensions.height - transform.y) / transform.k;

    for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // 3. Catchment Polygons
    catchments.forEach((c) => {
      const isSelected = selectedSensorId === c.sensor_id;
      const sensor = sensors.find((s) => s.sensor_id === c.sensor_id);
      if (!sensor) return;

      ctx.beginPath();
      for (let v = 0; v < c.vx.length; v++) {
        const dx_meters = c.vx[v] - c.vx[0];
        const dy_meters = c.vy[v] - c.vy[0];
        const vLat = sensor.lat + dy_meters * 0.000009;
        const vLon = sensor.lon + dx_meters * 0.00001;

        const [vx, vy] = getXY(vLat, vLon);
        if (v === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();

      if (isSelected) {
        ctx.fillStyle = "rgba(192, 38, 211, 0.15)";
        ctx.strokeStyle = "rgba(192, 38, 211, 0.8)";
        ctx.lineWidth = 2 / transform.k;
        ctx.setLineDash([6 / transform.k, 4 / transform.k]);
      } else {
        ctx.fillStyle = isDarkMode
          ? "rgba(30, 41, 59, 0.25)"
          : "rgba(241, 245, 249, 0.5)";
        ctx.strokeStyle = isDarkMode ? "rgba(71, 85, 105, 0.25)" : "rgba(203, 213, 225, 0.6)";
        ctx.lineWidth = 0.8 / transform.k;
      }
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 4. Major Rivers Network Lines
    MAJOR_RIVERS.forEach((river) => {
      ctx.beginPath();
      river.coords.forEach(([rLat, rLon], idx) => {
        const [rx, ry] = getXY(rLat, rLon);
        if (idx === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      });
      ctx.strokeStyle = isDarkMode ? "rgba(37, 99, 235, 0.65)" : "rgba(59, 130, 246, 0.75)";
      ctx.lineWidth = 3.5 / Math.sqrt(transform.k);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    });

    // 5. 30,000 RT Neighborhood points (Terracotta -> Rose Magenta -> Royal Indigo)
    const ptSize = Math.max(0.8, 1.5 / Math.sqrt(transform.k));
    rts.forEach((rt) => {
      const [x, y] = getXY(rt.lat, rt.lon);

      let color = "";
      if (activeLayer === "density") {
        const den = rt.population_density || 5000;
        if (den > 35000) color = "#d97706";
        else if (den > 25000) color = "#c026d3";
        else if (den > 15000) color = "#2563eb";
        else color = isDarkMode ? "rgba(71, 85, 105, 0.3)" : "rgba(203, 213, 225, 0.5)";
      } else if (activeLayer === "evacuation") {
        color = isDarkMode ? "rgba(71, 85, 105, 0.2)" : "rgba(203, 213, 225, 0.4)";
      } else {
        if (rt.risk_priority_score > 0.72) color = "#e11d48";
        else if (rt.risk_priority_score > 0.5) color = "#c026d3";
        else if (rt.risk_priority_score > 0.3) color = "#2563eb";
        else color = isDarkMode ? "rgba(51, 65, 85, 0.4)" : "rgba(203, 213, 225, 0.6)";
      }

      ctx.fillStyle = color;
      ctx.fillRect(x - ptSize / 2, y - ptSize / 2, ptSize, ptSize);
    });

    // 6. Selected RT Highlight Ring
    if (selectedRt) {
      const [x, y] = getXY(selectedRt.lat, selectedRt.lon);
      ctx.beginPath();
      ctx.arc(x, y, 7 / Math.sqrt(transform.k), 0, 2 * Math.PI);
      ctx.fillStyle = "#c026d3";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2 / Math.sqrt(transform.k);
      ctx.stroke();
    }

    // 7. Dijkstra Evacuation Route Line
    if (selectedRt && activeRoute && activeRoute.pathNodes.length > 0) {
      const [rtX, rtY] = getXY(selectedRt.lat, selectedRt.lon);

      ctx.beginPath();
      ctx.moveTo(rtX, rtY);
      activeRoute.pathNodes.forEach((node) => {
        const [nx, ny] = getXY(node.lat, node.lon);
        ctx.lineTo(nx, ny);
      });

      ctx.strokeStyle = "#d97706"; // Terracotta Gold path
      ctx.lineWidth = 4 / Math.sqrt(transform.k);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    // 8. Muster Points / Shelters
    MUSTER_POINTS.forEach((mp) => {
      const [x, y] = getXY(mp.lat, mp.lon);
      const isTarget = activeRoute && activeRoute.musterPoint.id === mp.id;
      const r = (isTarget ? 7 : 5) / Math.sqrt(transform.k);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = isTarget ? "#10b981" : "#2563eb";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5 / Math.sqrt(transform.k);
      ctx.stroke();
    });

    // 9. Weather Stations (BMKG)
    stations.forEach((st) => {
      const [x, y] = getXY(st.lat, st.lon);
      const r = 4 / Math.sqrt(transform.k);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = "#06b6d4"; // Cyan
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1 / Math.sqrt(transform.k);
      ctx.stroke();
    });

    // 10. River Telemetry Sensors (Pintu Air / Gates)
    sensors.forEach((s) => {
      const [x, y] = getXY(s.lat, s.lon);
      const isSelected = selectedSensorId === s.sensor_id;
      const r = (isSelected ? 7 : 5) / Math.sqrt(transform.k);

      // Warning pulse ring
      if (s.exceedance_prob > 0.5) {
        ctx.beginPath();
        ctx.arc(x, y, 12 / Math.sqrt(transform.k), 0, Math.PI * 2);
        ctx.strokeStyle = s.exceedance_prob > 0.8 ? "rgba(225, 29, 72, 0.7)" : "rgba(192, 38, 211, 0.7)";
        ctx.lineWidth = 1.5 / Math.sqrt(transform.k);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = s.exceedance_prob > 0.8 ? "#e11d48" : s.exceedance_prob > 0.5 ? "#c026d3" : "#2563eb";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2 / Math.sqrt(transform.k);
      ctx.stroke();

      // Label when zoomed in or selected
      if (transform.k > 1.4 || isSelected) {
        ctx.fillStyle = isDarkMode ? "#f8fafc" : "#0f172a";
        ctx.font = `bold ${Math.max(9, Math.min(13, 11 / Math.sqrt(transform.k)))}px monospace`;
        ctx.fillText(s.name, x + 8 / Math.sqrt(transform.k), y + 3 / Math.sqrt(transform.k));
      }
    });

    // 11. Logistics Assets
    if (showLogisticsLayer) {
      logisticsAssets.forEach((asset) => {
        const [x, y] = getXY(asset.lat, asset.lon);
        const r = 3.5 / Math.sqrt(transform.k);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = asset.type === "rescue_boat" ? "#f59e0b" : asset.type === "evac_truck" ? "#10b981" : "#8b5cf6";
        ctx.fill();
      });
    }

    ctx.restore();
  }, [dimensions, rts, sensors, stations, catchments, selectedSensorId, selectedRt, activeRoute, activeLayer, transform, isDarkMode, showLogisticsLayer, logisticsAssets]);

  // Handle click on canvas to select Sensor or RT
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const projX = (rawX - transform.x) / transform.k;
    const projY = (rawY - transform.y) / transform.k;

    // Check Sensors first
    let foundSensor: RiverSensor | null = null;
    for (const s of sensors) {
      const [sx, sy] = getXY(s.lat, s.lon);
      const dist = Math.hypot(projX - sx, projY - sy);
      if (dist < 14 / transform.k) {
        foundSensor = s;
        break;
      }
    }

    if (foundSensor) {
      onSelectSensor(foundSensor.sensor_id);
      return;
    }

    // Check RTs
    let nearestRt: NeighborhoodRT | null = null;
    let minDist = 18 / transform.k;
    for (const rt of rts) {
      const [rx, ry] = getXY(rt.lat, rt.lon);
      const dist = Math.hypot(projX - rx, projY - ry);
      if (dist < minDist) {
        minDist = dist;
        nearestRt = rt;
      }
    }

    if (nearestRt) {
      onSelectRt(nearestRt);
    }
  };

  // Hover detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const projX = (rawX - transform.x) / transform.k;
    const projY = (rawY - transform.y) / transform.k;

    let hoverS: RiverSensor | null = null;
    for (const s of sensors) {
      const [sx, sy] = getXY(s.lat, s.lon);
      if (Math.hypot(projX - sx, projY - sy) < 14 / transform.k) {
        hoverS = s;
        break;
      }
    }

    if (hoverS) {
      setHoveredSensor(hoverS);
      setTooltipPos({ x: rawX, y: rawY });
      return;
    } else {
      setHoveredSensor(null);
    }

    let hoverMp: MusterPoint | null = null;
    for (const mp of MUSTER_POINTS) {
      const [mx, my] = getXY(mp.lat, mp.lon);
      if (Math.hypot(projX - mx, projY - my) < 12 / transform.k) {
        hoverMp = mp;
        break;
      }
    }

    if (hoverMp) {
      setHoveredMusterPoint(hoverMp);
      setTooltipPos({ x: rawX, y: rawY });
      return;
    } else {
      setHoveredMusterPoint(null);
    }

    setTooltipPos(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[400px] select-none overflow-hidden">
      {/* Top Map Layer Switcher Controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-xl border border-stone-200 dark:border-slate-800 shadow-md backdrop-blur-md">
        <button
          onClick={() => setActiveLayer("depth")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
            activeLayer === "depth"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
          }`}
        >
          Flood Hazard
        </button>
        <button
          onClick={() => setActiveLayer("density")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
            activeLayer === "density"
              ? "bg-fuchsia-600 text-white shadow-sm"
              : "text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
          }`}
        >
          Population
        </button>
        <button
          onClick={() => setActiveLayer("evacuation")}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
            activeLayer === "evacuation"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-stone-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
          }`}
        >
          Evacuation
        </button>
      </div>

      {/* Map Control Buttons (Zoom +/- & Layers) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-200 shadow-md hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-200 shadow-md hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          title="Reset Zoom"
          className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-200 shadow-md hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Compact Risk Legend Bar (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/90 dark:bg-slate-900/90 px-3 py-2 rounded-xl border border-stone-200 dark:border-slate-800 shadow-md backdrop-blur-md space-y-1 font-mono text-[10px]">
        <div className="text-stone-500 dark:text-slate-400 font-bold uppercase text-[9px]">
          Risk Spectrum
        </div>
        <div className="w-36 h-2 rounded-full bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-amber-600"></div>
        <div className="flex justify-between text-stone-600 dark:text-slate-400 text-[9px]">
          <span>Low</span>
          <span>Warning</span>
          <span>Critical</span>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredSensor && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 font-mono space-y-1"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 12 }}
        >
          <div className="font-bold text-cyan-400">{hoveredSensor.name}</div>
          <div>Water Level: <span className="font-bold text-amber-400">{hoveredSensor.water_level_cm.toFixed(0)} cm</span></div>
          <div>Risk Exceedance: <span className="font-bold text-rose-400">{(hoveredSensor.exceedance_prob * 100).toFixed(1)}%</span></div>
        </div>
      )}

      {hoveredMusterPoint && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-xl border border-slate-700 font-mono space-y-1"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 12 }}
        >
          <div className="font-bold text-emerald-400">{hoveredMusterPoint.name}</div>
          <div>Capacity: <span className="font-bold">{hoveredMusterPoint.capacity} persons</span></div>
          <div>Location: <span className="text-slate-300">{hoveredMusterPoint.kelurahan}</span></div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />
    </div>
  );
};
