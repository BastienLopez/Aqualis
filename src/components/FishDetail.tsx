import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Fish, FISH_CATALOG, AQUARIUM_THEMES } from "@/lib/gameData";
import { useGame } from "@/contexts/GameContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import SafeImage from "@/components/SafeImage";
import { pickImageSrc } from "@/lib/imageCache";

interface FishDetailProps {
  fish: Fish;
  onClose: () => void;
  showAssign?: boolean;
  assignLabel?: string;
  assignMeta?: string;
  onAssign?: () => void;
  assignDisabled?: boolean;
}

const rarityLabel: Record<string, string> = {
  common: "Commun",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
};

export default function FishDetail({
  fish,
  onClose,
  showAssign = false,
  assignLabel,
  assignMeta,
  onAssign,
  assignDisabled = false,
}: FishDetailProps) {
  const { buyFish, getFishPrice, canAfford, ownedFishIds, activeAquarium } = useGame();
  const price = getFishPrice(fish);
  const owned = ownedFishIds.includes(fish.id);
  const theme = AQUARIUM_THEMES.find(t => t.id === activeAquarium) || AQUARIUM_THEMES[0];
  const background = pickImageSrc(theme.background, theme.backgroundMobile);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const similarFish = FISH_CATALOG.filter(f => f.rarity === fish.rarity && f.id !== fish.id).slice(0, 4);

  const handleBuy = () => {
    if (owned) return;
    const success = buyFish(fish.id);
    if (success) {
      toast.success(`${fish.name} ajouté à ta collection !`);
      onClose();
    } else {
      toast.error("Pas assez d'or !");
    }
  };

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [fish.id]);

  useEffect(() => {
    if (typeof document === "undefined") return () => undefined;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevTouch = body.style.touchAction;
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    return () => {
      body.style.overflow = prevOverflow;
      body.style.touchAction = prevTouch;
    };
  }, []);

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] isolate"
      style={{ backgroundColor: "rgba(3, 3, 6, 0.98)" }}
    >
      <div className="absolute inset-0 bg-background">
        <img src={background} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      </div>
      <div ref={contentRef} className="relative z-10 h-full overflow-y-auto no-scrollbar">
        {/* Back button */}
        <button
          onClick={onClose}
          className="fixed top-[10px] left-5 z-50 w-10 h-10 rounded-full card-dark flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        {/* Hero image */}
        <div className="relative h-[40vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-card/50 via-card/30 to-background" />
          <motion.div
            className="absolute right-[-8%] top-[10%] w-[70%] h-[75%]"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <SafeImage
              src={fish.image}
              mobileSrc={fish.imageMobile}
              alt=""
              className="w-full h-full object-contain drop-shadow-2xl"
              fallbackClassName="w-full h-full"
              priority="high"
            />
          </motion.div>
          
          <div className="absolute bottom-8 left-5 right-[45%]">
            <p className="text-xs text-muted-foreground italic mb-1">{fish.scientificName}</p>
            <h2 className="text-2xl font-extrabold text-foreground leading-tight mb-2">{fish.name}</h2>
            {assignMeta && (
              <p className="text-[11px] text-muted-foreground mb-2">{assignMeta}</p>
            )}
            {!owned && !showAssign && (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-gold">{price} or</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-8 pt-2">
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">{fish.description}</p>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-foreground">Caractéristiques</h3>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full badge-${fish.rarity} uppercase tracking-wider`}>
              {rarityLabel[fish.rarity]}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: "Taille", value: fish.size },
              { label: "Température", value: fish.temperature },
              { label: "Régime", value: fish.diet },
              { label: "Vitesse", value: fish.swimSpeed === "slow" ? "Lent" : fish.swimSpeed === "fast" ? "Rapide" : "Normal" },
              { label: "Comportement", value: fish.behavior === "solitary" ? "Solitaire" : fish.behavior === "curious" ? "Curieux" : "Banc" },
              { label: "Rareté", value: rarityLabel[fish.rarity] },
            ].map(spec => (
              <div key={spec.label} className="card-dark rounded-2xl p-3 text-center">
                <p className="text-[9px] text-muted-foreground mb-1 font-medium">{spec.label}</p>
                <p className="text-[11px] font-bold text-foreground">{spec.value}</p>
              </div>
            ))}
          </div>

          {similarFish.length > 0 && (
            <div className="mb-8">
              <h3 className="text-base font-bold text-foreground mb-3">Espèces similaires</h3>
              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                {similarFish.map(sf => (
                  <div key={sf.id} className="card-dark rounded-2xl p-2.5 min-w-[90px] text-center flex-shrink-0">
                    <div className="w-16 h-16 mx-auto mb-1.5">
                      <SafeImage
                        src={sf.image}
                        mobileSrc={sf.imageMobile}
                        alt=""
                        className="w-full h-full object-contain"
                        fallbackClassName="w-full h-full"
                      />
                    </div>
                    <p className="text-[9px] font-semibold text-foreground truncate">{sf.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAssign ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onAssign}
              disabled={assignDisabled}
              className={`w-full flex items-center justify-between rounded-2xl px-5 py-4 ${
                assignDisabled ? "card-dark opacity-60" : "card-warm glow-gold"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-foreground text-sm">+</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {assignLabel ?? "Ajouter a l'aquarium"}
              </span>
              <span className="text-foreground/40 text-sm font-medium">› ›</span>
            </motion.button>
          ) : owned ? (
            <div className="w-full py-4 rounded-2xl card-dark text-center text-sm font-bold text-accent">
              Dans ta collection
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleBuy}
              disabled={!canAfford(fish)}
              className={`w-full flex items-center justify-between rounded-2xl px-5 py-4 ${
                canAfford(fish) ? "card-warm glow-gold" : "card-dark opacity-50"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-foreground text-sm">or</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {canAfford(fish) ? `Acheter · ${price} or` : "Pas assez d'or"}
              </span>
              <span className="text-foreground/40 text-sm font-medium">› ›</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}
