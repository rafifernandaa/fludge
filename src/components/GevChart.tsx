import React from "react";
import { RiverSensor, NeighborhoodRT } from "../types";

interface GevChartProps {
  sensor?: RiverSensor;
  rt?: NeighborhoodRT;
  customData?: {
    name: string;
    mu: number;
    sigma: number;
    xi: number;
    water_level_cm: number;
    exceedance_prob: number;
    subtitle?: string;
  };
  action?: React.ReactNode;
  height?: number;
}

export const GevChart: React.FC<GevChartProps> = ({
  sensor,
  rt,
  customData,
  action,
  height = 180,
}) => {
  // Resolve chart data from sensor, rt, or customData
  let name = "GEV Analysis";
  let subtitle = "Generalized Extreme Value Distribution (Fréchet)";
  let mu = 180;
  let sigma = 40;
  let xi = 0.18;
  let water_level_cm = 210;
  let exceedance_prob = 0.45;

  if (sensor) {
    name = sensor.name;
    mu = sensor.mu;
    sigma = sensor.sigma;
    xi = sensor.xi;
    water_level_cm = sensor.water_level_cm;
    exceedance_prob = sensor.exceedance_prob;
    subtitle = `River Sensor Telemetry • Exceedance P: ${(exceedance_prob * 100).toFixed(1)}%`;
  } else if (rt) {
    name = `RT Unit ${rt.rt_id} (${rt.kelurahan})`;
    subtitle = `Neighborhood Hydro Model • Elevation: ${rt.demnas_elevation_m.toFixed(1)}m • Rain: ${rt.interpolated_rainfall_mm_hr.toFixed(1)} mm/h`;
    mu = 160 + Math.max(0, (5 - rt.demnas_elevation_m)) * 12;
    sigma = 38 + rt.interpolated_rainfall_mm_hr * 0.15;
    xi = 0.185;
    water_level_cm = Math.min(480, 140 + rt.interpolated_rainfall_mm_hr * 2.5 + Math.max(0, (5 - rt.demnas_elevation_m)) * 18);
    exceedance_prob = rt.evt_exceedance_prob;
  } else if (customData) {
    name = customData.name;
    mu = customData.mu;
    sigma = customData.sigma;
    xi = customData.xi;
    water_level_cm = customData.water_level_cm;
    exceedance_prob = customData.exceedance_prob;
    subtitle = customData.subtitle || subtitle;
  }

  // Calculate GEV PDF value g(x) at point x
  const calculateGevPdf = (x: number): number => {
    const z = (x - mu) / sigma;

    if (Math.abs(xi) < 1e-5) {
      // Gumbel distribution limit (xi -> 0)
      return (1.0 / sigma) * Math.exp(-z - Math.exp(-z));
    }

    const term = 1.0 + xi * z;
    if (term <= 0) {
      return 0; // support boundary limits
    }

    const t = Math.pow(term, -1.0 / xi);
    return (1.0 / sigma) * Math.pow(term, -(xi + 1) / xi) * Math.exp(-t);
  };

  // Generate 100 sample points along the x-axis for plotting the GEV curve
  const xMin = mu - 2.5 * sigma;
  const xMax = mu + 6.5 * sigma;
  const step = (xMax - xMin) / 100;

  const points: { x: number; y: number }[] = [];
  let maxPdf = 1e-10;

  for (let i = 0; i <= 100; i++) {
    const xVal = xMin + i * step;
    const pdfVal = calculateGevPdf(xVal);
    if (pdfVal > maxPdf) {
      maxPdf = pdfVal;
    }
    points.push({ x: xVal, y: pdfVal });
  }

  // Map coordinate points to SVG viewBox
  const width = 450;
  const svgHeight = height;
  const padding = 35;

  const mapX = (xVal: number) => {
    return padding + ((xVal - xMin) / (xMax - xMin)) * (width - 2 * padding);
  };

  const mapY = (pdfVal: number) => {
    return svgHeight - padding - (pdfVal / maxPdf) * (svgHeight - 2 * padding);
  };

  // Build the SVG path string
  let pathD = "";
  points.forEach((pt, idx) => {
    const sx = mapX(pt.x);
    const sy = mapY(pt.y);
    if (idx === 0) pathD += `M ${sx} ${sy}`;
    else pathD += ` L ${sx} ${sy}`;
  });

  // Position of current live water level marker on the curve
  const currentX = mapX(water_level_cm);
  const currentYVal = calculateGevPdf(water_level_cm);
  const currentY = mapY(currentYVal);

  // Return thresholds: 50-year return level (roughly P = 0.98 quantile)
  const returnLevel50 =
    mu + (sigma * (Math.pow(-Math.log(0.98), -xi) - 1.0)) / xi;
  const xReturn50 = mapX(returnLevel50);

  return (
    <div className="bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-700 p-4 rounded-2xl flex flex-col font-mono text-xs shadow-md">
      <div className="flex justify-between items-start border-b border-stone-200 dark:border-stone-700 pb-2 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-display font-bold text-stone-900 dark:text-stone-50 tracking-wide text-xs truncate">
            {name}
          </h4>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
            {subtitle}
          </p>
        </div>
        <div className="text-right flex flex-col gap-1 items-end shrink-0 pl-2">
          {action ? (
            action
          ) : (
            <span className="text-[10px] bg-stone-100 dark:bg-stone-800 text-fuchsia-700 dark:text-cyan-400 px-2 py-0.5 rounded-full uppercase border border-stone-200 dark:border-stone-700 font-bold">
              Fitted GEV Curve
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-[160px] bg-stone-50 dark:bg-stone-900/60 rounded-xl p-2 border border-stone-200 dark:border-stone-700/40">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle horizontal grid lines */}
          <line
            x1={padding}
            y1={mapY(0)}
            x2={width - padding}
            y2={mapY(0)}
            className="stroke-stone-300 dark:stroke-stone-700"
            strokeWidth="1.5"
          />
          <line
            x1={padding}
            y1={mapY(maxPdf * 0.5)}
            x2={width - padding}
            y2={mapY(maxPdf * 0.5)}
            className="stroke-stone-300 dark:stroke-stone-700"
            strokeDasharray="3 3"
          />
          <line
            x1={padding}
            y1={mapY(maxPdf)}
            x2={width - padding}
            y2={mapY(maxPdf)}
            className="stroke-stone-300 dark:stroke-stone-700"
            strokeDasharray="3 3"
          />

          {/* Return period vertical limit (50-Yr Extreme threshold) */}
          {xReturn50 > padding && xReturn50 < width - padding && (
            <g>
              <line
                x1={xReturn50}
                y1={padding - 5}
                x2={xReturn50}
                y2={svgHeight - padding}
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={xReturn50 - 5}
                y={padding + 10}
                fill="#ef4444"
                fontSize="8"
                textAnchor="end"
                className="font-semibold"
              >
                50-Yr Return Lvl
              </text>
            </g>
          )}

          {/* GEV PDF Curve Area fill */}
          <path
            d={`${pathD} L ${mapX(xMax)} ${mapY(0)} L ${mapX(xMin)} ${mapY(0)} Z`}
            fill="url(#gevGrad)"
            opacity="0.18"
          />

          {/* The plotted GEV Probability Density curve line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#curveGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* X Axis ticks */}
          <text
            x={mapX(mu)}
            y={svgHeight - padding + 14}
            className="fill-stone-500 dark:fill-stone-400"
            fontSize="8"
            textAnchor="middle"
          >
            &mu; ({mu.toFixed(0)}cm)
          </text>
          <text
            x={mapX(mu + 2 * sigma)}
            y={svgHeight - padding + 14}
            className="fill-stone-500 dark:fill-stone-400"
            fontSize="8"
            textAnchor="middle"
          >
            +2&sigma;
          </text>
          <text
            x={mapX(mu + 4 * sigma)}
            y={svgHeight - padding + 14}
            className="fill-stone-500 dark:fill-stone-400"
            fontSize="8"
            textAnchor="middle"
          >
            +4&sigma;
          </text>

          {/* Exceedance probability region highlighting (current to infinity) */}
          {water_level_cm < xMax && (
            <path
              d={`M ${currentX} ${currentY} 
                 ${points
                   .filter((pt) => pt.x >= water_level_cm)
                   .map((pt) => `L ${mapX(pt.x)} ${mapY(pt.y)}`)
                   .join(" ")} 
                 L ${mapX(xMax)} ${mapY(0)} L ${currentX} ${mapY(0)} Z`}
              fill="#ef4444"
              opacity="0.2"
            />
          )}

          {/* Current Live Level Marker Line */}
          {currentX > padding && currentX < width - padding && (
            <g>
              <line
                x1={currentX}
                y1={currentY}
                x2={currentX}
                y2={svgHeight - padding}
                stroke="#22d3ee"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={currentX}
                cy={currentY}
                r="5"
                className="animate-pulse"
                fill="#22d3ee"
                stroke="#ffffff"
                strokeWidth="1"
              />
              <text
                x={currentX + 8}
                y={currentY - 4}
                fill="#22d3ee"
                fontSize="8"
                className="font-bold"
              >
                LIVE ({water_level_cm.toFixed(0)}cm)
              </text>
            </g>
          )}

          {/* Definitions */}
          <defs>
            <linearGradient id="gevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>
            <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Parameter HUD Panel */}
      <div className="grid grid-cols-4 gap-2 text-[10px] mt-2 bg-stone-50 dark:bg-stone-900/60 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700/60">
        <div>
          <span className="text-stone-500 dark:text-stone-400 block font-semibold">
            LOCATION (&mu;)
          </span>
          <span className="font-bold text-stone-800 dark:text-stone-100 font-mono">
            {mu.toFixed(1)} cm
          </span>
        </div>
        <div>
          <span className="text-stone-500 dark:text-stone-400 block font-semibold">
            SCALE (&sigma;)
          </span>
          <span className="font-bold text-stone-800 dark:text-stone-100 font-mono">
            {sigma.toFixed(1)}
          </span>
        </div>
        <div>
          <span className="text-stone-500 dark:text-stone-400 block font-semibold">
            SHAPE (&xi;)
          </span>
          <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
            +{xi.toFixed(3)}{" "}
            <span className="text-[8px] text-stone-400 dark:text-stone-500">
              (Fréchet)
            </span>
          </span>
        </div>
        <div>
          <span className="text-stone-500 dark:text-stone-400 block font-semibold">
            EXCEEDANCE P
          </span>
          <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
            {(exceedance_prob * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* GEV CDF Formula Banner */}
      <div className="text-[9px] text-stone-500 dark:text-stone-400 text-center mt-2.5 border-t border-stone-200 dark:border-stone-700/40 pt-1.5 font-mono">
        GEV Density: f(x) = (1/&sigma;) t(x)^(&xi;+1) e^(-t(x)) where t(x) = [1 + &xi;((x - &mu;)/&sigma;)]^(-1/&xi;)
      </div>
    </div>
  );
};

