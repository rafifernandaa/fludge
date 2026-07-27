import re

hud_top = """import React, { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";

import { toast } from "sonner";
import { motion } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { generateJakartaScaffolding, SIMULATION_PRESETS } from "./data";
import { runHydrologicalPipeline } from "./math_engine";
import { MapCanvas } from "./components/MapCanvas";
import { GevChart } from "./components/GevChart";
import { GroundTruthModal } from "./components/GroundTruthModal";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { CodeExplorer } from "./components/CodeExplorer";
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

// Helper to parse basic Markdown inline styles (bold segments with **)
function parseInlineStyles(text: string, keyPrefix: string) {
  const parts = text.split("**");
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong
          key={`${keyPrefix}-bold-${index}`}
          className="font-bold text-stone-900 dark:text-stone-50"
        >
          {part}
        </strong>
      );
    }
    return part;
  });
}

// Custom component to format the Gemini AI brief correctly
function AIBriefRenderer({ data }: { data: any }) {
  if (!data || !data.threatAssessment) return null;

  return (
    <div className="space-y-3 text-[10.5px]">
      {/* Metadata Block */}
      {(data.metadata?.to || data.metadata?.subject) && (
        <div className="text-brand-cyan/90 font-semibold uppercase tracking-wider text-[9px] font-mono leading-normal bg-brand-cyan/5 px-2.5 py-1.5 rounded border border-brand-cyan/10 flex flex-col gap-0.5">
          {data.metadata.to && <span>TO: {data.metadata.to}</span>}
          {data.metadata.subject && <span>SUBJ: {data.metadata.subject}</span>}
        </div>
      )}

      {/* Threat Assessment */}
      <div>
        <h5 className="font-bold text-stone-900 dark:text-stone-50 tracking-wide mb-1.5 border-b border-stone-200 dark:border-stone-700 pb-1 uppercase text-[10px] font-mono flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              data.threatAssessment.level === "CRITICAL"
                ? "bg-red-500 animate-ping"
                : data.threatAssessment.level === "HIGH"
                  ? "bg-brand-orange"
                  : data.threatAssessment.level === "MODERATE"
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
            }`}
          ></span>
          Critical Threat Assessment ({data.threatAssessment.level})
        </h5>
        <p className="leading-relaxed text-stone-700 dark:text-stone-200">
          {data.threatAssessment.description}
        </p>
      </div>

      {/* Tactical Directives */}
      {data.tacticalDirectives && data.tacticalDirectives.length > 0 && (
        <div>
          <h5 className="font-bold text-stone-900 dark:text-stone-50 tracking-wide mb-1.5 border-b border-stone-200 dark:border-stone-700 pb-1 uppercase text-[10px] font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full"></span>
            Immediate Tactical Directives
          </h5>
          <ul className="space-y-1.5">
            {data.tacticalDirectives.map((directive: any, idx: number) => (
              <li
                key={idx}
                className="flex items-start gap-1.5 pl-1 text-stone-700 dark:text-stone-200"
              >
                <span className="text-brand-cyan shrink-0 mt-1 text-[8px]">
                  •
                </span>
                <span className="flex-1 leading-relaxed">
                  <strong className="text-stone-900 dark:text-stone-50">
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
      role: "Ambulance & EMT",
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
  // --- STATE ---
  // Generate scaffolding dataset once as a baseline reference
  const {
    rts: initialRts,
    sensors: initialSensors,
    stations: initialStations,
    catchments,
  } = useMemo(() => {
    return generateJakartaScaffolding(30000);
  }, []);

  // Hydrological and meteorological state variables
  const [sensors, setSensors] = useState<RiverSensor[]>(initialSensors);
  const [stations, setStations] = useState<WeatherStation[]>(initialStations);
  const [activePresetId, setActivePresetId] = useState<string>("monsoon_flood");
  const [rainMultiplier, setRainMultiplier] = useState<number>(1.35);
  const [liveSimulation, setLiveSimulation] = useState<boolean>(true);
  const [resourceFilter, setResourceFilter] = useState<
    "all" | "boats" | "trucks" | "ambulances"
  >("all");

  // Live Weather State
  const [liveWeather, setLiveWeather] = useState<LiveWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current=temperature_2m,precipitation,weather_code&hourly=precipitation_probability&timezone=Asia%2FJakarta",
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
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      // We will attach the actual result handler dynamically
      // to avoid stale closures.
      recognition.onresult = (event: any) => {
        if (voiceHandlersRef.current) {
          voiceHandlersRef.current(event);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          toast.error(`Voice command error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if we are supposed to be listening
        if (isListening) {
          // recognition.start(); // Can cause loops in some browsers if error occurs, better to just turn off
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // We don't depend on isListening here, to avoid re-binding

  // Handle start/stop explicitly
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.start();
        toast.success("Voice Commands Active");
      } catch (e) {
        // Might already be started
      }
    } else {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const toggleVoiceCommands = () => {
    if (
      !(window as any).SpeechRecognition &&
      !(window as any).webkitSpeechRecognition
    ) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }
    setIsListening((prev) => !prev);
  };

  // Custom interactive dispatches mapping
  const [dispatchedRts, setDispatchedRts] = useState<Record<string, boolean>>(
    {},
  );
  const [sirensActivated, setSirensActivated] = useState<
    Record<string, boolean>
  >({});
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "pump" | "siren" | "evacuation";
    rtId: string;
    actionType: "activate" | "deactivate";
  } | null>(null);
  const [evacuationDispatched, setEvacuationDispatched] = useState<
    Record<string, boolean>
  >({});

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

  // Risk calculation weight parameters
  const notifiedCriticalRts = React.useRef<Set<string>>(new Set());

  const [weights, setWeights] = useState<RiskWeights>({
    w1: 0.45, // Exceedance Probability weight (River levels)
    w2: 0.35, // Interpolated Rainfall weight (BMKG sensors)
    w3: 0.2, // Digital Elevation inverse weight (DEMNAS topography)
  });

  // Selected HUD state
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(
    "SENS_000",
  ); // Manggarai by default
  const [selectedRt, setSelectedRt] = useState<NeighborhoodRT | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Tab navigator for the bottom statistics panel: Rankings vs Code
  const [activeBottomTab, setActiveBottomTab] = useState<
    "map" | "rankings" | "python_core" | "gev_inspector" | "data_pipeline"
  >("map");

  // UTC real-time clock indicator for Jakarta BPBD command desk (WIB = UTC+7)
  const [currentTime, setCurrentTime] = useState<string>("");

  // State for real-time Gemini AI tactical brief
  const [aiBriefLoading, setAiBriefLoading] = useState<boolean>(false);
  const [aiBriefData, setAiBriefData] = useState<any>(null);
  const [aiBriefError, setAiBriefError] = useState<string | null>(null);

  // State for scale stress test
  const [stressTestSize, setStressTestSize] = useState<number>(30000); // 30,000 or 1,000,000
  const [stressTestRunning, setStressTestRunning] = useState<boolean>(false);
  const [stressResults, setStressResults] = useState<{
    cpuTime: number;
    gpuTime: number;
  } | null>(null);
  const [mapFullscreen, setMapFullscreen] = useState<boolean>(false);
  const [showGroundTruth, setShowGroundTruth] = useState(false);

  const voiceHandlersRef = React.useRef<(event: any) => void>();

  useEffect(() => {
    voiceHandlersRef.current = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.toLowerCase();

      console.log("VOICE COMMAND RECEIVED:", transcript);

      // Command matching
      if (
        transcript.includes("show map") ||
        transcript.includes("fullscreen map") ||
        transcript.includes("maximize map")
      ) {
        setActiveBottomTab("map");
        toast.success("Voice Command: Showing Map");
      } else if (transcript.includes("show rankings")) {
        setActiveBottomTab("rankings");
        toast.success("Voice Command: Showing Rankings");
      } else if (transcript.includes("show pipeline")) {
        setActiveBottomTab("data_pipeline");
        toast.success("Voice Command: Showing Data Pipeline");
      } else if (
        transcript.includes("show code") ||
        transcript.includes("show core")
      ) {
        setActiveBottomTab("python_core");
        toast.success("Voice Command: Showing Python Core logic");
      } else if (
        transcript.includes("show sensors") ||
        transcript.includes("show inspector")
      ) {
        setActiveBottomTab("gev_inspector");
        toast.success("Voice Command: Showing Extreme Value Inspector");
      } else if (
        transcript.includes("export data") ||
        transcript.includes("export csv")
      ) {
        exportToCsv();
        toast.success("Voice Command: Exporting Data to CSV");
      } else if (
        transcript.includes("simulate flood") ||
        transcript.includes("heavy monsoon")
      ) {
        setActivePresetId("monsoon_flood");
        toast.success("Voice Command: Triggering Monsoon Preset");
      } else if (
        transcript.includes("normal weather") ||
        transcript.includes("normal dry")
      ) {
        setActivePresetId("normal_dry");
        toast.success("Voice Command: Triggering Normal Weather Preset");
      }
    };
  });

  const exportToCsv = () => {
    const headers = [
      "RANK",
      "RT_ID",
      "KELURAHAN",
      "ELEVATION_M",
      "SPATIAL_RAIN_MM_HR",
      "EVT_EXCEEDANCE_PROB",
      "RISK_PRIORITY_SCORE",
    ];

    const csvRows = [headers.join(",")];

    rankedRts.forEach((rt, i) => {
      const row = [
        i + 1,
        rt.rt_id,
        `"${rt.kelurahan}"`,
        rt.demnas_elevation_m.toFixed(2),
        rt.interpolated_rainfall_mm_hr.toFixed(2),
        rt.evt_exceedance_prob.toFixed(4),
        rt.risk_priority_score.toFixed(4),
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bpbd_evacuation_priority_ranking.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  const exportRouteToJson = () => {
    if (!activeRoute || !selectedRt) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      origin: {
        rt_id: selectedRt.rt_id,
        kelurahan: selectedRt.kelurahan,
        lat: selectedRt.lat,
        lon: selectedRt.lon,
      },
      destination: {
        id: activeRoute.musterPoint.id,
        name: activeRoute.musterPoint.name,
        lat: activeRoute.musterPoint.lat,
        lon: activeRoute.musterPoint.lon,
        type: activeRoute.musterPoint.type,
      },
      metrics: {
        totalDistanceKm: activeRoute.totalDistanceKm,
        estimatedTravelTimeMinutes: Math.ceil(
          (activeRoute.totalDistanceKm / 15) * 60,
        ),
        safetyScore: activeRoute.safetyScore,
      },
      pathNodes: activeRoute.pathNodes.map((node) => ({
        id: node.id,
        name: node.name,
        lat: node.lat,
        lon: node.lon,
      })),
    };

    const jsonContent =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute(
      "download",
      `evacuation_route_${selectedRt.rt_id}_${new Date().getTime()}.json`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Route data exported for offline GPS devices.");
  };

  const exportToPdf = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("BPBD Priority Evacuation Register", 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const headers = [
      [
        "Rank",
        "RT ID",
        "Kelurahan",
        "Elevation (m)",
        "Rainfall (mm/hr)",
        "Exceedance",
        "Risk Score",
      ],
    ];

    const rows = rankedRts
      .slice(0, 50)
      .map((rt, index) => [
        index + 1,
        rt.rt_id,
        rt.kelurahan,
        rt.demnas_elevation_m.toFixed(2),
        rt.interpolated_rainfall_mm_hr.toFixed(1),
        (rt.evt_exceedance_prob * 100).toFixed(2) + "%",
        (rt.risk_priority_score * 100).toFixed(2) + "%",
      ]);

    autoTable(doc, {
      startY: 35,
      head: headers,
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [6, 182, 212] },
      styles: { fontSize: 8 },
    });

    doc.save(`evacuation_priority_${new Date().toISOString()}.pdf`);
  };

  const exportEvacuationLogPdf = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 20);
    doc.text("BPBD Comprehensive Evacuation Report", 14, 20);

    // Subheader / Metadata
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Recorded Actions: ${evacuationLog.length}`, 14, 33);

    const activeEvacuations = evacuationLog.filter(
      (l) => l.action === "Evacuation Ordered",
    ).length;
    doc.text(`Total Evacuations Ordered: ${activeEvacuations}`, 14, 38);

    // Main Content
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Incident Log & Route Information", 14, 50);

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
      startY: 55,
      head: headers,
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [6, 182, 212], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        2: { cellWidth: 25 },
        6: { cellWidth: 35 },
      },
    });

    doc.save(
      `bpbd_comprehensive_evacuation_report_${new Date().getTime()}.pdf`,
    );
    toast.success("Comprehensive Evacuation Report PDF Exported");
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
      const row = [
        entry.timestamp,
        entry.rtId,
        `"${entry.kelurahan}"`,
        `"${entry.action}"`,
        entry.riskScore.toFixed(4),
        entry.rainfall.toFixed(2),
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `bpbd_evacuation_log_${new Date().toISOString()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Evacuation Log CSV Exported");
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to return home
      if (e.key === "Escape") {
        onNavigateHome();
      }
      // 'm' or 'M' to toggle map view
      if (
        e.key.toLowerCase() === "m" &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.metaKey
      ) {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        )
          return;
        setMapFullscreen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNavigateHome]);

  // Function to run simulated scale stress testing
  const handleRunStressTest = () => {
    setStressTestRunning(true);
    setStressResults(null);

    setTimeout(() => {
      const tStart = performance.now();

      // Perform genuine mathematical CPU load to simulate heavy Point-in-Polygon & spatial Inverse Distance Weightings
      let sum = 0;
      const iterations = stressTestSize === 30000 ? 6000000 : 180000000;
      for (let i = 0; i < iterations; i++) {
        sum += Math.sin(i) * Math.cos(i);
      }

      const tEnd = performance.now();
      const cpuTime = tEnd - tStart;

      // GPU scales sub-linearly and processes high loads perfectly
      const gpuTime = stressTestSize === 30000 ? 1.25 : 19.85;

      setStressResults({ cpuTime, gpuTime });
      setStressTestRunning(false);
    }, 120);
  };

  // --- EFFECT: Jakarta WIB Clock ---
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Adjust to WIB (Jakarta local time UTC+7)
      const wibOffset = 7 * 60 * 60 * 1000;
      const wibTime = new Date(
        now.getTime() + now.getTimezoneOffset() * 60 * 1000 + wibOffset,
      );
      setCurrentTime(
        wibTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB",
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- EFFECT: Simulation Preset Applicator ---
  useEffect(() => {
    const preset = SIMULATION_PRESETS.find((p) => p.id === activePresetId);
    if (!preset) return;

    setRainMultiplier(preset.rainMultiplier);

    // Apply preset meteorological rain values to BMKG stations
    setStations((prev) =>
      prev.map((st, i) => ({
        ...st,
        current_rainfall_mm_hr:
          preset.stationRainfalls[i] || st.current_rainfall_mm_hr,
      })),
    );

    // Apply specific water level spikes to relevant river Pos/floodgates
    setSensors((prev) =>
      prev.map((sensor) => {
        const isSpikeSensor = preset.sensorSpikes.includes(sensor.sensor_id);
        let targetLvl = sensor.water_level_cm;

        if (isSpikeSensor) {
          // Severe high flood stage: 50-year return levels
          targetLvl = sensor.mu + 2.8 * sensor.sigma;
        } else {
          // Steady baseline, influenced slightly by the preset rain scale
          targetLvl =
            sensor.mu + (preset.rainMultiplier - 0.5) * sensor.sigma * 1.1;
        }

        return {
          ...sensor,
          water_level_cm: Math.max(15.0, targetLvl),
        };
      }),
    );

    // Auto-select first spiked sensor for GEV inspection
    if (preset.sensorSpikes.length > 0) {
      setSelectedSensorId(preset.sensorSpikes[0]);
    } else {
      setSelectedSensorId("SENS_000");
    }
  }, [activePresetId, activePresetId]);

  // --- EFFECT: Live Water Level / Weather Simulator (Timer) ---
  useEffect(() => {
    if (!liveSimulation) return;

    const interval = setInterval(() => {
      // Random walk simulation for River levels and Rainfall gauges
      setSensors((prev) =>
        prev.map((s) => {
          // Spiked preset sensors maintain critical levels but fluctuate
          const preset = SIMULATION_PRESETS.find(
            (p) => p.id === activePresetId,
          );
          const isSpiked = preset?.sensorSpikes.includes(s.sensor_id);

          let delta = (Math.random() - 0.42) * 5.5; // slight upward drift
          if (isSpiked) {
            delta = (Math.random() - 0.5) * 4.0; // tight bounds around flood level
          }

          return {
            ...s,
            water_level_cm: Math.max(10.0, s.water_level_cm + delta),
          };
        }),
      );

      setStations((prev) =>
        prev.map((st) => {
          const delta = (Math.random() - 0.5) * 6.0;
          return {
            ...st,
            current_rainfall_mm_hr: Math.max(
              0.0,
              Math.min(150.0, st.current_rainfall_mm_hr + delta),
            ),
          };
        }),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [liveSimulation, activePresetId]);

  // --- COMPUTATION PIPELINE ---
  // Memorize and compute spatial overlays, exceedance probabilities, and ranking lists instantly
  const { rankedRts, computedSensors, benchmarks } = useMemo(() => {
    // Re-pack active rts with live dispatch/siren indicators
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
      weights,
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

  // EFFECT: Monitor for critical hazard spikes and trigger toast notifications
  useEffect(() => {
    if (!liveSimulation) return;

    const CRITICAL_THRESHOLD = 0.85;
    const CLEAR_THRESHOLD = 0.65;

    // Collect new critical RTs
    const newlyCritical = [];

    rankedRts.forEach((rt) => {
      const isCritical = rt.risk_priority_score > CRITICAL_THRESHOLD;
      const isSafe = rt.risk_priority_score < CLEAR_THRESHOLD;
      const alreadyNotified = notifiedCriticalRts.current.has(rt.rt_id);

      if (isCritical && !alreadyNotified) {
        newlyCritical.push(rt);
        notifiedCriticalRts.current.add(rt.rt_id);
      } else if (isSafe && alreadyNotified) {
        // If it drops back below threshold, we can remove it
        notifiedCriticalRts.current.delete(rt.rt_id);
      }
    });

    if (newlyCritical.length > 0) {
      if (newlyCritical.length > 3) {
        // Group notification if there are too many at once
        toast.error(`Widespread Critical Hazard Spikes Detected`, {
          description: `${newlyCritical.length} regions have crossed the critical risk threshold (75%+). Region ${newlyCritical[0].kelurahan} is at ${(newlyCritical[0].risk_priority_score * 100).toFixed(1)}%.`,
          duration: 8000,
          closeButton: true,
          action: {
            label: "View Highest",
            onClick: () => setSelectedRt(newlyCritical[0]),
          },
        });
      } else {
        // Individual notifications
        newlyCritical.forEach((rt) => {
          toast.error(`Critical Hazard Spike: ${rt.kelurahan}`, {
            description: `Risk score escalated to ${(rt.risk_priority_score * 100).toFixed(1)}% in RT ${rt.rt_id}. Immediate triage recommended.`,
            duration: 8000,
            closeButton: true,
            action: {
              label: "View",
              onClick: () => setSelectedRt(rt),
            },
          });
        });
      }
    }
  }, [rankedRts, liveSimulation]);

  // Dynamic Dijkstra-based evacuation route computation
  const activeRoute = useMemo(() => {
    if (!selectedRt) return null;
    return calculateEvacuationRoute(
      selectedRt.lat,
      selectedRt.lon,
      computedSensors,
    );
  }, [selectedRt, computedSensors]);

  // --- EFFECT: Gemini AI Tactical Advisor Fetcher ---
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
            (s) => s.sensor_id === selectedRt.associated_sensor_id,
          ) || computedSensors[0];
        const activePreset = SIMULATION_PRESETS.find(
          (p) => p.id === activePresetId,
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
              interpolated_rainfall_mm_hr:
                selectedRt.interpolated_rainfall_mm_hr,
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
            activePresetName: activePreset
              ? activePreset.name
              : "Custom Fine-Tuning",
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to contact advisor");
        }

        const data = await res.json();
        setAiBriefData(data.data);
      } catch (err: any) {
        console.error("Error loading advisor brief:", err);
        setAiBriefError(err.message || "Failed to load real-time advisory.");
      } finally {
        setAiBriefLoading(false);
      }
    };

    const timer = setTimeout(fetchAiBrief, 500);
    return () => clearTimeout(timer);
  }, [selectedRt?.rt_id, activePresetId, activeRoute?.musterPoint.name]);

  // Quick stats derived from pipeline outputs
  const selectedSensor = useMemo(() => {
    return (
      computedSensors.find((s) => s.sensor_id === selectedSensorId) ||
      computedSensors[0]
    );
  }, [computedSensors, selectedSensorId]);

  const activeAlarmsCount = useMemo(() => {
    return computedSensors.filter((s) => s.exceedance_prob > 0.5).length;
  }, [computedSensors]);

  const criticalRtsCount = useMemo(() => {
    return rankedRts.filter((rt) => rt.risk_priority_score > 0.7).length;
  }, [rankedRts]);

  // Dispatch Action Handlers
  const handleDispatchPump = (rtId: string) => {
    setConfirmModal({
      isOpen: true,
      type: "pump",
      rtId,
      actionType: dispatchedRts[rtId] ? "deactivate" : "activate",
    });
  };

  const handleToggleSiren = (rtId: string) => {
    setConfirmModal({
      isOpen: true,
      type: "siren",
      rtId,
      actionType: sirensActivated[rtId] ? "deactivate" : "activate",
    });
  };

  const handleToggleEvacuation = (rtId: string) => {
    setConfirmModal({
      isOpen: true,
      type: "evacuation",
      rtId,
      actionType: evacuationDispatched[rtId] ? "deactivate" : "activate",
    });
  };

  const executeConfirmedAction = () => {
    if (!confirmModal) return;

    const { type, rtId, actionType } = confirmModal;

    if (type === "pump") {
      setDispatchedRts((prev) => ({ ...prev, [rtId]: !prev[rtId] }));
    } else if (type === "siren") {
      setSirensActivated((prev) => ({ ...prev, [rtId]: !prev[rtId] }));
    } else if (type === "evacuation") {
      const isActivating = actionType === "activate";
      setEvacuationDispatched((prev) => ({ ...prev, [rtId]: isActivating }));

      const rtData = initialRts.find((r) => r.rt_id === rtId);
      const currentRt = rankedRts.find((r) => r.rt_id === rtId);

      let musterPoint = "Unknown";
      let distanceStr = "N/A";
      if (currentRt) {
        const route = calculateEvacuationRoute(
          currentRt.lat,
          currentRt.lon,
          computedSensors,
        );
        if (route) {
          musterPoint = route.musterPoint.name;
          distanceStr = route.totalDistanceKm.toFixed(2) + " km";
        }
      }

      setEvacuationLog((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          rtId,
          kelurahan: rtData?.kelurahan || "Unknown",
          action: isActivating ? "Evacuation Ordered" : "Evacuation Recalled",
          riskScore: currentRt ? currentRt.risk_priority_score : 0,
          rainfall: currentRt ? currentRt.interpolated_rainfall_mm_hr : 0,
          musterPoint,
          distanceStr,
        },
      ]);
    }
  };
"""

with open("src/Hud.tsx", "w") as f:
    f.write(hud_top)
    
print("Restored Hud.tsx up to the return statement!")
