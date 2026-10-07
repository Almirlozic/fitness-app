// Beregninger til kalorie-trackeren. Rene funktioner uden side-effekter.

export const MEALS = [
  { key: "breakfast", label: "Morgenmad" },
  { key: "lunch", label: "Frokost" },
  { key: "dinner", label: "Aftensmad" },
  { key: "snack", label: "Snack" },
] as const;

export type Meal = (typeof MEALS)[number]["key"];

export const MEAL_KEYS = MEALS.map((m) => m.key) as [Meal, ...Meal[]];

export function isMeal(value: unknown): value is Meal {
  return MEALS.some((m) => m.key === value);
}

export function mealLabel(meal: Meal) {
  return MEALS.find((m) => m.key === meal)!.label;
}

/** Næringsindhold pr. 100 g */
export type Per100g = {
  kcal_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
};

export type Macros = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export const ZERO_MACROS: Macros = { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Næringsindhold for `grams` gram af en fødevare, med 1 decimal */
export function macrosForGrams(food: Per100g, grams: number): Macros {
  const factor = grams / 100;
  return {
    kcal: round1(food.kcal_100g * factor),
    protein_g: round1(food.protein_100g * factor),
    carbs_g: round1(food.carbs_100g * factor),
    fat_g: round1(food.fat_100g * factor),
  };
}

export function sumMacros(items: Macros[]): Macros {
  const sum = items.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein_g: acc.protein_g + m.protein_g,
      carbs_g: acc.carbs_g + m.carbs_g,
      fat_g: acc.fat_g + m.fat_g,
    }),
    ZERO_MACROS,
  );
  return {
    kcal: round1(sum.kcal),
    protein_g: round1(sum.protein_g),
    carbs_g: round1(sum.carbs_g),
    fat_g: round1(sum.fat_g),
  };
}

export function totalsByMeal<T extends Macros & { meal: string }>(logs: T[]) {
  return Object.fromEntries(
    MEALS.map(({ key }) => [key, sumMacros(logs.filter((l) => l.meal === key))]),
  ) as Record<Meal, Macros>;
}

export function dayTotals(logs: Macros[]) {
  return sumMacros(logs);
}

/** Kalorier tilbage i dag. `over` er true, når man har spist mere end målet. */
export function remainingKcal(target: number, eaten: number) {
  const diff = Math.round(target - eaten);
  return { kcal: Math.abs(diff), over: diff < 0 };
}

/** Andel af målet i procent, 0–100 (til progress-bars) */
export function progressPercent(eaten: number, target: number) {
  if (target <= 0) return eaten > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (eaten / target) * 100));
}
