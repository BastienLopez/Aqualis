import { motion } from "framer-motion";
import { memo } from "react";

interface LightRaysProps {
  count?: number;
  intensity?: number;
  /** Switch to lunar volumetric mode at night */
  isNight?: boolean;
  /** 0–1 lunar phase — drives intensity of lunar rays */
  moonPhase?: number;
}

function LightRays({ count = 6, intensity = 0.3, isNight = false, moonPhase = 0 }: LightRaysProps) {
  if (isNight) {
    // ── Lunar volumetric rays: fewer, wider, slower, blue-violet ─────────────
    const lunarCount = Math.max(2, Math.round(count * 0.6));
    const lunarIntensity = moonPhase * 0.55; // fade to 0 on new moon
    if (lunarIntensity < 0.04) return null; // invisible near new moon
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]">
        {[...Array(lunarCount)].map((_, i) => {
          const hue = 210 + i * 20; // 210–260 blue→violet
          const w = 8 + i * 4; // wider beams: 8–20px
          return (
            <motion.div
              key={i}
              className="absolute top-0 origin-top"
              style={{
                left: `${10 + i * (80 / lunarCount)}%`,
                width: `${w}px`,
                height: "85%",
                background: `linear-gradient(to bottom, hsla(${hue},90%,75%,${lunarIntensity}) 0%, hsla(${hue},85%,60%,${lunarIntensity * 0.45}) 35%, transparent 75%)`,
                transform: `skewX(${-6 + i * 3}deg)`,
                filter: "blur(5px)",
                mixBlendMode: "screen",
              }}
              animate={{
                opacity: [lunarIntensity * 0.5, lunarIntensity, lunarIntensity * 0.65, lunarIntensity],
                scaleY: [0.9, 1, 0.92, 1],
                scaleX: [0.85, 1, 0.9, 1.05, 1],
              }}
              transition={{
                duration: 7 + i * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8,
              }}
            />
          );
        })}
      </div>
    );
  }

  // ── Default: solar white rays ─────────────────────────────────────────────
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[3]">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 origin-top"
          style={{
            left: `${5 + i * (90 / count)}%`,
            width: "2px",
            height: "100%",
            background: `linear-gradient(to bottom, rgba(255,255,255,${intensity}) 0%, rgba(255,255,255,${intensity * 0.6}) 20%, transparent 60%)`,
            transform: `skewX(${-10 + i * 2}deg)`,
            filter: "blur(2px)",
          }}
          animate={{
            opacity: [0.3, intensity, 0.3],
            scaleY: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}
export default memo(LightRays);