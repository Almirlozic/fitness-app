"use client";

import { useActionState, useState } from "react";
import { type LogSetState, logSet } from "@/app/actions";
import { CheckCircleIcon } from "./Icons";
import { Stepper, toDecimalInput } from "./Stepper";

/** Log et sæt direkte på øvelsens side, forudfyldt med sidste sæt */
export function QuickLog({
  exerciseName,
  wgerExerciseId,
  lastWeightKg,
  lastReps,
  today,
  todayLabel,
}: {
  exerciseName: string;
  wgerExerciseId: number | null;
  lastWeightKg: number;
  lastReps: number;
  today: string;
  todayLabel: string;
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
      className="mt-space-md border-t-2 border-primary bg-surface-container-low p-space-md"
    >
      <input type="hidden" name="exercise_name" value={exerciseName} />
      <input type="hidden" name="wger_exercise_id" value={wgerExerciseId ?? ""} />
      <input type="hidden" name="performed_on" value={today} />

      <div className="mb-space-sm flex items-start justify-between gap-space-md">
        <h2 className="text-label-caps uppercase tracking-wider text-primary">
          [ Log sæt // registrer vægt ]
        </h2>
        <span className="text-right font-mono text-caption-mono uppercase text-secondary">
          [ Dato: i dag // {todayLabel} ]
        </span>
      </div>

      <div className="grid grid-cols-2 items-start gap-space-md">
        <Stepper
          id="quick-weight"
          name="weight_kg"
          label="Kg"
          value={weight}
          onChange={setWeight}
          step={2.5}
          inputMode="decimal"
          error={errors.weight_kg}
        />
        <Stepper
          id="quick-reps"
          name="reps"
          label="Reps"
          value={reps}
          onChange={setReps}
          step={1}
          min={1}
          inputMode="numeric"
          error={errors.reps}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-space-md flex min-h-12 w-full items-center justify-center gap-space-xs bg-primary px-space-sm py-space-sm text-label-caps uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
      >
        <CheckCircleIcon width={18} height={18} className="shrink-0" />
        <span>{pending ? "[ Gemmer … ]" : "[ + Log sæt ]"}</span>
      </button>

      <p role="status" className="mt-space-sm min-h-4 font-mono text-caption-mono uppercase">
        {state.status === "success" && <span className="font-bold text-primary">{state.message}</span>}
        {state.status === "error" && (
          <span className="text-error">
            {state.message ?? errors.exercise_name ?? errors.performed_on}
          </span>
        )}
      </p>
    </form>
  );
}
