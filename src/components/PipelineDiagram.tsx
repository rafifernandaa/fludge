import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Database, 
  Cpu, 
  Layers, 
  Play, 
  Check, 
  ArrowRight, 
  FileText, 
  Activity, 
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';

export function PipelineDiagram() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [ingestionLogs, setIngestionLogs] = useState<{ id: string; file: string; size: string; status: string; time: string }[]>([]);
  const [isQueryingBq, setIsQueryingBq] = useState<boolean>(false);
  const [bqResult, setBqResult] = useState<any[] | null>(null);
  const [isExportingGcs, setIsExportingGcs] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Generate simulated GCS landing logs
  useEffect(() => {
    const generateLog = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      const randomId = Math.floor(Math.random() * 9000 + 1000);
      const isSensor = Math.random() > 0.5;
      const log = {
        id: `LOG-${randomId}`,
        file: isSensor 
          ? `gs://telemetry-river-input/raw_level_${now.toISOString().split('T')[0]}_${Math.floor(Math.random() * 1000)}.json`
          : `gs://bmkg-weather-input/rainfall_grid_${now.toISOString().split('T')[0]}_${Math.floor(Math.random() * 1000)}.csv`,
        size: `${(Math.random() * 45 + 5).toFixed(1)} KB`,
        status: "Landed (Success)",
        time: timeStr
      };
      setIngestionLogs(prev => [log, ...prev.slice(0, 4)]);
    };

    generateLog();
    const interval = setInterval(generateLog, 4500);
    return () => clearInterval(interval);
  }, []);

  const simulateBigQueryJoin = () => {
    setIsQueryingBq(true);
    setBqResult(null);
    setTimeout(() => {
      setBqResult([
        { kelurahan: "Kampung Melayu", demnas_elev: "2.4m", bq_joined_sensor: "Manggarai PA", avg_rainfall: "42.5 mm/hr" },
        { kelurahan: "Rawajati", demnas_elev: "4.1m", bq_joined_sensor: "Ciliwung Depok", avg_rainfall: "38.1 mm/hr" },
        { kelurahan: "Pluit", demnas_elev: "-1.2m", bq_joined_sensor: "Waduk Pluit Pump", avg_rainfall: "55.0 mm/hr" },
        { kelurahan: "Petamburan", demnas_elev: "1.8m", bq_joined_sensor: "Karet PA", avg_rainfall: "40.2 mm/hr" }
      ]);
      setIsQueryingBq(false);
    }, 1200);
  };

  const simulateGcsExport = () => {
    setIsExportingGcs(true);
    setExportSuccess(false);
    setTimeout(() => {
      setIsExportingGcs(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
      
      {/* LEFT COLUMN: INTERACTIVE PIPELINE STAGES VIEW */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <span className="text-[10px] text-brand-cyan font-bold block uppercase tracking-wider font-mono">
          Interactive GCP + NVIDIA RAPIDS Acceleration Flow
        </span>
        
        {/* Stages Progress Track */}
        <div className="grid grid-cols-4 gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
          {[
            { label: "1. Raw Telemetry Ingest", icon: Cloud, desc: "Cloud Storage Landing" },
            { label: "2. Spatial ETL Join", icon: Database, desc: "BigQuery Feature Store" },
            { label: "3. GPU Acceleration", icon: Cpu, desc: "NVIDIA RAPIDS cuDF" },
            { label: "4. Decision UI + AI", icon: Layers, desc: "Looker HUD & Gemini" }
          ].map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.label}
                onClick={() => setActiveStep(idx)}
                className={`flex flex-col items-center text-center p-2 rounded-md border text-xs transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-900 border-brand-cyan text-white shadow-md' 
                    : 'bg-slate-950 border-slate-900 text-slate-500 hover:text-slate-300 hover:border-slate-800'
                }`}
              >
                <div className={`p-1.5 rounded ${isSelected ? 'bg-brand-cyan/10 text-brand-cyan' : 'bg-slate-900 text-slate-600'}`}>
                  <Icon size={16} />
                </div>
                <span className="font-semibold text-[10px] mt-1.5 truncate w-full">{step.label}</span>
                <span className="text-[8px] text-slate-500 truncate w-full mt-0.5">{step.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Stage Description Card */}
        <div className="flex-1 bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            {activeStep === 0 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                    <Cloud size={14} className="text-brand-cyan" />
                    Stage 1: Raw Telemetry Stream (Google Cloud Storage)
                  </h4>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.2 rounded font-mono">
                    Ingestion Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Hydrological river monitoring telemetry (water levels at Jakarta floodgates) and BMKG meteorology radars land as high-velocity batch data directly inside a centralized <strong>Google Cloud Storage (GCS)</strong> landing bucket (<code className="text-brand-cyan bg-slate-950 px-1 rounded text-[10px]">gs://jakarta-disaster-telemetry/</code>).
                </p>
                <div className="space-y-1 bg-slate-950 p-2.5 rounded border border-slate-850 font-mono text-[10px]">
                  <div className="text-slate-500 uppercase text-[8px] font-bold pb-1.5 border-b border-slate-900">
                    Live Telemetry Bucket Monitor:
                  </div>
                  {ingestionLogs.map((log) => (
                    <div key={log.id} className="flex justify-between text-slate-300 py-0.5">
                      <span className="text-slate-400 truncate max-w-[260px]">{log.file}</span>
                      <span className="text-emerald-400 font-bold">{log.size}</span>
                      <span className="text-slate-500 font-sans text-[9px]">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                    <Database size={14} className="text-brand-cyan" />
                    Stage 2: Spatial Feature Store (BigQuery)
                  </h4>
                  <span className="text-[9px] bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 px-2 py-0.2 rounded font-mono">
                    Warehouse Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  A BigQuery external schema mapping merges raw GCS log landings with <strong>DEMNAS Digital Elevation Model</strong> topographic tables and administrative DKI Jakarta Kelurahan boundary geometry files. This prepares highly structured feature store registers.
                </p>
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-850 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Interactive BigQuery Compiler:</span>
                    <button
                      onClick={simulateBigQueryJoin}
                      disabled={isQueryingBq}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-cyan/10 hover:bg-brand-cyan/25 text-brand-cyan text-[10px] font-mono rounded font-bold transition-all cursor-pointer border border-brand-cyan/20 disabled:opacity-50"
                    >
                      <RefreshCw size={10} className={isQueryingBq ? "animate-spin" : ""} />
                      {isQueryingBq ? "Querying..." : "Run BigQuery Spatial Join Query"}
                    </button>
                  </div>
                  {bqResult ? (
                    <table className="w-full text-left font-mono text-[9px] border-collapse bg-slate-950">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-1 uppercase">KELURAHAN</th>
                          <th className="pb-1 uppercase text-right">DEMNAS ELEV</th>
                          <th className="pb-1 uppercase">BQ SENSOR</th>
                          <th className="pb-1 uppercase text-right">RAIN SPEED</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bqResult.map((r, i) => (
                          <tr key={i} className="border-b border-slate-900 text-slate-300">
                            <td className="py-1 font-semibold">{r.kelurahan}</td>
                            <td className="py-1 text-right text-slate-400">{r.demnas_elev}</td>
                            <td className="py-1 text-brand-cyan">{r.bq_joined_sensor}</td>
                            <td className="py-1 text-right text-brand-orange">{r.avg_rainfall}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-16 flex items-center justify-center border border-dashed border-slate-850 rounded text-slate-600 font-mono text-[10px]">
                      {isQueryingBq ? "Processing joins inside BigQuery cluster..." : "Click button above to compile features."}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                    <Cpu size={14} className="text-brand-cyan" />
                    Stage 3: Real-Time GIS Acceleration (NVIDIA RAPIDS cuDF)
                  </h4>
                  <span className="text-[9px] bg-brand-orange/15 text-brand-orange border border-brand-orange/20 px-2 py-0.2 rounded font-mono">
                    GPU Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  To bypass the bottleneck of CPU single-threaded point-in-polygon (PiP) mappings and weather rainfall spatial Inverse Distance Weightings across Jakarta's massive <strong>30,000 RT neighborhoods</strong>, the data is loaded into <strong>NVIDIA RAPIDS cuDF</strong> dataframes in GPU memory, executing operations parallelly in less than 5ms!
                </p>
                <div className="grid grid-cols-3 gap-2.5 bg-slate-950 p-2 rounded-lg border border-slate-850 font-mono text-[10px]">
                  <div>
                    <span className="text-slate-500 text-[8px] uppercase">RAPIDS Engine:</span>
                    <span className="text-white font-bold block mt-0.5">cuDF v26.04</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[8px] uppercase">Active GPU Model:</span>
                    <span className="text-white font-bold block mt-0.5">NVIDIA L4 Tensor Core</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[8px] uppercase">VRAM Usage:</span>
                    <span className="text-brand-cyan font-bold block mt-0.5">14.1 GB / 24 GB</span>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
                    <Layers size={14} className="text-brand-cyan" />
                    Stage 4: Tactical Decision Interface & Gemini Advisor
                  </h4>
                  <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.2 rounded font-mono">
                    Looker + AI Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The outputs from cuDF populate our Looker-style command UI, providing real-time priority rankings. We use <strong>Gemini-3.5-Flash</strong> via the server-side `@google/genai` SDK to compile real-time, action-oriented evacuations, route recommendations, and tactical briefings for emergency disaster responder coordination.
                </p>
                <div className="p-2 bg-slate-950 rounded border border-slate-850 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-brand-cyan" />
                    <span>Real-time Gemini Tactical Briefs Compiled:</span>
                  </div>
                  <span className="text-emerald-400 font-bold uppercase text-[9px] bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    Active & Dynamic
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center border-t border-slate-900 pt-3 mt-1.5">
            <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
              <Clock size={11} /> Click on the step tabs above to explore step mechanics.
            </span>
            <div className="flex gap-2">
              {activeStep < 3 ? (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="flex items-center gap-1 px-3 py-1 bg-brand-cyan hover:bg-brand-cyan/85 text-slate-950 text-[10px] font-bold rounded cursor-pointer transition-all font-sans"
                >
                  Next Stage <ArrowRight size={11} />
                </button>
              ) : (
                <button
                  onClick={() => setActiveStep(0)}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold rounded cursor-pointer transition-all font-sans"
                >
                  Restart Tour <RefreshCw size={11} />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: GCP INTERACTIVE ACTION SIMULATOR */}
      <div className="lg:col-span-5 flex flex-col gap-3.5">
        <span className="text-[10px] text-brand-cyan font-bold block uppercase tracking-wider font-mono">
          Cloud Telemetry & Extraction Controls
        </span>

        {/* Cloud Export Panel */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between flex-1">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <FileText size={14} className="text-brand-orange" />
              GCP Storage Bucket Export Service
            </h4>
            
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              Export completed spatial hazard rankings and routing checkpoints in real-time to a static Cloud Storage Bucket for archival reporting and audit logs.
            </p>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-900 text-[10.5px] font-mono space-y-1 text-slate-300">
              <div className="flex justify-between text-slate-500 text-[9px] uppercase pb-1 border-b border-slate-900">
                <span>EXPORT TARGET CONFIGURATION:</span>
              </div>
              <div className="flex justify-between">
                <span>Bucket:</span>
                <span className="text-brand-cyan">gs://jakarta-disaster-exports/</span>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <span className="text-slate-400">JSON &amp; Parquet</span>
              </div>
              <div className="flex justify-between">
                <span>Compression:</span>
                <span className="text-slate-400">snappy (RAPIDS Native)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900 space-y-2">
            <button
              onClick={simulateGcsExport}
              disabled={isExportingGcs}
              className={`w-full py-2 rounded-lg font-sans font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border ${
                exportSuccess
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-brand-orange text-slate-950 hover:bg-brand-orange/90 border-transparent font-extrabold'
              }`}
            >
              {isExportingGcs ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Compressing & Uploading to GCS...
                </>
              ) : exportSuccess ? (
                <>
                  <Check size={12} />
                  Export Successfully Transmitted!
                </>
              ) : (
                <>
                  <Play size={12} fill="currentColor" />
                  Push Live Ranks to Cloud Storage
                </>
              )}
            </button>
            {exportSuccess && (
              <p className="text-[9px] text-emerald-400 text-center font-mono animate-pulse">
                Files successfully written: gs://jakarta-disaster-exports/rankings_latest.parquet
              </p>
            )}
          </div>
        </div>

        {/* RAPIDS Acceleration Proof Indicator */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2.5">
          <h4 className="text-[11px] font-bold text-slate-300 font-mono uppercase flex items-center gap-1.5">
            <Activity size={13} className="text-brand-cyan" />
            RAPIDS GPU Acceleration Proof
          </h4>
          <p className="text-[9.5px] text-slate-400 leading-normal font-sans">
            GPU parallelization handles Point-in-Polygon checks, spatial rain IDW interpolation, and risk-score ranking instantly. Traditional single-core CPU mapping results in system freezing and latency.
          </p>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 flex justify-between items-center text-[11px] font-mono">
            <div className="text-slate-400">Latency-Reduction Gain:</div>
            <div className="text-emerald-400 font-extrabold flex items-center gap-1">
              <Sparkles size={11} /> ~5,000x SPEEDUP
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
