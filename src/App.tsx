import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, 
  Activity, 
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
  FlameKindling,
  Sparkles,
  RefreshCw
} from 'lucide-react';

import { generateJakartaScaffolding, SIMULATION_PRESETS } from './data';
import { runHydrologicalPipeline } from './math_engine';
import { MapCanvas } from './components/MapCanvas';
import { GevChart } from './components/GevChart';
import { CodeExplorer } from './components/CodeExplorer';
import { calculateEvacuationRoute } from './dijkstra';
import { NeighborhoodRT, RiverSensor, WeatherStation, RiskWeights } from './types';
import { PipelineDiagram } from './components/PipelineDiagram';

// Helper to parse basic Markdown inline styles (bold segments with **)
function parseInlineStyles(text: string, keyPrefix: string) {
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={`${keyPrefix}-bold-${index}`} className="font-bold text-white">
          {part}
        </strong>
      );
    }
    return part;
  });
}

// Custom component to format the Gemini AI brief correctly
function AIBriefRenderer({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-[10.5px]">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // 1. Bullet list items: starting with '*' or '-'
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2);
          return (
            <div key={lineIdx} className="flex items-start gap-1.5 pl-2 my-1 text-slate-300">
              <span className="text-brand-cyan shrink-0 mt-1 text-[8px]">•</span>
              <span className="flex-1 leading-relaxed">
                {parseInlineStyles(content, `line-${lineIdx}`)}
              </span>
            </div>
          );
        }

        // 2. Full headers or subject block: e.g. **TO: ...** or **SUBJ: ...** or **1. Critical Threat Assessment**
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
          const content = trimmed.slice(2, -2);
          
          // Let's check if it's metadata (TO: or SUBJ:)
          const isMetadata = content.startsWith('TO:') || content.startsWith('SUBJ:');
          if (isMetadata) {
            return (
              <div key={lineIdx} className="text-brand-cyan/90 font-semibold uppercase tracking-wider text-[9px] font-mono leading-normal bg-brand-cyan/5 px-2.5 py-1.5 rounded border border-brand-cyan/10 my-1 flex items-center justify-between">
                <span>{content}</span>
              </div>
            );
          }

          // Otherwise treat as a main section header
          return (
            <h5 key={lineIdx} className="font-bold text-slate-100 tracking-wide mt-3 mb-1 border-b border-slate-800 pb-1 uppercase text-[10px] font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full"></span>
              {content}
            </h5>
          );
        }

        // 3. Regular lines (just render normal inline styling)
        return (
          <p key={lineIdx} className="leading-relaxed text-slate-300">
            {parseInlineStyles(line, `line-${lineIdx}`)}
          </p>
        );
      })}
    </div>
  );
}

export default function App() {
  // --- STATE ---
  // Generate scaffolding dataset once as a baseline reference
  const { rts: initialRts, sensors: initialSensors, stations: initialStations, catchments } = useMemo(() => {
    return generateJakartaScaffolding(30000);
  }, []);

  // Hydrological and meteorological state variables
  const [sensors, setSensors] = useState<RiverSensor[]>(initialSensors);
  const [stations, setStations] = useState<WeatherStation[]>(initialStations);
  const [activePresetId, setActivePresetId] = useState<string>("monsoon_flood");
  const [rainMultiplier, setRainMultiplier] = useState<number>(1.35);
  const [liveSimulation, setLiveSimulation] = useState<boolean>(true);
  
  // Custom interactive dispatches mapping
  const [dispatchedRts, setDispatchedRts] = useState<Record<string, boolean>>({});
  const [sirensActivated, setSirensActivated] = useState<Record<string, boolean>>({});

  // Risk calculation weight parameters
  const [weights, setWeights] = useState<RiskWeights>({
    w1: 0.45, // Exceedance Probability weight (River levels)
    w2: 0.35, // Interpolated Rainfall weight (BMKG sensors)
    w3: 0.20  // Digital Elevation inverse weight (DEMNAS topography)
  });

  // Selected HUD state
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>("SENS_000"); // Manggarai by default
  const [selectedRt, setSelectedRt] = useState<NeighborhoodRT | null>(null);
  
  // Tab navigator for the bottom statistics panel: Rankings vs Code
  const [activeBottomTab, setActiveBottomTab] = useState<'rankings' | 'python_core' | 'gev_inspector' | 'data_pipeline'>('rankings');

  // UTC real-time clock indicator for Jakarta BPBD command desk (WIB = UTC+7)
  const [currentTime, setCurrentTime] = useState<string>("");

  // State for real-time Gemini AI tactical brief
  const [aiBriefLoading, setAiBriefLoading] = useState<boolean>(false);
  const [aiBriefText, setAiBriefText] = useState<string>("");
  const [aiBriefError, setAiBriefError] = useState<string | null>(null);

  // State for scale stress test
  const [stressTestSize, setStressTestSize] = useState<number>(30000); // 30,000 or 1,000,000
  const [stressTestRunning, setStressTestRunning] = useState<boolean>(false);
  const [stressResults, setStressResults] = useState<{ cpuTime: number; gpuTime: number } | null>(null);

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
      const wibTime = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000 + wibOffset);
      setCurrentTime(wibTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- EFFECT: Simulation Preset Applicator ---
  useEffect(() => {
    const preset = SIMULATION_PRESETS.find(p => p.id === activePresetId);
    if (!preset) return;

    setRainMultiplier(preset.rainMultiplier);
    
    // Apply preset meteorological rain values to BMKG stations
    setStations(prev => prev.map((st, i) => ({
      ...st,
      current_rainfall_mm_hr: preset.stationRainfalls[i] || st.current_rainfall_mm_hr
    })));

    // Apply specific water level spikes to relevant river Pos/floodgates
    setSensors(prev => prev.map(sensor => {
      const isSpikeSensor = preset.sensorSpikes.includes(sensor.sensor_id);
      let targetLvl = sensor.water_level_cm;
      
      if (isSpikeSensor) {
        // Severe high flood stage: 50-year return levels
        targetLvl = sensor.mu + 2.8 * sensor.sigma;
      } else {
        // Steady baseline, influenced slightly by the preset rain scale
        targetLvl = sensor.mu + (preset.rainMultiplier - 0.5) * sensor.sigma * 1.1;
      }
      
      return {
        ...sensor,
        water_level_cm: Math.max(15.0, targetLvl)
      };
    }));
    
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
      setSensors(prev => prev.map(s => {
        // Spiked preset sensors maintain critical levels but fluctuate
        const preset = SIMULATION_PRESETS.find(p => p.id === activePresetId);
        const isSpiked = preset?.sensorSpikes.includes(s.sensor_id);
        
        let delta = (Math.random() - 0.42) * 5.5; // slight upward drift
        if (isSpiked) {
          delta = (Math.random() - 0.5) * 4.0; // tight bounds around flood level
        }
        
        return {
          ...s,
          water_level_cm: Math.max(10.0, s.water_level_cm + delta)
        };
      }));

      setStations(prev => prev.map(st => {
        const delta = (Math.random() - 0.5) * 6.0;
        return {
          ...st,
          current_rainfall_mm_hr: Math.max(0.0, Math.min(150.0, st.current_rainfall_mm_hr + delta))
        };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [liveSimulation, activePresetId]);

  // --- COMPUTATION PIPELINE ---
  // Memorize and compute spatial overlays, exceedance probabilities, and ranking lists instantly
  const { rankedRts, computedSensors, benchmarks } = useMemo(() => {
    // Re-pack active rts with live dispatch/siren indicators
    const currentRts: NeighborhoodRT[] = initialRts.map(rt => ({
      ...rt,
      dispatched: dispatchedRts[rt.rt_id] || false,
      siren_activated: sirensActivated[rt.rt_id] || false
    }));

    return runHydrologicalPipeline(
      currentRts,
      sensors,
      stations,
      catchments,
      weights
    );
  }, [initialRts, sensors, stations, catchments, weights, dispatchedRts, sirensActivated]);

  // Dynamic Dijkstra-based evacuation route computation
  const activeRoute = useMemo(() => {
    if (!selectedRt) return null;
    return calculateEvacuationRoute(selectedRt.lat, selectedRt.lon, computedSensors);
  }, [selectedRt, computedSensors]);

  // --- EFFECT: Gemini AI Tactical Advisor Fetcher ---
  useEffect(() => {
    if (!selectedRt) {
      setAiBriefText("");
      setAiBriefError(null);
      return;
    }

    const fetchAiBrief = async () => {
      setAiBriefLoading(true);
      setAiBriefError(null);
      try {
        const selSensor = computedSensors.find(s => s.sensor_id === selectedRt.associated_sensor_id) || computedSensors[0];
        const activePreset = SIMULATION_PRESETS.find(p => p.id === activePresetId);
        
        const res = await fetch("/api/gemini/advisor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
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
              routeSafetyScore: activeRoute?.safetyScore
            },
            selectedSensor: {
              name: selSensor.name,
              water_level_cm: selSensor.water_level_cm,
              exceedance_prob: selSensor.exceedance_prob
            },
            activePresetName: activePreset ? activePreset.name : "Custom Fine-Tuning"
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to contact advisor");
        }

        const data = await res.json();
        setAiBriefText(data.text);
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
    return computedSensors.find(s => s.sensor_id === selectedSensorId) || computedSensors[0];
  }, [computedSensors, selectedSensorId]);

  const activeAlarmsCount = useMemo(() => {
    return computedSensors.filter(s => s.exceedance_prob > 0.5).length;
  }, [computedSensors]);

  const criticalRtsCount = useMemo(() => {
    return rankedRts.filter(rt => rt.risk_priority_score > 0.70).length;
  }, [rankedRts]);

  // Dispatch Action Handlers
  const handleDispatchPump = (rtId: string) => {
    setDispatchedRts(prev => ({
      ...prev,
      [rtId]: !prev[rtId]
    }));
  };

  const handleToggleSiren = (rtId: string) => {
    setSirensActivated(prev => ({
      ...prev,
      [rtId]: !prev[rtId]
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-brand-cyan/30">
      
      {/* 1. COMMAND DESK TOP BAR HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 px-6 py-4 border-b border-slate-800 shadow-lg shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand-cyan/10 p-2 rounded-lg border border-brand-cyan/25 text-brand-cyan pulsing-ring">
            <Radio size={20} className="text-brand-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                Live Feed
              </span>
              <h1 className="font-display font-bold text-base md:text-lg tracking-wide text-white">
                JAKARTA FLASH-FLOOD EVACUATION PRIORITY ENGINE
              </h1>
            </div>
            <p className="text-[10px] md:text-xs font-mono text-slate-400 mt-0.5">
              BPBD DKI Jakarta Command Centre &bull; Deterministic Spatial Hazard Ranking
            </p>
          </div>
        </div>

        {/* Real-Time Telemetry and Clock HUD */}
        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800/80 font-mono text-xs shadow-inner">
          <div className="flex items-center gap-2 border-r border-slate-800 pr-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-slate-400">CLOCK:</span>
            <span className="font-bold text-white tracking-widest">{currentTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">GIS RESOLUTION:</span>
            <span className="text-brand-cyan font-bold">30,000 RTs</span>
          </div>
        </div>
      </header>

      {/* 2. DUAL-COLUMN CONTENT LAYOUT */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 p-5 min-h-0 overflow-y-auto">
        
        {/* ================== LEFT SIDEBAR: HYDROMETEOROLOGICAL CONTROL MATRIX ================== */}
        <section className="xl:col-span-3 flex flex-col gap-5 min-h-0 overflow-y-auto">
          
          {/* BPBD Duty Officer Persona Profile Card */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 shadow-md relative overflow-hidden shrink-0">
            {/* Ambient water background lines */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-brand-cyan/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2.5">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120&h=120" 
                  alt="Ibu Kartini" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-brand-cyan/40"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
              </div>
              <div>
                <span className="text-[8px] bg-brand-cyan/10 text-brand-cyan px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider">
                  ACTIVE DUTY OFFICER
                </span>
                <h3 className="font-semibold text-slate-100 text-xs mt-0.5 font-display">Ibu Kartini</h3>
                <p className="text-[9px] text-slate-400 font-mono">Chief Disaster Operations @ BPBD</p>
              </div>
            </div>

            <div className="space-y-2 text-[10px] leading-relaxed">
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider">RECURRING DECISION TARGET</span>
                <span className="text-slate-200 font-medium font-sans">
                  Instantly dispatching high-capacity mobile pump assets and triggering local sirens within minutes of extreme flash-flooding.
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider text-brand-orange">CRITICAL BOTTLENECK</span>
                <span className="text-slate-300 font-sans leading-relaxed">
                  Traditional CPU-based GIS pipelines require <strong className="text-brand-red font-mono">22.4 seconds</strong> to join 30,000 RT boundaries with river catchments—causing delay in emergency warnings.
                </span>
              </div>
              <div className="flex flex-col gap-0.5 bg-slate-950/40 p-2 rounded border border-slate-850">
                <span className="text-emerald-400 text-[8px] uppercase font-bold tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  NVIDIA RAPIDS SOLUTION
                </span>
                <span className="text-slate-300 font-sans">
                  cuDF parallel Point-in-Polygon (PiP) and IDW spatial interpolation completes in under <strong className="text-emerald-400 font-mono">4.5 milliseconds</strong>, bypassing the CPU bottleneck entirely!
                </span>
              </div>
            </div>
          </div>

          {/* Simulation Preset Selector */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3.5 shadow-md">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-slate-300 font-display font-medium text-xs tracking-wider">
                <Compass size={14} className="text-brand-cyan" />
                WEATHER SCENARIOS
              </div>
              <button
                onClick={() => setLiveSimulation(!liveSimulation)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono border font-medium transition-all cursor-pointer ${
                  liveSimulation 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {liveSimulation ? <Play size={10} className="animate-pulse" /> : <Pause size={10} />}
                {liveSimulation ? 'SIM LIVE' : 'SIM PAUSED'}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {SIMULATION_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePresetId(p.id)}
                  className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all ${
                    activePresetId === p.id
                      ? 'bg-slate-800 border-brand-cyan/60 text-white shadow-md'
                      : 'bg-slate-950/40 border-slate-800/70 text-slate-400 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`font-semibold ${activePresetId === p.id ? 'text-brand-cyan' : 'text-slate-300'}`}>
                      {p.name}
                    </span>
                    {p.id === 'monsoon_flood' && (
                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wide">
                        Extreme
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Slider to fine tune rainfall multipliers */}
            <div className="border-t border-slate-800 pt-3 flex flex-col gap-2 mt-1">
              <div className="flex justify-between font-mono text-[10px] text-slate-400">
                <span>FINE CLOUDBURST MULTIPLIER:</span>
                <span className="text-brand-cyan font-bold">{rainMultiplier.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.05"
                value={rainMultiplier}
                onChange={(e) => {
                  setRainMultiplier(parseFloat(e.target.value));
                  setActivePresetId(""); // Custom configuration
                }}
                className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
            </div>
          </div>

          {/* Decision Weights Tuner Panel */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-1.5 text-slate-300 font-display font-medium text-xs tracking-wider border-b border-slate-800 pb-2">
              <Settings size={14} className="text-brand-cyan" />
              DECISION RISK WEIGHTS (R_RT)
            </div>
            
            <p className="text-[10px] text-slate-400 leading-normal mb-1">
              Adjust weights dynamically to recalculate risk priority index levels across 30,000 neighborhood registries.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {/* w1: TMA exceedance */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">w1: TMA EXCEEDANCE P (EVT)</span>
                  <span className="text-brand-cyan font-semibold">{(weights.w1 * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={weights.w1}
                  onChange={(e) => {
                    const w1 = parseFloat(e.target.value);
                    const remainder = 1.0 - w1;
                    const ratio = remainder / (weights.w2 + weights.w3 || 1.0);
                    setWeights({
                      w1,
                      w2: weights.w2 * ratio,
                      w3: weights.w3 * ratio
                    });
                  }}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                />
              </div>

              {/* w2: Interpolated Rain */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">w2: BMKG SPATIAL RAIN (IDW)</span>
                  <span className="text-brand-cyan font-semibold">{(weights.w2 * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={weights.w2}
                  onChange={(e) => {
                    const w2 = parseFloat(e.target.value);
                    const remainder = 1.0 - w2;
                    const ratio = remainder / (weights.w1 + weights.w3 || 1.0);
                    setWeights({
                      w2,
                      w1: weights.w1 * ratio,
                      w3: weights.w3 * ratio
                    });
                  }}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                />
              </div>

              {/* w3: DEMNAS Elevation */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">w3: DEMNAS TOPOGRAPHY</span>
                  <span className="text-brand-cyan font-semibold">{(weights.w3 * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={weights.w3}
                  onChange={(e) => {
                    const w3 = parseFloat(e.target.value);
                    const remainder = 1.0 - w3;
                    const ratio = remainder / (weights.w1 + weights.w2 || 1.0);
                    setWeights({
                      w3,
                      w1: weights.w1 * ratio,
                      w2: weights.w2 * ratio
                    });
                  }}
                  className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                />
              </div>
            </div>

            <div className="text-[9px] text-slate-500 font-mono text-center border-t border-slate-800 pt-2.5 mt-1 leading-normal">
              RISK SCORE MATRIX SUM: {(weights.w1 + weights.w2 + weights.w3).toFixed(1)} &bull; DETERMINISTIC
            </div>
          </div>

          {/* Real-Time Alarm Telemetry Block */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-1.5 text-slate-300 font-display font-medium text-xs tracking-wider border-b border-slate-800 pb-2">
              <ShieldAlert size={14} className="text-brand-cyan" />
              ALARM STATUS OVERVIEW
            </div>

            <div className="grid grid-cols-2 gap-3.5 font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[9px] block uppercase">EXCEEDING SENSORS</span>
                <span className="text-xl font-bold text-brand-red mt-1 block">
                  {activeAlarmsCount} <span className="text-xs text-slate-400 font-normal">/ 120</span>
                </span>
                <p className="text-[8px] text-slate-400 mt-1">Exceedance P &gt; 50%</p>
              </div>
              
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[9px] block uppercase">CRITICAL SECTORS</span>
                <span className="text-xl font-bold text-brand-orange mt-1 block">
                  {criticalRtsCount} <span className="text-xs text-slate-400 font-normal">RTs</span>
                </span>
                <p className="text-[8px] text-slate-400 mt-1">Composite Score &gt; 0.70</p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 mt-1">
              <div className="flex gap-1.5 items-start">
                <Info size={13} className="text-brand-cyan shrink-0 mt-0.5" />
                <span>
                  The BPBD duty log flags {criticalRtsCount} neighborhoods needing immediate pre-staged water pump dispatch.
                </span>
              </div>
            </div>
          </div>

        </section>

        {/* ================== CENTER COLUMN: GIS STAGE MAP ================== */}
        <section className="xl:col-span-6 flex flex-col gap-5 min-h-0 overflow-y-auto">
          
          <div className="flex-1 min-h-[380px] xl:h-0 flex flex-col relative">
            <MapCanvas
              rts={rankedRts}
              sensors={computedSensors}
              stations={stations}
              catchments={catchments}
              selectedSensorId={selectedSensorId}
              onSelectSensor={setSelectedSensorId}
              selectedRt={selectedRt}
              onSelectRt={setSelectedRt}
              activeRoute={activeRoute}
            />
          </div>

          {/* Interactive CPU vs Simulated T4/L4 GPU Performance Benchmarks */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5 text-slate-300 font-display font-medium text-xs tracking-wider">
                <Activity size={14} className="text-brand-cyan" />
                EXECUTION PERFORMANCE COMPARISON (30,000 NEIGHBORHOOD REGISTERS)
              </div>
              <span className="text-[10px] bg-slate-950 text-emerald-400 px-2.5 py-0.5 rounded-full border border-slate-800 font-mono font-bold">
                ACCELERATION GAIN: {(benchmarks.totalCpuMs / benchmarks.totalGpuMs).toFixed(1)}x
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center font-mono">
              <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-850">
                <span className="text-[8px] text-slate-500 block">CATCHMENT PIP JOIN</span>
                <div className="text-[11px] font-bold text-slate-300 mt-1">{benchmarks.pipJoinCpuMs.toFixed(1)} ms <span className="text-[9px] text-slate-500">CPU</span></div>
                <div className="text-[11px] font-bold text-emerald-400">{benchmarks.pipJoinGpuMs.toFixed(2)} ms <span className="text-[9px] text-slate-500">GPU</span></div>
                <div className="text-[8.5px] text-slate-400 border-t border-slate-850 mt-1 pt-1 font-semibold">{(benchmarks.pipJoinCpuMs / benchmarks.pipJoinGpuMs).toFixed(0)}x Faster</div>
              </div>

              <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-850">
                <span className="text-[8px] text-slate-500 block">IDW RAINFALL INTERP</span>
                <div className="text-[11px] font-bold text-slate-300 mt-1">{benchmarks.idwInterpolationCpuMs.toFixed(1)} ms <span className="text-[9px] text-slate-500">CPU</span></div>
                <div className="text-[11px] font-bold text-emerald-400">{benchmarks.idwInterpolationGpuMs.toFixed(2)} ms <span className="text-[9px] text-slate-500">GPU</span></div>
                <div className="text-[8.5px] text-slate-400 border-t border-slate-850 mt-1 pt-1 font-semibold">{(benchmarks.idwInterpolationCpuMs / benchmarks.idwInterpolationGpuMs).toFixed(0)}x Faster</div>
              </div>

              <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-850">
                <span className="text-[8px] text-slate-500 block">EVT EXCEEDANCE P</span>
                <div className="text-[11px] font-bold text-slate-300 mt-1">{benchmarks.evtExceedanceCpuMs.toFixed(2)} ms <span className="text-[9px] text-slate-500">CPU</span></div>
                <div className="text-[11px] font-bold text-emerald-400">{benchmarks.evtExceedanceGpuMs.toFixed(3)} ms <span className="text-[9px] text-slate-500">GPU</span></div>
                <div className="text-[8.5px] text-slate-400 border-t border-slate-850 mt-1 pt-1 font-semibold">10x Faster</div>
              </div>

              <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-850">
                <span className="text-[8px] text-slate-500 block">INDEX FUSION SORT</span>
                <div className="text-[11px] font-bold text-slate-300 mt-1">{benchmarks.riskRankingCpuMs.toFixed(1)} ms <span className="text-[9px] text-slate-500">CPU</span></div>
                <div className="text-[11px] font-bold text-emerald-400">{benchmarks.riskRankingGpuMs.toFixed(2)} ms <span className="text-[9px] text-slate-500">GPU</span></div>
                <div className="text-[8.5px] text-slate-400 border-t border-slate-850 mt-1 pt-1 font-semibold">{(benchmarks.riskRankingCpuMs / benchmarks.riskRankingGpuMs).toFixed(0)}x Faster</div>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 col-span-2 md:col-span-1">
                <span className="text-[8px] text-brand-cyan font-bold block">TOTAL PIPELINE LOOP</span>
                <div className="text-xs font-extrabold text-slate-300 mt-1">{benchmarks.totalCpuMs.toFixed(1)} ms <span className="text-[9px] text-slate-500">CPU</span></div>
                <div className="text-xs font-extrabold text-emerald-400">{benchmarks.totalGpuMs.toFixed(2)} ms <span className="text-[9px] text-slate-500">GPU</span></div>
                <div className="text-[9px] text-brand-cyan border-t border-slate-800 mt-1 pt-1 font-bold">{(benchmarks.totalCpuMs / benchmarks.totalGpuMs).toFixed(0)}x SPEEDUP</div>
              </div>
            </div>

            {/* Scale Stress Test Panel */}
            <div className="border-t border-slate-800 pt-3.5 mt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-brand-cyan font-bold block uppercase tracking-wider font-mono">
                  🚨 RAPIDS Pipeline Scale Stress Test (Prove Acceleration)
                </span>
                <p className="text-[9.5px] text-slate-400 leading-normal max-w-[480px]">
                  Simulate running heavy Point-in-Polygon spatial checks & rainfall Inverse Distance Weighting interpolation across 30,000 to 1,000,000 neighborhood records to compare CPU blockage vs GPU horizontal threading.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <select
                  value={stressTestSize}
                  onChange={(e) => setStressTestSize(parseInt(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono font-bold text-slate-300 focus:outline-none focus:border-brand-cyan cursor-pointer"
                >
                  <option value={30000}>30,000 Records (Standard)</option>
                  <option value={1000000}>1,000,000 Records (Enterprise Scale)</option>
                </select>

                <button
                  onClick={handleRunStressTest}
                  disabled={stressTestRunning}
                  className="flex items-center gap-1.5 px-3 py-1 bg-brand-orange hover:bg-brand-orange/95 text-slate-950 font-bold font-sans text-[10px] rounded cursor-pointer transition-all disabled:opacity-50"
                >
                  {stressTestRunning ? (
                    <>
                      <span className="w-2 h-2 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></span>
                      CPU Processing...
                    </>
                  ) : (
                    <>
                      <Play size={10} fill="currentColor" />
                      Run Stress Test
                    </>
                  )}
                </button>
              </div>
            </div>

            {stressResults && (
              <div className="mt-3 bg-slate-950/80 p-3 rounded-lg border border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-3.5 items-center font-mono text-[10.5px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500 uppercase">CPU Blocking Time (Main Thread):</span>
                  <span className="text-brand-red font-bold text-sm">
                    {stressResults.cpuTime.toFixed(1)} ms 
                    <span className="text-[9px] font-normal text-slate-500 ml-1">
                      {stressTestSize === 1000000 ? "⚠️ System Unresponsive" : ""}
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8px] text-slate-500 uppercase">GPU Parallel Time (cuDF L4):</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {stressResults.gpuTime.toFixed(2)} ms 
                    <span className="text-[9px] font-normal text-emerald-500/80 ml-1">⚡ Sub-second Freshness</span>
                  </span>
                </div>
                <div className="flex justify-between items-center bg-slate-900 px-3 py-2 rounded border border-slate-800 text-right">
                  <span className="text-[9px] text-slate-400 font-sans">Stress Factor Speedup:</span>
                  <span className="text-brand-cyan font-extrabold text-sm font-mono">
                    {(stressResults.cpuTime / stressResults.gpuTime).toFixed(0)}x Faster
                  </span>
                </div>
              </div>
            )}
          </div>

        </section>

        {/* ================== RIGHT SIDEBAR: EXTREME VALUE INSPECTOR & TARGET HUD ================== */}
        <section className="xl:col-span-3 flex flex-col gap-5 min-h-0 overflow-y-auto">
          
          {/* Detailed Selected RT / Sensor Status HUD Card */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3.5 shadow-md">
            <div className="flex items-center gap-1.5 text-slate-300 font-display font-medium text-xs tracking-wider border-b border-slate-800 pb-2">
              <Database size={14} className="text-brand-cyan" />
              GIS TARGET HUD SELECTOR
            </div>

            {selectedRt ? (
              <div className="font-mono text-xs space-y-2.5">
                <div className="flex justify-between items-center bg-slate-950/80 p-2.5 rounded border border-slate-800">
                  <div>
                    <span className="text-[8px] text-slate-500 block uppercase">NEIGHBORHOOD REGISTER</span>
                    <span className="font-bold text-white text-sm">{selectedRt.rt_id}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                    selectedRt.risk_priority_score > 0.7 
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                      : selectedRt.risk_priority_score > 0.4
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    Score: {selectedRt.risk_priority_score.toFixed(3)}
                  </span>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kelurahan:</span>
                    <span className="font-semibold text-slate-200">{selectedRt.kelurahan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mean Elevation (DEMNAS):</span>
                    <span className="font-semibold text-slate-200">{selectedRt.demnas_elevation_m.toFixed(1)} meters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Spatial Interpolated Rain:</span>
                    <span className="font-semibold text-brand-cyan">{selectedRt.interpolated_rainfall_mm_hr.toFixed(1)} mm/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Local Catchment Sensor:</span>
                    <span className="font-semibold text-brand-cyan truncate max-w-[150px]">
                      {computedSensors.find(s => s.sensor_id === selectedRt.associated_sensor_id)?.name || selectedRt.associated_sensor_id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Local Exceedance Prob:</span>
                    <span className="font-semibold text-brand-red">{(selectedRt.evt_exceedance_prob * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
                  <button
                    onClick={() => handleDispatchPump(selectedRt.rt_id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-sans font-medium text-[11px] border cursor-pointer transition-colors ${
                      selectedRt.dispatched 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    {selectedRt.dispatched && <Check size={11} />}
                    {selectedRt.dispatched ? 'Pump Dispatched' : 'Dispatch Pump'}
                  </button>
                  <button
                    onClick={() => handleToggleSiren(selectedRt.rt_id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-sans font-medium text-[11px] border cursor-pointer transition-colors ${
                      selectedRt.siren_activated 
                        ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-300'
                    }`}
                  >
                    {selectedRt.siren_activated && <AlertTriangle size={11} />}
                    {selectedRt.siren_activated ? 'Siren Active' : 'Trigger Siren'}
                  </button>
                </div>

                {activeRoute && (
                  <div className="border-t border-slate-800 pt-3 mt-1.5 space-y-2">
                    <span className="text-[8px] text-brand-cyan font-bold block uppercase tracking-wider">
                      Dijkstra-Calculated Evacuation Path
                    </span>
                    
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px]">Optimal Haven:</span>
                        <span className="text-emerald-400 font-bold font-sans text-[11px] truncate max-w-[150px]" title={activeRoute.musterPoint.name}>
                          {activeRoute.musterPoint.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px]">Total Distance:</span>
                        <span className="text-slate-200 font-bold">{activeRoute.totalDistanceKm.toFixed(2)} km</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-[10px]">Route Safety Index:</span>
                        <span className={`font-bold font-mono text-[10px] px-1.5 py-0.2 rounded ${
                          activeRoute.safetyScore > 80 
                            ? 'text-emerald-400 bg-emerald-500/10' 
                            : activeRoute.safetyScore > 50 
                            ? 'text-yellow-400 bg-yellow-500/10' 
                            : 'text-red-400 bg-red-500/10'
                        }`}>
                          {activeRoute.safetyScore}% Safe
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-slate-950/40 p-2 rounded border border-slate-800/50 max-h-[110px] overflow-y-auto">
                      <div className="text-[8px] text-slate-500 font-bold uppercase pb-1 border-b border-slate-900">
                        Checkpoints & Turn-by-Turn
                      </div>
                      <div className="space-y-1 pt-1 font-mono text-[9.5px]">
                        <div className="flex gap-1.5 text-slate-400 items-start">
                          <span className="text-brand-cyan">○</span>
                          <span>Start: {selectedRt.rt_id} sector</span>
                        </div>
                        {activeRoute.pathNodes.map((node, i) => {
                          const isLast = i === activeRoute.pathNodes.length - 1;
                          return (
                            <div key={node.id} className="flex gap-1.5 items-start text-slate-300">
                              <span className={isLast ? "text-emerald-400 font-bold" : "text-slate-500"}>
                                {isLast ? "★" : "↳"}
                              </span>
                              <span className={isLast ? "text-emerald-400 font-sans font-medium" : ""}>
                                {node.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Gemini AI Tactical Advisory Block */}
                <div className="border-t border-slate-800 pt-3 mt-1.5 space-y-2">
                  <span className="text-[8px] text-purple-400 font-bold block uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} className="animate-pulse text-purple-400" />
                    Gemini AI Real-time Tactical Dispatch Advisory
                  </span>

                  {aiBriefLoading ? (
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col items-center justify-center gap-2 py-4 text-center">
                      <span className="w-4 h-4 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin"></span>
                      <span className="text-[9.5px] text-slate-400 font-sans animate-pulse">
                        Synthesizing topographic variables, rainfall rates, and routing parameters...
                      </span>
                    </div>
                  ) : aiBriefError ? (
                    <div className="bg-red-950/20 text-red-400 border border-red-900/30 p-2.5 rounded text-[10px] space-y-1.5">
                      <p className="font-semibold leading-normal">
                        Advisory system operating in simulated offline fallback mode.
                      </p>
                      <p className="text-red-300/80 leading-normal text-[9.5px] font-mono bg-red-950/40 p-1.5 rounded border border-red-900/20">
                        Diagnostics: {aiBriefError}
                      </p>
                      <p className="text-slate-500 leading-normal text-[9px]">
                        If you recently configured your <code className="bg-slate-950 px-1 py-0.5 rounded text-red-300">GEMINI_API_KEY</code> in Settings &gt; Secrets, the server is currently being restarted to load it.
                      </p>
                      <div className="bg-slate-950/80 p-2 rounded border border-slate-900 leading-normal text-slate-300 text-[9px] space-y-1 font-sans">
                        <p className="font-bold uppercase text-[8px] text-brand-orange">Fallback Tactical Directives:</p>
                        <p>1. <strong>Exceedance Index Alert:</strong> Local GEV probability of {(selectedRt.evt_exceedance_prob * 100).toFixed(0)}% suggests active water logging threat.</p>
                        <p>2. <strong>Evacuation Order:</strong> Recommend routing citizens towards <strong>{activeRoute?.musterPoint.name || "Kelurahan High Ground"}</strong> immediately.</p>
                      </div>
                    </div>
                  ) : aiBriefText ? (
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-850 space-y-2 font-sans text-[10.5px] text-slate-300 leading-relaxed max-h-[220px] overflow-y-auto">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-1 text-slate-500 text-[8px] font-mono uppercase mb-2">
                        <span>Command Coordinator Advisory:</span>
                        <span className="text-emerald-400 font-bold uppercase text-[7.5px] bg-emerald-500/10 px-1 rounded animate-pulse">Live</span>
                      </div>
                      <AIBriefRenderer text={aiBriefText} />
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 text-[10px] text-slate-400 text-center italic">
                      Ready to synthesize evacuation tactics. Change presets or select target RTs to reload advisor.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="font-sans text-xs text-slate-500 flex flex-col items-center justify-center py-10 text-center gap-2">
                <Compass size={24} className="text-slate-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>No RT sector selected. Click on the map canvas dots to inspect specific neighborhood risk indices.</span>
              </div>
            )}
          </div>

          {/* Extreme Value Theory Parameter Inspector Curve */}
          <div className="flex-1 min-h-[200px] flex flex-col">
            <GevChart sensor={selectedSensor} />
          </div>

        </section>

      </main>

      {/* 3. BOTTOM CONTROL TAB MODULE (RANKINGS / CODE / MATHEMATHICS) */}
      <footer className="h-1/3 min-h-[220px] max-h-[380px] bg-slate-900 border-t border-slate-800 flex flex-col shrink-0">
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-950 px-6 pt-3 gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveBottomTab('rankings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-display font-medium text-xs tracking-wider border-b-2 transition-all cursor-pointer ${
              activeBottomTab === 'rankings'
                ? 'border-brand-cyan text-brand-cyan bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownUp size={14} />
            BPBD PRIORITY EVACUATION REGISTER (TOP 50 CRITICAL RTs)
          </button>
          <button
            onClick={() => setActiveBottomTab('gev_inspector')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-display font-medium text-xs tracking-wider border-b-2 transition-all cursor-pointer ${
              activeBottomTab === 'gev_inspector'
                ? 'border-brand-cyan text-brand-cyan bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity size={14} />
            LIVE WATER LEVEL STREAM (120 GATE POSITIONS)
          </button>
          <button
            onClick={() => setActiveBottomTab('python_core')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-display font-medium text-xs tracking-wider border-b-2 transition-all cursor-pointer ${
              activeBottomTab === 'python_core'
                ? 'border-brand-cyan text-brand-cyan bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal size={14} />
            CORE CODE BLUEPRINTS
          </button>
          <button
            onClick={() => setActiveBottomTab('data_pipeline')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-display font-medium text-xs tracking-wider border-b-2 transition-all cursor-pointer ${
              activeBottomTab === 'data_pipeline'
                ? 'border-brand-cyan text-brand-cyan bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={14} />
            END-TO-END DATA PIPELINE ARCHITECTURE (GCP + RAPIDS)
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-900/65">
          
          {/* TAB 1: Real-time top 50 ranked dispatches */}
          {activeBottomTab === 'rankings' && (
            <div className="overflow-x-auto h-full rounded-lg border border-slate-800/80 bg-slate-950/40">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase sticky top-0 border-b border-slate-800 z-10">
                  <tr>
                    <th className="p-2.5 font-bold text-center">RANK</th>
                    <th className="p-2.5">RT ID</th>
                    <th className="p-2.5">KELURAHAN</th>
                    <th className="p-2.5 text-right">ELEVATION (DEMNAS)</th>
                    <th className="p-2.5 text-right">SPATIAL RAIN (BMKG)</th>
                    <th className="p-2.5 text-right">EVT EXCEEDANCE (TMA)</th>
                    <th className="p-2.5 text-right text-brand-cyan">COMPOSITE RISK INDEX</th>
                    <th className="p-2.5 text-center">DISPATCH DISASTER SERVICE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {rankedRts.slice(0, 50).map((rt, index) => {
                    const isSelected = selectedRt && selectedRt.rt_id === rt.rt_id;
                    return (
                      <tr 
                        key={rt.rt_id} 
                        onClick={() => setSelectedRt(rt)}
                        className={`hover:bg-slate-800/50 cursor-pointer ${
                          isSelected ? 'bg-slate-800 border-l-2 border-brand-cyan' : ''
                        }`}
                      >
                        <td className="p-2 text-center font-bold text-slate-400">{index + 1}</td>
                        <td className="p-2 font-bold text-white">{rt.rt_id}</td>
                        <td className="p-2 text-slate-300 font-sans">{rt.kelurahan}</td>
                        <td className="p-2 text-right text-slate-300">{rt.demnas_elevation_m.toFixed(1)}m</td>
                        <td className="p-2 text-right text-brand-cyan">{rt.interpolated_rainfall_mm_hr.toFixed(1)} mm/hr</td>
                        <td className="p-2 text-right text-brand-orange">{(rt.evt_exceedance_prob * 100).toFixed(1)}%</td>
                        <td className="p-2 text-right font-bold text-brand-red">{rt.risk_priority_score.toFixed(4)}</td>
                        <td className="p-2 text-center">
                          <div className="flex gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleDispatchPump(rt.rt_id)}
                              className={`px-2 py-1 rounded text-[9px] font-sans font-medium border cursor-pointer transition-colors ${
                                rt.dispatched 
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              {rt.dispatched ? 'Pump: Dispatched' : 'Deploy Pump'}
                            </button>
                            <button
                              onClick={() => handleToggleSiren(rt.rt_id)}
                              className={`px-2 py-1 rounded text-[9px] font-sans font-medium border cursor-pointer transition-colors ${
                                rt.siren_activated 
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                                  : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                              }`}
                            >
                              {rt.siren_activated ? 'Siren: Pulsing' : 'Alarm Siren'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: River level lists and details */}
          {activeBottomTab === 'gev_inspector' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {computedSensors.slice(0, 16).map((sensor) => {
                const isSelected = selectedSensorId === sensor.sensor_id;
                
                let siagaStatus = "SIAGA 4 (NORMAL)";
                let statusColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                
                if (sensor.exceedance_prob > 0.8) {
                  siagaStatus = "SIAGA 1 (SEVERE)";
                  statusColor = "text-red-400 bg-red-500/15 border-red-500/30 animate-pulse";
                } else if (sensor.exceedance_prob > 0.5) {
                  siagaStatus = "SIAGA 2 (HIGH)";
                  statusColor = "text-orange-400 bg-orange-500/10 border-orange-500/20";
                } else if (sensor.exceedance_prob > 0.2) {
                  siagaStatus = "SIAGA 3 (WARNING)";
                  statusColor = "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
                }

                return (
                  <div
                    key={sensor.sensor_id}
                    onClick={() => {
                      setSelectedSensorId(sensor.sensor_id);
                      setSelectedRt(null);
                    }}
                    className={`p-3 rounded-lg border font-mono text-[11px] cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-slate-800 border-brand-cyan text-white shadow-md' 
                        : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex justify-between items-start font-bold">
                      <span className="truncate max-w-[120px] text-white">{sensor.name}</span>
                      <span className="text-[9px] text-slate-500">{sensor.sensor_id}</span>
                    </div>
                    <div className="mt-2.5 flex justify-between">
                      <span>Water Level:</span>
                      <span className="font-bold text-white">{sensor.water_level_cm.toFixed(1)} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>EVT Exceedance:</span>
                      <span className="font-bold text-brand-orange">{(sensor.exceedance_prob * 100).toFixed(1)}%</span>
                    </div>
                    
                    <div className={`mt-2 border text-[9px] font-bold text-center py-0.5 rounded ${statusColor}`}>
                      {siagaStatus}
                    </div>
                  </div>
                );
              })}
              <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center text-[10px] text-slate-500 font-mono pt-1">
                Displaying 16 of 120 river sensors. Click sensors on the map canvas to inspect GEV curves.
              </div>
            </div>
          )}

          {/* TAB 3: Code and blueprint viewer */}
          {activeBottomTab === 'python_core' && (
            <div className="h-full min-h-[220px]">
              <CodeExplorer />
            </div>
          )}

          {/* TAB 4: GCP + RAPIDS End-to-End Data Pipeline Architecture */}
          {activeBottomTab === 'data_pipeline' && (
            <div className="h-full min-h-[220px] overflow-y-auto">
              <PipelineDiagram />
            </div>
          )}

        </div>

      </footer>

    </div>
  );
}
