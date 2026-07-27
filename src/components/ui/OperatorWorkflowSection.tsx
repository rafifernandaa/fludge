import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  SlidersHorizontal,
  Video,
  Clock,
  Radio,
  Truck,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
} from "lucide-react";

export function OperatorWorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 1,
      tag: "STEP 01",
      title: "Water Rise Telemetry Detection",
      icon: Activity,
      summary: "Sensors detect a rise in water levels across telemetry networks.",
      detail:
        "120+ IoT ultrasonic depth sensors stream real-time water level data every 2 seconds from Katulampa, Manggarai, and Cipinang floodgates.",
      metrics: [
        { label: "Active Sensors", val: "120 Floodgates" },
        { label: "Telemetry Delay", val: "< 1.2s" },
      ],
      previewState: {
        sensor: "Pintu Air Manggarai",
        level: "840 cm (Rising +12cm/15m)",
        badge: "SENSOR TRIGGER",
        badgeColor: "text-amber-800 border-amber-300 bg-amber-50",
      },
    },
    {
      id: 2,
      tag: "STEP 02",
      title: "Threshold Benchmark & GEV Evaluation",
      icon: SlidersHorizontal,
      summary: "The system compares the level against established thresholds.",
      detail:
        "Automatic GEV (Generalized Extreme Value) distribution calculation compares water head against historical Siaga 3, 2, and 1 exceedance curves.",
      metrics: [
        { label: "Threshold Ratio", val: "1.42x Limit" },
        { label: "Confidence", val: "99.4%" },
      ],
      previewState: {
        sensor: "Katulampa Hydro-head",
        level: "Exceeds Siaga 2 Threshold (800cm)",
        badge: "THRESHOLD BREACH",
        badgeColor: "text-rose-800 border-rose-300 bg-rose-50",
      },
    },
    {
      id: 3,
      tag: "STEP 03",
      title: "Operator Visual & Field Verification",
      icon: Video,
      summary: "The operator verifies the situation via CCTV or field reports.",
      detail:
        "Duty operator accesses high-definition CCTV feeds and field unit telemetry to confirm sensor fidelity and prevent false alerts.",
      metrics: [
        { label: "CCTV Feeds", val: "4 Live Streams" },
        { label: "Field Verification", val: "Confirmed" },
      ],
      previewState: {
        sensor: "CCTV Cam #04 - Manggarai Spillway",
        level: "Visual Confirmation: Turbulence High",
        badge: "VERIFIED BY OPERATOR",
        badgeColor: "text-indigo-800 border-indigo-300 bg-indigo-50",
      },
    },
    {
      id: 4,
      tag: "STEP 04",
      title: "Affected Area & ETA Calculation",
      icon: Clock,
      summary: "The system calculates areas likely affected and estimates arrival time.",
      detail:
        "Topographical DEMNAS terrain solver models spatial flood wave propagation, identifying vulnerable RT sectors and exact arrival countdowns.",
      metrics: [
        { label: "Impact Corridor", val: "14 RT Sectors" },
        { label: "Est. Inundation", val: "T-minus 18m" },
      ],
      previewState: {
        sensor: "Kampung Melayu Corridor",
        level: "ETA: 18 Minutes (Sub-sector RT 04-08)",
        badge: "HYDRO MODEL ACTIVE",
        badgeColor: "text-fuchsia-800 border-fuchsia-300 bg-fuchsia-50",
      },
    },
    {
      id: 5,
      tag: "STEP 05",
      title: "Multi-Channel Alert Dispatch",
      icon: Radio,
      summary: "The operator issues an alert to the affected areas.",
      detail:
        "One-click execution triggers immediate SMS, radio broadcast, and BPBD regional warning sirens to alert local ward leaders and residents.",
      metrics: [
        { label: "Channels", val: "Sirens + Broadcast" },
        { label: "Target Area", val: "Zone A & B" },
      ],
      previewState: {
        sensor: "BPBD Command Dispatcher",
        level: "Alert Issued: SIAGA 2 EMERGENCY BROADCAST",
        badge: "ALERT BROADCASTED",
        badgeColor: "text-red-800 border-red-300 bg-red-50",
      },
    },
    {
      id: 6,
      tag: "STEP 06",
      title: "Tactical Evacuation Team Deployment",
      icon: Truck,
      summary: "An evacuation team is deployed using shortest safe Dijkstra routes.",
      detail:
        "FLUDGE automatically identifies nearest available rescue units, calculates non-flooded transit corridors, and assigns optimal evacuation shelters.",
      metrics: [
        { label: "Deployed Units", val: "3 Rescue Boats" },
        { label: "Shortest Safe Path", val: "1.2 km" },
      ],
      previewState: {
        sensor: "Tim Alpha BPBD East",
        level: "Dispatched to GOR Otista Shelter",
        badge: "TEAM DISPATCHED",
        badgeColor: "text-blue-800 border-blue-300 bg-blue-50",
      },
    },
    {
      id: 7,
      tag: "STEP 07",
      title: "Continuous Monitoring & Status Resolution",
      icon: CheckCircle2,
      summary: "The operator monitors developments and updates status until conditions are safe.",
      detail:
        "Real-time triage dashboard tracks water level decay rates, shelter capacity, and evacuee headcounts until official Stand-Down status is declared.",
      metrics: [
        { label: "Status Triage", val: "Continuous" },
        { label: "Resolution", val: "Controlled" },
      ],
      previewState: {
        sensor: "Command Matrix Triage",
        level: "Water Receding (-8cm/15m) - Monitoring Active",
        badge: "SAFETY LIFECYCLE",
        badgeColor: "text-emerald-800 border-emerald-300 bg-emerald-50",
      },
    },
  ];

  return (
    <section className="py-24 px-6 md:px-12 max-w-[1400px] mx-auto text-stone-800">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-fuchsia-500/10 to-indigo-500/10 border border-fuchsia-200 text-fuchsia-800 text-xs font-mono font-bold uppercase tracking-wider mb-4">
          <ShieldAlert className="w-3.5 h-3.5 text-fuchsia-700" />
          BPBD Operational Workflow
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-stone-900 mb-6">
          7-Step Deterministic Response Pipeline
        </h2>
        <p className="text-stone-600 text-base md:text-lg leading-relaxed">
          From first sensor surge to tactical team dispatch, FLUDGE guides disaster operators through every critical decision second.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Interactive Step Selector */}
        <div className="lg:col-span-6 space-y-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                  isActive
                    ? "bg-white border-fuchsia-400 shadow-xl shadow-fuchsia-900/5 text-stone-900"
                    : "bg-white/60 border-stone-200/80 text-stone-600 hover:border-stone-300 hover:bg-white"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                    isActive
                      ? "bg-gradient-to-br from-amber-500/20 via-fuchsia-500/20 to-indigo-500/20 text-fuchsia-700 border border-fuchsia-200"
                      : "bg-stone-100 text-stone-500 border border-stone-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold text-fuchsia-700 uppercase tracking-widest">
                      {step.tag}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
                        ACTIVE IN HUD
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-stone-900 truncate">
                    {step.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                    {step.summary}
                  </p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? "rotate-90 text-fuchsia-600" : "text-stone-400"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Right Side: Dynamic Step Preview Screen */}
        <div className="lg:col-span-6">
          <div className="relative rounded-3xl bg-white border border-stone-200 p-6 md:p-8 shadow-2xl shadow-stone-300/40 overflow-hidden">
            {/* Decorative Background Accent */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-amber-300/20 via-fuchsia-300/20 to-indigo-300/20 rounded-full blur-3xl pointer-events-none"></div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div>
                    <div className="text-xs font-mono font-bold text-fuchsia-700 uppercase tracking-widest">
                      {steps[activeStep].tag} PIPELINE STAGE
                    </div>
                    <h3 className="text-xl font-bold text-stone-900 mt-1">
                      {steps[activeStep].title}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${steps[activeStep].previewState.badgeColor}`}
                  >
                    {steps[activeStep].previewState.badge}
                  </span>
                </div>

                {/* Main Explanation */}
                <p className="text-sm text-stone-600 leading-relaxed">
                  {steps[activeStep].detail}
                </p>

                {/* Simulated HUD Component Box */}
                <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3">
                  <div className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                    Operator Screen Simulation
                  </div>
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                    <span className="text-xs font-semibold text-stone-800">
                      {steps[activeStep].previewState.sensor}
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-700">
                      {steps[activeStep].previewState.level}
                    </span>
                  </div>

                  {/* Metrics Badges */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {steps[activeStep].metrics.map((m, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-sm"
                      >
                        <div className="text-[10px] text-stone-500 font-mono">
                          {m.label}
                        </div>
                        <div className="text-sm font-bold font-mono text-fuchsia-800 mt-0.5">
                          {m.val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Step Action Button */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setActiveStep((prev) => (prev + 1) % steps.length)
                    }
                    className="text-xs font-bold text-fuchsia-700 hover:text-fuchsia-900 flex items-center gap-1.5 transition-colors"
                  >
                    Advance Pipeline Stage <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono text-stone-400 font-medium">
                    Stage {activeStep + 1} of 7
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
