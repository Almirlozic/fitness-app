"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

/**
 * "ALLE ØVELSER ⌄" fra designet. Den synlige tekst er 14 px som i designet;
 * den rigtige <select> ligger usynligt ovenpå med 16 px, så iPhone ikke
 * zoomer ind, og den virker stadig med tastatur og skærmlæser.
 * Valget gemmes i ?ovelse=, så siden kan renderes på serveren.
 */
export function ExercisePicker({ names, selected }: { names: string[]; selected: string }) {
  const router = useRouter();

  return (
    <div className="relative h-14 w-full border border-navy focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy">
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-[12px] right-12 -translate-y-1/2 truncate font-serif text-[14px] text-navy uppercase"
      >
        {selected || "Alle øvelser"}
      </span>
      {/* Pilen fra designet peger mod højre og er drejet 90° */}
      <Image
        src="/design/chevron-down.svg"
        alt=""
        width={8.36396}
        height={14.7279}
        className="pointer-events-none absolute top-1/2 right-[19px] -translate-y-1/2 rotate-90"
      />
      <label htmlFor="exercise-picker" className="sr-only">
        Vælg øvelse
      </label>
      <select
        id="exercise-picker"
        value={selected}
        onChange={(e) => {
          const value = e.target.value;
          router.replace(value ? `/?ovelse=${encodeURIComponent(value)}` : "/", { scroll: false });
        }}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 text-[16px]"
      >
        <option value="">Alle øvelser</option>
        {names.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
