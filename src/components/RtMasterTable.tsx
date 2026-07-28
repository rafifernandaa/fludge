import React, { useState, useMemo } from "react";
import {
  Table,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Building2,
  AlertTriangle,
  Radio,
  Truck,
  ShieldAlert,
  Download,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import { NeighborhoodRT } from "../types";
import { toast } from "sonner";
import { PlaceExplanationCard } from "./PlaceExplanationCard";

interface RtMasterTableProps {
  rankedRts: NeighborhoodRT[];
  selectedRt: NeighborhoodRT | null;
  onSelectRt: (rt: NeighborhoodRT) => void;
  onNavigateToMap: (rt: NeighborhoodRT) => void;
  onNavigateToDispatch: (rt: NeighborhoodRT) => void;
  onToggleSiren: (rtId: string) => void;
  isDarkMode: boolean;
}

export const RtMasterTable: React.FC<RtMasterTableProps> = ({
  rankedRts,
  selectedRt,
  onSelectRt,
  onNavigateToMap,
  onNavigateToDispatch,
  onToggleSiren,
  isDarkMode,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<
    "all" | "critical" | "high" | "moderate"
  >("all");
  const [kelurahanFilter, setKelurahanFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "risk_desc" | "risk_asc" | "pop_desc" | "elev_asc" | "rt_id" | "kelurahan"
  >("risk_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Extract unique Kelurahans for filter dropdown
  const uniqueKelurahans = useMemo(() => {
    const set = new Set<string>();
    rankedRts.forEach((rt) => {
      if (rt.kelurahan) set.add(rt.kelurahan);
    });
    return Array.from(set).sort();
  }, [rankedRts]);

  // Overall Statistics Summary
  const stats = useMemo(() => {
    const total = rankedRts.length;
    let critical = 0;
    let high = 0;
    let moderate = 0;
    let totalElev = 0;

    rankedRts.forEach((rt) => {
      totalElev += rt.demnas_elevation_m;
      if (rt.risk_priority_score >= 0.75) {
        critical++;
      } else if (rt.risk_priority_score >= 0.5) {
        high++;
      } else {
        moderate++;
      }
    });

    const avgElev = total > 0 ? (totalElev / total).toFixed(1) : "0.0";

    return {
      total,
      critical,
      high,
      moderate,
      avgElev,
    };
  }, [rankedRts]);

  // Filter and Sort Pipeline
  const filteredAndSortedRts = useMemo(() => {
    let list = [...rankedRts];

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      list = list.filter(
        (rt) =>
          rt.rt_id.toLowerCase().includes(query) ||
          rt.kelurahan.toLowerCase().includes(query) ||
          (rt.associated_sensor_id &&
            rt.associated_sensor_id.toLowerCase().includes(query))
      );
    }

    // Risk Level filter
    if (riskFilter === "critical") {
      list = list.filter((rt) => rt.risk_priority_score >= 0.75);
    } else if (riskFilter === "high") {
      list = list.filter(
        (rt) =>
          rt.risk_priority_score >= 0.5 && rt.risk_priority_score < 0.75
      );
    } else if (riskFilter === "moderate") {
      list = list.filter((rt) => rt.risk_priority_score < 0.5);
    }

    // Kelurahan filter
    if (kelurahanFilter !== "all") {
      list = list.filter((rt) => rt.kelurahan === kelurahanFilter);
    }

    // Sort order
    if (sortBy === "risk_asc") {
      list.sort((a, b) => a.risk_priority_score - b.risk_priority_score);
    } else if (sortBy === "pop_desc") {
      list.sort(
        (a, b) => (b.population_density || 0) - (a.population_density || 0)
      );
    } else if (sortBy === "elev_asc") {
      list.sort((a, b) => a.demnas_elevation_m - b.demnas_elevation_m);
    } else if (sortBy === "rt_id") {
      list.sort((a, b) => a.rt_id.localeCompare(b.rt_id));
    } else if (sortBy === "kelurahan") {
      list.sort((a, b) => a.kelurahan.localeCompare(b.kelurahan));
    } else {
      // Default risk_desc: already sorted by risk_priority_score descending
      list.sort((a, b) => b.risk_priority_score - a.risk_priority_score);
    }

    return list;
  }, [rankedRts, searchTerm, riskFilter, kelurahanFilter, sortBy]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, riskFilter, kelurahanFilter, sortBy, pageSize]);

  // Pagination calculation
  const totalItems = filteredAndSortedRts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(totalItems, pageStart + pageSize);
  const currentRows = useMemo(() => {
    return filteredAndSortedRts.slice(pageStart, pageEnd);
  }, [filteredAndSortedRts, pageStart, pageEnd]);

  // Export filtered dataset to CSV
  const exportTableCsv = () => {
    const headers = [
      "Rank",
      "RT ID",
      "Kelurahan",
      "Risk Score (%)",
      "DEMNAS Elev (m)",
      "Rainfall (mm/hr)",
      "Population",
      "Sensor ID",
      "Siren Active",
      "Dispatched",
    ];

    const rows = filteredAndSortedRts.map((rt, idx) => [
      idx + 1,
      `"${rt.rt_id}"`,
      `"${rt.kelurahan}"`,
      (rt.risk_priority_score * 100).toFixed(1),
      rt.demnas_elevation_m.toFixed(1),
      rt.interpolated_rainfall_mm_hr.toFixed(1),
      rt.population_density || 1000,
      `"${rt.associated_sensor_id || "-"}"`,
      rt.siren_activated ? "YES" : "NO",
      rt.dispatched ? "YES" : "NO",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `jakarta_rt_directory_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${totalItems.toLocaleString()} RT records to CSV`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-4 lg:p-6 space-y-4 max-w-7xl mx-auto w-full">
      {/* Header Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-stone-200 dark:border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-fuchsia-600 dark:text-cyan-400" />
            <h2 className="text-xl md:text-2xl font-bold font-mono text-stone-900 dark:text-white uppercase tracking-tight">
              RT Neighborhood Master Directory
            </h2>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-fuchsia-100 dark:bg-cyan-950 text-fuchsia-800 dark:text-cyan-300 border border-fuchsia-200 dark:border-cyan-800">
              {stats.total.toLocaleString()} RT Units
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 font-mono">
            Full-spectrum real-time hydrological risk rankings, elevation metrics, and tactical controls across DKI Jakarta.
          </p>
        </div>

        <button
          onClick={exportTableCsv}
          className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-mono font-bold flex items-center gap-2 shadow-sm hover:bg-stone-800 dark:hover:bg-cyan-400 cursor-pointer shrink-0 transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV ({totalItems.toLocaleString()})
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 font-mono text-xs">
        <div className="p-3 bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="text-stone-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
            Total Monitored RTs
          </div>
          <div className="text-xl font-bold text-stone-900 dark:text-white mt-1">
            {stats.total.toLocaleString()}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">100% Coverage</div>
        </div>

        <div className="p-3 bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="text-stone-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
            Critical Risk (≥75%)
          </div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {stats.critical.toLocaleString()}
          </div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">
            {((stats.critical / stats.total) * 100).toFixed(1)}% of total
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="text-stone-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
            High Risk (50-74%)
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats.high.toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">
            {((stats.high / stats.total) * 100).toFixed(1)}% of total
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="text-stone-500 dark:text-slate-400 text-[10px] uppercase font-semibold">
            Avg DEMNAS Elevation
          </div>
          <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
            {stats.avgElev} m
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5">Below Sea Level in Coastal North</div>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm shrink-0 flex flex-col md:flex-row gap-3 items-center justify-between font-mono text-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search RT ID, Kelurahan, Sensor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 dark:focus:border-cyan-400 text-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={riskFilter}
              onChange={(e: any) => setRiskFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-200 text-xs focus:outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="critical">Critical (≥ 75%)</option>
              <option value="high">High (50% - 74%)</option>
              <option value="moderate">Moderate / Low (&lt; 50%)</option>
            </select>
          </div>

          {/* Kelurahan Filter */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={kelurahanFilter}
              onChange={(e) => setKelurahanFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-200 text-xs focus:outline-none max-w-[150px] truncate"
            >
              <option value="all">All Kelurahans</option>
              {uniqueKelurahans.map((kel) => (
                <option key={kel} value={kel}>
                  {kel}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-200 text-xs focus:outline-none"
            >
              <option value="risk_desc">Sort: Risk Score (High → Low)</option>
              <option value="risk_asc">Sort: Risk Score (Low → High)</option>
              <option value="pop_desc">Sort: Population (High → Low)</option>
              <option value="elev_asc">Sort: Elevation (Lowest First)</option>
              <option value="rt_id">Sort: RT ID</option>
              <option value="kelurahan">Sort: Kelurahan Name</option>
            </select>
          </div>

          {/* Rows per page */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-stone-800 dark:text-slate-200 text-xs focus:outline-none"
          >
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={250}>250 rows</option>
          </select>
        </div>
      </div>

      {/* Main RT Data Table Container */}
      <div className="flex-1 bg-white dark:bg-[#080d1a] border border-stone-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-stone-100 dark:bg-[#0f172a] text-stone-600 dark:text-slate-300 uppercase text-[10px] tracking-wider border-b border-stone-200 dark:border-slate-800 shadow-sm">
              <tr>
                <th className="p-3 pl-4">Rank</th>
                <th className="p-3">RT Unit ID</th>
                <th className="p-3">Kelurahan</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Elevation</th>
                <th className="p-3">Rainfall</th>
                <th className="p-3">Population</th>
                <th className="p-3">River Sensor</th>
                <th className="p-3 text-center">Sirens & Dispatches</th>
                <th className="p-3 text-right pr-4">Tactical Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60">
              {currentRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="p-12 text-center text-stone-400 dark:text-slate-500 font-mono"
                  >
                    No RT units matched your current filter criteria.
                  </td>
                </tr>
              ) : (
                currentRows.map((rt) => {
                  const actualRank =
                    rankedRts.findIndex((r) => r.rt_id === rt.rt_id) + 1;
                  const isSelected = selectedRt?.rt_id === rt.rt_id;
                  const scorePct = (rt.risk_priority_score * 100).toFixed(1);

                  // Risk color styling
                  let riskColorClass = "text-emerald-600 dark:text-emerald-400";
                  let riskBadgeClass =
                    "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50";
                  let riskLabel = "LOW";

                  if (rt.risk_priority_score >= 0.75) {
                    riskColorClass = "text-rose-600 dark:text-rose-400 font-bold";
                    riskBadgeClass =
                      "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800";
                    riskLabel = "CRITICAL";
                  } else if (rt.risk_priority_score >= 0.5) {
                    riskColorClass = "text-amber-600 dark:text-amber-400 font-bold";
                    riskBadgeClass =
                      "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800";
                    riskLabel = "HIGH";
                  }

                  return (
                    <tr
                      key={rt.rt_id}
                      onClick={() => onSelectRt(rt)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-fuchsia-50/80 dark:bg-cyan-950/30 font-semibold"
                          : "hover:bg-stone-50 dark:hover:bg-slate-900/60"
                      }`}
                    >
                      {/* Rank */}
                      <td className="p-3 pl-4 text-stone-400 dark:text-slate-500 font-bold">
                        #{actualRank}
                      </td>

                      {/* RT ID */}
                      <td className="p-3 font-bold text-stone-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-fuchsia-600 dark:text-cyan-400 shrink-0" />
                          <span>{rt.rt_id}</span>
                        </div>
                      </td>

                      {/* Kelurahan */}
                      <td className="p-3 text-stone-700 dark:text-slate-300">
                        {rt.kelurahan}
                      </td>

                      {/* Risk Score */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${riskColorClass}`}>
                            {scorePct}%
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${riskBadgeClass}`}
                          >
                            {riskLabel}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-24 bg-stone-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${
                              rt.risk_priority_score >= 0.75
                                ? "bg-rose-500"
                                : rt.risk_priority_score >= 0.5
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${scorePct}%` }}
                          />
                        </div>
                      </td>

                      {/* DEMNAS Elevation */}
                      <td className="p-3 text-stone-700 dark:text-slate-300">
                        <span
                          className={
                            rt.demnas_elevation_m < 2.0
                              ? "text-rose-600 dark:text-rose-400 font-bold"
                              : ""
                          }
                        >
                          {rt.demnas_elevation_m.toFixed(1)} m
                        </span>
                      </td>

                      {/* Rainfall */}
                      <td className="p-3 text-stone-700 dark:text-slate-300">
                        {rt.interpolated_rainfall_mm_hr.toFixed(1)} mm/h
                      </td>

                      {/* Population */}
                      <td className="p-3 text-stone-700 dark:text-slate-300">
                        {(rt.population_density || 1000).toLocaleString()}
                      </td>

                      {/* Sensor */}
                      <td className="p-3 text-stone-500 dark:text-slate-400 text-[11px]">
                        {rt.associated_sensor_id || "-"}
                      </td>

                      {/* Sirens & Dispatches */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {rt.siren_activated ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold text-[9px] animate-pulse">
                              SIREN ON
                            </span>
                          ) : null}
                          {rt.dispatched ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[9px]">
                              TEAM DISPATCHED
                            </span>
                          ) : null}
                          {!rt.siren_activated && !rt.dispatched && (
                            <span className="text-stone-400 dark:text-slate-600 text-[10px]">
                              Standby
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect GEV & Hydrology Explanation Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRt(rt);
                            }}
                            title="Inspect Place GEV Curve & Hydrological Explanation"
                            className="px-2 py-1 rounded-lg bg-fuchsia-100 dark:bg-cyan-950/80 hover:bg-fuchsia-200 dark:hover:bg-cyan-900 text-fuchsia-900 dark:text-cyan-300 border border-fuchsia-200 dark:border-cyan-800 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Info className="w-3 h-3 text-fuchsia-600 dark:text-cyan-400" />
                            Inspect
                          </button>

                          {/* Map jump button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToMap(rt);
                            }}
                            title="Focus on GIS Command Map"
                            className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-[10px] font-bold flex items-center gap-1 transition-all"
                          >
                            <Eye className="w-3 h-3 text-fuchsia-600 dark:text-cyan-400" />
                            Map
                          </button>

                          {/* Dispatch button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToDispatch(rt);
                            }}
                            title="Open Evacuation & Dispatch Roster"
                            className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-[10px] font-bold flex items-center gap-1 transition-all"
                          >
                            <Truck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Evac
                          </button>

                          {/* Siren toggle */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSiren(rt.rt_id);
                            }}
                            title="Toggle Local Emergency Siren"
                            className={`p-1 rounded-lg border transition-all ${
                              rt.siren_activated
                                ? "bg-rose-600 text-white border-rose-700"
                                : "bg-stone-100 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-400 hover:text-rose-600"
                            }`}
                          >
                            <Radio className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-stone-50 dark:bg-[#0f172a] border-t border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-stone-600 dark:text-slate-400 shrink-0">
          <div>
            Showing{" "}
            <span className="font-bold text-stone-900 dark:text-white">
              {totalItems > 0 ? pageStart + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-bold text-stone-900 dark:text-white">
              {pageEnd}
            </span>{" "}
            of{" "}
            <span className="font-bold text-stone-900 dark:text-white">
              {totalItems.toLocaleString()}
            </span>{" "}
            RT Units
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-800 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-800 dark:text-slate-200 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span>
              Page <strong className="text-stone-900 dark:text-white">{currentPage}</strong> of{" "}
              <strong className="text-stone-900 dark:text-white">{totalPages}</strong>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-800 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-800 dark:text-slate-200 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Place Explanation Drawer/Modal */}
      {selectedRt && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <PlaceExplanationCard
              rt={selectedRt}
              onNavigateToMap={onNavigateToMap}
              onNavigateToDispatch={onNavigateToDispatch}
              onToggleSiren={onToggleSiren}
              onClose={() => onSelectRt(null as any)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
