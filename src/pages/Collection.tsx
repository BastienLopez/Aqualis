import { useState, useRef, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { FISH_CATALOG, AQUARIUM_THEMES, Fish, FishInstance, MAX_FISH_PER_AQUARIUM } from "@/lib/gameData";
import FishCard from "@/components/FishCard";
import FishDetail from "@/components/FishDetail";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { pickImageSrc } from "@/lib/imageCache";

export default function Collection() {
  const { 
    ownedFishIds, 
    activeAquarium, 
    aquariumFish, 
    assignFish, 
    removeFishFromAquarium, 
    level, 
    totalXP, 
    fishCountInAquarium, 
    ownedAquariums,
    getBreedingPairs,
    getFishInstance,
    startBreeding,
    infiniteMode,
    getAllFishInstances,
  } = useGame();
  const [selectedFish, setSelectedFish] = useState<Fish | null>(null);
  const [showBreeding, setShowBreeding] = useState(false);
  const [selectedMother, setSelectedMother] = useState<string | null>(null);
  const [babyPopup, setBabyPopup] = useState<{ fishData: Fish; instance: FishInstance } | null>(null);
  const prevBabyCountRef = useRef<number>(-1);
  const breedingPairs = getBreedingPairs();
  const allFishInstances = getAllFishInstances();

  // Detect new baby fish being born
  useEffect(() => {
    const babyInstances = allFishInstances.filter(f => f.isBaby);
    const newCount = babyInstances.length;
    if (prevBabyCountRef.current !== -1 && newCount > prevBabyCountRef.current) {
      const newest = babyInstances[babyInstances.length - 1];
      const fishData = newest ? FISH_CATALOG.find(f => f.id === newest.fishId) : null;
      if (fishData && newest) setBabyPopup({ fishData, instance: newest });
    }
    prevBabyCountRef.current = newCount;
  }, [allFishInstances]);

  const ownedFish = FISH_CATALOG.filter(f => ownedFishIds.includes(f.id));
  const fishInCurrentAquarium = aquariumFish[activeAquarium] || [];
  const currentTheme = AQUARIUM_THEMES.find(t => t.id === activeAquarium);
  const currentCount = fishCountInAquarium(activeAquarium);
  // Count how many of this specific fish are already in the aquarium
  const selectedCountInAquarium = selectedFish
    ? fishInCurrentAquarium.filter(id => id === selectedFish.id).length
    : 0;
  const assignLabel = selectedCountInAquarium > 0
    ? `Ajouter encore (${selectedCountInAquarium} déjà présent${selectedCountInAquarium > 1 ? 's' : ''})`
    : `Ajouter à ${currentTheme?.name ?? "cet aquarium"}`;
  const assignMeta = infiniteMode
    ? `${currentTheme?.name ?? "Aquarium"} · ${currentCount} poissons (∞)`
    : `${currentTheme?.name ?? "Aquarium"} · ${currentCount}/${MAX_FISH_PER_AQUARIUM}`;
  const assignDisabled = !infiniteMode && currentCount >= MAX_FISH_PER_AQUARIUM;

  const fishInstances = allFishInstances.filter(instance => ownedFishIds.includes(instance.fishId));
  const adultFemales = fishInstances.filter(f => f.gender === "female" && !f.isBaby && f.age >= 7);
  const adultMales = fishInstances.filter(f => f.gender === "male" && !f.isBaby && f.age >= 7);

  const handleStartBreeding = (motherId: string, fatherId: string) => {
    const success = startBreeding(motherId, fatherId);
    if (success) {
      toast.success("Reproduction lancée ! 🥚");
      setShowBreeding(false);
      setSelectedMother(null);
    } else {
      toast.error("Impossible de lancer la reproduction");
    }
  };

  const handleAssign = (fish: Fish) => {
    // Always ADD — never toggle-remove (user can have multiple of same fish)
    if (!infiniteMode && currentCount >= MAX_FISH_PER_AQUARIUM) {
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
    setSelectedFish(null);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 pt-14 pb-2">
        <h1 className="text-xl font-extrabold text-foreground">Collection</h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          Niveau {level} · {totalXP} XP · {ownedFish.length}/{FISH_CATALOG.length} poissons · {ownedAquariums.length} aquariums
        </p>
      </div>

      {/* Stats */}
      <div className="px-5 mb-5 flex gap-2.5">
        <div className="card-warm rounded-2xl px-4 py-3 flex-1 text-center">
          <p className="text-xl font-extrabold text-gold">{ownedFish.length}</p>
          <p className="text-[9px] text-foreground/60 font-semibold uppercase">Poissons</p>
        </div>
        <div className="card-cool rounded-2xl px-4 py-3 flex-1 text-center">
          <p className="text-xl font-extrabold text-accent">{ownedAquariums.length}</p>
          <p className="text-[9px] text-foreground/60 font-semibold uppercase">Aquariums</p>
        </div>
        <div className="card-dark rounded-2xl px-4 py-3 flex-1 text-center">
          <p className="text-xl font-extrabold text-foreground">{currentCount}</p>
          <p className="text-[9px] text-foreground/60 font-semibold uppercase">Actuel</p>
        </div>
      </div>

      {/* Current aquarium info */}
      <div className="px-5 mb-4">
        <div className="glass-nav rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-foreground/60">Aquarium actif :</span>
          <span className="text-xs font-bold text-foreground">{currentTheme?.name ?? "Aquarium"}</span>
        </div>
      </div>

      {/* Owned Aquariums Section */}
      <div className="px-5 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-3">Mes Aquariums</h2>
        <div className="space-y-2">
          {ownedAquariums.map(aquariumId => {
            const aquarium = AQUARIUM_THEMES.find(t => t.id === aquariumId);
            if (!aquarium) return null;
            const fishCount = fishCountInAquarium(aquariumId);
            const isActive = aquariumId === activeAquarium;
            return (
              <div key={aquariumId} className={`card-dark rounded-2xl overflow-hidden flex items-center gap-3 pr-4 ${isActive ? 'ring-2 ring-primary' : ''}`}>
                <div className="w-20 h-16 overflow-hidden rounded-l-2xl flex-shrink-0">
                  <img
                    src={pickImageSrc(aquarium.background, aquarium.backgroundMobile)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{aquarium.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {infiniteMode ? `${fishCount} poissons (∞)` : `${fishCount}/${MAX_FISH_PER_AQUARIUM} poissons`}
                  </p>
                </div>
                {isActive && (
                  <span className="text-primary text-xs font-bold flex-shrink-0">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Breeding Section */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Reproduction</h2>
          <button 
            onClick={() => setShowBreeding(!showBreeding)}
            className="text-xs font-bold text-primary"
          >
            {showBreeding ? "Annuler" : "Nouvelle paire"}
          </button>
        </div>

        {showBreeding ? (
          <div className="space-y-3">
            <div className="card-warm rounded-2xl p-4">
              <p className="text-xs font-bold text-foreground mb-2">1. Choisir la mère</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {adultFemales.map(fish => {
                  const fishData = FISH_CATALOG.find(f => f.id === fish.fishId);
                  // canBreed defaults to true if not specified (undefined means can breed)
                  if (!fishData || fishData.canBreed === false) return null;
                  return (
                    <button
                      key={fish.instanceId}
                      onClick={() => setSelectedMother(fish.instanceId)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedMother === fish.instanceId 
                          ? 'bg-primary/20 border-2 border-primary' 
                          : 'bg-background/50'
                      }`}
                    >
                      <p className="text-xs font-bold text-foreground">{fishData.name} ♀</p>
                      <p className="text-[10px] text-muted-foreground">Âge: {fish.age} jours</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedMother && (
              <div className="card-cool rounded-2xl p-4">
                <p className="text-xs font-bold text-foreground mb-2">2. Choisir le père</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {adultMales.map(fish => {
                    const fishData = FISH_CATALOG.find(f => f.id === fish.fishId);
                    const motherInstance = fishInstances.find(f => f?.instanceId === selectedMother);
                    const sameSpecies = motherInstance && fish.fishId === motherInstance.fishId;
                    // canBreed defaults to true if not specified
                    if (!fishData || fishData.canBreed === false || !sameSpecies) return null;
                    return (
                      <button
                        key={fish.instanceId}
                        onClick={() => handleStartBreeding(selectedMother, fish.instanceId)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-background/50 hover:bg-primary/10 transition-colors"
                      >
                        <p className="text-xs font-bold text-foreground">{fishData.name} ♂</p>
                        <p className="text-[10px] text-muted-foreground">Âge: {fish.age} jours</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : breedingPairs.length > 0 ? (
          <div className="space-y-2">
            {breedingPairs.map(pair => {
              const mother = getFishInstance(pair.motherId);
              const father = getFishInstance(pair.fatherId);
              const motherData = mother ? FISH_CATALOG.find(f => f.id === mother.fishId) : null;
              const fatherData = father ? FISH_CATALOG.find(f => f.id === father.fishId) : null;
              
              const statusText = pair.status === "courting" ? "🌸 Parade amoureuse" :
                                 pair.status === "breeding" ? "💕 Reproduction" :
                                 "🥚 Œuf en incubation";

              // Get rarity to know the timing
              const motherInst = allFishInstances.find(f => f.instanceId === pair.motherId);
              const fishData2 = motherInst ? FISH_CATALOG.find(f => f.id === motherInst.fishId) : null;
              const rar = fishData2?.rarity ?? 'common';
              const H = 3600000;
              const times2 = {
                common:    { courting: 1*H, breeding: 1*H,   egg: 1*H },
                rare:      { courting: 1.5*H, breeding: 1.5*H, egg: 2*H },
                epic:      { courting: 2*H,   breeding: 2.5*H, egg: 2.5*H },
                legendary: { courting: 8*H,   breeding: 8*H,   egg: 8*H },
              }[rar] ?? { courting: 1*H, breeding: 1*H, egg: 1*H };

              const startTime = new Date(pair.startDate).getTime();
              const now = Date.now();
              const elapsed = now - startTime;

              let msLeft = 0;
              if (pair.status === "courting") {
                msLeft = Math.max(0, times2.courting - elapsed);
              } else if (pair.status === "breeding") {
                msLeft = Math.max(0, times2.courting + times2.breeding - elapsed);
              } else if (pair.status === "egg" && pair.eggLaidDate) {
                msLeft = Math.max(0, new Date(pair.eggLaidDate).getTime() + times2.egg - now);
              }
              const hoursLeft = Math.ceil(msLeft / H);
              const timeLabel = hoursLeft >= 24 ? `${Math.ceil(hoursLeft/24)}j` : `${hoursLeft}h`;

              return (
                <div key={pair.id} className="glass-strong rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-foreground">{statusText}</p>
                    <p className="text-[10px] text-muted-foreground">{timeLabel} restant</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-[10px] text-foreground">{motherData?.name} ♀</p>
                    </div>
                    <span className="text-xs">×</span>
                    <div className="flex-1 text-right">
                      <p className="text-[10px] text-foreground">{fatherData?.name} ♂</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-dark rounded-2xl p-4 text-center">
            <p className="text-xs text-muted-foreground">Aucune reproduction en cours</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Appuyez sur "Nouvelle paire" pour commencer</p>
          </div>
        )}
      </div>

      {/* Owned Fish Section */}
      <div className="px-5 mb-4">
        <h2 className="text-sm font-bold text-foreground mb-3">Mes Poissons</h2>
      </div>

      {ownedFish.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <div className="text-5xl mb-4">🐟</div>
          <p className="text-sm font-bold text-foreground">Pas encore de poisson</p>
          <p className="text-xs text-muted-foreground mt-1">Lance des sessions pour gagner de l'or !</p>
        </div>
      ) : (
        <div className="px-5 space-y-4">{ownedFish.map((fish, i) => {
            return (
              <div key={`${fish.id}-${i}`} className="relative">
                <FishCard
                  fish={fish}
                  onClick={() => setSelectedFish(fish)}
                  owned
                  variant={i % 2 === 0 ? "warm" : "cool"}
                  imageAlign="center"
                />
                {fishInCurrentAquarium.filter(id => id === fish.id).length > 0 && (
                  <div className="absolute top-3 left-4 bg-accent text-accent-foreground text-[8px] font-bold px-2 py-0.5 rounded-full z-10 uppercase tracking-wider">
                    {fishInCurrentAquarium.filter(id => id === fish.id).length}× dans l’aquarium
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

      {/* 🐣 Baby fish born popup */}
      <AnimatePresence>
        {babyPopup && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          >
            <motion.div
              className="rounded-3xl p-6 w-full max-w-sm text-center"
              initial={{ scale: 0.8, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 40 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{ background: 'linear-gradient(145deg, hsl(270 40% 14%), hsl(220 40% 10%))' , border: '1px solid rgba(255,200,100,0.3)' }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-5xl mb-3"
              >
                🐣
              </motion.div>
              <h2 className="text-lg font-extrabold text-foreground mb-1">Félicitations !</h2>
              <p className="text-sm text-muted-foreground mb-4">Un nouveau <span className="text-gold font-bold">{babyPopup.fishData.name}</span> est né !</p>
              <div className="w-28 h-28 mx-auto mb-4 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center">
                <img
                  src={pickImageSrc(babyPopup.fishData.image, babyPopup.fishData.imageMobile)}
                  alt={babyPopup.fishData.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground mb-5">
                Rareté : <span className="font-bold text-accent capitalize">{babyPopup.fishData.rarity}</span>
                {babyPopup.instance.hiddenTraits?.bioluminescent && babyPopup.instance.hiddenTraits.bioluminescent !== 'none' && (
                  <span className="ml-2 text-cyan-400">✨ Bioluminescent</span>
                )}
                {babyPopup.instance.hiddenTraits?.secretHybrid && (
                  <span className="ml-2 text-purple-400">🔮 Hybride secret</span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setBabyPopup(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-foreground/60"
                  style={{ background: 'hsl(240 8% 16%)' }}
                >
                  Plus tard
                </button>
                <button
                  onClick={() => {
                    const success = assignFish(babyPopup.fishData.id, activeAquarium);
                    if (success) {
                      toast.success(`${babyPopup.fishData.name} ajouté à l'aquarium ! 🐟`);
                    } else {
                      toast.error('Aquarium plein !');
                    }
                    setBabyPopup(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(90deg, hsl(140 55% 38%), hsl(160 60% 42%))' }}
                >
                  Ajouter à l'aquarium
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
