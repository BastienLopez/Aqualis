import { motion } from "framer-motion";

interface CoralProps {
  count?: number;
}

export default function Coral({ count = 4 }: CoralProps) {
  const corals = Array.from({ length: count }, (_, i) => {
    const size = 40 + Math.random() * 30;
    const left = 10 + (i / count) * 80 + Math.random() * 10;
    const delay = Math.random() * 3;
    const type = Math.floor(Math.random() * 3);
    
    return { id: i, size, left, delay, type };
  });

  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[3]">
      {corals.map((coral) => (
        <motion.div
          key={coral.id}
          className="absolute bottom-0"
          style={{
            left: `${coral.left}%`,
            width: `${coral.size}px`,
            height: `${coral.size}px`,
          }}
          animate={{
            scale: [1, 1.05, 1],
            rotate: [-1, 1, -1],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            delay: coral.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {coral.type === 0 && (
            <svg width="100%" height="100%" viewBox="0 0 50 50">
              <path
                d="M25,50 Q20,40 15,30 Q12,20 15,10 Q18,5 25,5 Q32,5 35,10 Q38,20 35,30 Q30,40 25,50"
                fill="rgba(233, 30, 99, 0.5)"
                stroke="rgba(233, 30, 99, 0.7)"
                strokeWidth="1"
              />
              <path
                d="M25,50 Q28,42 32,32 Q35,22 32,12 Q30,7 25,7"
                fill="rgba(255, 64, 129, 0.4)"
              />
            </svg>
          )}
          {coral.type === 1 && (
            <svg width="100%" height="100%" viewBox="0 0 50 50">
              <ellipse cx="25" cy="40" rx="15" ry="8" fill="rgba(156, 39, 176, 0.5)" />
              <path
                d="M15,40 Q15,25 20,15 Q23,8 25,5 Q27,8 30,15 Q35,25 35,40"
                fill="rgba(171, 71, 188, 0.6)"
                stroke="rgba(142, 36, 170, 0.7)"
                strokeWidth="1"
              />
            </svg>
          )}
          {coral.type === 2 && (
            <svg width="100%" height="100%" viewBox="0 0 50 50">
              <circle cx="15" cy="35" r="6" fill="rgba(255, 167, 38, 0.5)" />
              <circle cx="25" cy="30" r="8" fill="rgba(255, 193, 7, 0.5)" />
              <circle cx="35" cy="35" r="6" fill="rgba(255, 167, 38, 0.5)" />
              <circle cx="20" cy="42" r="5" fill="rgba(255, 152, 0, 0.6)" />
              <circle cx="30" cy="42" r="5" fill="rgba(255, 152, 0, 0.6)" />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
}
