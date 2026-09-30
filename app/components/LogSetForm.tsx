"use client";

import { useActionState, useState } from "react";
import { type LogSetState, logSet } from "@/app/actions";
import { exerciseKey } from "@/lib/exercise-name";
import { type ExerciseChoice, ExerciseSearch, type OwnExercise } from "./ExerciseSearch";
import { CheckCircleIcon } from "./Icons";
import { FieldError, Stepper, toDecimalInput } from "./Stepper";

export function LogSetForm({
  ownExercises,
  today,
  onClose,
}: {
  ownExercises: OwnExercise[];
  today: string;
  onClose?: () => void;
}) {
  const [name, setName] = useState("");
  const [wgerId, setWgerId] = useState<number | null>(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [date, setDate] = useState(today);

  const [state, formAction, pending] = useActionState(
    async (prev: LogSetState, formData: FormData) => {
      const result = await logSet(prev, formData);
      if (result.status === "success") {
        setWeight("");
        setReps("");
      }
      return result;
    },
    { status: "idle" },
  );
  const errors = state.status === "error" ? state.fieldErrors : {};

  function select(choice: ExerciseChoice) {
    setName(choice.name);
    setWgerId(choice.wgerExerciseId);
    // Kendt øvelse: forudfyld med mit sidste sæt
    const own =
      choice.own ?? ownExercises.find((e) => exerciseKey(e.name) === exerciseKey(choice.name));
    if (own) {
      setWeight(toDecimalInput(own.lastWeightKg));
      setReps(String(own.lastReps));
    }
  }

  return (
    <form
      id="log"
      action={formAction}
      noValidate
      className="mb-space-xl scroll-mt-20 border-t-2 border-primary bg-surface-container-low p-space-md"
    >
      <div className="mb-space-md flex items-start justify-between gap-space-md">
        <h2 className="text-label-caps uppercase tracking-wider text-primary">
          [ Log et sæt ]
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="-my-space-sm -mr-space-sm min-h-11 px-space-sm font-mono text-caption-mono uppercase text-secondary hover:text-primary"
          >
            [ Luk ]
          </button>
        )}
      </div>

      <div className="flex flex-col gap-space-md">
        <ExerciseSearch
          value={name}
          onValueChange={(v) => {
            setName(v);
            setWgerId(null);
          }}
          onSelect={select}
          ownExercises={ownExercises}
          error={errors.exercise_name}
        />
        <input type="hidden" name="wger_exercise_id" value={wgerId ?? ""} />

        <div className="grid grid-cols-2 items-start gap-space-md">
          <Stepper
            id="log-weight"
            name="weight_kg"
            label="Kg"
            value={weight}
            onChange={setWeight}
            step={2.5}
            inputMode="decimal"
            error={errors.weight_kg}
          />
          <Stepper
            id="log-reps"
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

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="log-date" className="font-mono text-label-tag uppercase text-secondary">
            [ Dato ]
          </label>
          <input
            id="log-date"
            name="performed_on"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 w-full border border-surface-container-high bg-surface-container-lowest px-space-sm font-mono text-body-md text-primary focus:border-primary focus:outline-none"
          />
          {errors.performed_on && <FieldError>{errors.performed_on}</FieldError>}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-space-md flex min-h-12 w-full items-center justify-center gap-space-xs bg-primary px-space-sm py-space-sm text-label-caps uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
      >
        <CheckCircleIcon width={18} height={18} className="shrink-0" />
        <span>{pending ? "[ Gemmer … ]" : "[ + Gem sæt ]"}</span>
      </button>

      <p role="status" className="mt-space-sm min-h-4 font-mono text-caption-mono uppercase">
        {state.status === "success" && <span className="font-bold text-primary">{state.message}</span>}
        {state.status === "error" && state.message && <span className="text-error">{state.message}</span>}
      </p>
    </form>
  );
}
