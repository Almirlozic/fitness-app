"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrors } from "@/lib/auth-schemas";
import { requireUser } from "@/lib/auth";
import { gramsFromUnit, macrosForGrams, type Per100g } from "@/lib/food";
import {
  type CustomFoodInput,
  barcodeSchema,
  customFoodSchema,
  dateSchema,
  gramsSchema,
  mealSchema,
  newUnitSchema,
  per100Schema,
  quantitySchema,
} from "@/lib/food-schema";
import type { FoodChoice, FoodUnit } from "@/lib/food-types";
import { toFoodChoice, toFoodUnit } from "@/lib/foods";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

// Alle actions kræver login. Queries bruger brugerens session, så RLS gælder.

export type FoodFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** Ved oprettelse af egen fødevare: den nye vare, så den kan logges med det samme */
  food?: FoodChoice;
};

const CUSTOM_FOOD_FIELDS = [
  "name",
  "brand",
  "barcode",
  "serving_g",
  "kcal_100g",
  "protein_100g",
  "carbs_100g",
  "fat_100g",
  "unit_name",
  "unit_grams",
] as const;

const read = (formData: FormData, key: string) => String(formData.get(key) ?? "");
const readAll = (formData: FormData, keys: readonly string[]) =>
  Object.fromEntries(keys.map((k) => [k, read(formData, k)]));

function revalidateFood() {
  revalidatePath("/kost");
  revalidatePath("/kost/tilfoej");
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Gemmer (eller opdaterer) brugerens egen enhed. Samme navn = samme enhed. */
async function saveOwnUnit(
  supabase: Supabase,
  userId: string,
  foodId: string,
  unit: { name: string; grams: number },
): Promise<FoodUnit | null> {
  const { data: existing } = await supabase
    .from("food_units")
    .select("id")
    .eq("food_id", foodId)
    .eq("user_id", userId)
    .ilike("name", unit.name.replace(/[\\%_]/g, "\\$&"))
    .maybeSingle();

  const { data, error } = existing
    ? await supabase.from("food_units").update({ grams: unit.grams }).eq("id", existing.id).select("*").single()
    : await supabase
        .from("food_units")
        .insert({ food_id: foodId, user_id: userId, name: unit.name, grams: unit.grams })
        .select("*")
        .single();
  if (error) {
    console.error("saveOwnUnit", error.code, error.message);
    return null;
  }
  return toFoodUnit(data);
}

/** Gemmer en egen fødevare. Har brugeren allerede én med samme stregkode, opdateres den. */
async function saveCustomFood(
  userId: string,
  input: CustomFoodInput,
): Promise<{ food: FoodChoice } | { error: string }> {
  const supabase = await createClient();
  const { unit, ...food } = input;
  const values = { ...food, source: "custom", created_by: userId };

  let saved;
  const { data: existing } = food.barcode
    ? await supabase
        .from("foods")
        .select("id")
        .eq("source", "custom")
        .eq("created_by", userId)
        .eq("barcode", food.barcode)
        .maybeSingle()
    : { data: null };
  if (existing) {
    saved = await supabase.from("foods").update(values).eq("id", existing.id).select("*").single();
  } else {
    saved = await supabase.from("foods").insert(values).select("*").single();
  }
  if (saved.error) {
    console.error("saveCustomFood", saved.error.code, saved.error.message);
    return { error: "Fødevaren kunne ikke gemmes. Prøv igen." };
  }

  // Enheder: den valgfrie enhed fra formularen og "portion", hvis portionen er kendt
  if (unit) await saveOwnUnit(supabase, userId, saved.data.id, unit);
  if (food.serving_g) {
    await saveOwnUnit(supabase, userId, saved.data.id, { name: "portion", grams: food.serving_g });
  }
  return { food: toFoodChoice(saved.data) };
}

/**
 * Mængden fra formularen: enten gram, eller enhed + antal. Ved enhed slår
 * serveren selv enhedens gram op – gram sendt fra klienten bruges ikke.
 */
const portionSchema = z.discriminatedUnion("portion", [
  z.object({ portion: z.literal("grams"), grams: gramsSchema }),
  z.object({ portion: z.literal("unit"), unit_id: z.uuid("Vælg en enhed"), quantity: quantitySchema }),
]);

type Portion = { grams: number; quantity: number | null; unit_name: string | null };

async function resolvePortion(
  supabase: Supabase,
  foodId: string | null,
  input: z.output<typeof portionSchema>,
): Promise<Portion | { error: string; field: string }> {
  if (input.portion === "grams") return { grams: input.grams, quantity: null, unit_name: null };
  if (!foodId) return { error: "Varen har ingen enheder. Log i gram.", field: "quantity" };

  // RLS: kun fælles og egne enheder er synlige. Enheden skal høre til varen.
  const { data: unit } = await supabase
    .from("food_units")
    .select("*")
    .eq("id", input.unit_id)
    .eq("food_id", foodId)
    .maybeSingle();
  if (!unit) return { error: "Enheden findes ikke længere. Vælg en anden eller log i gram.", field: "unit_id" };

  const grams = gramsFromUnit(input.quantity, Number(unit.grams));
  if (grams > 5000) return { error: "Mængden må højst være 5.000 g", field: "quantity" };
  return { grams, quantity: input.quantity, unit_name: unit.name };
}

// ---------------------------------------------------------------------
// Opret egen fødevare (fanen "Opret")
// ---------------------------------------------------------------------
export async function createCustomFood(
  _prev: FoodFormState,
  formData: FormData,
): Promise<FoodFormState> {
  const user = await requireUser();
  const parsed = customFoodSchema.safeParse(readAll(formData, CUSTOM_FOOD_FIELDS));
  if (!parsed.success) {
    return { status: "error", message: "Tjek de markerede felter.", fieldErrors: fieldErrors(parsed.error) };
  }

  const result = await saveCustomFood(user.id, parsed.data);
  if ("error" in result) return { status: "error", message: result.error };
  revalidateFood();
  return { status: "success", message: `Gemt: ${result.food.name}`, food: result.food };
}

// ---------------------------------------------------------------------
// Ny enhed til en fødevare ("+ Ny enhed" i log-formularen)
// ---------------------------------------------------------------------
export async function createFoodUnit(
  foodId: string,
  input: { name: string; grams: string },
): Promise<{ unit?: FoodUnit; fieldErrors?: Partial<Record<"name" | "grams", string>> }> {
  const user = await requireUser();
  const parsed = newUnitSchema.safeParse(input);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (!z.uuid().safeParse(foodId).success) return { fieldErrors: { name: "Ukendt fødevare" } };

  const supabase = await createClient();
  // Varen skal være synlig for brugeren (OFF eller egen)
  const { data: food } = await supabase.from("foods").select("id").eq("id", foodId).maybeSingle();
  if (!food) return { fieldErrors: { name: "Fødevaren findes ikke længere" } };

  const unit = await saveOwnUnit(supabase, user.id, foodId, parsed.data);
  if (!unit) return { fieldErrors: { name: "Enheden kunne ikke gemmes. Prøv igen." } };
  return { unit };
}

// ---------------------------------------------------------------------
// Log en fødevare
// ---------------------------------------------------------------------
// mode:
//  existing   – varen findes i foods (food_id); tallene hentes fra databasen.
//               OFF-varer fra søgningen slås op (og caches) via stregkoden, før
//               formularen åbnes, så de også er "existing".
//  off_filled – OFF-vare, hvor brugeren har udfyldt manglende tal; gemmes som
//               brugerens egen vare MED stregkoden, så tallene kun skal udfyldes én gang
//  manual     – ingen vare i databasen (fx en slettet vare fra "Seneste")
const logBaseSchema = z.object({
  dato: dateSchema,
  meal: mealSchema,
  mode: z.enum(["existing", "off_filled", "manual"]),
});

export async function logFood(_prev: FoodFormState, formData: FormData): Promise<FoodFormState> {
  const user = await requireUser();
  const base = logBaseSchema.safeParse(readAll(formData, ["dato", "meal", "mode"]));
  const portionInput = portionSchema.safeParse(readAll(formData, ["portion", "grams", "unit_id", "quantity"]));
  if (!base.success || !portionInput.success) {
    return {
      status: "error",
      message: "Tjek de markerede felter.",
      fieldErrors: {
        ...(base.success ? {} : fieldErrors(base.error)),
        ...(portionInput.success ? {} : fieldErrors(portionInput.error)),
      },
    };
  }
  const { dato, meal, mode } = base.data;
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
  } else if (mode === "off_filled") {
    const parsed = customFoodSchema.safeParse(readAll(formData, CUSTOM_FOOD_FIELDS));
    if (!parsed.success) {
      return { status: "error", message: "Udfyld de manglende tal.", fieldErrors: fieldErrors(parsed.error) };
    }
    if (!barcodeSchema.safeParse(parsed.data.barcode ?? "").success) {
      return { status: "error", message: "Stregkoden mangler." };
    }
    const saved = await saveCustomFood(user.id, parsed.data);
    if ("error" in saved) return { status: "error", message: saved.error };
    foodId = saved.food.id;
    name = saved.food.name;
    per100 = parsed.data;
  } else {
    const parsed = per100Schema.safeParse(readAll(formData, Object.keys(per100Schema.shape)));
    if (!parsed.success) {
      return { status: "error", message: "Udfyld de manglende tal.", fieldErrors: fieldErrors(parsed.error) };
    }
    if (!name) return { status: "error", message: "Navnet mangler." };
    per100 = parsed.data;
  }

  const portion = await resolvePortion(supabase, foodId, portionInput.data);
  if ("error" in portion) {
    return { status: "error", message: portion.error, fieldErrors: { [portion.field]: portion.error } };
  }

  const macros = macrosForGrams(per100, portion.grams);
  const { error } = await supabase.from("food_logs").insert({
    eaten_on: dato,
    meal,
    food_id: foodId,
    food_name: name.slice(0, 200),
    ...portion,
    ...macros,
  });
  if (error) {
    console.error("logFood", error.code, error.message);
    return { status: "error", message: "Maden kunne ikke logges. Prøv igen." };
  }

  revalidateFood();
  const amount =
    portion.unit_name && portion.quantity !== null
      ? `${formatNumber(portion.quantity)} ${portion.unit_name}`
      : `${formatNumber(portion.grams)} g`;
  const besked = `Tilføjet: ${name} ${amount} · ${formatNumber(Math.round(macros.kcal))} kcal`;
  redirect(`/kost?dato=${dato}&besked=${encodeURIComponent(besked)}`);
}

// ---------------------------------------------------------------------
// Ret og slet en logget fødevare
// ---------------------------------------------------------------------
export async function updateFoodLog(
  id: string,
  input: { meal: string; portion: string; grams?: string; unit_id?: string; quantity?: string },
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  const meal = mealSchema.safeParse(input.meal);
  const portionInput = portionSchema.safeParse(input);
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Findes ikke længere." };
  if (!meal.success) return { ok: false, error: meal.error.issues[0].message };
  if (!portionInput.success) return { ok: false, error: portionInput.error.issues[0].message };

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

  const portion = await resolvePortion(supabase, log.food_id, portionInput.data);
  if ("error" in portion) return { ok: false, error: portion.error };

  const { error } = await supabase
    .from("food_logs")
    .update({ meal: meal.data, ...portion, ...macrosForGrams(per100, portion.grams) })
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

/**
 * Sletter en egen fødevare (fx oprettet med forkerte tal). RLS tillader kun
 * egne custom-varer. Logs beholder navn og tal (food_id sættes til null),
 * og varens enheder slettes med.
 */
export async function deleteCustomFood(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (!z.uuid().safeParse(id).success) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("foods")
    .delete()
    .eq("id", id)
    .eq("source", "custom")
    .eq("created_by", user.id)
    .select("id");
  if (error || data.length === 0) {
    if (error) console.error("deleteCustomFood", error.code, error.message);
    return { ok: false };
  }
  revalidateFood();
  return { ok: true };
}

