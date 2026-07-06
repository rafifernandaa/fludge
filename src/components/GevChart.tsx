import React from 'react';
import { RiverSensor } from '../types';

interface GevChartProps {
  sensor: RiverSensor;
}

export const GevChart: React.FC<GevChartProps> = ({ sensor }) => {
  const { name, mu, sigma, xi, water_level_cm, exceedance_prob } = sensor;

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
  // We sample from mu - 2.5 * sigma up to mu + 6 * sigma to catch the long Frechet tail
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

  // Map coordinate points to SVG viewBox [0, 400] x [0, 200]
  const width = 450;
  const height = 180;
  const padding = 35;
  
  const mapX = (xVal: number) => {
    return padding + ((xVal - xMin) / (xMax - xMin)) * (width - 2 * padding);
  };
  
  const mapY = (pdfVal: number) => {
    // Invert Y to put 0 at bottom
    return height - padding - (pdfVal / maxPdf) * (height - 2 * padding);
  };

  // Build the SVG path string
  let pathD = '';
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

  // Return thresholds
  // 50-year return level (roughly P = 0.98 quantile)
  const returnLevel50 = mu + sigma * (Math.pow(-Math.log(0.98), -xi) - 1.0) / xi;
  const xReturn50 = mapX(returnLevel50);

  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col font-mono text-xs shadow-md">
      <div className="flex justify-between items-start border-b border-slate-800 pb-2 mb-3">
        <div>
          <h4 className="font-display font-medium text-white tracking-wide text-xs">{name}</h4>
          <p className="text-[10px] text-slate-500 mt-0.5">GEV Extreme Value Probability Density Function (PDF)</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-slate-800 text-brand-cyan px-2 py-0.5 rounded-full uppercase border border-slate-700">
            Fitted GEV Baseline
          </span>
        </div>
      </div>

      <div className="relative flex-1 min-h-[180px] bg-slate-950/40 rounded-lg p-2 border border-slate-800/40">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Subtle horizontal grid lines */}
          <line x1={padding} y1={mapY(0)} x2={width - padding} y2={mapY(0)} stroke="#1e293b" strokeWidth="1.5" />
          <line x1={padding} y1={mapY(maxPdf * 0.5)} x2={width - padding} y2={mapY(maxPdf * 0.5)} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={padding} y1={mapY(maxPdf)} x2={width - padding} y2={mapY(maxPdf)} stroke="#1e293b" strokeDasharray="3 3" />

          {/* Return period vertical limit (50-Yr Extreme threshold) */}
          {xReturn50 > padding && xReturn50 < width - padding && (
            <g>
              <line 
                x1={xReturn50} 
                y1={padding - 5} 
                x2={xReturn50} 
                y2={height - padding} 
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
            opacity="0.15"
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
          <text x={mapX(mu)} y={height - padding + 14} fill="#64748b" fontSize="8" textAnchor="middle">
            &mu; ({mu.toFixed(0)}cm)
          </text>
          <text x={mapX(mu + 2 * sigma)} y={height - padding + 14} fill="#64748b" fontSize="8" textAnchor="middle">
            +2&sigma;
          </text>
          <text x={mapX(mu + 4 * sigma)} y={height - padding + 14} fill="#64748b" fontSize="8" textAnchor="middle">
            +4&sigma;
          </text>

          {/* Exceedance probability region highlighting (current to infinity) */}
          {water_level_cm < xMax && (
            <path
              d={`M ${currentX} ${currentY} 
                 ${points.filter(pt => pt.x >= water_level_cm).map(pt => `L ${mapX(pt.x)} ${mapY(pt.y)}`).join(' ')} 
                 L ${mapX(xMax)} ${mapY(0)} L ${currentX} ${mapY(0)} Z`}
              fill="#ef4444"
              opacity="0.12"
            />
          )}

          {/* Current Live Level Marker Line */}
          {currentX > padding && currentX < width - padding && (
            <g>
              <line
                x1={currentX}
                y1={currentY}
                x2={currentX}
                y2={height - padding}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={currentX}
                cy={currentY}
                r="5"
                className="animate-pulse"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="1"
              />
              <text 
                x={currentX + 8} 
                y={currentY - 4} 
                fill="#38bdf8" 
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
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Parameter HUD Panel */}
      <div className="grid grid-cols-4 gap-2 text-[10px] mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
        <div>
          <span className="text-slate-500 block">LOCATION (&mu;)</span>
          <span className="font-semibold text-slate-300 font-mono">{mu.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-slate-500 block">SCALE (&sigma;)</span>
          <span className="font-semibold text-slate-300 font-mono">{sigma.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-slate-500 block">SHAPE (&xi;)</span>
          <span className="font-semibold text-brand-orange font-mono">+{xi.toFixed(4)} <span className="text-[8px] text-slate-500">(Fréchet)</span></span>
        </div>
        <div>
          <span className="text-slate-500 block">EXCEEDANCE P</span>
          <span className="font-bold text-brand-red font-mono">{(exceedance_prob * 100).toFixed(2)}%</span>
        </div>
      </div>
      
      {/* GEV CDF Formula Banner */}
      <div className="text-[9px] text-slate-500 text-center mt-2.5 border-t border-slate-800/40 pt-1.5 font-mono">
        CDF: G(x) = exp( - [1 + &xi;((x - &mu;)/&sigma;)]^(-1/&xi;) ) &bull; P_exceed = 1 - G(x_live)
      </div>
    </div>
  );
};
