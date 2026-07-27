import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { NeighborhoodRT } from "../types";

interface RiskHeatMapProps {
  rts: NeighborhoodRT[];
}

export const RiskHeatMap: React.FC<RiskHeatMapProps> = ({ rts }) => {
  const data = useMemo(() => {
    return rts
      .map((rt) => ({
        name: rt.rt_id,
        kelurahan: rt.kelurahan,
        population: Number(rt.population_density) || 0,
        risk: Number(rt.risk_priority_score) || 0,
        exceedance: Number(rt.evt_exceedance_prob) || 0,
      }))
      .sort((a, b) => b.risk - a.risk) // Sort highest risk first
      .slice(0, 100); // Only show top 100 critical RTs otherwise Recharts bars have 0 width
  }, [rts]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 p-3 rounded-lg border border-stone-200 shadow-xl text-xs font-mono">
          <p className="font-bold text-stone-900 border-b border-stone-200 pb-1 mb-2 uppercase">
            {data.name} - {data.kelurahan}
          </p>
          <p className="text-stone-600 mb-1">
            Pop. Density:{" "}
            <span className="font-semibold text-stone-900">
              {data.population.toFixed(0)}
            </span>
          </p>
          <p className="text-stone-600 mb-1">
            Risk Score:{" "}
            <span className="font-semibold text-brand-cyan">
              {(data.risk * 100).toFixed(1)}
            </span>
          </p>
          <p className="text-stone-600">
            Exceedance P:{" "}
            <span className="font-semibold text-brand-orange">
              {(data.exceedance * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const getColor = (risk: number) => {
    if (risk > 0.75) return "#ef4444"; // red-500
    if (risk > 0.5) return "#f97316"; // orange-500
    if (risk > 0.25) return "#eab308"; // yellow-500
    return "#10b981"; // emerald-500
  };

  return (
    <div className="bg-white/80 border border-stone-200 rounded-xl p-4 shadow-sm w-full h-full flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-4 border-b border-stone-200 pb-3">
        <div>
          <h4 className="font-display font-medium text-stone-900 text-xs tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
            REGIONAL VULNERABILITY DISTRIBUTION
          </h4>
          <p className="text-[10px] text-stone-500 mt-1 font-mono">
            Top 100 Neighborhoods vs Composite Risk Score
          </p>
        </div>
        <div className="flex gap-3 text-[9px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> LOW
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>{" "}
            MODERATE
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span> HIGH
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> CRITICAL
          </span>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-[250px]">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 20, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e5e5"
              vertical={false}
            />
            <XAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 9, fill: "#78716c" }}
              tickLine={false}
              axisLine={{ stroke: "#d6d3d1" }}
              interval="preserveStartEnd"
            />
            <YAxis
              type="number"
              dataKey="risk"
              name="Risk Score"
              tick={{ fontSize: 10, fill: "#78716c" }}
              tickLine={{ stroke: "#d6d3d1" }}
              axisLine={{ stroke: "#d6d3d1" }}
              domain={[0, 1.0]}
              label={{
                value: "Risk Score",
                angle: -90,
                position: "insideLeft",
                fontSize: 10,
                fill: "#78716c",
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f4" }} />
            <Bar dataKey="risk" animationDuration={500} radius={[2, 2, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.risk)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
