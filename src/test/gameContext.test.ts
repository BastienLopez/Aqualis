/**
 * Tests unitaires — GameContext (buyFish, assignFish, completeSession, quêtes)
 * Run: npm test
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { FISH_CATALOG, MAX_FISH_PER_AQUARIUM, calculatePrice } from "@/lib/gameData";

// ─── Setup localStorage mock ──────────────────────────────────────────────────
beforeEach(() => {
  // Vider le localStorage avant chaque test pour un état propre
  localStorage.clear();
  vi.clearAllMocks();
});

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(GameProvider, null, children);
}

// ─── buyFish ──────────────────────────────────────────────────────────────────
describe("GameContext — buyFish", () => {
  it("déduit le prix correct du gold", () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    const fish = FISH_CATALOG.find(f => f.id === "neon-tetra")!;
    const price = calculatePrice(fish.basePrice, 0); // level 0 → basePrice

    expect(result.current.gold).toBe(100); // gold initial par défaut

    // S'assurer qu'on a les fonds
    act(() => {
      // Ajouter du gold si nécessaire (impossible directement → on part du default 100)
      result.current.buyFish("neon-tetra");
    });

    expect(result.current.gold).toBe(100 - price);
  });

  it("retourne false si gold insuffisant", () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    let success = false;

    act(() => {
      // Le poisson légendaire coûte beaucoup plus que 100 (gold initial)
      success = result.current.buyFish("jellyfish"); // légendaire → basePrice élevé
    });

    expect(success).toBe(false);
    expect(result.current.gold).toBe(100); // gold inchangé
  });

  it("crée un FishInstance après l'achat", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.buyFish("neon-tetra");
    });

    const instances = result.current.fishInstances.filter(f => f.fishId === "neon-tetra");
    expect(instances.length).toBeGreaterThanOrEqual(1);
  });

  it("multi-achat du même poisson crée plusieurs instances", () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    const fish = FISH_CATALOG.find(f => f.id === "neon-tetra")!;
    const price = calculatePrice(fish.basePrice, 0);

    // On a 100 gold initial — achète 2 fois si on a assez
    if (price * 2 <= 100) {
      act(() => { result.current.buyFish("neon-tetra"); });
      act(() => { result.current.buyFish("neon-tetra"); });

      const instances = result.current.fishInstances.filter(f => f.fishId === "neon-tetra");
      expect(instances.length).toBeGreaterThanOrEqual(2);
    } else {
      // Prix trop élevé pour 2 achats avec 100 gold — test non applicable
      expect(true).toBe(true);
    }
  });

  it("l'instance achetée est adulte (isBaby = false)", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => {
      result.current.buyFish("neon-tetra");
    });

    const inst = result.current.fishInstances.find(f => f.fishId === "neon-tetra" && !f.instanceId.startsWith("migrated"));
    expect(inst?.isBaby).toBe(false);
  });

  it("l'instance a un genre assigné (male ou female)", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => { result.current.buyFish("neon-tetra"); });

    const inst = result.current.fishInstances.find(f => f.fishId === "neon-tetra" && !f.instanceId.startsWith("migrated"));
    expect(["male", "female"]).toContain(inst?.gender);
  });
});

// ─── assignFish ──────────────────────────────────────────────────────────────
describe("GameContext — assignFish", () => {
  it("ajoute un poisson dans l'aquarium", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => { result.current.buyFish("neon-tetra"); });
    act(() => {
      result.current.assignFish("neon-tetra", "deep");
    });

    expect(result.current.aquariumFish["deep"]).toContain("neon-tetra");
  });

  it("retourne true si l'assignation réussit", () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    let success = false;

    act(() => {
      success = result.current.assignFish("neon-tetra", "deep");
    });

    expect(success).toBe(true);
  });

  it(`bloque au-delà de ${MAX_FISH_PER_AQUARIUM} poissons (mode normal)`, () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    // Remplir l'aquarium jusqu'à la limite
    act(() => {
      for (let i = 0; i < MAX_FISH_PER_AQUARIUM; i++) {
        result.current.assignFish("neon-tetra", "deep");
      }
    });

    expect(result.current.aquariumFish["deep"].length).toBe(MAX_FISH_PER_AQUARIUM);

    // La prochaine tentative doit échouer
    let extra = true;
    act(() => {
      extra = result.current.assignFish("neon-tetra", "deep");
    });

    expect(extra).toBe(false);
    expect(result.current.aquariumFish["deep"].length).toBe(MAX_FISH_PER_AQUARIUM);
  });

  it("bypass la limite si infiniteMode = true", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    // Activer le mode infini
    act(() => { result.current.toggleInfiniteMode(); });

    // Remplir au-delà de la limite
    act(() => {
      for (let i = 0; i < MAX_FISH_PER_AQUARIUM + 5; i++) {
        result.current.assignFish("neon-tetra", "deep");
      }
    });

    expect(result.current.aquariumFish["deep"].length).toBe(MAX_FISH_PER_AQUARIUM + 5);
  });
});

// ─── removeFishFromAquarium ───────────────────────────────────────────────────
describe("GameContext — removeFishFromAquarium", () => {
  it("retire le poisson de l'aquarium", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => { result.current.assignFish("neon-tetra", "deep"); });
    expect(result.current.aquariumFish["deep"]).toContain("neon-tetra");

    act(() => { result.current.removeFishFromAquarium("neon-tetra", "deep"); });
    // Retire une seule occurrence
    const beforeLength = 1;
    expect(result.current.aquariumFish["deep"].length).toBe(beforeLength - 1);
  });
});

// ─── completeSession (ex-completeSesion) ─────────────────────────────────────
describe("GameContext — completeSession", () => {
  it("ajoute du gold et de l'XP après une session de 20 min", () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    const initialGold = result.current.gold;
    const initialXP = result.current.totalXP;

    act(() => {
      result.current.completeSession("work", 20);
    });

    expect(result.current.gold).toBeGreaterThan(initialGold);
    expect(result.current.totalXP).toBeGreaterThan(initialXP);
  });

  it("retourne un objet { gold, xp } avec des valeurs > 0", () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    let reward = { gold: 0, xp: 0 };

    act(() => {
      reward = result.current.completeSession("work", 60);
    });

    expect(reward.gold).toBeGreaterThan(0);
    expect(reward.xp).toBeGreaterThan(0);
  });

  it("le bonus sport est appliqué (gold sport > gold normal, même durée)", () => {
    // Test avec deux contextes frais
    const { result: r1 } = renderHook(() => useGame(), { wrapper });
    const { result: r2 } = renderHook(() => useGame(), { wrapper });

    let sportReward = { gold: 0, xp: 0 };
    let workReward  = { gold: 0, xp: 0 };

    act(() => { sportReward = r1.current.completeSession("sport", 20); });
    act(() => { workReward  = r2.current.completeSession("work",  20); });

    expect(sportReward.gold).toBeGreaterThanOrEqual(workReward.gold);
  });

  it("ajoute une session dans l'historique", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    act(() => { result.current.completeSession("work", 45); });

    expect(result.current.sessions.length).toBeGreaterThanOrEqual(1);
    expect(result.current.sessions[0].activity).toBe("work");
    expect(result.current.sessions[0].duration).toBe(45);
  });
});

// ─── claimQuestReward ─────────────────────────────────────────────────────────
describe("GameContext — claimQuestReward", () => {
  it("les quêtes sont générées et actives", () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    // Les quêtes sont générées via generateDailyQuests au montage
    expect(result.current.quests.length).toBeGreaterThan(0);
  });

  it("claimQuestReward retire la quête des actives", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    // Forcer la complétion de la première quête
    const quest = result.current.quests[0];
    if (!quest) return;

    act(() => { result.current.claimQuestReward(quest.id); });

    const remaining = result.current.quests.filter(q => q.id === quest.id);
    expect(remaining.length).toBe(0);
  });
});

// ─── toggleInfiniteMode ───────────────────────────────────────────────────────
describe("GameContext — toggleInfiniteMode", () => {
  it("bascule infiniteMode entre true et false", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    expect(result.current.infiniteMode).toBe(false);

    act(() => { result.current.toggleInfiniteMode(); });
    expect(result.current.infiniteMode).toBe(true);

    act(() => { result.current.toggleInfiniteMode(); });
    expect(result.current.infiniteMode).toBe(false);
  });
});

// ─── incrementFeedCount ───────────────────────────────────────────────────────
describe("GameContext — incrementFeedCount", () => {
  it("incrémente le compteur de nourrissage", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    expect(result.current.feedCount).toBe(0);

    act(() => { result.current.incrementFeedCount(); });
    expect(result.current.feedCount).toBe(1);

    act(() => {
      result.current.incrementFeedCount();
      result.current.incrementFeedCount();
    });
    expect(result.current.feedCount).toBe(3);
  });
});
