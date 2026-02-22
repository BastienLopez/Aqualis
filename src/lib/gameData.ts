// Fish images
import neonTetra from "@/assets/fish/neon-tetra.png";
import neonTetraMobile from "@/assets/fish/neon-tetra-mobile.png";
import guppy from "@/assets/fish/guppy.png";
import guppyMobile from "@/assets/fish/guppy-mobile.png";
import zebraDanio from "@/assets/fish/zebra-danio.png";
import zebraDanioMobile from "@/assets/fish/zebra-danio-mobile.png";
import betta from "@/assets/fish/betta.png";
import bettaMobile from "@/assets/fish/betta-mobile.png";
import cherryBarb from "@/assets/fish/cherry-barb.png";
import cherryBarbMobile from "@/assets/fish/cherry-barb-mobile.png";
import angelfish from "@/assets/fish/angelfish.png";
import angelfishMobile from "@/assets/fish/angelfish-mobile.png";
import discus from "@/assets/fish/discus.png";
import discusMobile from "@/assets/fish/discus-mobile.png";
import mandarinfish from "@/assets/fish/mandarinfish.png";
import mandarinfishMobile from "@/assets/fish/mandarinfish-mobile.png";
import lionfish from "@/assets/fish/lionfish.png";
import lionfishMobile from "@/assets/fish/lionfish-mobile.png";
import seahorse from "@/assets/fish/seahorse.png";
import seahorseMobile from "@/assets/fish/seahorse-mobile.png";
import jellyfish from "@/assets/fish/jellyfish.png";
import jellyfishMobile from "@/assets/fish/jellyfish-mobile.png";

// Aquarium backgrounds
import aquariumDeep from "@/assets/aquarium-deep.jpg";
import aquariumDeepMobile from "@/assets/aquarium-deep-mobile.jpg";
import aquariumReef from "@/assets/aquarium-reef.jpg";
import aquariumReefMobile from "@/assets/aquarium-reef-mobile.jpg";
import aquariumAbyss from "@/assets/aquarium-abyss.jpg";
import aquariumAbyssMobile from "@/assets/aquarium-abyss-mobile.jpg";
import aquariumPandemonium from "@/assets/aquarium-pandemonium.jpg";
import aquariumPandemoniumMobile from "@/assets/aquarium-pandemonium-mobile.jpg";

export type Rarity = "common" | "rare" | "epic" | "legendary";
export type ActivityType = "work" | "study" | "sport" | "custom";
export type FishGender = "male" | "female";
export type GeneticTrait = "color" | "pattern" | "size" | "speed";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_fish", title: "Premier Habitant", description: "Acheter ton premier poisson", emoji: "🐠" },
  { id: "first_session", title: "Premier Effort", description: "Terminer ta première session", emoji: "⏱️" },
  { id: "legend_owned", title: "Légende Vivante", description: "Posséder un poisson légendaire", emoji: "⭐" },
  { id: "feed_10", title: "Nourricier", description: "Nourrir les poissons 10 fois", emoji: "🍴" },
  { id: "feed_100", title: "Chef Cuisinier", description: "Nourrir 100 fois", emoji: "👨‍🍳" },
  { id: "sessions_10", title: "Assidu", description: "10 sessions complétées", emoji: "🏆" },
  { id: "one_hour", title: "Heure de Gloire", description: "Session d’ 1 heure ou plus", emoji: "⏰" },
  { id: "collector", title: "Collectionneur", description: "Posséder 5 espèces différentes", emoji: "🎯" },
  { id: "aquarium_2", title: "Explorateur", description: "Posséder 2 aquariums", emoji: "🏔️" },
  { id: "breeder", title: "Éleveur", description: "Premier bébé poisson né", emoji: "🐣" },
];

export interface Fish {
  id: string;
  name: string;
  scientificName: string;
  rarity: Rarity;
  basePrice: number;
  image: string;
  imageMobile?: string;
  description: string;
  size: string;
  temperature: string;
  diet: string;
  swimSpeed?: "slow" | "normal" | "fast";
  behavior?: "solitary" | "curious" | "schooling";
  canBreed?: boolean;
  breedingLevel?: number;
  lifespan?: number; // in days
  specialEffect?: "sparkles" | "glow" | "trail" | "aura";
}

export interface FishInstance {
  instanceId: string;
  fishId: string;
  gender: FishGender;
  age: number; // in days
  genetics: {
    color: number; // 0-100
    pattern: number;
    size: number;
    speed: number;
  };
  /** Hidden bioluminescent trait – only appears at night or under specific conditions */
  hiddenTraits?: {
    bioluminescent?: "none" | "soft" | "reactive" | "intense";
    fractalPattern?: boolean;
    /** 0–1 inherited dominance bias — shifts personality toward dominant/timid */
    dominanceBias?: number;
    /** 0–1 inherited timidity bias — shy parents produce shy babies */
    timidityBias?: number;
    /** Secret hybrid: emerges when fractalPattern + bioluminescent=intense co-occur */
    secretHybrid?: boolean;
  };
  isBaby: boolean;
  birthDate: string;
  parents?: { mother: string; father: string };
}

export interface BreedingPair {
  id: string;
  motherId: string;
  fatherId: string;
  status: "courting" | "breeding" | "egg";
  startDate: string;
  eggLaidDate?: string;
  hatchDate?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  emoji?: string;
  type: "daily" | "weekly" | "achievement";
  requirement: number;
  progress: number;
  reward: { gold?: number; xp?: number; fish?: string };
  completed: boolean;
  expiresAt?: string;
}

export interface AquariumTheme {
  id: string;
  name: string;
  subtitle: string;
  background: string;
  backgroundMobile?: string;
  unlockLevel: number;
  price: number;
  description: string;
}

export const MAX_FISH_PER_AQUARIUM = 25;

export const FISH_CATALOG: Fish[] = [
  // Communs
  {
    id: "neon-tetra",
    name: "Néon Tétra",
    scientificName: "Paracheirodon innesi",
    rarity: "common",
    basePrice: 50,
    image: neonTetra,
    imageMobile: neonTetraMobile,
    description: "Un petit poisson vibrant avec une bande bleue irisée. Originaire des eaux sombres d'Amérique du Sud.",
    size: "3.5 cm",
    temperature: "20-26°C",
    diet: "Herbivore",
    swimSpeed: "fast",
    behavior: "schooling",
  },
  {
    id: "guppy",
    name: "Guppy",
    scientificName: "Poecilia reticulata",
    rarity: "common",
    basePrice: 60,
    image: guppy,
    imageMobile: guppyMobile,
    description: "L'un des poissons d'eau douce les plus populaires avec une queue arc-en-ciel spectaculaire.",
    size: "5 cm",
    temperature: "22-28°C",
    diet: "Herbivore",
    swimSpeed: "normal",
    behavior: "schooling",
  },
  {
    id: "zebra-danio",
    name: "Zébra Danio",
    scientificName: "Danio rerio",
    rarity: "common",
    basePrice: 70,
    image: zebraDanio,
    imageMobile: zebraDanioMobile,
    description: "Un poisson résistant et actif avec des rayures horizontales distinctives.",
    size: "6 cm",
    temperature: "18-24°C",
    diet: "Omnivore",
    swimSpeed: "fast",
    behavior: "schooling",
  },
  // Rares
  {
    id: "betta",
    name: "Betta",
    scientificName: "Betta splendens",
    rarity: "rare",
    basePrice: 150,
    image: betta,
    imageMobile: bettaMobile,
    description: "Le combattant du Siam, connu pour ses nageoires fluides spectaculaires et ses couleurs vibrantes.",
    size: "7 cm",
    temperature: "24-30°C",
    diet: "Carnivore",
    swimSpeed: "slow",
    behavior: "solitary",
  },
  {
    id: "cherry-barb",
    name: "Barbus Cerise",
    scientificName: "Puntius titteya",
    rarity: "rare",
    basePrice: 180,
    image: cherryBarb,
    imageMobile: cherryBarbMobile,
    description: "Un poisson d'un rouge éclatant endémique du Sri Lanka.",
    size: "5 cm",
    temperature: "23-27°C",
    diet: "Herbivore",
    swimSpeed: "normal",
    behavior: "schooling",
  },
  {
    id: "angelfish",
    name: "Scalaire",
    scientificName: "Pterophyllum scalare",
    rarity: "rare",
    basePrice: 220,
    image: angelfish,
    imageMobile: angelfishMobile,
    description: "Un cichlidé élégant et triangulaire avec de longues nageoires fluides.",
    size: "15 cm",
    temperature: "24-30°C",
    diet: "Omnivore",
    swimSpeed: "slow",
    behavior: "curious",
    specialEffect: "sparkles",
  },
  // Épiques
  {
    id: "discus",
    name: "Discus",
    scientificName: "Symphysodon spp.",
    rarity: "epic",
    basePrice: 450,
    image: discus,
    imageMobile: discusMobile,
    description: "Le roi des poissons d'eau douce. Corps rond et plat aux motifs de couleurs hypnotisants.",
    size: "20 cm",
    temperature: "26-30°C",
    diet: "Omnivore",
    swimSpeed: "slow",
    behavior: "curious",
  },
  {
    id: "mandarinfish",
    name: "Poisson Mandarin",
    scientificName: "Synchiropus splendidus",
    rarity: "epic",
    basePrice: 600,
    image: mandarinfish,
    imageMobile: mandarinfishMobile,
    description: "L'un des poissons les plus colorés de l'océan. Son motif psychédélique n'a aucun égal.",
    size: "8 cm",
    temperature: "24-27°C",
    diet: "Carnivore",
    swimSpeed: "slow",
    behavior: "solitary",
  },
  // Légendaires
  {
    id: "lionfish",
    name: "Rascasse Volante",
    scientificName: "Pterois volitans",
    rarity: "legendary",
    basePrice: 1200,
    image: lionfish,
    imageMobile: lionfishMobile,
    description: "Un prédateur majestueux avec des nageoires en éventail et des épines venimeuses.",
    size: "38 cm",
    temperature: "22-28°C",
    diet: "Carnivore",
    swimSpeed: "slow",
    behavior: "solitary",
    canBreed: true,
    breedingLevel: 8,
    lifespan: 90,
    specialEffect: "trail",
  },
  {
    id: "seahorse",
    name: "Hippocampe",
    scientificName: "Hippocampus kuda",
    rarity: "legendary",
    basePrice: 1500,
    image: seahorse,
    imageMobile: seahorseMobile,
    description: "Une créature mystique qui dérive verticalement dans l'eau. Les mâles portent les œufs.",
    size: "17 cm",
    temperature: "22-26°C",
    diet: "Carnivore",
    swimSpeed: "slow",
    behavior: "curious",
    canBreed: true,
    breedingLevel: 10,
    lifespan: 120,
    specialEffect: "glow",
  },
  {
    id: "jellyfish",
    name: "Méduse Lunaire",
    scientificName: "Aurelia aurita",
    rarity: "legendary",
    basePrice: 2000,
    image: jellyfish,
    imageMobile: jellyfishMobile,
    description: "Une créature éthérée et bioluminescente d'une pure élégance. Le symbole ultime de la patience.",
    size: "25 cm",
    temperature: "15-20°C",
    diet: "Carnivore",
    swimSpeed: "slow",
    behavior: "solitary",
    canBreed: true,
    breedingLevel: 12,
    lifespan: 180,
    specialEffect: "aura",
  },
];

export const AQUARIUM_THEMES: AquariumTheme[] = [
  {
    id: "deep",
    name: "Nuit Profonde",
    subtitle: "Focus intense",
    background: aquariumDeep,
    backgroundMobile: aquariumDeepMobile,
    unlockLevel: 0,
    price: 0,
    description: "Un canyon sous-marin sombre et serein avec des rayons de lumière subtils.",
  },
  {
    id: "reef",
    name: "Récif Lumineux",
    subtitle: "Apprentissage & Croissance",
    background: aquariumReef,
    backgroundMobile: aquariumReefMobile,
    unlockLevel: 0,
    price: 0,
    description: "Un récif corallien vibrant baigné de lumière tropicale.",
  },
  {
    id: "abyss",
    name: "Abysses Profondes",
    subtitle: "Discipline à long terme",
    background: aquariumAbyss,
    backgroundMobile: aquariumAbyssMobile,
    unlockLevel: 3,
    price: 0,
    description: "Les profondeurs mystérieuses avec des particules bioluminescentes.",
  },
  {
    id: "pandemonium",
    name: "Pandémonium",
    subtitle: "L'enfer élégant",
    background: aquariumPandemonium,
    backgroundMobile: aquariumPandemoniumMobile,
    unlockLevel: 5,
    price: 500,
    description: "Un aquarium infernal aux teintes rouges profondes. Pour les plus déterminés.",
  },
];

export const SESSION_DURATIONS = [
  { minutes: 20, gold: 15, label: "20 min" },
  { minutes: 30, gold: 25, label: "30 min" },
  { minutes: 45, gold: 40, label: "45 min" },
  { minutes: 60, gold: 90, label: "1h" },
  { minutes: 120, gold: 110, label: "2h" },
  { minutes: 180, gold: 300, label: "3h" },
];

export const COMPANION_FISH_ID = "companion-koi";

export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 10));
}

export function xpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel + 1, 2) * 10;
}

export function calculatePrice(basePrice: number, level: number): number {
  return Math.round(basePrice * (1 + level / 20));
}

export function calculateGoldReward(minutes: number, isSport: boolean, isFirstOfDay: boolean): number {
  const base = SESSION_DURATIONS.find(d => d.minutes === minutes);
  let gold = base ? base.gold : Math.round(minutes * 0.5);
  if (isSport) gold = Math.round(gold * 1.1);
  if (isFirstOfDay) gold = Math.round(gold * 1.2);
  return gold;
}

// Daily Quests Generation - 50 total quests, 3 active at a time
export function generateDailyQuests(date: string): Quest[] {
  const seed = new Date(date).getDate();
  
  const questTemplates = [
    // ── FOCUS & SESSIONS (20) ────────────────────────────────────────────────
    {
      id: "session-20", title: "Premier plongeon", emoji: "🌊",
      description: "Complète une session de 20 min",
      requirement: 1, reward: { gold: 30, xp: 20 }
    },
    {
      id: "session-45", title: "Zone de flow", emoji: "⚡",
      description: "Complète une session de 45 min sans pause",
      requirement: 1, reward: { gold: 75, xp: 45 }
    },
    {
      id: "session-60", title: "L'heure dorée", emoji: "🏅",
      description: "Tiens une session complète d'1 heure",
      requirement: 1, reward: { gold: 120, xp: 60 }
    },
    {
      id: "session-90", title: "Endurance mentale", emoji: "🔥",
      description: "90 minutes de concentration pure",
      requirement: 1, reward: { gold: 180, xp: 90 }
    },
    {
      id: "session-120", title: "Bloc de travail profond", emoji: "🧠",
      description: "Complète une session de 2 heures",
      requirement: 1, reward: { gold: 250, xp: 120 }
    },
    {
      id: "session-early", title: "5h du matin club", emoji: "🌅",
      description: "Lance une session avant 9h du matin",
      requirement: 1, reward: { gold: 100, xp: 35 }
    },
    {
      id: "session-night", title: "Noctambule", emoji: "🌙",
      description: "Lance une session après 22h",
      requirement: 1, reward: { gold: 100, xp: 35 }
    },
    {
      id: "session-noon", title: "Sprint de midi", emoji: "☀️",
      description: "Session entre 12h et 14h",
      requirement: 1, reward: { gold: 60, xp: 25 }
    },
    {
      id: "session-3x", title: "La trilogie", emoji: "🎯",
      description: "Complète 3 sessions dans la journée",
      requirement: 3, reward: { gold: 200, xp: 80 }
    },
    {
      id: "session-5x", title: "Hyperproductif", emoji: "💪",
      description: "5 sessions en une seule journée",
      requirement: 5, reward: { gold: 350, xp: 150 }
    },
    {
      id: "total-time-120", title: "2h cumulées", emoji: "⏱️",
      description: "Accumule 2h de sessions aujourd'hui",
      requirement: 120, reward: { gold: 160, xp: 80 }
    },
    {
      id: "total-time-240", title: "Demi-journée de focus", emoji: "🏆",
      description: "4h de sessions au total aujourd'hui",
      requirement: 240, reward: { gold: 300, xp: 160 }
    },
    {
      id: "session-sport", title: "Corps & esprit", emoji: "🏃",
      description: "Complète une session Sport de 30min+",
      requirement: 1, reward: { gold: 130, xp: 45 }
    },
    {
      id: "session-study", title: "Étudiant acharné", emoji: "📚",
      description: "Session Étude de 60min+ en une fois",
      requirement: 1, reward: { gold: 130, xp: 60 }
    },
    {
      id: "session-work", title: "Mode professionnel", emoji: "💼",
      description: "Session Travail de 45min+",
      requirement: 1, reward: { gold: 110, xp: 50 }
    },
    {
      id: "session-meditation", title: "Pleine conscience", emoji: "🧘",
      description: "Session Méditation de 20min+",
      requirement: 1, reward: { gold: 80, xp: 30 }
    },
    {
      id: "session-creative", title: "Élan créatif", emoji: "🎨",
      description: "Session Créativité de 30min+",
      requirement: 1, reward: { gold: 90, xp: 40 }
    },
    {
      id: "streak-2", title: "Deux jours de suite", emoji: "🔗",
      description: "Fais une session 2 jours consécutifs",
      requirement: 2, reward: { gold: 150, xp: 60 }
    },
    {
      id: "streak-5", title: "Semaine solide", emoji: "⭐",
      description: "5 jours consécutifs avec au moins 1 session",
      requirement: 5, reward: { gold: 400, xp: 200 }
    },
    {
      id: "no-break-60", title: "Sans interruption", emoji: "🚫",
      description: "60 min sans quitter la session",
      requirement: 1, reward: { gold: 140, xp: 70 }
    },

    // ── ALIMENTATION (8) ─────────────────────────────────────────────────────
    {
      id: "feed-morning", title: "Petit-déjeuner aquatique", emoji: "🌤️",
      description: "Nourris tes poissons avant 10h",
      requirement: 1, reward: { gold: 50, xp: 15 }
    },
    {
      id: "feed-evening", title: "Dîner royal", emoji: "🍽️",
      description: "Nourris tes poissons entre 18h et 21h",
      requirement: 1, reward: { gold: 50, xp: 15 }
    },
    {
      id: "feed-3x", title: "Trois repas par jour", emoji: "🥗",
      description: "Nourris 3 fois dans la même journée",
      requirement: 3, reward: { gold: 90, xp: 30 }
    },
    {
      id: "feed-5x", title: "Aquarium 5 étoiles", emoji: "⭐",
      description: "Nourris 5 fois aujourd'hui",
      requirement: 5, reward: { gold: 130, xp: 50 }
    },
    {
      id: "feed-10x", title: "Chef cuisinier", emoji: "👨‍🍳",
      description: "Nourris 10 fois au total",
      requirement: 10, reward: { gold: 200, xp: 80 }
    },
    {
      id: "feed-after-session", title: "Récompense méritée", emoji: "🎁",
      description: "Nourris juste après avoir complété une session",
      requirement: 1, reward: { gold: 70, xp: 25 }
    },
    {
      id: "feed-full-tank", title: "Grande tablée", emoji: "🦈",
      description: "Nourris avec 5+ poissons dans ton aquarium",
      requirement: 1, reward: { gold: 80, xp: 30 }
    },
    {
      id: "feed-3-days", title: "Routine bien nourrie", emoji: "📅",
      description: "Nourris au moins une fois 3 jours de suite",
      requirement: 3, reward: { gold: 160, xp: 60 }
    },

    // ── COLLECTION & POISSONS (10) ────────────────────────────────────────────
    {
      id: "own-3-species", title: "Trio aquatique", emoji: "🐟",
      description: "Possède 3 espèces différentes",
      requirement: 3, reward: { gold: 100, xp: 40 }
    },
    {
      id: "own-5-species", title: "Petit aquarium", emoji: "🏊",
      description: "Possède 5 espèces différentes",
      requirement: 5, reward: { gold: 200, xp: 80 }
    },
    {
      id: "own-8-species", title: "Collectionneur sérieux", emoji: "🎖️",
      description: "Possède 8 espèces dans ton aquarium",
      requirement: 8, reward: { gold: 350, xp: 140 }
    },
    {
      id: "buy-rare", title: "Pêche rare", emoji: "💎",
      description: "Acquiers un poisson de rareté Rare ou supérieure",
      requirement: 1, reward: { gold: 160, xp: 55 }
    },
    {
      id: "buy-epic", title: "Trésor épique", emoji: "🔮",
      description: "Acquiers un poisson de rareté Épique",
      requirement: 1, reward: { gold: 320, xp: 110 }
    },
    {
      id: "buy-legendary", title: "La perle rare", emoji: "👑",
      description: "Acquiers un poisson Légendaire",
      requirement: 1, reward: { gold: 600, xp: 200 }
    },
    {
      id: "full-tank", title: "Aquarium complet", emoji: "🌊",
      description: "Remplis ton aquarium à 10 poissons",
      requirement: 10, reward: { gold: 450, xp: 180 }
    },
    {
      id: "breed-once", title: "Bébé poisson !", emoji: "🐣",
      description: "Fais naître un bébé poisson par reproduction",
      requirement: 1, reward: { gold: 250, xp: 100 }
    },
    {
      id: "click-fish-20", title: "Tu me chatouilles !", emoji: "😄",
      description: "Clique sur tes poissons 20 fois",
      requirement: 20, reward: { gold: 60, xp: 25 }
    },
    {
      id: "click-fish-50", title: "Grand câlin marin", emoji: "🤗",
      description: "Clique sur tes poissons 50 fois",
      requirement: 50, reward: { gold: 120, xp: 50 }
    },

    // ── OR & PROGRESSION (7) ─────────────────────────────────────────────────
    {
      id: "earn-200", title: "Premiers lingots", emoji: "🪙",
      description: "Gagne 200 or en sessions",
      requirement: 200, reward: { xp: 40 }
    },
    {
      id: "earn-500", title: "Trésorier", emoji: "💰",
      description: "Gagne 500 or en sessions",
      requirement: 500, reward: { xp: 80 }
    },
    {
      id: "earn-1500", title: "Fort en or", emoji: "🏦",
      description: "Accumule 1500 or en sessions",
      requirement: 1500, reward: { xp: 200 }
    },
    {
      id: "save-1000", title: "Épargnant malin", emoji: "🏧",
      description: "Atteins 1000 or d'économies",
      requirement: 1000, reward: { xp: 120 }
    },
    {
      id: "level-3", title: "Montée en puissance", emoji: "📈",
      description: "Atteins le niveau 3",
      requirement: 3, reward: { gold: 100, xp: 30 }
    },
    {
      id: "level-7", title: "Aquanaute confirmé", emoji: "🎓",
      description: "Atteins le niveau 7",
      requirement: 7, reward: { gold: 250, xp: 80 }
    },
    {
      id: "level-15", title: "Maître des profondeurs", emoji: "🌊",
      description: "Atteins le niveau 15",
      requirement: 15, reward: { gold: 500, xp: 200 }
    },

    // ── EXPLORATION & DÉCOUVERTE (5) ─────────────────────────────────────────
    {
      id: "explore-settings", title: "Personnalise ton monde", emoji: "⚙️",
      description: "Ouvre les paramètres et change une option",
      requirement: 1, reward: { gold: 40, xp: 15 }
    },
    {
      id: "switch-aquarium", title: "Changement de décor", emoji: "🎭",
      description: "Change d'aquarium actif",
      requirement: 1, reward: { gold: 60, xp: 20 }
    },
    {
      id: "buy-new-aquarium", title: "Nouveau territoire", emoji: "🏰",
      description: "Achète un nouvel aquarium",
      requirement: 1, reward: { gold: 350, xp: 120 }
    },
    {
      id: "watch-10min", title: "Contemplation marine", emoji: "👁️",
      description: "Observe ton aquarium pendant 10 minutes",
      requirement: 600, reward: { gold: 80, xp: 35 }
    },
    {
      id: "watch-20min", title: "Méditation profonde", emoji: "🧘",
      description: "Reste dans l'aquarium 20 minutes sans session",
      requirement: 1200, reward: { gold: 150, xp: 65 }
    },
  ];
  
  // Select 3 quests based on seed rotation
  const availableQuests = questTemplates
    .sort((a, b) => (a.id.charCodeAt(0) + seed) - (b.id.charCodeAt(0) + seed))
    .slice(0, 3)
    .map((template, index) => ({
      ...template,
      id: `quest-${date}-${template.id}-${index}`,
      type: "daily" as const,
      progress: 0,
      completed: false,
      expiresAt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }));
  
  return availableQuests;
}

// Breeding system helpers
export function canBreedFish(fish1: FishInstance, fish2: FishInstance): boolean {
  if (fish1.fishId !== fish2.fishId) return false; // Same species only
  if (fish1.gender === fish2.gender) return false; // Different genders
  if (fish1.isBaby || fish2.isBaby) return false; // Adults only
  if (fish1.age < 7 || fish2.age < 7) return false; // Min 7 days old
  return true;
}

export function generateBabyFish(mother: FishInstance, father: FishInstance): FishInstance {
  // 0.5 % chance of rare mutation → one genetic trait jumps dramatically
  const hasMutation = Math.random() < 0.005;
  const mutationTrait = (["color", "pattern", "size", "speed"] as const)[Math.floor(Math.random() * 4)];
  // 0.2% extra: secret-hybrid level mutation (intense bio + fractal simultaneously)
  const hasSecretMutation = Math.random() < 0.002;

  const blend = (a: number, b: number) => (a + b) / 2 + (Math.random() - 0.5) * 20;

  const genetics = {
    color:   blend(mother.genetics.color,   father.genetics.color),
    pattern: blend(mother.genetics.pattern, father.genetics.pattern),
    size:    blend(mother.genetics.size,    father.genetics.size),
    speed:   blend(mother.genetics.speed,   father.genetics.speed),
  };
  if (hasMutation) genetics[mutationTrait] = Math.min(100, genetics[mutationTrait] + 40 + Math.random() * 30);

  // Inherit hidden bioluminescent trait; 1 % spontaneous emergence if parents lack it
  const parentBio = mother.hiddenTraits?.bioluminescent ?? father.hiddenTraits?.bioluminescent;
  const bioRoll = Math.random();
  let bioluminescent: "none" | "soft" | "reactive" | "intense" = "none";
  if (hasSecretMutation) {
    bioluminescent = "intense";
  } else if (parentBio && parentBio !== "none") {
    // inherit with slight chance of intensification
    bioluminescent = bioRoll < 0.6 ? parentBio : (bioRoll < 0.85 ? "reactive" : "intense");
  } else if (bioRoll < 0.01) {
    // spontaneous mutation (1 %)
    bioluminescent = bioRoll < 0.003 ? "intense" : "soft";
  }

  const fractalPattern = hasSecretMutation || (hasMutation && mutationTrait === "pattern");
  const secretHybrid = hasSecretMutation || (fractalPattern && bioluminescent === "intense");

  // Behavioral inheritance: 70% parent traits, 30% random drift
  const momDom = (mother.hiddenTraits?.dominanceBias ?? mother.genetics.speed / 100);
  const dadDom = (father.hiddenTraits?.dominanceBias ?? father.genetics.speed / 100);
  const dominanceBias = Math.max(0, Math.min(1,
    (momDom * 0.35 + dadDom * 0.35) + (Math.random() - 0.5) * 0.3
  ));
  // 🐣 Timidity inheritance: shy parents (low dominanceBias) pass timidity to offspring
  const momTimid = 1 - (mother.hiddenTraits?.dominanceBias ?? 0.5);
  const dadTimid = 1 - (father.hiddenTraits?.dominanceBias ?? 0.5);
  const timidityBias = Math.max(0, Math.min(1,
    (momTimid * 0.35 + dadTimid * 0.35) + (Math.random() - 0.5) * 0.25
  ));

  return {
    instanceId: `baby-${Date.now()}-${Math.random()}`,
    fishId: mother.fishId,
    gender: Math.random() < 0.5 ? "male" : "female",
    age: 0,
    genetics,
    hiddenTraits: {
      bioluminescent,
      fractalPattern,
      dominanceBias,
      timidityBias,
      secretHybrid,
    },
    isBaby: true,
    birthDate: new Date().toISOString(),
    parents: { mother: mother.instanceId, father: father.instanceId },
  };
}
