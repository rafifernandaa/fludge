import React from "react";
import {
  MapPin,
  Building2,
  AlertTriangle,
  Radio,
  Truck,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  X,
  Compass,
  Activity,
  ShieldAlert,
  Camera,
} from "lucide-react";
import { NeighborhoodRT, RiverSensor } from "../types";
import { GevChart } from "./GevChart";

interface PlaceExplanationCardProps {
  rt?: NeighborhoodRT | null;
  sensor?: RiverSensor | null;
  onNavigateToMap?: (rt: NeighborhoodRT) => void;
  onNavigateToDispatch?: (rt: NeighborhoodRT) => void;
  onToggleSiren?: (rtId: string) => void;
  onOpenGroundTruth?: () => void;
  onClose?: () => void;
  isCompact?: boolean;
}

export const PlaceExplanationCard: React.FC<PlaceExplanationCardProps> = ({
  rt,
  sensor,
  onNavigateToMap,
  onNavigateToDispatch,
  onToggleSiren,
  onOpenGroundTruth,
  onClose,
  isCompact = false,
}) => {
  if (!rt && !sensor) {
    return (
      <div className="p-6 text-center text-stone-400 dark:text-slate-500 font-mono text-xs">
        Select a place or RT neighborhood to inspect its GEV probability distribution curve and hydrological explanation.
      </div>
    );
  }

  // Derive risk metadata
  const placeName = rt
    ? `RT ${rt.rt_id}`
    : sensor?.name || "River Telemetry Station";
  const kelurahanName = rt ? rt.kelurahan : "DKI River Basin";
  const elevation = rt ? rt.demnas_elevation_m : 2.4;
  const rainfall = rt ? rt.interpolated_rainfall_mm_hr : 45.0;
  const exceedanceP = rt ? rt.evt_exceedance_prob : sensor?.exceedance_prob || 0.5;
  const scorePct = rt
    ? (rt.risk_priority_score * 100).toFixed(1)
    : ((sensor?.exceedance_prob || 0.5) * 100).toFixed(1);

  let riskCategory = "MODERATE";
  let riskBadgeColor =
    "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
  let riskTextColor = "text-emerald-600 dark:text-emerald-400";

  const numScore = parseFloat(scorePct);
  if (numScore >= 75) {
    riskCategory = "CRITICAL RISK";
    riskBadgeColor =
      "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800";
    riskTextColor = "text-rose-600 dark:text-rose-400 font-bold";
  } else if (numScore >= 50) {
    riskCategory = "HIGH RISK";
    riskBadgeColor =
      "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    riskTextColor = "text-amber-600 dark:text-amber-400 font-bold";
  }

  // Generate plain-language AI Hydrological Explanation
  const getAiExplanation = () => {
    if (numScore >= 75) {
      return `Critical flood threat detected for ${placeName} (${kelurahanName}). Ground elevation sits at a vulnerable ${elevation.toFixed(
        1
      )}m DEMNAS baseline. Coupled with localized rainfall intensity of ${rainfall.toFixed(
        1
      )} mm/h and a high GEV extreme probability of ${(
        exceedanceP * 100
      ).toFixed(
        1
      )}%, river runoff is projected to overflow embankments within 15-30 minutes. Mobile pump trucks and immediate evacuation teams are prioritized.`;
    } else if (numScore >= 50) {
      return `Elevated flood warning for ${placeName} in ${kelurahanName}. Standing elevation of ${elevation.toFixed(
        1
      )}m and interpolated rainfall rate of ${rainfall.toFixed(
        1
      )} mm/h create localized surface ponding risks. GEV exceedance probability is ${(
        exceedanceP * 100
      ).toFixed(
        1
      )}%. Emergency sirens should be kept on standby while monitoring river gate telemetry.`;
    } else {
      return `${placeName} (${kelurahanName}) maintains a manageable risk profile. DEMNAS elevation at ${elevation.toFixed(
        1
      )}m provides adequate natural runoff slope against ${rainfall.toFixed(
        1
      )} mm/h rainfall. Extreme value tail probability remains low at ${(
        exceedanceP * 100
      ).toFixed(1)}%.`;
    }
  };

  return (
    <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 rounded-3xl p-4 md:p-5 shadow-lg flex flex-col gap-4 font-mono text-xs">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-fuchsia-100 dark:bg-cyan-950/60 text-fuchsia-800 dark:text-cyan-400 border border-fuchsia-200 dark:border-cyan-800/50 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base md:text-lg text-stone-900 dark:text-white truncate">
                {placeName}
              </h3>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${riskBadgeColor}`}
              >
                {riskCategory} ({scorePct}%)
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5" /> Kelurahan {kelurahanName}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Embedded GEV Probability Distribution Curve */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-stone-600 dark:text-slate-300 font-bold uppercase text-[10px]">
          <span className="flex items-center gap-1.5 text-fuchsia-800 dark:text-cyan-400">
            <Activity className="w-3.5 h-3.5" /> GEV Extreme Value Distribution Curve
          </span>
          <span>P(X ≥ x) = {(exceedanceP * 100).toFixed(1)}%</span>
        </div>
        {rt ? (
          <GevChart rt={rt} height={160} />
        ) : (
          sensor && <GevChart sensor={sensor} height={160} />
        )}
      </div>

      {/* Hydrological Risk Breakdown Grid */}
      <div className="grid grid-cols-3 gap-2.5 text-[11px] bg-stone-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-stone-200 dark:border-slate-800">
        <div>
          <span className="text-stone-500 dark:text-slate-400 text-[10px] block uppercase font-semibold">
            DEMNAS Elevation
          </span>
          <span
            className={`font-bold ${
              elevation < 2.0
                ? "text-rose-600 dark:text-rose-400"
                : "text-stone-900 dark:text-white"
            }`}
          >
            {elevation.toFixed(1)} meters
          </span>
        </div>
        <div>
          <span className="text-stone-500 dark:text-slate-400 text-[10px] block uppercase font-semibold">
            BMKG Rainfall
          </span>
          <span className="font-bold text-fuchsia-700 dark:text-cyan-400">
            {rainfall.toFixed(1)} mm/hr
          </span>
        </div>
        <div>
          <span className="text-stone-500 dark:text-slate-400 text-[10px] block uppercase font-semibold">
            Exceedance Tail P
          </span>
          <span className={`font-bold ${riskTextColor}`}>
            {(exceedanceP * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Detailed Hydrological Explanation Box */}
      <div className="p-3.5 rounded-2xl bg-fuchsia-50/50 dark:bg-cyan-950/20 border border-fuchsia-200/60 dark:border-cyan-800/40 space-y-2">
        <div className="flex items-center gap-2 text-fuchsia-900 dark:text-cyan-300 font-bold text-xs">
          <Sparkles className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400 shrink-0" />
          <span>AI Hydrological & Topographic Analysis</span>
        </div>
        <p className="text-xs text-stone-700 dark:text-slate-300 leading-relaxed font-sans">
          {getAiExplanation()}
        </p>

        <div className="pt-2 border-t border-fuchsia-200/50 dark:border-cyan-800/30 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-stone-600 dark:text-slate-400">
          <div>
            <strong>Risk Weights:</strong> Exceedance P (40%) + Rainfall (35%) + Ground Inv (25%)
          </div>
          <div>
            <strong>Nearest Gate:</strong> {rt?.associated_sensor_id || sensor?.name || "PA Manggarai"}
          </div>
        </div>
      </div>

      {/* Quick Tactical Action Buttons */}
      {rt && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {onNavigateToMap && (
            <button
              onClick={() => onNavigateToMap(rt)}
              className="px-3 py-2 rounded-xl bg-stone-900 text-white dark:bg-cyan-500 dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-stone-800 dark:hover:bg-cyan-400 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" /> View on Map
            </button>
          )}

          {onNavigateToDispatch && (
            <button
              onClick={() => onNavigateToDispatch(rt)}
              className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-200 transition-all cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" /> Dispatch Roster
            </button>
          )}

          {onToggleSiren && (
            <button
              onClick={() => onToggleSiren(rt.rt_id)}
              className={`px-3 py-2 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                rt.siren_activated
                  ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                  : "bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:text-rose-600 border-stone-200 dark:border-slate-700"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {rt.siren_activated ? "Siren Active" : "Trigger Siren"}
            </button>
          )}

          {onOpenGroundTruth && (
            <button
              onClick={onOpenGroundTruth}
              className="px-3 py-2 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950/80 text-fuchsia-900 dark:text-fuchsia-300 border border-fuchsia-300 dark:border-fuchsia-800 font-bold text-xs flex items-center gap-1.5 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-fuchsia-600 dark:text-cyan-400" />
              <span>CCTV & Citizen Feeds</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
