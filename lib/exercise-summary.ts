import type { Category } from "./categories";
import { exerciseKey } from "./exercise-name";
import {
  type SinceStart,
  type ThisMonthChange,
  sinceStart,
  thisMonthChange,
} from "./progression";
import type { SetRow } from "./supabase/database.types";

export type ExerciseSummary = {
  key: string;
  name: string;
  wgerExerciseId: number | null;
  /** Muskelgruppe fra wger; null for egne øvelser (sættes i lib/sets.ts) */
  category: Category | null;
  /** Nyeste først */
  sets: SetRow[];
  latest: SetRow;
  previous: SetRow | null;
  thisMonth: ThisMonthChange;
  sinceStart: SinceStart;
};

export function newestFirst(a: SetRow, b: SetRow) {
  return (
    b.performed_on.localeCompare(a.performed_on) || b.created_at.localeCompare(a.created_at)
  );
}

/** Samler sæt pr. øvelse, sorteret efter senest logget */
export function summarizeExercises(sets: SetRow[], today: string): ExerciseSummary[] {
  const groups = new Map<string, SetRow[]>();
  for (const set of [...sets].sort(newestFirst)) {
    const key = exerciseKey(set.exercise_name);
    groups.set(key, [...(groups.get(key) ?? []), set]);
  }

  return [...groups.entries()].map(([key, group]) => ({
    key,
    name: group[0].exercise_name,
    wgerExerciseId: group.find((s) => s.wger_exercise_id !== null)?.wger_exercise_id ?? null,
    category: null,
    sets: group,
    latest: group[0],
    previous: group[1] ?? null,
    thisMonth: thisMonthChange(group, today),
    sinceStart: sinceStart(group)!,
  }));
}
