import React, { useState, useEffect } from "react";
import {
  Bot,
  BrainCircuit,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Truck,
  Radio,
  MapPin,
  Sparkles,
  ArrowRight,
  UserCheck,
  Clock,
  Terminal,
  ShieldAlert,
  FileText,
  Check,
  X,
  Compass,
} from "lucide-react";
import { NeighborhoodRT, RiverSensor } from "../types";
import { toast } from "sonner";

interface MultiAgentCenterProps {
  rankedRts: NeighborhoodRT[];
  sensors: RiverSensor[];
  selectedRt: NeighborhoodRT | null;
  onSelectRt: (rt: NeighborhoodRT) => void;
  onDispatchPump: (rtId: string) => void;
  onToggleSiren: (rtId: string) => void;
  onToggleEvacuation: (rtId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  avatarIcon: React.ReactNode;
  status: "idle" | "reasoning" | "calling_tool" | "completed" | "awaiting_approval";
  currentTask: string;
  confidenceScore: number;
  lastOutput?: string;
  nvidiaTech: string;
}

export interface AgentTraceStep {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: "thought" | "tool_call" | "observation" | "message" | "approval_request";
  content: string;
  metadata?: any;
}

export const MultiAgentCenter: React.FC<MultiAgentCenterProps> = ({
  rankedRts,
  sensors,
  selectedRt,
  onSelectRt,
  onDispatchPump,
  onToggleSiren,
  onToggleEvacuation,
  onNavigateToTab,
}) => {
  const currentRt = selectedRt || rankedRts[0] || null;

  // State for autonomous workflow execution
  const [isRunningWorkflow, setIsRunningWorkflow] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workflowState, setWorkflowState] = useState<
    "idle" | "analyzing" | "awaiting_human_approval" | "executed" | "rejected"
  >("idle");

  const [agents, setAgents] = useState<AgentStatus[]>([
    {
      id: "orchestrator",
      name: "Orchestrator-Prime",
      role: "Primary Coordinator Agent",
      avatarIcon: <BrainCircuit className="w-5 h-5 text-fuchsia-600 dark:text-cyan-400" />,
      status: "idle",
      currentTask: "Monitoring DKI Jakarta flood telemetry feed for high-risk anomalies.",
      confidenceScore: 0.98,
      nvidiaTech: "NeMo Agent Framework & TensorRT LLM",
    },
    {
      id: "hydro_risk",
      name: "HydroRisk-Agent",
      role: "GEV & Topographic Specialist",
      avatarIcon: <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      status: "idle",
      currentTask: "Fitting Generalized Extreme Value distributions on BMKG rain telemetry.",
      confidenceScore: 0.95,
      nvidiaTech: "CUDA Accelerated GEV Matrix Math",
    },
    {
      id: "spatial_route",
      name: "SpatialRoute-Agent",
      role: "Safe Route & Shelter Specialist",
      avatarIcon: <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      status: "idle",
      currentTask: "Running graph Dijkstra searches for non-flooded evacuation corridors.",
      confidenceScore: 0.97,
      nvidiaTech: "cuGRAPH GPU Acceleration",
    },
    {
      id: "resource_dispatch",
      name: "LogisticsDispatch-Agent",
      role: "BPBD Resource Allocation",
      avatarIcon: <Truck className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      status: "idle",
      currentTask: "Calculating rescue boat, pump truck, and personnel allocation.",
      confidenceScore: 0.94,
      nvidiaTech: "NVIDIA Triton Inference Server",
    },
    {
      id: "human_oversight",
      name: "HumanOversight-Agent",
      role: "HITL Guardrails & Safety Auditing",
      avatarIcon: <ShieldCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      status: "idle",
      currentTask: "Enforcing Human-in-the-Loop policy locks prior to action execution.",
      confidenceScore: 0.99,
      nvidiaTech: "NeMo Guardrails Safety Alignment",
    },
  ]);

  const [traceLogs, setTraceLogs] = useState<AgentTraceStep[]>([]);

  // Simulation execution steps
  const runAutonomousWorkflow = () => {
    if (!currentRt) return;

    setIsRunningWorkflow(true);
    setWorkflowState("analyzing");
    setCurrentStepIndex(0);
    setTraceLogs([]);

    const timestamp = () => new Date().toLocaleTimeString();

    // Step 1: Primary Orchestrator initiates plan
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === "orchestrator"
            ? {
                ...a,
                status: "reasoning",
                currentTask: `Analyzing threat level for RT ${currentRt.rt_id} (${currentRt.kelurahan}). Decomposing sub-tasks.`,
              }
            : a
        )
      );

      setTraceLogs((prev) => [
        ...prev,
        {
          id: "1",
          timestamp: timestamp(),
          agentId: "orchestrator",
          agentName: "Orchestrator-Prime",
          type: "thought",
          content: `[PLANNING] Incident anomaly detected at RT ${currentRt.rt_id} (${currentRt.kelurahan}). Composite risk score = ${(currentRt.risk_priority_score * 100).toFixed(1)}%. Delegating telemetry analysis to HydroRisk-Agent and route mapping to SpatialRoute-Agent.`,
        },
      ]);
    }, 600);

    // Step 2: HydroRisk Agent execution
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === "hydro_risk"
            ? {
                ...a,
                status: "calling_tool",
                currentTask: "Calculating GEV extreme probability and DEMNAS elevation profile.",
              }
            : a
        )
      );

      setTraceLogs((prev) => [
        ...prev,
        {
          id: "2",
          timestamp: timestamp(),
          agentId: "hydro_risk",
          agentName: "HydroRisk-Agent",
          type: "tool_call",
          content: `[TOOL CALL] calculate_gev_pdf(mu=${(160 + Math.max(0, 5 - currentRt.demnas_elevation_m) * 12).toFixed(1)}, sigma=${(38 + currentRt.interpolated_rainfall_mm_hr * 0.15).toFixed(1)}, xi=0.185)`,
        },
        {
          id: "3",
          timestamp: timestamp(),
          agentId: "hydro_risk",
          agentName: "HydroRisk-Agent",
          type: "observation",
          content: `[OBSERVATION] Exceedance Tail Probability = ${(currentRt.evt_exceedance_prob * 100).toFixed(1)}%. Ground elevation = ${currentRt.demnas_elevation_m.toFixed(1)}m. Severe inundation threat within 15-30 minutes.`,
        },
      ]);
    }, 1800);

    // Step 3: SpatialRoute Agent execution
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === "spatial_route"
            ? {
                ...a,
                status: "calling_tool",
                currentTask: "Searching non-flooded Dijkstra road graph to nearest muster haven.",
              }
            : a.id === "hydro_risk"
            ? { ...a, status: "completed" }
            : a
        )
      );

      setTraceLogs((prev) => [
        ...prev,
        {
          id: "4",
          timestamp: timestamp(),
          agentId: "spatial_route",
          agentName: "SpatialRoute-Agent",
          type: "tool_call",
          content: `[TOOL CALL] find_shortest_safe_corridor(origin_rt="${currentRt.rt_id}", max_depth_m=0.15)`,
        },
        {
          id: "5",
          timestamp: timestamp(),
          agentId: "spatial_route",
          agentName: "SpatialRoute-Agent",
          type: "observation",
          content: `[OBSERVATION] Found Safe Corridor to GOR ${currentRt.kelurahan} Haven (Distance: 1.25km, Safety Index: 98%). Inundated roads avoided.`,
        },
      ]);
    }, 3200);

    // Step 4: LogisticsDispatch Agent execution
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === "resource_dispatch"
            ? {
                ...a,
                status: "calling_tool",
                currentTask: "Calculating emergency resource requirements for displaced population.",
              }
            : a.id === "spatial_route"
            ? { ...a, status: "completed" }
            : a
        )
      );

      const boats = Math.ceil(currentRt.risk_priority_score * 4 + 1);
      const trucks = Math.ceil(currentRt.risk_priority_score * 3 + 1);
      const personnel = Math.ceil(currentRt.risk_priority_score * 12 + 4);

      setTraceLogs((prev) => [
        ...prev,
        {
          id: "6",
          timestamp: timestamp(),
          agentId: "resource_dispatch",
          agentName: "LogisticsDispatch-Agent",
          type: "message",
          content: `[RECOMMENDATION] Formulated Resource Plan: ${boats} Rubber Rescue Boats, ${trucks} Evacuation Trucks, 1 Mobile Pump Unit, and ${personnel} BPBD Personnel.`,
        },
      ]);
    }, 4600);

    // Step 5: Human Oversight Guardrail triggers approval request
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === "human_oversight"
            ? {
                ...a,
                status: "awaiting_approval",
                currentTask: "Awaiting Human-in-the-Loop approval for siren trigger and evacuation dispatch.",
              }
            : a.id === "resource_dispatch"
            ? { ...a, status: "completed" }
            : a.id === "orchestrator"
            ? { ...a, status: "awaiting_approval" }
            : a
        )
      );

      setWorkflowState("awaiting_human_approval");
      setIsRunningWorkflow(false);

      setTraceLogs((prev) => [
        ...prev,
        {
          id: "7",
          timestamp: timestamp(),
          agentId: "human_oversight",
          agentName: "HumanOversight-Agent",
          type: "approval_request",
          content: `[GUARDRAIL LOCK] Multi-agent task execution prepared. System requires Commander approval to activate emergency sirens, deploy evacuation teams, and send broadcasts to Kelurahan ${currentRt.kelurahan}.`,
        },
      ]);

      toast.info("Multi-Agent Response Plan ready! Human approval required.", {
        description: `Inspect proposed actions for RT ${currentRt.rt_id} and approve execution.`,
      });
    }, 6000);
  };

  // Handle Human Approval
  const handleApprovePlan = () => {
    if (!currentRt) return;

    // Execute actions
    onDispatchPump(currentRt.rt_id);
    onToggleEvacuation(currentRt.rt_id);
    if (!currentRt.siren_activated) {
      onToggleSiren(currentRt.rt_id);
    }

    setWorkflowState("executed");
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: "completed",
        currentTask: "Action successfully executed under human authorization.",
      }))
    );

    setTraceLogs((prev) => [
      ...prev,
      {
        id: "8",
        timestamp: new Date().toLocaleTimeString(),
        agentId: "human_oversight",
        agentName: "HumanOversight-Agent",
        type: "observation",
        content: `[HUMAN AUTHORIZATION APPROVED] Commander authorized actions. Emergency sirens activated, mobile pump deployed, and evacuation teams routed. Audit log recorded.`,
      },
    ]);

    toast.success("Autonomous Multi-Agent Orders Executed!", {
      description: `Evacuation teams & sirens activated for RT ${currentRt.rt_id}.`,
    });
  };

  const handleRejectPlan = () => {
    setWorkflowState("rejected");
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: "idle",
        currentTask: "Plan rejected by human commander. Standing by.",
      }))
    );

    setTraceLogs((prev) => [
      ...prev,
      {
        id: "9",
        timestamp: new Date().toLocaleTimeString(),
        agentId: "human_oversight",
        agentName: "HumanOversight-Agent",
        type: "observation",
        content: `[HUMAN REJECTION] Plan rejected by Commander. Autonomous execution aborted. No sirens or dispatches triggered.`,
      },
    ]);

    toast.warning("Multi-Agent Plan Aborted by Human Operator.");
  };

  return (
    <div className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6 font-mono text-xs">
      {/* Top Banner & Challenge Alignment Badge */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-900 to-fuchsia-950 dark:from-[#060a12] dark:via-[#080d1a] dark:to-[#1a0928] border border-stone-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-fuchsia-400 dark:text-cyan-400 text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4" /> Autonomous Multi-Agent Command Center • NVIDIA AI
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
              Jakarta Flood Incident Agentic Matrix
            </h1>
            <p className="text-stone-300 dark:text-slate-300 text-xs leading-relaxed font-sans">
              Primary coordinator agent orchestrating 4 specialized sub-agents to analyze GEV flood hydrology, search safe corridors, calculate rescue logistics, and enforce Human-in-the-Loop safety guardrails.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={runAutonomousWorkflow}
              disabled={isRunningWorkflow}
              className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isRunningWorkflow
                  ? "bg-stone-700 text-stone-300 cursor-not-allowed"
                  : "bg-fuchsia-600 hover:bg-fuchsia-500 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950"
              }`}
            >
              {isRunningWorkflow ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Agents Collaborating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Trigger Autonomous Response
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Target Sector Selector Bar */}
      <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-fuchsia-600 dark:text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-bold block">
              Target Incident Sector
            </span>
            <span className="font-bold text-sm text-stone-900 dark:text-white">
              {currentRt ? `RT ${currentRt.rt_id} (${currentRt.kelurahan})` : "Select Sector"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <span className="text-[10px] text-stone-400 uppercase font-bold shrink-0">
            Quick Select Top Sector:
          </span>
          {rankedRts.slice(0, 5).map((rt) => {
            const isSel = currentRt?.rt_id === rt.rt_id;
            return (
              <button
                key={rt.rt_id}
                onClick={() => onSelectRt(rt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer ${
                  isSel
                    ? "bg-fuchsia-600 text-white dark:bg-cyan-500 dark:text-slate-950 border-fuchsia-600 dark:border-cyan-400 shadow-sm"
                    : "bg-stone-50 dark:bg-slate-900 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:border-fuchsia-300"
                }`}
              >
                RT {rt.rt_id} ({(rt.risk_priority_score * 100).toFixed(0)}%)
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: Agent Roster & Real-Time Collaboration Trace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 cols: Agent Roster & State */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 dark:text-white text-sm uppercase flex items-center gap-2">
              <Bot className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
              Specialized Agent Ensemble ({agents.length})
            </h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              ● All Agents Operational
            </span>
          </div>

          <div className="space-y-3">
            {agents.map((agent) => {
              let statusBg =
                "bg-stone-50 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800";
              let badgeColor =
                "bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-400";

              if (agent.status === "reasoning") {
                statusBg =
                  "bg-fuchsia-50/80 dark:bg-cyan-950/40 border-fuchsia-300 dark:border-cyan-700 shadow-sm";
                badgeColor = "bg-fuchsia-600 text-white dark:bg-cyan-500 dark:text-slate-950 animate-pulse";
              } else if (agent.status === "calling_tool") {
                statusBg =
                  "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm";
                badgeColor = "bg-amber-500 text-white font-bold";
              } else if (agent.status === "awaiting_approval") {
                statusBg =
                  "bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 shadow-sm";
                badgeColor = "bg-rose-600 text-white font-bold animate-bounce";
              } else if (agent.status === "completed") {
                statusBg =
                  "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800";
                badgeColor = "bg-emerald-600 text-white font-bold";
              }

              return (
                <div
                  key={agent.id}
                  className={`p-4 rounded-2xl border transition-all ${statusBg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 shrink-0">
                        {agent.avatarIcon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-900 dark:text-white text-xs">
                            {agent.name}
                          </h4>
                          <span className="text-[10px] text-stone-500 dark:text-slate-400">
                            ({agent.role})
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 dark:text-slate-300 mt-1 font-sans">
                          {agent.currentTask}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 font-bold ${badgeColor}`}
                    >
                      {agent.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-stone-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-fuchsia-700 dark:text-cyan-400 font-semibold">
                      <Cpu className="w-3 h-3" /> {agent.nvidiaTech}
                    </span>
                    <span>Confidence: {(agent.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 6 cols: Live Inter-Agent Trace & Human Approval Interface */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 dark:text-white text-sm uppercase flex items-center gap-2">
              <Terminal className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
              Agent Reasoning & Collaboration Trace
            </h3>
            {traceLogs.length > 0 && (
              <span className="text-[10px] text-stone-400">
                {traceLogs.length} Events Logged
              </span>
            )}
          </div>

          {/* HITL Approval Request Box (When awaiting human decision) */}
          {workflowState === "awaiting_human_approval" && currentRt && (
            <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-400 dark:border-amber-600 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-300 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Human-in-the-Loop Action Approval Required</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/80 text-xs text-stone-800 dark:text-slate-200 space-y-2 font-sans">
                <p className="font-bold text-stone-900 dark:text-white">
                  Proposed Multi-Agent Tactical Directive for RT {currentRt.rt_id} ({currentRt.kelurahan}):
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-stone-700 dark:text-slate-300">
                  <li><strong>Emergency Siren:</strong> Activate sirens at 110dB for flood surge warning.</li>
                  <li><strong>Mobile Pumps:</strong> Dispatch 1 high-capacity mobile pump unit.</li>
                  <li><strong>Evacuation Roster:</strong> Deploy rescue team to route residents along Dijkstra Safe Corridor to GOR {currentRt.kelurahan}.</li>
                  <li><strong>Logistics:</strong> Allocate 4 rubber rescue boats & 3 BPBD trucks.</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprovePlan}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Approve & Execute Directives
                </button>
                <button
                  onClick={handleRejectPlan}
                  className="px-4 py-3 rounded-2xl bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" /> Reject Order
                </button>
              </div>
            </div>
          )}

          {/* Trace Terminal Log Stream */}
          <div className="bg-stone-950 dark:bg-[#060a14] border border-stone-800 dark:border-slate-800/90 rounded-3xl p-4 min-h-[380px] max-h-[520px] overflow-y-auto space-y-3 font-mono text-[11px] text-slate-200 shadow-xl relative">
            {/* Terminal Header Bar */}
            <div className="flex items-center justify-between border-b border-stone-800 dark:border-slate-800/80 pb-2.5 mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-[10px] text-stone-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                  NVIDIA NeMo Agentic Runtime Terminal
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-bold">STREAM ACTIVE</span>
              </div>
            </div>

            {traceLogs.length === 0 ? (
              <div className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center space-y-3">
                <div className="p-3.5 rounded-2xl bg-stone-900 dark:bg-slate-900 border border-stone-800 dark:border-slate-800 text-fuchsia-400 dark:text-cyan-400 shadow-md">
                  <BrainCircuit className="w-8 h-8 animate-pulse" />
                </div>
                <div className="max-w-md space-y-1.5">
                  <h4 className="text-stone-200 dark:text-slate-200 font-bold text-xs uppercase tracking-wide">
                    Agent Collaboration Engine Ready
                  </h4>
                  <p className="text-stone-400 dark:text-slate-400 text-xs leading-relaxed font-sans">
                    Click <strong className="text-fuchsia-400 dark:text-cyan-400">"Trigger Autonomous Response"</strong> above to observe real-time agent reasoning, tool execution, and guardrail locks.
                  </p>
                </div>
              </div>
            ) : (
              traceLogs.map((log) => {
                let badge = "bg-stone-800 text-stone-300 border-stone-700";
                let cardBg = "bg-stone-900/90 dark:bg-slate-900/80 border-stone-800 dark:border-slate-800";
                let agentColor = "text-cyan-400";

                if (log.type === "thought") {
                  badge = "bg-fuchsia-950/90 text-fuchsia-300 border border-fuchsia-700";
                  cardBg = "bg-fuchsia-950/30 dark:bg-fuchsia-950/20 border-fuchsia-800/60";
                  agentColor = "text-fuchsia-400";
                } else if (log.type === "tool_call") {
                  badge = "bg-amber-950/90 text-amber-300 border border-amber-700";
                  cardBg = "bg-amber-950/30 dark:bg-amber-950/20 border-amber-800/60";
                  agentColor = "text-amber-400";
                } else if (log.type === "observation") {
                  badge = "bg-emerald-950/90 text-emerald-300 border border-emerald-700";
                  cardBg = "bg-emerald-950/30 dark:bg-emerald-950/20 border-emerald-800/60";
                  agentColor = "text-emerald-400";
                } else if (log.type === "approval_request") {
                  badge = "bg-rose-950 text-rose-300 border border-rose-600 animate-pulse font-bold";
                  cardBg = "bg-rose-950/40 dark:bg-rose-950/30 border-rose-700/80";
                  agentColor = "text-rose-400";
                }

                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-2xl border ${cardBg} space-y-2 animate-in fade-in duration-200 shadow-sm`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`font-bold ${agentColor} flex items-center gap-1.5`}>
                        <Bot className="w-3.5 h-3.5" />
                        {log.agentName}
                      </span>
                      <span className="text-stone-400 dark:text-slate-400 font-mono">{log.timestamp}</span>
                    </div>

                    <div className="text-xs leading-relaxed text-stone-100 dark:text-slate-100 font-sans">
                      {log.content}
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${badge}`}>
                        {log.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
