import type { FoodChoice } from "./food-types";

// Omsætter Open Food Facts-svar til vores format. Ren funktion, så den kan testes.

type Nutriments = Record<string, unknown>;

export type OffProduct = {
  code?: unknown;
  product_name?: unknown;
  product_name_da?: unknown;
  product_name_en?: unknown;
  brands?: unknown;
  nutriments?: Nutriments;
  serving_quantity?: unknown;
};

const KJ_PER_KCAL = 4.184;

function num(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().replace(/\s+/g, " ") : null;
}

/** brands er en liste i søgningen og en kommasepareret tekst i produkt-API'et */
function firstBrand(brands: unknown): string | null {
  const list = Array.isArray(brands) ? brands : typeof brands === "string" ? brands.split(",") : [];
  return list.map(text).find((b): b is string => Boolean(b)) ?? null;
}

/** null, hvis produktet hverken har stregkode eller navn */
export function mapOffProduct(product: OffProduct): FoodChoice | null {
  const barcode = text(typeof product.code === "number" ? String(product.code) : product.code);
  const name =
    text(product.product_name_da) ?? text(product.product_name) ?? text(product.product_name_en);
  if (!barcode || !name) return null;

  const n = product.nutriments ?? {};
  const kcalFromKj = num(n["energy-kj_100g"] ?? n["energy_100g"]);
  const kcal =
    num(n["energy-kcal_100g"]) ??
    (kcalFromKj === null ? null : Math.round((kcalFromKj / KJ_PER_KCAL) * 100) / 100);
  const serving = num(product.serving_quantity);

  return {
    id: null,
    source: "off",
    barcode,
    name,
    brand: firstBrand(product.brands),
    kcal_100g: kcal,
    protein_100g: num(n["proteins_100g"]),
    carbs_100g: num(n["carbohydrates_100g"]),
    fat_100g: num(n["fat_100g"]),
    serving_g: serving && serving > 0 && serving <= 5000 ? Math.round(serving * 10) / 10 : null,
  };
}
