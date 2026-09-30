"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exerciseKey, exercisePath, normalizeExerciseName } from "@/lib/exercise-name";
import { formatLift, todayIso } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { escapeLike } from "@/lib/sets";
import { createClient } from "@/lib/supabase/server";

// Alle actions kræver login. Queries bruger den loggede brugers session, så RLS
// begrænser dem til brugerens egne sæt; nye sæt får user_id via default auth.uid().

type Field = "exercise_name" | "weight_kg" | "reps" | "performed_on";

export type LogSetState =
  | { status: "idle" }
  | { status: "success"; message: string; savedAt: number }
  | { status: "error"; message?: string; fieldErrors: Partial<Record<Field, string>> };

const exerciseName = z
  .string()
  .transform(normalizeExerciseName)
  .pipe(
    z.string().min(1, "Vælg eller skriv en øvelse").max(100, "Navnet må højst være 100 tegn"),
  );

const logSetSchema = z.object({
  exercise_name: exerciseName,
  wger_exercise_id: z
    .string()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number().int().positive().nullable()),
  weight_kg: z
    .string()
    .trim()
    .regex(/^\d{1,4}([.,]\d{1,2})?$/, "Skriv kilo som et tal, fx 24 eller 22,5")
    .transform((v) => Number(v.replace(",", "."))),
  reps: z
    .string()
    .trim()
    .regex(/^\d+$/, "Skriv reps som et helt tal, fx 8")
    .transform(Number)
    .pipe(z.number().min(1, "Mindst 1 rep").max(200, "Højst 200 reps")),
  performed_on: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Vælg en dato")
    .refine((d) => !Number.isNaN(Date.parse(d)), "Vælg en gyldig dato")
    .refine((d) => d <= todayIso(), "Datoen kan ikke ligge i fremtiden"),
});

function readForm(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

function revalidateExercises() {
  revalidatePath("/");
  revalidatePath("/progression");
  revalidatePath("/ovelser/[name]", "page");
}

/** Finder det navn, øvelsen allerede er gemt med (uanset store/små bogstaver) */
async function findExisting(name: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sets")
    .select("exercise_name, wger_exercise_id")
    .ilike("exercise_name", escapeLike(name))
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function logSet(_prev: LogSetState, formData: FormData): Promise<LogSetState> {
  await requireUser();
  const parsed = logSetSchema.safeParse(readForm(formData, Object.keys(logSetSchema.shape)));
  if (!parsed.success) {
    const fieldErrors: Partial<Record<Field, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as Field;
      fieldErrors[field] ??= issue.message;
    }
    return { status: "error", fieldErrors };
  }

  const input = parsed.data;
  const existing = await findExisting(input.exercise_name);
  const name = existing?.exercise_name ?? input.exercise_name;

  const supabase = await createClient();
  const { error } = await supabase.from("sets").insert({
    exercise_name: name,
    wger_exercise_id: existing ? existing.wger_exercise_id : input.wger_exercise_id,
    weight_kg: input.weight_kg,
    reps: input.reps,
    performed_on: input.performed_on,
  });
  if (error) {
    console.error("logSet", error);
    return { status: "error", message: "Sættet kunne ikke gemmes. Prøv igen.", fieldErrors: {} };
  }

  revalidateExercises();
  return {
    status: "success",
    message: `Gemt: ${name} · ${formatLift(input.weight_kg, input.reps)}`,
    savedAt: Date.now(),
  };
}

export async function deleteSet(id: string): Promise<{ ok: boolean }> {
  await requireUser();
  if (!z.uuid().safeParse(id).success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("sets").delete().eq("id", id);
  if (error) {
    console.error("deleteSet", error);
    return { ok: false };
  }
  revalidateExercises();
  return { ok: true };
}

export async function deleteExercise(name: string): Promise<{ ok: boolean }> {
  await requireUser();
  const parsed = exerciseName.safeParse(name);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sets")
    .delete()
    .ilike("exercise_name", escapeLike(parsed.data));
  if (error) {
    console.error("deleteExercise", error);
    return { ok: false };
  }
  revalidateExercises();
  redirect("/");
}

/**
 * Sletter alle sæt for de angivne øvelser – eller alle brugerens sæt, når
 * `names` er null. RLS sikrer, at kun egne sæt kan slettes.
 */
export async function deleteExercises(names: string[] | null): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const supabase = await createClient();

  if (names === null) {
    const { error } = await supabase.from("sets").delete().eq("user_id", user.id);
    if (error) {
      console.error("deleteExercises", error);
      return { ok: false };
    }
    revalidateExercises();
    return { ok: true };
  }

  const parsed = z.array(exerciseName).max(500).safeParse(names);
  if (!parsed.success) return { ok: false };
  const keys = new Set(parsed.data.map(exerciseKey));

  // Find id'er på de sæt, der hører til øvelserne (uanset store/små bogstaver)
  const { data, error: readError } = await supabase.from("sets").select("id, exercise_name");
  if (readError) {
    console.error("deleteExercises", readError);
    return { ok: false };
  }
  const ids = data.filter((s) => keys.has(exerciseKey(s.exercise_name))).map((s) => s.id);
  if (ids.length > 0) {
    const { error } = await supabase.from("sets").delete().in("id", ids);
    if (error) {
      console.error("deleteExercises", error);
      return { ok: false };
    }
  }
  revalidateExercises();
  return { ok: true };
}

export type RenameState = { error?: string };

export async function renameExercise(
  _prev: RenameState,
  formData: FormData,
): Promise<RenameState> {
  await requireUser();
  const oldName = exerciseName.safeParse(String(formData.get("old_name") ?? ""));
  const newName = exerciseName.safeParse(String(formData.get("new_name") ?? ""));
  if (!oldName.success) return { error: "Øvelsen findes ikke" };
  if (!newName.success) return { error: newName.error.issues[0].message };
  if (oldName.data === newName.data) return {};

  // Findes det nye navn allerede som en anden øvelse, flettes de sammen under det navn
  const existing = await findExisting(newName.data);
  const sameExercise =
    existing && existing.exercise_name.toLowerCase() === oldName.data.toLowerCase();
  const target = existing && !sameExercise ? existing.exercise_name : newName.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sets")
    .update({ exercise_name: target })
    .ilike("exercise_name", escapeLike(oldName.data));
  if (error) {
    console.error("renameExercise", error);
    return { error: "Navnet kunne ikke gemmes. Prøv igen." };
  }

  revalidateExercises();
  redirect(exercisePath(target));
}
