import { describe, expect, it } from "vitest";
import { summarizeExercises } from "./exercise-summary";
import type { SetRow } from "./supabase/database.types";

let n = 0;
const row = (exercise_name: string, performed_on: string, weight_kg: number): SetRow => ({
  id: String(++n),
  user_id: "00000000-0000-0000-0000-000000000001",
  exercise_name,
  wger_exercise_id: null,
  weight_kg,
  reps: 8,
  performed_on,
  created_at: `${performed_on}T10:00:${String(n).padStart(2, "0")}Z`,
});

describe("summarizeExercises", () => {
  it("samler samme øvelse uanset store/små bogstaver og sorterer efter senest logget", () => {
    const result = summarizeExercises(
      [
        row("Squat", "2026-10-01", 80),
        row("Incline Chest Press", "2026-09-20", 24),
        row("incline chest press", "2026-10-05", 26),
      ],
      "2026-10-12",
    );
    expect(result.map((e) => [e.name, e.sets.length])).toEqual([
      ["incline chest press", 2],
      ["Squat", 1],
    ]);
    expect(result[0].latest.weight_kg).toBe(26);
    expect(result[0].previous?.weight_kg).toBe(24);
    expect(result[0].thisMonth).toEqual({ kind: "change", percent: 8.3 });
  });
});
