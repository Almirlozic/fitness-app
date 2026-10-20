"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { deleteFoodLog } from "@/app/(app)/kost/actions";
import { formatPortion } from "@/lib/food";
import { formatNumber } from "@/lib/format";
import type { FoodLogRow } from "@/lib/supabase/database.types";

/**
 * Én logget madvare fra designet: "Banan 105 kcal ✎", portionen under og et ×.
 * Blyanten åbner "Vælg mængde", så den kan rettes. × beder om bekræftelse ("Slet?").
 */
export function MealLogRow({ log }: { log: FoodLogRow }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <li className="text-ink">
      <div className="flex min-h-10 items-center justify-between gap-space-sm">
        <div className="min-w-0 font-inter">
          <p className="flex items-center gap-[4px] text-[10px]">
            <span className="truncate">
              {log.food_name} {formatNumber(Math.round(log.kcal))} kcal
            </span>
            {/* Blyanten åbner "Vælg mængde" med samme tal og enhed */}
            <Link
              href={`/kost/tilfoej/vare?rediger=${log.id}&tilbage=tilfoej`}
              aria-label={`Ret ${log.food_name}`}
              className="-m-[16px] flex size-11 shrink-0 items-center justify-center"
            >
              <Image src="/design/edit-outline.svg" alt="" width={5.36193} height={5.36193} />
            </Link>
          </p>
          <p className="text-[7px]">{formatPortion(log)}</p>
        </div>

        {/* × fra designet (24 px cirkel, 44 px touch-område) */}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirming) return setConfirming(true);
            startTransition(async () => {
              await deleteFoodLog(log.id);
              setConfirming(false);
            });
          }}
          aria-label={confirming ? `Bekræft: slet ${log.food_name}` : `Slet ${log.food_name}`}
          className="-my-[10px] -mr-[10px] flex h-11 min-w-11 shrink-0 items-center justify-center disabled:opacity-60"
        >
          {confirming || pending ? (
            <span className="rounded-full bg-error px-[10px] py-[5px] font-inter text-[10px] font-bold text-cream">
              {pending ? "Sletter …" : "Slet?"}
            </span>
          ) : (
            <span className="flex size-6 items-center justify-center rounded-full bg-navy">
              <Image src="/design/plus.svg" alt="" width={8} height={8} className="rotate-45" />
            </span>
          )}
        </button>
      </div>

    </li>
  );
}
