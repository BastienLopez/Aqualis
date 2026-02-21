import { motion, AnimatePresence } from "framer-motion";

interface WeatherEffectsProps {
  type: "storm" | null;
}

export default function WeatherEffects({ type }: WeatherEffectsProps) {
  if (!type) return null;

  // Realistic lightning with zigzag patterns
  const lightningPaths = [
    "M50,5 L48,12 L52,18 L49,25 L54,32 L51,40 L56,48 L52,58 L58,68 L54,78 L60,90",
    "M20,8 L18,15 L23,22 L20,30 L25,38 L22,46 L28,55 L24,65 L30,80",
    "M80,10 L77,18 L82,25 L79,33 L84,42 L80,50 L86,60 L82,70 L88,85 L85,95",
  ];

  return (
    <AnimatePresence>
      {type === "storm" && (
        <div className="absolute inset-0 pointer-events-none z-25">
          {/* Lightning flashes - more frequent */}
          <motion.div
            className="absolute inset-0 bg-yellow-100/30"
            animate={{
              opacity: [0, 0.9, 0, 0, 0.7, 0, 0, 0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />
          {/* Secondary lightning */}
          <motion.div
            className="absolute inset-0 bg-blue-100/25"
            animate={{
              opacity: [0, 0, 0.8, 0, 0, 0.6, 0],
            }}
            transition={{
              duration: 1.8,
              delay: 0.5,
              repeat: Infinity,
              repeatDelay: 1.2,
            }}
          />
          
          {/* Real lightning bolts */}
          {lightningPaths.map((path, i) => (
            <motion.svg
              key={`lightning-${i}`}
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`lightning-gradient-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              <motion.path
                d={path}
                stroke={`url(#lightning-gradient-${i})`}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1, 1, 0],
                  opacity: [0, 1, 0.8, 0],
                }}
                transition={{
                  duration: 0.4,
                  delay: i * 1.5 + 0.3,
                  repeat: Infinity,
                  repeatDelay: 5 + Math.random() * 3,
                }}
              />
              <motion.path
                d={path}
                stroke="white"
                strokeWidth="1"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1, 1, 0],
                  opacity: [0, 1, 0.9, 0],
                }}
                transition={{
                  duration: 0.4,
                  delay: i * 1.5 + 0.3,
                  repeat: Infinity,
                  repeatDelay: 5 + Math.random() * 3,
                }}
              />
            </motion.svg>
          ))}
          
          {/* Dark storm overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-800/20 to-slate-900/30" />
          
          {/* Electric currents in water */}
          {Array.from({ length: 3 }, (_, i) => (
            <motion.div
              key={`current-${i}`}
              className="absolute w-1 h-full bg-gradient-to-b from-transparent via-blue-300/30 to-transparent"
              style={{
                left: `${20 + i * 30}%`,
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scaleY: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.3,
                delay: i * 0.7,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
