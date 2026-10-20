// Beregninger til kostsiden (Figma-designet). Rene funktioner uden side-effekter.

import type { Meal } from "./food";

/** Vand: 8 glas à 250 ml = 2 liter om dagen */
export const GLASS_ML = 250;
export const GLASSES_PER_DAY = 8;

/** Liter drukket ud fra antal glas, fx 3 glas → 0,75 */
export function waterLiters(glasses: number) {
  return (glasses * GLASS_ML) / 1000;
}

/**
 * Anbefalet andel af dagens kaloriemål pr. måltid. Snack er et fast interval.
 * Andelene svarer til tallene i designet (fx 3.290 kcal → morgenmad ca. 822–1.100).
 */
const MEAL_SHARES: Record<Exclude<Meal, "snack">, [number, number]> = {
  breakfast: [0.25, 0.33],
  lunch: [0.3, 0.4],
  dinner: [0.39, 0.51],
};
const SNACK_KCAL: [number, number] = [100, 300];

/** Anbefalet kcal-interval for et måltid, rundet til nærmeste 10. null uden mål. */
export function recommendedMealKcal(meal: Meal, dailyTarget: number): [number, number] | null {
  if (dailyTarget <= 0) return null;
  if (meal === "snack") return SNACK_KCAL;
  const [low, high] = MEAL_SHARES[meal];
  const round10 = (n: number) => Math.round(n / 10) * 10;
  return [round10(dailyTarget * low), round10(dailyTarget * high)];
}

/**
 * Hvor langt man er nået fra startvægt mod målvægt, 0–1. Virker både ved
 * vægttab og vægtøgning. Uden start eller mål: null.
 */
export function weightProgress(
  startKg: number | null,
  currentKg: number | null,
  goalKg: number | null,
): number | null {
  if (startKg === null || currentKg === null || goalKg === null) return null;
  if (startKg === goalKg) return currentKg === goalKg ? 1 : 0;
  const fraction = (startKg - currentKg) / (startKg - goalKg);
  return Math.min(1, Math.max(0, fraction));
}

/** Andel 0–1 (til målere og bars) */
export function fraction(value: number, target: number) {
  if (target <= 0) return value > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, value / target));
}
