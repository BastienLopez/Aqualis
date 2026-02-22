import { motion } from "framer-motion";
import { useState, useEffect, memo } from "react";

interface SandParticlesProps {
  fishPositions?: { x: number; y: number; active: boolean }[];
}

// Pre-compute stable drift values — Math.random() inside animate{} creates new
// arrays every render, forcing Framer Motion to restart all animations.
const DRIFT_POOL = Array.from({ length: 20 }, () => (Math.random() * 10 - 5));

function SandParticles({ fishPositions = [] }: SandParticlesProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; drift: number }[]>([]);

  useEffect(() => {
    // Generate sand particles when fish are near bottom (y > 70%)
    const newParticles: typeof particles = [];
    fishPositions.forEach((pos, i) => {
      if (pos.active && pos.y > 70) {
        newParticles.push({
          id: Date.now() + i,
          x: pos.x,
          y: 90,
          drift: DRIFT_POOL[i % DRIFT_POOL.length],
        });
      }
    });

    if (newParticles.length > 0) {
      setParticles(prev => [...prev.slice(-10), ...newParticles].slice(-12));
    }
  }, [fishPositions]);

  return (
    <div className="absolute inset-0 pointer-events-none z-[8]">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 rounded-full bg-amber-200/60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            willChange: "transform, opacity",
          }}
          initial={{ opacity: 0, y: 0, scale: 1 }}
          animate={{
            opacity: [0, 0.8, 0],
            y: [-5, -15, -25],
            x: [0, particle.drift],
            scale: [1, 0.5, 0.1],
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          onAnimationComplete={() => {
            setParticles(prev => prev.filter(p => p.id !== particle.id));
          }}
        />
      ))}
    </div>
  );
}

export default memo(SandParticles);
