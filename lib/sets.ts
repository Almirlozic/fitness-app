import { type ExerciseSummary, summarizeExercises } from "./exercise-summary";
import { exerciseKey } from "./exercise-name";
import { createClient } from "./supabase/server";
import { fetchWgerCategory } from "./wger";
import type { SetRow } from "./supabase/database.types";

/** Escaper % _ og \ så ilike matcher præcist (men uden forskel på store/små bogstaver) */
export function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

// Numeriske kolonner sendes normalt som tal, men vi sikrer os
const toSet = (row: SetRow): SetRow => ({ ...row, weight_kg: Number(row.weight_kg) });

// RLS begrænser automatisk til den loggede brugers sæt (klienten bruger sessionens cookies)
export async function getAllSets(): Promise<SetRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .order("performed_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Kunne ikke hente sæt: ${error.message}`);
  return data.map(toSet);
}

/** Muskelgruppen slås op hos wger ud fra øvelsens wger-id. Egne øvelser har ingen. */
async function withWgerCategories(exercises: ExerciseSummary[]) {
  return Promise.all(
    exercises.map(async (e) =>
      !e.wgerExerciseId
        ? e
        : { ...e, category: await fetchWgerCategory(e.wgerExerciseId) },
    ),
  );
}

export async function getExerciseSummaries(today: string): Promise<ExerciseSummary[]> {
  return withWgerCategories(summarizeExercises(await getAllSets(), today));
}

export async function getExerciseSummary(
  name: string,
  today: string,
): Promise<ExerciseSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .ilike("exercise_name", escapeLike(name.trim()));
  if (error) throw new Error(`Kunne ikke hente øvelsen: ${error.message}`);

  const [summary] = await withWgerCategories(
    summarizeExercises(
      data.map(toSet).filter((s) => exerciseKey(s.exercise_name) === exerciseKey(name)),
      today,
    ),
  );
  return summary ?? null;
}
