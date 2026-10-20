"use client";

import { useActionState, useState } from "react";
import { type LogSetState, logSet } from "@/app/actions";
import { exerciseKey } from "@/lib/exercise-name";
import { type ExerciseChoice, ExerciseSearch, type OwnExercise } from "./ExerciseSearch";
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
      // Stilen følger Figma-designet: mørkeblå streg, Inter-overskrift som "Din styrke",
      // Inria Serif-labels som "ALLE ØVELSER" og en knap som "OPRET ØVELSE"
      className="scroll-mt-20 border-t border-navy pt-[24px] font-inter text-navy"
    >
      <div className="mb-[24px] flex items-center justify-between gap-space-md">
        <h3 className="text-[18px] font-bold">Log et sæt</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="-mr-space-sm min-h-11 px-space-sm font-serif text-[14px] uppercase underline underline-offset-[3px] hover:opacity-70"
          >
            Luk
          </button>
        )}
      </div>

      <div className="flex flex-col gap-[20px]">
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
            tone="design"
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
            tone="design"
          />
        </div>

        <div className="flex flex-col gap-space-xs">
          <label htmlFor="log-date" className="font-serif text-[14px] text-navy uppercase">
            Dato
          </label>
          <input
            id="log-date"
            name="performed_on"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="h-14 w-full border border-navy bg-cream px-[12px] font-inter text-[16px] font-medium text-navy focus:outline-2 focus:outline-offset-2 focus:outline-navy"
          />
          {errors.performed_on && <FieldError>{errors.performed_on}</FieldError>}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-[32px] flex h-[62px] w-full items-center justify-center bg-navy text-[18px] font-bold uppercase text-sand transition-opacity hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Gemmer …" : "Gem sæt"}
      </button>

      <p role="status" className="mt-[12px] min-h-5 text-[14px] font-semibold">
        {state.status === "success" && <span className="text-navy">{state.message}</span>}
        {state.status === "error" && state.message && <span className="text-error">{state.message}</span>}
      </p>
    </form>
  );
}
