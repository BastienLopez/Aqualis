import { motion } from "framer-motion";

interface LightRaysProps {
  count?: number;
  intensity?: number;
}

export default function LightRays({ count = 6, intensity = 0.3 }: LightRaysProps) {
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
