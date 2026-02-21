import { motion } from "framer-motion";

// Each rock cluster is defined by layered shapes and gradients
const ROCK_CLUSTERS = [
  {
    group: "left",
    left: "2%",
    rocks: [
      { width: 105, height: 72, rx: "48% 52% 44% 56% / 55% 48% 52% 45%", gradient: "radial-gradient(ellipse at 35% 25%, #5a6070 0%, #3a4050 45%, #252830 100%)", shadow: "inset -6px -8px 14px rgba(0,0,0,0.45), inset 3px 3px 8px rgba(255,255,255,0.07)", top: 18, left: 10, zIndex: 1, mosses: [{ t: 8, l: 12, w: 22, h: 10, c: "rgba(30,90,40,0.55)" }, { t: 20, l: 50, w: 14, h: 7, c: "rgba(40,100,35,0.40)" }] },
      { width: 88, height: 58, rx: "44% 56% 50% 50% / 52% 44% 56% 48%", gradient: "radial-gradient(ellipse at 32% 28%, #626878 0%, #42485a 50%, #2c303c 100%)", shadow: "inset -5px -7px 12px rgba(0,0,0,0.50), inset 2px 3px 7px rgba(255,255,255,0.09)", top: 34, left: 0, zIndex: 3, mosses: [{ t: 10, l: 8, w: 18, h: 8, c: "rgba(35,95,42,0.60)" }, { t: 18, l: 35, w: 10, h: 5, c: "rgba(28,80,36,0.45)" }] },
      { width: 52, height: 36, rx: "50% 50% 48% 52% / 54% 46% 54% 46%", gradient: "radial-gradient(ellipse at 38% 30%, #575e6e 0%, #3e4455 55%, #282c38 100%)", shadow: "inset -3px -5px 8px rgba(0,0,0,0.40), inset 2px 2px 5px rgba(255,255,255,0.07)", top: 52, left: 72, zIndex: 2, mosses: [] },
    ],
    pebbles: [{ b: 0, l: 5, s: 11, c: "#3c4252" }, { b: 0, l: 20, s: 8, c: "#464e60" }, { b: 0, l: 82, s: 9, c: "#383e4e" }, { b: 0, l: 96, s: 6, c: "#50586a" }, { b: 0, l: 110, s: 7, c: "#3a4050" }],
    totalH: 105,
  },
  {
    group: "center",
    left: "38%",
    rocks: [
      { width: 130, height: 52, rx: "50% 50% 46% 54% / 48% 52% 48% 52%", gradient: "radial-gradient(ellipse at 28% 22%, #5c6270 0%, #3c4152 50%, #252930 100%)", shadow: "inset -7px -8px 16px rgba(0,0,0,0.50), inset 3px 3px 8px rgba(255,255,255,0.08)", top: 36, left: 0, zIndex: 2, mosses: [{ t: 8, l: 15, w: 28, h: 11, c: "rgba(32,92,40,0.55)" }, { t: 14, l: 65, w: 18, h: 8, c: "rgba(38,100,42,0.45)" }, { t: 22, l: 95, w: 12, h: 5, c: "rgba(25,78,33,0.40)" }] },
      { width: 48, height: 80, rx: "42% 58% 50% 50% / 60% 60% 40% 40%", gradient: "radial-gradient(ellipse at 38% 20%, #606672 0%, #404652 45%, #2a2e38 100%)", shadow: "inset -4px -6px 10px rgba(0,0,0,0.45), inset 2px 2px 6px rgba(255,255,255,0.08)", top: 0, left: 14, zIndex: 3, mosses: [{ t: 20, l: 6, w: 16, h: 7, c: "rgba(30,85,38,0.50)" }] },
      { width: 68, height: 48, rx: "46% 54% 52% 48% / 50% 46% 54% 50%", gradient: "radial-gradient(ellipse at 34% 28%, #5a6068 0%, #3a4050 50%, #28303a 100%)", shadow: "inset -4px -6px 10px rgba(0,0,0,0.42), inset 2px 2px 5px rgba(255,255,255,0.07)", top: 28, left: 68, zIndex: 1, mosses: [{ t: 10, l: 12, w: 16, h: 7, c: "rgba(33,88,36,0.48)" }] },
    ],
    pebbles: [{ b: 0, l: 8, s: 10, c: "#3e4454" }, { b: 0, l: 26, s: 7, c: "#484e60" }, { b: 0, l: 100, s: 9, c: "#383e4c" }, { b: 0, l: 120, s: 6, c: "#444a5a" }, { b: 0, l: 140, s: 8, c: "#3a4050" }],
    totalH: 120,
  },
  {
    group: "right",
    left: "74%",
    rocks: [
      { width: 96, height: 74, rx: "50% 50% 46% 54% / 52% 48% 52% 48%", gradient: "radial-gradient(ellipse at 36% 24%, #606872 0%, #404852 50%, #2a2e38 100%)", shadow: "inset -6px -8px 14px rgba(0,0,0,0.48), inset 3px 3px 8px rgba(255,255,255,0.08)", top: 12, left: 18, zIndex: 1, mosses: [{ t: 10, l: 18, w: 20, h: 9, c: "rgba(28,88,36,0.52)" }, { t: 22, l: 55, w: 14, h: 6, c: "rgba(35,95,38,0.42)" }] },
      { width: 80, height: 56, rx: "48% 52% 44% 56% / 50% 48% 52% 50%", gradient: "radial-gradient(ellipse at 32% 30%, #626872 0%, #424858 50%, #2c303c 100%)", shadow: "inset -5px -7px 12px rgba(0,0,0,0.50), inset 2px 2px 6px rgba(255,255,255,0.09)", top: 38, left: 0, zIndex: 3, mosses: [{ t: 8, l: 8, w: 18, h: 8, c: "rgba(32,90,36,0.55)" }] },
      { width: 40, height: 28, rx: "50% 50% 48% 52% / 52% 48% 52% 48%", gradient: "radial-gradient(ellipse at 40% 30%, #565c6c 0%, #3c4050 55%, #282c38 100%)", shadow: "inset -2px -4px 7px rgba(0,0,0,0.40), inset 1px 1px 4px rgba(255,255,255,0.07)", top: 60, left: 74, zIndex: 2, mosses: [] },
    ],
    pebbles: [{ b: 0, l: 2, s: 8, c: "#3c4252" }, { b: 0, l: 16, s: 10, c: "#464e5e" }, { b: 0, l: 68, s: 7, c: "#383e50" }, { b: 0, l: 86, s: 9, c: "#424858" }, { b: 0, l: 100, s: 6, c: "#3e4456" }],
    totalH: 100,
  },
];

const LICHEN = [
  { left: "12%", h: 22, w: 3, c: "rgba(40,110,48,0.38)" },
  { left: "14%", h: 16, w: 2, c: "rgba(30,95,40,0.30)" },
  { left: "46%", h: 28, w: 3, c: "rgba(35,100,42,0.40)" },
  { left: "50%", h: 20, w: 2, c: "rgba(28,88,36,0.32)" },
  { left: "79%", h: 24, w: 3, c: "rgba(33,95,40,0.38)" },
  { left: "82%", h: 17, w: 2, c: "rgba(30,88,36,0.28)" },
];

export default function HidingRocks() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[6]" style={{ overflow: 'hidden' }}>

      {/* Fine sand / silt layer at base */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: "22px", background: "linear-gradient(to top, rgba(52,46,36,0.72) 0%, rgba(48,42,32,0.45) 60%, transparent 100%)", borderTop: "1px solid rgba(80,70,52,0.25)" }} />

      {/* Scattered micro-pebbles on sand */}
      {[4, 12, 22, 31, 42, 54, 63, 71, 83, 91].map((xPct, i) => (
        <div key={`mp-${i}`} className="absolute rounded-full" style={{ bottom: `${2 + (i % 3) * 3}px`, left: `${xPct}%`, width: `${4 + (i % 3) * 3}px`, height: `${3 + (i % 3) * 2}px`, background: `radial-gradient(ellipse at 35% 30%, ${["#555e6e","#4a5262","#404858","#50586a"][i % 4]} 0%, #2c3040 100%)`, opacity: 0.65 }} />
      ))}

      {/* Lichen / thin seaweed strands */}
      {LICHEN.map((l, i) => (
        <motion.div key={`lich-${i}`} className="absolute rounded-full" style={{ left: l.left, bottom: 0, width: `${l.w}px`, height: `${l.h}px`, background: `linear-gradient(to top, ${l.c}, transparent)`, borderRadius: "50% 50% 0 0 / 100% 100% 0 0", transformOrigin: "bottom center" }}
          animate={{ rotate: [-2, 2, -1, 2, -2], scaleX: [1, 1.05, 0.95, 1.02, 1] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut" }} />
      ))}

      {/* Rock clusters */}
      {ROCK_CLUSTERS.map((cluster) => {
        const clusterW = cluster.rocks.reduce((max, r) => Math.max(max, r.left + r.width), 0) + 20;
        return (
          <div key={cluster.group} className="absolute" style={{ bottom: 0, left: cluster.left, width: `${clusterW}px`, height: `${cluster.totalH}px` }}>
            {cluster.rocks.map((rock, ri) => (
              <div key={ri} className="absolute" style={{ left: rock.left, top: rock.top, width: rock.width, height: rock.height, zIndex: rock.zIndex }}>
                {/* Rock body */}
                <div className="w-full h-full relative" style={{ borderRadius: rock.rx, background: rock.gradient, boxShadow: `${rock.shadow}, 0 8px 24px rgba(0,0,0,0.60)` }}>
                  {/* Highlight sheen */}
                  <div className="absolute" style={{ top: "10%", left: "15%", width: "38%", height: "30%", background: "radial-gradient(ellipse, rgba(255,255,255,0.10) 0%, transparent 70%)", borderRadius: "50%", transform: "rotate(-20deg)" }} />
                  {/* Crack line */}
                  <div className="absolute opacity-20" style={{ top: "35%", left: "20%", width: "60%", height: "1px", background: "linear-gradient(to right, transparent, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.4) 70%, transparent)", transform: "rotate(-8deg)" }} />
                  {/* Moss patches */}
                  {rock.mosses.map((m, mi) => (
                    <div key={mi} className="absolute rounded-full" style={{ top: m.t, left: m.l, width: m.w, height: m.h, background: m.c, filter: "blur(1.5px)" }} />
                  ))}
                </div>
                {/* Drop shadow */}
                <div className="absolute" style={{ bottom: -8, left: "8%", width: "88%", height: 14, background: "radial-gradient(ellipse at 50% 0%, rgba(0,0,0,0.35) 0%, transparent 75%)", filter: "blur(3px)" }} />
              </div>
            ))}
            {/* Pebbles at base */}
            {cluster.pebbles.map((p, pi) => (
              <div key={pi} className="absolute rounded-full" style={{ bottom: p.b, left: p.l, width: p.s, height: Math.round(p.s * 0.68), background: `radial-gradient(ellipse at 35% 28%, ${p.c}ee 0%, ${p.c}55 100%)`, boxShadow: "0 2px 4px rgba(0,0,0,0.30)", zIndex: 4 }} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
