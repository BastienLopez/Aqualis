import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface FoodParticle {
  id: number;
  x: number;       // percent 5–90
  size: number;
  delay: number;
  driftX: number;  // px horizontal drift
  shape: "circle" | "pellet";
  dur: number;
  travelPx: number;
}

interface FoodParticlesProps {
  active: boolean;
  onComplete: () => void;
}

export default function FoodParticles({ active, onComplete }: FoodParticlesProps) {
  const [particles, setParticles] = useState<FoodParticle[]>([]);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;

    const screenH = typeof window !== "undefined" ? window.innerHeight : 700;
    const startTop = 130;                         // px below header
    const endTop = Math.round(screenH * 0.88);    // near bottom nav
    const baseTravel = endTop - startTop;

    const items: FoodParticle[] = Array.from({ length: 18 }, (_, i) => ({
      id: Date.now() + i,
      x: 5 + ((i * 5.3 + Math.sin(i * 2.1) * 14) % 85),
      size: 6 + (i % 4) * 2,          // 6–12 px
      delay: i * 0.10,
      driftX: Math.sin(i * 1.6) * 55,
      shape: i % 2 === 0 ? "pellet" : "circle",
      dur: 3.5 + (i % 5) * 0.3,      // 3.5–4.7 s
      travelPx: baseTravel + (i % 3) * 30,
    }));

    setParticles(items);
    setVisible(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setParticles([]);
      onComplete();
    }, 5000);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible || particles.length === 0) return null;

  return createPortal(
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, pointerEvents: "none", overflow: "hidden" }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 130,   // below header
            width: p.size,
            height: p.shape === "pellet" ? Math.round(p.size * 1.6) : p.size,
            borderRadius: p.shape === "pellet" ? "45% 45% 38% 38%" : "50%",
            background: "radial-gradient(circle at 38% 28%, #fef9e7, #fbbf24, #b45309)",
            boxShadow: "0 0 10px rgba(251,191,36,1), 0 2px 8px rgba(0,0,0,0.55)",
          }}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.3, rotate: 0 }}
          animate={{
            opacity:  [0, 1,    1,                    1,                    0.8,                  0],
            y:        [0, p.travelPx * 0.10, p.travelPx * 0.35, p.travelPx * 0.60, p.travelPx * 0.85, p.travelPx],
            x:        [0, p.driftX * 0.2,   p.driftX * 0.5,    p.driftX * 0.75,   p.driftX * 0.90,   p.driftX],
            scale:    [0.3, 1,  1,                    0.97,                 0.92,                 0.85],
            rotate:
              p.shape === "pellet"
                ? [0, p.driftX > 0 ? 25 : -25, p.driftX > 0 ? 50 : -50, p.driftX > 0 ? 20 : -20, 0, 0]
                : [0, 60, 150, 270, 330, 360],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            ease: "easeIn",
            times: [0, 0.07, 0.28, 0.55, 0.82, 1],
          }}
        />
      ))}
    </div>,
    document.body
  );
}
