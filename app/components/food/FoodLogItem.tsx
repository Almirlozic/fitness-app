"use client";

import Link from "next/link";
import { deleteFoodLog } from "@/app/(app)/kost/actions";
import { formatPortion } from "@/lib/food";
import { formatNumber } from "@/lib/format";
import type { FoodLogRow } from "@/lib/supabase/database.types";
import { DeleteButton } from "../DeleteButton";

/**
 * En logget madvare på kostsiden: "Æg · 4 stk (220 g) · 314 kcal".
 * Tryk åbner "Vælg mængde" med samme tal og enhed, så den kan rettes.
 */
export function FoodLogItem({ log }: { log: FoodLogRow }) {
  return (
    <div className="flex items-center gap-space-xs">
      <Link
        href={`/kost/tilfoej/vare?rediger=${log.id}&tilbage=kost`}
        aria-label={`Ret ${log.food_name}`}
        className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-space-md py-space-sm text-left"
      >
        <span className="min-w-0">
          <span className="block truncate font-inter text-[12px] font-medium text-navy">{log.food_name}</span>
          <span className="font-inter text-[10px] text-navy/70">{formatPortion(log)}</span>
        </span>
        <span className="shrink-0 font-inter text-[12px] font-bold text-navy">
          {formatNumber(Math.round(log.kcal))} kcal
        </span>
      </Link>
      {/* Slet direkte fra listen – første tryk viser "Slet?", andet sletter */}
      <DeleteButton
        onDelete={deleteFoodLog.bind(null, log.id)}
        label="Slet"
        confirmLabel="Slet?"
        ariaLabel={`Slet ${log.food_name}`}
        className="-mr-space-sm shrink-0 px-space-sm font-inter text-[10px]"
      />
    </div>
  );
}
