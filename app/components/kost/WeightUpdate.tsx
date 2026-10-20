"use client";

import { useState, useTransition } from "react";
import { updateWeight } from "@/app/(app)/kost/actions";
import { formatKg } from "@/lib/format";

/**
 * "OPDATER DIN VÆGT" fra designet: bar fra startvægt mod målvægt. Tryk på
 * overskriften åbner et felt, hvor den nye vægt gemmes i profilen.
 */
export function WeightUpdate({
  currentKg,
  goalKg,
  progress,
}: {
  currentKg: number | null;
  goalKg: number | null;
  /** 0–1 fra startvægt mod målvægt; null hvis data mangler */
  progress: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentKg === null ? "" : String(currentKg).replace(".", ","));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div className="font-serif text-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="-mb-[10px] flex min-h-11 items-center text-[12px] uppercase"
      >
        Opdater din vægt
      </button>
      <p className="mt-[1px] text-[6px] leading-[7px] uppercase">Kom tættere på dit mål</p>

      {progress !== null && currentKg !== null && goalKg !== null ? (
        <div className="mt-[6px] w-[161px]">
          <div
            className="h-[6px] w-full rounded-[30px] bg-cream"
            role="progressbar"
            aria-label="Fremgang mod målvægt"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-[30px] bg-[#417a27]" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="mt-[6px] flex justify-between text-[10px] leading-[12px] uppercase">
            <span>{formatKg(currentKg)}</span>
            <span>{formatKg(goalKg)}</span>
          </div>
        </div>
      ) : (
        <p className="mt-[6px] text-[10px] uppercase">Tilføj din vægt for at se din fremgang</p>
      )}

      {open && (
        <form
          className="mt-[10px] flex items-start gap-[8px]"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await updateWeight(value);
              if (result.ok) {
                setError(undefined);
                setOpen(false);
              } else setError(result.error);
            });
          }}
        >
          <div>
            <label htmlFor="new-weight" className="sr-only">
              Ny vægt i kg
            </label>
            <input
              id="new-weight"
              inputMode="decimal"
              autoComplete="off"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="fx 82,5"
              className="h-11 w-[110px] border border-cream bg-transparent px-[10px] font-inter text-[16px] text-white placeholder:text-white/50 focus:outline-2 focus:outline-cream"
            />
            {error && <p className="mt-[4px] max-w-[220px] font-inter text-[10px] text-[#ffb4a9]">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="h-11 bg-cream px-[14px] font-inter text-[12px] font-bold text-navy uppercase disabled:opacity-60"
          >
            {pending ? "Gemmer …" : "Gem"}
          </button>
        </form>
      )}
    </div>
  );
}
