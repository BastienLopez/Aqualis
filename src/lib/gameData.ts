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
    diet: "Omnivore",
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
    diet: "Omnivore",
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
    diet: "Omnivore",
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
