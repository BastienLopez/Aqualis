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

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <Bubbles count={phase === "running" ? 6 : 10} />

      <div className="relative z-10 flex-1 flex flex-col px-6 pt-14 pb-24">
        <AnimatePresence mode="wait">
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <h1 className="text-2xl font-bold text-foreground mb-1">Nouvelle Session</h1>
              <p className="text-xs text-muted-foreground mb-8">Choisis ton activité et ta durée</p>

              <p className="text-[10px] text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Activité</p>
              <div className="grid grid-cols-4 gap-2.5 mb-8">
                {activities.map(a => (
                  <button
                    key={a.id}
                    onClick={() => setActivity(a.id)}
                    className={`card-dark rounded-2xl py-4 flex flex-col items-center gap-2 transition-all duration-300 ${
                      activity === a.id ? "ring-2 ring-primary glow-gold" : ""
                    }`}
                  >
                    <span className="text-xl">{a.icon}</span>
                    <span className="text-[10px] font-semibold text-foreground">{a.label}</span>
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Durée</p>
              <div className="grid grid-cols-3 gap-2.5 mb-8">
                {SESSION_DURATIONS.map((d, i) => (
                  <button
                    key={d.minutes}
                    onClick={() => setDurationIdx(i)}
                    className={`card-dark rounded-2xl py-4 text-center transition-all duration-300 ${
                      durationIdx === i ? "ring-2 ring-primary glow-gold" : ""
                    }`}
                  >
                    <span className="text-lg font-extrabold text-foreground">{d.label}</span>
                    <span className="block text-[10px] text-gold font-semibold mt-1.5">+{d.gold} 🪙</span>
                  </button>
                ))}
              </div>

              <div className="mt-auto">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={startSession}
                  className="w-full flex items-center justify-between card-dark rounded-2xl px-5 py-4 glow-gold"
                >
                  <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xl font-bold">▶</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">Lancer le focus</span>
                  <span className="text-primary text-sm font-medium">› › ›</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === "running" && (
            <motion.div
              key="running"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              {/* Breathing pulse */}
              <motion.div
                className="absolute w-80 h-80 rounded-full bg-primary/5 pointer-events-none"
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute w-56 h-56 rounded-full bg-accent/5 pointer-events-none"
                animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.35, 0.15] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />

              <div className="relative w-52 h-52 mb-10">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="1.5" opacity="0.3" />
                  <motion.circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 276.5} 276.5`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-foreground font-mono tracking-tight">{formatTime(secondsLeft)}</span>
                  <span className="text-xs text-muted-foreground mt-2 capitalize">{activities.find(a => a.id === activity)?.label}</span>
                </div>
              </div>

              <motion.p 
                className="text-xs text-muted-foreground/60"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                Reste concentré. Ton aquarium t'attend.
              </motion.p>

              <button
                onClick={() => setSecondsLeft(0)}
                className="mt-10 text-[10px] text-muted-foreground/30 underline relative z-10 cursor-pointer hover:text-muted-foreground/50 transition-colors"
              >
                Terminer (dev)
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

