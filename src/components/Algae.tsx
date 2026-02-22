import { motion } from "framer-motion";
import { useMemo, memo } from "react";

interface AlgaeProps {
  count?: number;
}

interface AlgaeDef {
  id: number;
  left: number;
  height: number;
  segments: number;
  svgW: number;
  delay: number;
  duration: number;
  swayAmount: number;
  colorA: string;
  colorB: string;
  colorC: string;
  curveOffset: number;
}

function buildAlgaePath(segments: number, h: number, curveOffset: number): string {
  const segH = h / segments;
  let d = `M 5 ${h}`;
  for (let s = 0; s < segments; s++) {
    const y1 = h - s * segH;
    const y2 = h - (s + 1) * segH;
    const side = s % 2 === 0 ? curveOffset : -curveOffset;
    d += ` C ${5 + side} ${y1 - segH * 0.3}, ${5 + side} ${y2 + segH * 0.3}, 5 ${y2}`;
  }
  return d;
}

function Algae({ count = 10 }: AlgaeProps) {
  const algae: AlgaeDef[] = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const t = i / count;
      const p1 = Math.abs(Math.sin(i * 7.3 + 1.1));
      const p2 = Math.abs(Math.sin(i * 3.7 + 2.4));
      const p3 = Math.abs(Math.sin(i * 11.1 + 0.8));
      const p4 = Math.abs(Math.sin(i * 5.9 + 3.2));

      const baseLeft = t * 95 + 1;
      const jitter = (p2 - 0.5) * 8;
      const left = Math.max(1, Math.min(96, baseLeft + jitter));

      const height = 55 + p1 * 90;
      const segments = 3 + Math.floor(p2 * 3);
      const svgW = 7 + p3 * 8;

      const delay = p4 * 3.5;
      const duration = 2.8 + p1 * 2.2;
      const swayAmount = 6 + p2 * 12;

      const hue = 110 + p3 * 60;
      const sat = 45 + p1 * 30;
      const alpha1 = 0.5 + p3 * 0.3;
      const alpha2 = 0.6 + p1 * 0.25;
      const alpha3 = 0.7 + p2 * 0.2;

      const curveOffset = 2 + p4 * 4;

      return {
        id: i,
        left,
        height,
        segments,
        svgW,
        delay,
        duration,
        swayAmount,
        colorA: `hsla(${hue}, ${sat}%, ${30 + p1 * 15}%, ${alpha1})`,
        colorB: `hsla(${hue - 8}, ${sat + 5}%, ${22 + p4 * 12}%, ${alpha2})`,
        colorC: `hsla(${hue - 15}, ${sat + 10}%, ${16 + p1 * 10}%, ${alpha3})`,
        curveOffset,
      };
    });
  }, [count]);

  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[5]" style={{ height: "160px" }}>
      {algae.map((alga) => {
        const svgH = alga.height;
        const path = buildAlgaePath(alga.segments, svgH, alga.curveOffset);
        const gradId = `alg-g-${alga.id}`;
        const filtId = `alg-f-${alga.id}`;

        return (
          <motion.div
            key={alga.id}
            className="absolute bottom-0 origin-bottom"
            style={{ left: `${alga.left}%` }}
            animate={{
              rotateZ: [
                -alga.swayAmount * 0.5,
                alga.swayAmount * 0.6,
                -alga.swayAmount * 0.3,
                alga.swayAmount * 0.5,
                -alga.swayAmount * 0.5,
              ],
            }}
            transition={{
              duration: alga.duration,
              delay: alga.delay,
              repeat: Infinity,
              ease: [0.45, 0, 0.55, 1],
              times: [0, 0.27, 0.5, 0.73, 1],
            }}
          >
            <svg
              width={alga.svgW}
              height={svgH}
              viewBox={`0 0 10 ${svgH}`}
              style={{ display: "block", overflow: "visible" }}
            >
              <defs>
                <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={alga.colorC} />
                  <stop offset="40%" stopColor={alga.colorB} />
                  <stop offset="100%" stopColor={alga.colorA} />
                </linearGradient>
                <filter id={filtId} x="-60%" y="-10%" width="220%" height="120%">
                  <feGaussianBlur stdDeviation="0.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Soft glow halo */}
              <path
                d={path}
                fill="none"
                stroke={alga.colorA}
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.2"
                filter={`url(#${filtId})`}
              />

              {/* Main body */}
              <path
                d={path}
                fill={`url(#${gradId})`}
                stroke={alga.colorC}
                strokeWidth="0.3"
                strokeLinecap="round"
                filter={`url(#${filtId})`}
              />

              {/* Translucent highlight */}
              <path
                d={path}
                fill="none"
                stroke={`hsla(${140 + (alga.id % 40)}, 60%, 78%, 0.15)`}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}

export default memo(Algae);
