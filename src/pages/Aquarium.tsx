import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

// Module-level frozen arrays → stable references → Framer Motion never sees a "changed" animate prop → no restart flicker
const SWIM_ROTATE_Z = Object.freeze([0, 2, -1, 1.5, -0.5, 0]) as number[];
const CRIT_ROTATE_Z = Object.freeze([-8, -5, -8]) as number[];
const FEED_ROTATE_Z = Object.freeze([0, 5, -5, 5, 0]) as number[];
const CLICK_ROTATE_Z = Object.freeze([0, -15, 15, -10, 10, 0]) as number[];
const CLICK_SCALE = Object.freeze([1, 1.3, 1.2, 1.1, 1]) as number[];

export default function Aquarium() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gold, level, xpProgress, totalXP, activeAquarium, aquariumFish, userName, setActiveAquarium, ownedAquariums, sessions, companionLevel, setUserName, incrementFeedCount, infiniteMode, toggleInfiniteMode, fishInstances, lastAchievementUnlocked, clearLastAchievement, unlockedAchievements, spendGold } = useGame();
  const theme = AQUARIUM_THEMES.find(t => t.id === activeAquarium) || AQUARIUM_THEMES[0];
  const themeBackground = pickImageSrc(theme.background, theme.backgroundMobile);
  const fishInTank = (aquariumFish[activeAquarium] || [])
    .map(id => FISH_CATALOG.find(f => f.id === id))
    .filter((fish): fish is Fish => Boolean(fish));
  const schoolFish = useMemo(() => {
    const base = fishInTank.length ? fishInTank : FISH_CATALOG;
    if (base.length === 0) return [];
    const targetCount = 9;
    return Array.from({ length: targetCount }, (_, i) => base[i % base.length]);
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
  const [fishFedPositions, setFishFedPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [weather, setWeather] = useState<"storm" | null>(null);
  const [floorType, setFloorType] = useState<"sand" | "rock" | "reef">("sand");
  const [season, setSeason] = useState<"spring" | "summer" | "autumn" | "winter">("spring");
  const [isNightMode, setIsNightMode] = useState(false);
  const [showDecorations, setShowDecorations] = useState(true);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [fishPositions, setFishPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [carnivorePositions, setCarnivorePositions] = useState<{ x: number; y: number }[]>([]);
  const [fishHealths, setFishHealths] = useState<Record<string, number>>({});
  const [asrmMode, setAsrmMode] = useState(false);
  const [waterQuality, setWaterQuality] = useState({ ph: 7.2, nitrates: 10, health: 95 });
  const [filterBroken, setFilterBroken] = useState(false);
  const [showEventNotif, setShowEventNotif] = useState<string | null>(null);
  const [sessionComplete, setSessionComplete] = useState<{
    reward: { gold: number; xp: number };
    activityLabel: string;
    durationLabel: string;
  } | null>(null);

  // Fish personalities (generated once per fish)
  const fishPersonalities = useMemo(() => 
    fishInTank.map((fish, i) => {
      // Use fish ID and index for deterministic pseudorandom values
      const seed = fish.id.charCodeAt(0) + fish.id.charCodeAt(fish.id.length - 1) + i;
      const pseudoRandom = (Math.sin(seed) * 10000) % 1;
      const pseudoRandom2 = (Math.cos(seed * 2) * 10000) % 1;
      
      return {
        trait: ["bold", "timid", "playful", "lazy", "curious", "territorial"][Math.floor((fish.id.charCodeAt(0) + i) % 6)] as "bold" | "timid" | "playful" | "lazy" | "curious" | "territorial",
        energy: 0.5 + (Math.sin(fish.id.charCodeAt(0) + i) * 0.5 + 0.5) * 0.5, // 0.5-1.0
        curiosity: fish.behavior === "curious" ? 0.8 : 0.2 + Math.abs(pseudoRandom) * 0.3,
        preferredDepth: fish.behavior === "solitary" ? "bottom" as const : 
                        fish.swimSpeed === "fast" ? "surface" as const : 
                        "middle" as const,
        dominance: Math.abs(pseudoRandom2), // 0-1, affects social hierarchy
        aggression: fish.diet === "Carnivore" ? 0.6 + Math.abs(pseudoRandom) * 0.4 : Math.abs(pseudoRandom) * 0.3,
        health: 100, // Individual health tracking
        stressed: false,
      };
    }),
    [fishInTank]
  );

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

  // Track mouse position for curious fish
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.querySelector('.fish-swimming-area')?.getBoundingClientRect();
      if (rect) {
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update fish positions for sand particles and shrimp prey systems
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const newPositions: Record<string, { x: number; y: number }> = {};
      const newCarnivores: { x: number; y: number }[] = [];
      
      fishInTank.forEach((fish, i) => {
        const fishKey = `${fish.id}-${i}`;
        const style = getFishStyle(i);
        
        // Get current position based on animation cycle
        // This is an approximation - we extract startX/Y and assume fish is mid-cycle
        const baseX = parseFloat(style.startX);
        const baseY = parseFloat(style.startY);
        
        // Add some variation to simulate movement
        const movementPhase = (Date.now() / (style.duration * 1000)) % 1;
        const movementIndex = Math.floor(movementPhase * (style.movementX.length - 1));
        const offsetX = style.movementX[movementIndex] || 0;
        const offsetY = style.movementY[movementIndex] || 0;
        
        const currentX = baseX + offsetX;
        const currentY = baseY + offsetY;
        
        newPositions[fishKey] = { x: currentX, y: currentY };
        
        // Track carnivorous fish positions for hunting
        if (fish.diet === "Carnivore") {
          newCarnivores.push({ x: currentX, y: currentY });
        }
      });
      
      setFishPositions(newPositions);
      setCarnivorePositions(newCarnivores);
    }, 500); // Update every 500ms
    
    return () => clearInterval(updateInterval);
  }, [fishInTank, isNightMode, fishPersonalities]);

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
    const newHealths: Record<string, number> = {};
    fishInTank.forEach((fish, i) => {
      const fishKey = `${fish!.id}-${i}`;
      if (!(fishKey in fishHealths)) {
        newHealths[fishKey] = 100; // Start at full health
      } else {
        newHealths[fishKey] = fishHealths[fishKey];
      }
    });
    setFishHealths(newHealths);
  }, [fishInTank]);

  // Health system: decrease/increase over time based on conditions
  useEffect(() => {
    const healthInterval = setInterval(() => {
      setFishHealths(prev => {
        const updated = { ...prev };
        
        fishInTank.forEach((fish, i) => {
          const fishKey = `${fish!.id}-${i}`;
          const personality = fishPersonalities[i];
          const currentHealth = updated[fishKey] || 100;
          
          if (currentHealth <= 0) return; // Fish is already dead
          
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
          updated[fishKey] = Math.max(0, Math.min(100, currentHealth + healthChange));
        });
        
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

  // Glass tap + circle swim + eating frenzy random events
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
        }
      }
    }, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [fishInTank.length]);

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
        
        return { ph: newPh, nitrates: newNitrates, health: Math.floor(newHealth) };
      });
    }, 30000); // Check every 30s
    
    return () => clearInterval(eventInterval);
  }, [filterBroken]);

  // Reset fish positions when starting a new feeding session
  useEffect(() => {
    if (feedingActive) {
      // Clear saved positions so fish swim to food again
      setFishFedPositions({});
    }
  }, [feedingActive]);

  const availableAquariums = AQUARIUM_THEMES.filter(t => ownedAquariums.includes(t.id));

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

    // Spread fish across the full tank horizontally (5% to 78%)
    const startXPct = 5 + q1 * 73;

    // Vertical start zone based on depth preference
    let startY: number;
    if (personality.preferredDepth === "bottom") {
      startY = 62 + q2 * 18; // 62–80% (near bottom)
    } else if (personality.preferredDepth === "surface") {
      startY = 5 + q3 * 18;  // 5–23% (near surface)
    } else if (isDominant) {
      startY = 30 + q1 * 25; // 30–55% (mid tank, prominent)
    } else {
      startY = 10 + q1 * 60; // 10–70% (anywhere)
    }

    // Bounded movement paths: keep fish inside tank (0–100% horizontal)
    // movementX is pixels from startX. Max safe right: (100-startXPct)/100*380
    // Max safe left: -(startXPct-2)/100*380
    const tankW = 375;
    const safeRight = Math.round(((92 - startXPct) / 100) * tankW);
    const safeLeft  = -Math.round(((startXPct - 3) / 100) * tankW);

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
      // 1. SCHOOLING — formation swimming across the full tank
      case "school": {
        const lane = (i % 4) * 10;
        movementX = [0, Math.round(safeRight*0.28)+lane, Math.round(safeRight*0.68)+lane, safeRight, Math.round(safeRight*0.52)+lane, Math.round(safeLeft*0.25)+lane, Math.round(safeLeft*0.6), 0];
        movementY = [0, -22, 12, -18, 6, 20, -12, 0];
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
      // 5. HOVER — tired/night/lazy: near-stationary gentle bob
      case "hover": {
        const hR = Math.round(safeRight * 0.22);
        const hL = Math.round(safeLeft * 0.22);
        movementX = [0, hR, hL, Math.round(hR*0.5), Math.round(hL*0.6), 0];
        movementY = [0, -18, 28, -14, 22, 0];
        if (isNightMode) {
          movementX = movementX.map(x => Math.round(x * 0.35));
          movementY = movementY.map(y => Math.round(y * 0.3 + 40));
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
      // 7. SKULK — timid fish: tight nervous movements near starting corner
      case "skulk": {
        const sk = Math.round(Math.min(Math.abs(safeLeft), safeRight) * 0.42);
        movementX = [0, sk, Math.round(-sk*0.7), Math.round(sk*0.4), Math.round(-sk*0.9), Math.round(sk*0.6), 0];
        movementY = [0, Math.round(-vRange*0.28), Math.round(vRange*0.38), Math.round(-vRange*0.22), Math.round(vRange*0.18), Math.round(-vRange*0.12), 0];
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

    // SOCIAL HIERARCHY: Dominant fish are slightly larger
    let sizeClass = fish?.rarity === "legendary" ? "w-20 h-20" : 
                    fish?.rarity === "epic" ? "w-18 h-18" : 
                    "w-14 h-14";
    
    if (isDominant && fish?.rarity !== "legendary") {
      sizeClass = fish?.rarity === "epic" ? "w-20 h-20" : "w-16 h-16";
    }
    
    return {
      startX: `${Math.round(startXPct)}%`,
      startY: `${Math.round(startY)}%`,
      startYNum: startY,
      duration,
      movementX,
      movementY,
      scaleX: i % 3 === 0 ? -1 : 1,
      size: sizeClass,
      delay: i * 0.5,
      personality,
      isDominant,
      isTimid,
      isAggressive,
    };
  }, [fishInTank, fishPersonalities, isNightMode]);

  // Stable memoized styles — prevents Framer Motion from restarting on every state update
  const fishStyles = useMemo(
    () => fishInTank.map((_, i) => getFishStyle(i)),
    [fishInTank, getFishStyle]
  );

  // Fish facing direction — useRef so DOM updates never trigger React re-renders
  const fishDirections = useRef<Record<number, number>>({});
  const fishDirEls = useRef<Record<number, HTMLDivElement | null>>({});
  useEffect(() => {
    const interval = setInterval(() => {
      fishStyles.forEach((s, i) => {
        if (!s) return;
        const cycleMs = s.duration * 1000;
        const phase = ((Date.now() + s.delay * 1000) % cycleMs) / cycleMs;
        const n = s.movementX.length;
        const ki = Math.min(Math.floor(phase * n), n - 2);
        const dx = (s.movementX[ki + 1] ?? 0) - (s.movementX[ki] ?? 0);
        const dir = dx >= 0 ? 1 : -1;
        if (fishDirections.current[i] !== dir) {
          fishDirections.current[i] = dir;
          const el = fishDirEls.current[i];
          if (el) el.style.transform = `scaleX(${dir})`;
        }
      });
    }, 280);
    return () => clearInterval(interval);
  }, [fishStyles]);

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

  // Season colors
  const seasonColors = {
    spring: { hue: 120, saturation: 50, brightness: 55 },
    summer: { hue: 45, saturation: 60, brightness: 60 },
    autumn: { hue: 25, saturation: 55, brightness: 50 },
    winter: { hue: 200, saturation: 40, brightness: 45 },
  };

  const currentSeasonColor = seasonColors[season];

  return (
    <div className="fixed inset-x-0 top-0 flex flex-col" style={{ bottom: 0 }}>
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

      <Bubbles count={25} />

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
        {Array.from({ length: 8 }, (_, i) => (
          <motion.div
            key={`bokeh-${i}`}
            className="absolute rounded-full blur-xl"
            style={{
              width: 60 + Math.random() * 80,
              height: 60 + Math.random() * 80,
              background: `radial-gradient(circle, rgba(255,255,255,${0.02 + Math.random() * 0.04}) 0%, transparent 70%)`,
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

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
            {Array.from({ length: 8 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 40 + Math.random() * 60,
                  height: 40 + Math.random() * 60,
                  left: `${10 + i * 12}%`,
                  top: `${20 + (i % 3) * 25}%`,
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
        onComplete={() => setFeedingActive(false)} 
      />

      {/* Weather effects */}
      <WeatherEffects type={weather} />

      {/* Parallax depth layers */}
      <ParallaxLayers />

      {/* Bokeh background effect */}
      <BokehEffect />

      {/* Light rays from surface */}
      <LightRays count={6} intensity={lightIntensity} />

      {/* Surface reflections and caustics */}
      <SurfaceReflections />

      {/* Ambient music system */}
      <AmbientMusic theme={theme.id} volume={soundEnabled ? (asrmMode ? 0.003 : 0.05) : 0} season={season} />

      {/* Fish swimming sounds */}
      <FishSounds fishCount={fishInTank.length} volume={soundEnabled ? (asrmMode ? 0.003 : 0.03) : 0} />

      {/* ASMR mode enhanced sounds */}
      <ASMRSounds enabled={asrmMode && soundEnabled} volume={0.05} isRaining={false} isNight={isNightMode} />

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
      </AnimatePresence>

      {/* UI layer */}
      <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-20 pointer-events-none flex-shrink-0 w-full"
          >
            {/* Top bar header */}
            <div className="relative z-20 px-5 pt-6 pb-3 pointer-events-auto">
              <div className="glass-nav rounded-2xl px-4 py-3 flex items-center justify-between">
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
              <motion.div 
                className="glass-nav rounded-2xl px-3 py-2 mt-3 flex items-center justify-between gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
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
                    <p className="text-xs font-bold text-foreground">{currentTemperature}°C</p>
                  </div>
                </div>

                <div className="h-6 w-px bg-foreground/10" />

                {/* Feed button */}
                <button
                  onClick={() => {
                    setFeedingActive(true);
                    incrementFeedCount();
                  }}
                  disabled={feedingActive}
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
                        {waterQuality.nitrates}
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
              </motion.div>
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
          </motion.div>

      {/* Fish swimming area */}
      <div className="fish-swimming-area relative z-10 flex-1 overflow-hidden min-h-0">

        {/* === Aquarium decorations inside bounded fish area === */}

        {/* Animated coral decorations */}
        <AnimatedCorals />

        {/* Hiding rocks for fish to play around */}
        <HidingRocks />

        {/* Dynamic algae swaying at the bottom */}
        <Algae count={10} />

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

        {/* Thermocline - visible temperature layer at mid-tank depth */}
        <motion.div
          className="absolute left-0 right-0 pointer-events-none z-[5]"
          style={{ top: '50%', height: '3px' }}
          animate={{ opacity: [0, 0.07, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-full h-full" style={{ background: 'linear-gradient(to right, transparent 0%, rgba(100,200,255,0.6) 20%, rgba(150,230,255,0.8) 50%, rgba(100,200,255,0.6) 80%, transparent 100%)', filter: 'blur(2px)' }} />
        </motion.div>

        {/* Sand particles triggered by fish near bottom */}
        <SandParticles 
          fishPositions={Object.entries(fishPositions).map(([id, pos]) => ({
            x: pos.x,
            y: pos.y,
            active: pos.y > 70,
          }))}
        />

        {/* Shrimp prey system for carnivorous fish */}
        <ShrimpPrey 
          carnivorePositions={carnivorePositions}
          onShrimpCaught={() => {
            // Optional: add points or feedback when fish catches shrimp
          }}
        />

        {/* Fish Games System */}
        <FishGames 
          fishCount={fishInTank.length}
          fishPositions={fishPositions}
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
          
          // Curious fish follow mouse
          const isCurious = style.personality.curiosity > 0.6;
          const followMouse = isCurious && mousePosition && !feedingActive && !isCriticalHealth;
          // Mouse follow: convert % position to px (estimate swim area 350x580)
          const swimW = 350, swimH = 580;
          const mouseTargetX = followMouse ? (mousePosition.x / 100) * swimW : 0;
          const mouseTargetY = followMouse ? ((mousePosition.y - style.startYNum) / 100) * swimH * 0.7 : 0;
          // fish spread across tank; target food in px relative to start
          // During feeding, fish dart horizontally & vertically to where food lands
          const swimAreaWidth = 350; // safe mobile estimate
          const swimAreaHeight = 580;
          const foodPx = (12 + (i * 14) % 68) / 100 * swimAreaWidth;
          const foodYPct = 38 + (i % 5) * 8; // 38-70% from top
          const foodYPx = (foodYPct / 100) * swimAreaHeight - (style.startYNum / 100) * swimAreaHeight;
          const feedingTargetX = feedingActive ? foodPx : 0;
          const feedingTargetY = feedingActive ? foodYPx : 0;
          
          // Get saved position after feeding (if exists)
          const savedPos = fishFedPositions[fishKey];
          const hasEaten = !feedingActive && savedPos;

          // Fish aging: older fish are slightly larger
          const fishInstance = fishInstances.find((fi) => fi.fishId === fish.id);
          const ageScale = fishInstance ? Math.min(1 + (fishInstance.age - 7) * 0.0015, 1.3) : 1.0;
          
          // Face direction: 1=right -1=left (ref-based, render only sets initial value)
          const faceDir = followMouse
            ? (mouseTargetX > 0 ? 1 : mouseTargetX < 0 ? -1 : (fishDirections.current[i] ?? 1))
            : feedingActive
            ? (feedingTargetX > 0 ? 1 : feedingTargetX < 0 ? -1 : (fishDirections.current[i] ?? 1))
            : (fishDirections.current[i] ?? style.scaleX);
          
          return (
            <div key={fishKey} className="absolute" style={{ left: style.startX, top: style.startY, transform: `scale(${ageScale})`, transformOrigin: 'center bottom' }}>
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
              
              {/* Fish body - smooth x/y movement, direction via scaleX state */}
              <motion.div
                className={`${style.size} cursor-pointer relative z-10`}
                initial={{ x: 0, y: 0, rotateZ: 0, scale: 1 }}
                animate={{
                  x: followMouse
                      ? mouseTargetX
                      : feedingActive
                        ? feedingTargetX
                        : style.movementX,
                  y: followMouse
                      ? mouseTargetY
                      : feedingActive
                        ? feedingTargetY
                        : isCriticalHealth
                          ? style.movementY.map(y => y + 25)
                          : style.movementY,
                  rotateZ: isClicked
                    ? CLICK_ROTATE_Z
                    : isCriticalHealth
                      ? CRIT_ROTATE_Z
                      : feedingActive
                        ? FEED_ROTATE_Z
                        : SWIM_ROTATE_Z,
                  scale: isClicked ? CLICK_SCALE : 1,
                }}
                transition={{
                  x: followMouse
                      ? { duration: 0.8, ease: "easeOut" }
                      : feedingActive
                        ? { duration: 0.7 + i * 0.1, ease: [0.2, 0, 0.4, 1] }
                        : { duration: style.duration * healthSpeedMod, repeat: Infinity, ease: "easeInOut", delay: style.delay },
                  y: followMouse
                      ? { duration: 0.8, ease: "easeOut" }
                      : feedingActive
                        ? { duration: 0.7 + i * 0.1, ease: [0.2, 0, 0.4, 1] }
                        : { duration: style.duration * healthSpeedMod, repeat: Infinity, ease: "easeInOut", delay: style.delay },
                  rotateZ: isClicked
                    ? { duration: 0.6, ease: "easeOut" }
                    : isCriticalHealth
                      ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      : feedingActive
                        ? { duration: 0.4, repeat: 4, ease: "easeInOut", delay: 1.5 + i * 0.15 }
                        : { duration: style.duration / 2, repeat: Infinity, ease: "easeInOut" },
                  scale: isClicked ? { duration: 0.6, ease: "backOut" } : { duration: 1 },
                }}
                onAnimationComplete={() => {
                  // Save position when feeding animation completes
                  if (feedingActive && !fishFedPositions[fishKey]) {
                    setFishFedPositions(prev => ({
                      ...prev,
                      [fishKey]: { x: feedingTargetX, y: feedingTargetY }
                    }));
                  }
                }}
                onClick={() => {
                  setClickedFishId(fishKey);
                  setTimeout(() => setClickedFishId(null), 600);
                }}
                whileHover={{ scale: 1.1 }}
              >
                {/* Direction wrapper - set initial from render, then interval updates DOM directly (zero re-renders) */}
                <div ref={(el) => { fishDirEls.current[i] = el; }} style={{ transform: `scaleX(${faceDir})`, width: '100%', height: '100%' }}>
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
                </div>
                
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

                {/* Crown: only the most dominant fish */}
                {(() => {
                  const kingIndex = fishInTank.reduce((best, _, idx) =>
                    (fishPersonalities[idx]?.dominance ?? 0) > (fishPersonalities[best]?.dominance ?? 0) ? idx : best
                  , 0);
                  const isKing = i === kingIndex && (fishPersonalities[i]?.dominance ?? 0) > 0.5;
                  return isKing ? (
                  <motion.div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 text-xl"
                    animate={{
                      y: [-2, 2, -2],
                      rotate: [-5, 5, -5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    👑
                  </motion.div>
                  ) : null;
                })()}

                {/* Sleep indicator during night mode */}
                {isNightMode && (
                  <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs pointer-events-none"
                    animate={{ y: [-2, -12, -22], opacity: [0, 0.9, 0] }}
                    transition={{
                      duration: 2.5,
                      delay: i * 0.7,
                      repeat: Infinity,
                      repeatDelay: 2,
                      ease: "easeOut",
                    }}
                  >
                    💤
                  </motion.div>
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

                {/* Territorial zone - shaded boundary circle around territorial fish */}
                {style.personality.trait === "territorial" && (
                  <motion.div
                    className="absolute rounded-full pointer-events-none -z-10"
                    style={{
                      width: 110,
                      height: 110,
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      border: "1.5px dashed rgba(255,180,50,0.35)",
                      background: "radial-gradient(circle, rgba(255,160,30,0.06) 0%, transparent 70%)",
                    }}
                    animate={{
                      scale: [1, 1.08, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
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
                
                {isClicked && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 2, opacity: [0, 1, 0] }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 rounded-full border-2 border-accent"
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
      </div>

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
            style={{ top: '175px', left: '50%', width: '80%', maxWidth: '380px' }}
          >
            <p className="text-sm font-bold text-foreground text-center">{showEventNotif}</p>
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
