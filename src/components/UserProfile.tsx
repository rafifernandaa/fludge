import React, { useState } from "react";
import {
  User,
  ShieldCheck,
  Key,
  BadgeAlert,
  Clock,
  Radio,
  FileText,
  Bell,
  CheckCircle2,
  Lock,
  Cpu,
  MapPin,
  Sparkles,
  Smartphone,
  Check,
  Shield,
  Activity,
  Award,
} from "lucide-react";
import { toast } from "sonner";

interface UserProfileProps {
  isDarkMode: boolean;
  onClose?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isDarkMode }) => {
  const [commanderInfo, setCommanderInfo] = useState({
    name: "Commander Ir. Bambang Suherman, M.T.",
    title: "Chief Operations Officer (COO)",
    agency: "BPBD DKI Jakarta Emergency Response Unit (Pusdalops PB)",
    badgeId: "BPBD-JKT-88291-ALPHA",
    clearanceLevel: "Level 5 Tactical Authority (Full Siren & Pump Dispatch Clearance)",
    dutyShift: "Shift Alpha • Night Operations (20:00 - 08:00 WIB)",
    email: "bambang.suherman@bpbd.jakarta.go.id",
    phone: "+62 811-9876-5432 (Encrypted Satellite Radio)",
    sector: "DKI Jakarta Provincial Command Center",
  });

  const [sirenAuthEnabled, setSirenAuthEnabled] = useState(true);
  const [multiAgentOverride, setMultiAgentOverride] = useState(true);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [autoExportPdf, setAutoExportPdf] = useState(false);

  const handleSaveSettings = () => {
    toast.success("Commander User Profile & System Credentials Saved!", {
      description: "Updated clearance locks and security authorization preferences.",
    });
  };

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-stone-900 dark:bg-[#060a14] border border-stone-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-cyan-400 p-0.5 shrink-0 shadow-lg">
              <div className="w-full h-full bg-stone-900 rounded-[14px] flex items-center justify-center">
                <User className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800">
                  Level 5 Clearance
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ● On-Duty
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {commanderInfo.name}
              </h1>
              <p className="text-stone-400 dark:text-slate-400 text-xs font-sans">
                {commanderInfo.title} • {commanderInfo.agency}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2.5 rounded-2xl bg-fuchsia-600 hover:bg-fuchsia-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Check className="w-4 h-4" /> Save Profile Credentials
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Officer Identity & Credentials */}
        <div className="lg:col-span-5 space-y-5">
          {/* Badge & Security Card */}
          <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
              <span className="font-bold text-stone-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
                Officer Credential Badge
              </span>
              <span className="text-[10px] text-stone-400">ID: {commanderInfo.badgeId}</span>
            </div>

            <div className="space-y-3 font-sans">
              <div>
                <label className="text-[10px] font-mono uppercase text-stone-400 font-bold block mb-1">
                  Full Name & Credentials
                </label>
                <input
                  type="text"
                  value={commanderInfo.name}
                  onChange={(e) => setCommanderInfo({ ...commanderInfo, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-stone-400 font-bold block mb-1">
                  Command Designation
                </label>
                <input
                  type="text"
                  value={commanderInfo.title}
                  onChange={(e) => setCommanderInfo({ ...commanderInfo, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase text-stone-400 font-bold block mb-1">
                  Assigned Command Unit
                </label>
                <input
                  type="text"
                  value={commanderInfo.agency}
                  onChange={(e) => setCommanderInfo({ ...commanderInfo, agency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800/80">
                  <span className="text-[10px] font-mono text-stone-400 uppercase font-bold block">
                    Duty Shift
                  </span>
                  <span className="text-xs font-bold text-stone-800 dark:text-slate-200 block mt-0.5">
                    Shift Alpha (Night)
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800/80">
                  <span className="text-[10px] font-mono text-stone-400 uppercase font-bold block">
                    Clearance Tier
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    Level 5 Full Locks
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* System Hardware & Security Protocols */}
          <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
              <span className="font-bold text-stone-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
                Security & Authentication Hardware
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-white text-xs block">
                      YubiKey 5 Series FIPS Hardware Token
                    </span>
                    <span className="text-[10px] text-stone-500 font-sans">
                      Physical Security Token Inserted • Serial #8839210
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Active
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="font-bold text-stone-900 dark:text-white text-xs block">
                      Encrypted TETRA BPBD Radio Network
                    </span>
                    <span className="text-[10px] text-stone-500 font-sans">
                      Channel 04 • Pusdalops Direct Line
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authorization Locks & Tactical Shift History */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tactical Authorization Locks */}
          <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
              <span className="font-bold text-stone-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <BadgeAlert className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
                Commander Override & Safety Locks
              </span>
            </div>

            <div className="space-y-3 font-sans">
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-stone-900 dark:text-white text-xs block">
                    Emergency Siren Activation Lock
                  </span>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-0.5">
                    Allows 110dB acoustic siren trigger across 30,000 neighborhood RT units.
                  </p>
                </div>
                <button
                  onClick={() => setSirenAuthEnabled(!sirenAuthEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    sirenAuthEnabled ? "bg-fuchsia-600 dark:bg-cyan-500" : "bg-stone-300 dark:bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      sirenAuthEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-stone-900 dark:text-white text-xs block">
                    Autonomous Multi-Agent Human-in-the-Loop Lock
                  </span>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-0.5">
                    Requires manual commander confirmation before executing autonomous multi-agent orders.
                  </p>
                </div>
                <button
                  onClick={() => setMultiAgentOverride(!multiAgentOverride)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    multiAgentOverride ? "bg-fuchsia-600 dark:bg-cyan-500" : "bg-stone-300 dark:bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      multiAgentOverride ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-stone-900 dark:text-white text-xs block">
                    High-Decibel Siren Audio Alarms
                  </span>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400 mt-0.5">
                    Play browser synthesized warning audio when telemetry passes GEV critical threshold.
                  </p>
                </div>
                <button
                  onClick={() => setAudioAlerts(!audioAlerts)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 ${
                    audioAlerts ? "bg-fuchsia-600 dark:bg-cyan-500" : "bg-stone-300 dark:bg-slate-800"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      audioAlerts ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Commander Shift Authorization Log */}
          <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-3 border-stone-100 dark:border-slate-800">
              <span className="font-bold text-stone-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
                Shift Activity & Order Execution Audit Log
              </span>
              <span className="text-[10px] text-stone-400">Tonight's Log</span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              <div className="p-3 rounded-2xl bg-stone-50/80 dark:bg-slate-900/40 border border-stone-200 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 dark:text-white text-xs block">
                    Multi-Agent Response Directive Authorized
                  </span>
                  <span className="text-[10px] text-stone-500 font-sans">
                    Executed evacuation orders & mobile pump dispatch for RT 004/002.
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">22:45 WIB</span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50/80 dark:bg-slate-900/40 border border-stone-200 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 dark:text-white text-xs block">
                    PDF SitRep Executive Briefing Generated
                  </span>
                  <span className="text-[10px] text-stone-500 font-sans">
                    Exported official BPBD SITREP report for Governor's Office.
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">21:30 WIB</span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50/80 dark:bg-slate-900/40 border border-stone-200 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 dark:text-white text-xs block">
                    Shift Alpha Logged In & Hardware Authenticated
                  </span>
                  <span className="text-[10px] text-stone-500 font-sans">
                    YubiKey token verified for Commander Bambang Suherman.
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">20:00 WIB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
