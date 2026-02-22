import { motion } from "framer-motion";
import { useMemo } from "react";

interface PlanktonParticlesProps {
  /** 0–1, intensity driven by moon phase */
  moonPhase: number;
  /** quantity multiplier based on water clarity */
  waterClarity: number;
  isNight: boolean;
  /** Aquarium mood — calm boosts count and brightness */
  tankMood?: "calm" | "balanced" | "stressed" | "chaotic";
}

/**
 * Micro-particules de plancton bioluminescent.
 * Invisibles le jour, brillent la nuit avec une intensité liée à la phase lunaire.
 * Le mood calme amplifie leur densité et leur éclat.
 */
export default function PlanktonParticles({ moonPhase, waterClarity, isNight, tankMood = "balanced" }: PlanktonParticlesProps) {
  // Calm mood adds up to 40% more particles; chaotic reduces
  const moodCountMult = tankMood === "calm" ? 1.4 : tankMood === "balanced" ? 1.0 : tankMood === "stressed" ? 0.75 : 0.5;
  const moodBrightMult = tankMood === "calm" ? 1.25 : tankMood === "balanced" ? 1.0 : tankMood === "stressed" ? 0.7 : 0.45;

  const count = Math.round((12 + moonPhase * 24 * waterClarity) * moodCountMult); // 6–50

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const s = i * 13.7 + 2.1;
      return {
        x: 2 + Math.abs(Math.sin(s)) * 96,
        y: 5 + Math.abs(Math.cos(s * 0.7)) * 88,
        size: 1.5 + Math.abs(Math.sin(s * 2.3)) * 2.5,
        delay: Math.abs(Math.sin(s * 0.4)) * 6,
        dur: 2.5 + Math.abs(Math.sin(s * 1.1)) * 3,
        hue: 175 + Math.abs(Math.sin(s * 3.7)) * 50, // 175–225 cyan-blue
        drift: (Math.sin(s * 0.6) * 18),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  if (!isNight || moonPhase < 0.1) return null;

  const maxOpacity = Math.min(0.9, (0.15 + moonPhase * 0.65) * moodBrightMult);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5, mixBlendMode: "screen" }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, hsla(${p.hue},90%,75%,1) 0%, transparent 70%)`,
          }}
          animate={{
            opacity: [0, maxOpacity, maxOpacity * 0.6, maxOpacity, 0],
            scale: [0.6, 1.3, 1, 1.4, 0.6],
            x: [0, p.drift * 0.5, p.drift, p.drift * 0.3, 0],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
