import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FISH_CATALOG, calculatePrice } from "@/lib/gameData";
import type { Fish, Rarity } from "@/lib/gameData";
import { useGame } from "@/contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import SafeImage from "@/components/SafeImage";

export default function Encyclopedia() {
  const navigate = useNavigate();
  const { level, ownedFishIds } = useGame();
  const [selectedFish, setSelectedFish] = useState<Fish | null>(null);
  const [filterRarity, setFilterRarity] = useState<Rarity | "all">("all");

  const filteredFish = filterRarity === "all" 
    ? FISH_CATALOG 
    : FISH_CATALOG.filter(f => f.rarity === filterRarity);

  const rarityColors = {
    common: "bg-gray-500",
    rare: "bg-blue-500",
    epic: "bg-purple-500",
    legendary: "bg-gold",
  };

  const rarityGradient: Record<string, string> = {
    common: 'linear-gradient(135deg, hsl(0 0% 13%), hsl(0 0% 17%))',
    rare: 'linear-gradient(135deg, hsl(210 50% 11%), hsl(220 60% 17%))',
    epic: 'linear-gradient(135deg, hsl(270 45% 12%), hsl(275 55% 20%))',
    legendary: 'linear-gradient(135deg, hsl(35 50% 11%), hsl(40 65% 19%))',
  };

  const rarityBadge: Record<string, string> = {
    common: 'hsl(0 0% 55%)',
    rare: 'hsl(210 70% 55%)',
    epic: 'hsl(270 65% 65%)',
    legendary: 'hsl(38 85% 55%)',
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: 'linear-gradient(160deg, hsl(200 40% 7%) 0%, hsl(220 35% 6%) 55%, hsl(240 30% 5%) 100%)' }}>
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, hsl(200 70% 40%), hsl(220 65% 50%))' }}>
            📚
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Encyclopédie</h1>
            <p className="text-xs text-muted-foreground font-medium">
              {FISH_CATALOG.length} espèces répertoriées
            </p>
          </div>
        </div>
      </div>

      {/* Rarity Filters */}
      <div className="px-5 mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {["all", "common", "rare", "epic", "legendary"].map((rarity) => {
          const colors: Record<string, string> = {
            all: 'linear-gradient(135deg, hsl(200 50% 35%), hsl(220 50% 45%))',
            common: 'linear-gradient(135deg, hsl(0 0% 40%), hsl(0 0% 50%))',
            rare: 'linear-gradient(135deg, hsl(210 70% 40%), hsl(220 70% 55%))',
            epic: 'linear-gradient(135deg, hsl(270 65% 45%), hsl(280 65% 58%))',
            legendary: 'linear-gradient(135deg, hsl(35 80% 45%), hsl(42 85% 55%))',
          };
          return (
            <button
              key={rarity}
              onClick={() => setFilterRarity(rarity as Rarity | "all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterRarity === rarity ? "text-white shadow-lg" : "glass-nav text-foreground/60"
              }`}
              style={filterRarity === rarity ? { background: colors[rarity] } : undefined}
            >
              {rarity === "all" ? "✨ Tous" : rarity === "common" ? "⬜ Commun" : rarity === "rare" ? "🔵 Rare" : rarity === "epic" ? "🟣 Épique" : "🌟 Légendaire"}
            </button>
          );
        })}
      </div>

      {/* Fish Grid */}
      <div className="px-5 grid grid-cols-2 gap-3">
        {filteredFish.map((fish) => (
          <motion.button
            key={fish.id}
            onClick={() => setSelectedFish(fish)}
            className="rounded-2xl p-3 text-left border border-transparent hover:border-foreground/10 transition-colors relative overflow-hidden"
            style={{ background: rarityGradient[fish.rarity] }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Rarity accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: rarityBadge[fish.rarity] }} />
            {/* Owned badge */}
            {ownedFishIds.includes(fish.id) && (
              <div className="absolute top-1.5 left-1.5 z-10 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: rarityBadge[fish.rarity] }}>
                ✓
              </div>
            )}
            <div className="relative aspect-square mb-2 rounded-xl overflow-hidden bg-foreground/5">
              <SafeImage
                src={fish.image}
                mobileSrc={fish.imageMobile}
                alt={fish.name}
                className="w-full h-full object-contain"
                fallbackClassName="w-full h-full"
              />
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${rarityColors[fish.rarity]}`} />
            </div>
            <p className="text-sm font-bold text-foreground truncate">{fish.name}</p>
            <p className="text-[10px] text-muted-foreground italic truncate">{fish.scientificName}</p>
          </motion.button>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedFish && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-background/90 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setSelectedFish(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Rarity glow top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: rarityBadge[selectedFish.rarity] }} />
              <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${rarityBadge[selectedFish.rarity]}22 0%, transparent 70%)` }} />
              <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
              
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-foreground/5 mb-4">
                <SafeImage
                  src={selectedFish.image}
                  mobileSrc={selectedFish.imageMobile}
                  alt={selectedFish.name}
                  className="w-full h-full object-contain"
                  fallbackClassName="w-full h-full"
                />
              </div>

              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-extrabold text-foreground">{selectedFish.name}</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold text-white ${rarityColors[selectedFish.rarity]}`}>
                  {selectedFish.rarity === "common" ? "COMMUN" : selectedFish.rarity === "rare" ? "RARE" : selectedFish.rarity === "epic" ? "ÉPIQUE" : "LÉGENDAIRE"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground italic mb-4">{selectedFish.scientificName}</p>

              <p className="text-sm text-foreground/80 leading-relaxed mb-6">{selectedFish.description}</p>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-foreground/10">
                  <span className="text-xs text-muted-foreground">Taille</span>
                  <span className="text-sm font-bold text-foreground">{selectedFish.size}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-foreground/10">
                  <span className="text-xs text-muted-foreground">Température</span>
                  <span className="text-sm font-bold text-foreground">{selectedFish.temperature}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-foreground/10">
                  <span className="text-xs text-muted-foreground">Régime</span>
                  <span className="text-sm font-bold text-foreground">{selectedFish.diet}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-foreground/10">
                  <span className="text-xs text-muted-foreground">Comportement</span>
                  <span className="text-sm font-bold text-foreground">
                    {selectedFish.behavior === "solitary" ? "Solitaire" : selectedFish.behavior === "schooling" ? "Banc" : "Curieux"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-foreground/10">
                  <span className="text-xs text-muted-foreground">Vitesse</span>
                  <span className="text-sm font-bold text-foreground">
                    {selectedFish.swimSpeed === "slow" ? "Lente" : selectedFish.swimSpeed === "fast" ? "Rapide" : "Normale"}
                  </span>
                </div>
                {selectedFish.canBreed !== false && (
                  <div className="flex items-center justify-between py-2 border-b border-foreground/10">
                    <span className="text-xs text-muted-foreground">Reproduction</span>
                    <span className="text-sm font-bold text-green-400">
                      {selectedFish.breedingLevel ? `Possible (Niv. ${selectedFish.breedingLevel})` : "Possible"}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedFish(null)}
                className="w-full mt-4 py-3 rounded-2xl glass-nav font-bold text-sm text-foreground/70"
              >
                Fermer
              </button>

              {!ownedFishIds.includes(selectedFish.id) && (
                <button
                  onClick={() => { setSelectedFish(null); navigate('/shop'); }}
                  className="w-full mt-2 py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${rarityBadge[selectedFish.rarity]}, hsl(38 70% 45%))` }}
                >
                  <span>🪙</span>
                  <span>Obtenir · {calculatePrice(selectedFish.basePrice, level)} or</span>
                </button>
              )}
              {ownedFishIds.includes(selectedFish.id) && (
                <div className="w-full mt-2 py-3 rounded-2xl text-center text-sm font-bold text-green-400 bg-green-400/10">
                  ✓ Déjà dans ta collection
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
