import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/contexts/GameContext";
import { SESSION_DURATIONS } from "@/lib/gameData";
import Bubbles from "@/components/Bubbles";

type Phase = "setup" | "running" | "confirm-stop";

const activities = [
  {
    id: "work",
    label: "Travail",
    sublabel: "Taches & projets",
    icon: "💼",
    fish: "🐠",
    quote: "Chaque poisson avance a son rythme - mais avance.",
    hue: 213,
  },
  {
    id: "study",
    label: "Revisions",
    sublabel: "Apprentissage",
    icon: "📚",
    fish: "🦈",
    quote: "Le fond marin n a pas de limite. Ni ton esprit.",
    hue: 272,
  },
  {
    id: "sport",
    label: "Sport",
    sublabel: "Mouvement",
    icon: "🏃",
    fish: "🐟",
    quote: "Les sardines nagent ensemble. La force est dans l effort.",
    hue: 22,
  },
  {
    id: "custom",
    label: "Perso",
    sublabel: "A ta facon",
    icon: "✨",
    fish: "🪸",
    quote: "L aquarium te ressemble. Cette session aussi.",
    hue: 174,
  },
];

const MOTIVATIONAL = [
  "Reste dans le flux.",
  "Chaque minute compte.",
  "L aquarium t attend.",
  "Plongee en profondeur.",
  "Focus = victoire.",
];

export default function Session() {
  const navigate = useNavigate();
  const { completeSession, level, totalXP } = useGame();
  const [phase, setPhase] = useState<Phase>("setup");
  const [activity, setActivity] = useState("work");
  const [durationIdx, setDurationIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const quoteRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const selectedDuration = SESSION_DURATIONS[durationIdx];
  const actObj = activities.find(a => a.id === activity) ?? activities[0];

  const hue = actObj.hue;
  const colFrom = `hsl(${hue} 75% 32%)`;
  const colTo   = `hsl(${hue + 15} 68% 50%)`;
  const colGlow = `hsl(${hue} 70% 55% / 0.35)`;

  const finishSession = useCallback(
    (activityId: string, minutes: number) => {
      const r = completeSession(activityId, minutes);
      const activityLabel = activities.find(a => a.id === activityId)?.label ?? activityId;
      const durationLabel = SESSION_DURATIONS.find(d => d.minutes === minutes)?.label ?? `${minutes} min`;
      if (quoteRef.current) clearInterval(quoteRef.current);
      navigate("/aquarium", {
        state: { sessionComplete: { reward: r, activityLabel, durationLabel } },
      });
    },
    [completeSession, navigate]
  );

  const startSession = () => {
    const totalSec = selectedDuration.minutes * 60;
    setSecondsLeft(totalSec);
    startTimeRef.current = Date.now();
    localStorage.setItem(
      "aquafocus_active_session",
      JSON.stringify({
        activity,
        durationMinutes: selectedDuration.minutes,
        startTime: Date.now(),
        totalSeconds: totalSec,
      })
    );
    setPhase("running");
    quoteRef.current = setInterval(() => setQuoteIdx(i => (i + 1) % MOTIVATIONAL.length), 30000);
  };

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
          quoteRef.current = setInterval(() => setQuoteIdx(i => (i + 1) % MOTIVATIONAL.length), 30000);
        } else {
          localStorage.removeItem("aquafocus_active_session");
          const idx = SESSION_DURATIONS.findIndex(d => d.minutes === data.durationMinutes);
          if (idx >= 0) setDurationIdx(idx);
          setActivity(data.activity);
          finishSession(data.activity, data.durationMinutes);
        }
      }
    } catch { /* ignore storage read errors */ }
    return () => { if (quoteRef.current) clearInterval(quoteRef.current); };
  }, [finishSession]);

  useEffect(() => {
    if (phase === "running" && secondsLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) { clearInterval(intervalRef.current!); return 0; }
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

  const totalSec = selectedDuration.minutes * 60;
  const progress = phase === "running" ? 1 - secondsLeft / totalSec : 0;
  const CIRC = 2 * Math.PI * 48;
  const milestones = [0.25, 0.5, 0.75];

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(175deg, #04091a 0%, #06101f 45%, hsl(${hue} 40% 7%) 100%)` }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: `radial-gradient(ellipse 70% 45% at 50% 85%, hsl(${hue} 55% 20% / 0.22) 0%, transparent 70%)` }}
      />
      <Bubbles count={phase === "running" ? 4 : 8} />

      <div className="relative z-10 flex-1 flex flex-col px-5 pt-14 pb-28 overflow-y-auto">
        <AnimatePresence mode="wait">

          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-6">
                <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: `hsl(${hue} 70% 55%)` }}>
                  Session Focus
                </p>
                <h1 className="text-2xl font-extrabold text-white leading-tight">Pret a plonger?</h1>
                <p className="text-xs text-slate-500 mt-1">Niv. {level} · {totalXP.toLocaleString()} XP total</p>
              </div>

              <div className="rounded-2xl px-4 py-3 mb-6 border" style={{ background: `hsl(${hue} 30% 11%)`, borderColor: `hsl(${hue} 40% 20%)` }}>
                <p className="text-xs leading-relaxed" style={{ color: `hsl(${hue} 60% 65%)` }}>
                  {actObj.fish}  {actObj.quote}
                </p>
              </div>

              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">Activite</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {activities.map((a) => {
                  const isSelected = activity === a.id;
                  const aHue = a.hue;
                  return (
                    <motion.button
                      key={a.id}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setActivity(a.id)}
                      className="rounded-2xl px-4 py-4 flex items-center gap-3 border text-left transition-all duration-200"
                      style={{
                        background: isSelected ? `linear-gradient(135deg, hsl(${aHue} 65% 22%), hsl(${aHue + 15} 60% 32%))` : "hsl(215 20% 9%)",
                        borderColor: isSelected ? `hsl(${aHue + 15} 60% 40%)` : "hsl(215 18% 14%)",
                        boxShadow: isSelected ? `0 4px 20px hsl(${aHue} 65% 40% / 0.28), inset 0 1px 0 hsl(${aHue} 80% 70% / 0.12)` : "none",
                      }}
                    >
                      <span className="text-2xl">{a.icon}</span>
                      <div>
                        <p className="text-sm font-bold leading-tight" style={{ color: isSelected ? "rgba(255,255,255,0.95)" : "hsl(215 15% 55%)" }}>{a.label}</p>
                        <p className="text-[10px] leading-tight mt-0.5" style={{ color: isSelected ? `hsl(${aHue + 15} 80% 70%)` : "hsl(215 12% 38%)" }}>{a.sublabel}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">Duree</p>
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {SESSION_DURATIONS.map((d, i) => {
                  const isSel = durationIdx === i;
                  return (
                    <motion.button
                      key={d.minutes}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setDurationIdx(i)}
                      className="rounded-2xl py-4 flex flex-col items-center gap-1 border transition-all duration-200"
                      style={{
                        background: isSel ? `linear-gradient(155deg, hsl(${hue} 45% 16%), hsl(${hue} 38% 11%))` : "hsl(215 20% 9%)",
                        borderColor: isSel ? `hsl(${hue} 65% 40% / 0.7)` : "hsl(215 18% 14%)",
                        boxShadow: isSel ? `0 4px 16px hsl(${hue} 65% 40% / 0.18)` : "none",
                      }}
                    >
                      <span className="text-sm font-extrabold leading-none" style={{ color: isSel ? `hsl(${hue} 90% 72%)` : "hsl(215 15% 55%)" }}>{d.label}</span>
                      <span className="text-[10px] font-semibold leading-none" style={{ color: isSel ? `hsl(${hue} 80% 58%)` : "hsl(215 12% 35%)" }}>+{d.gold} 🪙 +{d.xp} ✨</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="rounded-2xl px-4 py-3 mb-6 flex items-center justify-between border" style={{ background: "hsl(42 30% 10%)", borderColor: "hsl(42 50% 22%)" }}>
                <div>
                  <p className="text-[10px] tracking-widest font-bold text-amber-700 uppercase">Recompenses estimees</p>
                  <p className="text-sm font-bold text-amber-400 mt-0.5">+{selectedDuration.gold} 🪙  +{selectedDuration.xp} ✨ XP</p>
                </div>
                <div className="text-3xl">{actObj.fish}</div>
              </div>

              <div className="mt-auto">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={startSession}
                  className="w-full rounded-2xl px-5 py-[18px] flex items-center gap-4 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${colFrom}, ${colTo})`, boxShadow: `0 6px 28px ${colGlow}, 0 2px 8px hsl(0 0% 0% / 0.35)` }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.13) 0%, transparent 55%)" }} />
                  <div className="w-10 h-10 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="white"><path d="M3 1.5l9 5.5-9 5.5V1.5z"/></svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-[15px] leading-none">Lancer la session</p>
                    <p className="text-white/60 text-[11px] mt-1 leading-none">{selectedDuration.label} · {actObj.label}</p>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="rgba(255,255,255,0.5)"><path d="M6 3.5l6 5.5-6 5.5V3.5z"/></svg>
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === "running" && (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center gap-0 pt-6"
            >
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: `hsl(${hue} 65% 55%)` }}>En cours</p>
              <p className="text-base font-extrabold text-white/90 mb-8">{actObj.icon} {actObj.label}</p>

              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{ width: 340, height: 340, background: `radial-gradient(ellipse, ${colGlow} 0%, transparent 70%)` }}
                animate={{ scale: [0.82, 1.1, 0.82], opacity: [0.45, 0.95, 0.45] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="relative w-60 h-60 mb-7">
                <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: `0 0 50px ${colGlow}, 0 0 100px ${colGlow}` }} />
                <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="48" fill="none" stroke="hsl(215 25% 12%)" strokeWidth="6"/>
                  {milestones.map(m => {
                    const angle = -Math.PI / 2 + m * 2 * Math.PI;
                    const mx = 55 + 48 * Math.cos(angle);
                    const my = 55 + 48 * Math.sin(angle);
                    const passed = progress >= m;
                    return <circle key={m} cx={mx} cy={my} r="3" fill={passed ? "white" : "hsl(215 25% 18%)"} opacity={passed ? 0.9 : 0.4}/>;
                  })}
                  <motion.circle
                    cx="55" cy="55" r="48" fill="none"
                    stroke={colTo}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * CIRC} ${CIRC}`}
                    style={{ filter: `drop-shadow(0 0 7px ${colGlow})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[44px] font-extrabold text-white font-mono tracking-tight leading-none tabular-nums">{formatTime(secondsLeft)}</span>
                  <span className="text-[11px] font-semibold mt-2 tracking-widest uppercase" style={{ color: colTo }}>{Math.round(progress * 100)}%</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={quoteIdx}
                  className="text-xs text-center max-w-[200px] leading-relaxed"
                  style={{ color: `hsl(${hue} 40% 60%)` }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.5 }}
                >
                  {MOTIVATIONAL[quoteIdx]}
                </motion.p>
              </AnimatePresence>

              <div className="mt-8 flex gap-3 items-center">
                {milestones.map((m) => (
                  <div key={m} className="flex flex-col items-center gap-1">
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: progress >= m ? colTo : "hsl(215 20% 18%)", boxShadow: progress >= m ? `0 0 8px ${colGlow}` : "none" }}
                      animate={progress >= m ? { scale: [1, 1.4, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    />
                    <span className="text-[9px] text-slate-600">{m * 100}%</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setPhase("confirm-stop")}
                className="mt-10 px-5 py-2 rounded-xl text-[11px] font-semibold border transition-colors"
                style={{ color: "hsl(215 15% 45%)", borderColor: "hsl(215 18% 18%)", background: "transparent" }}
              >
                Terminer la session
              </button>
            </motion.div>
          )}

          {phase === "confirm-stop" && (
            <motion.div
              key="confirm-stop"
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center gap-5"
            >
              <div className="text-4xl mb-2">🐟</div>
              <h2 className="text-xl font-extrabold text-white text-center">Terminer maintenant?</h2>
              <p className="text-xs text-slate-400 text-center max-w-[220px] leading-relaxed">
                Tu recevras quand meme les recompenses pour le temps deja ecoule.
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setPhase("running")}
                  className="px-5 py-3 rounded-2xl text-sm font-bold border text-slate-300 border-slate-700 hover:border-slate-500 transition-colors"
                >
                  Continuer
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSecondsLeft(0)}
                  className="px-7 py-3 rounded-2xl text-sm font-bold text-white transition-all"
                  style={{ background: `linear-gradient(135deg, ${colFrom}, ${colTo})`, boxShadow: `0 4px 20px ${colGlow}` }}
                >
                  Terminer
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
