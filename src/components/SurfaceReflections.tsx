import { motion } from "framer-motion";
import { memo } from "react";

function SurfaceReflections() {
  return (
    <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none overflow-hidden z-[5]">
      {/* Water surface ripples */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            background: `linear-gradient(90deg, transparent ${i * 15}%, rgba(255,255,255,0.15) ${i * 15 + 5}%, transparent ${i * 15 + 10}%)`,
            top: `${i * 6}px`,
          }}
          animate={{
            x: ["-100%", "200%"],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.8,
          }}
        />
      ))}
      
      {/* Light caustics */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`caustic-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${10 + i * 30}%`,
            top: `${5 + i * 8}px`,
            width: `${40 + i * 20}px`,
            height: `${20 + i * 10}px`,
            background: "radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%)",
            filter: "blur(3px)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [-20, 20, -20],
          }}
          transition={{
            duration: 3 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}
export default memo(SurfaceReflections);