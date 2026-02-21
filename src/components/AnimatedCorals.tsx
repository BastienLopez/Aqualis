import { motion } from "framer-motion";

export default function AnimatedCorals() {
  const corals = [
    { x: 10, height: 80, color: "rgba(255, 107, 107, 0.6)", delay: 0 },
    { x: 25, height: 60, color: "rgba(255, 182, 193, 0.5)", delay: 0.3 },
    { x: 75, height: 70, color: "rgba(255, 127, 80, 0.6)", delay: 0.6 },
    { x: 88, height: 55, color: "rgba(255, 160, 122, 0.5)", delay: 0.9 },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[6]">
      {corals.map((coral, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 origin-bottom"
          style={{
            left: `${coral.x}%`,
            width: "40px",
            height: `${coral.height}px`,
          }}
          animate={{
            rotateZ: [-3, 3, -3],
            scaleY: [1, 1.05, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: coral.delay,
          }}
        >
          {/* Coral branches */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 rounded-t-full"
            style={{
              height: "100%",
              background: `linear-gradient(to top, ${coral.color}, transparent)`,
            }}
            animate={{
              scaleX: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: coral.delay + 0.2,
            }}
          />
          
          {/* Side branches */}
          {[...Array(3)].map((_, j) => (
            <motion.div
              key={j}
              className="absolute rounded-full"
              style={{
                left: j % 2 === 0 ? "30%" : "70%",
                bottom: `${30 + j * 20}%`,
                width: "8px",
                height: `${20 + j * 5}px`,
                background: coral.color,
                transformOrigin: "bottom center",
              }}
              animate={{
                rotateZ: j % 2 === 0 ? [-15, -10, -15] : [15, 10, 15],
                scaleY: [1, 1.08, 1],
              }}
              transition={{
                duration: 2.5 + j * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: coral.delay + j * 0.15,
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}
