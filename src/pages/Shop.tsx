import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { FISH_CATALOG, AQUARIUM_THEMES, Fish } from "@/lib/gameData";
import FishCard from "@/components/FishCard";
import FishDetail from "@/components/FishDetail";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { pickImageSrc } from "@/lib/imageCache";

const shopTabs = ["Poissons", "Aquariums"];

export default function Shop() {
  const { gold, ownedFishIds, level, ownedAquariums, buyAquarium, setActiveAquarium, userName } = useGame();
  const [activeTab, setActiveTab] = useState("Poissons");
  const [selectedFish, setSelectedFish] = useState<Fish | null>(null);

  const availableFish = FISH_CATALOG.filter(f => !ownedFishIds.includes(f.id));

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
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-sm border border-foreground/10">
            🐠
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">Bonjour</p>
            <h1 className="text-base font-bold text-foreground">{userName}</h1>
          </div>
        </div>
        <div className="glass-nav rounded-full px-4 py-2 flex items-center gap-1.5">
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
            className={`text-base transition-all duration-200 ${
              activeTab === tab ? "text-foreground font-bold" : "text-muted-foreground font-medium"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Poissons" && (
        <div className="px-5 space-y-4">
          {availableFish.map((fish, i) => (
            <FishCard
              key={fish.id}
              fish={fish}
              onClick={() => setSelectedFish(fish)}
              variant={i % 2 === 0 ? "warm" : "cool"}
              imageAlign="center"
            />
          ))}
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

