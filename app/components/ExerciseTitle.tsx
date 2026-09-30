"use client";

import { useActionState, useState } from "react";
import { type RenameState, renameExercise } from "@/app/actions";
import { FieldError } from "./Stepper";

export function ExerciseTitle({ name, type }: { name: string; type: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<RenameState, FormData>(
    renameExercise,
    {},
  );

  return (
    <section className="mt-space-lg mb-space-md">
      <button
        type="button"
        onClick={() => setEditing((v) => !v)}
        className="-ml-space-xs mb-space-xs min-h-11 px-space-xs font-mono text-caption-mono uppercase tracking-wider text-primary underline underline-offset-2 transition-colors hover:text-secondary"
      >
        {editing ? "[ Annuller ]" : "[ Omdøb øvelse ]"}
      </button>

      {editing ? (
        <form action={formAction} className="flex flex-col gap-space-sm">
          <input type="hidden" name="old_name" value={name} />
          <label htmlFor="exercise-name" className="sr-only">
            Nyt navn på øvelsen
          </label>
          <input
            id="exercise-name"
            name="new_name"
            defaultValue={name}
            autoFocus
            autoCapitalize="words"
            className="w-full border-b-2 border-primary bg-transparent text-display-hero-mobile uppercase leading-none tracking-tight text-primary outline-none md:text-display-hero"
          />
          {state.error && <FieldError>{state.error}</FieldError>}
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 self-start border border-primary px-space-md font-mono text-label-tag uppercase text-primary hover:bg-primary hover:text-on-primary disabled:opacity-60"
          >
            {pending ? "[ Gemmer … ]" : "[ Gem navn ]"}
          </button>
        </form>
      ) : (
        <h1 className="text-display-hero-mobile uppercase leading-none tracking-tight wrap-break-word text-primary md:text-display-hero">
          {name}
        </h1>
      )}

      <p className="mt-space-xs flex flex-wrap items-center gap-x-space-xs font-mono text-caption-mono uppercase">
        <span className="text-secondary">Type:</span>
        <span className="font-bold text-primary">{type}</span>
      </p>
    </section>
  );
}
