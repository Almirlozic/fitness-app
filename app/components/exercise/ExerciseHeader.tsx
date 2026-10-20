"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { type RenameState, renameExercise } from "@/app/actions";

/**
 * Toppen af øvelsessiden i appens stil: × tilbage til Progression, kategori-mærke,
 * navnet i Inria Serif og "Omdøb", som åbner et felt til et nyt navn.
 */
export function ExerciseHeader({ name, tag }: { name: string; tag: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<RenameState, FormData>(renameExercise, {});

  return (
    <header className="text-navy">
      <Link
        href="/progression"
        aria-label="Tilbage til Progression"
        className="-mt-[10px] -ml-[10px] flex size-11 items-center justify-center"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-navy">
          <Image src="/design/plus.svg" alt="" width={8} height={8} className="rotate-45" />
        </span>
      </Link>

      <p className="mt-[14px] font-inter text-[10px] uppercase">[ {tag} ]</p>

      {editing ? (
        <form action={formAction} className="mt-[8px] flex flex-col gap-[10px]">
          <input type="hidden" name="old_name" value={name} />
          <label htmlFor="exercise-name" className="font-serif text-[12px] uppercase">
            Nyt navn
          </label>
          <input
            id="exercise-name"
            name="new_name"
            defaultValue={name}
            autoFocus
            autoCapitalize="words"
            className="h-11 w-full rounded-[5px] border-[0.5px] border-navy bg-cream px-[12px] font-inter text-[16px] focus:outline-2 focus:outline-offset-1 focus:outline-navy"
          />
          {state.error && <p className="font-inter text-[10px] text-error">{state.error}</p>}
          <div className="flex gap-[10px]">
            <button
              type="submit"
              disabled={pending}
              className="h-11 bg-navy px-[18px] font-inter text-[12px] font-bold text-cream uppercase disabled:opacity-60"
            >
              {pending ? "Gemmer …" : "Gem navn"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="h-11 px-[12px] font-serif text-[12px] uppercase underline underline-offset-[3px]"
            >
              Annuller
            </button>
          </div>
        </form>
      ) : (
        <>
          <h1 className="mt-[6px] font-serif text-[32px] leading-[38px] wrap-break-word uppercase">{name}</h1>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="-ml-[2px] flex min-h-11 items-center px-[2px] font-serif text-[12px] uppercase underline underline-offset-[3px]"
          >
            Omdøb øvelse
          </button>
        </>
      )}
    </header>
  );
}
