"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { type LogSetState, logSet } from "@/app/actions";
import { formatKg } from "@/lib/format";
import { Stepper, toDecimalInput } from "../Stepper";

/**
 * Blyant-knappen på Progression-siden: åbner et simpelt overlay, hvor man logger
 * et nyt sæt på øvelsen (kg og reps er udfyldt med det seneste sæt).
 * Bruger <dialog>, så fokus, Escape og baggrund håndteres af browseren.
 */
export function QuickSetDialog({
  exerciseName,
  wgerExerciseId,
  lastWeightKg,
  lastReps,
  today,
  historyHref,
}: {
  exerciseName: string;
  wgerExerciseId: number | null;
  lastWeightKg: number;
  lastReps: number;
  today: string;
  historyHref: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Ny key ved hver åbning: formularen starter forfra fra det seneste sæt
  const [run, setRun] = useState(0);

  const open = () => {
    setRun((n) => n + 1);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      {/* Blyant-knappen: 20 px cirkel som i designet, 44 px touch-område */}
      <button
        type="button"
        onClick={open}
        aria-label={`Log nyt sæt i ${exerciseName}`}
        aria-haspopup="dialog"
        className="-my-[12px] -mr-[12px] flex size-11 shrink-0 items-center justify-center"
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-navy">
          <Image src="/design/pencil.svg" alt="" width={8} height={9.7641} />
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={`quick-set-${exerciseName}`}
        // Klik på baggrunden lukker
        onClick={(e) => e.target === dialogRef.current && close()}
        className="m-auto w-[calc(100%-32px)] max-w-[360px] rounded-[5px] border-[0.5px] border-navy bg-cream p-0 text-navy backdrop:bg-navy/60"
      >
        <QuickSetForm
          key={run}
          exerciseName={exerciseName}
          wgerExerciseId={wgerExerciseId}
          lastWeightKg={lastWeightKg}
          lastReps={lastReps}
          today={today}
          historyHref={historyHref}
          onClose={close}
        />
      </dialog>
    </>
  );
}

function QuickSetForm({
  exerciseName,
  wgerExerciseId,
  lastWeightKg,
  lastReps,
  today,
  historyHref,
  onClose,
}: {
  exerciseName: string;
  wgerExerciseId: number | null;
  lastWeightKg: number;
  lastReps: number;
  today: string;
  historyHref: string;
  onClose: () => void;
}) {
  const [weight, setWeight] = useState(toDecimalInput(lastWeightKg));
  const [reps, setReps] = useState(String(lastReps));
  const [state, action, pending] = useActionState<LogSetState, FormData>(
    logSet,
    { status: "idle" },
  );
  const errors = state.status === "error" ? state.fieldErrors : {};

  // Luk et øjeblik efter, at sættet er gemt
  useEffect(() => {
    if (state.status !== "success") return;
    const timer = setTimeout(onClose, 1200);
    return () => clearTimeout(timer);
  }, [state, onClose]);

  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-[18px] p-[20px] font-inter"
    >
      <input type="hidden" name="exercise_name" value={exerciseName} />
      <input
        type="hidden"
        name="wger_exercise_id"
        value={wgerExerciseId ?? ""}
      />
      <input type="hidden" name="performed_on" value={today} />

      <div className="flex items-start justify-between gap-space-sm">
        <div className="min-w-0">
          <h2
            id={`quick-set-${exerciseName}`}
            className="text-[16px] font-bold uppercase"
          >
            {exerciseName}
          </h2>
          <p className="mt-[4px] text-[10px] font-semibold uppercase">
            Seneste sæt: {formatKg(lastWeightKg)} × {lastReps} reps
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Luk"
          className="-mt-[10px] -mr-[10px] flex size-11 shrink-0 items-center justify-center"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-navy">
            <Image
              src="/design/plus.svg"
              alt=""
              width={8}
              height={8}
              className="rotate-45"
            />
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-[12px]">
        <Stepper
          id={`quick-weight-${exerciseName}`}
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
          id={`quick-reps-${exerciseName}`}
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

      <p
        role="status"
        className="min-h-[15px] text-center text-[12px] font-semibold"
      >
        {state.status === "success" && state.message}
        {state.status === "error" && (
          <span className="text-error">
            {state.message ?? errors.exercise_name ?? errors.performed_on}
          </span>
        )}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="flex h-[62px] w-full items-center justify-center bg-navy text-[14px] font-bold text-cream uppercase hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Gemmer …" : "Gem sæt"}
      </button>

      <Link
        href={historyHref}
        className="-mt-[6px] flex min-h-11 items-center justify-center font-serif text-[12px] uppercase underline underline-offset-[3px]"
      >
        Se hele historikken
      </Link>
    </form>
  );
}
