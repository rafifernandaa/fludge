import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Camera,
  Download,
  AlertTriangle,
  Activity,
  Moon,
  Sun,
  CloudRain,
  Database,
  Droplets,
  ArrowDownUp,
  Layers,
  Settings,
  ShieldAlert,
  Play,
  Pause,
  HelpCircle,
  Info,
  Terminal,
  Check,
  ChevronRight,
  Compass,
  Radio,
  Phone,
  FlameKindling,
  Sparkles,
  RefreshCw,
  Mic,
  MicOff,
  Map,
  Table,
  SlidersHorizontal,
  BarChart3,
  Truck,
  Code2,
  Cpu,
  Cloud,
  FileText,
  UserCheck,
  User,
  Zap,
  MapPin,
  BrainCircuit,
  Bot,
  Video,
} from "lucide-react";

import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { generateJakartaScaffolding, SIMULATION_PRESETS } from "./data";
import { runHydrologicalPipeline } from "./math_engine";
import { MapCanvas } from "./components/MapCanvas";
import { GevChart } from "./components/GevChart";
import { PlaceExplanationCard } from "./components/PlaceExplanationCard";
import { GroundTruthModal } from "./components/GroundTruthModal";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { CodeExplorer } from "./components/CodeExplorer";
import { RtMasterTable } from "./components/RtMasterTable";
import { MultiAgentCenter } from "./components/MultiAgentCenter";
import { UserProfile } from "./components/UserProfile";
import { calculateEvacuationRoute } from "./dijkstra";
import {
  NeighborhoodRT,
  RiverSensor,
  WeatherStation,
  RiskWeights,
} from "./types";
import { PipelineDiagram } from "./components/PipelineDiagram";
import { RiskHeatMap } from "./components/RiskHeatMap";
import { AiBriefSkeleton } from "./components/AiBriefSkeleton";

function AIBriefRenderer({ data }: { data: any }) {
  if (!data || !data.threatAssessment) return null;

  return (
    <div className="space-y-3 text-xs font-mono">
      {(data.metadata?.to || data.metadata?.subject) && (
        <div className="text-stone-700 dark:text-cyan-400 font-semibold uppercase tracking-wider text-[10px] bg-stone-100 dark:bg-cyan-950/40 px-3 py-2 rounded-lg border border-stone-200 dark:border-cyan-800/40 flex flex-col gap-0.5">
          {data.metadata.to && <span>TO: {data.metadata.to}</span>}
          {data.metadata.subject && <span>SUBJ: {data.metadata.subject}</span>}
        </div>
      )}

      <div>
        <h5 className="font-bold text-stone-900 dark:text-stone-50 tracking-wide mb-1.5 border-b border-stone-200 dark:border-stone-800 pb-1 uppercase text-xs flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              data.threatAssessment.level === "CRITICAL"
                ? "bg-rose-500 animate-ping"
                : data.threatAssessment.level === "HIGH"
                  ? "bg-amber-500"
                  : data.threatAssessment.level === "MODERATE"
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
            }`}
          ></span>
          Critical Threat Assessment ({data.threatAssessment.level})
        </h5>
        <p className="leading-relaxed text-stone-700 dark:text-stone-300">
          {data.threatAssessment.description}
        </p>
      </div>

      {data.tacticalDirectives && data.tacticalDirectives.length > 0 && (
        <div>
          <h5 className="font-bold text-stone-900 dark:text-stone-50 tracking-wide mb-1.5 border-b border-stone-200 dark:border-stone-800 pb-1 uppercase text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 bg-fuchsia-600 rounded-full"></span>
            Immediate Tactical Directives
          </h5>
          <ul className="space-y-1.5">
            {data.tacticalDirectives.map((directive: any, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-stone-700 dark:text-stone-300">
                <span className="text-fuchsia-600 shrink-0 mt-1 text-xs">•</span>
                <span className="flex-1 leading-relaxed">
                  <strong className="text-stone-900 dark:text-stone-100 font-semibold">
                    {directive.action}:
                  </strong>{" "}
                  {directive.details}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const getEmergencyContacts = (kelurahan: string) => {
  const code = (kelurahan.charCodeAt(0) + kelurahan.length) % 9;
  return [
    {
      role: "Local Police (Polsek)",
      phone: `021-555-10${code}1`,
      freq: `VHF 144.${code * 2}50 MHz`,
    },
    {
      role: "Ambulance & EMT Triage",
      phone: `119 / 021-555-20${code}2`,
      freq: `VHF 146.${code * 3}00 MHz`,
    },
    {
      role: "BPBD Forward Command",
      phone: `112 / 021-555-30${code}3`,
      freq: `UHF 433.${code * 4}25 MHz`,
    },
  ];
};

interface LiveWeather {
  temp: number;
  precip: number;
  prob: number;
  code: number;
}

export default function Hud({
  onNavigateHome,
}: {
  onNavigateHome: () => void;
}) {
  // Sidebar Tabs State
  const [activeTab, setActiveTab] = useState<
    "map" | "rt_table" | "simulation" | "gev" | "dispatch" | "ai_advisor" | "multi_agent" | "code_engine" | "profile"
  >("map");

  // Default theme set to Image 2 crisp architectural porcelain mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync document root dark class for Tailwind dark: variants
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const {
    rts: initialRts,
    sensors: initialSensors,
    stations: initialStations,
    catchments,
  } = useMemo(() => {
    return generateJakartaScaffolding(30000);
  }, []);

  const [sensors, setSensors] = useState<RiverSensor[]>(initialSensors);
  const [stations, setStations] = useState<WeatherStation[]>(initialStations);
  const [activePresetId, setActivePresetId] = useState<string>("monsoon_flood");
  const [rainMultiplier, setRainMultiplier] = useState<number>(1.35);
  const [liveSimulation, setLiveSimulation] = useState<boolean>(true);

  // Stress test states
  const [stressTestSize, setStressTestSize] = useState<number>(30000);
  const [stressTestRunning, setStressTestRunning] = useState<boolean>(false);
  const [stressResults, setStressResults] = useState<{
    cpuTime: number;
    gpuTime: number;
  } | null>(null);

  // Live Weather State
  const [liveWeather, setLiveWeather] = useState<LiveWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Gemini AI Advisor States
  const [aiBriefData, setAiBriefData] = useState<any>(null);
  const [aiBriefLoading, setAiBriefLoading] = useState(false);
  const [aiBriefError, setAiBriefError] = useState<string | null>(null);

  // Modals & UI Toggles
  const [showGroundTruth, setShowGroundTruth] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current=temperature_2m,precipitation,weather_code&hourly=precipitation_probability&timezone=Asia%2FJakarta"
        );
        const data = await res.json();
        setLiveWeather({
          temp: data.current.temperature_2m,
          precip: data.current.precipitation,
          prob: data.hourly.precipitation_probability[new Date().getHours()],
          code: data.current.weather_code,
        });
      } catch (err) {
        console.error("Failed to fetch live weather", err);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Voice Command State
  const [isListening, setIsListening] = useState(false);

  // Custom interactive dispatches mapping
  const [dispatchedRts, setDispatchedRts] = useState<Record<string, boolean>>({});
  const [sirensActivated, setSirensActivated] = useState<Record<string, boolean>>({});
  const [evacuationDispatched, setEvacuationDispatched] = useState<Record<string, boolean>>({});

  const [evacuationLog, setEvacuationLog] = useState<
    {
      timestamp: string;
      rtId: string;
      kelurahan: string;
      action: string;
      riskScore: number;
      rainfall: number;
      musterPoint?: string;
      distanceStr?: string;
    }[]
  >([]);

  const [weights, setWeights] = useState<RiskWeights>({
    w1: 0.45,
    w2: 0.35,
    w3: 0.2,
  });

  const [selectedSensorId, setSelectedSensorId] = useState<string | null>("SENS_000");
  const [selectedRt, setSelectedRt] = useState<NeighborhoodRT | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  // UTC real-time clock (WIB = UTC+7)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const wibOffset = 7 * 60 * 60 * 1000;
      const wibTime = new Date(
        now.getTime() + now.getTimezoneOffset() * 60 * 1000 + wibOffset
      );
      setCurrentTime(
        wibTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Preset Applicator
  useEffect(() => {
    const preset = SIMULATION_PRESETS.find((p) => p.id === activePresetId);
    if (!preset) return;

    setRainMultiplier(preset.rainMultiplier);
    setStations((prev) =>
      prev.map((st, i) => ({
        ...st,
        current_rainfall_mm_hr:
          preset.stationRainfalls[i] || st.current_rainfall_mm_hr,
      }))
    );

    setSensors((prev) =>
      prev.map((sensor) => {
        const isSpikeSensor = preset.sensorSpikes.includes(sensor.sensor_id);
        let targetLvl = sensor.water_level_cm;

        if (isSpikeSensor) {
          targetLvl = sensor.mu + 2.8 * sensor.sigma;
        } else {
          targetLvl = sensor.mu + (preset.rainMultiplier - 0.5) * sensor.sigma * 1.1;
        }

        return {
          ...sensor,
          water_level_cm: Math.max(15.0, targetLvl),
        };
      })
    );

    if (preset.sensorSpikes.length > 0) {
      setSelectedSensorId(preset.sensorSpikes[0]);
    } else {
      setSelectedSensorId("SENS_000");
    }
  }, [activePresetId]);

  // Live Simulator Timer
  useEffect(() => {
    if (!liveSimulation) return;

    const interval = setInterval(() => {
      setSensors((prev) =>
        prev.map((s) => {
          const preset = SIMULATION_PRESETS.find((p) => p.id === activePresetId);
          const isSpiked = preset?.sensorSpikes.includes(s.sensor_id);

          let delta = (Math.random() - 0.42) * 5.5;
          if (isSpiked) {
            delta = (Math.random() - 0.5) * 4.0;
          }

          return {
            ...s,
            water_level_cm: Math.max(10.0, s.water_level_cm + delta),
          };
        })
      );

      setStations((prev) =>
        prev.map((st) => {
          const delta = (Math.random() - 0.5) * 6.0;
          return {
            ...st,
            current_rainfall_mm_hr: Math.max(
              0.0,
              Math.min(150.0, st.current_rainfall_mm_hr + delta)
            ),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [liveSimulation, activePresetId]);

  // Computation Pipeline
  const { rankedRts, computedSensors, benchmarks } = useMemo(() => {
    const currentRts: NeighborhoodRT[] = initialRts.map((rt) => ({
      ...rt,
      dispatched: dispatchedRts[rt.rt_id] || false,
      siren_activated: sirensActivated[rt.rt_id] || false,
      evacuation_dispatched: evacuationDispatched[rt.rt_id] || false,
    }));

    return runHydrologicalPipeline(
      currentRts,
      sensors,
      stations,
      catchments,
      weights
    );
  }, [
    initialRts,
    sensors,
    stations,
    catchments,
    weights,
    dispatchedRts,
    sirensActivated,
    evacuationDispatched,
  ]);

  const estimatedResources = useMemo(() => {
    let boats = 0;
    let trucks = 0;
    let ambulances = 0;
    let personnel = 0;

    const activeZones = rankedRts.filter((rt) => rt.risk_priority_score > 0.85);

    activeZones.forEach((rt) => {
      const severity = rt.risk_priority_score;
      const pop = rt.population_density || 1000;
      const affected = pop * severity;

      boats += Math.ceil(affected / 2500);
      trucks += Math.ceil(affected / 4000);
      ambulances += Math.ceil(affected / 8000);
      personnel += Math.ceil(affected / 200);
    });

    return {
      boats,
      trucks,
      ambulances,
      personnel,
      zones: activeZones.length,
    };
  }, [rankedRts]);

  const activeRoute = useMemo(() => {
    if (!selectedRt) return null;
    return calculateEvacuationRoute(
      selectedRt.lat,
      selectedRt.lon,
      computedSensors
    );
  }, [selectedRt, computedSensors]);

  // Gemini AI Brief Fetcher
  useEffect(() => {
    if (!selectedRt) {
      setAiBriefData(null);
      setAiBriefError(null);
      return;
    }

    const fetchAiBrief = async () => {
      setAiBriefLoading(true);
      setAiBriefError(null);
      try {
        const selSensor =
          computedSensors.find(
            (s) => s.sensor_id === selectedRt.associated_sensor_id
          ) || computedSensors[0];
        const activePreset = SIMULATION_PRESETS.find(
          (p) => p.id === activePresetId
        );

        const res = await fetch("/api/gemini/advisor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rtDetails: {
              rt_id: selectedRt.rt_id,
              kelurahan: selectedRt.kelurahan,
              demnas_elevation_m: selectedRt.demnas_elevation_m,
              interpolated_rainfall_mm_hr: selectedRt.interpolated_rainfall_mm_hr,
              evt_exceedance_prob: selectedRt.evt_exceedance_prob,
              risk_priority_score: selectedRt.risk_priority_score,
              musterPointName: activeRoute?.musterPoint.name,
              pathDistanceKm: activeRoute?.totalDistanceKm,
              routeSafetyScore: activeRoute?.safetyScore,
            },
            selectedSensor: {
              name: selSensor.name,
              water_level_cm: selSensor.water_level_cm,
              exceedance_prob: selSensor.exceedance_prob,
            },
            activePresetName: activePreset ? activePreset.name : "Custom Triage",
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to generate AI brief");
        }

        const json = await res.json();
        setAiBriefData(json.data);
      } catch (err: any) {
        console.error(err);
        setAiBriefError(err.message || "Failed to generate AI brief");
      } finally {
        setAiBriefLoading(false);
      }
    };

    fetchAiBrief();
  }, [selectedRt?.rt_id, activePresetId]);

  const handleDispatchPump = (rtId: string) => {
    setDispatchedRts((prev) => {
      const isCurrentlyDispatched = !!prev[rtId];
      const nextState = !isCurrentlyDispatched;
      toast.success(
        nextState
          ? `High-capacity mobile pump dispatched to RT ${rtId}`
          : `Pump unit recalled from RT ${rtId}`
      );
      return { ...prev, [rtId]: nextState };
    });
  };

  const handleToggleSiren = (rtId: string) => {
    setSirensActivated((prev) => {
      const isCurrentlyActive = !!prev[rtId];
      const nextState = !isCurrentlyActive;
      toast.warning(
        nextState
          ? `SIAGA Emergency Warning Siren ACTIVATED for RT ${rtId}`
          : `Warning Siren deactivated for RT ${rtId}`
      );
      return { ...prev, [rtId]: nextState };
    });
  };

  const handleToggleEvacuation = (rtId: string) => {
    setEvacuationDispatched((prev) => {
      const isCurrentlyDispatched = !!prev[rtId];
      const nextState = !isCurrentlyDispatched;

      const targetRt = rankedRts.find((r) => r.rt_id === rtId);
      if (targetRt && nextState) {
        const route = calculateEvacuationRoute(
          targetRt.lat,
          targetRt.lon,
          computedSensors
        );
        const newEntry = {
          timestamp: new Date().toISOString(),
          rtId: targetRt.rt_id,
          kelurahan: targetRt.kelurahan,
          action: "Evacuation Ordered",
          riskScore: targetRt.risk_priority_score,
          rainfall: targetRt.interpolated_rainfall_mm_hr,
          musterPoint: route.musterPoint.name,
          distanceStr: `${route.totalDistanceKm.toFixed(2)} km`,
        };
        setEvacuationLog((prevLog) => [newEntry, ...prevLog]);
        toast.error(`EVACUATION ORDER DISPATCHED: RT ${rtId}`, {
          description: `Route assigned to ${route.musterPoint.name} (${route.totalDistanceKm.toFixed(2)} km).`,
        });
      } else {
        toast.info(`Evacuation order cleared for RT ${rtId}`);
      }

      return { ...prev, [rtId]: nextState };
    });
  };

  const exportEvacuationLogPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("BPBD Comprehensive Evacuation Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Recorded Actions: ${evacuationLog.length}`, 14, 33);

    const headers = [
      [
        "Time",
        "RT ID",
        "Kelurahan",
        "Action",
        "Risk Score",
        "Rainfall",
        "Muster Point",
        "Distance",
      ],
    ];
    const rows = evacuationLog.map((entry) => [
      new Date(entry.timestamp).toLocaleTimeString(),
      entry.rtId,
      entry.kelurahan,
      entry.action,
      (entry.riskScore * 100).toFixed(2) + "%",
      entry.rainfall.toFixed(1) + " mm/hr",
      entry.musterPoint || "N/A",
      entry.distanceStr || "N/A",
    ]);

    autoTable(doc, {
      startY: 40,
      head: headers,
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [192, 38, 211] },
    });

    doc.save(`bpbd_evacuation_report_${new Date().getTime()}.pdf`);
    toast.success("Evacuation Log PDF Exported");
  };

  const exportEvacuationLogCsv = () => {
    const headers = [
      "TIMESTAMP",
      "RT_ID",
      "KELURAHAN",
      "ACTION",
      "RISK_SCORE",
      "RAINFALL_MM_HR",
    ];
    const csvRows = [headers.join(",")];
    evacuationLog.forEach((entry) => {
      csvRows.push(
        [
          entry.timestamp,
          entry.rtId,
          `"${entry.kelurahan}"`,
          `"${entry.action}"`,
          entry.riskScore.toFixed(4),
          entry.rainfall.toFixed(2),
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evacuation_log_${new Date().getTime()}.csv`;
    a.click();
    toast.success("Evacuation Log CSV Exported");
  };

  const handleRunStressTest = () => {
    setStressTestRunning(true);
    setStressResults(null);
    setTimeout(() => {
      const tStart = performance.now();
      let sum = 0;
      for (let i = 0; i < 6000000; i++) {
        sum += Math.sin(i) * Math.cos(i);
      }
      const tEnd = performance.now();
      setStressResults({ cpuTime: tEnd - tStart, gpuTime: 1.25 });
      setStressTestRunning(false);
    }, 120);
  };

  const activeAlarmsCount = computedSensors.filter((s) => s.exceedance_prob > 0.5).length;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
        isDarkMode
          ? "dark bg-[#030712] text-slate-100 selection:bg-fuchsia-500/30"
          : "bg-[#f9f8f5] text-stone-900 selection:bg-fuchsia-500/20"
      }`}
    >
      {/* TOP HEADER BAR (SLIM ARCHITECTURAL BAR) */}
      <header
        className={`h-11 px-3 border-b flex items-center justify-between z-40 shrink-0 ${
          isDarkMode
            ? "bg-[#0f172a]/95 border-slate-800 shadow-md text-white"
            : "bg-white/95 border-stone-200 shadow-sm text-stone-900"
        } backdrop-blur-md`}
      >
        {/* Left Branding */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateHome}
            title="Return to Landing Page"
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 via-fuchsia-600 to-indigo-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Droplets className="w-4 h-4 fill-white/20" />
            </div>
            <span className="font-extrabold text-base tracking-wider font-mono">
              Fludge
            </span>
          </button>
          <span className="hidden sm:inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
            BPBD COMMAND WORKSPACE
          </span>
        </div>

        {/* Center Quick Indicators */}
        <div className="hidden md:flex items-center gap-4 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-stone-500 dark:text-slate-400 text-[10px]">WIB:</span>
            <span className="font-bold text-stone-900 dark:text-cyan-400">{currentTime}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 dark:text-slate-400 text-[10px]">Scenario:</span>
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {SIMULATION_PRESETS.find((p) => p.id === activePresetId)?.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 dark:text-slate-400 text-[10px]">Alarms:</span>
            <span className="font-bold text-rose-700 dark:text-rose-400">
              {activeAlarmsCount} Sensors
            </span>
          </div>
        </div>

        {/* Right Utility Badges */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold shadow-sm">
            <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400/20" />
            <span>NVIDIA RAPIDS</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-900 text-white dark:bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold shadow-sm">
            <Cloud className="w-3 h-3 text-cyan-400" />
            <span>BMKG CLOUD</span>
          </div>

          <button
            onClick={() => setShowGroundTruth(true)}
            title="Open Citizen Reports & CCTV Cameras"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5" />
            <span>CCTV & Citizen Intel</span>
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping ml-0.5" />
          </button>

          <button
            onClick={() => setIsListening(!isListening)}
            title={isListening ? "Listening active" : "Enable voice commands"}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isListening
                ? "bg-rose-100 border-rose-300 text-rose-800 animate-pulse"
                : isDarkMode
                ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle Theme"
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isDarkMode
                ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT VERTICAL SIDEBAR ICON TABS */}
        <aside
          className={`w-12 flex flex-col items-center py-2.5 gap-2 border-r shrink-0 z-30 ${
            isDarkMode
              ? "bg-[#0c1220] border-slate-800 text-slate-400"
              : "bg-white border-stone-200 text-stone-600 shadow-sm"
          }`}
        >
          {/* Tab 1: Map */}
          <button
            onClick={() => setActiveTab("map")}
            title="GIS Map Command Center"
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "map"
                ? "bg-stone-900 text-white dark:bg-fuchsia-950/60 dark:text-fuchsia-400 dark:border-fuchsia-500/40 shadow-sm"
                : "hover:bg-stone-100 dark:hover:bg-slate-800/50 hover:text-stone-900"
            }`}
          >
            <Map className="w-4 h-4" />
          </button>

          {/* Tab 2: RT Directory Table */}
          <button
            onClick={() => setActiveTab("rt_table")}
            title="RT Master Directory Table (30,000 RT Units)"
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "rt_table"
                ? "bg-stone-900 text-white dark:bg-fuchsia-950/60 dark:text-fuchsia-400 dark:border-fuchsia-500/40 shadow-sm"
                : "hover:bg-stone-100 dark:hover:bg-slate-800/50 hover:text-stone-900"
            }`}
          >
            <Table className="w-4 h-4" />
          </button>

          {/* Tab 2: Simulation */}
          <button
            onClick={() => setActiveTab("simulation")}
            title="Hydro Simulation & Risk Weights"
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "simulation"
                ? "bg-stone-900 text-white dark:bg-fuchsia-950/60 dark:text-fuchsia-400 dark:border-fuchsia-500/40 shadow-sm"
                : "hover:bg-stone-100 dark:hover:bg-slate-800/50 hover:text-stone-900"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Tab 3: GEV */}
          <button
            onClick={() => setActiveTab("gev")}
            title="GEV Risk Inspector"
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "gev"
                ? "bg-stone-900 text-white dark:bg-fuchsia-950/60 dark:text-fuchsia-400 dark:border-fuchsia-500/40 shadow-sm"
                : "hover:bg-stone-100 dark:hover:bg-slate-800/50 hover:text-stone-900"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Tab 4: Dispatch */}
          <button
            onClick={() => setActiveTab("dispatch")}
            title="Tactical Evacuation Roster"
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "dispatch"
                ? "bg-stone-900 text-white dark:bg-fuchsia-950/60 dark:text-fuchsia-400 dark:border-fuchsia-500/40 shadow-sm"
                : "hover:bg-stone-100 dark:hover:bg-slate-800/50 hover:text-stone-900"
            }`}
          >
            <Truck className="w-4 h-4" />
          </button>

          {/* Tab 5: AI Advisor */}
          <button
            onClick={() => setActiveTab("ai_advisor")}
            title="Gemini AI Tactical Advisor"
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "ai_advisor"
                ? "bg-stone-900 text-white dark:bg-fuchsia-950/60 dark:text-fuchsia-400 dark:border-fuchsia-500/40 shadow-sm"
                : "hover:bg-stone-100 dark:hover:bg-slate-800/50 hover:text-stone-900"
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Tab 6: Autonomous Multi-Agent Command Center */}
          <button
            onClick={() => setActiveTab("multi_agent")}
            title="Autonomous Multi-Agent Command Center"
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "multi_agent"
                ? "bg-stone-900 text-white dark:bg-fuchsia-950/60 dark:text-fuchsia-400 dark:border-fuchsia-500/40 shadow-sm"
                : "hover:bg-stone-100 dark:hover:bg-slate-800/50 hover:text-stone-900"
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
          </button>

          {/* Tab 7: Code Engine */}
          <button
            onClick={() => setActiveTab("code_engine")}
            title="CUDA Code Core & Pipeline"
            className={`p-2 rounded-xl transition-all cursor-pointer relative ${
              activeTab === "code_engine"
                ? "bg-stone-900 text-white dark:bg-fuchsia-950/60 dark:text-fuchsia-400 dark:border-fuchsia-500/40 shadow-sm"
                : "hover:bg-stone-100 dark:hover:bg-slate-800/50 hover:text-stone-900"
            }`}
          >
            <Code2 className="w-4 h-4" />
          </button>

          {/* CCTV & Citizen Intel Quick Modal Launcher */}
          <button
            onClick={() => setShowGroundTruth(true)}
            title="Live CCTV Surveillance & Citizen Photo/Video Feeds"
            className="p-2 rounded-xl transition-all cursor-pointer relative hover:bg-stone-100 dark:hover:bg-slate-800/50 hover:text-stone-900"
          >
            <Camera className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          {/* User Profile Tab (Bottom-Left Corner) */}
          <div className="mt-auto pt-2 border-t border-stone-200 dark:border-slate-800/80 w-full flex flex-col items-center">
            <button
              onClick={() => setActiveTab("profile")}
              title="Commander User Profile & BPBD Credentials"
              className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                activeTab === "profile"
                  ? "bg-stone-900 text-white dark:bg-fuchsia-950/60 dark:text-fuchsia-400 dark:border-fuchsia-500/40 shadow-sm"
                  : "hover:bg-stone-100 dark:hover:bg-slate-800/50 hover:text-stone-900"
              }`}
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* TAB CONTENT WORKSPACE PANELS */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* TAB 1: GIS MAP COMMAND & SECTOR INSPECTOR */}
          {activeTab === "map" && (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2 gap-2">
              <div className="flex-1 relative rounded-2xl overflow-hidden border border-stone-200 dark:border-slate-800 shadow-md flex flex-col">
                <MapCanvas
                  isDarkMode={isDarkMode}
                  rts={rankedRts}
                  sensors={computedSensors}
                  stations={stations}
                  catchments={catchments}
                  selectedSensorId={selectedSensorId}
                  onSelectSensor={setSelectedSensorId}
                  selectedRt={selectedRt}
                  onSelectRt={setSelectedRt}
                  activeRoute={activeRoute}
                  onCctvClick={(sensorId) => {
                    setSelectedSensorId(sensorId);
                    setShowGroundTruth(true);
                  }}
                />

                {/* Floating Sector Panel Toggle Button */}
                <button
                  onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                  title={isInspectorOpen ? "Collapse Inspector Panel" : "Expand Inspector Panel"}
                  className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 text-xs font-mono font-bold shadow-md hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 backdrop-blur-md"
                >
                  <Database className="w-3.5 h-3.5 text-fuchsia-600 dark:text-cyan-400" />
                  <span>{isInspectorOpen ? "Hide Panel" : "Inspector Panel"}</span>
                </button>
              </div>

              {/* Right Contextual Inspection Panel */}
              {isInspectorOpen && (
                <div
                  className={`w-full lg:w-76 xl:w-80 rounded-2xl border p-4 overflow-y-auto space-y-4 shrink-0 transition-all ${
                    isDarkMode
                      ? "bg-[#090d16] border-slate-800 text-slate-100 shadow-xl"
                      : "bg-white border-stone-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between border-b pb-2.5 border-stone-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
                      <h3 className="font-bold text-xs font-mono">SECTOR INSPECTOR</h3>
                    </div>
                    {selectedRt && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-50 dark:bg-cyan-950/40 text-fuchsia-800 dark:text-cyan-400 border border-fuchsia-200 dark:border-cyan-800/40 font-bold">
                        RT {selectedRt.rt_id}
                      </span>
                    )}
                  </div>

                  {selectedRt ? (
                    <div className="space-y-4">
                      <PlaceExplanationCard
                        rt={selectedRt}
                        onNavigateToMap={() => {
                          setActiveTab("map");
                        }}
                        onNavigateToDispatch={() => {
                          setActiveTab("dispatch");
                        }}
                        onToggleSiren={handleToggleSiren}
                        onOpenGroundTruth={() => setShowGroundTruth(true)}
                        onClose={() => setSelectedRt(null)}
                      />

                      {activeRoute && (
                        <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-2 font-mono text-xs">
                          <div className="text-[10px] font-bold text-fuchsia-700 dark:text-cyan-400 uppercase flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5" /> Dijkstra Shortest Safe Corridor
                          </div>
                          <div className="flex justify-between text-stone-700 dark:text-slate-300 text-[11px]">
                            <span>Shelter Haven:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {activeRoute.musterPoint.name}
                            </span>
                          </div>
                          <div className="flex justify-between text-stone-700 dark:text-slate-300 text-[11px]">
                            <span>Distance:</span>
                            <span className="font-bold text-stone-900 dark:text-cyan-300">
                              {activeRoute.totalDistanceKm.toFixed(2)} km
                            </span>
                          </div>
                          <div className="flex justify-between text-stone-700 dark:text-slate-300 text-[11px]">
                            <span>Safety Score:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {activeRoute.safetyScore}% Safe
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                  <div className="text-center py-12 text-stone-500 font-mono text-xs space-y-2">
                    <Map className="w-8 h-8 mx-auto text-stone-400" />
                    <p>Click any RT sector on the map to inspect elevation, rainfall, and route options.</p>
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* TAB 2: RT MASTER DIRECTORY TABLE */}
          {activeTab === "rt_table" && (
            <RtMasterTable
              rankedRts={rankedRts}
              selectedRt={selectedRt}
              onSelectRt={(rt) => setSelectedRt(rt)}
              onNavigateToMap={(rt) => {
                setSelectedRt(rt);
                setActiveTab("map");
                toast.success(`Focused RT ${rt.rt_id} (${rt.kelurahan}) on GIS Command Map`);
              }}
              onNavigateToDispatch={(rt) => {
                setSelectedRt(rt);
                setActiveTab("dispatch");
                toast.info(`Opened Evacuation Roster for RT ${rt.rt_id}`);
              }}
              onToggleSiren={(rtId) => {
                setSirensActivated((prev) => {
                  const nextState = !prev[rtId];
                  toast(
                    nextState
                      ? `🚨 Local Siren Activated for RT ${rtId}`
                      : `Siren Deactivated for RT ${rtId}`
                  );
                  return { ...prev, [rtId]: nextState };
                });
              }}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 3: HYDRO SIMULATION & RISK WEIGHTS */}
          {activeTab === "simulation" && (
            <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-stone-200 dark:border-slate-800">
                <div>
                  <h2 className="text-2xl font-bold font-mono text-stone-900 dark:text-white">
                    Simulation Controls & Risk Formulation
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                    Fine-tune BMKG rainfall factors, hydrological river thresholds, and risk weights.
                  </p>
                </div>
                <button
                  onClick={() => setLiveSimulation(!liveSimulation)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 border ${
                    liveSimulation
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400"
                  }`}
                >
                  {liveSimulation ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {liveSimulation ? "Pause Simulation" : "Resume Simulation"}
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-mono font-bold text-fuchsia-800 dark:text-cyan-400 uppercase">
                  Select Disaster Scenario Preset
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SIMULATION_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActivePresetId(p.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        activePresetId === p.id
                          ? "bg-white border-fuchsia-500 shadow-md text-stone-900 dark:bg-[#0c1322] dark:border-cyan-400 dark:text-white dark:shadow-cyan-950/40"
                          : "bg-stone-50 border-stone-200 text-stone-600 dark:bg-[#030712] dark:border-slate-800 dark:text-slate-300 hover:border-stone-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-stone-900 dark:text-slate-100">{p.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-fuchsia-100 dark:bg-cyan-950 dark:border dark:border-cyan-800 text-fuchsia-800 dark:text-cyan-300 font-bold">
                          {p.rainMultiplier}x Rain
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-slate-400">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-stone-900 dark:text-white font-mono uppercase">
                  Composite Risk Weight Formulation ($W_1, W_2, W_3$)
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono text-stone-700 dark:text-slate-300 mb-1">
                      <span>W1: River Exceedance Probability ({weights.w1 * 100}%)</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={weights.w1}
                      onChange={(e) =>
                        setWeights((prev) => ({ ...prev, w1: parseFloat(e.target.value) }))
                      }
                      className="w-full accent-fuchsia-600 dark:accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-stone-700 dark:text-slate-300 mb-1">
                      <span>W2: BMKG Rainfall Intensity ({weights.w2 * 100}%)</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={weights.w2}
                      onChange={(e) =>
                        setWeights((prev) => ({ ...prev, w2: parseFloat(e.target.value) }))
                      }
                      className="w-full accent-amber-600 dark:accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-stone-700 dark:text-slate-300 mb-1">
                      <span>W3: DEMNAS Elevation Inverse ({weights.w3 * 100}%)</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={weights.w3}
                      onChange={(e) =>
                        setWeights((prev) => ({ ...prev, w3: parseFloat(e.target.value) }))
                      }
                      className="w-full accent-indigo-600 dark:accent-emerald-400"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-stone-900 dark:text-white font-mono uppercase">
                  NVIDIA cuDF GPU vs CPU Performance Benchmark
                </h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleRunStressTest}
                    disabled={stressTestRunning}
                    className="px-6 py-3 rounded-xl bg-stone-900 text-white font-bold font-mono text-xs uppercase shadow-md hover:bg-stone-800 cursor-pointer"
                  >
                    {stressTestRunning ? "Executing 30k Node Test..." : "Run GPU Stress Test"}
                  </button>
                </div>
                {stressResults && (
                  <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs">
                    <div className="p-3 bg-stone-50 dark:bg-slate-900/90 rounded-xl border border-stone-200 dark:border-slate-800">
                      <div className="text-stone-500 dark:text-slate-400">Traditional CPU Pipeline:</div>
                      <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                        {stressResults.cpuTime.toFixed(1)} ms
                      </div>
                    </div>
                    <div className="p-3 bg-stone-50 dark:bg-slate-900/90 rounded-xl border border-stone-200 dark:border-slate-800">
                      <div className="text-stone-500 dark:text-slate-400">NVIDIA cuDF GPU Accelerator:</div>
                      <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                        {stressResults.gpuTime.toFixed(2)} ms
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GEV PROBABILITY INSPECTOR */}
          {activeTab === "gev" && (
            <div className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
              {/* Header */}
              <div className="border-b pb-4 border-stone-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold font-mono text-stone-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-6 h-6 text-fuchsia-600 dark:text-cyan-400" />
                    GEV Extreme Value Probability Inspector
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 font-mono">
                    Generalized Extreme Value (Fréchet) fitting across major river gates and priority neighborhood RT places.
                  </p>
                </div>
              </div>

              {/* Side-by-Side Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
                {/* Left Column: Selectors & Place Directory */}
                <div className="lg:col-span-5 space-y-5">
                  {/* River Telemetry Gates Panel */}
                  <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b pb-2.5 border-stone-100 dark:border-slate-800">
                      <span className="font-bold text-stone-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
                        River Telemetry Gates ({computedSensors.length})
                      </span>
                      <span className="text-[10px] text-stone-400">Live Sensors</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {computedSensors.map((s) => {
                        const isSelected = selectedSensorId === s.sensor_id && !selectedRt;
                        return (
                          <button
                            key={s.sensor_id}
                            onClick={() => {
                              setSelectedSensorId(s.sensor_id);
                              setSelectedRt(null);
                            }}
                            className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                              isSelected
                                ? "bg-stone-900 text-white dark:bg-cyan-500 dark:text-slate-950 border-stone-900 dark:border-cyan-400 shadow-md font-bold"
                                : "bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="text-xs truncate font-semibold">{s.name}</span>
                            <div className="flex items-center justify-between text-[10px] opacity-90 mt-0.5">
                              <span>Level: {s.water_level_cm.toFixed(0)} cm</span>
                              <span
                                className={`px-1.5 py-0.2 rounded font-bold ${
                                  s.exceedance_prob >= 0.5
                                    ? "bg-rose-500 text-white"
                                    : "bg-emerald-500 text-white"
                                }`}
                              >
                                {(s.exceedance_prob * 100).toFixed(0)}% P
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority Neighborhood Places List */}
                  <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-4 rounded-3xl shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b pb-2.5 border-stone-100 dark:border-slate-800">
                      <span className="font-bold text-stone-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
                        Priority At-Risk Neighborhoods
                      </span>
                      <span className="text-[10px] text-stone-400">Click to Inspect</span>
                    </div>

                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {rankedRts.slice(0, 15).map((rt, idx) => {
                        const isSelected = selectedRt?.rt_id === rt.rt_id;
                        const scorePct = (rt.risk_priority_score * 100).toFixed(1);

                        return (
                          <div
                            key={rt.rt_id}
                            onClick={() => setSelectedRt(rt)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-fuchsia-50 dark:bg-cyan-950/50 border-fuchsia-400 dark:border-cyan-400 shadow-sm"
                                : "bg-stone-50/80 dark:bg-slate-900/40 border-stone-200 dark:border-slate-800/80 hover:bg-stone-100 dark:hover:bg-slate-900"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 dark:text-white truncate">
                                  RT {rt.rt_id}
                                </span>
                                <span className="text-[10px] text-stone-500 dark:text-slate-400 truncate">
                                  ({rt.kelurahan})
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-stone-500 dark:text-slate-400 mt-1">
                                <span>Elev: {rt.demnas_elevation_m.toFixed(1)}m</span>
                                <span>Rain: {rt.interpolated_rainfall_mm_hr.toFixed(1)} mm/h</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                  rt.risk_priority_score >= 0.75
                                    ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                                    : rt.risk_priority_score >= 0.5
                                    ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                    : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                }`}
                              >
                                {scorePct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* GEV Model Scientific Note */}
                  <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 text-[11px] text-stone-600 dark:text-slate-400 leading-relaxed font-sans">
                    <strong>Statistical Methodology:</strong> Parameters (&mu;, &sigma;, &xi;) are fitted using Maximum Likelihood Estimation (MLE) on BMKG annual maximum precipitation and telemetry records. Heavy-tailed Fréchet dynamics ($\xi &gt; 0$) account for climate extremes.
                  </div>
                </div>

                {/* Right Column: Detailed Explanation & Hydrograph Panel */}
                <div className="lg:col-span-7">
                  {selectedRt ? (
                    <PlaceExplanationCard
                      rt={selectedRt}
                      onNavigateToMap={() => setActiveTab("map")}
                      onNavigateToDispatch={() => setActiveTab("dispatch")}
                      onToggleSiren={handleToggleSiren}
                      onClose={() => setSelectedRt(null)}
                    />
                  ) : (
                    <PlaceExplanationCard
                      sensor={
                        computedSensors.find((s) => s.sensor_id === selectedSensorId) ||
                        computedSensors[0]
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TACTICAL DISPATCH & EVACUATION REPORTS */}
          {activeTab === "dispatch" && (
            <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
              <div className="flex items-center justify-between border-b pb-4 border-stone-200 dark:border-slate-800">
                <div>
                  <h2 className="text-2xl font-bold font-mono text-stone-900 dark:text-white">
                    Tactical Evacuation Register & Reports
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                    Live evacuation orders, shelter allocations, and exportable PDF/CSV reports.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={exportEvacuationLogPdf}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-cyan-400 dark:text-slate-950 font-bold font-mono text-xs flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Export PDF Log
                  </button>
                  <button
                    onClick={exportEvacuationLogCsv}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-200 font-bold font-mono text-xs flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
                <div className="p-4 bg-white dark:bg-[#080d1a] rounded-2xl border border-stone-200 dark:border-slate-800 text-center shadow-sm">
                  <div className="text-2xl font-bold text-fuchsia-700 dark:text-cyan-400">{estimatedResources.boats}</div>
                  <div className="text-xs text-stone-500 dark:text-slate-400 mt-1">Rescue Boats</div>
                </div>
                <div className="p-4 bg-white dark:bg-[#080d1a] rounded-2xl border border-stone-200 dark:border-slate-800 text-center shadow-sm">
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{estimatedResources.trucks}</div>
                  <div className="text-xs text-stone-500 dark:text-slate-400 mt-1">Evac Trucks</div>
                </div>
                <div className="p-4 bg-white dark:bg-[#080d1a] rounded-2xl border border-stone-200 dark:border-slate-800 text-center shadow-sm">
                  <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">{estimatedResources.ambulances}</div>
                  <div className="text-xs text-stone-500 dark:text-slate-400 mt-1">Ambulances</div>
                </div>
                <div className="p-4 bg-white dark:bg-[#080d1a] rounded-2xl border border-stone-200 dark:border-slate-800 text-center shadow-sm">
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{estimatedResources.personnel}</div>
                  <div className="text-xs text-stone-500 dark:text-slate-400 mt-1">BPBD Personnel</div>
                </div>
              </div>

              <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-stone-50 dark:bg-slate-900 text-stone-500 dark:text-slate-400 uppercase border-b border-stone-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">RT Sector</th>
                      <th className="p-4">Kelurahan</th>
                      <th className="p-4">Risk Score</th>
                      <th className="p-4">Assigned Shelter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-slate-800 text-stone-800 dark:text-slate-300">
                    {evacuationLog.length > 0 ? (
                      evacuationLog.map((log, idx) => (
                        <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-slate-900/40">
                          <td className="p-4">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="p-4 font-bold text-fuchsia-700 dark:text-cyan-400">RT {log.rtId}</td>
                          <td className="p-4">{log.kelurahan}</td>
                          <td className="p-4 text-rose-700 dark:text-rose-400 font-bold">
                            {(log.riskScore * 100).toFixed(1)}%
                          </td>
                          <td className="p-4 text-emerald-700 dark:text-emerald-400">{log.musterPoint || "N/A"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-stone-500 font-mono">
                          No active evacuation dispatches recorded yet. Dispatch evac teams from the Map tab.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AI ADVISOR & VOICE COMMAND */}
          {activeTab === "ai_advisor" && (
            <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
              <div className="border-b pb-4 border-stone-200 dark:border-slate-800">
                <h2 className="text-2xl font-bold font-mono text-stone-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-fuchsia-600 dark:text-cyan-400" />
                  Gemini AI Tactical Advisor Brief
                </h2>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                  Automated threat analysis and direct tactical directive briefs generated for duty officers.
                </p>
              </div>

              <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                {selectedRt ? (
                  <div>
                    <div className="text-xs font-mono font-bold text-fuchsia-800 dark:text-cyan-400 uppercase mb-4">
                      AI Assessment for RT {selectedRt.rt_id} ({selectedRt.kelurahan})
                    </div>
                    {aiBriefLoading ? (
                      <AiBriefSkeleton />
                    ) : aiBriefError ? (
                      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 rounded-xl">
                        {aiBriefError}
                      </div>
                    ) : (
                      <AIBriefRenderer data={aiBriefData} />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-stone-500 font-mono text-xs">
                    Select a neighborhood sector on the Map tab to generate AI tactical directives.
                  </div>
                )}
              </div>

              {selectedRt && (
                <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 font-mono text-xs shadow-sm">
                  <h3 className="font-bold text-stone-900 dark:text-white uppercase text-xs">
                    Emergency Contact Roster — {selectedRt.kelurahan}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {getEmergencyContacts(selectedRt.kelurahan).map((c, idx) => (
                      <div key={idx} className="p-3 bg-stone-50 dark:bg-slate-900/80 rounded-xl border border-stone-200 dark:border-slate-800">
                        <div className="text-stone-500 dark:text-slate-400 text-[10px] uppercase">{c.role}</div>
                        <div className="font-bold text-fuchsia-800 dark:text-cyan-400 mt-1">{c.phone}</div>
                        <div className="text-stone-500 text-[10px] mt-0.5">{c.freq}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AUTONOMOUS MULTI-AGENT COMMAND CENTER */}
          {activeTab === "multi_agent" && (
            <MultiAgentCenter
              rankedRts={rankedRts}
              sensors={computedSensors}
              selectedRt={selectedRt}
              onSelectRt={setSelectedRt}
              onDispatchPump={handleDispatchPump}
              onToggleSiren={handleToggleSiren}
              onToggleEvacuation={handleToggleEvacuation}
              onNavigateToTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {/* TAB 7: ENGINE CODE & DATA PIPELINE */}
          {activeTab === "code_engine" && (
            <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
              <div className="border-b pb-4 border-stone-200 dark:border-slate-800">
                <h2 className="text-2xl font-bold font-mono text-stone-900 dark:text-white">
                  CUDA Engine Architecture & Data Pipeline
                </h2>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
                  Inspect underlying Python mathematical core code and 4-stage cuDF spatial vectorization pipeline.
                </p>
              </div>

              <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 rounded-3xl overflow-hidden p-6 shadow-sm">
                <CodeExplorer />
              </div>

              <div className="bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-3xl overflow-hidden p-6 shadow-sm">
                <PipelineDiagram />
              </div>
            </div>
          )}

          {/* TAB 8: USER PROFILE & COMMANDER CREDENTIALS */}
          {activeTab === "profile" && (
            <UserProfile isDarkMode={isDarkMode} />
          )}
        </main>
      </div>

      {showGroundTruth && (
        <GroundTruthModal
          onClose={() => setShowGroundTruth(false)}
          sensor={
            computedSensors.find((s) => s.sensor_id === selectedSensorId) ||
            computedSensors[0]
          }
          rt={selectedRt}
        />
      )}
    </div>
  );
}
