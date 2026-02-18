import { Fish } from "@/lib/gameData";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import SafeImage from "@/components/SafeImage";

interface FishCardProps {
  fish: Fish;
  onClick: () => void;
  owned?: boolean;
  variant?: "warm" | "cool";
  imageAlign?: "right" | "center";
}

const rarityLabel: Record<string, string> = {
  common: "Commun",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
};

export default function FishCard({ fish, onClick, owned, variant, imageAlign = "right" }: FishCardProps) {
  const { getFishPrice } = useGame();
  const price = getFishPrice(fish);

  const cardClass = variant === "cool" ? "card-cool" : "card-warm";
  const imageWrapperClass = imageAlign === "center"
    ? "absolute left-1/2 top-[5%] w-[55%] h-[90%] -translate-x-1/2"
    : "absolute right-[-8%] top-[5%] w-[55%] h-[90%]";

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`${cardClass} rounded-3xl overflow-hidden text-left w-full group relative h-44`}
    >
      {/* Price tag */}
      {!owned && (
        <div className="absolute top-4 left-5 z-10">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs text-gold">🪙</span>
            <span className="text-2xl font-extrabold text-foreground">{price}</span>
          </div>
        </div>
      )}

      {/* Rarity badge */}
      <span className={`absolute top-4 right-14 z-10 text-[8px] font-bold px-2 py-0.5 rounded-full badge-${fish.rarity} uppercase tracking-wider`}>
        {rarityLabel[fish.rarity]}
      </span>

      {/* Arrow button */}
      <div className="absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>

      {/* Fish image - overflow right */}
      <div className={imageWrapperClass}>
        <SafeImage
          src={fish.image}
          mobileSrc={fish.imageMobile}
          alt=""
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 drop-shadow-2xl"
          fallbackClassName="w-full h-full"
        />
      </div>

      {/* Name */}
      <div className="absolute bottom-4 left-5 z-10">
        <h3 className="font-bold text-base text-foreground">{fish.name}</h3>
        {owned && (
          <span className="text-[9px] font-semibold text-accent mt-0.5 block">✓ Possédé</span>
        )}
      </div>
    </motion.button>
  );
}
