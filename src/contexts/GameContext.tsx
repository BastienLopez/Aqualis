import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Fish, FISH_CATALOG, calculateLevel, xpForNextLevel, calculatePrice, calculateGoldReward, MAX_FISH_PER_AQUARIUM } from "@/lib/gameData";

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
  activeAquarium: string;
  aquariumFish: Record<string, string[]>;
  sessions: SessionRecord[];
  onboardingComplete: boolean;
  mainGoal: string;
  lastSessionDate: string | null;
  userName: string;
  ownedAquariums: string[];
  companionLevel: number;
}

interface GameContextType extends GameState {
  xpForNext: number;
  xpProgress: number;
  buyFish: (fishId: string) => boolean;
  completeSesion: (activity: string, minutes: number) => { gold: number; xp: number };
  assignFish: (fishId: string, aquariumId: string) => boolean;
  removeFishFromAquarium: (fishId: string, aquariumId: string) => void;
  setActiveAquarium: (id: string) => void;
  completeOnboarding: (goal: string, aquarium: string, name: string) => void;
  setUserName: (name: string) => void;
  getFishPrice: (fish: Fish) => number;
  canAfford: (fish: Fish) => boolean;
  buyAquarium: (aquariumId: string, price: number) => boolean;
  fishCountInAquarium: (aquariumId: string) => number;
}

const defaultState: GameState = {
  gold: 100,
  totalXP: 0,
  level: 0,
  ownedFishIds: [],
  activeAquarium: "deep",
  aquariumFish: { deep: [], reef: [], abyss: [], pandemonium: [] },
  sessions: [],
  onboardingComplete: false,
  mainGoal: "work",
  lastSessionDate: null,
  userName: "Aquanaute",
  ownedAquariums: ["deep", "reef"],
  companionLevel: 0,
};

const STORAGE_KEY = "aquafocus_state";

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultState, ...JSON.parse(saved) };
  } catch {}
  return defaultState;
}

function saveState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

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
    setState(prev => ({
      ...prev,
      gold: prev.gold - price,
      ownedFishIds: [...prev.ownedFishIds, fishId],
    }));
    return true;
  }, [level, state.gold]);

  const completeSesion = useCallback((activity: string, minutes: number) => {
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

    setState(prev => ({
      ...prev,
      gold: prev.gold + gold,
      totalXP: prev.totalXP + xp,
      level: calculateLevel(prev.totalXP + xp),
      sessions: [record, ...prev.sessions],
      lastSessionDate: today,
    }));

    return { gold, xp };
  }, [state.lastSessionDate]);

  const assignFish = useCallback((fishId: string, aquariumId: string): boolean => {
    const current = state.aquariumFish[aquariumId] || [];
    if (current.length >= MAX_FISH_PER_AQUARIUM) return false;
    setState(prev => ({
      ...prev,
      aquariumFish: {
        ...prev.aquariumFish,
        [aquariumId]: [...(prev.aquariumFish[aquariumId] || []), fishId],
      },
    }));
    return true;
  }, [state.aquariumFish]);

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
    const trimmed = name.trim();
    setState(prev => ({
      ...prev,
      userName: trimmed.length > 0 ? trimmed : "Aquanaute",
    }));
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

  return (
    <GameContext.Provider value={{
      ...state,
      level,
      xpForNext,
      xpProgress,
      buyFish,
      completeSesion,
      assignFish,
      removeFishFromAquarium,
      setActiveAquarium,
      completeOnboarding,
      setUserName,
      getFishPrice,
      canAfford,
      buyAquarium,
      fishCountInAquarium,
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
