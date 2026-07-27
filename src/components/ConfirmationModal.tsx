import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  type: "pump" | "siren" | "evacuation";
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  type,
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    pump: {
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
    },
    siren: {
      color: "bg-red-500",
      textColor: "text-red-500",
      bgLight: "bg-red-50",
    },
    evacuation: {
      color: "bg-cyan-500",
      textColor: "text-cyan-500",
      bgLight: "bg-cyan-50",
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`px-4 py-3 flex items-center justify-between border-b border-stone-200 ${config.bgLight}`}
        >
          <h3
            className={`font-bold font-sans text-sm flex items-center gap-2 ${config.textColor}`}
          >
            <AlertTriangle size={16} />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-stone-600 text-xs leading-relaxed mb-6 font-sans">
            {message}
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors ${config.color} hover:opacity-90 shadow-sm`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
