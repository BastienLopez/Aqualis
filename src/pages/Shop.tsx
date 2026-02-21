import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { FISH_CATALOG, AQUARIUM_THEMES, Fish, calculatePrice } from "@/lib/gameData";
import FishDetail from "@/components/FishDetail";
import SafeImage from "@/components/SafeImage";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { pickImageSrc } from "@/lib/imageCache";

const shopTabs = ["Poissons", "Aquariums"];

export default function Shop() {
  const navigate = useNavigate();
  const { gold, ownedFishIds, level, ownedAquariums, buyAquarium, setActiveAquarium, userName } = useGame();
  const [activeTab, setActiveTab] = useState("Poissons");
  const [selectedFish, setSelectedFish] = useState<Fish | null>(null);

  const availableFish = FISH_CATALOG.filter(f => !ownedFishIds.includes(f.id));

  const rarityGradient: Record<string, string> = {
    common: 'linear-gradient(135deg, hsl(0 0% 14%), hsl(0 0% 18%))',
    rare: 'linear-gradient(135deg, hsl(210 45% 12%), hsl(220 55% 18%))',
    epic: 'linear-gradient(135deg, hsl(270 40% 13%), hsl(275 50% 20%))',
    legendary: 'linear-gradient(135deg, hsl(35 45% 12%), hsl(40 60% 20%))',
  };

  const rarityBadge: Record<string, string> = {
    common: 'hsl(0 0% 55%)',
    rare: 'hsl(210 70% 55%)',
    epic: 'hsl(270 65% 65%)',
    legendary: 'hsl(38 85% 55%)',
  };

  const handleBuyAquarium = (theme: typeof AQUARIUM_THEMES[0]) => {
    if (ownedAquariums.includes(theme.id)) {
      setActiveAquarium(theme.id);
      toast.success(`${theme.name} activé !`);
      return;
    }
    if (theme.unlockLevel > level) {
      toast.error(`Niveau ${theme.unlockLevel} requis`);
      return;
    }
    if (theme.price > 0) {
      const success = buyAquarium(theme.id, theme.price);
      if (success) toast.success(`${theme.name} acheté !`);
      else toast.error("Pas assez d'or");
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(160deg, hsl(30 35% 7%) 0%, hsl(200 30% 6%) 60%, hsl(220 25% 5%) 100%)' }}>
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, hsl(32 70% 50%), hsl(20 65% 45%))' }}>
            🐠
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Boutique</p>
            <h1 className="text-base font-bold text-foreground">{userName}</h1>
          </div>
        </div>
        <div className="rounded-full px-4 py-2 flex items-center gap-1.5" style={{ background: 'linear-gradient(135deg, hsl(38 60% 18%), hsl(30 50% 12%))' }}>
          <span className="text-xs">🪙</span>
          <span className="text-sm font-bold text-gold">{gold}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-5 flex gap-6 items-baseline">
        {shopTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-base transition-all duration-200 pb-1 ${
              activeTab === tab
                ? "text-foreground font-bold border-b-2 border-primary"
                : "text-muted-foreground font-medium"
            }`}
          >
            {tab === "Poissons" ? "🐟 Poissons" : "🏠 Aquariums"}
          </button>
        ))}
      </div>

      {activeTab === "Poissons" && (
        <div className="px-5">
          <div className="grid grid-cols-2 gap-3">
            {availableFish.map((fish) => {
              const price = calculatePrice(fish.basePrice, level);
              const canAfford = gold >= price;
              return (
                <motion.button
                  key={fish.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedFish(fish)}
                  className="rounded-2xl p-3 text-left border border-transparent hover:border-foreground/10 transition-colors relative overflow-hidden"
                  style={{ background: rarityGradient[fish.rarity] }}
                >
                  {/* Rarity accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: rarityBadge[fish.rarity] }} />
                  
                  <div className="relative aspect-square mb-2 rounded-xl overflow-hidden bg-foreground/5">
                    <SafeImage
                      src={fish.image}
                      mobileSrc={fish.imageMobile}
                      alt={fish.name}
                      className="w-full h-full object-contain"
                      fallbackClassName="w-full h-full"
                    />
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: rarityBadge[fish.rarity] }} />
                  </div>

                  <p className="text-xs font-bold text-foreground truncate">{fish.name}</p>
                  <p className="text-[10px] text-muted-foreground italic truncate mb-2">{fish.scientificName}</p>

                  <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 w-fit ${canAfford ? 'bg-primary/20' : 'bg-muted/40'}`}>
                    <span className="text-[10px]">🪙</span>
                    <span className={`text-[11px] font-bold ${canAfford ? 'text-gold' : 'text-muted-foreground'}`}>{price}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
          {availableFish.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-foreground font-bold">Tu possèdes tous les poissons !</p>
              <p className="text-sm text-muted-foreground mt-1">Impressionnant.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "Aquariums" && (
        <div className="px-5 space-y-4">
          {AQUARIUM_THEMES.map(theme => {
            const owned = ownedAquariums.includes(theme.id);
            const locked = theme.unlockLevel > level;
            return (
              <motion.button
                key={theme.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleBuyAquarium(theme)}
                className={`w-full card-dark rounded-3xl overflow-hidden text-left ${owned ? "ring-1 ring-foreground/10" : ""}`}
              >
                <div className="relative h-36">
                  <img
                    src={pickImageSrc(theme.background, theme.backgroundMobile)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                    <div>
                      <h3 className="font-bold text-base text-foreground">{theme.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{theme.subtitle}</p>
                    </div>
                    {owned ? (
                      <span className="glass-nav rounded-full px-3 py-1 text-[10px] font-semibold text-accent">✓ Possédé</span>
                    ) : locked ? (
                      <span className="glass-nav rounded-full px-3 py-1 text-[10px] font-semibold text-muted-foreground">🔒 Niv. {theme.unlockLevel}</span>
                    ) : theme.price > 0 ? (
                      <span className="glass-nav rounded-full px-3 py-1 text-[10px] font-bold text-gold">🪙 {theme.price}</span>
                    ) : (
                      <span className="glass-nav rounded-full px-3 py-1 text-[10px] font-semibold text-accent">Gratuit</span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedFish && (
          <FishDetail fish={selectedFish} onClose={() => setSelectedFish(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

