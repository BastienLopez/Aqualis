import { motion } from "framer-motion";
import { memo, useMemo } from "react";

function Bubbles({ count = 20 }: { count?: number }) {
  const bubbles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 8, // More variety in size
      delay: Math.random() * 10,
      duration: 5 + Math.random() * 10, // Variable speeds
      opacity: 0.1 + Math.random() * 0.3,
      wobbleX: (Math.random() - 0.5) * 40, // Horizontal wobble
      wobbleIntensity: Math.random() * 3,
    })), [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          className="absolute rounded-full bg-gradient-radial from-white/20 via-white/10 to-transparent border border-white/20"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            filter: "blur(0.5px)",
            boxShadow: "inset 0 0 2px rgba(255,255,255,0.5), 0 0 3px rgba(255,255,255,0.2)",
          }}
          initial={{ y: "110vh", opacity: 0 }}
          animate={{
            y: ["-10vh"],
            x: [0, b.wobbleX, -b.wobbleX / 2, b.wobbleX / 3, 0],
            scale: [1, 1.1, 1, 0.9, 1],
            opacity: [0, b.opacity, b.opacity, b.opacity * 0.5, 0],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: "linear",
            x: {
              duration: b.duration / b.wobbleIntensity,
              repeat: Infinity,
              ease: "easeInOut",
            },
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />
      ))}
    </div>
  );
}

export default memo(Bubbles);
