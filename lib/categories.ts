export const CATEGORIES = [
  { key: "bryst", label: "Bryst" },
  { key: "arme", label: "Arme" },
  { key: "ryg", label: "Ryg" },
  { key: "skuldre", label: "Skuldre" },
  { key: "ben", label: "Ben" },
  { key: "mave", label: "Mave" },
  { key: "laegge", label: "Lægge" },
  { key: "cardio", label: "Cardio" },
] as const;

export type Category = (typeof CATEGORIES)[number]["key"];

export function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((c) => c.key === value);
}

export function categoryLabel(key: Category) {
  return CATEGORIES.find((c) => c.key === key)!.label;
}

// wger's kategorier (engelske navne) → vores
const FROM_WGER: Record<string, Category> = {
  chest: "bryst",
  arms: "arme",
  back: "ryg",
  shoulders: "skuldre",
  legs: "ben",
  abs: "mave",
  calves: "laegge",
  cardio: "cardio",
};

export function categoryFromWger(name: string | undefined): Category | null {
  return (name && FROM_WGER[name.trim().toLowerCase()]) || null;
}
