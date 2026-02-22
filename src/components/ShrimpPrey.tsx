import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect } from "react";

interface ShrimpPreyProps {
  carnivorePositions?: { x: number; y: number }[];
  onShrimpCaught?: () => void;
  nitrateLevel?: number; // when high, shrimps actively clean waste
}

const SHRIMP_COLORS = [
  { body: "#e74c3c", stripe: "#c0392b", tip: "#f1948a", leg: "#f1948a" },
  { body: "#d5e8d4", stripe: "#82b366", tip: "#ade0ab", leg: "#b8e0b8" },
  { body: "#d4b896", stripe: "#a0785a", tip: "#f0e0c8", leg: "#e8c8a8" },
  { body: "#5b8dd9", stripe: "#3a6dbf", tip: "#85aef0", leg: "#6ba0f0" },
];

function ShrimpBody({ variant, fast }: { variant: number; fast?: boolean }) {
  const c = SHRIMP_COLORS[variant % 4];
  return (
    <svg width="36" height="26" viewBox="-10 0 48 28" xmlns="http://www.w3.org/2000/svg" style={{ overflow: "visible" }}>
      <line x1="2" y1="6" x2="-12" y2="-1" stroke={c.tip} strokeWidth="0.9" opacity="0.85" />
      <line x1="2" y1="8" x2="-14" y2="4" stroke={c.tip} strokeWidth="0.9" opacity="0.75" />
      <path d="M4,11 C4,5 10,3 17,4 C24,3 29,5 32,10 C34,15 30,19 23,18 C16,19 9,18 5,16 C3,14 3,13 4,11 Z"
        fill={c.body} stroke={c.stripe} strokeWidth="0.6" />
      {[9, 14, 19, 24].map((xi, i) => (
        <path key={i} d={`M${xi},4 L${xi - 1},18`} stroke={c.stripe} strokeWidth="1.3" opacity="0.45" strokeLinecap="round" />
      ))}
      <ellipse cx="5" cy="11" rx="4.5" ry="5.5" fill={c.body} />
      <circle cx="3.5" cy="8.5" r="2" fill={c.stripe} />
      <circle cx="3.5" cy="8.5" r="1.1" fill="rgba(0,0,0,0.85)" />
      <circle cx="3" cy="8" r="0.45" fill="white" opacity="0.9" />
      <path d="M1.5,7 L-4,3.5" stroke={c.stripe} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M30,9 L37,5 L37,11 L30,13Z" fill={c.body} opacity="0.85" />
      <path d="M30,11 L37,12 L37,18 L30,17Z" fill={c.body} opacity="0.8" />
      {[9, 13, 17, 21, 25].map((xi, i) => (
        <motion.line key={i} x1={xi} y1="17" x2={xi + (i % 2 === 0 ? -2 : 2)} y2="26"
          stroke={c.leg} strokeWidth="1" opacity="0.75"
          animate={{ rotate: [0, fast ? 22 : -10, 0, fast ? -22 : 10, 0] }}
          transition={{ duration: fast ? 0.18 : 0.5, delay: i * 0.07, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${xi}px 17px` }} />
      ))}
      {[12, 17, 22].map((xi, i) => (
        <motion.ellipse key={i} cx={xi} cy="19.5" rx="2.2" ry="1.3" fill={c.leg} opacity="0.55"
          animate={{ scaleY: [0.7, 1.4, 0.7] }}
          transition={{ duration: fast ? 0.15 : 0.38, delay: i * 0.1, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${xi}px 18px` }} />
      ))}
    </svg>
  );
}

// Each shrimp swims from one edge to the other, repeating forever
// q = deterministic pseudo-random in [0,1]
function q(seed: number) { return Math.abs(Math.sin(seed * 17.3 + 4.1)); }

export default function ShrimpPrey({ carnivorePositions = [], onShrimpCaught: _onShrimpCaught, nitrateLevel = 0 }: ShrimpPreyProps) {
  const isCleaningMode = nitrateLevel > 20;

  const [cleanBubbles, setCleanBubbles] = useState<{ id: number; x: number }[]>([]);
  useEffect(() => {
    if (!isCleaningMode) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const iv = setInterval(() => {
      const x = 10 + Math.random() * 80;
      const id = Date.now();
      setCleanBubbles(prev => [...prev, { id, x }]);
      // Track the timeout so we can clear it on unmount
      timers.push(setTimeout(() => setCleanBubbles(prev => prev.filter(b => b.id !== id)), 1800));
    }, 3500);
    return () => {
      clearInterval(iv);
      timers.forEach(clearTimeout);
    };
  }, [isCleaningMode]);
  // 4 shrimps with deterministic starting params
  const shrimps = useMemo(() => Array.from({ length: 4 }, (_, i) => {
    const fromRight = i % 2 === 0;
    const yPct   = 70 + q(i * 3.1) * 18;          // 70�88% from top
    const bobAmp = 6  + q(i * 5.7) * 12;           // vertical bob amount in px
    const speed  = 8  + q(i * 2.9) * 10;           // seconds to cross tank
    const delay  = i  * 2.2;                         // stagger start
    const variant = i % 4;
    // path: from off-screen ? across full tank ? off-screen other side ? back
    // uses vw units via percentage of screen width (110vw ? -10vw round trip)
    return { id: i, fromRight, yPct, bobAmp, speed, delay, variant };
  }), []);

  return (
    <div className="absolute inset-0 pointer-events-none z-[9]">
      {/* 🧹 Cleaning bubble pops when shrimps eat waste */}
      <AnimatePresence>
        {cleanBubbles.map(b => (
          <motion.div key={b.id} className="absolute pointer-events-none"
            style={{ left: `${b.x}%`, bottom: "12%", fontSize: 10, color: "rgba(100,220,120,0.85)", fontWeight: 700, whiteSpace: "nowrap" }}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: [0, 1, 0.8, 0], y: [-0, -28], scale: [0.7, 1.1, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut" }}>
            🧹✨
          </motion.div>
        ))}
      </AnimatePresence>
      {shrimps.map((s) => {
        const startX  = s.fromRight ? "112%" : "-12%";
        const endX    = s.fromRight ? "-12%" : "112%";
        const flipBase = s.fromRight ? -1 : 1; // face direction of travel

        return (
          <motion.div
            key={s.id}
            style={{
              position: "absolute",
              top: `${s.yPct}%`,
              left: 0,
              width: "fit-content",
            }}
            animate={{
              x: [startX, endX],
              y: [0, -s.bobAmp, s.bobAmp * 0.5, -s.bobAmp * 0.7, s.bobAmp * 0.3, 0],
            }}
            transition={{
              x: {
                duration: s.speed,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "linear",
                delay: s.delay,
              },
              y: {
                duration: s.speed * 0.4,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
                delay: s.delay,
              },
            }}
          >
            {/* Drop shadow */}
            <div style={{
              position: "absolute", bottom: -5, left: "50%",
              transform: "translateX(-50%)",
              width: 24, height: 4, borderRadius: "50%",
              background: "rgba(0,0,0,0.22)", filter: "blur(3px)",
            }} />
            {/* Mirror based on travel direction � flip when reversing */}
            <motion.div
              animate={{ scaleX: [flipBase, flipBase, -flipBase, -flipBase, flipBase] }}
              transition={{
                duration: s.speed,
                repeat: Infinity,
                repeatType: "loop",
                times: [0, 0.49, 0.5, 0.99, 1],
                ease: "linear",
                delay: s.delay,
              }}
              style={{
                display: "inline-block",
                filter: isCleaningMode
                  ? "drop-shadow(0 2px 5px rgba(0,0,0,0.5)) drop-shadow(0 0 6px rgba(80,220,100,0.7))"
                  : "drop-shadow(0 2px 5px rgba(0,0,0,0.5))",
              }}
            >
              <ShrimpBody variant={s.variant} fast={false} />
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
