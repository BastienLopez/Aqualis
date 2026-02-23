import { useState, useCallback, useEffect, useMemo, useRef, memo } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/contexts/GameContext";
import { AQUARIUM_THEMES, FISH_CATALOG, MAX_FISH_PER_AQUARIUM, ACHIEVEMENTS } from "@/lib/gameData";
import type { Fish } from "@/lib/gameData";
import SafeImage from "@/components/SafeImage";
import { pickImageSrc } from "@/lib/imageCache";
import Bubbles from "@/components/Bubbles";
import FoodParticles from "@/components/FoodParticles";
import WeatherEffects from "@/components/WeatherEffects";
import SurfaceReflections from "@/components/SurfaceReflections";
import SandParticles from "@/components/SandParticles";
import AnimatedCorals from "@/components/AnimatedCorals";
import LightRays from "@/components/LightRays";
import BokehEffect from "@/components/BokehEffect";
import ParallaxLayers from "@/components/ParallaxLayers";
import ShrimpPrey from "@/components/ShrimpPrey";
import AmbientMusic from "@/components/AmbientMusic";
import FishSounds from "@/components/FishSounds";
import HealthBar from "@/components/HealthBar";
import HidingRocks from "@/components/HidingRocks";
import Algae from "@/components/Algae";
import FishGames from "@/components/FishGames";
import ASMRSounds from "@/components/ASMRSounds";
import WaterSounds from "@/components/WaterSounds";
import WasteParticles from "@/components/WasteParticles";
import PlanktonParticles from "@/components/PlanktonParticles";
import { motion, AnimatePresence } from "framer-motion";

// Module-level frozen arrays → stable references → Framer Motion never sees a "changed" animate prop → no restart flicker
const SWIM_ROTATE_Z = Object.freeze([0, 2, -1, 1.5, -0.5, 0]) as number[];
const CRIT_ROTATE_Z = Object.freeze([-8, -5, -8]) as number[];
const FEED_ROTATE_Z = Object.freeze([0, 5, -5, 5, 0]) as number[];
const CLICK_ROTATE_Z = Object.freeze([0, -15, 15, -10, 10, 0]) as number[];
const CLICK_SCALE = Object.freeze([1, 1.3, 1.2, 1.1, 1]) as number[];

const seeded = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};
const randRange = (seed: number, min: number, max: number) => min + seeded(seed) * (max - min);

// Module-level lookup → O(1) fish resolution, no repeated .find() calls
const FISH_BY_ID = new Map(FISH_CATALOG.map(f => [f.id, f]));

type FishStyleSnapshot = {
  startX: string;
  startY: string;
  duration: number;
  movementX: number[];
  movementY: number[];
};

interface FishDynamicsProps {
  fishInTank: Fish[];
  getFishStyle: (i: number) => FishStyleSnapshot;
  nitrateLevel: number;
  onShrimpCaught: () => void;
}

const FishDynamics = memo(function FishDynamics({
  fishInTank,
  getFishStyle,
  nitrateLevel,
  onShrimpCaught,
}: FishDynamicsProps) {
  const [fishPositions, setFishPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [carnivorePositions, setCarnivorePositions] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    if (fishInTank.length === 0) {
      setFishPositions({});
      setCarnivorePositions([]);
      return;
    }

    const updatePositions = () => {
      const newPositions: Record<string, { x: number; y: number }> = {};
      const newCarnivores: { x: number; y: number }[] = [];

      fishInTank.forEach((fish, i) => {
        const fishKey = `${fish.id}-${i}`;
        const style = getFishStyle(i);

        const baseX = parseFloat(style.startX);
        const baseY = parseFloat(style.startY);

        const movementPhase = (Date.now() / (style.duration * 1000)) % 1;
        const movementIndex = Math.floor(movementPhase * (style.movementX.length - 1));
        const offsetX = style.movementX[movementIndex] || 0;
        const offsetY = style.movementY[movementIndex] || 0;

        const currentX = baseX + offsetX;
        const currentY = baseY + offsetY;

        newPositions[fishKey] = { x: currentX, y: currentY };

        if (fish.diet === "Carnivore") {
          newCarnivores.push({ x: currentX, y: currentY });
        }
      });

      setFishPositions(newPositions);
      setCarnivorePositions(newCarnivores);
    };

    updatePositions();
    const updateInterval = setInterval(updatePositions, 2200); // lower frequency to reduce re-render pressure

    return () => clearInterval(updateInterval);
  }, [fishInTank, getFishStyle]);

  return (
    <>
      <SandParticles 
        fishPositions={Object.entries(fishPositions).map(([id, pos]) => ({
          x: pos.x,
          y: pos.y,
          active: pos.y > 70,
        }))}
      />
      <ShrimpPrey 
        carnivorePositions={carnivorePositions}
        nitrateLevel={nitrateLevel}
        onShrimpCaught={onShrimpCaught}
      />
    </>
  );
});

export default function Aquarium() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gold, level, xpProgress, totalXP, activeAquarium, aquariumFish, userName, setActiveAquarium, ownedAquariums, sessions, companionLevel, setUserName, incrementFeedCount, infiniteMode, toggleInfiniteMode, fishInstances, lastAchievementUnlocked, clearLastAchievement, unlockedAchievements, spendGold, breedingPairs } = useGame();
  const theme = AQUARIUM_THEMES.find(t => t.id === activeAquarium) || AQUARIUM_THEMES[0];
  const themeBackground = pickImageSrc(theme.background, theme.backgroundMobile);
  const fishInTank = useMemo(
    () => (aquariumFish[activeAquarium] || [])
      .map(id => FISH_BY_ID.get(id))
      .filter((fish): fish is Fish => Boolean(fish)),
    [aquariumFish, activeAquarium]
  );
  const fishIdCountsInTank = useMemo(() => {
    const counts = new Map<string, number>();
    const ids = aquariumFish[activeAquarium] || [];
    for (const id of ids) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [aquariumFish, activeAquarium]);
  const schoolFish = useMemo(() => {
    // Ne pas afficher de poissons fantômes si le tank est vide
    if (!fishInTank.length) return [];
    const targetCount = 9;
    return Array.from({ length: targetCount }, (_, i) => fishInTank[i % fishInTank.length]);
  }, [fishInTank]);

  const [showWelcome, setShowWelcome] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showAquariumPicker, setShowAquariumPicker] = useState(false);
  const [showRareEvent, setShowRareEvent] = useState<string | null>(null);
  const [schoolDirection, setSchoolDirection] = useState<"left" | "right">("right");
  const [waterTint, setWaterTint] = useState(0);
  const [lightIntensity, setLightIntensity] = useState(0.4);
  const [showSettings, setShowSettings] = useState(false);
  const [nameDraft, setNameDraft] = useState(userName);
  const [clickedFishId, setClickedFishId] = useState<string | null>(null);
  const [feedingActive, setFeedingActive] = useState(false);
  const [feedCooldown, setFeedCooldown] = useState(false);
  const feedCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fishFedPositions, setFishFedPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [fishReturning, setFishReturning] = useState<Set<string>>(new Set());
  const [weather, setWeather] = useState<"storm" | "rain" | "fog" | null>(null);
  const [floorType, setFloorType] = useState<"sand" | "rock" | "reef">("sand");
  const [season, setSeason] = useState<"spring" | "summer" | "autumn" | "winter">("spring");
  const [isNightMode, setIsNightMode] = useState(false);
  const [deepNightMode, setDeepNightMode] = useState(false);
  const [showDecorations, setShowDecorations] = useState(true);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [fishHealths, setFishHealths] = useState<Record<string, number>>({});
  const [asrmMode, setAsrmMode] = useState(false);
  const [waterQuality, setWaterQuality] = useState({ ph: 7.2, nitrates: 10, health: 95 });
  const [filterBroken, setFilterBroken] = useState(false);
  const [showEventNotif, setShowEventNotif] = useState<string | null>(null);
  // Detect breeding completion (pair removed = baby hatched)
  const prevBreedingCountRef = useRef(breedingPairs.length);

  const reduceEffects = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);
  useEffect(() => {
    if (breedingPairs.length < prevBreedingCountRef.current) {
      // Check if the latest baby has special hidden traits
      const latestBaby = [...fishInstances]
        .filter(f => f.isBaby)
        .sort((a, b) => new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime())[0];
      if (latestBaby?.hiddenTraits?.secretHybrid) {
        setShowEventNotif("Espece secrete debloquee ! Verifiez votre collection.");
      } else if (latestBaby?.hiddenTraits?.fractalPattern) {
        setShowEventNotif("Mutation rare ! Motif fractal detecte.");
      } else {
        setShowEventNotif("Nouveau poisson ne ! Verifiez votre collection.");
      }
      setTimeout(() => setShowEventNotif(null), 5000);
      // 🎥 Caméra intelligente — focus sur la reproduction
      setCameraFocus({ x: 50, y: 55, zoom: 1.12 });
      setTimeout(() => setCameraFocus(null), 8000);
    }
    prevBreedingCountRef.current = breedingPairs.length;
  }, [breedingPairs.length]);
  const [sessionComplete, setSessionComplete] = useState<{
    reward: { gold: number; xp: number };
    activityLabel: string;
    durationLabel: string;
  } | null>(null);

  // ── NEW FEATURE STATES ────────────────────────────────────────────────────
  /** 0–1 ripple tap effects: [{id, x%, y%, createdAt}] */
  const [tapRipples, setTapRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  /** Increments on each tap — drives per-fish flinch animation key */
  const [tapFlinchId, setTapFlinchId] = useState(0);
  /** Whether the score breakdown panel is visible */
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  /** Current water direction: angle degrees (0=right, 180=left) — changes every ~45s */
  const [currentAngle, setCurrentAngle] = useState(0);
  const [currentStrength, setCurrentStrength] = useState(0.4); // 0–1
  // Refs so getFishStyle can read latest current without being a useCallback dep
  // (avoids restarting ALL Framer Motion fish animations every 40–65s)
  const currentAngleRef = useRef(currentAngle);
  const currentStrengthRef = useRef(currentStrength);
  useEffect(() => { currentAngleRef.current = currentAngle; }, [currentAngle]);
  useEffect(() => { currentStrengthRef.current = currentStrength; }, [currentStrength]);
  /** 0–1 lunar phase, 0=new moon (dark), 1=full moon (bright) */
  const lunarPhase = useMemo(() => {
    const knownNewMoon = new Date("2024-01-11").getTime();
    const cycleMs = 29.53 * 24 * 3600 * 1000;
    const phase = ((Date.now() - knownNewMoon) % cycleMs) / cycleMs; // 0–1
    // Convert to brightness: 0.5 = full moon (mid-cycle), 0 and 1 = new moon
    return 1 - Math.abs(phase - 0.5) * 2;
  }, []);

  // Fish personalities (generated once per fish) — must be before tankMood
  const fishPersonalities = useMemo(() => 
    fishInTank.map((fish, i) => {
      // Use fish ID and index for deterministic pseudorandom values
      const seed = fish.id.charCodeAt(0) + fish.id.charCodeAt(fish.id.length - 1) + i;
      const pseudoRandom = (Math.sin(seed) * 10000) % 1;
      const pseudoRandom2 = (Math.cos(seed * 2) * 10000) % 1;

      // Behavioral inheritance from parents via hiddenTraits.dominanceBias
      const instance = fishInstances.find(fi => fi.fishId === fish.id);
      const inheritedDom = instance?.hiddenTraits?.dominanceBias;
      const baseDominance = Math.abs(pseudoRandom2);
      const dominance = inheritedDom !== undefined
        ? Math.max(0, Math.min(1, baseDominance * 0.5 + inheritedDom * 0.5))
        : baseDominance;

      // 30% parental behavioral transmission for babies
      const parentInst = instance?.parents
        ? (fishInstances.find(fi => fi.instanceId === instance.parents!.mother) ??
           fishInstances.find(fi => fi.instanceId === instance.parents!.father))
        : undefined;
      const parentIsTimid = (parentInst?.hiddenTraits?.dominanceBias ?? 0.5) < 0.32;
      const parentIsConfident = (parentInst?.hiddenTraits?.dominanceBias ?? 0.5) > 0.70;
      const baseEnergy = 0.5 + (Math.sin(fish.id.charCodeAt(0) + i) * 0.5 + 0.5) * 0.5;
      const adjustedEnergy = instance?.isBaby
        ? (parentIsTimid ? baseEnergy * 0.72 : parentIsConfident ? Math.min(1, baseEnergy * 1.25) : baseEnergy)
        : baseEnergy;
      
      return {
        trait: ["bold", "timid", "playful", "lazy", "curious", "territorial"][Math.floor((fish.id.charCodeAt(0) + i) % 6)] as "bold" | "timid" | "playful" | "lazy" | "curious" | "territorial",
        energy: adjustedEnergy,
        curiosity: fish.behavior === "curious" ? 0.8 : 0.2 + Math.abs(pseudoRandom) * 0.3,
        preferredDepth: (instance?.isBaby && parentIsTimid) ? "bottom" as const :
                        fish.behavior === "solitary" ? "bottom" as const : 
                        fish.swimSpeed === "fast" ? "surface" as const : 
                        "middle" as const,
        dominance,
        aggression: fish.diet === "Carnivore" ? 0.6 + Math.abs(pseudoRandom) * 0.4 : Math.abs(pseudoRandom) * 0.3,
        health: 100,
        stressed: false,
      };
    }),
    [fishInTank, fishInstances]
  );

  /** Aquarium mood: calm | balanced | stressed | chaotic */
  const tankMood = useMemo(() => {
    const stressedCount = fishPersonalities.filter(p => p.stressed).length;
    const avgHealth = Object.values(fishHealths).length
      ? Object.values(fishHealths).reduce((a, b) => a + b, 0) / Object.values(fishHealths).length
      : 95;
    const avgAggression = fishPersonalities.reduce((s, p) => s + p.aggression, 0) / Math.max(1, fishPersonalities.length);
    const nitrateScore = waterQuality.nitrates;
    const score = stressedCount * 20 + (100 - avgHealth) * 0.5 + avgAggression * 40 + nitrateScore * 0.6;
    if (score < 20) return "calm";
    if (score < 45) return "balanced";
    if (score < 75) return "stressed";
    return "chaotic";
  }, [fishPersonalities, fishHealths, waterQuality]);
  /** Aquarium quality score 0–100 */
  const aquariumScore = useMemo(() => {
    const speciesCount = new Set(fishInTank.map(f => f.id)).size;
    const avgHealth = Object.values(fishHealths).length
      ? Object.values(fishHealths).reduce((a, b) => a + b, 0) / Object.values(fishHealths).length
      : 95;
    const rarityBonus = fishInTank.reduce((s, f) => s + (f.rarity === "legendary" ? 20 : f.rarity === "epic" ? 10 : f.rarity === "rare" ? 5 : 1), 0);
    const harmonyBonus = tankMood === "calm" ? 20 : tankMood === "balanced" ? 10 : tankMood === "stressed" ? -10 : -25;
    const raw = Math.min(100, speciesCount * 8 + avgHealth * 0.3 + Math.min(rarityBonus, 30) + harmonyBonus);
    return Math.max(0, Math.round(raw));
  }, [fishInTank, fishHealths, tankMood]);
  const aquariumRank = aquariumScore >= 80 ? "🌟 Aquarium Harmonieux" : aquariumScore >= 55 ? "🏆 Écosystème Stable" : aquariumScore >= 30 ? "⚠️ Équilibre Fragile" : "🔴 Chaos Aquatique";

  /** Biome mystique : 3+ légendaires + eau parfaite */
  const isMysticBiome = useMemo(() =>
    fishInTank.filter(f => f.rarity === "legendary").length >= 3 &&
    waterQuality.health >= 90 && waterQuality.nitrates < 12
  , [fishInTank, waterQuality]);

  /**
   * Biome abyssal caché : nuit profonde + 3+ bio poissons + eau cristalline.
   * Override total de l'ambiance : fond noir, espèces 100% luminescentes, particules abyssales.
   */
  const isAbyssalBiome = useMemo(() => {
    const localBioCount = fishInstances.filter(
      fi => fi.hiddenTraits?.bioluminescent && fi.hiddenTraits.bioluminescent !== "none"
    ).length;
    return isNightMode && deepNightMode &&
      localBioCount >= 3 &&
      waterQuality.health >= 92 && waterQuality.nitrates < 10 &&
      !isMysticBiome;
  }, [isNightMode, deepNightMode, fishInstances, waterQuality, isMysticBiome]);

  /**
   * Global bioluminescence intensity scalar (0–1).
   * Single source of truth: night × water clarity × tank mood × lunar phase.
   * All bio glow renderers should multiply their base opacity by this value.
   */
  const bioIntensity = useMemo(() => {
    const nightFactor = isNightMode ? 1 : 0.18;
    const clarityFactor = Math.max(0.2, 1 - waterQuality.nitrates / 50);
    const moodFactor = tankMood === "calm" ? 1.22 : tankMood === "balanced" ? 1.0 : tankMood === "stressed" ? 0.68 : 0.38;
    const moonFactor = 0.4 + lunarPhase * 0.6;
    return nightFactor * clarityFactor * moodFactor * moonFactor;
  }, [isNightMode, waterQuality.nitrates, tankMood, lunarPhase]);

  /** Courant local (drag du doigt / souris) — vecteur temporaire */
  const [localCurrentVX, setLocalCurrentVX] = useState(0);
  const [localCurrentVY, setLocalCurrentVY] = useState(0);
  const [dragTrail, setDragTrail] = useState<{ id: number; x: number; y: number }[]>([]);
  const dragCurrentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Double-tap → grosse bulle montante */
  const lastTapTimeRef = useRef(0);
  const [giantBubbles, setGiantBubbles] = useState<{ id: number; x: number; y: number }[]>([]);

  /** Follow-finger: pointer position and slow-move detection */
  const [fingerPos, setFingerPos] = useState<{ x: number; y: number } | null>(null);
  const [isFollowActive, setIsFollowActive] = useState(false);
  const fingerSpeedRef = useRef<{ x: number; y: number; t: number }>({ x: 50, y: 50, t: 0 });
  const lastFingerUpdateRef = useRef<{ x: number; y: number; t: number }>({ x: 50, y: 50, t: 0 });
  const followTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldUpdateFingerPos = useCallback((xPct: number, yPct: number, nowMs: number) => {
    const last = lastFingerUpdateRef.current;
    const delta = Math.abs(xPct - last.x) + Math.abs(yPct - last.y);
    const dt = nowMs - last.t;
    if (dt < 40 && delta < 0.4) return false;
    lastFingerUpdateRef.current = { x: xPct, y: yPct, t: nowMs };
    return true;
  }, []);
  /** Onde surprise — tap when playful fish present triggers amused spin */
  const [surpriseWaveId, setSurpriseWaveId] = useState(0);

  // Stabilize viewport height to avoid Android WebView resize jitter (status/nav bars)
  const [stableViewport, setStableViewport] = useState<{ w: number; h: number }>(() => {
    if (typeof window === "undefined") return { w: 0, h: 0 };
    return { w: window.innerWidth, h: window.innerHeight };
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setStableViewport(prev => {
        const heightDelta = Math.abs(h - prev.h);
        const widthDelta = Math.abs(w - prev.w);
        if (widthDelta > 80 || heightDelta > 140) {
          return { w, h };
        }
        return prev;
      });
    };
    window.addEventListener("resize", handleResize, { passive: true });
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  /** Bioluminescent flash — sync entre poissons luminescents proches */
  const [bioFlashActive, setBioFlashActive] = useState(false);
  /** Response flash — Fish B answers ~700ms after Fish A's initial ping */
  const [bioResponseActive, setBioResponseActive] = useState(false);
  const bioFishCount = useMemo(() => {
    if (fishIdCountsInTank.size === 0) return 0;
    const counts = new Map(fishIdCountsInTank);
    let total = 0;
    for (const inst of fishInstances) {
      const remaining = counts.get(inst.fishId);
      if (!remaining) continue;
      const bio = inst.hiddenTraits?.bioluminescent;
      if (!bio || bio === "none") continue;
      total += 1;
      const next = remaining - 1;
      if (next > 0) counts.set(inst.fishId, next);
      else counts.delete(inst.fishId);
      if (counts.size === 0) break;
    }
    return total;
  }, [fishIdCountsInTank, fishInstances]);
  const showBioCollectivePulse = bioFishCount >= 3 && isNightMode;

  // ── NEW STATES: Interactions & Effects ───────────────────────────────────
  /** Ondulations sur maintien du doigt / souris */
  const [holdWaves, setHoldWaves] = useState<{ id: number; x: number; y: number }[]>([]);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Tempête lumineuse — tous bio-poissons brillent fort 10s */
  const [lightStormActive, setLightStormActive] = useState(false);


  /** Migration nocturne — groupe lumineux traverse le tank lentement */
  const [nocturnalMigrationActive, setNocturnalMigrationActive] = useState(false);
  const [nocturnalMigrationDir, setNocturnalMigrationDir] = useState<1 | -1>(1);

  /** Caméra intelligente — zoom/pan vers événement rare */
  const [cameraFocus, setCameraFocus] = useState<{ x: number; y: number; zoom: number } | null>(null);

  /** Suivi vitesse souris pour "suis le doigt" (décroché si trop rapide) */
  const mouseSpeedRef = useRef(0);
  const lastMouseRef = useRef<{ x: number; y: number; t: number } | null>(null);

  /** Direction de chaque poisson : 1=droite, -1=gauche — mis à jour lors des changements de cap */
  const fishDirections = useRef<Record<number, 1 | -1>>({});

  /** Date d'installation pour croissance des coraux */
  const coralStartTimeRef = useRef(Date.now());

  /** Hybride secret débloqué */
  const [hybridUnlocked, setHybridUnlocked] = useState<string | null>(null);
  /** Track fish that already triggered evolved-form notification (avoids re-firing) */
  const [evolvedFishIds, setEvolvedFishIds] = useState<Set<string>>(new Set());
  // ─────────────────────────────────────────────────────────────────────────

  // Auto-dismiss achievement toast after 5 seconds
  useEffect(() => {
    if (!lastAchievementUnlocked) return;
    const t = setTimeout(() => clearLastAchievement(), 5000);
    return () => clearTimeout(t);
  }, [lastAchievementUnlocked, clearLastAchievement]);

  // Auto night mode based on time
  useEffect(() => {
    const currentHour = new Date().getHours();
    setIsNightMode(currentHour < 6 || currentHour >= 20);
  }, []);

  // Track mouse position for curious fish + speed for "suis le doigt"
  useEffect(() => {
    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      // Throttle to one update per animation frame — critical for mobile perf
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const rect = document.querySelector('.fish-swimming-area')?.getBoundingClientRect();
        if (rect) {
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setMousePosition({ x, y });
          // Speed tracking
          const now = Date.now();
          if (lastMouseRef.current) {
            const dt = Math.max(1, now - lastMouseRef.current.t);
            const dx = x - lastMouseRef.current.x;
            const dy = y - lastMouseRef.current.y;
            mouseSpeedRef.current = Math.sqrt(dx*dx + dy*dy) / dt * 1000; // %/s
          }
          lastMouseRef.current = { x, y, t: now };
        }
      });
    };

    // passive: true = browser knows we won't call preventDefault → no scroll blocking
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Stress detection system: overcrowding and water quality
  useEffect(() => {
    fishPersonalities.forEach((personality, i) => {
      // Check for overcrowding (more than 12 fish causes stress)
      const isOvercrowded = fishInTank.length > 12;
      
      // Check for poor water quality
      const poorWaterQuality = waterQuality.health < 60 || filterBroken;
      
      // Check for aggressive neighbors (high-dominance fish nearby)
      const hasAggressiveNeighbors = fishPersonalities.some((other, j) => 
        j !== i && other.dominance > 0.7 && other.aggression > 0.6
      );
      
      // Update stressed state
      const shouldBeStressed = isOvercrowded || poorWaterQuality || hasAggressiveNeighbors;
      
      // Note: We update the personality object directly since it's derived from useMemo
      // This is safe because fishPersonalities is recreated when fishInTank changes
      personality.stressed = shouldBeStressed;
    });
  }, [fishInTank.length, waterQuality.health, filterBroken, fishPersonalities]);

  // Initialize fish health when fish change
  useEffect(() => {
    setFishHealths(prev => {
      const next: Record<string, number> = {};
      let changed = false;
      fishInTank.forEach((fish, i) => {
        const fishKey = `${fish!.id}-${i}`;
        const existing = prev[fishKey];
        const value = existing ?? 100; // Start at full health
        next[fishKey] = value;
        if (existing !== value) changed = true;
      });
      if (!changed && Object.keys(prev).length === Object.keys(next).length) return prev;
      return next;
    });
  }, [fishInTank]);

  // Health system: decrease/increase over time based on conditions
  useEffect(() => {
    if (fishInTank.length === 0) {
      setFishHealths(prev => (Object.keys(prev).length ? {} : prev));
      return;
    }
    const healthInterval = setInterval(() => {
      setFishHealths(prev => {
        const updated: Record<string, number> = {};
        let changed = false;

        fishInTank.forEach((fish, i) => {
          const fishKey = `${fish!.id}-${i}`;
          const personality = fishPersonalities[i];
          const currentHealth = prev[fishKey] ?? 100;
          
          if (currentHealth <= 0) {
            updated[fishKey] = currentHealth;
            return; // Fish is already dead
          }
          
          let healthChange = 0;
          
          // Negative factors
          if (personality.stressed) healthChange -= 0.5;
          if (waterQuality.health < 50) healthChange -= 1;
          if (filterBroken) healthChange -= 0.8;
          if (fishInTank.length > 15) healthChange -= 0.3; // Severe overcrowding
          
          // Positive factors
          if (waterQuality.health > 80) healthChange += 0.2;
          if (!personality.stressed && waterQuality.health > 90) healthChange += 0.3;
          
          // Update health (clamp between 0 and 100)
          const nextHealth = Math.max(0, Math.min(100, currentHealth + healthChange));
          updated[fishKey] = nextHealth;
          if (nextHealth !== currentHealth) changed = true;
        });

        if (!changed && Object.keys(prev).length === Object.keys(updated).length) return prev;
        return updated;
      });
    }, 3000); // Update every 3 seconds
    
    return () => clearInterval(healthInterval);
  }, [fishInTank, fishPersonalities, waterQuality, filterBroken]);

  // Welcome message on first open without session
  useEffect(() => {
    const today = new Date().toDateString();
    const hasSessionToday = sessions.some(s => new Date(s.date).toDateString() === today);
    if (!hasSessionToday && sessions.length > 0) {
      setShowWelcome(true);
      const t = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const payload = (location.state as { sessionComplete?: {
      reward: { gold: number; xp: number };
      activityLabel: string;
      durationLabel: string;
    } } | null)?.sessionComplete;

    if (payload) {
      setSessionComplete(payload);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!sessionComplete) return;
    const t = setTimeout(() => setSessionComplete(null), 2800);
    return () => clearTimeout(t);
  }, [sessionComplete]);

  useEffect(() => {
    setNameDraft(userName);
  }, [userName]);

  // Rare visual events (passive, after long sessions)
  useEffect(() => {
    const lastSession = sessions[0];
    if (lastSession && lastSession.duration >= 60) {
      const timeSince = Date.now() - new Date(lastSession.date).getTime();
      if (timeSince < 30000) { // within 30s of returning
        const rand = Math.random();
        if (rand < 0.3) {
          setShowRareEvent("light-ray");
          setTimeout(() => setShowRareEvent(null), 5000);
        } else if (rand < 0.5) {
          setSchoolDirection(Math.random() < 0.5 ? "right" : "left");
          setShowRareEvent("school");
          setTimeout(() => setShowRareEvent(null), 6000);
        }
      }
    }
  }, [sessions]);

  // Glass tap + circle swim + eating frenzy + social behaviors random events
  useEffect(() => {
    const interval = setInterval(() => {
      if (fishInTank.length > 0) {
        const roll = Math.random();
        if (roll < 0.18) {
          setShowRareEvent("glass-tap");
          setTimeout(() => setShowRareEvent(null), 2000);
        } else if (roll < 0.32) {
          setSchoolDirection(Math.random() < 0.5 ? "right" : "left");
          setShowRareEvent("circle");
          setShowEventNotif("🔄 Formation en ronde !");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 9000);
        } else if (roll < 0.42) {
          setShowRareEvent("feeding-frenzy");
          setShowEventNotif("🍽️ Heure du repas !");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 5000);
        } else if (roll < 0.52 && fishInTank.filter(f => f.behavior === "schooling").length >= 2) {
          // Playful chase between schooling fish
          setShowEventNotif("🏁 Course improvisée !");
          setShowRareEvent("playful-chase");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 6000);
        } else if (roll < 0.60 && fishPersonalities.filter(p => p.energy < 0.4).length >= 2) {
          // Group meditation — lazy/slow fish gather quietly
          setShowEventNotif("🧘 Méditation de groupe…");
          setShowRareEvent("meditation");
          setTimeout(() => setShowEventNotif(null), 4000);
          setTimeout(() => setShowRareEvent(null), 10000);
        } else if (roll < 0.68 && fishPersonalities.filter(p => p.dominance > 0.65).length >= 2) {
          // Dominance challenge
          setShowEventNotif("👑 Défi territorial !");
          setShowRareEvent("dominance-challenge");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 7000);
        } else if (
          roll < 0.78 &&
          isNightMode &&
          waterQuality.health > 88 &&
          waterQuality.nitrates < 15 &&
          fishInTank.length >= 3 &&
          fishPersonalities.every(p => !p.stressed)
        ) {
          // Chorégraphie rare — eau parfaite + nuit + 0 stress
          setShowEventNotif("🌌 Chorégraphie mystique…");
          setShowRareEvent("choreography");
          setTimeout(() => setShowEventNotif(null), 5000);
          setTimeout(() => setShowRareEvent(null), 14000);
        } else if (
          roll < 0.85 &&
          isNightMode &&
          fishInTank.some(f => f.id === "jellyfish") &&
          fishInTank.some(f => f.id === "seahorse")
        ) {
          // Ballet luminescent — méduse + hippocampe la nuit
          setShowEventNotif("✨ Ballet luminescent…");
          setShowRareEvent("luminous-ballet");
          setTimeout(() => setShowEventNotif(null), 4000);
          setTimeout(() => setShowRareEvent(null), 11000);
        } else if (
          roll < 0.91 &&
          !isNightMode &&
          tankMood === "calm" &&
          fishInTank.filter(f => f.behavior === "schooling").length >= 3
        ) {
          // Rotation circulaire — eau calme + banc de poissons + journée
          setShowEventNotif("🔵 Ronde parfaite !");
          setShowRareEvent("circular-rotation");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 9000);
        } else if (
          roll < 0.96 &&
          isNightMode &&
          fishInTank.length >= 3
        ) {
          // Migration nocturne — groupe lumineux traverse lentement le tank
          setShowEventNotif("🌊 Migration nocturne…");
          setShowRareEvent("night-migration");
          setTimeout(() => setShowEventNotif(null), 4000);
          setTimeout(() => setShowRareEvent(null), 12000);
        } else if (
          roll < 0.97 &&
          !isNightMode &&
          tankMood === "calm" &&
          fishPersonalities.some(p => p.energy < 0.5)
        ) {
          // Spirale en duo — 2 poissons calmes tournent en spirale
          setShowEventNotif("🌀 Spirale zen…");
          setShowRareEvent("spiral-duo");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 8000);
        } else if (
          roll < 0.975 &&
          fishPersonalities.some(p => p.trait === "timid") &&
          !isNightMode
        ) {
          // Cache-cache / je te vois — poisson timide se cache
          setShowEventNotif("🙈 Cache-cache !");
          setShowRareEvent("hide-seek");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 7000);
        } else if (
          roll < 0.98 &&
          fishInTank.filter(f => f.behavior === "schooling").length >= 2
        ) {
          // Effet vague banc — dash → vague décalée
          setShowEventNotif("⚡ Effet de vague !");
          setShowRareEvent("wave-effect");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 5000);
        } else if (
          roll < 0.983 &&
          fishPersonalities.some(p => p.trait === "playful")
        ) {
          // Le farceur — poisson playful approche un timide puis se cache
          setShowEventNotif("😈 Le farceur !");
          setShowRareEvent("trickster");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 6000);
        } else if (
          roll < 0.986 &&
          tankMood === "calm" &&
          !isNightMode
        ) {
          // Jeu avec décor — poissons tournent autour des coraux
          setShowEventNotif("🐚 Jeu avec les coraux…");
          setShowRareEvent("decor-play");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 8000);
        } else if (
          roll < 0.989 &&
          currentStrength > 0.5 &&
          tankMood !== "chaotic"
        ) {
          // Courant fantaisie — poissons se laissent porter
          setShowEventNotif("🌊 Courant fantaisie…");
          setShowRareEvent("current-drift");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 7000);
        } else if (
          roll < 0.991 &&
          fishInstances.some(fi => fi.isBaby) &&
          fishInTank.length >= 2
        ) {
          // Apprentissage de nage — bébé suit un adulte
          setShowEventNotif("🍼 Leçon de nage !");
          setShowRareEvent("swim-lesson");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 9000);
        } else if (
          roll < 0.993 &&
          fishInstances.some(fi => fi.isBaby)
        ) {
          // Jeu des bulles — bébé chasse des bulles
          setShowEventNotif("🫧 Jeu des bulles !");
          setShowRareEvent("bubble-game");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 8000);
        } else if (
          roll < 0.996 &&
          fishPersonalities.filter(p => p.dominance > 0.6).length >= 2
        ) {
          // Défi amical — deux dominants face à face, se gonflent, un cède
          setShowEventNotif("👑 Défi amical !");
          setShowRareEvent("friendly-challenge");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 8000);
        } else if (
          roll < 0.997 &&
          fishPersonalities.some(p => p.trait === "territorial")
        ) {
          // Défi territorial — poisson territorial défend son espace
          setShowEventNotif("🏁 Défense du territoire !");
          setShowRareEvent("territory-dash");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 6000);
        } else if (
          roll < 0.9995 &&
          fishInTank.length >= 2
        ) {
          // Bulles géantes — deux poissons font la course vers une bulle
          setShowEventNotif("🫧 Course aux bulles !");
          setShowRareEvent("giant-bubble-race");
          setTimeout(() => setShowEventNotif(null), 3000);
          setTimeout(() => setShowRareEvent(null), 7000);
        } else if (
          fishPersonalities.filter(p => p.trait === "playful" || p.trait === "curious").length >= 3 &&
          tankMood === "calm"
        ) {
          // Comportement émergent — groupe playful invente trajectoire, change de leader
          setShowEventNotif("🐠 Groupe émergent...");
          setShowRareEvent("emergent-group");
          setTimeout(() => setShowEventNotif(null), 3500);
          setTimeout(() => setShowRareEvent(null), 12000);
        }
      }
    }, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [fishInTank.length, fishPersonalities, isNightMode, tankMood, currentStrength]);

  // Random events system - filter breakdown, water quality changes
  useEffect(() => {
    const eventInterval = setInterval(() => {
      const rand = Math.random();
      
      // 5% chance filter breaks
      if (rand < 0.05 && !filterBroken) {
        setFilterBroken(true);
        setShowEventNotif("⚠️ Panne de filtre !");
        setTimeout(() => setShowEventNotif(null), 4000);
      }
      
      // Water quality degradation over time
      setWaterQuality(prev => {
        const newPh = Math.max(6.5, Math.min(8, prev.ph + (Math.random() - 0.5) * 0.2));
        const newNitrates = filterBroken 
          ? Math.min(50, prev.nitrates + 2) 
          : Math.max(0, prev.nitrates - 1);
        const newHealth = Math.max(60, Math.min(100, 100 - (Math.abs(7.2 - newPh) * 10) - (newNitrates * 0.5)));

        const next = { ph: newPh, nitrates: newNitrates, health: Math.floor(newHealth) };
        if (next.ph === prev.ph && next.nitrates === prev.nitrates && next.health === prev.health) return prev;
        return next;
      });
    }, 30000); // Check every 30s
    
    return () => clearInterval(eventInterval);
  }, [filterBroken]);

  // Reset fish positions when starting a new feeding session
  useEffect(() => {
    if (feedingActive) {
      // Clear saved positions and returning flags so fish swim to food again
      setFishFedPositions({});
      setFishReturning(new Set());
    } else {
      // When feeding ends, mark all fish as returning so they swim back smoothly
      const keys = new Set(fishInTank.map((f, i) => `${f!.id}-${i}`));
      setFishReturning(keys);
    }
  }, [feedingActive]);

  // ── COURANT DYNAMIQUE : direction change toutes les 40–65s ────────────────
  useEffect(() => {
    const randomize = () => {
      setCurrentAngle(Math.random() < 0.55 ? 0 : 180); // mostly left↔right
      setCurrentStrength(0.2 + Math.random() * 0.7);
    };
    randomize();
    const iv = setInterval(randomize, 40000 + Math.random() * 25000);
    return () => clearInterval(iv);
  }, []);

  // ── NITRATES : crevettes/déchets augmentent les nitrates doucement ────────
  useEffect(() => {
    const iv = setInterval(() => {
      setWaterQuality(prev => {
        const nextNitrates = Math.min(50, prev.nitrates + (fishInTank.length > 3 ? 0.4 : 0.15));
        if (nextNitrates === prev.nitrates) return prev;
        return { ...prev, nitrates: nextNitrates };
      });
    }, 20000);
    return () => clearInterval(iv);
  }, [fishInTank.length]);

  // ── ALGUES POUSSENT SI NITRATES > 35 (event notif) ───────────────────────
  useEffect(() => {
    if (waterQuality.nitrates >= 35) {
      setShowEventNotif("🌿 Les algues prolifèrent ! (nitrates élevés)");
      const t = setTimeout(() => setShowEventNotif(null), 4000);
      return () => clearTimeout(t);
    }
  }, [Math.round(waterQuality.nitrates / 5)]); // fire when crosses 5-unit buckets

  // ── ÉCOSYSTÈME : poissons herbivores mangent les algues → ↓ nitrates ─────
  const herbivoreCount = useMemo(
    () => fishInTank.filter(f => f.diet === "Herbivore").length,
    [fishInTank]
  );
  useEffect(() => {
    if (herbivoreCount === 0) return;
    const iv = setInterval(() => {
      setWaterQuality(prev => {
        const nextNitrates = Math.max(0, prev.nitrates - herbivoreCount * 0.4);
        if (nextNitrates === prev.nitrates) return prev;
        return { ...prev, nitrates: nextNitrates };
      });
    }, 25000);
    return () => clearInterval(iv);
  }, [herbivoreCount]);

  // ── ÉCOSYSTÈME : nourrir les poissons → léger pic de nitrates ────────────
  useEffect(() => {
    if (feedingActive) {
      setWaterQuality(prev => {
        const nextNitrates = Math.min(50, prev.nitrates + 1.2);
        if (nextNitrates === prev.nitrates) return prev;
        return { ...prev, nitrates: nextNitrates };
      });
    }
  }, [feedingActive]);

  // ── FLASH BIOLUMINESCENT COMMUNICATION (séquence A → pause → B) ──────────
  useEffect(() => {
    if (bioFishCount < 2) return;
    const base = isNightMode ? 4000 : 9000;
    const iv = setInterval(() => {
      // Step 1 — Fish A initiates (ping)
      setBioFlashActive(true);
      setTimeout(() => setBioFlashActive(false), 450);
      // Step 2 — Fish B responds after a natural pause
      setTimeout(() => {
        setBioResponseActive(true);
        setTimeout(() => setBioResponseActive(false), 400);
      }, 1100);
    }, base + Math.random() * 4000);
    return () => clearInterval(iv);
  }, [bioFishCount, isNightMode]);

  // ── BIOME MYSTIQUE — notification à l'activation ──────────────────────────
  useEffect(() => {
    if (isMysticBiome) {
      setShowEventNotif("🌑 Biome Mystique débloqué…");
      const t = setTimeout(() => setShowEventNotif(null), 5000);
      return () => clearTimeout(t);
    }
  }, [isMysticBiome]);

  // ── BIOME ABYSSAL — notification quand conditions réunies ──────────────────────
  useEffect(() => {
    if (isAbyssalBiome) {
      setShowEventNotif("🌌 Biome Abyssal actif…");
      const t = setTimeout(() => setShowEventNotif(null), 6000);
      return () => clearTimeout(t);
    }
  }, [isAbyssalBiome]);

  // ── ESPÈCE ÉVOLUTIVE — notification quand un poisson atteint la forme mature (30j) ──
  useEffect(() => {
    const newEvolved = fishInstances.filter(
      fi => (fi.age ?? 0) >= 30 && !evolvedFishIds.has(fi.instanceId ?? fi.fishId)
    );
    if (newEvolved.length > 0) {
      const fi = newEvolved[0]!;
      setEvolvedFishIds(prev => {
        const next = new Set(prev);
        newEvolved.forEach(f => next.add(f.instanceId ?? f.fishId));
        return next;
      });
      const fishName = FISH_CATALOG.find(f => f.id === fi.fishId)?.name ?? fi.fishId;
      setShowEventNotif(`✨ ${fishName} a atteint sa forme mature semi-légendaire !`);
      setTimeout(() => setShowEventNotif(null), 6000);
    }
  }, [fishInstances, evolvedFishIds]);

  // ── TEMPÊTE LUMINEUSE — eau parfaite + nuit + bio fish ─────────────────────
  useEffect(() => {
    if (bioFishCount < 2 || !isNightMode) return;
    const iv = setInterval(() => {
      if (waterQuality.health >= 88 && waterQuality.nitrates < 15 && Math.random() < 0.08) {
        setLightStormActive(true);
        setShowEventNotif("⚡ Tempête lumineuse !");
        setTimeout(() => { setLightStormActive(false); setShowEventNotif(null); }, 10000);
      }
    }, 60000);
    return () => clearInterval(iv);
  }, [bioFishCount, isNightMode, waterQuality]);

  // ── MIGRATION NOCTURNE — traversée lente du tank sous la lune ─────────────
  useEffect(() => {
    if (bioFishCount < 2 || !isNightMode) return;
    const iv = setInterval(() => {
      if (!nocturnalMigrationActive && Math.random() < 0.022) {
        const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
        setNocturnalMigrationDir(dir);
        setNocturnalMigrationActive(true);
        setShowEventNotif("🌑 Migration nocturne…");
        setTimeout(() => {
          setNocturnalMigrationActive(false);
          setShowEventNotif(null);
        }, 18000);
      }
    }, 90000);
    return () => clearInterval(iv);
  }, [bioFishCount, isNightMode, nocturnalMigrationActive]);

  // ── CAMÉRA INTELLIGENTE — zoom vers les événements rares ──────────────────
  useEffect(() => {
    if (["choreography", "luminous-ballet", "circular-rotation", "spiral-duo"].includes(showRareEvent ?? "")) {
      setCameraFocus({ x: 50, y: 48, zoom: 1.06 });
      const t = setTimeout(() => setCameraFocus(null), 12000);
      return () => clearTimeout(t);
    }
    if (cameraFocus) {
      setCameraFocus(null);
    }
  }, [showRareEvent, cameraFocus]);

  // ── HYBRIDE SECRET — bébé avec bioluminescent + fractal des 2 parents ──────
  useEffect(() => {
    const secretFish = fishInstances.find(fi =>
      fi.hiddenTraits?.bioluminescent && fi.hiddenTraits.bioluminescent !== "none" &&
      fi.hiddenTraits?.fractalPattern === true &&
      (fi.age ?? 0) < 7 // recently born
    );
    if (secretFish && !hybridUnlocked) {
      setHybridUnlocked(secretFish.fishId);
      setShowEventNotif("🔒 Espèce secrète débloquée ! Hybride Lumina");
      setTimeout(() => setShowEventNotif(null), 6000);
      setTimeout(() => setHybridUnlocked(null), 9000);
    }
  }, [fishInstances]);

  const availableAquariums = AQUARIUM_THEMES.filter(t => ownedAquariums.includes(t.id));

  // ── TAP SUR LA VITRE ─────────────────────────────────────────────────────
  const handleTankTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore settings / UI clicks
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("[data-ui]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const now = Date.now();
    const id = now;
    // Double-tap detection (< 300ms since last tap)
    if (now - lastTapTimeRef.current < 300) {
      setGiantBubbles(prev => [...prev, { id, x: xPct, y: yPct }]);
      setTimeout(() => setGiantBubbles(prev => prev.filter(b => b.id !== id)), 2500);
    } else {
      setTapRipples(prev => [...prev, { id, x: xPct, y: yPct }]);
      setTimeout(() => setTapRipples(prev => prev.filter(r => r.id !== id)), 1200);
      setTapFlinchId(id);
      setTimeout(() => setTapFlinchId(0), 850);
      // Onde surprise — playful fish do an amused reaction instead of flinch
      if (fishPersonalities.some(p => p.trait === 'playful')) {
        setSurpriseWaveId(id);
        setTimeout(() => setSurpriseWaveId(0), 950);
      }
    }
    lastTapTimeRef.current = now;
  }, [fishPersonalities]);

  /** Courant local : crée un courant visuel là où le doigt glisse */
  const handleDragCurrent = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    const xPct = ((clientX - rect.left) / rect.width) * 100;
    const yPct = ((clientY - rect.top) / rect.height) * 100;
    const id = Date.now();
    setDragTrail(prev => [...prev.slice(-8), { id, x: xPct, y: yPct }]);
    if (dragCurrentTimerRef.current) clearTimeout(dragCurrentTimerRef.current);
    dragCurrentTimerRef.current = setTimeout(() => setDragTrail([]), 1800);
  }, []);

  /** Maintenir doigt → onde pulsante */
  const handleHoldStart = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      const xPct = ((clientX - rect.left) / rect.width) * 100;
      const yPct = ((clientY - rect.top) / rect.height) * 100;
      const id = Date.now();
      setHoldWaves(prev => [...prev, { id, x: xPct, y: yPct }]);
      setTimeout(() => setHoldWaves(prev => prev.filter(w => w.id !== id)), 3000);
    }, 400);
  }, []);

  const handleHoldEnd = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
  }, []);

  // Companion fish scale based on total time
  const companionScale = 1 + Math.min(companionLevel * 0.05, 0.5);

  const getFishStyle = useCallback((i: number) => {
    const fish = fishInTank[i];
    const personality = fishPersonalities[i];
    const speed = fish?.swimSpeed || "normal";
    const baseDuration = speed === "slow" ? 16 : speed === "fast" ? 7 : 11;
    
    // Social hierarchy affects behavior
    const isDominant = personality.dominance > 0.7;
    const isTimid = personality.dominance < 0.3;
    const isAggressive = personality.aggression > 0.6;
    const isPlayful = personality.trait === 'playful';
    
    // Adjust for night time (fish sleep and slow down)
    const nightSlowdown = isNightMode ? 1.8 : 1.0;
    
    // Aggressive fish move faster, timid fish slower
    const socialSpeedMod = isAggressive ? 0.8 : isTimid ? 1.2 : 1.0;
    const duration = baseDuration * nightSlowdown * (1 / personality.energy) * socialSpeedMod;
    
    // Deterministic pseudo-random per fish
    const q1 = Math.abs(Math.sin(i * 7.3 + 1.1));
    const q2 = Math.abs(Math.sin(i * 3.7 + 2.4));
    const q3 = Math.abs(Math.sin(i * 11.1 + 0.8));
    const q4 = Math.abs(Math.sin(i * 5.9 + 3.2));
    const q5 = Math.abs(Math.sin(i * 13.7 + 0.5));

    // School fish cluster together in a tight formation; all others spread across tank
    const isSchoolFish = fish?.behavior === "schooling";
    const schoolSlot = i % 6; // slot 0–5 in V-formation
    // Spread fish across the full tank horizontally (5% to 78%)
    const startXPct = isSchoolFish
      ? 18 + schoolSlot * 12  // 18%, 30%, 42%, 54%, 66%, 78% — spread across tank
      : 3 + q1 * 88;

    // Vertical start zone based on depth preference
    let startY: number;
    if (personality.preferredDepth === "bottom") {
      startY = 65 + q2 * 23; // 65–88% (near bottom)
    } else if (personality.preferredDepth === "surface") {
      startY = 3 + q3 * 18;  // 3–21% (near surface)
    } else if (isDominant) {
      startY = 25 + q1 * 30; // 25–55% (mid tank, prominent)
    } else {
      startY = 8 + q1 * 72; // 8–80% (anywhere)
    }

    // ── MIGRATION THERMIQUE — poissons dérivent vers leur zone de T° idéale ──
    // T° de l'eau varie selon l'heure (±4°C), la saison (±2°C) et le filtre
    const _hourAngle = (new Date().getHours() + new Date().getMinutes() / 60) / 24;
    const _tempHour  = Math.sin((_hourAngle - 0.25) * 2 * Math.PI) * 4; // ±4°C (pic midi)
    const _tempSeason = season === "summer" ? 2 : season === "winter" ? -2 : 0;
    const _waterTemp  = 24 + _tempHour + _tempSeason + (filterBroken ? (q1 - 0.5) * 2 : 0);
    // Poissons de surface aiment le chaud → remontent si T°>24
    // Poissons du fond aiment le frais → s'enfoncent légèrement si T°>26
    // Poissons milieu : légère remontée si très chaud, descente si très froid
    const _thermalOffset =
      personality.preferredDepth === "surface" ? Math.max(-10, (_waterTemp - 24) * -1.4) :
      personality.preferredDepth === "bottom"  ? Math.min(5, Math.max(-2, (_waterTemp - 26) * 0.7)) :
      (_waterTemp > 27) ? -4 : (_waterTemp < 21) ? 3 : 0;
    startY = Math.max(2, Math.min(85, startY + _thermalOffset));

    // Bounded movement paths: keep fish inside tank (0–100% horizontal)
    // movementX is pixels from startX. Max safe right: (100-startXPct)/100*380
    // Max safe left: -(startXPct-2)/100*380
    const tankW = 375;
    const safeRight = Math.round(((95 - startXPct) / 100) * tankW);
    const safeLeft  = -Math.round(((startXPct - 2) / 100) * tankW);

    // 8 waypoints — fish zigzags across tank like a real fish
    const px = (f: number) => Math.round(safeLeft + f * (safeRight - safeLeft));
    const r1 = px(0.6  + q2 * 0.38);
    const r2 = px(0.08 + q3 * 0.28);
    const r3 = px(0.72 + q4 * 0.26);
    const r4 = px(0.02 + q5 * 0.22);
    const r5 = px(0.55 + q1 * 0.42);
    const r6 = px(0.18 + q3 * 0.32);
    const r7 = px(0.78 + q2 * 0.2);

    // Vertical offset paths
    let vRange: number;
    if (personality.preferredDepth === "bottom") vRange = 110;
    else if (personality.preferredDepth === "surface") vRange = 90;
    else vRange = 340;

    const vy = (f: number) => Math.round((f * 2 - 1) * vRange);
    const v1 = vy(-q2 * 0.55); const v2 = vy(q3 * 0.8);
    const v3 = vy(-q1 * 0.6);  const v4 = vy(q4 * 0.85);
    const v5 = vy(-q5 * 0.4);  const v6 = vy(q2 * 0.65);

    let movementX = [0, r1, r2, r3, r4, r5, r6, r7, 0];
    let movementY = [0, v1, v2, v3, v4, v5, v6, 0];

    // ── 6 SWIMMING ARCHETYPES ─────────────────────────────────────────────────
    // Determine archetype from personality + behavior + energy
    type Archetype = "school"|"zigzag"|"spiral"|"patrol"|"hover"|"surge"|"skulk"|"default";
    let archetype: Archetype = "default";

    if (isNightMode) {
      archetype = "hover";
    } else if (fish?.behavior === "schooling") {
      archetype = "school";
    } else if (fish?.behavior === "curious") {
      archetype = "spiral";
    } else if (personality.trait === "lazy" || personality.energy < 0.28) {
      archetype = "hover";
    } else if (isAggressive && personality.energy > 0.6) {
      archetype = "zigzag";
    } else if (isTimid && personality.dominance < 0.3) {
      archetype = "skulk";
    } else if (isDominant && personality.aggression < 0.5) {
      archetype = "patrol";
    } else if (q5 > 0.7 && personality.energy > 0.68) {
      archetype = "surge";
    }

    switch (archetype) {
      // 1. SCHOOLING — synchronized V-formation sweep across tank
      case "school": {
        // V-formation: alternating left/right of center line, deeper rows fall behind
        const vRow  = Math.floor(schoolSlot / 2); // 0,0,1,1,2,2
        const vSide = schoolSlot % 2 === 0 ? 1 : -1; // alternate L/R wings
        const fX = vRow * 22 * vSide; // ±22, ±44px lateral offset from row centre
        const fY = vRow * 16;         // 0, 16, 32px vertical depth in formation
        // All school fish share the same sweep path, offset by formation slot
        const sR = Math.round(safeRight * 0.7);
        const sL = Math.round(safeLeft  * 0.7);
        movementX = [fX, fX+Math.round(sR*0.45), fX+sR, fX+Math.round(sR*0.65), fX, fX+Math.round(sL*0.45), fX+sL, fX];
        movementY = [fY, fY-16, fY+10, fY-12, fY+4, fY-16, fY+8, fY];
        break;
      }
      // 2. ZIGZAG — aggressive fish: rapid lateral Z-pattern
      case "zigzag": {
        const zA = Math.round(safeRight * 0.92);
        const zL = Math.round(safeLeft * 0.85);
        movementX = [0, zA, zL, Math.round(zA*0.8), zL, Math.round(zA*0.65), Math.round(zL*0.7), 0];
        movementY = [0, -38, 38, -28, 28, -18, 15, 0];
        break;
      }
      // 3. SPIRAL — curious fish: figure-8 / spiral covering full tank
      case "spiral": {
        const sR = Math.round(safeRight * 0.88);
        const sL = Math.round(safeLeft * 0.88);
        movementX = [0, sR, Math.round(sR*0.35), Math.round(sL*0.35), sL, Math.round(sL*0.35), Math.round(sR*0.35), Math.round(sR*0.6), 0];
        movementY = [0, Math.round(-vRange*0.45), Math.round(vRange*0.65), Math.round(-vRange*0.4), Math.round(vRange*0.72), Math.round(-vRange*0.55), Math.round(vRange*0.35), Math.round(-vRange*0.2), 0];
        break;
      }
      // 4. PATROL — dominant fish: slow dignified sweep of entire tank
      case "patrol": {
        movementX = [0, safeRight, safeRight, Math.round(safeRight*0.3), safeLeft, safeLeft, Math.round(safeLeft*0.3), 0];
        movementY = [0, Math.round(-vRange*0.12), Math.round(vRange*0.08), 0, Math.round(-vRange*0.12), Math.round(vRange*0.08), 0, 0];
        break;
      }
      // 5. HOVER — tired/night/lazy: slower but still swims the full tank
      case "hover": {
        const hR = Math.round(safeRight * 0.65);
        const hL = Math.round(safeLeft * 0.65);
        movementX = [0, hR, Math.round(hL*0.5), Math.round(hR*0.75), hL, Math.round(hR*0.35), Math.round(hL*0.8), 0];
        movementY = [0, -18, 28, -14, 22, -10, 18, 0];
        if (isNightMode) {
          movementX = movementX.map(x => Math.round(x * 0.55));
          movementY = movementY.map(y => Math.round(y * 0.5 + 15));
        }
        break;
      }
      // 6. SURGE — predatory: quick bursts, pause, dash again
      case "surge": {
        const bR = Math.round(safeRight * 0.94);
        const bL = Math.round(safeLeft * 0.92);
        movementX = [0, Math.round(bR*0.08), bR, Math.round(bR*0.95), Math.round(bR*0.4), Math.round(bL*0.4), bL, Math.round(bL*0.05), 0];
        movementY = [0, -12, -38, -32, 0, 0, 22, 16, 0];
        break;
      }
      // 7. SKULK — timid fish: nervous but still covers much of the tank
      case "skulk": {
        const sk = Math.round(Math.min(Math.abs(safeLeft), safeRight) * 0.75);
        movementX = [0, sk, Math.round(safeLeft*0.5), Math.round(sk*0.8), Math.round(safeLeft*0.7), Math.round(sk*0.5), Math.round(safeLeft*0.3), 0];
        movementY = [0, Math.round(-vRange*0.4), Math.round(vRange*0.5), Math.round(-vRange*0.35), Math.round(vRange*0.3), Math.round(-vRange*0.25), Math.round(vRange*0.15), 0];
        break;
      }
      // 8. DEFAULT — varied zigzag across full tank
      default: {
        movementX = [0, r1, r2, r3, r4, r5, r6, r7, 0];
        movementY = [0, v1, v2, v3, v4, v5, v6, 0];
      }
    }

    // startX as percent
    const startX = startXPct;

    // School fish use synchronized duration so they all sweep at the same speed
    const effectiveDuration = isSchoolFish ? baseDuration * nightSlowdown * 1.1 : duration;

    // scaleX keyframes: 1=face right, -1=face left — derived from movementX deltas
    // Same technique as companion fish orbit (faceKf). Framer Motion handles the flip.
    const movementScaleX = movementX.map((x, k) => {
      const next = movementX[k + 1] ?? movementX[k - 1] ?? x;
      return (next ?? x) >= x ? 1 : -1;
    });

    // SOCIAL HIERARCHY: Dominant fish are slightly larger
    let sizeClass = fish?.rarity === "legendary" ? "w-20 h-20" : 
                    fish?.rarity === "epic" ? "w-18 h-18" : 
                    "w-14 h-14";
    
    if (isDominant && fish?.rarity !== "legendary") {
      sizeClass = fish?.rarity === "epic" ? "w-20 h-20" : "w-16 h-16";
    }
    
    // Courant physique : biais des trajectoires vers la direction du courant
    if (currentStrengthRef.current > 0.1) {
      const biasDir = (Math.cos((currentAngleRef.current * Math.PI) / 180) > 0 ? 1 : -1);
      const biasPx = Math.round(currentStrengthRef.current * 28 * biasDir);
      movementX = movementX.map(x => x + biasPx);
    }

    // 🌊 Depth-based tint: fish deeper in tank get the faintest blue hue shift only.
    // No brightness or saturation penalty — fish must keep their full vivid colors.
    const depthFactor = Math.max(0, (startY - 25) / 70); // 0 near surface, ~1 at 95%
    const depthFilter = depthFactor > 0.3
      ? `hue-rotate(${Math.round(depthFactor * 6)}deg) saturate(${(1 - depthFactor * 0.08).toFixed(2)})`
      : undefined;

    // 🐟 Realistic body tilt: derive nose-up / nose-down angle from Y movement deltas.
    // When fish swims upward (negative dy) → slight nose-up (negative deg).
    // When fish dives (positive dy) → slight nose-down (positive deg).
    const tiltKeyframes = movementY.map((y, k) => {
      const nextY = movementY[k + 1] ?? movementY[Math.max(0, k - 1)];
      const dy = nextY - y;
      return Math.max(-14, Math.min(14, dy * 0.045));
    });

    // 🪨 Calm zone near HidingRocks (clusters at ~5%, ~40%, ~76%) — fish slow down
    const nearRock = [5, 40, 76].some(rx => Math.abs(startXPct - rx) < 10);
    const effectiveDurationFinal = effectiveDuration * (nearRock ? 1.28 : 1.0);

    return {
      startX: `${Math.round(startXPct)}%`,
      startY: `${Math.round(startY)}%`,
      startYNum: startY,
      duration: effectiveDurationFinal,
      movementX,
      movementY,
      movementScaleX,
      scaleX: movementScaleX[0] ?? 1,
      size: sizeClass,
      delay: i * 0.5,
      personality,
      isDominant,
      isTimid,
      isAggressive,
      isPlayful,
      depthFilter,
      tiltKeyframes,
    };
  }, [fishInTank, fishPersonalities, isNightMode, season, filterBroken]);

  // Stable memoized styles — prevents Framer Motion from restarting on every state update
  const fishStyles = useMemo(
    () => fishInTank.map((_, i) => getFishStyle(i)),
    [fishInTank, getFishStyle]
  );
  const fishXPositions = useMemo(
    () => fishStyles.map(s => {
      const x = parseFloat(s.startX);
      return Number.isFinite(x) ? x : 50;
    }),
    [fishStyles]
  );

  // Count schooling fish once (used for defensive formation)
  const schoolCount = useMemo(
    () => fishInTank.filter(f => f.behavior === "schooling").length,
    [fishInTank]
  );

  // Detects whether a carnivore is close enough to threaten schooling fish
  // Stable: only depends on fish catalog (no 900ms position updates) — prevents animation restarts
  const predatorNearSchool = useMemo(() => {
    const hasCarnivore = fishInTank.some(f => f.diet === "Carnivore");
    return hasCarnivore && schoolCount >= 4;
  }, [fishInTank, schoolCount]);

  const tintHue = waterTint; // 0-360
  const schoolStartX = schoolDirection === "right" ? "-30%" : "130%";
  const schoolEndX = schoolDirection === "right" ? "130%" : "-30%";

  // Dynamic lighting based on time of day
  const currentHour = new Date().getHours();
  const isDayTime = currentHour >= 6 && currentHour < 20;
  const sunlightIntensity = isDayTime 
    ? Math.sin(((currentHour - 6) / 14) * Math.PI) * 0.5 + 0.3
    : 0.1;

  // Temperature based on season
  const seasonTemperature = { spring: 23, summer: 28, autumn: 21, winter: 18 };
  const currentTemperature = seasonTemperature[season];
  // Dynamic temperature: varies ±2°C by hour (peak at 14h), minus 3°C if filter broken
  const hourlyTempDelta = Math.round(Math.sin(((currentHour - 14) / 12) * Math.PI) * 2);
  const dynamicTemp = currentTemperature + hourlyTempDelta + (filterBroken ? -3 : 0);

  const fishMotion = useMemo(() => {
    const schoolFormScale = predatorNearSchool ? 0.4 : tankMood === "calm" ? 1.22 : 1.0;

    return fishStyles.map((style, i) => {
      const fish = fishInTank[i];
      const fishTempStr = fish?.temperature ?? "";
      const isWarmFish = /2[4-9]|30/.test(fishTempStr);
      const isColdFish = /1[6-9]|2[0-1]/.test(fishTempStr);
      const thermalNudge =
        isWarmFish && dynamicTemp > 26 ? -14 :
        isWarmFish && dynamicTemp < 22 ?  12 :
        isColdFish && dynamicTemp < 22 ? -12 :
        isColdFish && dynamicTemp > 26 ?  14 : 0;

      const baseX = style.movementX;
      const baseY = thermalNudge !== 0
        ? style.movementY.map(y => y + thermalNudge)
        : style.movementY;

      let schoolX = baseX;
      let schoolY = baseY;

      if (fish?.behavior === "schooling") {
        if (predatorNearSchool && schoolCount >= 4) {
          const angle = (2 * Math.PI * (i % 6)) / Math.min(6, schoolCount);
          const cr = 50;
          const cx = Math.round(Math.cos(angle) * cr);
          const cy = Math.round(Math.sin(angle) * cr * 0.55);
          schoolX = [cx, cx + 5, cx - 5, cx + 3, cx - 3, cx + 2, cx - 2, cx];
          schoolY = [cy, cy - 6, cy + 6, cy - 4, cy + 4, cy - 2, cy + 3, cy];
        } else if (schoolFormScale !== 1) {
          schoolX = style.movementX.map(x => Math.round(x * schoolFormScale));
          schoolY = baseY.map(y => Math.round(y * schoolFormScale));
        }
      }

    return { baseX, baseY, schoolX, schoolY };
    });
  }, [fishStyles, fishInTank, dynamicTemp, predatorNearSchool, tankMood, schoolCount]);

  const fishAreaAnimate = useMemo(() => {
    if (reduceEffects) return { scale: 1, x: 0, y: 0 };
    if (cameraFocus) {
      return { scale: cameraFocus.zoom, x: `${(50 - cameraFocus.x) * 0.04}%`, y: `${(48 - cameraFocus.y) * 0.04}%` };
    }
    if (deepNightMode) {
      return { scale: 1.015, x: ["0%", "0.7%", "-0.4%", "0.3%", "0%"], y: ["0%", "0.45%", "-0.38%", "0.18%", "0%"], rotate: [0, 0.4, -0.3, 0.5, -0.2, 0] };
    }
    return { scale: 1, x: 0, y: 0 };
  }, [reduceEffects, cameraFocus, deepNightMode]);

  const fishAreaTransition = useMemo(() => {
    if (reduceEffects) return { duration: 0 };
    return cameraFocus || !deepNightMode
      ? { duration: 1.2, ease: "easeInOut" }
      : { duration: 22, repeat: Infinity, ease: "easeInOut" };
  }, [reduceEffects, cameraFocus, deepNightMode]);

  const fishAreaFilter = useMemo(() => {
    if (reduceEffects) return undefined;
    return deepNightMode
      ? "saturate(1.15) hue-rotate(200deg) brightness(0.84)"
      : tankMood === "calm"
      ? "saturate(1.12) brightness(1.03)"
      : tankMood === "stressed"
        ? "saturate(0.93) brightness(0.99)"
        : tankMood === "chaotic"
          ? "saturate(0.90) brightness(0.97)"
          : undefined;
  }, [reduceEffects, deepNightMode, tankMood]);

  const bokehSpecs = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({
      size: 60 + randRange(i * 11.7 + 1, 0, 80),
      alpha: 0.02 + randRange(i * 7.9 + 2, 0, 0.04),
      duration: 8 + randRange(i * 5.3 + 3, 0, 4),
      left: 10 + i * 12,
      top: 20 + (i % 3) * 25,
    })),
    [theme.id]
  );

  const algaeSpots = useMemo(
    () => Array.from({ length: 8 }, (_, i) => ({
      size: 40 + randRange(i * 9.1 + 4, 0, 60),
      left: 10 + i * 12,
      top: 20 + (i % 3) * 25,
    })),
    [theme.id]
  );

  const choirStars = useMemo(
    () => Array.from({ length: 12 }, (_, k) => ({
      top: 15 + randRange(k * 13.1 + 5, 0, 65),
      left: 5 + randRange(k * 9.7 + 6, 0, 88),
      duration: 1.2 + randRange(k * 4.7 + 7, 0, 1.5),
      delay: randRange(k * 3.3 + 8, 0, 2),
    })),
    [theme.id]
  );

  // Season colors
  const seasonColors = {
    spring: { hue: 120, saturation: 50, brightness: 55 },
    summer: { hue: 45, saturation: 60, brightness: 60 },
    autumn: { hue: 25, saturation: 55, brightness: 50 },
    winter: { hue: 200, saturation: 40, brightness: 45 },
  };

  const currentSeasonColor = seasonColors[season];

  return (
    <div
      className="fixed inset-x-0 top-0 flex flex-col tank-container"
      style={{ height: stableViewport.h ? `${stableViewport.h}px` : "100vh" }}
      onClick={handleTankTap}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (e.buttons === 1) handleDragCurrent(e.clientX, e.clientY, rect);
        // Follow-finger position + speed tracking
        const xPct = ((e.clientX - rect.left) / rect.width) * 100;
        const yPct = ((e.clientY - rect.top) / rect.height) * 100;
        const nowMs = Date.now();
        const dx = xPct - fingerSpeedRef.current.x;
        const dy = yPct - fingerSpeedRef.current.y;
        const dt = Math.max(nowMs - fingerSpeedRef.current.t, 1);
        const spd = Math.sqrt(dx * dx + dy * dy) / dt * 100;
        fingerSpeedRef.current = { x: xPct, y: yPct, t: nowMs };
        if (shouldUpdateFingerPos(xPct, yPct, nowMs)) {
          setFingerPos({ x: xPct, y: yPct });
          if (spd < 2.8) {
            if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
            setIsFollowActive(true);
            followTimeoutRef.current = setTimeout(() => { setIsFollowActive(false); setFingerPos(null); }, 3200);
          } else {
            setIsFollowActive(false);
          }
        }
      }}
      onMouseDown={(e) => handleHoldStart(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
      onMouseUp={handleHoldEnd}
      onMouseLeave={handleHoldEnd}
      onTouchMove={(e) => {
        const t = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        handleDragCurrent(t.clientX, t.clientY, rect);
        // Follow-finger position + speed tracking (touch)
        const xPct = ((t.clientX - rect.left) / rect.width) * 100;
        const yPct = ((t.clientY - rect.top) / rect.height) * 100;
        const nowMs = Date.now();
        const dx = xPct - fingerSpeedRef.current.x;
        const dy = yPct - fingerSpeedRef.current.y;
        const dt = Math.max(nowMs - fingerSpeedRef.current.t, 1);
        const spd = Math.sqrt(dx * dx + dy * dy) / dt * 100;
        fingerSpeedRef.current = { x: xPct, y: yPct, t: nowMs };
        if (shouldUpdateFingerPos(xPct, yPct, nowMs)) {
          setFingerPos({ x: xPct, y: yPct });
          if (spd < 2.8) {
            if (followTimeoutRef.current) clearTimeout(followTimeoutRef.current);
            setIsFollowActive(true);
            followTimeoutRef.current = setTimeout(() => { setIsFollowActive(false); setFingerPos(null); }, 3200);
          } else {
            setIsFollowActive(false);
          }
        }
      }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        handleHoldStart(t.clientX, t.clientY, e.currentTarget.getBoundingClientRect());
      }}
      onTouchEnd={handleHoldEnd}
    >
      {/* Background with water tint */}
      <div className="absolute inset-0">
        <motion.img 
          key={theme.id}
          src={themeBackground} 
          alt="" 
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        />
        {/* Water tint overlay */}
        {waterTint > 0 && (
          <div className="absolute inset-0" style={{ 
            background: `hsla(${tintHue}, 60%, 30%, 0.15)`,
            mixBlendMode: "overlay"
          }} />
        )}
        {/* Light intensity overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/30" 
          style={{ opacity: 1 - lightIntensity + 0.3 }} />
        
        {/* Surface reflections - animated light caustics */}
        <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden opacity-20 pointer-events-none">
          <motion.div 
            className="w-[200%] h-full"
            style={{
              background: "repeating-linear-gradient(90deg, transparent, rgba(255,255,255,0.03) 2px, transparent 4px)",
            }}
            animate={{ x: [0, -100] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Water distortion effect */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.02) 0%, transparent 70%)" 
          }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.02, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <Bubbles count={reduceEffects ? 10 : 25} />

      {/* ── NOUVEAUX COMPOSANTS ──────────────────────────────────────────── */}
      {/* Déchets organiques — augmentent si trop de poissons */}
      <WasteParticles nitrateLevel={waterQuality.nitrates} isNight={isNightMode} shrimpsCleaning={waterQuality.nitrates > 20} />
      {/* Plancton bioluminescent — visible uniquement la nuit */}
      <PlanktonParticles moonPhase={lunarPhase} waterClarity={1 - waterQuality.nitrates / 50} isNight={isNightMode} tankMood={tankMood} />

      {/* Tap ripples sur la vitre — 3 anneaux concentriques + point d'impact central */}
      {tapRipples.map(r => (
        <div key={r.id} className="absolute pointer-events-none"
          style={{ left: `${r.x}%`, top: `${r.y}%`, transform: 'translate(-50%,-50%)', zIndex: 50 }}>
          {[0, 1, 2].map(k => (
            <motion.div key={k} className="absolute rounded-full pointer-events-none"
              style={{
                width: 8, height: 8, top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                border: `${1.5 - k * 0.3}px solid rgba(255,255,255,${0.55 - k * 0.12})`,
              }}
              initial={{ scale: 0.2, opacity: 0.8 - k * 0.15 }}
              animate={{ scale: 7 + k * 2.5, opacity: 0 }}
              transition={{ duration: 0.85 + k * 0.2, delay: k * 0.1, ease: 'easeOut' }}
            />
          ))}
          {/* Point d'impact central */}
          <motion.div className="absolute rounded-full bg-white/55 pointer-events-none"
            style={{ width: 5, height: 5, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 0.1, opacity: 0 }}
            transition={{ duration: 0.22 }}
          />
        </div>
      ))}

      {/* 💧 Double-tap → grosse bulle montante */}
      {giantBubbles.map(b => {
        // 🏁 Compétition bulle — 2 poissons joueurs foncent vers la bulle
        const racers = fishInTank
          .map((fish, idx) => ({ fish, idx }))
          .filter(({ idx }) => fishPersonalities[idx]?.trait === "playful" || fishPersonalities[idx]?.curiosity > 0.65)
          .slice(0, 2);
        return (
          <div key={b.id} className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
            <motion.div className="absolute rounded-full pointer-events-none"
              style={{ zIndex: 50 }}
              initial={{ x: `${b.x}%`, y: `${b.y}%`, translateX: "-50%", translateY: "-50%", opacity: 0.8, scale: 0.3 }}
              animate={{ y: [`${b.y}%`, `${b.y - 50}%`], scale: [0.3, 1.6, 2.2], opacity: [0.8, 0.55, 0] }}
              transition={{ duration: 2.2, ease: "easeOut" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%",
                background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.7) 0%, rgba(130,210,255,0.35) 50%, rgba(80,170,255,0.15) 80%, transparent 100%)",
                border: "1.5px solid rgba(200,240,255,0.7)", boxShadow: "0 0 18px 4px rgba(100,200,255,0.25)" }} />
            </motion.div>
            {racers.map(({ fish, idx }) => {
              const s = fishStyles[idx] ?? getFishStyle(idx);
              const startLeft = s.startX;
              const startTop = s.startY;
              const offsetX = (idx === 0 ? 12 : -12);
              return (
                <motion.div key={`race-${fish.id}-${b.id}`} className="absolute w-10 h-10 pointer-events-none"
                  style={{ left: startLeft, top: startTop, zIndex: 51 }}
                  initial={{ x: 0, y: 0, scale: 1 }}
                  animate={{
                    x: [`${b.x - parseFloat(startLeft) + offsetX}%`, 0],
                    y: [`${b.y - parseFloat(s.startY)}%`, 0],
                    scale: [1.2, 1],
                  }}
                  transition={{ duration: 1.1, ease: [0.1, 0, 0.3, 1], delay: idx * 0.15 }}>
                  <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
                </motion.div>
              );
            })}
          </div>
        );
      })}


      {/* Aquarium mood tint */}
      {tankMood === "stressed" && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, background: "radial-gradient(ellipse at center, transparent 60%, rgba(255,80,40,0.08) 100%)" }} />
      )}
      {tankMood === "chaotic" && (
        <motion.div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, background: "rgba(255,50,30,0.08)" }}
          animate={{ opacity: [0.08, 0.16, 0.08] }} transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* Seasonal tint - always visible */}
      <div 
        className="absolute inset-0 pointer-events-none z-5 mix-blend-overlay"
        style={{
          background: `hsla(${currentSeasonColor.hue}, ${currentSeasonColor.saturation}%, ${currentSeasonColor.brightness}%, 0.15)`,
        }}
      />

      {/* Season particles */}
      <AnimatePresence>
        {season === "winter" && (
          <>
            {/* Full frost border - all 4 edges */}
            {/* Top edge */}
            <motion.div className="absolute top-0 left-0 right-0 h-12 pointer-events-none z-6"
              style={{ background: "linear-gradient(to bottom, rgba(200,235,255,0.70) 0%, rgba(200,235,255,0.25) 60%, transparent 100%)" }}
              animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity }} />
            {/* Bottom edge */}
            <motion.div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-6"
              style={{ background: "linear-gradient(to top, rgba(160,210,255,0.80) 0%, rgba(200,230,255,0.25) 65%, transparent 100%)" }}
              animate={{ opacity: [0.85, 1, 0.85] }} transition={{ duration: 4, repeat: Infinity }} />
            {/* Left edge */}
            <motion.div className="absolute top-0 left-0 bottom-0 w-10 pointer-events-none z-6"
              style={{ background: "linear-gradient(to right, rgba(180,225,255,0.70) 0%, rgba(200,235,255,0.18) 65%, transparent 100%)" }}
              animate={{ opacity: [0.75, 1, 0.75] }} transition={{ duration: 3.5, repeat: Infinity }} />
            {/* Right edge */}
            <motion.div className="absolute top-0 right-0 bottom-0 w-10 pointer-events-none z-6"
              style={{ background: "linear-gradient(to left, rgba(180,225,255,0.70) 0%, rgba(200,235,255,0.18) 65%, transparent 100%)" }}
              animate={{ opacity: [0.70, 0.95, 0.70] }} transition={{ duration: 4.5, repeat: Infinity }} />
            {/* Corner ice crystals - top-left */}
            {[0,1,2,3,4].map((i) => (
              <motion.div key={`ice-tl-${i}`} className="absolute pointer-events-none z-6"
                style={{ left: `${i * 7}%`, top: 0, width: `${6+(i%3)*3}px`, height: `${12+(i%3)*6}px`,
                  background: 'linear-gradient(to bottom, rgba(220,240,255,0.9), rgba(180,220,255,0.3))',
                  borderRadius: '0 0 50% 50%', transformOrigin: 'top center' }}
                animate={{ opacity: [0.6, 0.95, 0.6], scaleY: [1, 1.08, 1] }}
                transition={{ duration: 2.5 + i * 0.4, repeat: Infinity }} />
            ))}
            {/* Corner ice crystals - bottom */}
            {[0,1,2,3,4,5,6].map((i) => (
              <motion.div key={`ice-bot-${i}`} className="absolute pointer-events-none z-6"
                style={{ left: `${i * 14 + 1}%`, bottom: 0, width: `${7+(i%3)*4}px`, height: `${14+(i%4)*7}px`,
                  background: 'linear-gradient(to top, rgba(200,235,255,0.9), rgba(180,220,255,0.25))',
                  borderRadius: '50% 50% 0 0', transformOrigin: 'bottom center' }}
                animate={{ opacity: [0.65, 0.9, 0.65] }}
                transition={{ duration: 2.8 + i * 0.3, repeat: Infinity }} />
            ))}
            {/* Ice crystals left wall */}
            {[0,1,2,3,4].map((i) => (
              <motion.div key={`ice-l-${i}`} className="absolute pointer-events-none z-6"
                style={{ left: 0, top: `${10 + i * 18}%`, width: `${10+(i%3)*4}px`, height: `${14+(i%3)*6}px`,
                  background: 'linear-gradient(to right, rgba(200,235,255,0.85), rgba(180,220,255,0.2))',
                  borderRadius: '0 50% 50% 0', transformOrigin: 'left center' }}
                animate={{ opacity: [0.55, 0.85, 0.55] }}
                transition={{ duration: 3 + i * 0.35, repeat: Infinity }} />
            ))}
            {/* Ice crystals right wall */}
            {[0,1,2,3,4].map((i) => (
              <motion.div key={`ice-r-${i}`} className="absolute pointer-events-none z-6"
                style={{ right: 0, top: `${15 + i * 17}%`, width: `${9+(i%3)*3}px`, height: `${12+(i%3)*7}px`,
                  background: 'linear-gradient(to left, rgba(200,235,255,0.8), rgba(180,220,255,0.2))',
                  borderRadius: '50% 0 0 50%', transformOrigin: 'right center' }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3.5 + i * 0.3, repeat: Infinity }} />
            ))}
          </>
        )}
        {season === "spring" && (
          <>
            {[0,1,2,3,4,5,6,7,8,9,10].map((i) => {
              const xPath = i % 2 === 0
                ? [0, 28, -20, 35, -15, 10, 0]
                : [0, -25, 18, -32, 22, -8, 0];
              return (
                <motion.div
                  key={`petal-${i}`}
                  className="absolute pointer-events-none z-6"
                  style={{ left: `${4 + i * 9}%`, fontSize: `${10 + (i % 3) * 3}px` }}
                  initial={{ y: "-8vh", opacity: 0, rotate: 0 }}
                  animate={{ y: "108vh", opacity: [0, 0.7, 0.65, 0.5, 0], rotate: [0, 120, 240, 360], x: xPath }}
                  transition={{ duration: 9 + i * 1.2, delay: i * 0.7, repeat: Infinity, ease: "easeInOut" }}
                >🌸</motion.div>
              );
            })}
          </>
        )}
        {season === "autumn" && (
          <>
            {[0,1,2,3,4,5,6,7,8,9,10].map((i) => {
              const xPath = i % 2 === 0
                ? [0, -30, 22, -38, 28, -12, 0]
                : [0, 26, -18, 34, -24, 10, 0];
              return (
                <motion.div
                  key={`leaf-${i}`}
                  className="absolute pointer-events-none z-6"
                  style={{ left: `${3 + i * 9}%`, fontSize: `${11 + (i % 3) * 3}px` }}
                  initial={{ y: "-8vh", opacity: 0, rotate: 0 }}
                  animate={{ y: "108vh", opacity: [0, 0.85, 0.7, 0.5, 0], rotate: [0, -60, 60, -40, 20], x: xPath }}
                  transition={{ duration: 7 + i * 1.1, delay: i * 0.6, repeat: Infinity, ease: "easeInOut" }}
                >🍂</motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Night mode overlay */}
      {isNightMode && (
        <>
          <div className="absolute inset-0 bg-slate-900/40 pointer-events-none z-5" />
          {/* Moon ray */}
          <motion.div
            className="absolute top-0 left-[40%] w-24 h-full bg-gradient-to-b from-blue-100/10 via-blue-200/5 to-transparent rotate-6 blur-2xl pointer-events-none z-6"
            animate={{
              opacity: [0.3, 0.5, 0.3],
              left: ["35%", "45%", "35%"],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}

      {/* 🌌 Mode Nuit Profonde — obscurité totale + halos bioluminescents */}
      {deepNightMode && (
        <>
          {/* Couche d'obscurité profonde */}
          <motion.div className="absolute inset-0 pointer-events-none z-7"
            style={{ background: "rgba(0,2,18,0.62)" }}
            animate={{ opacity: [0.55, 0.68, 0.55] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Vignetage circulaire */}
          <div className="absolute inset-0 pointer-events-none z-7"
            style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,1,12,0.75) 100%)" }}
          />
          {/* Reflets abyssaux (halos cyan qui dérivent lentement) */}
          {[...Array(4)].map((_, k) => (
            <motion.div key={`abyss-${k}`} className="absolute rounded-full pointer-events-none z-7"
              style={{
                width: `${60 + k * 25}px`, height: `${60 + k * 25}px`,
                background: `radial-gradient(circle, hsla(${190 + k*20},100%,65%,0.07) 0%, transparent 70%)`,
                top: `${20 + k * 17}%`, left: `${15 + k * 20}%`,
                filter: "blur(8px)",
              }}
              animate={{ x: [-15, 20, -10, 15, -15], y: [-8, 12, -6, 8, -8], opacity: [0.4, 0.9, 0.5, 0.8, 0.4] }}
              transition={{ duration: 14 + k * 3, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
          {/* 🧘 Zen hint — tap to exit deep night mode */}
          <motion.button
            className="absolute z-[40] pointer-events-auto"
            style={{ bottom: "18px", left: "50%", transform: "translateX(-50%)", background: "none", border: "none" }}
            animate={{ opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            onClick={() => setDeepNightMode(false)}
          >
            <span className="text-[9px] text-white/40 tracking-[0.35em] uppercase font-light">Toucher pour quitter</span>
          </motion.button>
        </>
      )}

      {/* Dynamic sunlight based on time of day */}
      {isDayTime && !isNightMode && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-full pointer-events-none z-6"
          style={{
            background: `radial-gradient(ellipse at ${30 + (currentHour - 6) * 3}% 0%, rgba(255,235,180,${sunlightIntensity * 0.15}) 0%, transparent 50%)`,
          }}
          animate={{
            opacity: [sunlightIntensity, sunlightIntensity * 1.1, sunlightIntensity],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Bokeh effect - floating light particles */}
      <div className="absolute inset-0 pointer-events-none z-6 overflow-hidden">
        {bokehSpecs.map((spec, i) => (
          <motion.div
            key={`bokeh-${i}`}
            className="absolute rounded-full blur-xl"
            style={{
              width: spec.size,
              height: spec.size,
              background: `radial-gradient(circle, rgba(255,255,255,${spec.alpha}) 0%, transparent 70%)`,
              left: `${spec.left}%`,
              top: `${spec.top}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: spec.duration,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Nitrate green tint — subtle algae bloom visual when water quality degrades */}
      <AnimatePresence>
        {waterQuality.nitrates > 30 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: Math.min(0.18, (waterQuality.nitrates - 30) * 0.006) }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
            className="absolute inset-0 pointer-events-none z-[9]"
            style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(40,120,40,0.25) 100%)' }}
          />
        )}
      </AnimatePresence>

      {/* Filter-based algae overlay - appears when water quality is bad */}
      <AnimatePresence>
        {filterBroken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 pointer-events-none z-[15]"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, rgba(34, 139, 34, ${0.1 + waterQuality.nitrates * 0.01}) 0%, transparent 60%)`,
              mixBlendMode: "multiply",
            }}
          >
            {/* Algae spots appearing on screen */}
            {algaeSpots.map((spot, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: spot.size,
                  height: spot.size,
                  left: `${spot.left}%`,
                  top: `${spot.top}%`,
                  background: `radial-gradient(circle, rgba(34, 139, 34, ${0.3 + waterQuality.nitrates * 0.015}) 0%, transparent 70%)`,
                  filter: "blur(15px)",
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.6, 0.4],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Food particles - fixed overlay above everything */}
      <FoodParticles 
        active={feedingActive} 
        onComplete={() => {
          setFeedingActive(false);
          // Cooldown 2s pour éviter le spam de nourrissage (quêtes feed)
          if (feedCooldownRef.current) clearTimeout(feedCooldownRef.current);
          setFeedCooldown(true);
          feedCooldownRef.current = setTimeout(() => setFeedCooldown(false), 2000);
        }} 
      />

      {/* Weather effects */}
      <WeatherEffects type={weather} />

      {/* Parallax depth layers */}
      {!reduceEffects && <ParallaxLayers />}

      {/* Bokeh background effect */}
      {!reduceEffects && <BokehEffect />}

      {/* Light rays from surface */}
      {!reduceEffects && <LightRays count={6} intensity={lightIntensity} isNight={isNightMode} moonPhase={lunarPhase} />}

      {/* Surface reflections and caustics */}
      {!reduceEffects && <SurfaceReflections />}

      {/* Ambient music system */}
      <AmbientMusic theme={theme.id} volume={soundEnabled ? (isAbyssalBiome ? 0.006 : deepNightMode ? 0.018 : asrmMode ? 0.003 : 0.05) : 0} season={season} tankMood={tankMood} />

      {/* Fish swimming sounds */}
      <FishSounds
        fishCount={fishInTank.length}
        volume={soundEnabled ? (asrmMode ? 0.003 : 0.03) : 0}
        fishXPositions={fishXPositions}
      />

      {/* ASMR mode enhanced sounds */}
      <ASMRSounds enabled={asrmMode && soundEnabled} volume={0.05} isRaining={weather === "rain" || weather === "storm"} isNight={isNightMode} />
      {soundEnabled && <WaterSounds volume={0.12} />}

      {/* Achievement unlock toast */}
      <AnimatePresence>
        {lastAchievementUnlocked && (() => {
          const ach = ACHIEVEMENTS.find(a => a.id === lastAchievementUnlocked);
          if (!ach) return null;
          return (
            <motion.div
              key={`ach-${lastAchievementUnlocked}`}
              initial={{ opacity: 0, x: '-50%', y: 40, scale: 0.85 }}
              animate={{ opacity: 1, x: '-50%', y: 0, scale: 1 }}
              exit={{ opacity: 0, x: '-50%', y: -20, scale: 0.9 }}
              transition={{ duration: 0.5, ease: 'backOut' }}
              className="fixed z-50 glass-nav rounded-2xl px-5 py-3 flex items-center gap-3 pointer-events-auto"
              style={{ top: '90px', left: '50%', width: 'max-content', maxWidth: '88vw', minWidth: '220px', border: '1px solid rgba(255,215,0,0.3)', boxShadow: '0 0 20px rgba(255,215,0,0.15)' }}
              onClick={clearLastAchievement}
            >
              <span className="text-2xl">{ach.emoji}</span>
              <div>
                <p className="text-[10px] text-yellow-400/80 font-semibold uppercase tracking-wider">Tropée débloquée !</p>
                <p className="text-sm font-bold text-foreground">{ach.title}</p>
                <p className="text-[10px] text-muted-foreground">{ach.description}</p>
              </div>
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.08) 0%, transparent 70%)' }}
              />
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Rare event: Light ray */}
      <AnimatePresence>
        {showRareEvent === "light-ray" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            <div className="absolute top-0 left-[30%] w-32 h-full bg-gradient-to-b from-gold/10 via-gold/5 to-transparent rotate-12 blur-xl" />
            <div className="absolute top-0 left-[50%] w-20 h-full bg-gradient-to-b from-primary/8 via-primary/3 to-transparent -rotate-6 blur-lg" />
          </motion.div>
        )}
        {showRareEvent === "glass-tap" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4 }}
            className="absolute top-[40%] right-[15%] pointer-events-none z-20"
          >
            <motion.div
              animate={{
                x: [-5, 5, -3, 3, 0],
                y: [-3, 3, -2, 2, 0],
              }}
              transition={{ duration: 0.4, times: [0, 0.2, 0.4, 0.6, 1] }}
            >
              <div className="w-16 h-16 relative">
                <SafeImage
                  src={fishInTank[0]?.image || FISH_CATALOG[0].image}
                  mobileSrc={fishInTank[0]?.imageMobile || FISH_CATALOG[0].imageMobile}
                  alt=""
                  className="w-full h-full object-contain drop-shadow-2xl"
                  fallbackClassName="w-full h-full"
                />
              </div>
            </motion.div>
            {/* Glass impact ripples */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-4 border-foreground/30"
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
            <motion.div
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: [1, 2], opacity: [0.4, 0] }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-foreground/20"
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
            />
          </motion.div>
        )}
        {/* Circle formation event */}
        {showRareEvent === "circle" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 1 }}
            className="absolute top-[38%] left-1/2 pointer-events-none z-10"
            style={{ width: 0, height: 0 }}
          >
            {/* Central vortex glow */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{ width: 180, height: 180, left: -90, top: -90, background: 'radial-gradient(circle, rgba(100,200,255,0.07) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            {schoolFish.slice(0, 6).map((fish, i) => {
              const n = 6;
              const baseAngle = (i / n) * Math.PI * 2;
              const rX = 90; // slightly elliptical
              const rY = 72;
              const steps = 60; // many steps for ultra-smooth orbit
              const dur = 8 + i * 0.15; // each fish slightly different speed for realism
              const xKf = Array.from({ length: steps + 1 }, (_, k) =>
                rX * Math.cos(baseAngle + (k / steps) * Math.PI * 2)
              );
              const yKf = Array.from({ length: steps + 1 }, (_, k) =>
                rY * Math.sin(baseAngle + (k / steps) * Math.PI * 2)
              );
              // face direction: +1 when moving right, -1 when moving left
              const faceKf = xKf.map((x, k) => (xKf[Math.min(k + 1, steps)] ?? x) >= x ? 1 : -1);
              return (
                <motion.div
                  key={`c-${fish.id}-${i}`}
                  className="absolute"
                  style={{ width: 52, height: 52, left: -26, top: -26 }}
                  animate={{ x: xKf, y: yKf }}
                  transition={{ duration: dur, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                >
                  {/* Bubble trail behind fish */}
                  <motion.div
                    className="absolute rounded-full bg-white/20 border border-white/30"
                    style={{ width: 5, height: 5, left: -8, top: '45%' }}
                    animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1, 1.4], y: [0, -12, -22] }}
                    transition={{ duration: 1.8, delay: i * 0.3, repeat: Infinity, repeatDelay: 1.5 }}
                  />
                  <motion.div
                    style={{ scaleX: faceKf[0] }}
                    animate={{ scaleX: faceKf }}
                    transition={{ duration: dur, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                  >
                    <SafeImage
                      src={fish.image}
                      mobileSrc={fish.imageMobile}
                      alt=""
                      priority="high"
                      className="w-full h-full object-contain drop-shadow-xl"
                      fallbackClassName="w-full h-full"
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Feeding frenzy event */}
        {showRareEvent === "feeding-frenzy" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {schoolFish.slice(0, 5).map((fish, i) => (
              <motion.div
                key={`ff-${fish.id}-${i}`}
                className="absolute w-14 h-14"
                style={{ left: `${15 + i * 14}%`, top: `${25 + (i%2)*15}%` }}
                animate={{
                  x: [0, 15, -10, 20, 0],
                  y: [0, -20, 10, -15, 0],
                  rotate: [0, 20, -15, 25, 0],
                  scale: [1, 1.15, 0.95, 1.1, 1],
                }}
                transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
              >
                <SafeImage
                  src={fish.image}
                  mobileSrc={fish.imageMobile}
                  alt=""
                  className="w-full h-full object-contain drop-shadow-xl"
                  fallbackClassName="w-full h-full"
                />
                <motion.span
                  className="absolute -top-4 -right-2 text-sm"
                  animate={{ scale: [0.8,1.3,0.8], opacity: [0.7,1,0.7] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i*0.15 }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 🏁 Playful chase — two fish dash at each other repeatedly */}
        {showRareEvent === "playful-chase" && schoolFish.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10">
            {schoolFish.slice(0, 2).map((fish, i) => (
              <motion.div key={`chase-${fish.id}-${i}`}
                className="absolute w-12 h-12"
                style={{ top: "40%", left: i === 0 ? "20%" : "70%" }}
                animate={{ x: i === 0 ? [0, 160, 0, 160, 0] : [0, -160, 0, -160, 0], y: [0, -15, 5, -10, 0], scaleX: i === 0 ? [1,1,1,-1,-1] : [-1,-1,-1,1,1] }}
                transition={{ duration: 2.4 + i * 0.2, repeat: Infinity, ease: "easeInOut" }}>
                <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain drop-shadow-xl" fallbackClassName="w-full h-full" />
                {/* Trail de bulles derrière chaque poisson en course */}
                {[0, 1, 2].map(k => (
                  <motion.div key={`race-bubble-${k}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: `${5 - k}px`, height: `${5 - k}px`,
                      background: 'rgba(180,225,255,0.7)',
                      left: i === 0 ? `${-8 - k * 8}px` : `${8 + k * 8}px`,
                      top: '50%', transform: 'translateY(-50%)',
                    }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1, 1.6], y: [0, -6 + k * 2, -12 + k * 3] }}
                    transition={{ duration: 0.55 + k * 0.12, repeat: Infinity, ease: 'easeOut', delay: k * 0.1 }}
                  />
                ))}
              </motion.div>
            ))}
            {/* Ligne d'arrêvée au centre */}
            <motion.div className="absolute pointer-events-none"
              style={{ top: '36%', left: '49%', width: '2px', height: '18%', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.3), transparent)' }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}

        {/* 🧘 Group meditation — lazy fish hover quietly in a cluster */}
        {showRareEvent === "meditation" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10">
            {/* Zen glow aura */}
            <motion.div className="absolute pointer-events-none"
              style={{ top: '44%', left: '50%', transform: 'translate(-50%,-50%)', width: 140, height: 70, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(130,200,255,0.13) 0%, transparent 70%)', filter: 'blur(14px)' }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Synchronized fish float */}
            {schoolFish.slice(0, 4).map((fish, i) => (
              <motion.div key={`med-${fish.id}-${i}`} className="absolute w-10 h-10"
                style={{ top: `${40 + (i % 2) * 12}%`, left: `${24 + i * 13}%` }}
                animate={{ y: [0, -5, 0, 5, 0], x: [0, 2, 0, -2, 0], scale: [1, 1.04, 1, 1.03, 1], opacity: [0.75, 1, 0.8, 1, 0.75] }}
                transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.28 }}>
                <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(130,200,255,0.45))' }} fallbackClassName="w-full h-full" />
              </motion.div>
            ))}
            {/* Zen bubbles */}
            {[0, 1, 2].map(k => (
              <motion.div key={`mzb-${k}`} className="absolute rounded-full pointer-events-none"
                style={{ width: 8 + k * 3, height: 8 + k * 3, left: `${33 + k * 13}%`, top: '40%',
                  border: '1px solid rgba(180,230,255,0.5)', background: 'rgba(180,230,255,0.06)' }}
                animate={{ y: [0, -28, -55], opacity: [0, 0.7, 0] }}
                transition={{ duration: 3 + k * 0.8, repeat: Infinity, delay: k * 1.1, ease: 'easeOut' }}
              />
            ))}
            <motion.div className="absolute text-[11px] tracking-[4px] text-cyan-200/55 font-light pointer-events-none"
              style={{ top: '26%', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
              animate={{ opacity: [0, 0.65, 0] }}
              transition={{ duration: 5, repeat: Infinity }}>✦ Z E N ✦</motion.div>
          </motion.div>
        )}

        {/* 👑 Dominance challenge — two dominant fish circle each other */}
        {showRareEvent === "dominance-challenge" && schoolFish.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10">
            {schoolFish.slice(0, 2).map((fish, i) => {
              const r = 40; const base = (i / 2) * Math.PI * 2;
              const xKf = Array.from({ length: 37 }, (_, k) => r * Math.cos(base + (k / 36) * Math.PI * 2));
              const yKf = Array.from({ length: 37 }, (_, k) => r * Math.sin(base + (k / 36) * Math.PI * 2) * 0.5);
              return (
                <motion.div key={`dom-${fish.id}-${i}`} className="absolute w-12 h-12"
                  style={{ top: "40%", left: "45%", translateX: "-50%", translateY: "-50%" }}
                  animate={{ x: xKf, y: yKf, scale: [1, 1.08, 1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                  <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain drop-shadow-xl" fallbackClassName="w-full h-full" />
                </motion.div>
              );
            })}
            <motion.div className="absolute top-[35%] left-1/2 -translate-x-1/2 text-xl pointer-events-none"
              animate={{ opacity: [0,1,0], scale:[0.8,1.3,0.8] }} transition={{ duration: 1.5, repeat: Infinity }}>👑</motion.div>
          </motion.div>
        )}

        {/* 🌌 Chorégraphie mystique — eau parfaite + nuit + 0 stress */}
        {showRareEvent === "choreography" && fishInTank.length >= 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10">
            {/* Halo central tournant */}
            <motion.div className="absolute" style={{ top: "45%", left: "50%", transform: "translate(-50%,-50%)" }}
              animate={{ rotate: [0, 360] }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }}>
              {[0,1,2,3,4,5].map(k => (
                <motion.div key={`halo-${k}`} className="absolute rounded-full"
                  style={{
                    width: 8, height: 8,
                    background: `hsla(${185 + k * 30},100%,75%,0.9)`,
                    top: `${Math.sin((k/6)*Math.PI*2) * 70}px`,
                    left: `${Math.cos((k/6)*Math.PI*2) * 70}px`,
                    filter: "blur(3px)",
                    boxShadow: `0 0 8px 3px hsla(${185 + k * 30},100%,75%,0.7)`,
                  }}
                  animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 1.5 + k * 0.2, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}
            </motion.div>
            {/* Poissons en ballet orbital */}
            {fishInTank.slice(0, 5).map((fish, i) => {
              const total = Math.min(fishInTank.length, 5);
              const r = 80 + i * 12;
              const startAngle = (i / total) * Math.PI * 2;
              const xKf = Array.from({ length: 37 }, (_, k) => r * Math.cos(startAngle + (k / 36) * Math.PI * 2));
              const yKf = Array.from({ length: 37 }, (_, k) => r * 0.45 * Math.sin(startAngle + (k / 36) * Math.PI * 2));
              return (
                <motion.div key={`cho-${fish.id}-${i}`} className="absolute w-10 h-10"
                  style={{ top: "48%", left: "50%", translateX: "-50%", translateY: "-50%",
                    filter: "drop-shadow(0 0 6px cyan)" }}
                  animate={{ x: xKf, y: yKf }}
                  transition={{ duration: 7 + i * 1.2, repeat: Infinity, ease: "linear" }}>
                  <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
                </motion.div>
              );
            })}
            {/* Étoiles scintillantes */}
            {choirStars.map((star, k) => (
              <motion.div key={`star-cho-${k}`} className="absolute rounded-full pointer-events-none"
                style={{ width: 3, height: 3, top: `${star.top}%`, left: `${star.left}%`,
                  background: "white", filter: "blur(0.5px)" }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                transition={{ duration: star.duration, repeat: Infinity, delay: star.delay }}
              />
            ))}
            <motion.div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 text-lg font-bold text-cyan-200 tracking-widest pointer-events-none"
              style={{ textShadow: "0 0 12px cyan" }}
              animate={{ opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              ✦ Ballet des Profondeurs ✦
            </motion.div>
          </motion.div>
        )}

        {/* ✨ Ballet luminescent — méduse + hippocampe synchronisés la nuit */}
        {showRareEvent === "luminous-ballet" && (() => {
          const jelly = fishInTank.find(f => f.id === "jellyfish");
          const seahorse = fishInTank.find(f => f.id === "seahorse");
          if (!jelly || !seahorse) return null;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-10">
              {/* Synchronized glow aura */}
              <motion.div className="absolute" style={{ top: "38%", left: "50%", transform: "translate(-50%,-50%)" }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <div style={{ width: 160, height: 80, borderRadius: "50%",
                  background: "radial-gradient(ellipse, rgba(0,255,220,0.18) 0%, transparent 70%)", filter: "blur(10px)" }} />
              </motion.div>
              {/* Jellyfish pulsing */}
              <motion.div className="absolute w-16 h-16"
                style={{ top: "30%", left: "38%" }}
                animate={{ y: [0, -18, 4, -12, 0], scale: [1, 1.12, 0.95, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <SafeImage src={jelly.image} mobileSrc={jelly.imageMobile} alt="" className="w-full h-full object-contain"
                  style={{ filter: "drop-shadow(0 0 10px cyan) brightness(1.3)" }} fallbackClassName="w-full h-full" />
              </motion.div>
              {/* Seahorse sync */}
              <motion.div className="absolute w-14 h-14"
                style={{ top: "32%", left: "56%" }}
                animate={{ y: [0, -14, 6, -10, 0], scale: [1, 1.08, 0.97, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}>
                <SafeImage src={seahorse.image} mobileSrc={seahorse.imageMobile} alt="" className="w-full h-full object-contain"
                  style={{ filter: "drop-shadow(0 0 8px #67e8f9) brightness(1.2)" }} fallbackClassName="w-full h-full" />
              </motion.div>
              {/* Sync flash pulses */}
              {[...Array(5)].map((_, k) => (
                <motion.div key={`lb-${k}`} className="absolute rounded-full pointer-events-none"
                  style={{ width: 6, height: 6, top: `${28 + k * 8}%`, left: `${35 + k * 7}%`,
                    background: "rgba(0,255,220,0.9)", filter: "blur(2px)" }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, delay: k * 0.18, ease: "easeInOut" }}
                />
              ))}
              <motion.div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 text-sm text-cyan-200 tracking-widest pointer-events-none"
                style={{ textShadow: "0 0 8px cyan" }}
                animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                ✨ Ballet Luminescent ✨
              </motion.div>
            </motion.div>
          );
        })()}

        {/* 🔵 Rotation circulaire — banc en cercle parfait, eau calme + soleil */}
        {showRareEvent === "circular-rotation" && fishInTank.length >= 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10">
            {fishInTank.slice(0, 7).map((fish, i) => {
              const total = Math.min(fishInTank.length, 7);
              const startAngle = (i / total) * Math.PI * 2;
              const radius = 65 + (i % 2) * 15;
              const xKf = Array.from({ length: 37 }, (_, k) => radius * Math.cos(startAngle + (k / 36) * Math.PI * 2));
              const yKf = Array.from({ length: 37 }, (_, k) => radius * 0.4 * Math.sin(startAngle + (k / 36) * Math.PI * 2));
              return (
                <motion.div key={`cr-${fish.id}-${i}`} className="absolute w-10 h-10"
                  style={{ top: "46%", left: "50%", translateX: "-50%", translateY: "-50%" }}
                  animate={{ x: xKf, y: yKf }}
                  transition={{ duration: 8 + i * 0.5, repeat: Infinity, ease: "linear" }}>
                  <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
                </motion.div>
              );
            })}
            {/* Centre lumineux */}
            <motion.div className="absolute pointer-events-none"
              style={{ top: "46%", left: "50%", transform: "translate(-50%,-50%)",
                width: 50, height: 25, borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(100,210,255,0.2) 0%, transparent 70%)", filter: "blur(8px)" }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}

        {/* 🌊 Migration nocturne — groupe lumineux traverse lentement */}
        {showRareEvent === "night-migration" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute pointer-events-none z-10" style={{ top: "30%", left: 0, right: 0 }}>
            <motion.div className="flex items-center gap-3"
              initial={{ x: "-15%" }}
              animate={{ x: ["−15%", "115%"] }}
              transition={{ duration: 11, ease: "linear" }}>
              {fishInTank.slice(0, 5).map((fish, i) => (
                <motion.div key={`nm-${fish.id}-${i}`} className="relative w-10 h-10"
                  style={{ filter: "drop-shadow(0 0 8px rgba(0,220,200,0.7)) brightness(1.2)" }}
                  animate={{ y: [-4 + i * 3, 4 - i * 3, -4 + i * 3] }}
                  transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}>
                  <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
                  {/* Traînée lumineuse */}
                  <motion.div className="absolute rounded-full pointer-events-none"
                    style={{ width: 18, height: 8, right: "100%", top: "50%", transform: "translateY(-50%)",
                      background: "linear-gradient(to left, rgba(0,220,200,0.5), transparent)", filter: "blur(2px)" }}
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {showRareEvent === "school" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute top-[34%] left-0 right-0 pointer-events-none z-10 overflow-visible"
          >
            <motion.div
              initial={{ x: schoolStartX }}
              animate={{ x: schoolEndX, y: [0, -12, 0, 8, 0] }}
              transition={{
                x: { duration: 7.2, ease: "linear" },
                y: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
              }}
              className="flex items-center gap-4"
            >
              {schoolFish.map((fish, i) => {
                const offset = i % 2 === 0 ? -10 : 10;
                const sizeClass = i % 3 === 0 ? "w-14 h-14" : "w-12 h-12";
                const bubbleSize = i % 3 === 0 ? 6 : i % 3 === 1 ? 4 : 5;
                const bubbleDelay = 0.6 + (i % 4) * 0.9;
                const bubbleDuration = 2.6 + (i % 3) * 0.4;
                const bubbleRepeatDelay = 3 + (i % 3) * 1.4;
                const bubbleSideStyle = schoolDirection === "right"
                  ? { left: -4, bottom: "30%" }
                  : { right: -4, bottom: "30%" };
                return (
                  <motion.div
                    key={`${fish.id}-${i}`}
                    className={`relative ${sizeClass}`}
                    initial={{ y: offset }}
                    animate={{
                      y: [offset, offset - 8, offset + 4, offset],
                      x: [0, 6, -4, 0],
                      rotate: [0, 3, -2, 0],
                      scale: [1, 1.02, 0.98, 1],
                    }}
                    transition={{ duration: 2.2, delay: i * 0.12, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <motion.div style={{ scaleX: schoolDirection === "right" ? 1 : -1 }}>
                      <SafeImage
                        src={fish.image}
                        mobileSrc={fish.imageMobile}
                        alt=""
                        className="w-full h-full object-contain drop-shadow-2xl"
                        fallbackClassName="w-full h-full"
                      />
                    </motion.div>
                    <motion.span
                      className="absolute rounded-full bg-white/20 border border-white/30"
                      style={{ width: bubbleSize, height: bubbleSize, ...bubbleSideStyle }}
                      initial={{ opacity: 0, y: 0, scale: 0.6 }}
                      animate={{ opacity: [0, 0.6, 0], y: [0, -90, -140], scale: [0.6, 1, 1.1] }}
                      transition={{
                        duration: bubbleDuration,
                        delay: bubbleDelay,
                        repeat: Infinity,
                        repeatDelay: bubbleRepeatDelay,
                        ease: "easeOut",
                      }}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {/* 🌀 Spirale duo — deux poissons se spiralisent autour d'un centre */}
        {showRareEvent === "spiral-duo" && fishInTank.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute pointer-events-none z-10" style={{ top: "28%", left: "33%", width: 140, height: 140 }}>
            {/* Central glow core */}
            <motion.div className="absolute rounded-full pointer-events-none"
              style={{ width: 28, height: 28, top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                background: 'radial-gradient(circle, rgba(130,210,255,0.5) 0%, transparent 70%)', filter: 'blur(6px)' }}
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0.85, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            {fishInTank.slice(0, 2).map((fish, k) => {
              const r = 44 + k * 10;
              const xKf = Array.from({ length: 37 }, (_, j) => r * Math.cos((k * Math.PI) + (j / 36) * Math.PI * 2));
              const yKf = Array.from({ length: 37 }, (_, j) => r * 0.55 * Math.sin((k * Math.PI) + (j / 36) * Math.PI * 2));
              return (
                <motion.div key={`sd-${fish.id}`} className="absolute w-10 h-10 pointer-events-none"
                  style={{ top: '50%', left: '50%', marginLeft: -20, marginTop: -20 }}
                  animate={{ x: xKf, y: yKf }}
                  transition={{ duration: 5 + k * 1.2, repeat: Infinity, ease: 'linear' }}>
                  <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain"
                    style={{ filter: `drop-shadow(0 0 ${6 + k * 3}px rgba(100,200,255,${0.6 + k * 0.2}))` }} fallbackClassName="w-full h-full" />
                  {/* Bubble trail behind each fish */}
                  {[0, 1, 2].map(b => (
                    <motion.div key={`sdb-${b}`} className="absolute rounded-full pointer-events-none"
                      style={{ width: 4 - b, height: 4 - b, background: 'rgba(180,230,255,0.7)',
                        top: '50%', left: '-4px', transform: 'translateY(-50%)' }}
                      animate={{ opacity: [0, 0.7, 0], scale: [0.4, 1, 1.6] }}
                      transition={{ duration: 0.8, delay: b * 0.18, repeat: Infinity, ease: 'easeOut' }}
                    />
                  ))}
                </motion.div>
              );
            })}
            {/* Spiral orbit path hint */}
            <motion.div className="absolute rounded-full pointer-events-none"
              style={{ width: 110, height: 62, top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                border: '1px solid rgba(130,200,255,0.15)' }}
              animate={{ opacity: [0.1, 0.4, 0.1], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}

        {/* �️ Cache-cache — phase 1: A se fige / phase 2: B se cache / phase 3: A cherche + B pointe la tête */}
        {showRareEvent === "hide-seek" && fishInTank.length >= 2 && (() => {
          const seeker = fishInTank[0]!;
          const hider = fishInTank[1]!;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-10">
              {/* Fish A (seeker) — freezes, then searches with erratic movement */}
              <motion.div className="absolute w-11 h-11"
                style={{ top: "42%", left: "42%" }}
                animate={{
                  x: [0, 0, 0, -18, 25, -30, 16, 0],
                  y: [0, 0, 0, -10, 8, -14, 5, 0],
                  opacity: [1, 0.6, 0.6, 1, 1, 1, 1, 1],
                }}
                transition={{ duration: 7, times: [0, 0.12, 0.25, 0.4, 0.55, 0.7, 0.85, 1], ease: "easeInOut" }}>
                <SafeImage src={seeker.image} mobileSrc={seeker.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
                {/* Question mark during search */}
                <motion.div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs pointer-events-none"
                  animate={{ opacity: [0, 0, 0, 0, 1, 1, 0.5, 0] }}
                  transition={{ duration: 7, times: [0, 0.12, 0.25, 0.4, 0.55, 0.7, 0.85, 1] }}>❓</motion.div>
              </motion.div>

              {/* Fish B (hider) — darts behind rock at right edge, then peeks nose only */}
              <motion.div className="absolute w-10 h-10"
                style={{ top: "46%", right: 0 }}
                animate={{
                  x: [0, "100%", "100%", "88%", "92%", "88%", "100%"],
                  opacity: [1, 1, 1, 1, 1, 1, 0],
                }}
                transition={{ duration: 7, times: [0, 0.28, 0.46, 0.60, 0.70, 0.80, 1], ease: "easeInOut" }}>
                <SafeImage src={hider.image} mobileSrc={hider.imageMobile} alt="" className="w-full h-full object-contain" style={{ scaleX: -1 }} fallbackClassName="w-full h-full" />
                {/* Dark edge gives impression fish is behind a rock */}
                <div className="absolute left-0 top-0 bottom-0 w-3 pointer-events-none"
                  style={{ background: 'linear-gradient(to right, rgba(38,42,54,0.8) 0%, transparent 100%)' }} />
              </motion.div>
              {/* Rock shadow framing the peek — fixed right strip */}
              <div className="absolute right-0 top-0 bottom-0 w-9 pointer-events-none"
                style={{ background: 'linear-gradient(to left, rgba(28,32,44,0.65) 0%, transparent 100%)' }} />

              {/* Bubble explosion when found (end of event) */}
              {[0,1,2,3,4].map(b => (
                <motion.div key={`hs-b-${b}`} className="absolute w-2 h-2 rounded-full pointer-events-none"
                  style={{ background: 'rgba(180,230,255,0.8)', top: '47%', right: '2%' }}
                  animate={{ x: [0, (b - 2) * 20], y: [0, -(15 + b * 8)], opacity: [0, 0.9, 0], scale: [0.5, 1.2, 0.3] }}
                  transition={{ duration: 0.7, delay: 4.8 + b * 0.06, ease: 'easeOut' }}
                />
              ))}
            </motion.div>
          );
        })()}

        {/* ⚡ Vague de banc — leader dash + cascade domino décalée */}
        {showRareEvent === "wave-effect" && fishInTank.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute pointer-events-none z-10" style={{ top: "38%", left: 0, right: 0, height: 70 }}>
            {fishInTank.slice(0, 6).map((fish, k) => {
              const isLeader = k === 0;
              return (
                <motion.div key={`we-${fish.id}-${k}`} className="absolute"
                  style={{ width: isLeader ? 48 : 40, height: isLeader ? 48 : 40, top: isLeader ? 0 : 8, left: `${8 + k * 16}%` }}
                  animate={{
                    y: [0, isLeader ? -30 : -18, 0, isLeader ? -22 : -12, 0],
                    scale: [1, isLeader ? 1.15 : 1.05, 1, 1.04, 1],
                  }}
                  transition={{ duration: 2.4, delay: k * 0.18, repeat: Infinity, ease: "easeInOut" }}>
                  <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain"
                    style={isLeader ? { filter: "drop-shadow(0 0 5px rgba(130,200,255,0.7))" } : {}}
                    fallbackClassName="w-full h-full" />
                  {/* Leader gets speed streaks */}
                  {isLeader && [0,1].map(s => (
                    <motion.div key={`we-s-${s}`} className="absolute h-px pointer-events-none"
                      style={{ width: 12+s*5, right: '105%', top: `${42+s*14}%`, background: 'rgba(180,220,255,0.6)' }}
                      animate={{ opacity: [0, 0.9, 0], scaleX: [0, 1, 1.3] }}
                      transition={{ duration: 0.4, delay: s * 0.08, repeat: Infinity, repeatDelay: 2, ease: 'easeOut' }}
                    />
                  ))}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* 🃏 Farceur — poisson fonce puis s'échappe */}
        {showRareEvent === "trickster" && fishInTank.length >= 2 && (() => {
          const tricksterIdx = fishPersonalities.findIndex(p => p.trait === 'playful');
          const trickster = tricksterIdx >= 0 ? fishInTank[tricksterIdx]! : fishInTank[0]!;
          const target = fishInTank.find(f => f !== trickster) ?? fishInTank[1]!;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-10">
              <motion.div className="absolute w-10 h-10" style={{ top: '42%', left: '60%' }}
                animate={{ x: [0, 0, 0, -9, 7, -4, 0], rotate: [0, 0, 0, -12, 9, -5, 0] }}
                transition={{ duration: 3.5, ease: 'easeInOut' }}>
                <SafeImage src={target.image} mobileSrc={target.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
                <motion.div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs pointer-events-none"
                  animate={{ opacity: [0, 0, 0, 0, 1, 0.6, 0] }}
                  transition={{ duration: 3.5 }}>!!</motion.div>
              </motion.div>
              <motion.div className="absolute w-11 h-11" style={{ top: '43%', left: '14%' }}
                animate={{ x: [0, 80, 108, 108, 38, -20], y: [0, 8, 3, 3, -28, -42], scale: [1, 1, 1.1, 1.1, 1, 1], opacity: [1, 1, 1, 1, 1, 0] }}
                transition={{ duration: 4.2, times: [0, 0.32, 0.46, 0.56, 0.76, 1], ease: 'easeInOut' }}>
                <SafeImage src={trickster.image} mobileSrc={trickster.imageMobile} alt="" className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(255,180,100,0.7))' }} fallbackClassName="w-full h-full" />
                {[0, 1].map(b => (
                  <motion.div key={`tr-b-${b}`} className="absolute rounded-full pointer-events-none"
                    style={{ width: 4 - b, height: 4 - b, background: 'rgba(200,230,255,0.8)', left: '-5px', top: '50%', transform: 'translateY(-50%)' }}
                    animate={{ opacity: [0, 0.8, 0], x: [0, -10], y: [0, b === 0 ? -4 : 4] }}
                    transition={{ duration: 0.36, delay: 0.32 + b * 0.1, repeat: 4, repeatDelay: 0.44, ease: 'easeOut' }}
                  />
                ))}
              </motion.div>
              <motion.div className="absolute pointer-events-none"
                style={{ bottom: '14%', left: '6%', width: 44, height: 22, background: 'radial-gradient(ellipse, rgba(80,55,38,0.4) 0%, transparent 70%)', borderRadius: '50%' }}
                animate={{ opacity: [0, 0, 0, 0, 0.75, 0] }}
                transition={{ duration: 4.2, ease: 'easeOut' }}
              />
            </motion.div>
          );
        })()}

        {/* 🪸 Jeu du décor — poisson tourne autour d'un coral */}
        {showRareEvent === "decor-play" && fishInTank.length >= 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute pointer-events-none z-10" style={{ bottom: "13%", left: "7%", width: 110, height: 110 }}>
            {/* Coral glow */}
            <motion.div className="absolute pointer-events-none"
              style={{ bottom: 4, left: '50%', transform: 'translateX(-50%)', width: 44, height: 22,
                background: 'radial-gradient(ellipse, rgba(255,145,110,0.32) 0%, transparent 70%)', filter: 'blur(4px)' }}
              animate={{ opacity: [0.4, 0.9, 0.4], scale: [1, 1.2, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Fish A — orbits coral */}
            <motion.div className="absolute w-10 h-10"
              style={{ top: '50%', left: '50%', marginLeft: -20, marginTop: -20 }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}>
              <motion.div style={{ x: 38, transformOrigin: '-38px center' }}>
                <SafeImage src={fishInTank[0]!.image} mobileSrc={fishInTank[0]!.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
              </motion.div>
            </motion.div>
            {/* Fish B — sweeps through arch */}
            {fishInTank.length >= 2 && (
              <motion.div className="absolute w-9 h-9" style={{ bottom: '2%' }}
                animate={{ x: [-55, 125], y: [0, -6, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}>
                <SafeImage src={fishInTank[1]!.image} mobileSrc={fishInTank[1]!.imageMobile} alt="" className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 0 3px rgba(180,230,255,0.55))' }} fallbackClassName="w-full h-full" />
              </motion.div>
            )}
            {/* Checkpoint sparkle */}
            <motion.div className="absolute text-[9px] pointer-events-none" style={{ top: '14%', left: '64%' }}
              animate={{ opacity: [0, 1, 0], scale: [0.7, 1.4, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}>✦</motion.div>
          </motion.div>
        )}

        {/* 🌊 Dérive de courant — poissons flottent avec le flux */}
        {showRareEvent === "current-drift" && fishInTank.length >= 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute pointer-events-none z-10" style={{ top: "35%", left: 0, right: 0 }}>
            <motion.div className="flex items-center gap-6"
              animate={{ x: currentAngle === 0 ? ["-5%", "110%"] : ["110%", "-5%"] }}
              transition={{ duration: 8, ease: "linear" }}>
              {fishInTank.slice(0, 3).map((fish, k) => (
                <motion.div key={`cd-${fish.id}-${k}`} className="relative w-10 h-10"
                  style={{ scaleX: currentAngle === 0 ? 1 : -1 }}
                  animate={{ y: [-4 + k * 4, 4 - k * 3, -4 + k * 4] }}
                  transition={{ duration: 2 + k * 0.4, repeat: Infinity, ease: "easeInOut" }}>
                  <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* 🍼 Apprentissage de nage — adulte nage lentement, bébé suit en corrigeant sa trajectoire */}
        {showRareEvent === "swim-lesson" && fishInTank.length >= 2 && (() => {
          const babyFishId = fishInstances.find(fi => fi.isBaby)?.fishId;
          const baby = babyFishId ? fishInTank.find(f => f.id === babyFishId) : fishInTank[fishInTank.length - 1];
          const adult = fishInTank.find(f => f !== baby) ?? fishInTank[0];
          if (!baby || !adult) return null;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute pointer-events-none z-10" style={{ top: "36%", left: "8%", width: "78%" }}>
              {/* Adult — steady slow undulating path */}
              <motion.div className="absolute w-12 h-12"
                animate={{ x: [0, 55, 110, 165, 110, 55, 0], y: [0, -8, 3, -5, 8, -2, 0] }}
                transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}>
                <SafeImage src={adult.image} mobileSrc={adult.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
              </motion.div>
              {/* Baby — follows with a wobble and slight positional lag */}
              <motion.div className="absolute w-8 h-8" style={{ top: "18px" }}
                animate={{ x: [-20, 35, 85, 138, 85, 35, -20], y: [4, -2, 10, 2, 14, 4, 4] }}
                transition={{ duration: 9, ease: "easeInOut", repeat: Infinity, delay: 0.55 }}>
                <SafeImage src={baby.image} mobileSrc={baby.imageMobile} alt="" className="w-full h-full object-contain"
                  style={{ filter: "drop-shadow(0 0 4px rgba(150,220,255,0.8))" }} fallbackClassName="w-full h-full" />
                {/* Baby correction bubble */}
                <motion.div className="absolute w-2 h-2 rounded-full bg-white/40 pointer-events-none"
                  style={{ top: "15%", right: "-5px" }}
                  animate={{ opacity: [0, 0.8, 0], y: [0, -14, -22], scale: [0.4, 1, 1.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.9, ease: "easeOut" }}
                />
              </motion.div>
              {/* Sparkle connecting adult and baby */}
              <motion.div className="absolute text-[10px] pointer-events-none"
                style={{ left: "25%", top: "-4px" }}
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8], y: [0, -5, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>✨</motion.div>
            </motion.div>
          );
        })()}

        {/* 🫧 Jeu des bulles — poisson crée des bulles, bébé les chasse en zigzag */}
        {showRareEvent === "bubble-game" && (() => {
          const babyFishId = fishInstances.find(fi => fi.isBaby)?.fishId;
          const baby = babyFishId ? fishInTank.find(f => f.id === babyFishId) : fishInTank[0];
          const creator = fishInTank.find(f => f !== baby) ?? fishInTank[0];
          if (!baby || !creator) return null;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-10">
              {/* Bubble creator bobbing at bottom-left */}
              <motion.div className="absolute w-11 h-11" style={{ bottom: "28%", left: "22%" }}
                animate={{ y: [0, -6, 0, -4, 0], scale: [1, 1.05, 0.97, 1.03, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <SafeImage src={creator.image} mobileSrc={creator.imageMobile} alt="" className="w-full h-full object-contain" fallbackClassName="w-full h-full" />
              </motion.div>
              {/* Ascending bubbles */}
              {[0, 1, 2].map(k => (
                <motion.div key={`bgb-${k}`} className="absolute rounded-full pointer-events-none"
                  style={{ width: `${13 + k * 4}px`, height: `${13 + k * 4}px`,
                    left: `${20 + k * 8}%`,
                    border: "1.5px solid rgba(180,230,255,0.75)", background: "rgba(180,230,255,0.1)" }}
                  initial={{ bottom: "34%", opacity: 0 }}
                  animate={{ bottom: [`34%`, `${52 + k * 6}%`], opacity: [0, 0.85, 0.6, 0], x: [0, k % 2 === 0 ? 8 : -8, 0] }}
                  transition={{ duration: 3.5 + k * 0.6, repeat: Infinity, ease: "easeOut", delay: k * 1.0 }}
                />
              ))}
              {/* Baby chasing bubbles in zigzag */}
              <motion.div className="absolute w-8 h-8" style={{ bottom: "34%", left: "18%" }}
                animate={{ x: [0, 55, 25, 95, 45, 0], y: [0, -28, -10, -55, -22, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                <SafeImage src={baby.image} mobileSrc={baby.imageMobile} alt="" className="w-full h-full object-contain"
                  style={{ filter: "drop-shadow(0 0 5px rgba(150,210,255,0.9))" }} fallbackClassName="w-full h-full" />
              </motion.div>
              {/* Pop when baby "reaches" a bubble */}
              <motion.div className="absolute pointer-events-none rounded-full"
                style={{ bottom: "52%", left: "38%", width: 16, height: 16,
                  border: "2px solid rgba(150,220,255,0.9)", background: "rgba(180,240,255,0.25)" }}
                animate={{ opacity: [0, 0, 1, 0], scale: [0.6, 0.6, 2.2, 3] }}
                transition={{ duration: 0.5, delay: 2.2, repeat: Infinity, repeatDelay: 5.5, ease: "easeOut" }}
              />
            </motion.div>
          );
        })()}

        {/* 👑 Défi amical — deux dominants face à face : gonflage, standoff, l'un cède */}
        {showRareEvent === "friendly-challenge" && fishInTank.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10">
            {/* Fish A — left, advances, puffs up */}
            <motion.div className="absolute w-12 h-12" style={{ top: "41%", left: "20%" }}
              animate={{ x: [0, 44, 38, 32, 0], scale: [1, 1.02, 1.1, 1.07, 1] }}
              transition={{ duration: 5, ease: "easeInOut" }}>
              <SafeImage src={fishInTank[0]!.image} mobileSrc={fishInTank[0]!.imageMobile} alt="" className="w-full h-full object-contain drop-shadow-xl" fallbackClassName="w-full h-full" />
            </motion.div>
            {/* Fish B — right, advances, then retreats */}
            <motion.div className="absolute w-12 h-12" style={{ top: "41%", left: "60%" }}
              animate={{ x: [0, -34, -28, -20, 18], scale: [1, 1.02, 1.07, 1.04, 0.94] }}
              transition={{ duration: 5, ease: "easeInOut" }}>
              <SafeImage src={fishInTank[1]!.image} mobileSrc={fishInTank[1]!.imageMobile} alt="" className="w-full h-full object-contain drop-shadow-xl" style={{ scaleX: -1 }} fallbackClassName="w-full h-full" />
            </motion.div>
            {/* Crown float during standoff */}
            <motion.div className="absolute top-[34%] left-1/2 -translate-x-1/2 text-base pointer-events-none"
              animate={{ opacity: [0, 0, 1, 0.8, 0.8, 0], scale: [0.7, 0.9, 1.3, 1.1, 1.1, 0.7] }}
              transition={{ duration: 5 }}>👑</motion.div>
            {/* Tension bubbles at collision zone */}
            {[0, 1, 2].map(k => (
              <motion.div key={`fc-b-${k}`} className="absolute rounded-full bg-white/25 border border-white/35"
                style={{ width: 5 + k * 2, height: 5 + k * 2, top: `${44 + k * 3}%`, left: `${44 + k * 5}%` }}
                animate={{ opacity: [0, 0.8, 0], y: [0, -18 - k * 6], scale: [0.5, 1, 1.6] }}
                transition={{ duration: 1.6, delay: 1.5 + k * 0.28, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        )}

        {/* 🏁 Défi territorial — poisson territorial se gonfle et fait un dash pour chasser l'intrus */}
        {showRareEvent === "territory-dash" && fishInTank.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10">
            {/* Zone glow */}
            <motion.div className="absolute pointer-events-none"
              style={{ top: "36%", left: "8%", width: "35%", height: "25%",
                background: "radial-gradient(ellipse, rgba(255,175,50,0.15) 0%, transparent 70%)", borderRadius: "50%" }}
              animate={{ opacity: [0, 1, 0.6, 0] }}
              transition={{ duration: 2.5, ease: "easeOut" }}
            />
            {/* Intruder drifting in from the right */}
            <motion.div className="absolute w-10 h-10" style={{ top: "44%", left: "55%" }}
              animate={{ x: [-10, -50, -100], opacity: [1, 1, 0.5] }}
              transition={{ duration: 2.2, delay: 1.5, ease: "easeIn" }}>
              <SafeImage src={fishInTank[0]!.image} mobileSrc={fishInTank[0]!.imageMobile} alt="" className="w-full h-full object-contain opacity-80" style={{ scaleX: -1 }} fallbackClassName="w-full h-full" />
            </motion.div>
            {/* Territorial fish — puffs up then DASHES across */}
            <motion.div className="absolute w-12 h-12" style={{ top: "42%", left: "14%" }}
              animate={{ x: [0, 0, 5, 125, 90, 22, 0], y: [0, 0, -3, 0, 3, 0, 0], scale: [1, 1.12, 1.18, 1, 1, 1, 1] }}
              transition={{ duration: 4.2, times: [0, 0.20, 0.32, 0.50, 0.65, 0.82, 1], ease: "easeInOut" }}>
              <SafeImage src={fishInTank[1]!.image} mobileSrc={fishInTank[1]!.imageMobile} alt="" className="w-full h-full object-contain drop-shadow-xl" fallbackClassName="w-full h-full" />
              {/* Speed-line streaks on dash */}
              {[0, 1, 2].map(k => (
                <motion.div key={`td-sl-${k}`} className="absolute h-px pointer-events-none"
                  style={{ width: `${16 + k * 6}px`, right: "100%", top: `${35 + k * 14}%`, background: "rgba(180,220,255,0.65)" }}
                  animate={{ opacity: [0, 0.9, 0], scaleX: [0, 1, 1.3] }}
                  transition={{ duration: 0.28, delay: 1.35 + k * 0.05, ease: "easeOut" }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* 🫧 Course aux bulles géantes — grosse bulle monte, 2 poissons font la course */}
        {showRareEvent === "giant-bubble-race" && fishInTank.length >= 2 && (() => {
          const racers = fishInTank.slice(0, 2);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-10">
              {/* Big rising bubble */}
              <motion.div className="absolute pointer-events-none rounded-full"
                style={{ width: 68, height: 68, bottom: '8%', left: '46%',
                  border: '2.5px solid rgba(160,225,255,0.7)', background: 'rgba(160,225,255,0.07)',
                  boxShadow: 'inset 0 0 18px rgba(160,225,255,0.3)' }}
                animate={{ y: [0, -180, -320], opacity: [0, 1, 1, 0], scale: [0.6, 1, 1.1, 1.5] }}
                transition={{ duration: 5, ease: 'easeOut' }}>
                {/* Bubble shine */}
                <div className="absolute w-3 h-2 rounded-full bg-white/40" style={{ top: '18%', left: '22%', transform: 'rotate(-30deg)', filter: 'blur(1px)' }} />
              </motion.div>
              {/* Racer A — dashes up from left */}
              <motion.div className="absolute w-11 h-11" style={{ bottom: '12%', left: '28%' }}
                animate={{ x: [0, 18, 40], y: [0, -100, -220], scale: [1, 1.05, 0.95] }}
                transition={{ duration: 4.5, ease: 'easeInOut' }}>
                <SafeImage src={racers[0]!.image} mobileSrc={racers[0]!.imageMobile} alt="" className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(100,200,255,0.6))' }} fallbackClassName="w-full h-full" />
              </motion.div>
              {/* Racer B — dashes up from right */}
              <motion.div className="absolute w-11 h-11" style={{ bottom: '12%', right: '28%' }}
                animate={{ x: [0, -18, -38], y: [0, -85, -205], scale: [1, 1.05, 0.95] }}
                transition={{ duration: 4.8, ease: 'easeInOut' }}>
                <SafeImage src={racers[1]!.image} mobileSrc={racers[1]!.imageMobile} alt="" className="w-full h-full object-contain"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(200,160,255,0.6))' }} fallbackClassName="w-full h-full" />
              </motion.div>
              {/* Pop effect */}
              {[0,1,2,3,4,5].map(k => (
                <motion.div key={`gbr-p-${k}`} className="absolute rounded-full pointer-events-none"
                  style={{ width: 6, height: 6, bottom: '50%', left: '47%', background: 'rgba(180,230,255,0.8)' }}
                  animate={{ x: [0, Math.cos((k/6)*Math.PI*2) * 30], y: [0, Math.sin((k/6)*Math.PI*2) * 30], opacity: [0, 0, 1, 0], scale: [0.5, 0.5, 1.5, 0] }}
                  transition={{ duration: 0.5, delay: 4.6 + k * 0.04, ease: 'easeOut' }}
                />
              ))}
            </motion.div>
          );
        })()}

        {/* � Comportement émergent — groupe playful invente trajectoire, change de leader */}
        {showRareEvent === "emergent-group" && (() => {
          const playfulFish = fishInTank.filter((_f, idx) =>
            fishPersonalities[idx]?.trait === "playful" || fishPersonalities[idx]?.trait === "curious"
          ).slice(0, 3);
          if (playfulFish.length < 2) return null;
          // 3 waypoint columns (probabilistic, leader shifts every 4s via animation delay)
          const paths = [
            { x: ["8%","55%","80%","35%","8%"],  y: ["42%","28%","50%","62%","42%"] },
            { x: ["15%","60%","72%","28%","15%"], y: ["52%","35%","44%","55%","52%"] },
            { x: ["22%","48%","85%","40%","22%"], y: ["46%","40%","56%","48%","46%"] },
          ];
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-10">
              {playfulFish.map((fish, k) => {
                const path = paths[k % paths.length]!;
                const isLeader = k === 0;
                return (
                  <motion.div key={`eg-${fish.id}-${k}`}
                    className="absolute pointer-events-none"
                    style={{ width: isLeader ? 44 : 36, height: isLeader ? 44 : 36, left: 0, top: 0 }}
                    animate={{ left: path.x, top: path.y }}
                    transition={{ duration: isLeader ? 9 : 9.5 + k * 0.4, ease: "easeInOut", repeat: Infinity, delay: k * 1.4 }}>
                    <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt=""
                      className="w-full h-full object-contain"
                      style={{ filter: isLeader
                        ? "drop-shadow(0 0 6px rgba(130,220,255,0.85))"
                        : `drop-shadow(0 0 3px rgba(130,220,255,${0.4 + k * 0.15}))` }}
                      fallbackClassName="w-full h-full" />
                    {/* Leader crown flash when it takes point after lap */}
                    {isLeader && (
                      <motion.div className="absolute text-[10px] pointer-events-none select-none"
                        style={{ top: "-14px", left: "50%", transform: "translateX(-50%)" }}
                        animate={{ opacity: [0, 1, 1, 0], y: [0, -3, -3, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 7.8, ease: "easeInOut" }}>👑</motion.div>
                    )}
                    {/* Sparkle trail for each fish */}
                    <motion.div className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                      style={{ background: `rgba(${isLeader ? '100,220,255' : '180,210,255'},0.8)`, left: "-5px", top: "50%", transform: "translateY(-50%)" }}
                      animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.4, 0.5] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: k * 0.22, ease: "easeOut" }}
                    />
                  </motion.div>
                );
              })}
              {/* Trajectory hint dots — 4 faint waypoint markers */}
              {["30%","55%","70%","42%"].map((lx, k) => (
                <motion.div key={`eg-wp-${k}`} className="absolute rounded-full pointer-events-none"
                  style={{ width: 5, height: 5, left: lx, top: ["38%","26%","50%","60%"][k],
                    background: "rgba(120,210,255,0.35)", boxShadow: "0 0 5px rgba(120,210,255,0.4)" }}
                  animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.3, 0.5] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: k * 2.1, ease: "easeInOut" }}
                />
              ))}
            </motion.div>
          );
        })()}

        {/* �👆 Suis le doigt — 2-3 poissons joueurs suivent le curseur lentement */}
        {isFollowActive && fingerPos && fishInTank.length >= 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 pointer-events-none z-10">
            {fishInTank.slice(0, 3).map((fish, k) => (
              <motion.div key={`ff-${fish.id}-${k}`}
                className="absolute w-10 h-10"
                style={{ left: 0, top: 0 }}
                animate={{
                  x: `calc(${fingerPos.x}% - ${20 + k * 6}px + ${(k - 1) * 18}px)`,
                  y: `calc(${fingerPos.y}% - 20px + ${(k - 1) * 14}px)`,
                }}
                transition={{ type: 'spring', stiffness: 40 - k * 6, damping: 10 + k * 2 }}>
                <SafeImage src={fish.image} mobileSrc={fish.imageMobile} alt="" className="w-full h-full object-contain"
                  style={{ filter: `drop-shadow(0 0 ${4 + k}px rgba(120,210,255,0.6))` }} fallbackClassName="w-full h-full" />
                {/* Subtle sparkle trail */}
                <motion.div className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
                  style={{ background: 'rgba(200,240,255,0.8)', left: '-4px', top: '50%', transform: 'translateY(-50%)' }}
                  animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.2, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: k * 0.2, ease: 'easeOut' }}
                />
              </motion.div>
            ))}
            {/* Finger target ring */}
            <motion.div className="absolute rounded-full pointer-events-none"
              style={{ width: 24, height: 24,
                left: `calc(${fingerPos.x}% - 12px)`,
                top: `calc(${fingerPos.y}% - 12px)`,
                border: '1.5px solid rgba(180,230,255,0.55)', background: 'rgba(180,230,255,0.06)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* UI layer */}
      <div className="relative z-20 pointer-events-none flex-shrink-0 w-full">
            {/* Top bar header */}
            <div className="relative z-20 px-5 pt-6 pb-3 pointer-events-auto">
              <div className="glass-nav rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[11px] text-foreground/50 font-medium">Bonjour, {userName} 👋</p>
                  <button 
                    onClick={() => setShowAquariumPicker(true)}
                    className="text-sm font-bold text-foreground flex items-center gap-1.5"
                  >
                    {theme.name}
                    <span className="text-foreground/30 text-xs">▾</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[9px] text-foreground/40 font-semibold uppercase">Niv. {level}</p>
                    <div className="w-16 h-1 rounded-full bg-foreground/10 mt-0.5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <div className="h-6 w-px bg-foreground/10" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">🪙</span>
                    <span className="text-sm font-bold text-gold">{gold}</span>
                  </div>
                  <div className="h-6 w-px bg-foreground/10" />
                  <button
                    onClick={() => setShowSettings(true)}
                    className="text-foreground/50 hover:text-foreground transition-colors text-base"
                  >⚙️</button>
                </div>
                </div>

                {/* All widgets in one horizontal line */}
                <div className="mt-3 pt-3 border-t border-foreground/10 flex items-center justify-between gap-2">
                {/* Temperature */}
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-8 rounded-full bg-gradient-to-t from-red-500 via-orange-400 to-blue-400 relative overflow-hidden">
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 bg-background/60"
                      animate={{ height: ["20%", "30%", "20%"] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">Temp</p>
                    <p className="text-xs font-bold text-foreground">{dynamicTemp}°C</p>
                  </div>
                </div>

                <div className="h-6 w-px bg-foreground/10" />

                {/* Feed button */}
                <button
                  aria-label="Nourrir les poissons"
                  onClick={() => {
                    setFeedingActive(true);
                    incrementFeedCount();
                  }}
                  disabled={feedingActive || feedCooldown}
                  className="flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="text-base">🍴</span>
                  <div>
                    <p className="text-[9px] text-muted-foreground">Action</p>
                    <p className="text-xs font-bold text-foreground">Nourrir</p>
                  </div>
                </button>

                <div className="h-6 w-px bg-foreground/10" />

                {/* Health */}
                <div className="flex items-center gap-1.5">
                  <div className="text-base">{waterQuality.health >= 90 ? '💚' : waterQuality.health >= 70 ? '💛' : '❤️'}</div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">Santé</p>
                    <p className={`text-xs font-bold ${waterQuality.health >= 90 ? 'text-green-400' : waterQuality.health >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {waterQuality.health}%
                    </p>
                  </div>
                </div>

                <div className="h-6 w-px bg-foreground/10" />

                {/* Water quality */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1">
                      <p className="text-[8px] text-muted-foreground">pH:</p>
                      <p className="text-[10px] font-bold text-foreground">{waterQuality.ph.toFixed(1)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <p className="text-[8px] text-muted-foreground">NO₃:</p>
                      <p className={`text-[10px] font-bold ${waterQuality.nitrates > 25 ? 'text-orange-400' : 'text-green-400'}`}>
                        {Math.round(waterQuality.nitrates)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-6 w-px bg-foreground/10" />

                {/* Water filter widget */}
                <div className="flex items-center gap-1.5">
                  <div className="relative w-3 h-8 rounded-full border border-foreground/20 overflow-hidden" style={{ background: filterBroken ? 'rgba(255,100,50,0.15)' : 'rgba(100,200,255,0.10)' }}>
                    {/* Rising bubbles inside filter tube */}
                    {!filterBroken && [0,1,2].map(b => (
                      <motion.div
                        key={`fb-${b}`}
                        className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-300/70"
                        animate={{ y: [28, -4], opacity: [0, 0.8, 0] }}
                        transition={{ duration: 1.2, delay: b * 0.4, repeat: Infinity, ease: "easeOut" }}
                      />
                    ))}
                    {filterBroken && (
                      <motion.div
                        className="absolute inset-0 bg-red-500/30"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">Filtre</p>
                    {filterBroken ? (
                      <button
                        onClick={() => {
                          if (gold >= 20) {
                            setFilterBroken(false);
                            spendGold(20);
                          }
                        }}
                        className="text-[9px] font-bold text-orange-400 leading-tight"
                      >
                        ⚠️ Réparer<br/><span className="text-[8px] text-foreground/40">-20🪙</span>
                      </button>
                    ) : (
                      <p className="text-xs font-bold text-blue-400">✓ OK</p>
                    )}
                    <p className="text-[8px] text-foreground/40 mt-0.5">{fishInTank.length}/{MAX_FISH_PER_AQUARIUM}🐟</p>
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Welcome message */}
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative z-20 px-5 mb-2"
                >
                  <div className="glass-nav rounded-xl px-4 py-2.5 text-center">
                    <p className="text-xs text-foreground/70">Bienvenue. Ton aquarium t'attend. 🐠</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Aquarium rank & score badge — tap to expand breakdown */}
          <motion.div className="relative z-20 px-5 mb-1 pointer-events-auto"
            animate={{ opacity: deepNightMode ? 0 : 1 }}
            transition={{ duration: 2 }}
          >
          <motion.button
              className="w-full glass-nav rounded-xl px-3 py-1.5 flex items-center justify-between"
              onClick={() => setShowScoreBreakdown(v => !v)}
            >
              <span className="text-[10px] text-foreground/60 font-medium">{aquariumRank}</span>
              <div className="flex items-center gap-1">
                <div className="w-16 h-1 rounded-full bg-foreground/10 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${aquariumScore}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
                </div>
                <span className="text-[10px] text-accent font-bold">{aquariumScore}</span>
              </div>
              <span className="text-[10px] text-foreground/40">
                {tankMood === "calm" ? "🌊 Calme" : tankMood === "balanced" ? "⚖️ Équilibré" : tankMood === "stressed" ? "⚠️ Stressé" : "🔴 Chaotique"}
              </span>
            </motion.button>
            <AnimatePresence>
              {showScoreBreakdown && (() => {
                const sc = new Set(fishInTank.map(f => f.id)).size;
                const ah = Object.values(fishHealths).length
                  ? Math.round(Object.values(fishHealths).reduce((a, b) => a + b, 0) / Object.values(fishHealths).length)
                  : 95;
                const rb = Math.min(30, fishInTank.reduce((s, f) => s + (f.rarity === "legendary" ? 20 : f.rarity === "epic" ? 10 : f.rarity === "rare" ? 5 : 1), 0));
                const hv = tankMood === "calm" ? 20 : tankMood === "balanced" ? 10 : 0;
                const items = [
                  { label: "Diversité", icon: "🐟", score: Math.min(64, sc * 8) },
                  { label: "Santé moy.", icon: "❤️", score: Math.round(ah * 0.3) },
                  { label: "Rareté", icon: "✨", score: rb },
                  { label: "Harmonie", icon: "🌊", score: hv },
                ];
                return (
                  <motion.div className="glass-nav rounded-xl px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-2 absolute left-0 right-0 z-50"
                    initial={{ opacity: 0, y: -6, scaleY: 0.8 }} animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -6, scaleY: 0.8 }} transition={{ duration: 0.2 }}
                    style={{ transformOrigin: 'top', top: 'calc(100% + 4px)' }}
                  >
                    {items.map(b => (
                      <div key={b.label} className="flex items-center gap-1.5">
                        <span className="text-sm">{b.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-foreground/50 truncate">{b.label}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className="flex-1 h-0.5 rounded-full bg-foreground/10 overflow-hidden">
                              <div className="h-full rounded-full bg-accent/70" style={{ width: `${Math.min(100, (b.score / 64) * 100)}%` }} />
                            </div>
                            <span className="text-[9px] text-foreground/60 shrink-0">+{b.score}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </motion.div>

      {/* Fish swimming area */}
      <motion.div className={`fish-swimming-area ${reduceEffects ? "" : "gpu-layer"} relative z-10 flex-1 overflow-hidden min-h-0`}
        animate={fishAreaAnimate}
        transition={fishAreaTransition}
        style={{ filter: fishAreaFilter }}
      >

        {/* === Aquarium decorations inside bounded fish area === */}

        {/* Animated coral decorations */}
        <AnimatedCorals nitrateLevel={waterQuality.nitrates} daysSinceInstall={Math.round((Date.now() - coralStartTimeRef.current) / 86400000)} />

        {/* Hiding rocks for fish to play around */}
        <HidingRocks />

        {/* Dynamic algae swaying at the bottom */}
        <Algae count={Math.min(22, 6 + Math.floor(waterQuality.nitrates / 5))} />

        {/* Effet profondeur aquatique : teinte bleue progressive vers le bas + désaturation */}
        <div className="absolute inset-0 pointer-events-none z-[2]" style={{
          background: "linear-gradient(to bottom, transparent 0%, transparent 35%, rgba(10,30,80,0.08) 65%, rgba(5,15,60,0.22) 100%)",
        }} />
        {/* Subtle depth tint — very soft transparency only, no multiply blend that would darken fish */}
        <div className="absolute left-0 right-0 bottom-0 pointer-events-none z-[2]" style={{ height: '40%' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(5,12,35,0.05) 65%, rgba(5,12,35,0.10) 100%)',
          }} />
        </div>
        {/* Eau légèrement verdâtre si nitrates hauts (déséquilibre écosystème) */}
        {waterQuality.nitrates > 30 && (
          <div className="absolute inset-0 pointer-events-none z-[2]" style={{
            background: `rgba(30,120,40,${Math.min(0.12, (waterQuality.nitrates - 30) * 0.004)})`,
            mixBlendMode: "multiply",
          }} />
        )}

        {/* 🌡 Micro-zones thermiques dynamiques — gradient chaud si >26°C, froid si <22°C */}
        {dynamicTemp > 26 && (
          <div className="absolute left-0 right-0 pointer-events-none z-[1]" style={{ top: 0, height: '28%' }}>
            <div style={{ height: '100%', background: 'linear-gradient(to bottom, rgba(255,90,10,0.055) 0%, transparent 100%)' }} />
          </div>
        )}
        {dynamicTemp < 22 && (
          <div className="absolute left-0 right-0 pointer-events-none z-[1]" style={{ bottom: 0, height: '28%' }}>
            <div style={{ height: '100%', background: 'linear-gradient(to top, rgba(40,100,255,0.06) 0%, transparent 100%)' }} />
          </div>
        )}

        {/* 🌡 Micro-zones thermiques — thermocline band + heat shimmer */}
        <div className="absolute left-0 right-0 pointer-events-none z-[2]" style={{ top: "40%", height: "6%" }}>
          <motion.div className="w-full h-full"
            style={{ background: "linear-gradient(to bottom, transparent 0%, rgba(255,180,40,0.04) 50%, transparent 100%)" }}
            animate={{ scaleX: [1, 1.03, 0.98, 1], opacity: [0.4, 0.8, 0.5, 0.8, 0.4] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* 🖱 Courant local par glisser — traînée de bulles/ondulations */}
        {dragTrail.map((pt, idx) => (
          <motion.div key={`drag-${pt.id}`} className="absolute rounded-full pointer-events-none z-[3]"
            style={{ left: `${pt.x}%`, top: `${pt.y}%`, translateX: "-50%", translateY: "-50%",
              width: `${12 - idx * 0.5}px`, height: `${12 - idx * 0.5}px`,
              border: "1.5px solid rgba(180,230,255,0.6)", background: "rgba(180,230,255,0.08)" }}
            initial={{ opacity: 0.7, scale: 0.6 }}
            animate={{ opacity: 0, scale: 2.5 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
          />
        ))}

        {/* 💦 Maintien du doigt — onde pulsante */}
        <AnimatePresence>
          {holdWaves.map(w => (
            <motion.div key={`hold-${w.id}`} className="absolute pointer-events-none z-[4]"
              style={{ left: `${w.x}%`, top: `${w.y}%`, translateX: "-50%", translateY: "-50%" }}>
              {[0, 1, 2].map(k => (
                <motion.div key={k} className="absolute rounded-full border-2 border-cyan-300/60"
                  style={{ width: 20, height: 20, top: "50%", left: "50%", translateX: "-50%", translateY: "-50%" }}
                  initial={{ scale: 0.5, opacity: 0.8 }}
                  animate={{ scale: [0.5, 3 + k], opacity: [0.8, 0] }}
                  transition={{ duration: 1.4, delay: k * 0.35, ease: "easeOut" }}
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 🌊 Indicateur de courant visible — flèche directionnelle + particules dérivantes */}
        {currentStrength > 0.2 && !feedingActive && (
          <div className="absolute inset-0 pointer-events-none z-[2]">
            {/* Flèche de direction */}
            <motion.div
              className="absolute select-none"
              style={{
                top: '50%',
                left: currentAngle === 0 ? '6%' : '89%',
                transform: `translateY(-50%) rotate(${currentAngle === 0 ? 0 : 180}deg)`,
                fontSize: '16px',
                color: 'rgba(160,220,255,0.6)',
                filter: 'blur(0.4px)',
              }}
              animate={{
                opacity: [currentStrength * 0.18, currentStrength * 0.42, currentStrength * 0.18],
                x: currentAngle === 0 ? [0, 6, 0] : [0, -6, 0],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >➞</motion.div>
            {/* Micro-particules qui dérivent avec le courant */}
            {[0, 1, 2, 3, 4].map(k => (
              <motion.div
                key={`curr-${k}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 3, height: 2,
                  background: `rgba(140,210,255,${0.18 + k * 0.05})`,
                  top: `${12 + k * 15}%`,
                  left: currentAngle === 0 ? `${2 + k * 1.5}%` : undefined,
                  right: currentAngle !== 0 ? `${2 + k * 1.5}%` : undefined,
                }}
                animate={{
                  x: currentAngle === 0
                    ? [0, Math.round(currentStrength * 820)]
                    : [0, -Math.round(currentStrength * 820)],
                  opacity: [0, 0.65, 0.5, 0],
                }}
                transition={{
                  duration: 5.5 + k * 1.2,
                  repeat: Infinity,
                  delay: k * 0.95,
                  ease: 'linear',
                }}
              />
            ))}
          </div>
        )}

        {/* ⚡ Tempête lumineuse — inondation cyan quand lightStormActive */}
        <AnimatePresence>
          {lightStormActive && (
            <motion.div className="absolute inset-0 pointer-events-none z-[5]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.18, 0.12, 0.22, 0.1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, repeat: 3, ease: "easeInOut" }}
              style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(0,255,200,0.35) 0%, rgba(0,150,255,0.15) 50%, transparent 80%)", mixBlendMode: "screen" }}
            />
          )}
        </AnimatePresence>

        {/* 🪟 Reflet du joueur — vitre avec reflets selon luminosité */}
        {(!isDayTime || sunlightIntensity < 0.35) && (
          <div className="absolute top-0 left-0 right-0 pointer-events-none z-[3]" style={{ height: '4%' }}>
            <motion.div className="w-full h-full"
              style={{ background: "linear-gradient(to bottom, rgba(120,190,255,0.09) 0%, transparent 100%)" }}
              animate={{ opacity: [0.4, 0.75, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        )}
        {/* Reflets verticaux sur la vitre en nuit profonde */}
        {deepNightMode && (
          <>
            {[0.12, 0.38, 0.64, 0.86].map((xFrac, k) => (
              <motion.div key={`refl-${k}`} className="absolute top-0 pointer-events-none z-[3]"
                style={{
                  left: `${xFrac * 100}%`,
                  width: '1px',
                  height: `${7 + k * 4}%`,
                  background: 'linear-gradient(to bottom, rgba(160,215,255,0.18) 0%, transparent 100%)',
                  transform: 'translateX(-50%)',
                }}
                animate={{ opacity: [0.25, 0.65, 0.25], scaleY: [0.85, 1.1, 0.9, 1.0] }}
                transition={{ duration: 4.5 + k * 1.3, repeat: Infinity, ease: 'easeInOut', delay: k * 0.9 }}
              />
            ))}
          </>
        )}

        {/* 🔬 Flash bioluminescent synchronisé — pulsation collective entre poissons luminescents */}
        {bioFlashActive && bioFishCount >= 2 && (
          <motion.div className="absolute inset-0 pointer-events-none z-[3]"
            initial={{ opacity: 0 }} animate={{ opacity: [0, 0.12, 0] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,255,220,0.2) 0%, transparent 70%)", mixBlendMode: "screen" }}
          />
        )}

        {/* 🐠 Ballet bioluminescent collectif — 3+ poissons pulsent en phase */}
        {showBioCollectivePulse && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-[3]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.08, 0.03, 0.08, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "radial-gradient(ellipse at 50% 50%, hsla(185,100%,65%,0.35) 0%, hsla(210,100%,55%,0.1) 50%, transparent 75%)",
              mixBlendMode: "screen",
            }}
          />
        )}

        {/* 🌑 Migration nocturne — halo de lumière qui traverse le tank lentement */}
        {nocturnalMigrationActive && isNightMode && (
          <motion.div
            className="absolute inset-y-0 pointer-events-none z-[4]"
            style={{ width: "35%" }}
            initial={{ x: nocturnalMigrationDir > 0 ? "-35%" : "100%" }}
            animate={{ x: nocturnalMigrationDir > 0 ? "100%" : "-35%" }}
            transition={{ duration: 18, ease: "linear" }}
          >
            {[...Array(Math.min(bioFishCount, 5))].map((_, k) => (
              <motion.div key={`mig-${k}`} className="absolute rounded-full pointer-events-none"
                style={{
                  width: 20 + k * 8, height: 20 + k * 8,
                  top: `${18 + k * 12}%`,
                  left: `${5 + k * 18}%`,
                  background: `radial-gradient(circle, hsla(${185 + k * 22},100%,70%,0.65) 0%, transparent 70%)`,
                  filter: "blur(5px)",
                  mixBlendMode: "screen",
                }}
                animate={{ opacity: [0.4, 0.95, 0.5, 0.9, 0.4], scale: [0.85, 1.2, 0.9, 1.15, 0.85] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: k * 0.5, ease: "easeInOut" }}
              />
            ))}
            {/* Traînée de particules derrière le groupe */}
            {[...Array(8)].map((_, k) => (
              <motion.div key={`mig-trail-${k}`} className="absolute rounded-full pointer-events-none"
                style={{
                  width: 3 + (k % 3), height: 3 + (k % 3),
                  top: `${10 + (k * 9.7) % 75}%`,
                  right: nocturnalMigrationDir > 0 ? `${5 + k * 8}%` : undefined,
                  left: nocturnalMigrationDir < 0 ? `${5 + k * 8}%` : undefined,
                  background: `hsla(${185 + k * 15},90%,75%,0.6)`,
                  filter: "blur(1px)",
                  mixBlendMode: "screen",
                }}
                animate={{ opacity: [0, 0.7, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: k * 0.15 }}
              />
            ))}
          </motion.div>
        )}

        {/* � Biome Abyssal — fond noir total + espèces 100% luminescentes + particules abyssales */}
        {isAbyssalBiome && (
          <motion.div className="absolute inset-0 pointer-events-none z-[6]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 4 }}>
            {/* Fond noir abyssal quasi-total */}
            <div className="absolute inset-0" style={{ background: "rgba(0,0,8,0.88)" }} />
            {/* Vignetage ultra profond */}
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(0,0,5,0.82) 100%)" }} />
            {/* Halos ambiants — colonnes de lumière abyssale lointaine */}
            {[0, 1, 2].map(k => (
              <motion.div key={`ab-col-${k}`} className="absolute pointer-events-none"
                style={{
                  top: 0, width: `${12 + k * 6}px`, height: "90%",
                  left: `${18 + k * 30}%`,
                  background: `linear-gradient(to bottom, hsla(${185 + k * 20},100%,65%,0.06) 0%, transparent 80%)`,
                  filter: "blur(12px)",
                  mixBlendMode: "screen",
                }}
                animate={{ opacity: [0.35, 0.8, 0.4, 0.7, 0.35], scaleX: [0.8, 1.3, 0.9, 1.2, 0.8] }}
                transition={{ duration: 9 + k * 2.5, repeat: Infinity, ease: "easeInOut", delay: k * 1.8 }}
              />
            ))}
            {/* Particules abyssales — mélange de micro-lumières et de spores */}
            {[...Array(50)].map((_, k) => {
              const hue = [185, 210, 250, 175, 230][k % 5];
              const sz = 1 + (k % 4 < 2 ? 0.5 : 1.5);
              return (
                <motion.div key={`ab-${k}`} className="absolute rounded-full pointer-events-none"
                  style={{
                    width: sz, height: sz,
                    top: `${3 + (k * 1.97) % 92}%`,
                    left: `${(k * 2.13) % 97}%`,
                    background: `hsla(${hue},95%,75%,1)`,
                    filter: "blur(0.3px)",
                    mixBlendMode: "screen",
                  }}
                  animate={{ opacity: [0, 1, 0.4, 1, 0], scale: [0.4, 1.6, 0.7, 1.5, 0.4] }}
                  transition={{ duration: 2 + (k % 5) * 0.6, repeat: Infinity, delay: (k * 0.11) % 4.5, ease: "easeInOut" }}
                />
              );
            })}
            {/* Vague lente au sol */}
            <motion.div className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{ height: "22%", background: "linear-gradient(to top, hsla(185,100%,60%,0.04) 0%, transparent 100%)", mixBlendMode: "screen" }}
              animate={{ opacity: [0.4, 1, 0.5, 0.9, 0.4] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}

        {/* �🌑 Biome Mystique — fond sombre + particules cosmiques */}
        {isMysticBiome && (
          <motion.div className="absolute inset-0 pointer-events-none z-[4]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 3 }}>
            {/* Couche profonde sombre */}
            <div className="absolute inset-0" style={{ background: "rgba(0,2,25,0.55)" }} />
            {/* Vignetage cosmique */}
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(5,0,30,0.7) 100%)" }} />
            {/* Particules cosmiques */}
            {[...Array(30)].map((_, k) => (
              <motion.div key={`cosmic-${k}`} className="absolute rounded-full pointer-events-none"
                style={{ width: `${1 + (k % 3)}px`, height: `${1 + (k % 3)}px`,
                  top: `${5 + (k * 3.1) % 88}%`, left: `${(k * 3.3) % 95}%`,
                  background: k % 4 === 0 ? "#a78bfa" : k % 4 === 1 ? "#67e8f9" : k % 4 === 2 ? "#f9a8d4" : "white",
                  filter: "blur(0.3px)" }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.8, 0.5] }}
                transition={{ duration: 1.5 + (k % 4) * 0.7, repeat: Infinity, delay: (k * 0.13) % 4, ease: "easeInOut" }}
              />
            ))}
            {/* Halo violet autour du centre */}
            <motion.div className="absolute pointer-events-none"
              style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                width: 200, height: 200, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
                filter: "blur(12px)" }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        )}

        {/* Fond marin modulable - floor texture overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none z-[3]"
          style={{
            height: floorType === "sand" ? "18%" : floorType === "rock" ? "15%" : "22%",
            background: floorType === "sand"
              ? "linear-gradient(to top, rgba(194,163,92,0.35) 0%, rgba(210,185,130,0.18) 60%, transparent 100%)"
              : floorType === "rock"
              ? "linear-gradient(to top, rgba(90,90,100,0.45) 0%, rgba(120,115,120,0.2) 60%, transparent 100%)"
              : "linear-gradient(to top, rgba(50,160,120,0.35) 0%, rgba(80,190,150,0.15) 60%, transparent 100%)",
          }}
        >
          {/* Floor texture dots */}
          {floorType === "sand" && [...Array(18)].map((_, k) => (
            <div key={k} className="absolute rounded-full" style={{ width: `${3 + (k%3)}px`, height: `${3 + (k%3)}px`, left: `${5 + k * 5.2}%`, bottom: `${8 + (k%5) * 10}%`, background: "rgba(180,145,70,0.5)" }} />
          ))}
          {floorType === "rock" && [...Array(12)].map((_, k) => (
            <div key={k} className="absolute rounded" style={{ width: `${12 + (k%4)*6}px`, height: `${8 + (k%3)*4}px`, left: `${4 + k * 7.8}%`, bottom: `${4 + (k%4)*8}%`, background: "rgba(80,78,90,0.55)", borderRadius: 3 }} />
          ))}
          {floorType === "reef" && [...Array(10)].map((_, k) => (
            <div key={k} className="absolute" style={{ width: `${10 + (k%3)*5}px`, height: `${18 + (k%4)*8}px`, left: `${5 + k * 9}%`, bottom: "2%", background: `hsl(${150 + k * 15},60%,${35 + k%3*5}%)`, borderRadius: "40% 40% 10% 10%", opacity: 0.65 }} />
          ))}
        </div>

        {/* Dynamic caustics - wavy light projections on aquarium floor */}
        <div className="absolute bottom-0 left-0 right-0 h-2/5 pointer-events-none z-[4] overflow-hidden">
          {[0,1,2,3,4,5,6].map((i) => (
            <motion.div
              key={`caustic-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${55 + i * 32}px`,
                height: `${38 + i * 14}px`,
                left: `${3 + i * 13}%`,
                top: `${8 + (i % 4) * 18}%`,
                background: isNightMode
                  ? `radial-gradient(ellipse, rgba(99,102,241,0.09) 0%, rgba(99,102,241,0.04) 50%, transparent 72%)`
                  : `radial-gradient(ellipse, rgba(150,220,255,0.16) 0%, rgba(100,190,255,0.07) 52%, transparent 74%)`,
                mixBlendMode: 'screen',
              }}
              animate={{
                scaleX:  [1, 1.55, 0.7, 1.3, 1],
                scaleY:  [1, 0.65, 1.4, 0.85, 1],
                x:       [0, 14, -10, 8, 0],
                opacity: [0.35, 0.75, 0.45, 0.85, 0.35],
              }}
              transition={{ duration: 3.5 + i * 0.7, delay: i * 0.55, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
          {/* Additional bright caustic streaks */}
          {[0,1,2].map((i) => (
            <motion.div
              key={`caustic-streak-${i}`}
              className="absolute"
              style={{
                width: `${20 + i * 15}px`, height: '2px',
                left: `${15 + i * 28}%`, top: `${30 + i * 14}%`,
                background: isNightMode
                  ? 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(180,235,255,0.35), transparent)',
                borderRadius: '50%',
                filter: 'blur(3px)',
              }}
              animate={{ scaleX: [0.5, 2, 0.7, 1.5, 0.5], opacity: [0.2, 0.6, 0.3, 0.7, 0.2], x: [-5, 12, -8, 6, -5] }}
              transition={{ duration: 2.8 + i * 0.9, delay: i * 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>

        {/* 💙 Caustiques bioluminescentes — teinte cyan sur le fond quand bio poissons actifs la nuit */}
        {bioFishCount >= 1 && isNightMode && (
          <div className="absolute bottom-0 left-0 right-0 h-2/5 pointer-events-none z-[5] overflow-hidden">
            {[0, 1, 2, 3].map(i => (
              <motion.div key={`bio-caustic-${i}`} className="absolute rounded-full"
                style={{
                  width: `${45 + i * 28}px`, height: `${30 + i * 12}px`,
                  left: `${8 + i * 22}%`, top: `${5 + (i % 3) * 22}%`,
                  background: `radial-gradient(ellipse, hsla(185,100%,65%,${0.12 * bioIntensity}) 0%, transparent 70%)`,
                  filter: "blur(5px)",
                  mixBlendMode: "screen",
                }}
                animate={{ scaleX: [1, 1.7, 0.65, 1.4, 1], scaleY: [1, 0.55, 1.5, 0.8, 1], opacity: [0.3, 0.85, 0.4, 0.75, 0.3] }}
                transition={{ duration: 4 + i * 0.8, delay: i * 0.7, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}
        <motion.div
          className="absolute left-0 right-0 pointer-events-none z-[5]"
          style={{ top: '50%', height: '3px' }}
          animate={{ opacity: [0, 0.07, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-full h-full" style={{ background: 'linear-gradient(to right, transparent 0%, rgba(100,200,255,0.6) 20%, rgba(150,230,255,0.8) 50%, rgba(100,200,255,0.6) 80%, transparent 100%)', filter: 'blur(2px)' }} />
        </motion.div>

        <FishDynamics
          fishInTank={fishInTank}
          getFishStyle={getFishStyle}
          nitrateLevel={waterQuality.nitrates}
          onShrimpCaught={() => {
            // Shrimps eat waste, reducing nitrates in the food chain
            setWaterQuality(prev => {
              const nextNitrates = Math.max(0, prev.nitrates - 0.5);
              if (nextNitrates === prev.nitrates) return prev;
              return { ...prev, nitrates: nextNitrates };
            });
          }}
        />

        {/* Fish Games System */}
        <FishGames 
          fishCount={fishInTank.length}
          fishData={fishInTank.length > 0 ? fishInTank : FISH_CATALOG.slice(0, 8)}
        />

        {/* Companion fish - always present */}
        <motion.div
          className="absolute z-10"
          style={{ bottom: isNightMode ? "20%" : "15%", left: "10%", transform: `scale(${companionScale})` }}
          animate={{
            x: isNightMode ? [0, 20, -10, 15, 0] : [0, 40, -20, 30, 0],
            y: isNightMode ? [0, -5, 8, -4, 0] : [0, -10, 15, -8, 0],
          }}
          transition={{ 
            duration: isNightMode ? 28 : 16, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <motion.div
            className="w-20 h-20"
            animate={{ 
              scaleX: [1, 1, -1, -1, 1],
              rotate: [0, 2, -1, 1, 0]
            }}
            transition={{ 
              duration: isNightMode ? 28 : 16, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <SafeImage
              src={FISH_CATALOG.find(f => f.id === "betta")?.image}
              mobileSrc={FISH_CATALOG.find(f => f.id === "betta")?.imageMobile}
              alt=""
              className="w-full h-full object-contain drop-shadow-[0_4px_20px_rgba(200,160,50,0.3)]"
              fallbackClassName="w-full h-full"
            />
          </motion.div>
          {/* Companion glow */}
          <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl -z-10" />
        </motion.div>

        {/* Tank fish */}
        {fishInTank.map((fish, i) => {
          const style = fishStyles[i] ?? getFishStyle(i);
          const isClicked = clickedFishId === `${fish!.id}-${i}`;
          const fishKey = `${fish!.id}-${i}`;
          const currentHealth = fishHealths[fishKey] || 100;
          
          // ENHANCED HEALTH VISUALS
          const isCriticalHealth = currentHealth < 20;
          const isLowHealth = currentHealth < 50;
          const isExcellentHealth = currentHealth > 90;
          
          // Health affects behavior
          const healthSpeedMod = isCriticalHealth ? 2.0 : isLowHealth ? 1.5 : 1.0;
          
          // Curious fish follow mouse (up to 3 at a time, only when mouse is slow)
          const isCurious = style.personality.curiosity > 0.6;
          const priorCuriousCount = isCurious
            ? fishInTank.slice(0, i).filter((_, k) => (fishPersonalities[k]?.curiosity ?? 0) > 0.6).length
            : 3;
          const followMouse = isCurious && priorCuriousCount < 3 && mousePosition && !feedingActive && !isCriticalHealth && mouseSpeedRef.current < 50;
          // Mouse follow: convert % position to px (estimate swim area 350x580)
          const swimW = 350, swimH = 580;
          const mouseTargetX = followMouse ? (mousePosition.x / 100) * swimW : 0;
          const mouseTargetY = followMouse ? ((mousePosition.y - style.startYNum) / 100) * swimH * 0.7 : 0;
          // Fish actively swim toward falling food positions
          // Food spreads 5–90% horizontally (same formula as FoodParticles.tsx)
          const swimAreaWidth = 350;
          const swimAreaHeight = 580;
          const startXPct = parseFloat(style.startX);                          // e.g. 45 (from "45%")
          const foodXPct = 5 + ((i * 5.3 + Math.sin(i * 2.1) * 14) % 85);    // 5–90%, mirrors food spread
          const feedingTargetX = feedingActive
            ? ((foodXPct - startXPct) / 100) * swimAreaWidth                  // relative px offset from startX
            : 0;
          // Fish swim UP to intercept food mid-fall (25–40% from top of tank)
          const foodInterceptYPct = 25 + (i % 5) * 3;                         // 25–37%
          const feedingTargetY = feedingActive
            ? ((foodInterceptYPct - style.startYNum) / 100) * swimAreaHeight  // negative = move up
            : 0;
          
          // Get saved position after feeding (if exists)
          const savedPos = fishFedPositions[fishKey];
          const hasEaten = !feedingActive && savedPos;
          // Fish is swimming back to origin after feeding
          const isReturning = !feedingActive && fishReturning.has(fishKey);

          // Fish aging: older fish are slightly larger
          const fishInstance = fishInstances.find((fi) => fi.fishId === fish.id);
          const ageScale = fishInstance ? Math.min(1 + (fishInstance.age - 7) * 0.0015, 1.3) : 1.0;

          // 👶 Bébé suit parent — jeune poisson (<14j) avec dominanceBias OU timidityBias suit le plus proche
          const isBaby = (fishInstance?.age ?? 30) < 14 && (
            fishInstance?.hiddenTraits?.dominanceBias !== undefined ||
            fishInstance?.hiddenTraits?.timidityBias !== undefined
          );
          const parentIndex = isBaby
            ? fishInTank.findIndex((_, k) => k !== i && (fishInstances.find(fi => fi.fishId === fishInTank[k]!.id)?.age ?? 0) > 14)
            : -1;
          const parentStyle = parentIndex >= 0 ? (fishStyles[parentIndex] ?? null) : null;
          const parentFollowX = (isBaby && parentStyle && !feedingActive && !followMouse)
            ? parseFloat(parentStyle.startX) * 3.5 - parseFloat(style.startX) * 3.5
            : 0;
          const parentFollowY = (isBaby && parentStyle && !feedingActive && !followMouse)
            ? (parentStyle.startYNum - style.startYNum) * 3.5
            : 0;
          
          // Face direction: 1=right -1=left (ref-based, render only sets initial value)
          const faceDir = followMouse
            ? (mouseTargetX > 0 ? 1 : mouseTargetX < 0 ? -1 : (fishDirections.current[i] ?? 1))
            : feedingActive
            ? (feedingTargetX > 0 ? 1 : feedingTargetX < 0 ? -1 : (fishDirections.current[i] ?? 1))
            : (fishDirections.current[i] ?? style.scaleX);

          const motionData = fishMotion[i] ?? {
            baseX: style.movementX,
            baseY: style.movementY,
            schoolX: style.movementX,
            schoolY: style.movementY,
          };
          const isSchoolingFish = fish?.behavior === "schooling";
          const useSchoolMotion = isSchoolingFish && !feedingActive && !followMouse && !isBaby;
          const effectiveMovX = useSchoolMotion ? motionData.schoolX : motionData.baseX;
          const effectiveMovY = useSchoolMotion ? motionData.schoolY : motionData.baseY;

          // 👁️ Regard dynamique: subtle eye shift toward food > cursor > dominant
          let gazeX = 0; // 1=toward head/forward, -1=backward, 0=neutral
          if (feedingActive && feedingTargetX !== 0) {
            gazeX = feedingTargetX > 20 ? 1 : feedingTargetX < -20 ? -1 : 0;
          } else if (mousePosition && !followMouse) {
            const relMx = mousePosition.x - parseFloat(style.startX);
            gazeX = relMx > 8 ? 1 : relMx < -8 ? -1 : 0;
          } else {
            const domIdx = fishPersonalities.findIndex((p, k) => k !== i && p.dominance > 0.75);
            if (domIdx >= 0 && fishStyles[domIdx]) {
              const dx = parseFloat(fishStyles[domIdx].startX) - parseFloat(style.startX);
              gazeX = dx > 5 ? 1 : dx < -5 ? -1 : 0;
            }
          }
          
          return (
            <div key={fishKey} className="absolute" style={{ left: style.startX, top: style.startY, transform: `scale(${ageScale})`, transformOrigin: 'center bottom', filter: style.depthFilter }}>
              {/* Fish wake trail - mirror to match direction */}
              {(fish.swimSpeed === "fast" || fish.swimSpeed === "normal") && !isNightMode && (
                <div style={{ transform: `scaleX(${faceDir})`, position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {[...Array(3)].map((_, idx) => (
                    <motion.div
                      key={`wake-${idx}`}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: `${6 - idx * 1.5}px`, height: `${4 - idx}px`,
                        background: 'rgba(180,220,255,0.35)',
                        left: `${-6 - idx * 9}px`, top: '50%',
                        transform: 'translateY(-50%)', filter: 'blur(1px)',
                      }}
                      animate={{ opacity: [0, 0.55, 0], scaleX: [0.5, 1, 1.5] }}
                      transition={{ duration: 0.9, delay: idx * 0.18, repeat: Infinity, ease: 'easeOut' }}
                    />
                  ))}
                </div>
              )}

              {/* Traînée lumineuse nocturne — poissons rapides la nuit */}
              {fish.swimSpeed === "fast" && isNightMode && (
                <div style={{ transform: `scaleX(${faceDir})`, position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', mixBlendMode: 'screen' }}>
                  {[...Array(5)].map((_, idx) => (
                    <motion.div key={`lum-trail-${idx}`} className="absolute rounded-full pointer-events-none"
                      style={{
                        width: `${8 - idx * 1.2}px`, height: `${8 - idx * 1.2}px`,
                        background: `radial-gradient(circle, hsla(185,100%,75%,0.9) 0%, transparent 70%)`,
                        left: `${-8 - idx * 10}px`, top: '50%', transform: 'translateY(-50%)',
                        filter: `blur(${1 + idx * 0.5}px)`,
                      }}
                      animate={{ opacity: [0, 0.7 - idx * 0.12, 0], scale: [0.6, 1, 1.4] }}
                      transition={{ duration: 0.6 + idx * 0.1, delay: idx * 0.08, repeat: Infinity, ease: 'easeOut' }}
                    />
                  ))}
                </div>
              )}
              
              {/* Fish body - smooth x/y movement, direction via scaleX state */}
              <motion.div
                className={`${style.size} cursor-pointer relative z-10`}
                initial={{ x: 0, y: 0, rotateZ: 0, scale: 1, scaleX: style.movementScaleX[0] ?? 1 }}
                animate={{
                  x: followMouse
                      ? mouseTargetX
                      : isBaby && parentFollowX !== 0
                        ? parentFollowX + 18
                        : feedingActive
                          ? feedingTargetX
                          : isReturning
                            ? 0
                            : effectiveMovX,
                  y: followMouse
                      ? mouseTargetY
                      : isBaby && parentFollowY !== 0
                        ? parentFollowY + 10
                        : feedingActive
                          ? feedingTargetY
                          : isReturning
                            ? 0
                            : isCriticalHealth
                              ? effectiveMovY.map(y => y + 25)
                              : effectiveMovY,
                  rotateZ: isClicked
                    ? CLICK_ROTATE_Z
                    : isCriticalHealth
                      ? CRIT_ROTATE_Z
                      : feedingActive
                        ? FEED_ROTATE_Z
                        : style.tiltKeyframes,
                  scale: isClicked ? CLICK_SCALE : 1,
                  scaleX: followMouse
                    ? (mouseTargetX >= 0 ? 1 : -1)
                    : feedingActive
                      ? (feedingTargetX >= 0 ? 1 : -1)
                      : style.movementScaleX,
                }}
                transition={{
                  x: followMouse
                      ? { duration: 0.8, ease: "easeOut" }
                      : feedingActive
                        ? { duration: 0.4 + i * 0.04, ease: [0.1, 0, 0.3, 1] }
                        : isReturning
                          ? { duration: 1.2 + i * 0.07, ease: [0.25, 0.1, 0.25, 1] }
                          : { duration: style.duration * healthSpeedMod, repeat: Infinity, ease: "easeInOut", delay: style.delay },
                  y: followMouse
                      ? { duration: 0.8, ease: "easeOut" }
                      : feedingActive
                        ? { duration: 0.4 + i * 0.04, ease: [0.1, 0, 0.3, 1] }
                        : isReturning
                          ? { duration: 1.2 + i * 0.07, ease: [0.25, 0.1, 0.25, 1] }
                          : { duration: style.duration * healthSpeedMod, repeat: Infinity, ease: "easeInOut", delay: style.delay },
                  rotateZ: isClicked
                    ? { duration: 0.6, ease: "easeOut" }
                    : isCriticalHealth
                      ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      : feedingActive
                        ? { duration: 0.4, repeat: 4, ease: "easeInOut", delay: 1.5 + i * 0.15 }
                        : { duration: style.duration / 2, repeat: Infinity, ease: "easeInOut" },
                  scale: isClicked ? { duration: 0.6, ease: "backOut" } : { duration: 1 },
                  scaleX: followMouse || feedingActive
                    ? { duration: 0.18, ease: "easeOut" }
                    : { duration: style.duration * healthSpeedMod, repeat: Infinity, ease: "easeInOut", delay: style.delay },
                }}
                onAnimationComplete={() => {
                  // Save position when feeding animation completes
                  if (feedingActive && !fishFedPositions[fishKey]) {
                    setFishFedPositions(prev => ({
                      ...prev,
                      [fishKey]: { x: feedingTargetX, y: feedingTargetY }
                    }));
                  }
                  // Once fish has returned to origin, let it resume normal loop
                  if (isReturning) {
                    setFishReturning(prev => {
                      const next = new Set(prev);
                      next.delete(fishKey);
                      return next;
                    });
                  }
                }}
                onClick={() => {
                  setClickedFishId(fishKey);
                  setTimeout(() => setClickedFishId(null), 600);
                }}
                whileHover={{ scale: 1.1 }}
              >
                {/* Direction wrapper */}
                <div style={{ width: '100%', height: '100%' }}>
                  {/* 👁️ Regard dynamique — pupille orientée vers nourriture / curseur / dominant */}
                  <div className="absolute pointer-events-none z-[12]"
                    style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: 'rgba(10,10,20,0.75)',
                      top: '33%',
                      left: faceDir > 0 ? `${62 + gazeX * 5}%` : `${30 - gazeX * 5}%`,
                      transition: 'left 0.35s ease',
                      boxShadow: '0 0 0 1.5px rgba(255,255,255,0.3)',
                    }}
                  />
                  {/* Bioluminescent genetic glow — driven by bioIntensity world scalar */}
                  {(() => {
                    const bio = fishInstance?.hiddenTraits?.bioluminescent;
                    if (!bio || bio === "none") return null;
                    const intensityByType = { soft: 0.35, reactive: 0.55, intense: 0.85 };
                    // ageBoost: jeunes poissons (<30j) brillent plus fort
                    const ageBoost = 1 + Math.max(0, 30 - (fishInstance?.age ?? 30)) / 30 * 0.6;
                    // stormBoost: tempête lumineuse ×3
                    const stormBoost = lightStormActive ? 3 : 1;
                    // Global bioIntensity replaces per-fish night/moon/mood factors
                    const opacity = Math.min(1, (intensityByType[bio] ?? 0) * bioIntensity * ageBoost * stormBoost);
                    const radius = (bio === "intense" ? 28 : bio === "reactive" ? 20 : 14) * (deepNightMode ? 1.3 : 1) * (lightStormActive ? 1.5 : 1);
                    // ── Bioluminescence émotionnelle + synchronisation collective ────────
                    const highCurrent = currentStrength > 0.55;
                    const isStressedFish = style.personality.stressed;
                    const isExcitedFish = !isStressedFish && style.personality.energy > 0.75;
                    const isCalmFish = !isStressedFish && style.personality.energy < 0.4;
                    // Collective sync: 3+ bio fish all share the same period → visual ballet
                    const isCollectiveSync = bioFishCount >= 3 && isNightMode;
                    //  Duration per emotional state
                    const emoPulseDur = isStressedFish ? 0.65
                      : isExcitedFish ? 0.9
                      : isCalmFish ? 3.8
                      : isCollectiveSync ? 2.5
                      : (bio === "intense" ? 1.5 : 2.5);
                    const pulseScale: number[] = isCriticalHealth
                      ? [1, 2, 0.9, 1.8, 1]
                      : isStressedFish ? [0.85, 1.55, 0.75, 1.6, 0.8, 1.4, 0.85] // chaotique
                      : isExcitedFish  ? [1, 1.65, 1, 1.65, 1]                    // rapide
                      : isCalmFish     ? [1, 1.06, 1]                              // très régulier
                      : style.personality.energy > 0.7 ? [1, 1.6, 1, 1.6, 1]
                      : bio === "reactive" ? [1, 1.5, 1] : [1, 1.1, 1];
                    const pulseOpacities = isStressedFish
                      ? [opacity*0.3, opacity*1.1, opacity*0.5, opacity*0.85, opacity*0.25, opacity*0.95, opacity*0.4]
                      : isExcitedFish
                        ? [opacity*0.55, opacity*1.05, opacity*0.6, opacity*1.05, opacity*0.55]
                        : highCurrent
                          ? [opacity*0.5, opacity, opacity*0.65, opacity*1.05, opacity*0.7, opacity]
                          : [opacity*0.6, opacity, opacity*0.7, opacity];
                    return (
                      <>
                        {/* 🌟 BLOOM LAYER 1 — noyau brillant, source du glow */}
                        <motion.div className="absolute rounded-full pointer-events-none"
                          animate={{ opacity: pulseOpacities, scale: pulseScale }}
                          transition={{ duration: emoPulseDur, repeat: Infinity, ease: isStressedFish ? "linear" : "easeInOut" }}
                          style={{
                            background: `radial-gradient(circle, hsla(185,100%,80%,1) 0%, hsla(195,100%,65%,0.8) 30%, transparent 70%)`,
                            filter: "blur(2px)",
                            top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                            width: radius * 1.8, height: radius * 1.8,
                            mixBlendMode: "screen", zIndex: -1,
                          }}
                        />
                        {/* 🌟 BLOOM LAYER 2 — halo médian, additive blend */}
                        <motion.div className="absolute rounded-full pointer-events-none"
                          animate={{
                            opacity: pulseOpacities.map(v => v * 0.55),
                            scale: pulseScale.map(v => v * 1.2),
                          }}
                          transition={{ duration: emoPulseDur, repeat: Infinity, ease: isStressedFish ? "linear" : "easeInOut" }}
                          style={{
                            background: `radial-gradient(circle, hsla(185,100%,65%,0.85) 0%, hsla(200,100%,55%,0.4) 45%, transparent 80%)`,
                            filter: "blur(7px)",
                            top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                            width: radius * 3.2, height: radius * 3.2,
                            mixBlendMode: "screen", zIndex: -1,
                          }}
                        />
                        {/* 🌟 BLOOM LAYER 3 — halo extérieur volumétrique, opacité selon bioIntensity + caméra */}
                        <motion.div className="absolute rounded-full pointer-events-none"
                          animate={{
                            opacity: pulseOpacities.map(v => v * 0.28 * bioIntensity),
                            scale: pulseScale.map(v => v * 1.5 * (cameraFocus?.zoom ?? 1)),
                            x: [0, 3, -2, 4, 0], y: [0, -2, 4, -1, 0],
                          }}
                          transition={{ duration: emoPulseDur * 1.3, repeat: Infinity, ease: "easeInOut" }}
                          style={{
                            background: `radial-gradient(circle, hsla(185,90%,60%,0.5) 0%, hsla(210,100%,50%,0.15) 55%, transparent 80%)`,
                            filter: "blur(16px)",
                            top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                            width: radius * 5.5, height: radius * 5.5,
                            mixBlendMode: "screen", zIndex: -1,
                          }}
                        />
                        {/* 💧 Halo volumétrique — gradient radial lent, très subtil */}
                        {isNightMode && (
                          <motion.div className="absolute rounded-full pointer-events-none"
                            animate={{
                              opacity: [0.08 * bioIntensity, 0.18 * bioIntensity, 0.08 * bioIntensity],
                              x: [0, 5, -3, 4, 0], y: [0, -4, 6, -2, 0],
                              scale: [1, 1.12, 0.95, 1.08, 1],
                            }}
                            transition={{ duration: 6 + (fishInstance?.age ?? 0) % 3, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                              background: `radial-gradient(circle, hsla(${bio === 'intense' ? 175 : 195},100%,70%,0.4) 0%, hsla(220,90%,55%,0.1) 50%, transparent 80%)`,
                              filter: "blur(24px)",
                              top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                              width: radius * 8, height: radius * 8,
                              mixBlendMode: "screen", zIndex: -2,
                            }}
                          />
                        )}
                        {/* 🔬 Flash A — poisson initiateur envoie un ping lumineux */}
                        {bioFlashActive && isNightMode && (
                          <motion.div className="absolute rounded-full pointer-events-none"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: [0, 0.9, 0], scale: [0.6, 2.4, 3.8] }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                            style={{
                              border: "2px solid rgba(0,255,220,0.95)",
                              top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                              width: radius * 3, height: radius * 3,
                              mixBlendMode: "screen", zIndex: -1,
                            }}
                          />
                        )}
                        {/* 🔬 Flash B — réponse du second poisson (~700ms plus tard, anneau plus doux) */}
                        {bioResponseActive && isNightMode && (
                          <motion.div className="absolute rounded-full pointer-events-none"
                            initial={{ opacity: 0, scale: 0.4 }}
                            animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.8, 2.8] }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            style={{
                              border: "1.5px solid rgba(100,255,200,0.7)",
                              top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                              width: radius * 2.2, height: radius * 2.2,
                              mixBlendMode: "screen", zIndex: -1,
                            }}
                          />
                        )}
                        {/* ✨ Traînée lumineuse — poissons bio rapides laissent des points qui s'estompent */}
                        {fish.swimSpeed === "fast" && isNightMode && (
                          <>
                            {[0, 1, 2].map(t => (
                              <motion.div key={`trail-${t}`} className="absolute rounded-full pointer-events-none"
                                style={{
                                  width: Math.max(1, 4 - t * 1.2),
                                  height: Math.max(1, 4 - t * 1.2),
                                  background: `hsla(185,100%,65%,${0.65 - t * 0.18})`,
                                  top: "50%",
                                  left: faceDir > 0 ? `-${(t + 1) * 7}px` : `calc(100% + ${(t + 1) * 7}px)`,
                                  transform: "translateY(-50%)",
                                  filter: "blur(1.5px)",
                                  zIndex: -1,
                                  mixBlendMode: "screen",
                                }}
                                animate={{ opacity: [0, opacity * 0.8, 0] }}
                                transition={{ duration: 0.55, delay: t * 0.08, repeat: Infinity, ease: "easeOut" }}
                              />
                            ))}
                          </>
                        )}
                        {/* 👁 Regard dynamique — reflet lumineux directionnel vers cible */}
                        {bio === "intense" && (
                          <div className="absolute pointer-events-none"
                            style={{
                              width: 5, height: 5, borderRadius: "50%",
                              background: "rgba(0,255,220,0.9)",
                              top: "35%",
                              left: faceDir > 0 ? "70%" : "20%",
                              filter: "blur(1px)",
                              zIndex: 3,
                            }}
                          />
                        )}
                        {/* 💧 Éclairage local du fond — le sol s’illumine là où le poisson passe */}
                        {(bio === "intense" || bio === "reactive") && isNightMode && (
                          <motion.div className="absolute pointer-events-none"
                            style={{
                              width: radius * (bio === 'intense' ? 5 : 3.5),
                              height: radius * (bio === 'intense' ? 1.4 : 0.9),
                              borderRadius: "50%",
                              background: `radial-gradient(ellipse, hsla(185,100%,65%,${bio === 'intense' ? 0.4 : 0.22}) 0%, hsla(200,90%,55%,0.12) 45%, transparent 75%)`,
                              filter: "blur(8px)",
                              bottom: "-110%",
                              left: "50%",
                              transform: "translateX(-50%)",
                              mixBlendMode: "screen",
                            }}
                            animate={{ opacity: [0.25 * bioIntensity, 0.6 * bioIntensity, 0.3 * bioIntensity, 0.55 * bioIntensity, 0.25 * bioIntensity] }}
                            transition={{ duration: emoPulseDur, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}
                      </>
                    );
                  })()}
                  {/* 👶 Timidity inheritance — shy babies have a light silvery shimmer */}
                  {isBaby && (fishInstance?.hiddenTraits?.timidityBias ?? 0) > 0.55 && (
                    <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                      background: 'radial-gradient(circle, rgba(220,235,255,0.22) 0%, transparent 70%)',
                      mixBlendMode: 'screen',
                      zIndex: 5,
                    }} />
                  )}
                  {/* 🌿 Herbivore algae nibble — bottom-dwellers show a tiny chomping indicator near algae */}
                  {style.personality.preferredDepth === 'bottom'
                    && waterQuality.nitrates > 15
                    && !isNightMode
                    && !feedingActive
                    && style.startYNum > 55
                    && (
                    <motion.div className="absolute text-[9px] pointer-events-none select-none" style={{ bottom: '-14px', left: '50%', transform: 'translateX(-50%)', zIndex: 6 }}
                      animate={{ opacity: [0, 0.85, 0], y: [0, -4, 0], scale: [0.8, 1.1, 0.8] }}
                      transition={{ duration: 2.8, repeat: Infinity, delay: i * 1.1 + 0.5, ease: 'easeInOut' }}
                    >🌿</motion.div>
                  )}
                  {(fishInstance?.age ?? 0) > 30 && (
                    <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                      background: `radial-gradient(circle, rgba(255,200,50,${Math.min(0.18, ((fishInstance!.age - 30) / 60) * 0.18)}) 0%, transparent 70%)`,
                      mixBlendMode: "color",
                      zIndex: 2,
                    }} />
                  )}
                  {/* ✨ Espèce évolutive — aura dorée pour poissons >40j, anneau tournant >70j */}
                  {(fishInstance?.age ?? 0) >= 40 && (
                    <motion.div className="absolute inset-0 rounded-full pointer-events-none"
                      style={{ zIndex: 1 }}
                      animate={{ boxShadow: [
                        '0 0 0px 0px rgba(255,200,60,0)',
                        `0 0 ${10 + Math.min(18, ((fishInstance!.age - 40) / 30) * 12)}px ${4 + Math.min(7, ((fishInstance!.age - 40) / 40) * 6)}px rgba(255,195,50,${0.2 + Math.min(0.18, (fishInstance!.age - 40) / 160)})`,
                        '0 0 0px 0px rgba(255,200,60,0)',
                      ]}}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  {(fishInstance?.age ?? 0) >= 70 && (
                    <motion.div className="absolute rounded-full pointer-events-none"
                      style={{ width: '135%', height: '135%', top: '-17.5%', left: '-17.5%', border: '1px solid rgba(255,195,50,0.38)', zIndex: 1 }}
                      animate={{ rotate: [0, 360], opacity: [0.35, 0.65, 0.35] }}
                      transition={{ rotate: { duration: 9, repeat: Infinity, ease: 'linear' }, opacity: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
                    />
                  )}
                  {/* 🧬 Motif fractal — anneau tournant arc-en-ciel sur poissons mutants */}
                  {fishInstance?.hiddenTraits?.fractalPattern && (
                    <motion.div className="absolute rounded-full pointer-events-none"
                      animate={{ rotate: 360, scale: [1, 1.08, 1] }}
                      transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
                      style={{
                        width: 130, height: 130,
                        top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                        border: "1.5px solid transparent",
                        borderRadius: "50%",
                        background: "transparent",
                        boxShadow: "0 0 0 1.5px rgba(160,100,255,0.5), 0 0 8px 2px rgba(100,200,255,0.3)",
                        zIndex: 3,
                        opacity: 0.7,
                      }}
                    />
                  )}
                  {/* Hybride secret — double anneau prismatique + éclat central */}
                  {fishInstance?.hiddenTraits?.secretHybrid && (
                    <>
                      <motion.div className="absolute rounded-full pointer-events-none"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        style={{
                          width: 150, height: 150,
                          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                          boxShadow: "0 0 0 2px rgba(255,215,0,0.6), 0 0 12px 4px rgba(255,120,255,0.4)",
                          borderRadius: "50%", zIndex: 4,
                        }}
                      />
                      <motion.div className="absolute rounded-full pointer-events-none"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.9, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                          width: 20, height: 20,
                          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                          background: "radial-gradient(circle, rgba(255,255,200,0.9) 0%, rgba(255,180,0,0.4) 60%, transparent 100%)",
                          filter: "blur(3px)", zIndex: 4,
                        }}
                      />
                    </>
                  )}
                  {/* 🫧 Jeu des bulles bébé — bébés dardent vers les bulles et les "éclatent" */}
                  {isBaby && giantBubbles.length > 0 && giantBubbles.slice(0, 1).map(b => (
                    <motion.div key={`bpop-${b.id}`} className="absolute pointer-events-none z-[52]"
                      style={{ top: "50%", left: "50%", translateX: "-50%", translateY: "-50%" }}
                      initial={{ scale: 1, opacity: 0.9 }}
                      animate={{ scale: [1, 1.3, 0.8, 1], opacity: [0.9, 1, 0.4, 0] }}
                      transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}>
                      <span style={{ fontSize: 12 }}>💥</span>
                    </motion.div>
                  ))}
                  {/* ✨ Espèce évoluée — poissons > 45j : anneau de particules dorées */}
                  {(fishInstance?.age ?? 0) >= 45 && (
                    <>
                      {[0, 1, 2, 3].map(k => (
                        <motion.div key={`evo-${k}`} className="absolute rounded-full pointer-events-none"
                          style={{ width: 4, height: 4, zIndex: 3,
                            background: "rgba(255,215,0,0.9)", filter: "blur(0.5px)",
                            top: "50%", left: "50%",
                            transformOrigin: "center center" }}
                          animate={{
                            x: [Math.cos((k / 4) * Math.PI * 2) * 18, Math.cos(((k + 1) / 4) * Math.PI * 2) * 18],
                            y: [Math.sin((k / 4) * Math.PI * 2) * 18, Math.sin(((k + 1) / 4) * Math.PI * 2) * 18],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1.3, 0.5],
                          }}
                          transition={{ duration: 2, delay: (k / 4) * 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      ))}
                    </>
                  )}
                  {/* 🐠 Fin-bob — subtle body oscillation for realistic swimming feel */}
                  <motion.div
                    style={{ width: '100%', height: '100%' }}
                    animate={{ scaleY: isCriticalHealth ? [1, 1.02, 0.99, 1] : [1, 1.035, 0.975, 1.02, 0.99, 1] }}
                    transition={{
                      duration: isCriticalHealth ? 2.4 : (style.personality.energy > 0.7 ? 0.75 : style.personality.energy < 0.4 ? 1.6 : 1.1) + (i % 5) * 0.09,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: style.delay * 0.25,
                    }}
                  >
                    <SafeImage
                      src={fish.image}
                      mobileSrc={fish.imageMobile}
                      alt=""
                      priority="high"
                      className={`w-full h-full object-contain drop-shadow-2xl transition-all duration-1000 ${
                        style.personality.stressed 
                          ? "saturate-50 opacity-70" 
                          : isExcellentHealth
                            ? "saturate-150 brightness-110"
                            : isLowHealth
                              ? "saturate-50 opacity-75"
                              : isCriticalHealth
                                ? "saturate-30 opacity-60"
                                : ""
                      }`}
                      style={{
                        filter: isCriticalHealth
                          ? "saturate(0.3) brightness(0.7) contrast(0.8)"
                          : isLowHealth
                            ? "saturate(0.5) brightness(0.85)"
                            : isExcellentHealth
                              ? "saturate(1.5) brightness(1.1) drop-shadow(0 0 8px rgba(255,215,0,0.3))"
                              : style.personality.stressed 
                                ? "saturate(0.5) brightness(0.9)" 
                                : undefined,
                      }}
                      fallbackClassName="w-full h-full"
                    />
                  </motion.div>
                </div>

                {/* Ground shadow ellipse */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: "-6px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: `${Math.round(ageScale * 60)}%`,
                    height: "5px",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.22)",
                    filter: "blur(3px)",
                    opacity: isNightMode ? 0.18 : 0.28,
                  }}
                />
                
                {/* Excellent health sparkles */}
                {isExcellentHealth && (
                  <>
                    {[...Array(4)].map((_, idx) => (
                      <motion.div
                        key={`health-sparkle-${idx}`}
                        className="absolute w-1 h-1 rounded-full bg-yellow-300"
                        style={{
                          left: `${25 + (idx * 15) % 50}%`,
                          top: `${20 + (idx * 20) % 60}%`,
                        }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: idx * 0.3,
                        }}
                      />
                    ))}
                  </>
                )}




                {/* TAP SUR LA VITRE : réaction selon personnalité */}
                {tapFlinchId > 0 && style.isTimid && (
                  <>
                    {[0, 1, 2].map(k => (
                      <motion.div key={`scat-${k}-${tapFlinchId}`}
                        className="absolute w-1.5 h-1.5 rounded-full pointer-events-none z-20"
                        style={{ background: 'rgba(150,200,255,0.9)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                        initial={{ x: 0, y: 0, opacity: 0.9, scale: 1 }}
                        animate={{ x: k === 0 ? -20 : k === 1 ? 16 : -6, y: k === 0 ? -16 : k === 1 ? -6 : 14, opacity: 0, scale: 0.3 }}
                        transition={{ duration: 0.42, ease: 'easeOut' }}
                      />
                    ))}
                  </>
                )}

                {/* ONDE SURPRISE : playful fish reacts with amused spin */}
                {surpriseWaveId > 0 && style.isPlayful && (
                  <motion.div key={`sw-${surpriseWaveId}`}
                    className="absolute inset-0 pointer-events-none z-20"
                    initial={{ rotate: 0, scale: 1 }}
                    animate={{ rotate: [0, 18, -14, 8, 0], scale: [1, 1.18, 0.92, 1.08, 1] }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                  />
                )}

                {/* Aggressive fish aura */}
                {style.isAggressive && (
                  <motion.div
                    className="absolute inset-0 -z-10 rounded-full"
                    animate={{
                      boxShadow: [
                        "0 0 15px rgba(255, 50, 50, 0.3)",
                        "0 0 25px rgba(255, 50, 50, 0.5)",
                        "0 0 15px rgba(255, 50, 50, 0.3)",
                      ],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}


                
                {/* Health bar indicator */}
                <HealthBar 
                  health={fishHealths[fishKey] || 100}
                  visible={true}
                />
                
                {/* Legendary fish special effects */}
                {fish.specialEffect === "sparkles" && (
                  <>
                    {[...Array(8)].map((_, idx) => (
                      <motion.div
                        key={`sparkle-${idx}`}
                        className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300"
                        style={{
                          left: `${20 + (idx * 10) % 60}%`,
                          top: `${15 + (idx * 15) % 70}%`,
                        }}
                        animate={{
                          opacity: [0, 1, 0.8, 0],
                          scale: [0, 1.2, 0.9, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          delay: idx * 0.2,
                          repeat: Infinity,
                          repeatDelay: 1,
                        }}
                      />
                    ))}
                  </>
                )}
                
                {fish.specialEffect === "glow" && (
                  <motion.div
                    className="absolute inset-0 rounded-full blur-2xl -z-10"
                    style={{
                      background: fish.rarity === "legendary" 
                        ? "radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,215,0,0) 70%)"
                        : "radial-gradient(circle, rgba(147,51,234,0.6) 0%, rgba(147,51,234,0) 70%)",
                    }}
                    animate={{
                      opacity: [0.4, 0.8, 0.4],
                      scale: [0.9, 1.1, 0.9],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
                
                {fish.specialEffect === "trail" && (
                  <>
                    {[...Array(5)].map((_, idx) => (
                      <motion.div
                        key={`trail-${idx}`}
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                          left: "50%",
                          top: "50%",
                          marginLeft: -6,
                          marginTop: -6,
                          background: fish.rarity === "legendary"
                            ? "radial-gradient(circle, rgba(255,215,0,0.7) 0%, rgba(255,215,0,0) 80%)"
                            : "radial-gradient(circle, rgba(59,130,246,0.7) 0%, rgba(59,130,246,0) 80%)",
                        }}
                        animate={{
                          opacity: [0.7, 0.3, 0],
                          scale: [1, 1.5, 0.5],
                        }}
                        transition={{
                          duration: 1.2,
                          delay: idx * 0.15,
                          repeat: Infinity,
                        }}
                      />
                    ))}
                  </>
                )}
                
                {fish.specialEffect === "aura" && (
                  <motion.div
                    className="absolute inset-[-150%] rounded-full blur-3xl -z-10"
                    style={{
                      background: fish.rarity === "legendary"
                        ? "radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,165,0,0.2) 40%, rgba(255,215,0,0) 70%)"
                        : "radial-gradient(circle, rgba(147,51,234,0.3) 0%, rgba(168,85,247,0.2) 40%, rgba(147,51,234,0) 70%)",
                    }}
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [0.95, 1.05, 0.95],
                      rotate: [0, 360],
                    }}
                    transition={{
                      opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                      scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                      rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    }}
                  />
                )}
                
                {/* Territorial zone */}
                {style.personality.trait === "territorial" && (
                  <motion.div
                    className="absolute rounded-full pointer-events-none -z-20"
                    style={{
                      width: '170%', height: '170%', top: '-35%', left: '-35%',
                      background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.03) 60%, transparent 80%)',
                      border: '1px dashed rgba(239,68,68,0.18)',
                    }}
                    animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                {/* — Bioluminescence: jellyfish, seahorse + ALL legendary fish at night — */}
                {isNightMode && (fish.id === 'jellyfish' || fish.id === 'seahorse' || fish.rarity === 'legendary') && (() => {
                  const bioColor =
                    fish.id === 'jellyfish'     ? { core: 'rgba(147,51,234,0.6)',  ring: 'rgba(99,102,241,0.32)',  dot: 'rgba(167,139,250,0.9)' } :
                    fish.id === 'seahorse'      ? { core: 'rgba(56,189,248,0.6)',  ring: 'rgba(14,165,233,0.32)', dot: 'rgba(125,211,252,0.9)' } :
                    fish.rarity === 'legendary' ? { core: 'rgba(250,204,21,0.55)', ring: 'rgba(234,179,8,0.28)',  dot: 'rgba(253,224,71,0.9)'  } :
                                                  { core: 'rgba(56,189,248,0.4)',  ring: 'rgba(14,165,233,0.2)',  dot: 'rgba(125,211,252,0.8)' };
                  const dur = fish.id === 'jellyfish' ? 3.2 : fish.rarity === 'legendary' ? 2.5 : 2;
                  return (
                    <>
                      {/* Outer pulsing halo */}
                      <motion.div
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          inset: '-60%',
                          background: `radial-gradient(circle, ${bioColor.core} 0%, ${bioColor.ring} 40%, transparent 72%)`,
                          filter: 'blur(12px)',
                        }}
                        animate={{ opacity: [0.45, 1, 0.55, 1, 0.45], scale: [0.9, 1.15, 0.95, 1.12, 0.9] }}
                        transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      {/* 🌊 Réaction au courant — glow fluctue/se déforme si courant fort */}
                      {currentStrength > 0.4 && (
                        <motion.div
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            inset: '-55%',
                            background: `radial-gradient(ellipse, ${bioColor.ring} 0%, transparent 65%)`,
                            filter: `blur(${6 + currentStrength * 8}px)`,
                            originX: currentAngle === 0 ? '30%' : '70%',
                          }}
                          animate={{
                            scaleX: [1, 1 + currentStrength * 0.45, 0.85, 1 + currentStrength * 0.3, 1],
                            scaleY: [1, 0.82, 1.08, 0.75, 1],
                            opacity: [0.3, currentStrength * 0.75, 0.2, currentStrength * 0.6, 0.3],
                          }}
                          transition={{ duration: Math.max(0.6, dur * 0.55 - currentStrength * 0.3), repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                      {/* Floating sparks */}
                      {[...Array(7)].map((_, idx) => (
                        <motion.div
                          key={`bio-${idx}`}
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            width: idx % 2 === 0 ? '4px' : '3px',
                            height: idx % 2 === 0 ? '4px' : '3px',
                            left: `${8 + (idx * 13) % 72}%`,
                            top: `${12 + (idx * 17) % 72}%`,
                            background: bioColor.dot,
                            boxShadow: `0 0 6px ${bioColor.dot}`,
                          }}
                          animate={{ opacity: [0, 1, 0], scale: [0, 1.8, 0], y: [-4, -16, -28] }}
                          transition={{ duration: 2.2, delay: idx * 0.3, repeat: Infinity, repeatDelay: 0.8 }}
                        />
                      ))}
                    </>
                  );
                })()}

                {/* — Hiding effect: timid/skulk fish fade near rocks — */}
                {style.isTimid && !feedingActive && !isNightMode && (
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: 'rgba(0,0,0,0.62)', borderRadius: '50%' }}
                    animate={{ opacity: [0, 0, 0.62, 0.62, 0, 0] }}
                    transition={{ duration: 9, delay: i * 1.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.3, 0.4, 0.7, 0.8, 1] }}
                  />
                )}

                {/* — Playful effect: curious fish spin quickly then settle — */}
                {fish.behavior === 'curious' && !isNightMode && !feedingActive && (
                  <motion.div
                    className="absolute inset-[-6px] rounded-full pointer-events-none border"
                    style={{ borderColor: 'rgba(125,211,252,0.35)', borderStyle: 'dashed' }}
                    animate={{ rotate: [0, 360], opacity: [0, 0.5, 0.5, 0] }}
                    transition={{ duration: 5, delay: i * 2.1 + 3, repeat: Infinity, repeatDelay: 6, ease: 'linear' }}
                  />
                )}
              </motion.div>

              {/* Eating animation when feeding - removed plate emoji */}
            </div>
          );
        })}

        {fishInTank.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center glass-nav rounded-3xl px-8 py-6">
              <p className="text-sm font-medium text-foreground/80">Ton aquarium est vide</p>
              <p className="text-xs text-muted-foreground mt-1.5">Lance une session pour gagner de l'or !</p>
            </div>
          </div>
        )}

        {/* Water sounds toggle - removed, controlled via settings */}
      </motion.div>

      {/* Spacer: keeps fish area same height as when bottom was 5.5rem, background fills full screen */}
      <div className="flex-shrink-0 pointer-events-none" style={{ height: '5.5rem' }} />

      {/* Event notification - fixed top-center above everything */}
      <AnimatePresence>
        {showEventNotif && (
          <motion.div
            initial={{ opacity: 0, x: '-50%', y: -10 }}
            animate={{ opacity: 1, x: '-50%', y: 0 }}
            exit={{ opacity: 0, x: '-50%', y: -10 }}
            className="fixed z-[60] pointer-events-none glass-nav rounded-2xl px-4 py-2.5"
            style={{ top: '70px', left: '50%', width: '80%', maxWidth: '380px' }}
          >
            <p className="text-sm font-bold text-foreground text-center">{showEventNotif}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔒 Hybride secret débloqué */}
      <AnimatePresence>
        {hybridUnlocked && (
          <motion.div
            initial={{ opacity: 0, x: '-50%', y: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: '-50%', y: 0, scale: 1 }}
            exit={{ opacity: 0, x: '-50%', y: 20, scale: 0.9 }}
            className="fixed z-[61] pointer-events-none rounded-2xl px-5 py-3"
            style={{ bottom: '120px', left: '50%', background: 'linear-gradient(135deg, rgba(0,255,200,0.15), rgba(100,50,255,0.15))', border: '1px solid rgba(0,255,200,0.3)', backdropFilter: 'blur(12px)', width: '82%', maxWidth: '380px' }}
          >
            <p className="text-sm font-bold text-center" style={{ color: 'rgba(0,255,200,0.95)' }}>🔒 Espèce secrète débloquée !</p>
            <p className="text-xs text-center mt-0.5" style={{ color: 'rgba(180,255,230,0.7)' }}>Hybride Lumina — Porte exclusive</p>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Aquarium Picker Modal */}
      <AnimatePresence>
        {showAquariumPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-background/85 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowAquariumPicker(false)}
          >
            <button
              onClick={() => setShowAquariumPicker(false)}
              className="fixed top-[10px] left-5 z-[90] w-10 h-10 rounded-full card-dark flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="relative z-10 min-h-full w-full px-6 pt-16 pb-10 flex items-start justify-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full max-w-lg bg-card rounded-3xl p-6">
                <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
                <h3 className="text-lg font-bold text-foreground mb-4">Choisir un aquarium</h3>
                <div className="space-y-3">
                  {availableAquariums.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveAquarium(t.id);
                        setShowAquariumPicker(false);
                      }}
                      className={`w-full card-dark rounded-2xl overflow-hidden flex items-center gap-4 pr-4 transition-all ${
                        t.id === activeAquarium ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="w-20 h-16 overflow-hidden rounded-l-2xl flex-shrink-0">
                        <img
                          src={pickImageSrc(t.background, t.backgroundMobile)}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t.subtitle}</p>
                      </div>
                      {t.id === activeAquarium && (
                        <span className="text-primary text-xs font-bold flex-shrink-0">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="h-8" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal - Water customization */}
      {createPortal(
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-background/85 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowSettings(false)}
          >
            <button
              onClick={() => setShowSettings(false)}
              className="fixed top-[10px] left-5 z-[90] w-10 h-10 rounded-full card-dark flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="relative z-10 min-h-full w-full px-6 pt-16 pb-10 flex items-start justify-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full max-w-lg bg-card rounded-3xl p-6">
                <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
                <h3 className="text-lg font-bold text-foreground mb-6">Personnalisation</h3>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Nom du profil</p>
                    <div className="card-dark rounded-2xl px-4 py-3">
                      <input
                        value={nameDraft}
                        onChange={(event) => setNameDraft(event.target.value)}
                        onBlur={() => setUserName(nameDraft)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            (event.currentTarget as HTMLInputElement).blur();
                          }
                        }}
                        className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/60"
                        placeholder="Aquanaute"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground/70 mt-2">Appuie sur Entree pour valider</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Intensite lumineuse</p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={lightIntensity * 100}
                      onChange={e => setLightIntensity(Number(e.target.value) / 100)}
                      className="w-full accent-primary h-1"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                      <span>Sombre</span>
                      <span>Lumineux</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Teinte de l'eau</p>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={waterTint}
                      onChange={e => setWaterTint(Number(e.target.value))}
                      className="w-full accent-primary h-1"
                    />
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                      <span>Naturel</span>
                      <span>Teinte personnalisee</span>
                    </div>
                  </div>

                  {/* Sound Enable/Disable Toggle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Sons</p>
                        <p className="text-[9px] text-muted-foreground/70 mt-1">Musique et effets sonores</p>
                      </div>
                      <button
                        onClick={() => setSoundEnabled(prev => !prev)}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                          soundEnabled ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <motion.div
                          className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md"
                          animate={{ x: soundEnabled ? 28 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* ASMR Mode Toggle */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Mode ASMR</p>
                        <p className="text-[9px] text-muted-foreground/70 mt-1">Sons relaxants améliorés</p>
                      </div>
                      <button
                        onClick={() => setAsrmMode(prev => !prev)}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                          asrmMode ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <motion.div
                          className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md"
                          animate={{
                            x: asrmMode ? 28 : 0,
                          }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Mode Nuit</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsNightMode(!isNightMode)}
                        className="flex-1 card-dark rounded-2xl px-4 py-3 transition-all"
                        style={isNightMode ? { boxShadow: '0 0 0 2px #f59e0b, 0 0 8px rgba(245,158,11,0.35)' } : {}}
                      >
                        <p className="text-sm font-bold text-foreground">🌙 {isNightMode ? "Actif" : "Inactif"}</p>
                      </button>
                      <button
                        onClick={() => { setDeepNightMode(v => !v); if (!isNightMode) setIsNightMode(true); }}
                        className="flex-1 card-dark rounded-2xl px-4 py-3 transition-all"
                        style={deepNightMode ? { boxShadow: '0 0 0 2px #818cf8, 0 0 12px rgba(129,140,248,0.5)' } : {}}
                      >
                        <p className="text-sm font-bold text-foreground">🌌 {deepNightMode ? "Profonde" : "Profonde"}</p>
                        <p className="text-[10px] text-muted-foreground">{deepNightMode ? "ON" : "OFF"}</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Saison</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["spring", "summer", "autumn", "winter"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSeason(s)}
                          className="card-dark rounded-2xl px-4 py-3 transition-all"
                          style={season === s ? { boxShadow: '0 0 0 2px #f59e0b, 0 0 8px rgba(245,158,11,0.35)' } : {}}
                        >
                          <p className="text-sm font-bold text-foreground">
                            {s === "spring" && "🌸 Printemps"}
                            {s === "summer" && "☀️ Été"}
                            {s === "autumn" && "🍂 Automne"}
                            {s === "winter" && "❄️ Hiver"}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Fond marin</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["sand", "rock", "reef"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFloorType(f)}
                          className="card-dark rounded-2xl px-3 py-3 transition-all"
                          style={floorType === f ? { boxShadow: '0 0 0 2px #f59e0b, 0 0 8px rgba(245,158,11,0.35)' } : {}}
                        >
                          <p className="text-base">{f === "sand" ? "🏖️" : f === "rock" ? "🪨" : "🪸"}</p>
                          <p className="text-[10px] font-bold text-foreground mt-1">{f === "sand" ? "Sable" : f === "rock" ? "Roche" : "Récif"}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Météo</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setWeather(null)}
                        className="card-dark rounded-2xl px-4 py-3 transition-all"
                        style={weather === null ? { boxShadow: '0 0 0 2px #f59e0b, 0 0 8px rgba(245,158,11,0.35)' } : {}}
                      >
                        <p className="text-sm font-bold text-foreground">☀️ Clair</p>
                      </button>
                      <button
                        onClick={() => setWeather("storm")}
                        className="card-dark rounded-2xl px-4 py-3 transition-all"
                        style={weather === "storm" ? { boxShadow: '0 0 0 2px #f59e0b, 0 0 8px rgba(245,158,11,0.35)' } : {}}
                      >
                        <p className="text-sm font-bold text-foreground">⚡ Orage</p>
                      </button>
                      <button
                        onClick={() => setWeather("rain")}
                        className="card-dark rounded-2xl px-4 py-3 transition-all"
                        style={weather === "rain" ? { boxShadow: '0 0 0 2px #f59e0b, 0 0 8px rgba(245,158,11,0.35)' } : {}}
                      >
                        <p className="text-sm font-bold text-foreground">🌧️ Pluie</p>
                      </button>
                      <button
                        onClick={() => setWeather("fog")}
                        className="card-dark rounded-2xl px-4 py-3 transition-all"
                        style={weather === "fog" ? { boxShadow: '0 0 0 2px #f59e0b, 0 0 8px rgba(245,158,11,0.35)' } : {}}
                      >
                        <p className="text-sm font-bold text-foreground">🌫️ Brume</p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Mode Infini</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleInfiniteMode()}
                        className="flex-1 card-dark rounded-2xl px-4 py-3 transition-all"
                        style={infiniteMode ? { boxShadow: '0 0 0 2px #f59e0b, 0 0 8px rgba(245,158,11,0.35)' } : {}}
                      >
                        <p className="text-sm font-bold text-foreground">
                          ∞ {infiniteMode ? "Illimité" : "Normal"}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {infiniteMode ? "Nombre de poissons sans limite" : "Maximum par aquarium appliqué"}
                        </p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Trophées ({unlockedAchievements.length}/{ACHIEVEMENTS.length})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ACHIEVEMENTS.map((ach) => {
                        const unlocked = unlockedAchievements.includes(ach.id);
                        return (
                          <div
                            key={ach.id}
                            className={`card-dark rounded-xl px-3 py-2.5 flex items-center gap-2 transition-all ${unlocked ? "ring-1 ring-yellow-400/40" : "opacity-40"}`}
                          >
                            <span className="text-base">{ach.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-foreground truncate">{ach.title}</p>
                              <p className="text-[8px] text-muted-foreground truncate">{ach.description}</p>
                            </div>
                            {unlocked && <span className="text-yellow-400 text-xs">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="h-8" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}

      <AnimatePresence>
        {sessionComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-background/60 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setSessionComplete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 8, opacity: 0 }}
              transition={{ type: "spring", damping: 18, stiffness: 240 }}
              className="card-dark rounded-3xl px-6 py-7 text-center w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-2xl mb-3 font-semibold text-accent">Pas mal!</div>
              <h2 className="text-lg font-bold text-foreground mb-1">Belle session.</h2>
              <p className="text-[11px] text-muted-foreground mb-5">
                {sessionComplete.durationLabel} - {sessionComplete.activityLabel.toLowerCase()}
              </p>

              <div className="flex gap-3 justify-center mb-5">
                <div className="card-warm rounded-2xl px-5 py-4 text-center min-w-[110px]">
                  <p className="text-2xl font-extrabold text-gold">+{sessionComplete.reward.gold}</p>
                  <p className="text-[10px] text-foreground/60 font-semibold mt-1">Or</p>
                </div>
                <div className="card-cool rounded-2xl px-5 py-4 text-center min-w-[110px]">
                  <p className="text-2xl font-extrabold text-accent">+{sessionComplete.reward.xp}</p>
                  <p className="text-[10px] text-foreground/60 font-semibold mt-1">XP</p>
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
                Retour a l'aquarium
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
