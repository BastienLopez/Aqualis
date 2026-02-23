import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FISH_CATALOG } from "@/lib/gameData";
import type { Fish } from "@/lib/gameData";
import SafeImage from "@/components/SafeImage";

type GameType = "schooling" | "hiding" | "race" | "circle" | "leader" | null;

interface FishGamesProps {
  fishCount: number;
  fishData?: Fish[];
  fishPositions?: Record<string, { x: number; y: number }>;
  onGameActive?: (active: boolean) => void;
}

const GAMES: { type: GameType; label: string; desc: string; emoji: string }[] = [
  { type: "schooling", label: "Banc de poissons !",  desc: "Les poissons nagent en formation",            emoji: "🐟" },
  { type: "hiding",    label: "Cache-cache !",        desc: "Les poissons se cachent derriere les rochers",emoji: "🙈" },
  { type: "race",      label: "Course aquatique !",   desc: "Qui sera le plus rapide ?",                   emoji: "🏁" },
  { type: "circle",    label: "Danse circulaire !",   desc: "Nage synchronisee en ronde",                  emoji: "🌀" },
  { type: "leader",    label: "Suivre le leader !",   desc: "Tous suivent le grand poisson",               emoji: "👑" },
];

function pickFish(list: Fish[] | undefined, n: number): Fish[] {
  const src = (list && list.length > 0) ? list : FISH_CATALOG;
  const result: Fish[] = [];
  for (let i = 0; i < n; i++) result.push(src[i % src.length]!);
  return result;
}

export default function FishGames({ fishCount, fishData, onGameActive }: FishGamesProps) {
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [gameInfo, setGameInfo] = useState<typeof GAMES[0] | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (fishCount < 3) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.45 && !activeGame) {
        const picked = GAMES[Math.floor(Math.random() * GAMES.length)];
        setActiveGame(picked.type);
        setGameInfo(picked);
        setBannerVisible(true);
        onGameActive?.(true);
        bannerRef.current = setTimeout(() => setBannerVisible(false), 5000);
        timerRef.current = setTimeout(() => {
          setActiveGame(null);
          setGameInfo(null);
          setBannerVisible(false);
          onGameActive?.(false);
        }, 18000);
      }
    }, 90000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (bannerRef.current) clearTimeout(bannerRef.current);
    };
  }, [fishCount, activeGame, onGameActive]);

  if (!activeGame || !gameInfo) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-[14]">
      <AnimatePresence>
        {bannerVisible && (
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
        )}
      </AnimatePresence>

      {activeGame === "schooling" && <SchoolingGame fish={pickFish(fishData, 7)} />}
      {activeGame === "hiding"    && <HidingGame    fish={pickFish(fishData, 5)} />}
      {activeGame === "race"      && <RaceGame      fish={pickFish(fishData, 2)} />}
      {activeGame === "circle"    && <CircleGame    fish={pickFish(fishData, 6)} />}
      {activeGame === "leader"    && <LeaderGame    fish={pickFish(fishData, 5)} />}
    </div>
  );
}

function SchoolingGame({ fish }: { fish: Fish[] }) {
  const offsets = [
    { dx: 0,   dy: 0  },
    { dx: -28, dy: 18 },
    { dx: 28,  dy: 18 },
    { dx: -54, dy: 36 },
    { dx: 54,  dy: 36 },
    { dx: -78, dy: 52 },
    { dx: 78,  dy: 52 },
  ];
  return (
    <motion.div
      className="absolute"
      style={{ left: 0, top: "38%", width: "100%", height: 0 }}
      animate={{ x: ["-20%", "100%"] }}
      transition={{ duration: 9, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
    >
      {offsets.map((o, i) => {
        const f = fish[i % fish.length]!;
        const sz = 32 - i * 1.5;
        return (
          <motion.div
            key={i}
            className="absolute select-none"
            style={{ left: `${30 + o.dx}px`, top: o.dy, width: sz, height: sz }}
            animate={{ y: [0, -4, 0, 4, 0], rotate: [0, 4, 0, -4, 0] }}
            transition={{ duration: 1.4 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
          >
            <SafeImage src={f.image} mobileSrc={f.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function HidingGame({ fish }: { fish: Fish[] }) {
  const hideSpots = ["12%", "42%", "77%"];
  return (
    <>
      {fish.map((f, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ width: 38, height: 38 }}
          initial={{ left: `${20 + i * 14}%`, top: "30%", opacity: 1, scale: 1 }}
          animate={{
            left: [`${20 + i * 14}%`, hideSpots[i % 3], hideSpots[i % 3], `${15 + i * 15}%`],
            top:  ["30%", "75%", "75%", "35%"],
            opacity: [1, 1, 0, 1],
            scale:   [1, 0.85, 0, 1],
          }}
          transition={{ duration: 7, delay: i * 0.6, times: [0, 0.45, 0.55, 1], ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }}
        >
          <SafeImage src={f.image} mobileSrc={f.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
        </motion.div>
      ))}
      <motion.div
        className="absolute bottom-[18%] glass-nav rounded-full px-3 py-1"
        style={{ left: "35%", fontSize: 11 }}
        animate={{ opacity: [0, 0.7, 0.7, 0] }}
        transition={{ duration: 7, repeat: Infinity, repeatDelay: 2, times: [0, 0.3, 0.6, 1] }}
      >
        <span className="text-foreground/60 font-bold">... ??</span>
      </motion.div>
    </>
  );
}

function RaceGame({ fish }: { fish: Fish[] }) {
  const f1 = fish[0]!;
  const f2 = fish[1] ?? fish[0]!;
  return (
    <>
      <motion.div
        className="absolute flex items-center gap-1"
        initial={{ left: "-12%", top: "32%" }}
        animate={{ left: ["-12%", "112%"] }}
        transition={{ duration: 2.8, ease: [0.2, 0, 0.6, 1], repeat: Infinity, repeatDelay: 2.5 }}
      >
        <div className="w-9 h-9">
          <SafeImage src={f1.image} mobileSrc={f1.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
        </div>
        {[1, 2, 3].map(t => (
          <div key={t} className="rounded-full" style={{ width: `${18 - t * 4}px`, height: 3, background: `rgba(251,191,36,${0.5 - t * 0.12})`, marginLeft: -4 }} />
        ))}
      </motion.div>
      <motion.div
        className="absolute flex items-center gap-1"
        initial={{ left: "-12%", top: "46%" }}
        animate={{ left: ["-12%", "112%"] }}
        transition={{ duration: 3.6, ease: [0.2, 0, 0.6, 1], repeat: Infinity, repeatDelay: 2.5, delay: 0.5 }}
      >
        <div className="w-8 h-8">
          <SafeImage src={f2.image} mobileSrc={f2.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
        </div>
        {[1, 2, 3].map(t => (
          <div key={t} className="rounded-full" style={{ width: `${16 - t * 3}px`, height: 3, background: `rgba(96,165,250,${0.45 - t * 0.10})`, marginLeft: -4 }} />
        ))}
      </motion.div>
      <motion.div
        className="absolute top-[25%] right-[8%]"
        style={{ width: 2, height: "28%", background: "repeating-linear-gradient(180deg, white 0px, white 6px, transparent 6px, transparent 12px)" }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.5 }}
      />
      <motion.div className="absolute right-[5%]" style={{ top: "23%", fontSize: 18 }} animate={{ scale: [0.9, 1.2, 0.9] }} transition={{ duration: 0.4, repeat: Infinity }}>??</motion.div>
    </>
  );
}

function CircleGame({ fish }: { fish: Fish[] }) {
  return (
    <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
      {fish.map((f, i) => {
        const angleDeg = (i / fish.length) * 360;
        const rad = (angleDeg * Math.PI) / 180;
        const r = 70;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ width: 38, height: 38, left: -19, top: -19 }}
            animate={{
              x: [Math.cos(rad) * r, Math.cos(rad + Math.PI * 2) * r],
              y: [Math.sin(rad) * r, Math.sin(rad + Math.PI * 2) * r],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <SafeImage src={f.image} mobileSrc={f.imageMobile} alt="" className="w-full h-full object-contain drop-shadow-xl" fallbackClassName="w-full h-full" />
          </motion.div>
        );
      })}
    </div>
  );
}

function LeaderGame({ fish }: { fish: Fish[] }) {
  const path = {
    left: ["10%", "30%", "55%", "75%", "55%", "30%", "10%"],
    top:  ["30%", "50%", "25%", "55%", "35%", "60%", "30%"],
  };
  const delays = [0, 0.5, 1.0, 1.5, 2.0];
  return (
    <>
      {delays.map((delay, i) => {
        const f = fish[i]!;
        const sz = i === 0 ? 44 : 32;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ width: sz, height: sz }}
            animate={path}
            transition={{ duration: 10, delay, repeat: Infinity, ease: "easeInOut" }}
          >
            {i === 0 && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm">??</span>
            )}
            <SafeImage src={f.image} mobileSrc={f.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
          </motion.div>
        );
      })}
    </>
  );
}
