import { motion, memo as memoFM } from "framer-motion";
import { memo } from "react";

function BokehEffect() {
  const bokehCircles = [...Array(12)].map((_, i) => ({
    x: 10 + (i * 77) % 85,
    y: 15 + (i * 43) % 70,
    size: 30 + (i * 17) % 60,
    opacity: 0.1 + (i * 0.03) % 0.15,
    delay: i * 0.4,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none z-[2]">
      {bokehCircles.map((circle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${circle.x}%`,
            top: `${circle.y}%`,
            width: `${circle.size}px`,
            height: `${circle.size}px`,
            background: `radial-gradient(circle, rgba(255,255,255,${circle.opacity}) 0%, rgba(200,230,255,${circle.opacity * 0.5}) 50%, transparent 70%)`,
            filter: "blur(8px)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [circle.opacity * 0.5, circle.opacity, circle.opacity * 0.5],
            x: [-10, 10, -10],
            y: [-5, 5, -5],
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: circle.delay,
          }}
        />
      ))}
    </div>
  );
}

export default memo(BokehEffect);
