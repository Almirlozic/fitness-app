// Beregninger til kalorie-trackeren. Rene funktioner uden side-effekter.

import { formatNumber } from "./format";

/** Standardenheder: mængden står i dem selv ("0,5 l", "1 kg") */
const STANDARD_UNIT_NAMES = new Set(["g", "kg", "ml", "cl", "dl", "l"]);

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

// toPrecision fjerner flydende-tals-støj før afrunding (1,5 × 33,3 = 49,9499… → 50)
const round1 = (n: number) => Math.round(Number((n * 10).toPrecision(12))) / 10;

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

// ---------------------------------------------------------------------
// Enheder ("1 stk = 55 g"). Gram er stadig det, der regnes og gemmes på.
// ---------------------------------------------------------------------

/** 4 stk à 55 g → 220 g (1 decimal, som food_logs.grams) */
export function gramsFromUnit(quantity: number, unitGrams: number) {
  return round1(quantity * unitGrams);
}

/** "stk (55 g)" – eller "dåse (330 ml)" for drikkevarer */
export function formatUnitChip(unit: { name: string; grams: number }, amountUnit: "g" | "ml" = "g") {
  return `${unit.name} (${formatNumber(unit.grams)} ${amountUnit})`;
}

/** "4 stk (220 g)", "330 ml" eller "200 g", hvis der ikke er logget i en enhed */
export function formatPortion(log: {
  grams: number;
  quantity: number | null;
  unit_name: string | null;
  /** "ml" for drikkevarer; mangler den, er det gram */
  amount_unit?: string | null;
}) {
  const grams = `${formatNumber(log.grams)} ${log.amount_unit === "ml" ? "ml" : "g"}`;
  if (log.quantity === null || !log.unit_name) return grams;
  // Standardmål står for sig selv ("0,5 l", "1 kg"); varens egne enheder får
  // mængden med ("1 portion (500 g)")
  const amount = `${formatNumber(log.quantity)} ${log.unit_name}`;
  return STANDARD_UNIT_NAMES.has(log.unit_name) ? amount : `${amount} (${grams})`;
}

export type PortionChoice =
  | { mode: "grams"; grams: number }
  | { mode: "unit"; unitId: string; quantity: number };

/**
 * Hvilken mængde formularen starter med:
 * 1. Det, der blev brugt sidst (eller det, der er logget, når man retter) – hvis
 *    enheden stadig findes. Findes den ikke (slettet/omdøbt), bruges de gemte gram.
 * 2. Ellers den første enhed med antal 1.
 * 3. Har varen ingen enheder: gram.
 */
export function pickPortion(
  units: { id: string; name: string }[],
  previous: { grams: number; quantity: number | null; unit_name: string | null } | null,
  fallbackGrams: number,
): PortionChoice {
  if (previous) {
    if (previous.unit_name && previous.quantity !== null) {
      const unit = units.find((u) => u.name.toLowerCase() === previous.unit_name!.toLowerCase());
      if (unit) return { mode: "unit", unitId: unit.id, quantity: previous.quantity };
    }
    return { mode: "grams", grams: previous.grams };
  }
  if (units.length > 0) return { mode: "unit", unitId: units[0].id, quantity: 1 };
  return { mode: "grams", grams: fallbackGrams };
}

// ---------------------------------------------------------------------
// Standardmål ud over basisenheden: kg, ml, cl, dl, l (og g for drikkevarer)
// ---------------------------------------------------------------------
/**
 * Vælger man ml, måles det i ml; vælger man gram, måles det i gram. `unit` er det,
 * mængden gemmes i, og `factor` er antal g/ml pr. enhed (fx l = 1.000 ml).
 */
export type Measure = { name: string; factor: number; unit: "g" | "ml" };

const WEIGHT: Measure[] = [
  { name: "g", factor: 1, unit: "g" },
  { name: "kg", factor: 1000, unit: "g" },
];
const VOLUME: Measure[] = [
  { name: "ml", factor: 1, unit: "ml" },
  { name: "cl", factor: 10, unit: "ml" },
  { name: "dl", factor: 100, unit: "ml" },
  { name: "l", factor: 1000, unit: "ml" },
];

/** Alle mål for en vare – basisenheden (fx "g") vises separat og er ikke med her */
export const MEASURES: Record<"g" | "ml", Measure[]> = {
  g: [...WEIGHT.slice(1), ...VOLUME],
  ml: [...VOLUME.slice(1), ...WEIGHT],
};

/**
 * Standardenheden med navnet `name` (g, kg, ml, cl, dl, l) – uanset om varen
 * ellers måles i gram eller ml. Vælger man ml, måles det i ml, osv.
 */
export function findMeasure(_amountUnit: "g" | "ml", name: string) {
  return [...WEIGHT, ...VOLUME].find((m) => m.name === name);
}

