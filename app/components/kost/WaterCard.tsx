"use client";

import Image from "next/image";
import { useOptimistic, useTransition } from "react";
import { setWaterGlasses } from "@/app/(app)/kost/actions";
import { formatNumber } from "@/lib/format";
import { GLASSES_PER_DAY, waterLiters } from "@/lib/kost";

/**
 * Vand-kortet fra designet: 8 glas à 0,25 L = 2 L om dagen. Dagen starter på 0.
 * Tryk på et glas for at fylde op til det glas; tryk på det sidst fyldte for at
 * tømme det igen. Tallet opdateres med det samme og gemmes pr. dag.
 */
export function WaterCard({ date, glasses }: { date: string; glasses: number | null }) {
  const [optimistic, setOptimistic] = useOptimistic(glasses ?? 0);
  const [, startTransition] = useTransition();
  const goal = waterLiters(GLASSES_PER_DAY);

  function tap(index: number) {
    const next = index + 1 === optimistic ? index : index + 1;
    startTransition(async () => {
      setOptimistic(next);
      await setWaterGlasses(date, next);
    });
  }

  return (
    <section aria-labelledby="water-heading" className="rounded-[5px] bg-navy px-[13px] pt-[7px] pb-[12px] font-serif text-white">
      <div className="flex items-baseline justify-between">
        <h3 id="water-heading" className="text-[10px] uppercase">
          Vand ({formatNumber(goal)} L)
        </h3>
        {glasses !== null && (
          // Opdateres med det samme, når man trykker på et glas
          <p className="text-[10px] uppercase" aria-hidden>
            {formatNumber(waterLiters(optimistic))} / {formatNumber(goal)} L
          </p>
        )}
      </div>
      {glasses === null ? (
        <p className="mt-[8px] pb-[6px] font-inter text-[10px] text-white/80">
          Vand kunne ikke hentes lige nu. Prøv igen senere.
        </p>
      ) : (
        <>
      <p className="sr-only" aria-live="polite">
        {formatNumber(waterLiters(optimistic))} af {formatNumber(goal)} liter vand ({optimistic} af{" "}
        {GLASSES_PER_DAY} glas)
      </p>
      <div className="mt-[3px] flex justify-between px-[11px]">
        {Array.from({ length: GLASSES_PER_DAY }, (_, i) => {
          const full = i < optimistic;
          return (
            <button
              key={i}
              type="button"
              onClick={() => tap(i)}
              aria-pressed={full}
              aria-label={`Glas ${i + 1} af ${GLASSES_PER_DAY}`}
              className="flex h-11 w-[30px] items-center justify-center"
            >
              <Image
                src={full ? "/design/glass-full.svg" : "/design/glass-empty.svg"}
                alt=""
                width={15.1181}
                height={22.15}
              />
            </button>
          );
        })}
      </div>
        </>
      )}
    </section>
  );
}
