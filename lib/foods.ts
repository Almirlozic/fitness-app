import "server-only";
import { type FoodChoice, missingNutrients } from "./food-types";
import { fetchOffProduct } from "./off";
import { createAdminClient } from "./supabase/admin";
import type { FoodLogRow, FoodRow } from "./supabase/database.types";
import { createClient } from "./supabase/server";

// Numeriske kolonner kan komme som tekst fra PostgREST
const n = (v: unknown) => Number(v);
const nOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export function toFoodChoice(row: FoodRow): FoodChoice {
  return {
    id: row.id,
    source: row.source === "custom" ? "custom" : "off",
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    kcal_100g: n(row.kcal_100g),
    protein_100g: n(row.protein_100g),
    carbs_100g: n(row.carbs_100g),
    fat_100g: n(row.fat_100g),
    serving_g: nOrNull(row.serving_g),
  };
}

export function toFoodLog(row: FoodLogRow): FoodLogRow {
  return {
    ...row,
    grams: n(row.grams),
    kcal: n(row.kcal),
    protein_g: n(row.protein_g),
    carbs_g: n(row.carbs_g),
    fat_g: n(row.fat_g),
  };
}

export type BarcodeResult =
  | { status: "found"; food: FoodChoice }
  /** Fundet hos OFF, men mangler tal – brugeren skal udfylde dem */
  | { status: "incomplete"; food: FoodChoice }
  | { status: "not_found" };

/**
 * Slår en stregkode op i rækkefølgen:
 * 1. brugerens egne fødevarer  2. vores OFF-cache  3. Open Food Facts (gemmes i cachen)
 * Kaster OffError, hvis Open Food Facts fejler.
 */
export async function resolveBarcode(userId: string, barcode: string): Promise<BarcodeResult> {
  const supabase = await createClient();

  const { data: own } = await supabase
    .from("foods")
    .select("*")
    .eq("source", "custom")
    .eq("created_by", userId)
    .eq("barcode", barcode)
    .maybeSingle();
  if (own) return { status: "found", food: toFoodChoice(own) };

  const cached = await findCachedOff(barcode);
  if (cached) return { status: "found", food: cached };

  const product = await fetchOffProduct(barcode);
  if (!product) return { status: "not_found" };
  if (missingNutrients(product).length > 0) return { status: "incomplete", food: product };

  return { status: "found", food: await cacheOffProduct(product) };
}

async function findCachedOff(barcode: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("foods")
    .select("*")
    .eq("source", "off")
    .eq("barcode", barcode)
    .maybeSingle();
  return data ? toFoodChoice(data) : null;
}

/** Gemmer et komplet OFF-produkt i den fælles cache (kun server, med admin-klienten) */
async function cacheOffProduct(product: FoodChoice): Promise<FoodChoice> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("foods")
    .insert({
      source: "off",
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      kcal_100g: product.kcal_100g!,
      protein_100g: product.protein_100g!,
      carbs_100g: product.carbs_100g!,
      fat_100g: product.fat_100g!,
      serving_g: product.serving_g,
      created_by: null,
    })
    .select("*")
    .single();
  if (data) return toFoodChoice(data);

  // To samtidige opslag af samme stregkode: den anden får en unik-fejl og bruger den første
  if (error?.code === "23505" && product.barcode) {
    const existing = await findCachedOff(product.barcode);
    if (existing) return existing;
  }
  console.error("cacheOffProduct", error);
  return product;
}

/** Brugerens egne fødevarer, nyeste først */
export async function getCustomFoods(userId: string): Promise<FoodChoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("foods")
    .select("*")
    .eq("source", "custom")
    .eq("created_by", userId)
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Kunne ikke hente egne fødevarer: ${error.message}`);
  return data.map(toFoodChoice);
}

/** De 10 senest loggede fødevarer (unikke), med tal pr. 100 g */
export async function getRecentFoods(): Promise<FoodChoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_logs")
    .select("food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g, created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(`Kunne ikke hente seneste: ${error.message}`);

  const seen = new Set<string>();
  const recent = data
    .filter((l) => {
      const key = l.food_id ?? `navn:${l.food_name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);

  const ids = recent.flatMap((l) => (l.food_id ? [l.food_id] : []));
  const foods = new Map<string, FoodChoice>();
  if (ids.length > 0) {
    const { data: rows } = await supabase.from("foods").select("*").in("id", ids);
    for (const row of rows ?? []) foods.set(row.id, toFoodChoice(row));
  }

  return recent.map((l) => {
    const food = l.food_id ? foods.get(l.food_id) : undefined;
    if (food) return food;
    // Fødevaren er slettet: regn tallene pr. 100 g ud fra loggen
    const per100 = (v: unknown) => Math.round((n(v) / n(l.grams)) * 100 * 100) / 100;
    return {
      id: null,
      source: "custom" as const,
      barcode: null,
      name: l.food_name,
      brand: null,
      kcal_100g: per100(l.kcal),
      protein_100g: per100(l.protein_g),
      carbs_100g: per100(l.carbs_g),
      fat_100g: per100(l.fat_g),
      serving_g: null,
    };
  });
}

export async function getFoodLogsForDay(date: string): Promise<FoodLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("food_logs")
    .select("*")
    .eq("eaten_on", date)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Kunne ikke hente dagens mad: ${error.message}`);
  return data.map(toFoodLog);
}
