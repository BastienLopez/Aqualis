import { motion } from "framer-motion";

interface HealthBarProps {
  health: number;
  visible: boolean;
}

export default function HealthBar({ health, visible }: HealthBarProps) {
  if (!visible || health >= 90) return null;

  const healthColor =
    health > 70 ? "bg-green-500" :
    health > 40 ? "bg-yellow-500" :
    health > 20 ? "bg-orange-500" :
    "bg-red-500";

  return (
    <motion.div
      className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 pointer-events-none z-20"
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
    >
      {/* Background */}
      <div className="h-1.5 bg-gray-700/80 rounded-full overflow-hidden backdrop-blur-sm">
        {/* Health bar */}
        <motion.div
          className={`h-full ${healthColor}`}
          initial={{ width: "100%" }}
          animate={{ width: `${health}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      {/* Critical health warning pulse */}
      {health < 20 && (
        <motion.div
          className="absolute -inset-1 bg-red-500/20 rounded-full blur-sm"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );
}
