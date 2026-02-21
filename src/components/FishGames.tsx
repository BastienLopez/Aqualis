import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type GameType = "schooling" | "hiding" | "race" | "circle" | "leader" | null;

interface FishGamesProps {
  fishCount: number;
  fishPositions?: Record<string, { x: number; y: number }>;
  onGameActive?: (active: boolean) => void;
}

const GAMES: { type: GameType; label: string; desc: string; emoji: string }[] = [
  { type: "schooling", label: "Banc de poissons !", desc: "Les poissons nagent en formation", emoji: "🐟" },
  { type: "hiding",    label: "Cache-cache !",    desc: "Les poissons se cachent derrière les rochers", emoji: "🪨" },
  { type: "race",      label: "Course aquatique !",desc: "Qui sera le plus rapide ?", emoji: "⚡" },
  { type: "circle",   label: "Danse circulaire !", desc: "Nage synchronisée en ronde", emoji: "🌀" },
  { type: "leader",   label: "Suivre le leader !", desc: "Tous suivent le grand poisson", emoji: "👑" },
];

const FISH_COLORS = ["#f87171","#fb923c","#fbbf24","#34d399","#60a5fa","#a78bfa","#f472b6"];

export default function FishGames({ fishCount, onGameActive }: FishGamesProps) {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [gameInfo, setGameInfo] = useState<typeof GAMES[0] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (fishCount < 3) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.45 && !activeGame) {
        const picked = GAMES[Math.floor(Math.random() * GAMES.length)];
        setActiveGame(picked.type);
        setGameInfo(picked);
        onGameActive?.(true);
        timerRef.current = setTimeout(() => {
          setActiveGame(null);
          setGameInfo(null);
          onGameActive?.(false);
        }, 18000);
      }
    }, 90000);
    return () => { clearInterval(interval); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fishCount, activeGame, onGameActive]);

  if (!activeGame || !gameInfo) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[14]">
      {/* Notification banner */}
      <AnimatePresence>
        <motion.div
          key="notif"
          initial={{ opacity: 0, y: -16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="absolute z-50"
          style={{ top: "14%", width: "78%", left: "11%" }}
        >
          <div className="glass-nav rounded-2xl px-4 py-2.5 text-center border border-white/10">
            <p className="text-sm font-extrabold text-foreground">{gameInfo.emoji} {gameInfo.label}</p>
            <p className="text-[10px] text-foreground/50 mt-0.5">{gameInfo.desc}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── SCHOOLING: V-formation of fish swimming across ── */}
      {activeGame === "schooling" && (
        <SchoolingGame />
      )}

      {/* ── HIDING: fish rush toward rocks and peek out ── */}
      {activeGame === "hiding" && (
        <HidingGame />
      )}

      {/* ── RACE: two fast fish shooting across ── */}
      {activeGame === "race" && (
        <RaceGame />
      )}

      {/* ── CIRCLE: fish orbiting center ── */}
      {activeGame === "circle" && (
        <CircleGame />
      )}

      {/* ── LEADER: chain of fish following one leader ── */}
      {activeGame === "leader" && (
        <LeaderGame />
      )}
    </div>
  );
}

/* ────────────────── SCHOOLING GAME ────────────────────── */
function SchoolingGame() {
  // 7 fish in a loose V-formation that sweeps across the screen back and forth
  const offsets = [
    { dx: 0,   dy: 0   },
    { dx: -28, dy: 18  },
    { dx: 28,  dy: 18  },
    { dx: -54, dy: 36  },
    { dx: 54,  dy: 36  },
    { dx: -78, dy: 52  },
    { dx: 78,  dy: 52  },
  ];
  return (
    <motion.div
      className="absolute"
      style={{ left: 0, top: "38%", width: "100%", height: 0 }}
      animate={{ x: ["-20%", "100%"] }}
      transition={{ duration: 9, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
    >
      {offsets.map((o, i) => (
        <motion.div
          key={i}
          className="absolute text-base select-none"
          style={{ left: `${30 + o.dx}px`, top: o.dy, fontSize: `${14 - i * 1}px` }}
          animate={{ y: [0, -4, 0, 4, 0], rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 1.4 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
        >
          🐟
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ────────────────── HIDING GAME ────────────────────────── */
function HidingGame() {
  // Fish swim toward the rocks (bottom corners), shrink and hide, then peek out
  const hideSpots = ["12%", "42%", "77%"];
  const fishColorsList = FISH_COLORS.slice(0, 5);
  return (
    <>
      {fishColorsList.map((color, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ fontSize: 18 }}
          initial={{ left: `${20 + i * 14}%`, top: "30%", opacity: 1, scale: 1 }}
          animate={{
            left: [
              `${20 + i * 14}%`,
              hideSpots[i % 3],
              hideSpots[i % 3],
              `${15 + i * 15}%`,
            ],
            top: ["30%", "75%", "75%", "35%"],
            opacity: [1, 1, 0, 1],
            scale: [1, 0.85, 0, 1],
          }}
          transition={{
            duration: 7,
            delay: i * 0.6,
            times: [0, 0.45, 0.55, 1],
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <span style={{ filter: `hue-rotate(${i * 55}deg)` }}>🐠</span>
        </motion.div>
      ))}
      {/* Rock hiding overlay hint */}
      <motion.div
        className="absolute bottom-[18%] glass-nav rounded-full px-3 py-1"
        style={{ left: "35%", fontSize: 11 }}
        animate={{ opacity: [0, 0.7, 0.7, 0] }}
        transition={{ duration: 7, repeat: Infinity, repeatDelay: 2, times: [0, 0.3, 0.6, 1] }}
      >
        <span className="text-foreground/60 font-bold">... 👀</span>
      </motion.div>
    </>
  );
}

/* ────────────────── RACE GAME ───────────────────────────── */
function RaceGame() {
  return (
    <>
      {/* Lane 1 */}
      <motion.div
        className="absolute flex items-center gap-1"
        initial={{ left: "-12%", top: "32%" }}
        animate={{ left: ["-12%", "112%"] }}
        transition={{ duration: 2.8, ease: [0.2, 0, 0.6, 1], repeat: Infinity, repeatDelay: 2.5 }}
      >
        <motion.div className="text-lg" animate={{ rotate: [0, -8, 0, 8, 0] }} transition={{ duration: 0.3, repeat: Infinity }}>🐟</motion.div>
        {/* Speed trail */}
        {[1,2,3].map(t => (
          <div key={t} className="rounded-full" style={{ width: `${18 - t * 4}px`, height: 3, background: `rgba(251,191,36,${0.5 - t * 0.12})`, marginLeft: -4 }} />
        ))}
      </motion.div>

      {/* Lane 2 – slightly slower */}
      <motion.div
        className="absolute flex items-center gap-1"
        initial={{ left: "-12%", top: "46%" }}
        animate={{ left: ["-12%", "112%"] }}
        transition={{ duration: 3.6, ease: [0.2, 0, 0.6, 1], repeat: Infinity, repeatDelay: 2.5, delay: 0.5 }}
      >
        <motion.div className="text-lg" animate={{ rotate: [0, -8, 0, 8, 0] }} transition={{ duration: 0.4, repeat: Infinity }}>🐠</motion.div>
        {[1,2,3].map(t => (
          <div key={t} className="rounded-full" style={{ width: `${16 - t * 3}px`, height: 3, background: `rgba(96,165,250,${0.45 - t * 0.10})`, marginLeft: -4 }} />
        ))}
      </motion.div>

      {/* Finish line flash */}
      <motion.div
        className="absolute top-[25%] right-[8%]"
        style={{ width: 2, height: "28%", background: "repeating-linear-gradient(180deg, white 0px, white 6px, transparent 6px, transparent 12px)" }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.5 }}
      />
      <motion.div
        className="absolute right-[5%]"
        style={{ top: "23%", fontSize: 18 }}
        animate={{ scale: [0.9, 1.2, 0.9] }}
        transition={{ duration: 0.4, repeat: Infinity }}
      >🏁</motion.div>
    </>
  );
}

/* ────────────────── CIRCLE GAME ────────────────────────── */
function CircleGame() {
  const fishEmojis = ["🐟","🐠","🐡","🐟","🐠","🐡"];
  return (
    <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
      {/* Subtle orbit ring */}
      <motion.div
        className="absolute rounded-full border border-white/10"
        style={{ width: 160, height: 160, left: -80, top: -80 }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
      {fishEmojis.map((emoji, i) => {
        const angleDeg = (i / fishEmojis.length) * 360;
        const rad = (angleDeg * Math.PI) / 180;
        const r = 70;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ fontSize: 18, left: -12, top: -12, originX: "50%", originY: "50%" }}
            animate={{
              x: [
                Math.cos(rad) * r,
                Math.cos(rad + Math.PI * 2) * r,
              ],
              y: [
                Math.sin(rad) * r,
                Math.sin(rad + Math.PI * 2) * r,
              ],
              rotate: [angleDeg, angleDeg + 360],
            }}
            transition={{
              duration: 8,
              delay: 0,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {emoji}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ────────────────── LEADER GAME ─────────────────────────── */
function LeaderGame() {
  // Fish follow a wavy path with staggered delays
  const path = {
    left: ["10%", "30%", "55%", "75%", "55%", "30%", "10%"],
    top:  ["30%", "50%", "25%", "55%", "35%", "60%", "30%"],
  };
  const delays = [0, 0.5, 1.0, 1.5, 2.0];
  const emojis = ["🐡", "🐠", "🐟", "🐟", "🐟"];

  return (
    <>
      {delays.map((delay, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ fontSize: i === 0 ? 22 : 16 }}
          animate={path}
          transition={{ duration: 10, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {i === 0 ? <span>👑{emojis[0]}</span> : emojis[i]}
        </motion.div>
      ))}
    </>
  );
}