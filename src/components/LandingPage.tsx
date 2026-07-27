import React, { useState, useEffect } from "react";
import {
  Droplet,
  ArrowRight,
  Shield,
  Zap,
  Activity,
  Cpu,
  Map,
  Compass,
  Layers,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Interactive3DTerrain } from "./ui/Interactive3DTerrain";
import { OperatorWorkflowSection } from "./ui/OperatorWorkflowSection";
import { OperatorDecisionMatrix } from "./ui/OperatorDecisionMatrix";

interface LandingPageProps {
  onEnterHud: () => void;
}

export default function LandingPage({ onEnterHud }: LandingPageProps) {
  const [heroWaterLevel, setHeroWaterLevel] = useState(55);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        onEnterHud();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onEnterHud]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-800 font-sans selection:bg-fuchsia-500/20 overflow-x-hidden">
      {/* Dynamic Cartographic Fine Grid Background (Inspired by Image 2) */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] z-0"></div>

      {/* Top Floating Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-stone-200/80 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-fuchsia-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-fuchsia-500/20">
              <Droplet className="w-5 h-5 fill-white/30" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-xl text-stone-900 font-mono">
                FLUDGE
              </span>
              <span className="ml-2 text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200 font-bold">
                BPBD COMMAND v2.0
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono font-bold text-stone-600 uppercase tracking-widest">
            <a href="#hero-3d" className="hover:text-fuchsia-700 transition-colors">
              3D Matrix
            </a>
            <a href="#pipeline" className="hover:text-fuchsia-700 transition-colors">
              7-Step Pipeline
            </a>
            <a href="#decisions" className="hover:text-fuchsia-700 transition-colors">
              Operator Answers
            </a>
            <a href="#specs" className="hover:text-fuchsia-700 transition-colors">
              Engine Specs
            </a>
          </nav>

          {/* CTA Button */}
          <button
            onClick={onEnterHud}
            className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 via-fuchsia-600 to-indigo-700 hover:from-amber-700 hover:to-indigo-800 text-white px-6 py-2.5 rounded-full text-xs font-extrabold tracking-wider uppercase transition-all shadow-md shadow-fuchsia-500/20 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          >
            <span>LAUNCH COMMAND HUD</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO SECTION: 3D Interactive WebGL Matrix & Image 1 Terracotta-Magenta-Indigo Gradient */}
        <section id="hero-3d" className="pt-12 pb-20 px-6 md:px-12 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-6 space-y-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-stone-200 text-fuchsia-800 text-xs font-mono font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-600 animate-pulse" />
                <span>Sub-second Flood Predictive Matrix for BPBD Officers</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-stone-900 leading-[1.08]">
                Predict Flood Inundation in{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-fuchsia-600 to-indigo-700">
                  Real-Time.
                </span>
              </h1>

              <p className="text-stone-600 text-base md:text-lg leading-relaxed max-w-xl font-medium">
                FLUDGE equips disaster operators with 3D terrain elevation telemetry, GEV risk scoring, and Dijkstra safe corridor dispatch to make life-saving evacuation decisions in seconds.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onEnterHud}
                  className="bg-gradient-to-r from-amber-600 via-fuchsia-600 to-indigo-700 hover:from-amber-700 hover:to-indigo-800 text-white font-extrabold px-8 py-4 rounded-2xl text-sm tracking-wide uppercase flex items-center gap-3 transition-all shadow-xl shadow-fuchsia-600/20 hover:shadow-fuchsia-600/35 hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>ENTER DASHBOARD HUD</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#pipeline"
                  className="bg-white hover:bg-stone-50 text-stone-700 font-bold px-6 py-4 rounded-2xl text-sm flex items-center gap-2 border border-stone-200 transition-colors shadow-sm"
                >
                  <span>Explore 7-Step Pipeline</span>
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                </a>
              </div>

              {/* Real-time Ticker Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-200/80">
                <div>
                  <div className="text-2xl font-black font-mono text-amber-700">
                    30,000+
                  </div>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">
                    RT Micro-Sectors
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black font-mono text-fuchsia-700">
                    0.4s
                  </div>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">
                    GPU CUDA Latency
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black font-mono text-indigo-700">
                    120
                  </div>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">
                    Active Telemetry Sensors
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero 3D Interactive Canvas Component */}
            <div className="lg:col-span-6">
              <Interactive3DTerrain
                waterLevel={heroWaterLevel}
                onWaterLevelChange={(val) => setHeroWaterLevel(val)}
              />
            </div>
          </div>
        </section>

        {/* OPERATOR WORKFLOW PIPELINE SECTION */}
        <div id="pipeline" className="border-t border-stone-200/80 bg-stone-100/40">
          <OperatorWorkflowSection />
        </div>

        {/* OPERATOR DECISION MATRIX SECTION */}
        <div id="decisions" className="border-t border-stone-200/80">
          <OperatorDecisionMatrix />
        </div>

        {/* TECHNICAL ENGINE SPECS */}
        <section id="specs" className="py-24 px-6 md:px-12 max-w-[1400px] mx-auto border-t border-stone-200/80">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-800 text-xs font-mono font-bold uppercase tracking-wider mb-4">
              <Cpu className="w-3.5 h-3.5 text-fuchsia-600" />
              Engine Architecture & Performance
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-stone-900 mb-6">
              High-Precision Hydrological Analytics
            </h2>
            <p className="text-stone-600 text-base md:text-lg leading-relaxed">
              Designed explicitly for Jakarta’s geographic constraints and BPBD duty officer dispatch requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 hover:border-amber-400 transition-colors shadow-sm">
              <div className="p-3 w-fit rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">DEMNAS Elevation Mesh</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Uses 0.27-arc-second national elevation data combined with BMKG rainfall grids to map overbank flow propagation across 30,000+ RT sectors.
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 hover:border-fuchsia-400 transition-colors shadow-sm">
              <div className="p-3 w-fit rounded-2xl bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">GEV Probability Engine</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Generalized Extreme Value statistical fitting calculates exceedance probabilities and return periods for Siaga 3, 2, and 1 alerts.
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 hover:border-indigo-400 transition-colors shadow-sm">
              <div className="p-3 w-fit rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">Dijkstra Safe Corridors</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Calculates weighted shortest path safe transit corridors for rescue boats and emergency vehicles that completely bypass submerged road segments.
              </p>
            </div>

            <div className="bg-white border border-stone-200 p-6 rounded-3xl space-y-4 hover:border-rose-400 transition-colors shadow-sm">
              <div className="p-3 w-fit rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">GPU cuDF Acceleration</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Simulated RAPIDS suite processes thousands of water level sensors simultaneously, reducing calculation latency from 4.2s to ~0.4s.
              </p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION BANNER */}
        <section className="py-20 px-6 md:px-12 max-w-[1400px] mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-r from-amber-600 via-fuchsia-600 to-indigo-700 p-10 md:p-16 text-center space-y-8 overflow-hidden shadow-2xl shadow-fuchsia-900/20 text-white">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-mono font-bold uppercase tracking-wider">
              Ready for Operational Triage
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight max-w-2xl mx-auto">
              Launch the FLUDGE Command Dashboard
            </h2>

            <p className="text-white/90 text-base max-w-xl mx-auto leading-relaxed">
              Access live water sensors, interactive evacuation routing, and automated risk scoring now.
            </p>

            <button
              onClick={onEnterHud}
              className="bg-white hover:bg-stone-100 text-stone-900 font-extrabold px-10 py-5 rounded-2xl text-sm tracking-wider uppercase inline-flex items-center gap-3 transition-all shadow-xl hover:-translate-y-0.5 cursor-pointer"
            >
              <span>OPEN COMMAND HUD INTERFACE</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8 px-6 md:px-12 text-center text-xs font-mono text-stone-500">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>FLUDGE — BPBD Disaster Operations Map Tracker</div>
          <div>Jakarta Deterministic Hydrological Engine © 2026</div>
        </div>
      </footer>
    </div>
  );
}
