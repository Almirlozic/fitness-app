// Fælles typer for fødevarer på tværs af server og klient (ingen server-kode her).

export const NUTRIENT_FIELDS = ["kcal_100g", "protein_100g", "carbs_100g", "fat_100g"] as const;
export type NutrientField = (typeof NUTRIENT_FIELDS)[number];

export const NUTRIENT_LABELS: Record<NutrientField, string> = {
  kcal_100g: "Kalorier (kcal)",
  protein_100g: "Protein (g)",
  carbs_100g: "Kulhydrat (g)",
  fat_100g: "Fedt (g)",
};

/** Mængden måles i gram eller (for drikkevarer) ml. Næringstal er pr. 100 af enheden. */
export type AmountUnit = "g" | "ml";

export function isAmountUnit(value: unknown): value is AmountUnit {
  return value === "g" || value === "ml";
}

/** En fødevare, som den vises i søgning/scanning. Tal kan mangle for OFF-varer. */
export type FoodChoice = {
  /** Sat, når varen findes i vores foods-tabel */
  id: string | null;
  source: "off" | "custom";
  barcode: string | null;
  name: string;
  brand: string | null;
  kcal_100g: number | null;
  protein_100g: number | null;
  carbs_100g: number | null;
  fat_100g: number | null;
  serving_g: number | null;
  /** "ml" for drikkevarer – så logges og vises mængden i ml */
  unit: AmountUnit;
  /** For "Seneste"-varer, hvis fødevare er slettet: loggen, tallene kommer fra */
  logId?: string;
};

export function missingNutrients(food: Pick<FoodChoice, NutrientField>): NutrientField[] {
  return NUTRIENT_FIELDS.filter((f) => food[f] === null);
}

/** En enhed for en fødevare, fx "stk = 55 g" */
export type FoodUnit = {
  id: string;
  name: string;
  grams: number;
  /** Fælles enhed (fx "portion" fra Open Food Facts) – ellers brugerens egen */
  shared: boolean;
};

/** Hvad brugeren loggede sidst for en vare – bruges som forvalg */
export type LastPortion = {
  grams: number;
  quantity: number | null;
  unit_name: string | null;
};

