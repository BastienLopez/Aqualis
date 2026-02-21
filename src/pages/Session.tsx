import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { SESSION_DURATIONS } from "@/lib/gameData";
import Bubbles from "@/components/Bubbles";

type Phase = "setup" | "running";

const activities = [
  { id: "work", label: "Travail", icon: "💼" },
  { id: "study", label: "Révisions", icon: "📚" },
  { id: "sport", label: "Sport", icon: "🏃" },
  { id: "custom", label: "Perso", icon: "✨" },
];

export default function Session() {
  const navigate = useNavigate();
  const { completeSesion } = useGame();
  const [phase, setPhase] = useState<Phase>("setup");
  const [activity, setActivity] = useState("work");
  const [durationIdx, setDurationIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const selectedDuration = SESSION_DURATIONS[durationIdx];

  const finishSession = useCallback((activityId: string, minutes: number) => {
    const r = completeSesion(activityId, minutes);
    const activityLabel = activities.find(a => a.id === activityId)?.label ?? activityId;
    const durationLabel = SESSION_DURATIONS.find(d => d.minutes === minutes)?.label ?? `${minutes} min`;
    navigate("/aquarium", {
      state: {
        sessionComplete: {
          reward: r,
          activityLabel,
          durationLabel,
        },
      },
    });
  }, [completeSesion, navigate]);

  const startSession = () => {
    const totalSec = selectedDuration.minutes * 60;
    setSecondsLeft(totalSec);
    startTimeRef.current = Date.now();
    localStorage.setItem("aquafocus_active_session", JSON.stringify({
      activity,
      durationMinutes: selectedDuration.minutes,
      startTime: Date.now(),
      totalSeconds: totalSec,
    }));
    setPhase("running");
  };

  // Restore session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aquafocus_active_session");
      if (saved) {
        const data = JSON.parse(saved);
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        const remaining = data.totalSeconds - elapsed;
        if (remaining > 0) {
          setActivity(data.activity);
          const idx = SESSION_DURATIONS.findIndex(d => d.minutes === data.durationMinutes);
          if (idx >= 0) setDurationIdx(idx);
          setSecondsLeft(remaining);
          startTimeRef.current = data.startTime;
          setPhase("running");
        } else {
          localStorage.removeItem("aquafocus_active_session");
          const idx = SESSION_DURATIONS.findIndex(d => d.minutes === data.durationMinutes);
          if (idx >= 0) setDurationIdx(idx);
          setActivity(data.activity);
          finishSession(data.activity, data.durationMinutes);
        }
      }
    } catch {}
  }, [finishSession]);

  useEffect(() => {
    if (phase === "running" && secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current!);
    }
    if (phase === "running" && secondsLeft === 0 && startTimeRef.current) {
      localStorage.removeItem("aquafocus_active_session");
      finishSession(activity, selectedDuration.minutes);
    }
  }, [activity, finishSession, phase, secondsLeft, selectedDuration.minutes]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = phase === "running"
    ? 1 - secondsLeft / (selectedDuration.minutes * 60)
    : 0;

  const actColors = [
    { from: "hsl(213 80% 38%)", to: "hsl(224 70% 52%)", glow: "hsl(213 80% 50% / 0.35)" },
    { from: "hsl(272 65% 42%)", to: "hsl(280 60% 55%)", glow: "hsl(272 65% 55% / 0.35)" },
    { from: "hsl(22 75% 42%)",  to: "hsl(12 80% 55%)",  glow: "hsl(22 75% 55%  / 0.35)" },
    { from: "hsl(174 60% 28%)", to: "hsl(185 65% 42%)", glow: "hsl(174 60% 42% / 0.35)" },
  ];
  const selAct = activities.findIndex(a => a.id === activity);

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(175deg, #050d1a 0%, #061523 45%, #071e1b 100%)" }}
    >
      {/* Ambient deep-sea shimmer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 55% at 50% 80%, hsl(174 50% 15% / 0.28) 0%, transparent 70%)",
        }}
      />
      <Bubbles count={phase === "running" ? 5 : 9} />

      <div className="relative z-10 flex-1 flex flex-col px-5 pt-14 pb-24">
        <AnimatePresence mode="wait">

          {/* ─── SETUP ─── */}
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              {/* Header */}
              <div className="mb-7">
                <p className="text-[10px] font-semibold tracking-widest text-cyan-500/70 uppercase mb-1">Session focus</p>
                <h1 className="text-[26px] font-extrabold leading-tight text-white">
                  Prêt à plonger&nbsp;?
                </h1>
                <p className="text-xs text-slate-400 mt-1">Configure ta session et mets-toi dans le flow.</p>
              </div>

              {/* Activity label */}
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">Activité</p>
              <div className="grid grid-cols-4 gap-2.5 mb-7">
                {activities.map((a, ai) => {
                  const col = actColors[ai];
                  const isSelected = activity === a.id;
                  return (
                    <motion.button
                      key={a.id}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setActivity(a.id)}
                      className="rounded-2xl pt-4 pb-3 flex flex-col items-center gap-2 border transition-all duration-250"
                      style={{
                        background: isSelected
                          ? `linear-gradient(150deg, ${col.from}, ${col.to})`
                          : "hsl(215 22% 10%)",
                        borderColor: isSelected ? col.to : "hsl(215 18% 16%)",
                        boxShadow: isSelected ? `0 4px 22px ${col.glow}, 0 0 0 1px ${col.to}` : "none",
                      }}
                    >
                      <span className="text-[26px] leading-none">{a.icon}</span>
                      <span
                        className="text-[10px] font-bold leading-none"
                        style={{ color: isSelected ? "rgba(255,255,255,0.95)" : "hsl(215 15% 52%)" }}
                      >{a.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Duration label */}
              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">Durée</p>
              <div className="grid grid-cols-3 gap-2.5 mb-8">
                {SESSION_DURATIONS.map((d, i) => {
                  const isSel = durationIdx === i;
                  return (
                    <motion.button
                      key={d.minutes}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setDurationIdx(i)}
                      className="rounded-2xl py-4 flex flex-col items-center gap-1 border transition-all duration-250"
                      style={{
                        background: isSel
                          ? "linear-gradient(155deg, hsl(42 55% 18%), hsl(36 50% 13%))"
                          : "hsl(215 22% 10%)",
                        borderColor: isSel ? "hsl(42 70% 48% / 0.65)" : "hsl(215 18% 16%)",
                        boxShadow: isSel ? "0 4px 20px hsl(42 70% 48% / 0.18), inset 0 1px 0 hsl(42 70% 60% / 0.1)" : "none",
                      }}
                    >
                      <span
                        className="text-base font-extrabold leading-none"
                        style={{ color: isSel ? "hsl(42 90% 72%)" : "hsl(215 15% 60%)" }}
                      >{d.label}</span>
                      <span
                        className="text-[10px] font-semibold leading-none"
                        style={{ color: isSel ? "hsl(42 85% 58%)" : "hsl(215 15% 38%)" }}
                      >+{d.gold} 🪙</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Start button */}
              <div className="mt-auto">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={startSession}
                  className="w-full rounded-2xl px-5 py-[18px] flex items-center gap-4 relative overflow-hidden"
                  style={{
                    background: selAct >= 0
                      ? `linear-gradient(135deg, ${actColors[selAct].from}, ${actColors[selAct].to})`
                      : "linear-gradient(135deg, hsl(213 80% 38%), hsl(224 70% 52%))",
                    boxShadow: selAct >= 0
                      ? `0 6px 30px ${actColors[selAct].glow}, 0 2px 8px hsl(0 0% 0% / 0.4)`
                      : "0 6px 24px hsl(213 80% 50% / 0.3)",
                  }}
                >
                  {/* Shine overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%)" }}
                  />
                  <div className="w-10 h-10 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M4 2l10 6-10 6V2z"/></svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-[15px] leading-none">Lancer le focus</p>
                    <p className="text-white/60 text-[11px] mt-1 leading-none">
                      {SESSION_DURATIONS[durationIdx]?.label} · {activities.find(a => a.id === activity)?.label}
                    </p>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="rgba(255,255,255,0.6)">
                    <path d="M7 4l6 6-6 6V4z"/>
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── RUNNING ─── */}
          {phase === "running" && (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center gap-0"
            >
              {/* Breathing glow rings */}
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 320, height: 320,
                  background: selAct >= 0
                    ? `radial-gradient(ellipse, ${actColors[selAct].glow} 0%, transparent 70%)`
                    : "radial-gradient(ellipse, hsl(174 60% 40% / 0.12) 0%, transparent 70%)",
                }}
                animate={{ scale: [0.85, 1.12, 0.85], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Activity icon */}
              <motion.div
                className="mb-5 text-5xl"
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {activities.find(a => a.id === activity)?.icon}
              </motion.div>

              {/* Timer ring */}
              <div className="relative w-56 h-56 mb-6">
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    boxShadow: selAct >= 0
                      ? `0 0 40px ${actColors[selAct].glow}, 0 0 80px ${actColors[selAct].glow}`
                      : "0 0 40px hsl(174 60% 40% / 0.2)",
                  }}
                />
                <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
                  {/* Track */}
                  <circle cx="55" cy="55" r="48" fill="none" stroke="hsl(215 25% 14%)" strokeWidth="5" />
                  {/* Fill */}
                  <motion.circle
                    cx="55" cy="55" r="48" fill="none"
                    stroke={selAct >= 0 ? actColors[selAct].to : "hsl(174 60% 45%)"}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 301.6} 301.6`}
                    style={{ filter: selAct >= 0 ? `drop-shadow(0 0 6px ${actColors[selAct].glow})` : "drop-shadow(0 0 6px hsl(174 60% 45% / 0.6))" }}
                  />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[42px] font-extrabold text-white font-mono tracking-tight leading-none tabular-nums">
                    {formatTime(secondsLeft)}
                  </span>
                  <span
                    className="text-[11px] font-semibold mt-2 tracking-wide"
                    style={{ color: selAct >= 0 ? actColors[selAct].to : "hsl(174 60% 55%)" }}
                  >
                    {activities.find(a => a.id === activity)?.label?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Motivational message */}
              <motion.p
                className="text-xs text-slate-400/60 text-center max-w-[220px] leading-relaxed"
                animate={{ opacity: [0.4, 0.75, 0.4] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                Reste concentré.{"\n"}Ton aquarium t'attend. 🐠
              </motion.p>

              {/* End session button */}
              <button
                onClick={() => setSecondsLeft(0)}
                className="mt-12 px-5 py-2 rounded-xl text-[11px] font-semibold text-slate-500 border border-slate-700/50 hover:text-slate-300 hover:border-slate-600 transition-colors"
              >
                Terminer la session
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

