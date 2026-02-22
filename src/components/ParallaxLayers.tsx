import { motion } from "framer-motion";
import { useState, useEffect, useRef, memo } from "react";

function ParallaxLayers() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle via rAF — fire at most once per frame
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setMousePosition({
          x: (e.clientX / window.innerWidth - 0.5) * 20,
          y: (e.clientY / window.innerHeight - 0.5) * 20,
        });
      });
    };

    // passive: true — tells browser we won't call preventDefault → no scroll jank
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Back layer - slowest movement */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[1]"
        animate={{
          x: mousePosition.x * 0.3,
          y: mousePosition.y * 0.3,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        {/* Deep ocean gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-blue-900/10 to-transparent" />
        
        {/* Distant rocks */}
        <div className="absolute bottom-0 left-[15%] w-32 h-24 bg-gray-700/20 rounded-t-full blur-sm" />
        <div className="absolute bottom-0 right-[20%] w-40 h-28 bg-gray-700/20 rounded-t-full blur-sm" />
      </motion.div>

      {/* Middle layer - medium movement */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[4]"
        animate={{
          x: mousePosition.x * 0.6,
          y: mousePosition.y * 0.6,
        }}
        transition={{ type: "spring", stiffness: 70, damping: 20 }}
      >
        {/* Mid-depth seaweed */}
        <div className="absolute bottom-0 left-[30%] w-2 h-48 bg-green-600/30 rounded-t-lg blur-[1px]" />
        <div className="absolute bottom-0 left-[35%] w-2 h-56 bg-green-500/30 rounded-t-lg blur-[1px]" />
        <div className="absolute bottom-0 right-[40%] w-2 h-52 bg-green-600/30 rounded-t-lg blur-[1px]" />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + Math.sin(i) * 30}%`,
            }}
          />
        ))}
      </motion.div>

      {/* Front layer - fastest movement */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[10]"
        animate={{
          x: mousePosition.x * 1.2,
          y: mousePosition.y * 1.2,
        }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        {/* Close seaweed in foreground */}
        <div className="absolute bottom-0 left-[5%] w-3 h-64 bg-green-700/40 rounded-t-lg blur-[2px] opacity-60" />
        <div className="absolute bottom-0 right-[8%] w-3 h-72 bg-green-800/40 rounded-t-lg blur-[2px] opacity-60" />
        
        {/* Large out-of-focus particles */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-8 h-8 bg-white/10 rounded-full blur-md"
            style={{
              left: `${5 + i * 30}%`,
              top: `${15 + Math.cos(i) * 40}%`,
            }}
          />
        ))}
      </motion.div>
    </>
  );
}

export default memo(ParallaxLayers);
