"use client";

import { useActionState, useState } from "react";
import { type LogSetState, logSet } from "@/app/actions";
import { Stepper, toDecimalInput } from "../Stepper";

/** "Log et sæt" på øvelsessiden – kg og reps er udfyldt med det seneste sæt */
export function ExerciseLogCard({
  exerciseName,
  wgerExerciseId,
  lastWeightKg,
  lastReps,
  today,
}: {
  exerciseName: string;
  wgerExerciseId: number | null;
  lastWeightKg: number;
  lastReps: number;
  today: string;
}) {
  const [weight, setWeight] = useState(toDecimalInput(lastWeightKg));
  const [reps, setReps] = useState(String(lastReps));
  const [state, formAction, pending] = useActionState<LogSetState, FormData>(logSet, {
    status: "idle",
  });
  const errors = state.status === "error" ? state.fieldErrors : {};

  return (
    <form
      action={formAction}
      noValidate
      className="rounded-[5px] border-[0.5px] border-navy px-[14px] pt-[12px] pb-[16px] text-navy"
    >
      <input type="hidden" name="exercise_name" value={exerciseName} />
      <input type="hidden" name="wger_exercise_id" value={wgerExerciseId ?? ""} />
      <input type="hidden" name="performed_on" value={today} />

      <div className="flex items-baseline justify-between font-serif text-[12px] uppercase">
        <h2>Log et sæt</h2>
        <span className="text-[10px]">I dag</span>
      </div>

      <div className="mt-[12px] grid grid-cols-2 gap-[12px]">
        <Stepper
          id="exercise-weight"
          name="weight_kg"
          label="Kg"
          value={weight}
          onChange={setWeight}
          step={2.5}
          inputMode="decimal"
          error={errors.weight_kg}
          tone="design"
        />
        <Stepper
          id="exercise-reps"
          name="reps"
          label="Reps"
          value={reps}
          onChange={setReps}
          step={1}
          min={1}
          inputMode="numeric"
          error={errors.reps}
          tone="design"
        />
      </div>

      <p role="status" className="mt-[10px] min-h-[15px] text-center font-inter text-[12px] font-semibold">
        {state.status === "success" && state.message}
        {state.status === "error" && (
          <span className="text-error">{state.message ?? errors.exercise_name ?? errors.performed_on}</span>
        )}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="mx-auto mt-[8px] flex h-[62px] w-[214px] items-center justify-center bg-navy font-inter text-[14px] font-bold text-cream uppercase hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Gemmer …" : "Gem sæt"}
      </button>
    </form>
  );
}
