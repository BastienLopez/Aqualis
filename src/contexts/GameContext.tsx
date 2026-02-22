import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Fish, FISH_CATALOG, calculateLevel, xpForNextLevel, calculatePrice, calculateGoldReward, MAX_FISH_PER_AQUARIUM, FishInstance, BreedingPair, Quest, generateDailyQuests, canBreedFish, generateBabyFish } from "@/lib/gameData";

interface SessionRecord {
  id: string;
  activity: string;
  duration: number;
  goldEarned: number;
  xpEarned: number;
  date: string;
}

interface GameState {
  gold: number;
  totalXP: number;
  level: number;
  ownedFishIds: string[];
  fishInstances: FishInstance[];
  breedingPairs: BreedingPair[];
  quests: Quest[];
  completedQuestHistory: { id: string; title: string; gold?: number; xp?: number; completedAt: string }[];
  activeAquarium: string;
  aquariumFish: Record<string, string[]>;
  sessions: SessionRecord[];
  onboardingComplete: boolean;
  mainGoal: string;
  lastSessionDate: string | null;
  userName: string;
  ownedAquariums: string[];
  companionLevel: number;
  infiniteMode: boolean;
  feedCount: number;
  lastQuestRefresh: string | null;
  unlockedAchievements: string[];
  lastAchievementUnlocked: string | null;
}

interface GameContextType extends GameState {
  xpForNext: number;
  xpProgress: number;
  buyFish: (fishId: string) => boolean;
  completeSession: (activity: string, minutes: number) => { gold: number; xp: number };
  assignFish: (fishId: string, aquariumId: string) => boolean;
  removeFishFromAquarium: (fishId: string, aquariumId: string) => void;
  setActiveAquarium: (id: string) => void;
  completeOnboarding: (goal: string, aquarium: string, name: string) => void;
  setUserName: (name: string) => void;
  getFishPrice: (fish: Fish) => number;
  canAfford: (fish: Fish) => boolean;
  buyAquarium: (aquariumId: string, price: number) => boolean;
  fishCountInAquarium: (aquariumId: string) => number;
  startBreeding: (fish1Id: string, fish2Id: string) => boolean;
  completeQuest: (questId: string) => void;
  claimQuestReward: (questId: string) => void;
  incrementFeedCount: () => void;
  toggleInfiniteMode: () => void;
  getFishInstance: (instanceId: string) => FishInstance | undefined;
  getBreedingPairs: () => BreedingPair[];
  getDailyQuests: () => Quest[];
  getAllFishInstances: () => FishInstance[];
  spendGold: (amount: number) => boolean;
  createPartnerInstance: (fishId: string, gender: "male" | "female") => string;
  clearLastAchievement: () => void;
}

const defaultState: GameState = {
  gold: 100,
  totalXP: 0,
  level: 0,
  ownedFishIds: [],
  fishInstances: [],
  breedingPairs: [],
  quests: [],
  completedQuestHistory: [],
  activeAquarium: "deep",
  aquariumFish: { deep: [], reef: [], abyss: [], pandemonium: [] },
  sessions: [],
  onboardingComplete: false,
  mainGoal: "work",
  lastSessionDate: null,
  userName: "Aquanaute",
  ownedAquariums: ["deep", "reef"],
  companionLevel: 0,
  infiniteMode: false,
  feedCount: 0,
  lastQuestRefresh: null,
  unlockedAchievements: [],
  lastAchievementUnlocked: null,
};

const STORAGE_KEY = "aquafocus_state";

function sanitizeGameState(raw: Record<string, unknown>): Partial<GameState> {
  const s = raw as Partial<GameState>;
  return {
    ...s,
    // Clamp numeric fields to sane ranges
    gold:    typeof s.gold    === "number" && isFinite(s.gold)    ? Math.max(0, s.gold)    : undefined,
    totalXP: typeof s.totalXP === "number" && isFinite(s.totalXP) ? Math.max(0, s.totalXP) : undefined,
    level:   typeof s.level   === "number" && isFinite(s.level)   ? Math.max(0, s.level)   : undefined,
    // Sanitize userName: max 30 chars, strip < > & " to prevent future XSS if ever used in HTML context
    userName: typeof s.userName === "string"
      ? s.userName.replace(/[<>&"]/g, "").trim().slice(0, 30) || "Aquanaute"
      : undefined,
    // Must be arrays
    ownedFishIds:        Array.isArray(s.ownedFishIds)        ? s.ownedFishIds        : undefined,
    fishInstances:       Array.isArray(s.fishInstances)       ? s.fishInstances       : undefined,
    breedingPairs:       Array.isArray(s.breedingPairs)       ? s.breedingPairs       : undefined,
    quests:              Array.isArray(s.quests)              ? s.quests              : undefined,
    sessions:            Array.isArray(s.sessions)            ? s.sessions            : undefined,
    unlockedAchievements:Array.isArray(s.unlockedAchievements)? s.unlockedAchievements: undefined,
  };
}

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: Record<string, unknown> = JSON.parse(saved);
      // Future: if (parsed.schemaVersion !== SAVE_SCHEMA_VERSION) runMigration(parsed);
      const sanitized = sanitizeGameState(parsed);
      // Strip undefined keys so defaultState fills missing fields
      const clean = Object.fromEntries(
        Object.entries(sanitized).filter(([, v]) => v !== undefined)
      ) as Partial<GameState>;
      return { ...defaultState, ...clean };
    }
  } catch { /* ignore malformed save data */ }
  return defaultState;
}

function saveState(state: GameState) {
  const serialized = JSON.stringify(state);
  if (serialized.length > 4_000_000) {
    console.warn(
      `[AquaFocus] localStorage save approche la limite (${(serialized.length / 1_000_000).toFixed(2)} MB). ` +
      `Pensez à purger l'historique des sessions ou des quêtes complétées.`
    );
  }
  try {
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.error("[AquaFocus] Échec de la sauvegarde localStorage (quota dépassé ?)", e);
  }
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Migrate: create FishInstances for ownedFishIds that have no instance (old save data)
  // Ensures at least one male AND one female exist per owned fish for breeding
  useEffect(() => {
    setState(prev => {
      const newInstances: FishInstance[] = [];

      prev.ownedFishIds.forEach(fishId => {
        const existing = prev.fishInstances.filter(f => f.fishId === fishId);
        const hasFemale = existing.some(f => f.gender === "female");
        const hasMale = existing.some(f => f.gender === "male");

        if (!hasFemale) {
          newInstances.push({
            instanceId: `migrated-${fishId}-female-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            fishId, gender: "female", age: 30,
            genetics: { color: 50, pattern: 50, size: 50, speed: 50 },
            isBaby: false, birthDate: new Date().toISOString(),
          });
        }
        if (!hasMale) {
          newInstances.push({
            instanceId: `migrated-${fishId}-male-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            fishId, gender: "male", age: 30,
            genetics: { color: 50, pattern: 50, size: 50, speed: 50 },
            isBaby: false, birthDate: new Date().toISOString(),
          });
        }
      });

      // Also add gender to instances that have none (extra safety for old data)
      const fixedInstances = prev.fishInstances.map(inst =>
        inst.gender ? inst : { ...inst, gender: (Math.random() > 0.5 ? "male" : "female") as "male" | "female" }
      );

      const hasNewInstances = newInstances.length > 0;
      const hasFixedInstances = fixedInstances.some((f, i) => f !== prev.fishInstances[i]);

      return hasNewInstances || hasFixedInstances
        ? { ...prev, fishInstances: [...fixedInstances, ...newInstances] }
        : prev;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const level = calculateLevel(state.totalXP);
  const xpForNext = xpForNextLevel(level);
  const prevLevelXP = Math.pow(level, 2) * 10;
  const xpProgress = xpForNext > prevLevelXP ? ((state.totalXP - prevLevelXP) / (xpForNext - prevLevelXP)) * 100 : 0;

  // Update companion level based on total sessions
  useEffect(() => {
    const totalMinutes = state.sessions.reduce((sum, s) => sum + s.duration, 0);
    const newCompLevel = Math.floor(totalMinutes / 120); // evolve every 2h
    if (newCompLevel !== state.companionLevel) {
      setState(prev => ({ ...prev, companionLevel: newCompLevel }));
    }
  }, [state.sessions]);

  const getFishPrice = useCallback((fish: Fish) => calculatePrice(fish.basePrice, level), [level]);
  const canAfford = useCallback((fish: Fish) => state.gold >= calculatePrice(fish.basePrice, level), [state.gold, level]);

  const fishCountInAquarium = useCallback((aquariumId: string) => {
    return (state.aquariumFish[aquariumId] || []).length;
  }, [state.aquariumFish]);

  const buyFish = useCallback((fishId: string): boolean => {
    const fish = FISH_CATALOG.find(f => f.id === fishId);
    if (!fish) return false;
    const price = calculatePrice(fish.basePrice, level);
    if (state.gold < price) return false;
    
    // Create a new fish instance with random genetics
    const newInstance: FishInstance = {
      instanceId: Date.now().toString() + Math.random(),
      fishId,
      gender: Math.random() > 0.5 ? "male" : "female",
      age: 7, // Store-bought fish are adults (7+ days) and can breed immediately
      genetics: {
        color: 50 + (Math.random() * 60 - 30), // 20-80
        pattern: 50 + (Math.random() * 60 - 30),
        size: 50 + (Math.random() * 60 - 30),
        speed: 50 + (Math.random() * 60 - 30),
      },
      isBaby: false, // Store-bought fish are adults
      birthDate: new Date().toISOString(),
    };
    
    setState(prev => ({
      ...prev,
      gold: prev.gold - price,
      ownedFishIds: [...prev.ownedFishIds, fishId],
      fishInstances: [...prev.fishInstances, newInstance],
      quests: prev.quests.map(q => {
        if (q.completed) return q;
        if (q.id.includes("buy-")) {
          // buy-rare matches rare+epic+legendary, buy-epic matches epic+legendary, buy-legendary matches legendary
          const isRareOrAbove = ["rare","epic","legendary"].includes(fish.rarity);
          const isEpicOrAbove = ["epic","legendary"].includes(fish.rarity);
          const isLegendary = fish.rarity === "legendary";
          if (q.id.includes("buy-legendary") && isLegendary) return { ...q, progress: q.progress + 1 };
          if (q.id.includes("buy-epic") && isEpicOrAbove) return { ...q, progress: q.progress + 1 };
          if (q.id.includes("buy-rare") && isRareOrAbove) return { ...q, progress: q.progress + 1 };
          if (q.id.includes("buy-fish")) return { ...q, progress: q.progress + 1 };
        }
        return q;
      }),
    }));
    return true;
  }, [level, state.gold, state.fishInstances]);

  const completeSession = useCallback((activity: string, minutes: number) => {
    const today = new Date().toDateString();
    const isFirst = state.lastSessionDate !== today;
    const isSport = activity === "sport";
    const gold = calculateGoldReward(minutes, isSport, isFirst);
    const xp = minutes;

    const record: SessionRecord = {
      id: Date.now().toString(),
      activity,
      duration: minutes,
      goldEarned: gold,
      xpEarned: xp,
      date: new Date().toISOString(),
    };

    setState(prev => {
      // Update quest progress for "complete_sessions" type quests
      const updatedQuests = prev.quests.map(quest => {
        if (!quest.completed) {
          // Session completion quests (session-20, session-60, etc.)
          if (quest.id.includes("session-")) {
            const match = quest.id.match(/session-(\d+)/);
            const reqMinutes = match ? parseInt(match[1]) : 0;
            if (reqMinutes > 0 && minutes >= reqMinutes) {
              return { ...quest, progress: quest.progress + 1 };
            }
          }
          // Total time quests
          if (quest.id.includes("total-time")) {
            return { ...quest, progress: quest.progress + minutes };
          }
          // Gold earned quests
          if (quest.id.includes("earn-")) {
            return { ...quest, progress: quest.progress + gold };
          }
        }
        return quest;
      });

      return {
        ...prev,
        gold: prev.gold + gold,
        totalXP: prev.totalXP + xp,
        level: calculateLevel(prev.totalXP + xp),
        sessions: [record, ...prev.sessions],
        lastSessionDate: today,
        quests: updatedQuests,
      };
    });

    return { gold, xp };
  }, [state.lastSessionDate, state.quests]);

  const assignFish = useCallback((fishId: string, aquariumId: string): boolean => {
    const current = state.aquariumFish[aquariumId] || [];
    // Check limit only if infinite mode is disabled
    if (!state.infiniteMode && current.length >= MAX_FISH_PER_AQUARIUM) return false;
    setState(prev => ({
      ...prev,
      aquariumFish: {
        ...prev.aquariumFish,
        [aquariumId]: [...(prev.aquariumFish[aquariumId] || []), fishId],
      },
    }));
    return true;
  }, [state.aquariumFish, state.infiniteMode]);

  const removeFishFromAquarium = useCallback((fishId: string, aquariumId: string) => {
    setState(prev => ({
      ...prev,
      aquariumFish: {
        ...prev.aquariumFish,
        [aquariumId]: (prev.aquariumFish[aquariumId] || []).filter(id => id !== fishId),
      },
    }));
  }, []);

  const setActiveAquarium = useCallback((id: string) => {
    setState(prev => ({ ...prev, activeAquarium: id }));
  }, []);

  const completeOnboarding = useCallback((goal: string, aquarium: string, name: string) => {
    setState(prev => ({
      ...prev,
      onboardingComplete: true,
      mainGoal: goal,
      activeAquarium: aquarium,
      userName: name || "Aquanaute",
    }));
  }, []);

  const setUserName = useCallback((name: string) => {
    // Sanitize: strip HTML-sensitive characters, enforce max length
    const sanitized = name.replace(/[<>&"]/g, "").trim().slice(0, 30);
    setState(prev => ({
      ...prev,
      userName: sanitized.length > 0 ? sanitized : "Aquanaute",
    }));
  }, []);

  const spendGold = useCallback((amount: number): boolean => {
    if (state.gold < amount) return false;
    setState(prev => ({ ...prev, gold: prev.gold - amount }));
    return true;
  }, [state.gold]);

  const createPartnerInstance = useCallback((fishId: string, gender: "male" | "female"): string => {
    const newInstance: FishInstance = {
      instanceId: `partner-${fishId}-${gender}-${Date.now()}`,
      fishId,
      gender,
      age: 30,
      genetics: { color: 50, pattern: 50, size: 50, speed: 50 },
      isBaby: false,
      birthDate: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, fishInstances: [...prev.fishInstances, newInstance] }));
    return newInstance.instanceId;
  }, []);

  const buyAquarium = useCallback((aquariumId: string, price: number): boolean => {
    if (state.gold < price) return false;
    if (state.ownedAquariums.includes(aquariumId)) return false;
    setState(prev => ({
      ...prev,
      gold: prev.gold - price,
      ownedAquariums: [...prev.ownedAquariums, aquariumId],
    }));
    return true;
  }, [state.gold, state.ownedAquariums]);

  // NEW: Reproduction system
  const startBreeding = useCallback((instance1Id: string, instance2Id: string): boolean => {
    const fish1 = state.fishInstances.find(f => f.instanceId === instance1Id);
    const fish2 = state.fishInstances.find(f => f.instanceId === instance2Id);
    
    if (!fish1 || !fish2) return false;
    if (!canBreedFish(fish1, fish2)) return false;
    
    const pair: BreedingPair = {
      id: `pair-${Date.now()}`,
      motherId: fish1.gender === "female" ? fish1.instanceId : fish2.instanceId,
      fatherId: fish1.gender === "male" ? fish1.instanceId : fish2.instanceId,
      status: "courting",
      startDate: new Date().toISOString(),
    };
    
    setState(prev => ({
      ...prev,
      breedingPairs: [...prev.breedingPairs, pair],
    }));
    
    // Breeding times based on rarity:
    // common (grey) → 3h total (1h + 1h + 1h)
    // rare   (blue) → 5h total (1.5h + 1.5h + 2h)
    // epic   (purple)→ 7h total (2h + 2.5h + 2.5h)
    // legendary (gold) → 24h total (8h + 8h + 8h)
    const fishData = FISH_CATALOG.find(f => f.id === fish1.fishId);
    const rarity = fishData?.rarity ?? 'common';
    const H = 3600000;
    const breedTime = {
      common:    { courting: 1 * H,   breeding: 1 * H,     egg: 1 * H },
      rare:      { courting: 1.5 * H, breeding: 1.5 * H,   egg: 2 * H },
      epic:      { courting: 2 * H,   breeding: 2.5 * H,   egg: 2.5 * H },
      legendary: { courting: 8 * H,   breeding: 8 * H,     egg: 8 * H },
    }[rarity] ?? { courting: 1 * H, breeding: 1 * H, egg: 1 * H };

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        breedingPairs: prev.breedingPairs.map(p =>
          p.id === pair.id ? { ...p, status: "breeding" as const } : p
        ),
      }));

      setTimeout(() => {
        setState(prev => ({
          ...prev,
          breedingPairs: prev.breedingPairs.map(p =>
            p.id === pair.id ? { ...p, status: "egg" as const, eggLaidDate: new Date().toISOString() } : p
          ),
        }));

        setTimeout(() => {
          setState(prev => {
            const mother = prev.fishInstances.find(f => f.instanceId === pair.motherId);
            const father = prev.fishInstances.find(f => f.instanceId === pair.fatherId);
            if (mother && father) {
              const baby = generateBabyFish(mother, father);
              return {
                ...prev,
                fishInstances: [...prev.fishInstances, baby],
                breedingPairs: prev.breedingPairs.filter(p => p.id !== pair.id),
                ownedFishIds: [...prev.ownedFishIds, baby.fishId],
                quests: prev.quests.map(q =>
                  (!q.completed && (q.id.includes("breed-") || q.id.includes("breed")))
                    ? { ...q, progress: q.progress + 1 }
                    : q
                ),
              };
            }
            return prev;
          });
        }, breedTime.egg);
      }, breedTime.breeding);
    }, breedTime.courting);
    
    return true;
  }, [state.fishInstances]);

  // NEW: Quest system with automatic new quest generation
  const completeQuest = useCallback((questId: string) => {
    const quest = state.quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;
    
    setState(prev => {
      // Save to history before removing
      const historyEntry = {
        id: quest.id,
        title: quest.title,
        gold: quest.reward.gold,
        xp: quest.reward.xp,
        completedAt: new Date().toISOString(),
      };
      const updatedHistory = [historyEntry, ...(prev.completedQuestHistory || [])].slice(0, 20);

      // Mark quest as completed and give rewards
      const updatedQuests = prev.quests.map(q =>
        q.id === questId ? { ...q, completed: true } : q
      );
      
      // Generate a new random quest to replace the completed one
      const today = new Date().toDateString();
      const newDailyQuests = generateDailyQuests(today);
      
      // Find an unused quest from the pool (one that's not currently active)
      const activeQuestIds = updatedQuests.filter(q => !q.completed).map(q => q.id);
      const newQuest = newDailyQuests.find(nq => !activeQuestIds.includes(nq.id) && !updatedHistory.some(h => h.id === nq.id));
      
      // Replace completed quest with new one, or keep only active quests
      const finalQuests = newQuest
        ? [...updatedQuests.filter(q => !q.completed), newQuest]
        : updatedQuests.filter(q => !q.completed);
      
      // Ensure we always have exactly 3 active quests
      while (finalQuests.length < 3) {
        const allQuests = generateDailyQuests(today + finalQuests.length);
        const unusedQuest = allQuests.find(q => !finalQuests.some(fq => fq.id === q.id));
        if (unusedQuest) {
          finalQuests.push(unusedQuest);
        } else {
          break;
        }
      }
      
      return {
        ...prev,
        gold: prev.gold + (quest.reward.gold || 0),
        totalXP: prev.totalXP + (quest.reward.xp || 0),
        quests: finalQuests.slice(0, 3), // Keep only 3 active quests
        completedQuestHistory: updatedHistory,
      };
    });
  }, [state.quests]);

  // Alias for UI clarity
  const claimQuestReward = useCallback((questId: string) => {
    completeQuest(questId);
  }, [completeQuest]);

  const incrementFeedCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      feedCount: prev.feedCount + 1,
      quests: prev.quests.map(q =>
        (!q.completed && q.id.includes("feed-")) ? { ...q, progress: q.progress + 1 } : q
      ),
    }));
  }, []);

  // NEW: Refresh daily quests
  useEffect(() => {
    const today = new Date().toDateString();
    if (state.lastQuestRefresh !== today) {
      const newQuests = generateDailyQuests(today);
      setState(prev => ({
        ...prev,
        quests: newQuests,
        lastQuestRefresh: today,
      }));
    }
  }, [state.lastQuestRefresh]);

  // NEW: Toggle infinite mode
  const toggleInfiniteMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      infiniteMode: !prev.infiniteMode,
    }));
  }, []);

  // Achievement tracking
  useEffect(() => {
    const { ownedFishIds, sessions, feedCount, ownedAquariums, unlockedAchievements, breedingPairs } = state;
    const toUnlock: string[] = [];
    if (ownedFishIds.length >= 1) toUnlock.push("first_fish");
    if (sessions.length >= 1) toUnlock.push("first_session");
    if (sessions.length >= 10) toUnlock.push("sessions_10");
    if (sessions.some((s: { duration: number }) => s.duration >= 60)) toUnlock.push("one_hour");
    if (feedCount >= 10) toUnlock.push("feed_10");
    if (feedCount >= 100) toUnlock.push("feed_100");
    if (ownedFishIds.some((id: string) => FISH_CATALOG.find((f) => f.id === id)?.rarity === "legendary")) toUnlock.push("legend_owned");
    if (new Set(ownedFishIds).size >= 5) toUnlock.push("collector");
    if (ownedAquariums.length >= 2) toUnlock.push("aquarium_2");
    if (breedingPairs.some((bp: BreedingPair) => bp.status === "hatched")) toUnlock.push("breeder");
    const newOnes = toUnlock.filter((id: string) => !unlockedAchievements.includes(id));
    if (newOnes.length > 0) {
      setState(prev => ({
        ...prev,
        unlockedAchievements: [...new Set([...prev.unlockedAchievements, ...newOnes])],
        lastAchievementUnlocked: newOnes[newOnes.length - 1],
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ownedFishIds, state.sessions, state.feedCount, state.ownedAquariums, state.breedingPairs]);

  const clearLastAchievement = useCallback(() => {
    setState(prev => ({ ...prev, lastAchievementUnlocked: null }));
  }, []);

  // NEW: Getter functions
  const getFishInstance = useCallback((instanceId: string) => {
    return state.fishInstances.find(f => f.instanceId === instanceId);
  }, [state.fishInstances]);

  const getBreedingPairs = useCallback(() => {
    return state.breedingPairs;
  }, [state.breedingPairs]);

  const getDailyQuests = useCallback(() => {
    return state.quests.filter(q => q.type === "daily");
  }, [state.quests]);

  const getAllFishInstances = useCallback(() => {
    return state.fishInstances;
  }, [state.fishInstances]);

  return (
    <GameContext.Provider value={{
      ...state,
      level,
      xpForNext,
      xpProgress,
      buyFish,
      completeSession,
      assignFish,
      removeFishFromAquarium,
      setActiveAquarium,
      completeOnboarding,
      setUserName,
      getFishPrice,
      canAfford,
      buyAquarium,
      fishCountInAquarium,
      startBreeding,
      completeQuest,
      claimQuestReward,
      incrementFeedCount,
      toggleInfiniteMode,
      getFishInstance,
      getBreedingPairs,
      getDailyQuests,
      getAllFishInstances,
      spendGold,
      createPartnerInstance,
      clearLastAchievement,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
