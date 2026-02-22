import { motion } from "framer-motion";
import { useMemo, memo } from "react";

interface WasteParticlesProps {
  /** 0–50 nitrate level drives particle density */
  nitrateLevel: number;
  isNight?: boolean;
  /** When true (shrimps actively cleaning), visually reduce particles — ecosystem loop */
  shrimpsCleaning?: boolean;
}

/** Mini déchets organiques qui dérivent vers le bas.
 *  Leur densité croît avec le taux de nitrates. */
function WasteParticles({ nitrateLevel, isNight, shrimpsCleaning = false }: WasteParticlesProps) {
  // 3–14 particules selon nitrates — réduit de 60% quand crevettes nettoient
  const rawCount = Math.round(3 + (nitrateLevel / 50) * 11);
  const count = shrimpsCleaning ? Math.max(1, Math.round(rawCount * 0.4)) : rawCount;

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = i * 7.31 + 0.4;
      const x = 5 + ((Math.abs(Math.sin(seed * 2.1)) * 90));        // 5–95 %
      const delay = Math.abs(Math.sin(seed * 1.7)) * 8;
      const duration = 10 + Math.abs(Math.sin(seed * 3.3)) * 14;   // 10–24 s
      const size = 2 + Math.abs(Math.sin(seed * 5.1)) * 3;          // 2–5 px
      const drift = (Math.sin(seed * 0.9) * 30);                    // ±30 px horizontal drift
      const opacity = 0.3 + Math.abs(Math.sin(seed * 4.2)) * 0.35; // 0.3–0.65
      // rougeâtre/brunâtre → vert si beaucoup de nitrates
      const hue = nitrateLevel > 30 ? 100 : nitrateLevel > 15 ? 40 : 25;
      return { x, delay, duration, size, drift, opacity, hue };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  if (nitrateLevel < 5) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: -6,
            width: p.size,
            height: p.size,
            backgroundColor: `hsla(${p.hue}, 55%, 42%, ${p.opacity})`,
            filter: isNight ? "brightness(1.4)" : undefined,
          }}
          animate={{
            y: ["0vh", "105vh"],
            x: [0, p.drift, p.drift * 0.5, p.drift * 1.2, 0],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.15, 0.7, 0.92, 1],
          }}
        />
      ))}
    </div>
  );
}

export default memo(WasteParticles);
