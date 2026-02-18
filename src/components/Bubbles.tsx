import { useMemo } from "react";

export default function Bubbles({ count = 15 }: { count?: number }) {
  const bubbles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 6,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
      opacity: 0.05 + Math.random() * 0.2,
      wobble: Math.random() * 20 - 10,
    })), [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-5">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full bg-foreground/10 animate-bubble"
          style={{
            left: `${b.left}%`,
            bottom: "-20px",
            width: b.size,
            height: b.size,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            opacity: b.opacity,
          }}
        />
      ))}
    </div>
  );
}
