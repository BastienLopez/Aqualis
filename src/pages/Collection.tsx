import { useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { FISH_CATALOG, AQUARIUM_THEMES, Fish, MAX_FISH_PER_AQUARIUM } from "@/lib/gameData";
import FishCard from "@/components/FishCard";
import FishDetail from "@/components/FishDetail";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Collection() {
  const { ownedFishIds, activeAquarium, aquariumFish, assignFish, removeFishFromAquarium, level, totalXP, fishCountInAquarium } = useGame();
  const [selectedFish, setSelectedFish] = useState<Fish | null>(null);

  const ownedFish = FISH_CATALOG.filter(f => ownedFishIds.includes(f.id));
  const fishInCurrentAquarium = aquariumFish[activeAquarium] || [];
  const currentTheme = AQUARIUM_THEMES.find(t => t.id === activeAquarium);
  const currentCount = fishCountInAquarium(activeAquarium);
  const selectedInAquarium = selectedFish ? fishInCurrentAquarium.includes(selectedFish.id) : false;
  const assignLabel = selectedInAquarium
    ? "Retirer de l'aquarium"
    : `Ajouter a ${currentTheme?.name ?? "cet aquarium"}`;
  const assignMeta = `${currentTheme?.name ?? "Aquarium"} · ${currentCount}/${MAX_FISH_PER_AQUARIUM}`;
  const assignDisabled = !selectedInAquarium && currentCount >= MAX_FISH_PER_AQUARIUM;

  const handleAssign = (fish: Fish) => {
    if (fishInCurrentAquarium.includes(fish.id)) {
      removeFishFromAquarium(fish.id, activeAquarium);
      toast.info(`${fish.name} retiré de l'aquarium`);
    } else {
      if (currentCount >= MAX_FISH_PER_AQUARIUM) {
        toast.error(`Aquarium plein ! (${MAX_FISH_PER_AQUARIUM} max)`);
        setSelectedFish(null);
        return;
      }
      const success = assignFish(fish.id, activeAquarium);
      if (success) {
        toast.success(`${fish.name} ajouté à ${currentTheme?.name ?? "cet aquarium"} !`);
      } else {
        toast.error(`Aquarium plein !`);
      }
    }
    setSelectedFish(null);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 pt-14 pb-2">
        <h1 className="text-xl font-extrabold text-foreground">Collection</h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Niveau {level} · {totalXP} XP · {ownedFish.length}/{FISH_CATALOG.length} poissons
        </p>
      </div>

      {/* Stats */}
      <div className="px-5 mb-5 flex gap-2.5">
        <div className="card-warm rounded-2xl px-4 py-3 flex-1 text-center">
          <p className="text-xl font-extrabold text-gold">{ownedFish.length}</p>
          <p className="text-[9px] text-foreground/60 font-semibold uppercase">Poissons</p>
        </div>
        <div className="card-cool rounded-2xl px-4 py-3 flex-1 text-center">
          <p className="text-xl font-extrabold text-accent">{currentCount}</p>
          <p className="text-[9px] text-foreground/60 font-semibold uppercase">Aquarium</p>
        </div>
        <div className="card-dark rounded-2xl px-4 py-3 flex-1 text-center">
          <p className="text-xl font-extrabold text-foreground">{MAX_FISH_PER_AQUARIUM - currentCount}</p>
          <p className="text-[9px] text-foreground/60 font-semibold uppercase">Places</p>
        </div>
      </div>

      {/* Current aquarium info */}
      <div className="px-5 mb-4">
        <div className="glass-nav rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-foreground/60">Aquarium actif :</span>
          <span className="text-xs font-bold text-foreground">{currentTheme?.name ?? "Aquarium"}</span>
        </div>
      </div>

      {ownedFish.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="text-5xl mb-4">🐟</div>
          <p className="text-sm font-bold text-foreground">Pas encore de poisson</p>
          <p className="text-xs text-muted-foreground mt-1">Lance des sessions pour gagner de l'or !</p>
        </div>
      ) : (
        <div className="px-5 space-y-4">
          {ownedFish.map((fish, i) => {
            const inAquarium = fishInCurrentAquarium.includes(fish.id);
            return (
              <div key={fish.id} className="relative">
                <FishCard
                  fish={fish}
                  onClick={() => setSelectedFish(fish)}
                  owned
                  variant={i % 2 === 0 ? "warm" : "cool"}
                  imageAlign="center"
                />
                {inAquarium && (
                  <div className="absolute top-3 left-4 bg-accent text-accent-foreground text-[8px] font-bold px-2 py-0.5 rounded-full z-10 uppercase tracking-wider">
                    Dans l'aquarium
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedFish && (
          <FishDetail
            fish={selectedFish}
            onClose={() => setSelectedFish(null)}
            showAssign
            assignLabel={assignLabel}
            assignMeta={assignMeta}
            assignDisabled={assignDisabled}
            onAssign={() => handleAssign(selectedFish)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
