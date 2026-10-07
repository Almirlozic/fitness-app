"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrors } from "@/lib/auth-schemas";
import { requireUser } from "@/lib/auth";
import { macrosForGrams, type Per100g } from "@/lib/food";
import {
  barcodeSchema,
  customFoodSchema,
  dateSchema,
  gramsSchema,
  mealSchema,
  per100Schema,
} from "@/lib/food-schema";
import type { FoodChoice } from "@/lib/food-types";
import { resolveBarcode, toFoodChoice } from "@/lib/foods";
import { formatNumber } from "@/lib/format";
import { OFF_ERROR_MESSAGE, OffError } from "@/lib/off";
import { createClient } from "@/lib/supabase/server";

// Alle actions kræver login. Queries bruger brugerens session, så RLS gælder.

export type FoodFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** Ved oprettelse af egen fødevare: den nye vare, så den kan logges med det samme */
  food?: FoodChoice;
};

const read = (formData: FormData, key: string) => String(formData.get(key) ?? "");

function revalidateFood() {
  revalidatePath("/kost");
  revalidatePath("/kost/tilfoej");
}

/** Gemmer en egen fødevare. Har brugeren allerede én med samme stregkode, opdateres den. */
async function saveCustomFood(
  userId: string,
  food: z.output<typeof customFoodSchema>,
): Promise<{ food: FoodChoice } | { error: string }> {
  const supabase = await createClient();
  const values = { ...food, source: "custom", created_by: userId };

  if (food.barcode) {
    const { data: existing } = await supabase
      .from("foods")
      .select("id")
      .eq("source", "custom")
      .eq("created_by", userId)
      .eq("barcode", food.barcode)
      .maybeSingle();
    if (existing) {
      const { data, error } = await supabase
        .from("foods")
        .update(values)
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) return { error: "Fødevaren kunne ikke gemmes. Prøv igen." };
      return { food: toFoodChoice(data) };
    }
  }

  const { data, error } = await supabase.from("foods").insert(values).select("*").single();
  if (error) {
    console.error("saveCustomFood", error.code, error.message);
    return { error: "Fødevaren kunne ikke gemmes. Prøv igen." };
  }
  return { food: toFoodChoice(data) };
}

// ---------------------------------------------------------------------
// Opret egen fødevare (fanen "Opret")
// ---------------------------------------------------------------------
export async function createCustomFood(
  _prev: FoodFormState,
  formData: FormData,
): Promise<FoodFormState> {
  const user = await requireUser();
  const keys = Object.keys(customFoodSchema.shape);
  const parsed = customFoodSchema.safeParse(Object.fromEntries(keys.map((k) => [k, read(formData, k)])));
  if (!parsed.success) {
    return { status: "error", message: "Tjek de markerede felter.", fieldErrors: fieldErrors(parsed.error) };
  }

  const result = await saveCustomFood(user.id, parsed.data);
  if ("error" in result) return { status: "error", message: result.error };
  revalidateFood();
  return { status: "success", message: `Gemt: ${result.food.name}`, food: result.food };
}

// ---------------------------------------------------------------------
// Log en fødevare
// ---------------------------------------------------------------------
// mode:
//  existing   – varen findes i foods (food_id); tallene hentes fra databasen
//  off        – komplet OFF-vare fra søgningen; serveren henter selv tallene via
//               stregkoden (så ingen kan skrive forkerte tal i den fælles cache)
//  off_filled – OFF-vare, hvor brugeren har udfyldt manglende tal; gemmes som
//               brugerens egen vare MED stregkoden, så tallene kun skal udfyldes én gang
//  manual     – ingen vare i databasen (fx en slettet vare fra "Seneste")
const logBaseSchema = z.object({
  dato: dateSchema,
  meal: mealSchema,
  grams: gramsSchema,
  mode: z.enum(["existing", "off", "off_filled", "manual"]),
});

export async function logFood(_prev: FoodFormState, formData: FormData): Promise<FoodFormState> {
  const user = await requireUser();
  const base = logBaseSchema.safeParse({
    dato: read(formData, "dato"),
    meal: read(formData, "meal"),
    grams: read(formData, "grams"),
    mode: read(formData, "mode"),
  });
  if (!base.success) {
    return { status: "error", message: "Tjek de markerede felter.", fieldErrors: fieldErrors(base.error) };
  }
  const { dato, meal, grams, mode } = base.data;
  const supabase = await createClient();

  let foodId: string | null = null;
  let name = read(formData, "name").trim();
  let per100: Per100g;

  if (mode === "existing") {
    const id = z.uuid().safeParse(read(formData, "food_id"));
    if (!id.success) return { status: "error", message: "Fødevaren findes ikke." };
    const { data } = await supabase.from("foods").select("*").eq("id", id.data).maybeSingle();
    if (!data) return { status: "error", message: "Fødevaren findes ikke længere." };
    const food = toFoodChoice(data);
    foodId = food.id;
    name = food.name;
    per100 = food as Per100g;
  } else if (mode === "off") {
    const barcode = barcodeSchema.safeParse(read(formData, "barcode"));
    if (!barcode.success) return { status: "error", message: barcode.error.issues[0].message };
    try {
      const result = await resolveBarcode(user.id, barcode.data);
      if (result.status !== "found") {
        return { status: "error", message: "Varen mangler tal. Udfyld dem og prøv igen." };
      }
      foodId = result.food.id;
      name = result.food.name;
      per100 = result.food as Per100g;
    } catch (error) {
      if (error instanceof OffError) return { status: "error", message: OFF_ERROR_MESSAGE };
      throw error;
    }
  } else {
    const keys = mode === "off_filled" ? Object.keys(customFoodSchema.shape) : Object.keys(per100Schema.shape);
    const raw = Object.fromEntries(keys.map((k) => [k, read(formData, k)]));
    const parsed = (mode === "off_filled" ? customFoodSchema : per100Schema).safeParse(raw);
    if (!parsed.success) {
      return { status: "error", message: "Udfyld de manglende tal.", fieldErrors: fieldErrors(parsed.error) };
    }
    per100 = parsed.data;
    if (mode === "off_filled") {
      const food = customFoodSchema.parse(raw);
      if (!food.barcode) return { status: "error", message: "Stregkoden mangler." };
      const saved = await saveCustomFood(user.id, food);
      if ("error" in saved) return { status: "error", message: saved.error };
      foodId = saved.food.id;
      name = saved.food.name;
    } else if (!name) {
      return { status: "error", message: "Navnet mangler." };
    }
  }

  const macros = macrosForGrams(per100, grams);
  const { error } = await supabase.from("food_logs").insert({
    eaten_on: dato,
    meal,
    food_id: foodId,
    food_name: name.slice(0, 200),
    grams,
    ...macros,
  });
  if (error) {
    console.error("logFood", error.code, error.message);
    return { status: "error", message: "Maden kunne ikke logges. Prøv igen." };
  }

  revalidateFood();
  const besked = `Tilføjet: ${name} ${formatNumber(grams)} g · ${formatNumber(Math.round(macros.kcal))} kcal`;
  redirect(`/kost?dato=${dato}&besked=${encodeURIComponent(besked)}`);
}

// ---------------------------------------------------------------------
// Ret og slet en logget fødevare
// ---------------------------------------------------------------------
export async function updateFoodLog(
  id: string,
  input: { grams: string; meal: string },
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  const parsed = z
    .object({ id: z.uuid(), grams: gramsSchema, meal: mealSchema })
    .safeParse({ id, ...input });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: log } = await supabase.from("food_logs").select("*").eq("id", id).maybeSingle();
  if (!log) return { ok: false, error: "Findes ikke længere." };

  // Tallene pr. 100 g fra fødevaren, hvis den findes – ellers fra selve loggen
  let per100: Per100g | null = null;
  if (log.food_id) {
    const { data: food } = await supabase.from("foods").select("*").eq("id", log.food_id).maybeSingle();
    if (food) per100 = toFoodChoice(food) as Per100g;
  }
  if (!per100) {
    const f = 100 / Number(log.grams);
    per100 = {
      kcal_100g: Number(log.kcal) * f,
      protein_100g: Number(log.protein_g) * f,
      carbs_100g: Number(log.carbs_g) * f,
      fat_100g: Number(log.fat_g) * f,
    };
  }

  const { error } = await supabase
    .from("food_logs")
    .update({ grams: parsed.data.grams, meal: parsed.data.meal, ...macrosForGrams(per100, parsed.data.grams) })
    .eq("id", id);
  if (error) {
    console.error("updateFoodLog", error.code, error.message);
    return { ok: false, error: "Kunne ikke gemme. Prøv igen." };
  }
  revalidateFood();
  return { ok: true };
}

export async function deleteFoodLog(id: string): Promise<{ ok: boolean }> {
  await requireUser();
  if (!z.uuid().safeParse(id).success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("food_logs").delete().eq("id", id);
  if (error) {
    console.error("deleteFoodLog", error.code, error.message);
    return { ok: false };
  }
  revalidateFood();
  return { ok: true };
}
