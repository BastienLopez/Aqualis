import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface SandParticlesProps {
  fishPositions?: { x: number; y: number; active: boolean }[];
}

export default function SandParticles({ fishPositions = [] }: SandParticlesProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    // Generate sand particles when fish are near bottom (y > 70%)
    const newParticles: typeof particles = [];
    fishPositions.forEach((pos, i) => {
      if (pos.active && pos.y > 70) {
        newParticles.push({
          id: Date.now() + i,
          x: pos.x,
          y: 90, // Bottom of aquarium
        });
      }
    });
    
    if (newParticles.length > 0) {
      setParticles(prev => [...prev.slice(-10), ...newParticles].slice(-15)); // Keep max 15 particles
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
          }}
          initial={{ opacity: 0, y: 0, scale: 1 }}
          animate={{
            opacity: [0, 0.8, 0],
            y: [-5, -15, -25],
            x: [0, Math.random() * 10 - 5],
            scale: [1, 0.5, 0.1],
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
          onAnimationComplete={() => {
            setParticles(prev => prev.filter(p => p.id !== particle.id));
          }}
        />
      ))}
    </div>
  );
}
