import React, { useState } from "react";
import { RiverSensor } from "../types";
import { Camera, AlertTriangle, Users, MapPin, X, Video } from "lucide-react";

interface GroundTruthModalProps {
  sensor: RiverSensor;
  onClose: () => void;
}

export const GroundTruthModal: React.FC<GroundTruthModalProps> = ({
  sensor,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"cctv" | "citizen">("citizen");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h2 className="text-lg font-display font-bold text-stone-900 flex items-center gap-2">
              <Camera size={20} className="text-brand-cyan" />
              Field Verification: {sensor.name}
            </h2>
            <p className="text-xs text-stone-500 font-mono mt-1">
              SENSOR ID: {sensor.sensor_id} | EXCEEDANCE:{" "}
              {(sensor.exceedance_prob * 100).toFixed(1)}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 bg-white px-4 pt-2">
          <button
            onClick={() => setActiveTab("citizen")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "citizen"
                ? "border-brand-cyan text-brand-cyan"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Users size={16} />
            Citizen Reports
          </button>
          <button
            onClick={() => setActiveTab("cctv")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "cctv"
                ? "border-brand-cyan text-brand-cyan"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <Video size={16} />
            Live CCTV Feeds
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto bg-stone-50/50">
          {activeTab === "citizen" ? (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm flex flex-col md:flex-row gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                <div className="w-full md:w-1/3 aspect-video bg-stone-200 rounded flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-stone-800/20 backdrop-blur-[2px]"></div>
                  <div className="text-stone-100 flex flex-col items-center z-10">
                    <Camera size={24} className="mb-1" />
                    <span className="text-[10px] font-mono">
                      IMG_8921.jpg (Verified)
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-stone-800">
                        Water entering houses, approx 40cm depth
                      </h3>
                      <span className="text-[10px] font-mono bg-red-100 text-red-700 px-2 py-1 rounded">
                        URGENT
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 mb-2">
                      "The river overflowed about 15 minutes ago. Water is
                      rising fast in our alleyway. We need assistance moving
                      elders."
                    </p>
                    <div className="flex items-center gap-4 text-xs text-stone-500 font-mono mt-2">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> Reported by: Ibu Kartini
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> RT 04 / RW 02
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono mt-4">
                    Received: 2 mins ago • Geolocated: Verified via GPS
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm flex flex-col md:flex-row gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-2 h-full bg-orange-400"></div>
                <div className="w-full md:w-1/3 aspect-video bg-stone-200 rounded flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-stone-800/10 backdrop-blur-[1px]"></div>
                  <div className="text-stone-500 flex flex-col items-center z-10">
                    <Video size={24} className="mb-1" />
                    <span className="text-[10px] font-mono">
                      VID_20260721.mp4
                    </span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-stone-800">
                        Street completely flooded, impassable for cars
                      </h3>
                      <span className="text-[10px] font-mono bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        WARNING
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 mb-2">
                      "Motorcycles are breaking down. Please reroute traffic.
                      The floodgate seems to be completely overwhelmed."
                    </p>
                    <div className="flex items-center gap-4 text-xs text-stone-500 font-mono mt-2">
                      <span className="flex items-center gap-1">
                        <Users size={14} /> Reported by: Pak Budi
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> RT 11 / RW 05
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono mt-4">
                    Received: 8 mins ago • Geolocated: Verified via GPS
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((cam) => (
                <div
                  key={cam}
                  className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm"
                >
                  <div className="aspect-video bg-stone-900 relative">
                    {/* Fake CCTV feed effect */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                    <div className="absolute top-2 left-2 text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded">
                      CAM-0{cam} • {sensor.name} UPPER
                    </div>
                    <div className="absolute top-2 right-2 text-[10px] font-mono text-red-400 bg-black/50 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>{" "}
                      LIVE
                    </div>
                    <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded">
                      {new Date()
                        .toISOString()
                        .replace("T", " ")
                        .substring(0, 19)}
                    </div>
                    <div className="w-full h-full flex items-center justify-center flex-col text-stone-600">
                      <AlertTriangle size={32} className="mb-2 opacity-50" />
                      <span className="text-xs font-mono opacity-50">
                        FEED {cam} ACTIVE
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-stone-800">
                        Traffic Cam {cam}
                      </h4>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {sensor.lat.toFixed(4)}, {sensor.lon.toFixed(4)}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 px-2 py-1 rounded border border-emerald-200">
                      ONLINE
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
