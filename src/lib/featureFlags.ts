/**
 * Feature flags — toggle features without code change.
 * Set a flag to `false` to disable the feature app-wide.
 * To override per-environment, use Vite's import.meta.env:
 *   VITE_FF_GENETIC_LAB_V2=true npm run build
 */
export const FEATURES = {
  /** ASMR/ambient audio player */
  ASMR_MODE: true,
  /** Infinite aquarium capacity (no 25-fish limit) */
  INFINITE_MODE: true,
  /** Fish breeding system */
  BREEDING: true,
  /** Legendary fish visual effects (glow, trail, aura) */
  LEGENDARY_EFFECTS: true,
  /** Advanced genetic mutation lab — not yet stable */
  GENETIC_LAB_V2: import.meta.env.VITE_FF_GENETIC_LAB_V2 === "true",
  /** Food-chain ecosystem mode (future feature from add.md) */
  ECOSYSTEM_FOOD_CHAIN: import.meta.env.VITE_FF_ECOSYSTEM_FOOD_CHAIN === "true",
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/** Check a feature flag at runtime. */
export function isEnabled(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}
