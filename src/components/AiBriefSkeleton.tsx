import React from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export function AiBriefSkeleton() {
  return (
    <div className="bg-white p-3.5 rounded-lg border border-stone-200 shadow-sm flex flex-col gap-3.5 w-full">
      <div className="flex items-center gap-3 w-full">
        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0 border border-stone-200 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
            animate={{ x: ["-150%", "150%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <Sparkles className="w-5 h-5 text-stone-300" />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <div className="h-2.5 w-1/3 bg-stone-100 rounded relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
              animate={{ x: ["-200%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="h-2 w-2/3 bg-stone-50 rounded relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
              animate={{ x: ["-200%", "200%"] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: 0.1,
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 mt-1">
        <div className="h-1.5 w-full bg-stone-100 rounded relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
            animate={{ x: ["-200%", "200%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.2,
            }}
          />
        </div>
        <div className="h-1.5 w-5/6 bg-stone-100 rounded relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
            animate={{ x: ["-200%", "200%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.3,
            }}
          />
        </div>
        <div className="h-1.5 w-4/6 bg-stone-100 rounded relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
            animate={{ x: ["-200%", "200%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.4,
            }}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <div className="h-5 w-16 bg-stone-100 rounded relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
            animate={{ x: ["-200%", "200%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.5,
            }}
          />
        </div>
        <div className="h-5 w-20 bg-stone-100 rounded relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
            animate={{ x: ["-200%", "200%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.6,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mt-2 bg-stone-50 py-2 px-3 rounded text-[9.5px] text-stone-500 font-mono border border-stone-100">
        <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
        Synthesizing spatial hazards & routing parameters...
      </div>
    </div>
  );
}
