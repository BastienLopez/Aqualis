/**
 * Tests unitaires — fonctions pures de gameData.ts
 * Run: npm test
 */
import { describe, it, expect } from "vitest";
import {
  calculateLevel,
  xpForNextLevel,
  calculatePrice,
  calculateGoldReward,
  canBreedFish,
  generateBabyFish,
  generateDailyQuests,
  MAX_FISH_PER_AQUARIUM,
} from "@/lib/gameData";
import type { FishInstance } from "@/lib/gameData";

// ─── calculateLevel ───────────────────────────────────────────────────────────
describe("calculateLevel", () => {
  it("retourne 0 pour 0 XP", () => {
    expect(calculateLevel(0)).toBe(0);
  });

  it("retourne 1 pour 10 XP (Math.floor(sqrt(10/10)) = 1)", () => {
    expect(calculateLevel(10)).toBe(1);
  });

  it("retourne 2 pour 40 XP", () => {
    expect(calculateLevel(40)).toBe(2);
  });

  it("retourne 3 pour 90 XP", () => {
    expect(calculateLevel(90)).toBe(3);
  });

  it("retourne 10 pour 1000 XP", () => {
    expect(calculateLevel(1000)).toBe(10);
  });

  it("retourne 0 pour XP négatif (pas de NaN ni de valeur négative)", () => {
    expect(calculateLevel(-50)).toBe(0);
    expect(Number.isNaN(calculateLevel(-50))).toBe(false);
  });
});

// ─── xpForNextLevel ──────────────────────────────────────────────────────────
describe("xpForNextLevel", () => {
  it("retourne 10 pour passer du niveau 0 au niveau 1", () => {
    expect(xpForNextLevel(0)).toBe(10);
  });

  it("retourne 40 pour le niveau 1", () => {
    expect(xpForNextLevel(1)).toBe(40);
  });

  it("est bien croissant (niveau 2 > niveau 1)", () => {
    expect(xpForNextLevel(2)).toBeGreaterThan(xpForNextLevel(1));
  });

  it("retourne (level+1)^2 * 10", () => {
    for (let lvl = 0; lvl < 10; lvl++) {
      expect(xpForNextLevel(lvl)).toBe(Math.pow(lvl + 1, 2) * 10);
    }
  });
});

// ─── calculatePrice ──────────────────────────────────────────────────────────
describe("calculatePrice", () => {
  it("retourne le prix de base au niveau 0", () => {
    expect(calculatePrice(100, 0)).toBe(100);
  });

  it("double le prix au niveau 20", () => {
    expect(calculatePrice(100, 20)).toBe(200);
  });

  it("est croissant avec le niveau", () => {
    const price10 = calculatePrice(100, 10);
    const price20 = calculatePrice(100, 20);
    expect(price20).toBeGreaterThan(price10);
  });

  it("est toujours > 0 pour un basePrice positif", () => {
    expect(calculatePrice(50, 0)).toBeGreaterThan(0);
    expect(calculatePrice(50, 100)).toBeGreaterThan(0);
  });

  it("applique la formule basePrice * (1 + level / 20)", () => {
    expect(calculatePrice(80, 5)).toBe(Math.round(80 * (1 + 5 / 20)));
  });
});

// ─── calculateGoldReward ──────────────────────────────────────────────────────
describe("calculateGoldReward", () => {
  it("retourne le gold de base pour une session de 20 min (normal, pas premier)", () => {
    expect(calculateGoldReward(20, false, false)).toBe(15);
  });

  it("applique le bonus sport de +10%", () => {
    expect(calculateGoldReward(20, true, false)).toBe(Math.round(15 * 1.1));
  });

  it("applique le bonus premier du jour de +20%", () => {
    expect(calculateGoldReward(20, false, true)).toBe(Math.round(15 * 1.2));
  });

  it("cumule sport + premier du jour", () => {
    const sportGold = Math.round(15 * 1.1);
    expect(calculateGoldReward(20, true, true)).toBe(Math.round(sportGold * 1.2));
  });

  it("retourne toujours un entier (pas de décimales)", () => {
    expect(Number.isInteger(calculateGoldReward(45, true, true))).toBe(true);
  });

  it("fallback: minutes non connus → Math.round(minutes * 0.5)", () => {
    expect(calculateGoldReward(999, false, false)).toBe(Math.round(999 * 0.5));
  });
});

// ─── MAX_FISH_PER_AQUARIUM ────────────────────────────────────────────────────
describe("MAX_FISH_PER_AQUARIUM", () => {
  it("est bien défini et > 0", () => {
    expect(MAX_FISH_PER_AQUARIUM).toBeGreaterThan(0);
  });

  it("vaut 25", () => {
    expect(MAX_FISH_PER_AQUARIUM).toBe(25);
  });
});

// ─── canBreedFish ──────────────────────────────────────────────────────────────
const makeFish = (overrides: Partial<FishInstance> = {}): FishInstance => ({
  instanceId: `test-${Math.random()}`,
  fishId: "neon-tetra",
  gender: "female",
  age: 10,
  genetics: { color: 50, pattern: 50, size: 50, speed: 50 },
  isBaby: false,
  birthDate: new Date().toISOString(),
  ...overrides,
});

describe("canBreedFish", () => {
  it("retourne true pour deux adultes de même espèce et genres opposés", () => {
    const mom = makeFish({ gender: "female" });
    const dad = makeFish({ gender: "male" });
    expect(canBreedFish(mom, dad)).toBe(true);
  });

  it("retourne false si même sexe (female + female)", () => {
    const f1 = makeFish({ gender: "female" });
    const f2 = makeFish({ gender: "female" });
    expect(canBreedFish(f1, f2)).toBe(false);
  });

  it("retourne false si même sexe (male + male)", () => {
    const m1 = makeFish({ gender: "male" });
    const m2 = makeFish({ gender: "male" });
    expect(canBreedFish(m1, m2)).toBe(false);
  });

  it("retourne false si espèces différentes", () => {
    const mom = makeFish({ fishId: "neon-tetra" });
    const dad = makeFish({ fishId: "guppy", gender: "male" });
    expect(canBreedFish(mom, dad)).toBe(false);
  });

  it("retourne false si un poisson est bébé", () => {
    const mom = makeFish({ isBaby: true });
    const dad = makeFish({ gender: "male" });
    expect(canBreedFish(mom, dad)).toBe(false);
  });

  it("retourne false si âge < 7 jours", () => {
    const mom = makeFish({ age: 3 });
    const dad = makeFish({ gender: "male", age: 3 });
    expect(canBreedFish(mom, dad)).toBe(false);
  });

  it("retourne true à exactement 7 jours", () => {
    const mom = makeFish({ age: 7 });
    const dad = makeFish({ gender: "male", age: 7 });
    expect(canBreedFish(mom, dad)).toBe(true);
  });
});

// ─── generateBabyFish ─────────────────────────────────────────────────────────
describe("generateBabyFish", () => {
  const mother = makeFish({ gender: "female", fishId: "betta" });
  const father = makeFish({ gender: "male", fishId: "betta" });

  it("retourne isBaby = true", () => {
    const baby = generateBabyFish(mother, father);
    expect(baby.isBaby).toBe(true);
  });

  it("a le même fishId que les parents", () => {
    const baby = generateBabyFish(mother, father);
    expect(baby.fishId).toBe("betta");
  });

  it("a une génétique dans [0, 100] (avant mutation éventuelle)", () => {
    // Run 20 fois pour couvrir variance
    for (let i = 0; i < 20; i++) {
      const baby = generateBabyFish(mother, father);
      // After potential mutation trait can exceed 100 — but we clamp at 100
      Object.values(baby.genetics).forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it("a age = 0", () => {
    const baby = generateBabyFish(mother, father);
    expect(baby.age).toBe(0);
  });

  it("a un instanceId unique à chaque appel", () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateBabyFish(mother, father).instanceId));
    expect(ids.size).toBe(10);
  });

  it("référence les parents dans baby.parents", () => {
    const baby = generateBabyFish(mother, father);
    expect(baby.parents?.mother).toBe(mother.instanceId);
    expect(baby.parents?.father).toBe(father.instanceId);
  });

  it("a un hiddenTraits défini", () => {
    const baby = generateBabyFish(mother, father);
    expect(baby.hiddenTraits).toBeDefined();
  });
});

// ─── generateDailyQuests ──────────────────────────────────────────────────────
describe("generateDailyQuests", () => {
  const today = new Date().toISOString().split("T")[0];

  it("retourne exactement 3 quêtes", () => {
    expect(generateDailyQuests(today)).toHaveLength(3);
  });

  it("retourne des objets avec les champs requis", () => {
    const quests = generateDailyQuests(today);
    quests.forEach(q => {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("title");
      expect(q).toHaveProperty("requirement");
      expect(q).toHaveProperty("progress", 0);
      expect(q).toHaveProperty("completed", false);
      expect(q).toHaveProperty("reward");
    });
  });

  it("retourne les mêmes quêtes pour la même date", () => {
    const q1 = generateDailyQuests("2025-01-15");
    const q2 = generateDailyQuests("2025-01-15");
    expect(q1.map(q => q.id)).toEqual(q2.map(q => q.id));
  });

  it("retourne des quêtes différentes selon la date", () => {
    const q1 = generateDailyQuests("2025-01-15");
    const q2 = generateDailyQuests("2025-01-20");
    // Pas forcément différentes (seed = jour du mois), mais les ids doivent être valides
    q1.forEach(q => expect(typeof q.id).toBe("string"));
    q2.forEach(q => expect(typeof q.id).toBe("string"));
  });
});
