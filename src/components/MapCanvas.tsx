import React, { useRef, useEffect, useState } from 'react';
import { NeighborhoodRT, RiverSensor, WeatherStation, CatchmentPolygon, EvacuationRoute, MusterPoint } from '../types';
import { JAKARTA_LAT_MIN, JAKARTA_LAT_MAX, JAKARTA_LON_MIN, JAKARTA_LON_MAX } from '../data';
import { MUSTER_POINTS } from '../routing_data';

interface MapCanvasProps {
  rts: NeighborhoodRT[];
  sensors: RiverSensor[];
  stations: WeatherStation[];
  catchments: CatchmentPolygon[];
  selectedSensorId: string | null;
  onSelectSensor: (sensorId: string) => void;
  selectedRt: NeighborhoodRT | null;
  onSelectRt: (rt: NeighborhoodRT | null) => void;
  activeRoute: EvacuationRoute | null;
}

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 480 });
  const [hoveredSensor, setHoveredSensor] = useState<RiverSensor | null>(null);
  const [hoveredStation, setHoveredStation] = useState<WeatherStation | null>(null);
  const [hoveredMusterPoint, setHoveredMusterPoint] = useState<MusterPoint | null>(null);

  // Resize handler for canvas
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(300, width),
          height: Math.max(300, height || 480),
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Map latitude/longitude to canvas XY
  const getXY = (lat: number, lon: number) => {
    // Linear scale inside Jakarta boundaries
    const padding = 35;
    const scaleX = (dimensions.width - 2 * padding) / (JAKARTA_LON_MAX - JAKARTA_LON_MIN);
    const scaleY = (dimensions.height - 2 * padding) / (JAKARTA_LAT_MAX - JAKARTA_LAT_MIN);
    
    const x = padding + (lon - JAKARTA_LON_MIN) * scaleX;
    // Invert Y because canvas coordinates have (0,0) at the top-left
    const y = dimensions.height - padding - (lat - JAKARTA_LAT_MIN) * scaleY;
    
    return [x, y];
  };

  // Convert canvas XY back to lat/lon for clicking
  const getLatLon = (x: number, y: number) => {
    const padding = 35;
    const scaleX = (dimensions.width - 2 * padding) / (JAKARTA_LON_MAX - JAKARTA_LON_MIN);
    const scaleY = (dimensions.height - 2 * padding) / (JAKARTA_LAT_MAX - JAKARTA_LAT_MIN);
    
    const lon = JAKARTA_LON_MIN + (x - padding) / scaleX;
    const lat = JAKARTA_LAT_MIN + (dimensions.height - padding - y) / scaleY;
    
    return { lat, lon };
  };

  // Draw the full GIS map onto the Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 1. Clear background (Deep dark space-GIS slate look)
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    
    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)'; // slate-700
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < dimensions.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, dimensions.height);
      ctx.stroke();
    }
    for (let y = 0; y < dimensions.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.width, y);
      ctx.stroke();
    }

    // 2. Draw catchment boundary polygons (translucent fills & dashed strokes)
    catchments.forEach((c) => {
      const isSelected = selectedSensorId === c.sensor_id;
      ctx.beginPath();
      
      // We need to convert vertices from EPSG:3857 back to lat/lon for canvas projection
      // In a real GIS app we'd project. Since catchments coordinates are created from sensor lat/lons:
      // We can map vertices by scaling their offsets. Or simpler: convert back using the inverse.
      // Let's retrieve vertices in Lat/Lon and project to Canvas:
      const sensor = sensors.find(s => s.sensor_id === c.sensor_id);
      if (!sensor) return;
      
      const [sX, sY] = getXY(sensor.lat, sensor.lon);
      
      // Let's draw catchment hexagonal zones around each of the 12 primary sensors
      ctx.beginPath();
      for (let v = 0; v < c.vx.length; v++) {
        // Approximate scaling: 1 meter in EPSG:3857 is approx 0.000009 degrees of lat/lon
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
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)'; // pulsing cyan
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.015)'; // very faint
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
      }
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]); // reset
    });

    // 3. Draw 30,000 RT Neighborhood points (Heatmap style)
    // To draw 30,000 points instantly, we use ImageData or fast canvas arc drawing.
    // Rect draws are extremely fast.
    rts.forEach((rt) => {
      const [x, y] = getXY(rt.lat, rt.lon);
      
      // Map Risk Score to a distinct solid color
      let color = '';
      if (rt.risk_priority_score > 0.72) {
        color = '#ef4444'; // Red (Severe hazard / evacuations)
      } else if (rt.risk_priority_score > 0.50) {
        color = '#f97316'; // Orange (High risk)
      } else if (rt.risk_priority_score > 0.30) {
        color = '#eab308'; // Yellow (Warning)
      } else {
        color = 'rgba(71, 85, 105, 0.25)'; // Dark Slate-600 (Low risk)
      }
      
      // If this specific RT is selected, draw a highlight ring later
      if (selectedRt && selectedRt.rt_id === rt.rt_id) {
        // Handled below
      } else {
        ctx.fillStyle = color;
        ctx.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      }
    });

    // Highlight selected RT point if present
    if (selectedRt) {
      const [x, y] = getXY(selectedRt.lat, selectedRt.lon);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#22c55e'; // Bright Green for selected
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 3.5. Draw Dijkstra Evacuation Route and shelters (Muster Points)
    if (selectedRt && activeRoute && activeRoute.pathNodes.length > 0) {
      ctx.beginPath();
      const [rtX, rtY] = getXY(selectedRt.lat, selectedRt.lon);
      ctx.moveTo(rtX, rtY);

      activeRoute.pathNodes.forEach((node) => {
        const [nx, ny] = getXY(node.lat, node.lon);
        ctx.lineTo(nx, ny);
      });

      // Outer glow styling for the evacuation path
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.75)'; // Transparent solid emerald
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Inner moving dashed white styling for action-path visual cues
      ctx.beginPath();
      ctx.moveTo(rtX, rtY);
      activeRoute.pathNodes.forEach((node) => {
        const [nx, ny] = getXY(node.lat, node.lon);
        ctx.lineTo(nx, ny);
      });
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.setLineDash([8, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Shelter Muster Points
    MUSTER_POINTS.forEach((mp) => {
      const [x, y] = getXY(mp.lat, mp.lon);
      const isTargetShelter = activeRoute && activeRoute.musterPoint.id === mp.id;
      const isHovered = hoveredMusterPoint?.id === mp.id;

      // Outer ring animation/halo for target shelter
      if (isTargetShelter) {
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(x, y, 19, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw solid refuge shield symbol (represented as circle-pentagon or custom styling)
      ctx.beginPath();
      ctx.arc(x, y, isTargetShelter ? 9 : 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#10b981'; // Emerald-500
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Write 'H' (Haven) inside shelter center
      ctx.font = `bold ${isTargetShelter ? '9px' : '8px'} monospace`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', x, y);
    });

    // 4. Draw Rivers (Ciliwung, Pesanggrahan, Sunter) flowing South to North
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)'; // trans blue
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw 3 simulated river channels
    const rivers = [
      // Ciliwung
      [[-6.37, 106.84], [-6.30, 106.85], [-6.25, 106.83], [-6.208, 106.848], [-6.16, 106.83], [-6.11, 106.84]],
      // Pesanggrahan / Angke
      [[-6.36, 106.73], [-6.315, 106.762], [-6.25, 106.75], [-6.18, 106.72], [-6.12, 106.73]],
      // Sunter
      [[-6.35, 106.91], [-6.28, 106.91], [-6.20, 106.89], [-6.15, 106.90], [-6.09, 106.895]]
    ];
    
    rivers.forEach((coords) => {
      ctx.beginPath();
      coords.forEach(([lat, lon], idx) => {
        const [x, y] = getXY(lat, lon);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // 5. Draw Weather Stations (BMKG) with rainwave animations
    stations.forEach((st) => {
      const [x, y] = getXY(st.lat, st.lon);
      const isHovered = hoveredStation?.station_id === st.station_id;
      
      ctx.beginPath();
      ctx.arc(x, y, isHovered ? 7 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#06b6d4'; // BMKG Cyan
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Concentric rainfall rings based on current mm/hr
      ctx.beginPath();
      ctx.arc(x, y, 10 + st.current_rainfall_mm_hr * 0.18, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 6. Draw River Sensors / Gates
    sensors.forEach((s) => {
      const [x, y] = getXY(s.lat, s.lon);
      const isSelected = selectedSensorId === s.sensor_id;
      const isHovered = hoveredSensor?.sensor_id === s.sensor_id;
      
      // Determine color from exceedance probability (EVT threshold)
      let color = '#3b82f6'; // Blue (Siaga 4 / Safe)
      if (s.exceedance_prob > 0.8) {
        color = '#ef4444'; // Red (Siaga 1)
      } else if (s.exceedance_prob > 0.5) {
        color = '#f97316'; // Orange (Siaga 2)
      } else if (s.exceedance_prob > 0.2) {
        color = '#eab308'; // Yellow (Siaga 3)
      }
      
      // Selection ring
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fill();
      }
      
      // Core dot representing active sensor
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 7. Render scale and legend markers inside the canvas HUD
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(dimensions.width - 150, dimensions.height - 160, 140, 150);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(dimensions.width - 150, dimensions.height - 160, 140, 150);
    
    // Legend text
    ctx.font = '10px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('GIS RISK HUD', dimensions.width - 140, dimensions.height - 145);
    
    const legendItems = [
      { color: '#ef4444', text: 'Severe / Evac' },
      { color: '#f97316', text: 'High Hazard' },
      { color: '#eab308', text: 'Warning RT' },
      { color: '#3b82f6', text: 'River Sensor' },
      { color: '#06b6d4', text: 'BMKG Station' },
      { color: '#10b981', text: 'Muster Haven' },
      { color: '#22c55e', text: 'Evac Route' }
    ];
    
    legendItems.forEach((item, index) => {
      const ly = dimensions.height - 130 + index * 14;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(dimensions.width - 136, ly, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.text, dimensions.width - 124, ly);
    });

  }, [dimensions, rts, sensors, stations, catchments, selectedSensorId, selectedRt, hoveredSensor, hoveredStation, activeRoute, hoveredMusterPoint]);

  // Handle canvas click to select sensors, stations, or nearest RT
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // 1. Check if clicked near a River Sensor (12px tolerance)
    for (let s of sensors) {
      const [x, y] = getXY(s.lat, s.lon);
      const dist = Math.hypot(clickX - x, clickY - y);
      if (dist < 12) {
        onSelectSensor(s.sensor_id);
        onSelectRt(null); // clear RT selection
        return;
      }
    }
    
    // 2. Check if clicked near an RT unit (10px tolerance, find nearest)
    let nearestRt: NeighborhoodRT | null = null;
    let minRtDist = 10;
    
    rts.forEach((rt) => {
      const [x, y] = getXY(rt.lat, rt.lon);
      const dist = Math.hypot(clickX - x, clickY - y);
      if (dist < minRtDist) {
        minRtDist = dist;
        nearestRt = rt;
      }
    });
    
    if (nearestRt) {
      onSelectRt(nearestRt);
    } else {
      onSelectRt(null);
    }
  };

  // Handle canvas hover to show custom tooltips
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    let hoveredS: RiverSensor | null = null;
    let hoveredSt: WeatherStation | null = null;
    let hoveredMp: MusterPoint | null = null;
    
    // Check Muster Points (12px tolerance)
    for (let mp of MUSTER_POINTS) {
      const [x, y] = getXY(mp.lat, mp.lon);
      if (Math.hypot(mouseX - x, mouseY - y) < 12) {
        hoveredMp = mp;
        break;
      }
    }

    // Check sensors
    if (!hoveredMp) {
      for (let s of sensors) {
        const [x, y] = getXY(s.lat, s.lon);
        if (Math.hypot(mouseX - x, mouseY - y) < 10) {
          hoveredS = s;
          break;
        }
      }
    }
    
    // Check stations
    if (!hoveredMp && !hoveredS) {
      for (let st of stations) {
        const [x, y] = getXY(st.lat, st.lon);
        if (Math.hypot(mouseX - x, mouseY - y) < 8) {
          hoveredSt = st;
          break;
        }
      }
    }
    
    setHoveredSensor(hoveredS);
    setHoveredStation(hoveredSt);
    setHoveredMusterPoint(hoveredMp);
    canvas.style.cursor = (hoveredS || hoveredSt || hoveredMp) ? 'pointer' : 'default';
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950 rounded-xl border border-slate-800 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        className="block"
      />
      
      {/* Floating Spatial GIS Map HUD Overlay */}
      <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-slate-800 pointer-events-none">
        <h3 className="font-display font-medium text-xs tracking-wider text-brand-cyan">GIS GEOSPATIAL STAGE</h3>
        <p className="text-[10px] font-mono text-slate-400 mt-1">PROJECTION: EPSG:3857 WEB MERCATOR</p>
        <p className="text-[10px] font-mono text-slate-500 mt-0.5">RESOLVED CORES: 30,000 NEIGHBORHOOD UNITS</p>
      </div>

      {/* Real-Time Hover Information Tooltips */}
      {hoveredSensor && (
        <div 
          className="absolute bg-slate-950/95 border border-slate-700 p-3 rounded-lg text-xs pointer-events-none shadow-2xl z-20 font-mono text-white max-w-xs"
          style={{ 
            left: `${Math.min(dimensions.width - 240, getXY(hoveredSensor.lat, hoveredSensor.lon)[0] + 15)}px`, 
            top: `${Math.min(dimensions.height - 130, getXY(hoveredSensor.lat, hoveredSensor.lon)[1] - 30)}px` 
          }}
        >
          <div className="text-brand-cyan font-bold">{hoveredSensor.name}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ID: {hoveredSensor.sensor_id}</div>
          <div className="mt-1.5 flex justify-between gap-4">
            <span className="text-slate-400">Live TMA Level:</span>
            <span className="font-semibold text-white">{hoveredSensor.water_level_cm.toFixed(1)} cm</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">EVT Exceedance P:</span>
            <span className="font-semibold text-brand-orange">{(hoveredSensor.exceedance_prob * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between gap-4 text-[10px] border-t border-slate-800 mt-1 pt-1 text-slate-500">
            <span>&mu;={hoveredSensor.mu.toFixed(0)} &sigma;={hoveredSensor.sigma.toFixed(0)} &xi;={hoveredSensor.xi.toFixed(2)}</span>
          </div>
        </div>
      )}

      {hoveredStation && (
        <div 
          className="absolute bg-slate-950/95 border border-slate-700 p-3 rounded-lg text-xs pointer-events-none shadow-2xl z-20 font-mono text-white max-w-xs"
          style={{ 
            left: `${Math.min(dimensions.width - 240, getXY(hoveredStation.lat, hoveredStation.lon)[0] + 15)}px`, 
            top: `${Math.min(dimensions.height - 120, getXY(hoveredStation.lat, hoveredStation.lon)[1] - 30)}px` 
          }}
        >
          <div className="text-brand-cyan font-bold">{hoveredStation.name} Weather Grid</div>
          <div className="text-[10px] text-slate-400 mt-0.5">ID: {hoveredStation.station_id}</div>
          <div className="mt-1.5 flex justify-between gap-4">
            <span className="text-slate-400">Current Rainfall:</span>
            <span className="font-semibold text-white">{hoveredStation.current_rainfall_mm_hr.toFixed(1)} mm/hr</span>
          </div>
        </div>
      )}

      {hoveredMusterPoint && (
        <div 
          className="absolute bg-slate-950/95 border border-emerald-500/50 p-3 rounded-lg text-xs pointer-events-none shadow-2xl z-20 font-mono text-white max-w-xs"
          style={{ 
            left: `${Math.min(dimensions.width - 240, getXY(hoveredMusterPoint.lat, hoveredMusterPoint.lon)[0] + 15)}px`, 
            top: `${Math.min(dimensions.height - 140, getXY(hoveredMusterPoint.lat, hoveredMusterPoint.lon)[1] - 30)}px` 
          }}
        >
          <div className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {hoveredMusterPoint.name}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">ID: {hoveredMusterPoint.id}</div>
          <div className="mt-1.5 flex justify-between gap-4">
            <span className="text-slate-400">Shelter Capacity:</span>
            <span className="font-semibold text-white">{hoveredMusterPoint.capacity.toLocaleString()} Pax</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Current Occupants:</span>
            <span className="font-semibold text-white">
              {hoveredMusterPoint.occupied.toLocaleString()} ({Math.round((hoveredMusterPoint.occupied / hoveredMusterPoint.capacity) * 100)}%)
            </span>
          </div>
          <div className="text-[10px] border-t border-slate-800 mt-1.5 pt-1 text-slate-500 leading-normal">
            Safe, high-ground refuge facility. Automatically mapped as Dijkstra target destination.
          </div>
        </div>
      )}
    </div>
  );
};
