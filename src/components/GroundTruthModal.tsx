import React, { useState } from "react";
import { RiverSensor, NeighborhoodRT } from "../types";
import {
  Camera,
  AlertTriangle,
  Users,
  MapPin,
  X,
  Video,
  Upload,
  CheckCircle2,
  Eye,
  ShieldAlert,
  Radio,
  Play,
  Maximize2,
  RefreshCw,
  Zap,
  Sliders,
  Sparkles,
  FileText,
  Plus,
  Send,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

export interface CitizenReportItem {
  id: string;
  citizenName: string;
  rtRw: string;
  kelurahan: string;
  type: "photo" | "video";
  mediaUrl: string;
  title: string;
  description: string;
  urgency: "URGENT" | "WARNING" | "INFO";
  timestamp: string;
  gpsVerified: boolean;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "ACTIONED";
}

export interface CctvCamera {
  id: string;
  name: string;
  location: string;
  lat: number;
  lon: number;
  waterLevelCm: number;
  status: "ONLINE" | "MAINTENANCE" | "OFFLINE";
  videoStreamUrl: string;
  alertLevel: "NORMAL" | "ALERT_3" | "ALERT_2" | "ALERT_1";
}

interface GroundTruthModalProps {
  sensor?: RiverSensor | null;
  rt?: NeighborhoodRT | null;
  onClose: () => void;
  isOpen?: boolean;
}

export const GroundTruthModal: React.FC<GroundTruthModalProps> = ({
  sensor,
  rt,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"cctv" | "citizen">("citizen");

  // Initial Citizen Reports with Photo & Video attachments
  const [citizenReports, setCitizenReports] = useState<CitizenReportItem[]>([
    {
      id: "REP-9081",
      citizenName: "Ibu Kartini",
      rtRw: "RT 004 / RW 002",
      kelurahan: "Rawajati",
      type: "photo",
      mediaUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80",
      title: "Water overflow entering houses (40cm depth)",
      description: "Ciliwung river overflowed 15 mins ago. Water level rising quickly in alleyways near the riverbank. Need assistance moving senior citizens to evacuation shelter.",
      urgency: "URGENT",
      timestamp: "3 mins ago",
      gpsVerified: true,
      status: "VERIFIED",
    },
    {
      id: "REP-9082",
      citizenName: "Pak Budi Santoso",
      rtRw: "RT 008 / RW 005",
      kelurahan: "Kampung Melayu",
      type: "video",
      mediaUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80",
      title: "Main road submerged, motorcycles stalled",
      description: "Jl. Otista III inundation depth reaches 55cm. Traffic completely halted. Floodgate appears stuck with tree debris.",
      urgency: "URGENT",
      timestamp: "8 mins ago",
      gpsVerified: true,
      status: "PENDING_VERIFICATION",
    },
    {
      id: "REP-9083",
      citizenName: "Mas Ahmad",
      rtRw: "RT 002 / RW 001",
      kelurahan: "Bidara Cina",
      type: "photo",
      mediaUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=800&q=80",
      title: "Embankment crack observed near floodgate",
      description: "Spotted seepage along the concrete embankment near post 2. Water trickling into residential perimeter.",
      urgency: "WARNING",
      timestamp: "18 mins ago",
      gpsVerified: true,
      status: "VERIFIED",
    },
  ]);

  // Modal for operator adding new citizen report input
  const [showAddReportForm, setShowAddReportForm] = useState(false);
  const [newReport, setNewReport] = useState({
    citizenName: "",
    rtRw: "RT 004 / RW 002",
    kelurahan: "Rawajati",
    type: "photo" as "photo" | "video",
    title: "",
    description: "",
    urgency: "URGENT" as "URGENT" | "WARNING" | "INFO",
    mediaUrl: "",
  });

  // CCTV Camera List across key locations
  const [cameras] = useState<CctvCamera[]>([
    {
      id: "CAM-01",
      name: "Manggarai Floodgate Upper Cam",
      location: "Pintu Air Manggarai, Tebet",
      lat: -6.2088,
      lon: 106.8456,
      waterLevelCm: 840,
      status: "ONLINE",
      videoStreamUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80",
      alertLevel: "ALERT_2",
    },
    {
      id: "CAM-02",
      name: "Katulampa Weir Gate Stream",
      location: "Bendung Katulampa, Bogor/Ciliwung",
      lat: -6.634,
      lon: 106.836,
      waterLevelCm: 180,
      status: "ONLINE",
      videoStreamUrl: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80",
      alertLevel: "ALERT_1",
    },
    {
      id: "CAM-03",
      name: "Karet Sluice Gate Cam",
      location: "Pintu Air Karet, Tanah Abang",
      lat: -6.201,
      lon: 106.818,
      waterLevelCm: 560,
      status: "ONLINE",
      videoStreamUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80",
      alertLevel: "ALERT_3",
    },
    {
      id: "CAM-04",
      name: "Pluit Coastal Polder Station",
      location: "Waduk Pluit, Penjaringan",
      lat: -6.115,
      lon: 106.798,
      waterLevelCm: -110,
      status: "ONLINE",
      videoStreamUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
      alertLevel: "NORMAL",
    },
  ]);

  const [selectedCamId, setSelectedCamId] = useState<string>("CAM-01");
  const [isNightVision, setIsNightVision] = useState(false);
  const [isThermalOverlay, setIsThermalOverlay] = useState(false);

  const selectedCam = cameras.find((c) => c.id === selectedCamId) || cameras[0];

  // Handle adding new report from citizen
  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.title || !newReport.citizenName) {
      toast.error("Please fill in report title and citizen name.");
      return;
    }

    const defaultImage =
      newReport.type === "photo"
        ? "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80"
        : "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80";

    const newItem: CitizenReportItem = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      citizenName: newReport.citizenName,
      rtRw: newReport.rtRw,
      kelurahan: newReport.kelurahan,
      type: newReport.type,
      mediaUrl: newReport.mediaUrl || defaultImage,
      title: newReport.title,
      description: newReport.description || "Field report submitted by resident.",
      urgency: newReport.urgency,
      timestamp: "Just now",
      gpsVerified: true,
      status: "VERIFIED",
    };

    setCitizenReports([newItem, ...citizenReports]);
    setShowAddReportForm(false);
    setNewReport({
      citizenName: "",
      rtRw: "RT 004 / RW 002",
      kelurahan: "Rawajati",
      type: "photo",
      title: "",
      description: "",
      urgency: "URGENT",
      mediaUrl: "",
    });

    toast.success("Citizen Field Report Uploaded & Verified!", {
      description: `Report ${newItem.id} logged for ${newItem.rtRw} (${newItem.kelurahan}).`,
    });
  };

  const handleVerifyReport = (id: string) => {
    setCitizenReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "VERIFIED", gpsVerified: true } : r))
    );
    toast.success("GPS & Timestamp Verified by Command Operator!");
  };

  const handleSnapshotCam = () => {
    toast.success(`CCTV Snapshot Captured from ${selectedCam.name}`, {
      description: "Frame saved to incident evidence log.",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-md">
      <div className="bg-white dark:bg-[#080d1a] text-stone-900 dark:text-white rounded-3xl shadow-2xl w-full max-w-5xl border border-stone-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] font-mono text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-[#060a12]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-600 dark:text-cyan-400 border border-fuchsia-200 dark:border-fuchsia-800">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono text-stone-900 dark:text-white flex items-center gap-2">
                Citizen Intel & Live CCTV Surveillance
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-slate-400 font-sans mt-0.5">
                {sensor ? `Target Sensor: ${sensor.name}` : rt ? `Target Sector: RT ${rt.rt_id} (${rt.kelurahan})` : "DKI Jakarta Provincial Field Observation Feeds"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 bg-stone-100/60 dark:bg-slate-900/40 px-4 pt-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("citizen")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "citizen"
                  ? "bg-white dark:bg-[#080d1a] text-fuchsia-600 dark:text-cyan-400 border-t-2 border-fuchsia-600 dark:border-cyan-400 shadow-sm"
                  : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <Users className="w-4 h-4" />
              Citizen Reports ({citizenReports.length})
            </button>

            <button
              onClick={() => setActiveTab("cctv")}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "cctv"
                  ? "bg-white dark:bg-[#080d1a] text-fuchsia-600 dark:text-cyan-400 border-t-2 border-fuchsia-600 dark:border-cyan-400 shadow-sm"
                  : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
              }`}
            >
              <Video className="w-4 h-4" />
              Live CCTV Cameras ({cameras.length})
            </button>
          </div>

          {activeTab === "citizen" && (
            <button
              onClick={() => setShowAddReportForm(true)}
              className="mb-2 px-3 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Citizen Report
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto bg-stone-50/50 dark:bg-slate-950/50">
          {activeTab === "citizen" ? (
            <div className="space-y-4">
              {/* Add Report Form Modal */}
              {showAddReportForm && (
                <form
                  onSubmit={handleCreateReport}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-fuchsia-400 dark:border-cyan-500 space-y-3 font-sans shadow-lg animate-in zoom-in-95 duration-200"
                >
                  <div className="flex items-center justify-between border-b pb-2 border-stone-200 dark:border-slate-800">
                    <span className="font-bold text-stone-900 dark:text-white text-xs font-mono uppercase flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400" />
                      Log New Citizen Photo / Video Report
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddReportForm(false)}
                      className="text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                        Resident Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ibu Kartini"
                        value={newReport.citizenName}
                        onChange={(e) => setNewReport({ ...newReport, citizenName: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                        RT / RW Location
                      </label>
                      <input
                        type="text"
                        value={newReport.rtRw}
                        onChange={(e) => setNewReport({ ...newReport, rtRw: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                        Kelurahan
                      </label>
                      <input
                        type="text"
                        value={newReport.kelurahan}
                        onChange={(e) => setNewReport({ ...newReport, kelurahan: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                        Media Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewReport({ ...newReport, type: "photo" })}
                          className={`flex-1 py-1.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                            newReport.type === "photo"
                              ? "bg-fuchsia-600 text-white dark:bg-cyan-500 dark:text-slate-950 border-fuchsia-600 dark:border-cyan-400"
                              : "bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300"
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" /> Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewReport({ ...newReport, type: "video" })}
                          className={`flex-1 py-1.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                            newReport.type === "video"
                              ? "bg-fuchsia-600 text-white dark:bg-cyan-500 dark:text-slate-950 border-fuchsia-600 dark:border-cyan-400"
                              : "bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300"
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" /> Video Clip
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                        Urgency Tag
                      </label>
                      <select
                        value={newReport.urgency}
                        onChange={(e) =>
                          setNewReport({
                            ...newReport,
                            urgency: e.target.value as "URGENT" | "WARNING" | "INFO",
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white font-mono focus:outline-none"
                      >
                        <option value="URGENT">URGENT (Immediate Inundation)</option>
                        <option value="WARNING">WARNING (Rising Water / Seepage)</option>
                        <option value="INFO">INFO (Road Block / General Observation)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                      Report Headline
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ciliwung water level 45cm inside alleyway"
                      value={newReport.title}
                      onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                      Detailed Citizen Note
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe water depth, victims needing evac, or damage..."
                      value={newReport.description}
                      onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddReportForm(false)}
                      className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Send className="w-4 h-4" /> Submit Report
                    </button>
                  </div>
                </form>
              )}

              {/* List of Citizen Reports */}
              {citizenReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 relative overflow-hidden"
                >
                  {/* Urgency Color Bar */}
                  <div
                    className={`absolute top-0 left-0 w-1.5 h-full ${
                      report.urgency === "URGENT"
                        ? "bg-rose-500"
                        : report.urgency === "WARNING"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                    }`}
                  />

                  {/* Media Thumbnail or Video Box */}
                  <div className="w-full md:w-56 aspect-video bg-stone-900 rounded-xl relative overflow-hidden shrink-0 group">
                    <img
                      src={report.mediaUrl}
                      alt={report.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80";
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-stone-950/30 flex items-center justify-center">
                      {report.type === "video" ? (
                        <div className="p-2.5 rounded-full bg-stone-950/80 text-white border border-white/30 backdrop-blur-sm">
                          <Play className="w-5 h-5 fill-current" />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-full bg-stone-950/80 text-white border border-white/30 backdrop-blur-sm">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <span className="absolute bottom-2 left-2 text-[10px] font-mono text-white bg-stone-950/80 px-2 py-0.5 rounded-md backdrop-blur-sm uppercase">
                      {report.type} • {report.id}
                    </span>
                  </div>

                  {/* Report Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-stone-900 dark:text-white text-sm font-sans">
                          {report.title}
                        </h3>
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                            report.urgency === "URGENT"
                              ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                              : report.urgency === "WARNING"
                              ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                              : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800"
                          }`}
                        >
                          {report.urgency}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-slate-300 font-sans leading-relaxed">
                        "{report.description}"
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 dark:text-slate-400 font-mono mt-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-fuchsia-600 dark:text-cyan-400" />
                          {report.citizenName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-fuchsia-600 dark:text-cyan-400" />
                          {report.rtRw} ({report.kelurahan})
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-stone-400">
                      <span>Submitted: {report.timestamp} • GPS Pinpoint Verified</span>

                      {report.status === "VERIFIED" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> GPS & Operator Verified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleVerifyReport(report.id)}
                          className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold hover:bg-amber-200 cursor-pointer"
                        >
                          Verify Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* CCTV Surveillance Grid Tab */
            <div className="space-y-4">
              {/* Camera Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800">
                <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
                  <span className="text-[10px] uppercase font-bold text-stone-400 shrink-0">
                    Active CCTVs:
                  </span>
                  {cameras.map((cam) => {
                    const isSel = cam.id === selectedCamId;
                    return (
                      <button
                        key={cam.id}
                        onClick={() => setSelectedCamId(cam.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                          isSel
                            ? "bg-fuchsia-600 text-white dark:bg-cyan-500 dark:text-slate-950 border-fuchsia-600 dark:border-cyan-400 shadow-sm"
                            : "bg-stone-50 dark:bg-slate-950 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:border-fuchsia-300"
                        }`}
                      >
                        {cam.id} • {cam.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsNightVision(!isNightVision)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isNightVision
                        ? "bg-emerald-950 text-emerald-400 border-emerald-500 shadow"
                        : "bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Night Vision (IR)
                  </button>

                  <button
                    onClick={handleSnapshotCam}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 text-white dark:bg-slate-800 dark:text-white border border-stone-800 text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400" /> Capture Frame
                  </button>
                </div>
              </div>

              {/* Main Camera Live Video Spotlight */}
              <div className="bg-stone-950 rounded-3xl border border-stone-800 overflow-hidden shadow-xl relative">
                <div className={`aspect-video w-full relative overflow-hidden ${isNightVision ? "brightness-125 contrast-150 grayscale hue-rotate-90 text-emerald-400" : ""}`}>
                  <img
                    src={selectedCam.videoStreamUrl}
                    alt={selectedCam.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80";
                    }}
                    className="w-full h-full object-cover"
                  />

                  {/* CCTV Stream HUD Overlays */}
                  <div className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white space-y-0.5">
                    <span className="font-bold text-xs text-cyan-400 block">{selectedCam.name}</span>
                    <span className="text-[10px] text-stone-300 font-sans block">{selectedCam.location}</span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-rose-600 text-white border border-rose-400 flex items-center gap-1.5 animate-pulse shadow-md">
                      <span className="w-2 h-2 rounded-full bg-white" /> LIVE 1080p 30FPS
                    </span>
                  </div>

                  {/* Water Gauge Overlay Line */}
                  <div className="absolute bottom-12 left-4 right-4 border-b-2 border-dashed border-rose-500/80 flex justify-between items-center px-2 py-0.5 bg-rose-950/60 backdrop-blur-sm text-rose-300 text-[10px] rounded-t">
                    <span>ALERT LEVEL 2 THRESHOLD: 800 cm</span>
                    <span>CURRENT TELEMETRY: {selectedCam.waterLevelCm} cm</span>
                  </div>

                  <div className="absolute bottom-3 left-3 text-[10px] font-mono text-white/90 bg-stone-950/80 px-3 py-1 rounded-xl backdrop-blur-sm">
                    LAT: {selectedCam.lat.toFixed(4)} | LON: {selectedCam.lon.toFixed(4)}
                  </div>

                  <div className="absolute bottom-3 right-3 text-[10px] font-mono text-white/90 bg-stone-950/80 px-3 py-1 rounded-xl backdrop-blur-sm">
                    {new Date().toISOString().replace("T", " ").substring(0, 19)} WIB
                  </div>
                </div>

                <div className="p-3 bg-stone-900 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-white text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> STREAM STABLE
                    </span>
                    <span className="text-stone-400 font-sans">
                      Bandwidth: 4.8 Mbps • Low Latency RTMP
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                    STATUS: {selectedCam.alertLevel.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
