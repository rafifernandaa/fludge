import React, { useEffect, useRef, useState } from "react";
import { Waves, RefreshCw } from "lucide-react";

interface Interactive3DTerrainProps {
  waterLevel?: number; // 0 to 100
  onWaterLevelChange?: (val: number) => void;
}

export function Interactive3DTerrain({
  waterLevel: externalWaterLevel,
  onWaterLevelChange,
}: Interactive3DTerrainProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [internalWaterLevel, setInternalWaterLevel] = useState(45);
  const waterLevel = externalWaterLevel ?? internalWaterLevel;
  const [alertStatus, setAlertStatus] = useState<"NORMAL" | "SIAGA 3" | "SIAGA 2" | "SIAGA 1">("SIAGA 2");
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  const updateWaterLevel = (val: number) => {
    if (onWaterLevelChange) {
      onWaterLevelChange(val);
    } else {
      setInternalWaterLevel(val);
    }
  };

  useEffect(() => {
    if (waterLevel < 25) setAlertStatus("NORMAL");
    else if (waterLevel < 50) setAlertStatus("SIAGA 3");
    else if (waterLevel < 75) setAlertStatus("SIAGA 2");
    else setAlertStatus("SIAGA 1");
  }, [waterLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseRef.current.targetX = x * 0.4;
      mouseRef.current.targetY = y * 0.4;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Grid Dimensions
    const cols = 28;
    const rows = 20;

    // Heightmap generator (simulating Jakarta Ciliwung River basin terrain)
    const getTerrainHeight = (c: number, r: number) => {
      const nx = c / cols - 0.5;
      const ny = r / rows - 0.5;
      const riverBed = Math.exp(-Math.pow(nx * 3 - Math.sin(ny * 4) * 0.5, 2) * 6);
      const hills = Math.sin(nx * 5) * Math.cos(ny * 4) * 25 + Math.cos(nx * 8 + ny * 6) * 15;
      return hills - riverBed * 65;
    };

    const render = () => {
      time += 0.03;
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 500);

      ctx.clearRect(0, 0, width, height);

      // Porcelain canvas background based on Image 1 & Image 2 palette
      ctx.fillStyle = "#faf9f6";
      ctx.fillRect(0, 0, width, height);

      // Fine grid background pattern (Image 2 aesthetic)
      ctx.strokeStyle = "rgba(226, 232, 240, 0.6)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const centerX = width / 2;
      const centerY = height / 2 + 40;
      const tileWidth = (width * 0.7) / cols;
      const tileHeight = (height * 0.55) / rows;

      const pitch = 0.55 + mouseRef.current.y;
      const yaw = mouseRef.current.x;

      // Project 3D point to 2D screen
      const project = (c: number, r: number, z: number) => {
        const isoX = (c - cols / 2) * tileWidth;
        const isoY = (r - rows / 2) * tileHeight;

        // Apply Yaw
        const rx = isoX * Math.cos(yaw) - isoY * Math.sin(yaw);
        const ry = isoX * Math.sin(yaw) + isoY * Math.cos(yaw);

        // Apply Pitch tilt
        const px = rx;
        const py = ry * Math.sin(pitch) - z * Math.cos(pitch) * 1.4;

        return { x: centerX + px, y: centerY + py, z };
      };

      const waterZ = (waterLevel / 100) * 45 - 25;

      // Render 3D Terrain Wireframe Mesh & Filled Polygons
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const z1 = getTerrainHeight(c, r);
          const z2 = getTerrainHeight(c + 1, r);
          const z3 = getTerrainHeight(c + 1, r + 1);
          const z4 = getTerrainHeight(c, r + 1);

          const p1 = project(c, r, z1);
          const p2 = project(c + 1, r, z2);
          const p3 = project(c + 1, r + 1, z3);
          const p4 = project(c, r + 1, z4);

          const avgZ = (z1 + z2 + z3 + z4) / 4;
          const isFlooded = avgZ < waterZ;

          // Draw Terrain Cell
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();

          if (isFlooded) {
            // Terracotta to Wine-Magenta gradient flow from Image 1
            const gradientRatio = (c / cols + r / rows) / 2;
            if (gradientRatio < 0.35) {
              ctx.fillStyle = `rgba(217, 119, 6, ${0.25 + (waterZ - avgZ) / 80})`; // Terracotta/Amber
              ctx.strokeStyle = "rgba(180, 83, 9, 0.6)";
            } else if (gradientRatio < 0.7) {
              ctx.fillStyle = `rgba(192, 38, 211, ${0.25 + (waterZ - avgZ) / 80})`; // Rose Magenta
              ctx.strokeStyle = "rgba(147, 51, 234, 0.6)";
            } else {
              ctx.fillStyle = `rgba(37, 99, 235, ${0.25 + (waterZ - avgZ) / 80})`; // Royal Indigo Blue
              ctx.strokeStyle = "rgba(29, 78, 216, 0.6)";
            }
            ctx.lineWidth = 1;
          } else {
            // Image 2 Minimalist charcoal grid lines on clean off-white
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx.lineWidth = 0.7;
          }
          ctx.fill();
          ctx.stroke();
        }
      }

      // Draw Animated Gradient Water Flow Surface Line
      ctx.beginPath();
      for (let r = 0; r < rows; r += 2) {
        for (let c = 0; c < cols; c += 2) {
          const waveZ = waterZ + Math.sin(time + c * 0.4 + r * 0.3) * 3;
          const p = project(c, r, waveZ);
          if (c === 0 && r === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
      }
      ctx.strokeStyle = "rgba(192, 38, 211, 0.7)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Render Telemetry Sensor Radar Pulses
      const sensorCoords = [
        { c: 8, r: 6, label: "Pintu Air Manggarai" },
        { c: 14, r: 10, label: "Katulampa Sensor A" },
        { c: 20, r: 14, label: "Pos Cipinang" },
      ];

      sensorCoords.forEach((sensor, idx) => {
        const z = getTerrainHeight(sensor.c, sensor.r);
        const p = project(sensor.c, sensor.r, Math.max(z, waterZ));

        // Radar expansion ring
        const pulse = (time * 2 + idx * 1.5) % 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulse * 18, 0, Math.PI * 2);
        ctx.strokeStyle = waterLevel > 60 ? `rgba(225, 29, 72, ${1 - pulse / 3})` : `rgba(37, 99, 235, ${1 - pulse / 3})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Node dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = waterLevel > 60 ? "#e11d48" : "#2563eb";
        ctx.fill();

        // Label pin
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText(sensor.label, p.x + 8, p.y - 6);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [waterLevel]);

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-stone-200 bg-[#faf9f6] shadow-xl shadow-stone-200/50 backdrop-blur-xl group">
      {/* Top Header Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-white/90 p-3 rounded-2xl border border-stone-200/80 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/10 via-fuchsia-500/10 to-indigo-500/10 text-fuchsia-600 border border-fuchsia-200">
            <Waves className="w-5 h-5 animate-pulse text-fuchsia-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              3D Cartographic Elevation Mesh
            </div>
            <div className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <span>Jakarta Ciliwung Basin</span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
                  alertStatus === "SIAGA 1"
                    ? "bg-rose-100 text-rose-700 border border-rose-300"
                    : alertStatus === "SIAGA 2"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : alertStatus === "SIAGA 3"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}
              >
                {alertStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Live Interactive Water Level Slider */}
        <div className="flex items-center gap-3 bg-stone-50/90 px-4 py-2 rounded-xl border border-stone-200">
          <span className="text-xs font-mono font-bold text-stone-700 shrink-0">
            Water Level: {waterLevel}%
          </span>
          <input
            type="range"
            min="10"
            max="90"
            value={waterLevel}
            onChange={(e) => updateWaterLevel(Number(e.target.value))}
            className="w-32 accent-fuchsia-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
          />
          <button
            onClick={() => updateWaterLevel(45)}
            title="Reset Simulation"
            className="p-1 rounded text-stone-400 hover:text-stone-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas element */}
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Bottom Floating Stats */}
      <div className="absolute bottom-4 left-4 right-4 z-20 grid grid-cols-3 gap-3 pointer-events-none">
        <div className="bg-white/90 p-2.5 rounded-xl border border-stone-200/80 shadow-sm backdrop-blur-md">
          <div className="text-[10px] text-stone-500 uppercase font-mono">Elevation Threshold</div>
          <div className="text-xs font-mono font-bold text-amber-700">
            +{(waterLevel * 0.08).toFixed(2)}m AMSL
          </div>
        </div>
        <div className="bg-white/90 p-2.5 rounded-xl border border-stone-200/80 shadow-sm backdrop-blur-md">
          <div className="text-[10px] text-stone-500 uppercase font-mono">Inundation Coverage</div>
          <div className="text-xs font-mono font-bold text-fuchsia-700">
            {(waterLevel * 14.2).toFixed(0)} Sub-sectors (RT)
          </div>
        </div>
        <div className="bg-white/90 p-2.5 rounded-xl border border-stone-200/80 shadow-sm backdrop-blur-md">
          <div className="text-[10px] text-stone-500 uppercase font-mono">GPU Raster Speed</div>
          <div className="text-xs font-mono font-bold text-indigo-700">
            0.38ms / 30k Nodes
          </div>
        </div>
      </div>
    </div>
  );
}
