import { motion } from "framer-motion";
import { memo } from "react";

interface Props {
  nitrateLevel?: number; // 0–50; >25 bleaches corals, >40 = full white
  daysSinceInstall?: number; // corals grow over time, max +25% height
}

function AnimatedCorals({ nitrateLevel = 0, daysSinceInstall = 0 }: Props) {
  // Bleach factor 0 (healthy) → 1 (fully bleached)
  const bleach = Math.max(0, Math.min(1, (nitrateLevel - 20) / 25));
  // Growth factor: corals gradually get taller over 60 days
  const growthFactor = Math.min(1.25, 1 + Math.min(daysSinceInstall, 60) * 0.004);
  // Regeneration: if nitrates are now low after bleaching, show partially regrowing
  const regenHint = nitrateLevel < 20 && bleach === 0 && daysSinceInstall > 3;

  function bleachColor(r: number, g: number, b: number, a: number): string {
    const br = Math.round(r + (255 - r) * bleach);
    const bg = Math.round(g + (255 - g) * bleach);
    const bb = Math.round(b + (255 - b) * bleach);
    const ba = a * (1 - bleach * 0.4);
    return `rgba(${br},${bg},${bb},${ba})`;
  }

  const corals = [
    { x: 10, height: Math.round(80 * growthFactor), color: bleachColor(255, 107, 107, 0.6), delay: 0 },
    { x: 25, height: Math.round(60 * growthFactor), color: bleachColor(255, 182, 193, 0.5), delay: 0.3 },
    { x: 75, height: Math.round(70 * growthFactor), color: bleachColor(255, 127, 80, 0.6), delay: 0.6 },
    { x: 88, height: Math.round(55 * growthFactor), color: bleachColor(255, 160, 122, 0.5), delay: 0.9 },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[6]">
      {/* Coral state communicated visually via bleachColor — no text overlay needed */}
      {corals.map((coral, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 origin-bottom"
          style={{
            left: `${coral.x}%`,
            width: "40px",
            height: `${coral.height * (1 - bleach * 0.3)}px`,
          }}
          animate={{
            rotateZ: bleach > 0.5 ? [-1, 1, -1] : [-3, 3, -3],
            scaleY: [1, 1.05, 1],
          }}
          transition={{
            duration: bleach > 0.5 ? 6 + i * 1 : 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: coral.delay,
          }}
        >
          {/* Coral branches */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 rounded-t-full"
            style={{
              height: "100%",
              background: `linear-gradient(to top, ${coral.color}, transparent)`,
            }}
            animate={{ scaleX: [1, 1.1, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: coral.delay + 0.2,
            }}
          />
          
          {/* Side branches */}
          {[...Array(3)].map((_, j) => (
            <motion.div
              key={j}
              className="absolute rounded-full"
              style={{
                left: j % 2 === 0 ? "30%" : "70%",
                bottom: `${30 + j * 20}%`,
                width: "8px",
                height: `${20 + j * 5}px`,
                background: coral.color,
                transformOrigin: "bottom center",
              }}
              animate={{
                rotateZ: j % 2 === 0 ? [-15, -10, -15] : [15, 10, 15],
                scaleY: [1, 1.08, 1],
              }}
              transition={{
                duration: 2.5 + j * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: coral.delay + j * 0.15,
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}
export default memo(AnimatedCorals);
