import * as React from "react";
import { cn } from "@/lib/utils";
import { ShieldCheck, AlertTriangle, Eye, Volume2, Move, CameraOff, AlertCircle, Sparkles, SunMedium } from "lucide-react";

export type ScarecrowState =
  | "monitoring"
  | "animal_detected"
  | "deterrent_activated"
  | "human_detected"
  | "camera_unavailable"
  | "ai_unavailable";

interface ScarecrowAnimatorProps {
  state: ScarecrowState;
  detectedLabel?: string;
  confidence?: number;
  hardwareEnabled?: boolean;
  isSimulated?: boolean;
}

export const ScarecrowAnimator: React.FC<ScarecrowAnimatorProps> = ({
  state,
  detectedLabel,
  confidence,
  hardwareEnabled = false,
  isSimulated = true,
}) => {
  const isActuating = state === "deterrent_activated" || state === "animal_detected";
  const isHuman = state === "human_detected";
  const isError = state === "camera_unavailable" || state === "ai_unavailable";

  return (
    <div className="relative flex flex-col items-center justify-center p-5 bg-gradient-to-b from-[#f8faf6] to-[#eef4eb] border border-[#d6e4d2] rounded-2xl shadow-sm overflow-hidden">
      {/* Decorative rural ambient blur */}
      <div className="absolute top-2 right-3 w-16 h-16 rounded-full bg-amber-200/40 blur-md pointer-events-none" />
      <div className="absolute -bottom-6 w-full h-14 bg-[#c4dbc0]/40 rounded-full blur-md pointer-events-none" />

      {/* Top Status Header */}
      <div className="w-full flex items-center justify-between mb-3 z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span
              className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                isActuating
                  ? "bg-rose-400"
                  : isHuman
                  ? "bg-emerald-400"
                  : isError
                  ? "bg-amber-400"
                  : "bg-emerald-500"
              )}
            />
            <span
              className={cn(
                "relative inline-flex rounded-full h-3 w-3",
                isActuating
                  ? "bg-rose-500"
                  : isHuman
                  ? "bg-emerald-600"
                  : isError
                  ? "bg-amber-500"
                  : "bg-emerald-600"
              )}
            />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            {state === "deterrent_activated" && "Deterrent Activated"}
            {state === "animal_detected" && "Animal Intrusion Detected"}
            {state === "human_detected" && "Human Safe · No Deterrence"}
            {state === "monitoring" && "Field Guardian Monitoring"}
            {state === "camera_unavailable" && "Camera Offline"}
            {state === "ai_unavailable" && "AI Engine Offline"}
          </span>
        </div>

        {/* Mode Pill Badge */}
        <span
          className={cn(
            "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
            hardwareEnabled
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-stone-100 text-stone-600 border-stone-200"
          )}
        >
          {hardwareEnabled ? "Physical ESP32 Linked" : "Safe Demo Simulation"}
        </span>
      </div>

      {/* Real Prototype Body & Simulation Overlays Container */}
      <div className="relative w-64 h-80 rounded-2xl overflow-hidden border-2 border-[#c2d7be] bg-stone-900 shadow-md group">
        {/* Real Prototype Photograph */}
        <img
          src="/smart_bijuka_prototype.jpeg"
          alt="Smart Bijuka Real Prototype"
          className={cn(
            "w-full h-full object-cover object-top transition-transform duration-500",
            isActuating && "scale-105"
          )}
        />

        {/* Head Solar Camera Live Scanner Ring Animation */}
        <div className="absolute top-[8%] left-[45%] -translate-x-1/2 flex items-center justify-center pointer-events-none">
          <div
            className={cn(
              "w-10 h-10 rounded-full border-2 transition-all duration-300",
              isActuating
                ? "border-rose-500 bg-rose-500/20 scale-125 animate-ping"
                : isHuman
                ? "border-emerald-400 bg-emerald-400/20 animate-pulse"
                : "border-sky-400/80 bg-sky-400/10 animate-pulse"
            )}
          />
          <div
            className={cn(
              "absolute w-3 h-3 rounded-full",
              isActuating ? "bg-rose-500" : isHuman ? "bg-emerald-400" : "bg-sky-400"
            )}
          />
        </div>

        {/* Dynamic Simulated Physical Servo Scarecrow Arms */}
        {/* Left Arm Simulation Overlay (Attached at Shoulder) */}
        <div
          className={cn(
            "absolute top-[48%] left-[24%] origin-[95%_15%] transition-all duration-300 pointer-events-none z-20",
            isActuating && "animate-[scarecrowWaveLeft_0.5s_ease-in-out_infinite_alternate]"
          )}
          style={{
            transform: isActuating
              ? "rotate(-55deg) scale(1.08)"
              : isHuman
              ? "rotate(-10deg)"
              : "rotate(0deg)",
          }}
        >
          {/* Servo Arm Graphic Overlay with motion streamer */}
          <div className="flex items-center">
            <div className="w-14 h-4 rounded-full bg-gradient-to-r from-amber-800 to-amber-600 border border-amber-400/80 shadow-lg flex items-center justify-end px-1">
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
            </div>
            {isActuating && (
              <div className="w-6 h-6 -ml-1 rounded-sm bg-rose-600/90 rotate-45 animate-pulse shadow-md border border-white" />
            )}
          </div>
        </div>

        {/* Right Arm Simulation Overlay (Attached at Shoulder) */}
        <div
          className={cn(
            "absolute top-[48%] right-[22%] origin-[5%_15%] transition-all duration-300 pointer-events-none z-20",
            isActuating && "animate-[scarecrowWaveRight_0.5s_ease-in-out_infinite_alternate]"
          )}
          style={{
            transform: isActuating
              ? "rotate(55deg) scale(1.08)"
              : isHuman
              ? "rotate(10deg)"
              : "rotate(0deg)",
          }}
        >
          {/* Servo Arm Graphic Overlay with motion streamer */}
          <div className="flex items-center flex-row-reverse">
            <div className="w-14 h-4 rounded-full bg-gradient-to-l from-amber-800 to-amber-600 border border-amber-400/80 shadow-lg flex items-center justify-start px-1">
              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
            </div>
            {isActuating && (
              <div className="w-6 h-6 -mr-1 rounded-sm bg-rose-600/90 rotate-45 animate-pulse shadow-md border border-white" />
            )}
          </div>
        </div>

        {/* Ambient Threat Gradient Glow when Activated */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-300",
            isActuating
              ? "bg-gradient-to-t from-rose-950/70 via-transparent to-rose-600/20 opacity-100"
              : isHuman
              ? "bg-gradient-to-t from-emerald-950/50 via-transparent to-emerald-600/10 opacity-100"
              : "opacity-0"
          )}
        />

        {/* Bottom Prototype Label Pill */}
        <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/15 text-white z-20">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold tracking-wide">Real Field Prototype</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/80 text-white font-mono">
              Tested
            </span>
          </div>
          <span className="text-[10px] text-stone-300 font-mono">
            {isActuating ? "Arm Sweep 180°" : isHuman ? "Safe Human" : "Vision Armed"}
          </span>
        </div>

        {/* Soundwave notification pill if deterring */}
        {isActuating && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-bounce z-20">
            <Volume2 className="h-3.5 w-3.5" />
            <span>Audio Blast</span>
          </div>
        )}
      </div>

      {/* State Caption & Feedback */}
      <div className="mt-3.5 w-full text-center">
        {state === "deterrent_activated" && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 shadow-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 animate-bounce" />
            <span>
              Physical 180° Arm Sweep & Bioacoustic Voice Active ({detectedLabel || "Animal"}{" "}
              {confidence ? `${(confidence * 100).toFixed(0)}%` : ""})
            </span>
          </div>
        )}

        {state === "human_detected" && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-xs">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Human Presence Safe — Deterrent Voice & Arm Movement Suppressed</span>
          </div>
        )}

        {state === "monitoring" && (
          <div className="inline-flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            <span>Real prototype armed with YOLOv8 optical crop protection...</span>
          </div>
        )}

        {state === "camera_unavailable" && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
            <CameraOff className="h-4 w-4 text-amber-600" />
            <span>Camera unavailable or permission denied.</span>
          </div>
        )}

        {state === "ai_unavailable" && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-50 text-red-800 text-xs font-medium border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>YOLOv8 AI Engine is disconnected or loading model weights.</span>
          </div>
        )}
      </div>

      {/* Footer System Specs */}
      <div className="mt-3 pt-2.5 border-t border-[#d6e4d2] w-full flex items-center justify-between text-[11px] text-stone-500">
        <span className="flex items-center gap-1">
          <Move className="h-3 w-3 text-stone-400" />
          <span>Arms Simulation: <strong>Live</strong></span>
        </span>
        <span>
          ESP32 Servos:{" "}
          <strong className={hardwareEnabled ? "text-blue-600" : "text-stone-500"}>
            {hardwareEnabled ? "Physical Linked" : "Safe Simulation"}
          </strong>
        </span>
      </div>
    </div>
  );
};
