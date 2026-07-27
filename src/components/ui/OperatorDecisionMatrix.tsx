import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  AlertTriangle,
  MapPin,
  Clock,
  Users,
  Building2,
  Navigation,
  TrendingUp,
  CheckCircle,
  Zap,
} from "lucide-react";

export function OperatorDecisionMatrix() {
  const [selectedQuestion, setSelectedQuestion] = useState(0);

  const decisionQuestions = [
    {
      id: 1,
      question: "Do conditions meet the criteria for issuing an alert?",
      category: "Alert Criteria",
      icon: AlertTriangle,
      status: "SIAGA 2 CONFIRMED",
      statusBg: "bg-amber-100 text-amber-800 border-amber-300",
      answer: {
        headline: "YES — Water head exceeds 1.42x Siaga 2 Safety Margin",
        details:
          "Katulampa telemetric gauge reads 840 cm (+15 cm/15min rate of rise). Dynamic GEV model confirms 99.4% probability of downstream overflow.",
        action: "RECOMMENDED ACTION: Authorize Regional Emergency Warning Siren & SMS Dispatch.",
        stats: [
          { label: "Water Head", val: "840 cm" },
          { label: "Rise Speed", val: "+15cm / 15m" },
          { label: "Probability", val: "99.4%" },
        ],
      },
    },
    {
      id: 2,
      question: "Which areas will be affected first?",
      category: "Impact Sequencing",
      icon: MapPin,
      status: "SECTOR TARGETING",
      statusBg: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
      answer: {
        headline: "Sub-sectors RT 04, 05, and 08 (Kampung Melayu Ward)",
        details:
          "Topographical DEMNAS terrain elevation indicates low-lying alluvial basin in RT 04 & RT 05 will experience primary overbank flow.",
        action: "PRIORITY SECTORS: RT 04 (Elevation +1.2m), RT 05 (+1.4m), RT 08 (+1.8m).",
        stats: [
          { label: "1st Sector", val: "RT 04 / RW 02" },
          { label: "2nd Sector", val: "RT 05 / RW 02" },
          { label: "3rd Sector", val: "RT 08 / RW 03" },
        ],
      },
    },
    {
      id: 3,
      question: "How much time remains before the flood reaches those areas?",
      category: "Hydro Countdown",
      icon: Clock,
      status: "COUNTDOWN ACTIVE",
      statusBg: "bg-rose-100 text-rose-800 border-rose-300",
      answer: {
        headline: "14 Minutes 32 Seconds until crest reaches RT 04",
        details:
          "Hydrodynamic wave propagation velocity calculates 1.8 m/s flow velocity downstream from Manggarai sluice gate.",
        action: "EVACUATION WINDOW: 14m remaining for safe ground-level departure.",
        stats: [
          { label: "Estimated Crest", val: "14m 32s" },
          { label: "Flow Speed", val: "1.8 m/s" },
          { label: "Distance", val: "1.5 km" },
        ],
      },
    },
    {
      id: 4,
      question: "How many residents need to be evacuated?",
      category: "Population Census",
      icon: Users,
      status: "HEADCOUNT AUDIT",
      statusBg: "bg-purple-100 text-purple-800 border-purple-300",
      answer: {
        headline: "1,420 Residents across 385 households in high-risk zones",
        details:
          "Cross-referenced with RT census records: includes 142 elderly residents, 88 toddlers, and 14 vulnerable mobility individuals.",
        action: "DISPATCH REQUIREMENT: 3 Medical-assisted rescue boats & 4 transports.",
        stats: [
          { label: "Total Headcount", val: "1,420" },
          { label: "Vulnerable Count", val: "244" },
          { label: "Households", val: "385" },
        ],
      },
    },
    {
      id: 5,
      question: "Which shelters still have available capacity?",
      category: "Shelter Logistics",
      icon: Building2,
      status: "SHELTER MATRIX",
      statusBg: "bg-emerald-100 text-emerald-800 border-emerald-300",
      answer: {
        headline: "GOR Otista (340 seats free) & SDN 01 Kampung Melayu (180 seats free)",
        details:
          "Live BPBD shelter dashboard shows GOR Otista is operating at 45% capacity. Puskesmas Jatinegara available for emergency medical triage.",
        action: "PRIMARY ROUTE: Direct evacuees to GOR Otista via Jl. Otista Raya.",
        stats: [
          { label: "GOR Otista", val: "340 Free" },
          { label: "SDN 01 Melayu", val: "180 Free" },
          { label: "Total Cap", val: "520 Free" },
        ],
      },
    },
    {
      id: 6,
      question: "Which team is closest and ready for deployment?",
      category: "Team Proximity",
      icon: Navigation,
      status: "TACTICAL DISPATCH",
      statusBg: "bg-blue-100 text-blue-800 border-blue-300",
      answer: {
        headline: "Tim Alpha BPBD East (1.2 km away — Standby Ready)",
        details:
          "GPS positioning confirms Tim Alpha is at Sector Post 3 with 2 rubber boats and 8 trained rescue personnel.",
        action: "DEPLOYMENT COMMAND: Transmit safe transit corridor route to Tim Alpha tablet.",
        stats: [
          { label: "Closest Unit", val: "Tim Alpha BPBD" },
          { label: "Distance", val: "1.2 km" },
          { label: "ETA to Site", val: "4.5 Mins" },
        ],
      },
    },
    {
      id: 7,
      question: "Should alert level be raised, or lifted if conditions improve?",
      category: "Triage State Lifecycle",
      icon: TrendingUp,
      status: "ESCALATION MONITOR",
      statusBg: "bg-yellow-100 text-yellow-800 border-yellow-300",
      answer: {
        headline: "MAINTAIN SIAGA 2 — Prepare for potential SIAGA 1 escalation if rate > +20cm/15m",
        details:
          "Upstream rainfall telemetry in Katulampa shows sustained 65mm/hr rain. Stand-down criteria not met until water head drops below 700cm.",
        action: "LIFECYCLE STATUS: Maintain Siaga 2. Re-evaluate in 15 minutes.",
        stats: [
          { label: "Current Level", val: "SIAGA 2" },
          { label: "Trend", val: "Rising (+15cm)" },
          { label: "De-escalation", val: "NOT READY" },
        ],
      },
    },
  ];

  const current = decisionQuestions[selectedQuestion];

  return (
    <section className="py-24 px-6 md:px-12 max-w-[1400px] mx-auto text-stone-800">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          Operator Tactical Intelligence
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-stone-900 mb-6">
          7 Critical Decision Answers in Sub-Seconds
        </h2>
        <p className="text-stone-600 text-base md:text-lg leading-relaxed">
          During a flood crisis, BPBD duty officers need immediate, deterministic answers. FLUDGE eliminates guesswork by solving key questions automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: 7 Operator Questions List */}
        <div className="lg:col-span-5 space-y-2.5">
          {decisionQuestions.map((q, idx) => {
            const QIcon = q.icon;
            const isSelected = selectedQuestion === idx;
            return (
              <button
                key={q.id}
                onClick={() => setSelectedQuestion(idx)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                  isSelected
                    ? "bg-white border-fuchsia-400 text-stone-900 shadow-md shadow-fuchsia-900/5 font-bold"
                    : "bg-white/60 border-stone-200/80 text-stone-600 hover:border-stone-300 hover:bg-white"
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isSelected ? "bg-fuchsia-100 text-fuchsia-700" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  <QIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-fuchsia-700 font-bold uppercase">
                    {q.category}
                  </div>
                  <div className="text-xs font-semibold text-stone-800 truncate">
                    {q.question}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Interactive Answer Panel */}
        <div className="lg:col-span-7">
          <div className="relative rounded-3xl bg-white border border-stone-200 p-6 md:p-8 shadow-2xl shadow-stone-300/40">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header Question */}
                <div className="space-y-3 pb-6 border-b border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-fuchsia-700 uppercase tracking-widest flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      OPERATOR QUESTION #{current.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${current.statusBg}`}
                    >
                      {current.status}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-stone-900 leading-snug">
                    "{current.question}"
                  </h3>
                </div>

                {/* Instant Answer Block */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-amber-50/50 via-fuchsia-50/50 to-indigo-50/50 border border-fuchsia-200/80 rounded-2xl p-5">
                    <div className="text-xs font-mono font-bold text-fuchsia-800 uppercase mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-fuchsia-700" />
                      FLUDGE Instant Decision Output
                    </div>
                    <div className="text-base font-bold text-stone-900 mb-2">
                      {current.answer.headline}
                    </div>
                    <p className="text-sm text-stone-600 leading-relaxed mb-4">
                      {current.answer.details}
                    </p>
                    <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs font-mono font-bold text-amber-900 shadow-sm">
                      {current.answer.action}
                    </div>
                  </div>

                  {/* 3 Real-time Stat Badges */}
                  <div className="grid grid-cols-3 gap-3">
                    {current.answer.stats.map((stat, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-center"
                      >
                        <div className="text-[10px] text-stone-500 font-mono">
                          {stat.label}
                        </div>
                        <div className="text-sm font-bold font-mono text-fuchsia-800 mt-1">
                          {stat.val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
