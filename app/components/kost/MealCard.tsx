import Image from "next/image";
import Link from "next/link";
import { FoodLogItem } from "@/app/components/food/FoodLogItem";
import type { Macros, Meal } from "@/lib/food";
import { formatNumber } from "@/lib/format";
import type { FoodLogRow } from "@/lib/supabase/database.types";

/**
 * Måltidskort fra designet: navn, "ANBEFALET x–y KCAL" og en + knap til at tilføje mad.
 * Det loggede vises under overskriften i samme kort.
 */
export function MealCard({
  meal,
  label,
  date,
  recommended,
  totals,
  logs,
}: {
  meal: Meal;
  label: string;
  date: string;
  recommended: [number, number] | null;
  totals: Macros;
  logs: FoodLogRow[];
}) {
  return (
    <section aria-labelledby={`meal-${meal}`} className="rounded-[5px] border-[0.5px] border-navy font-serif text-navy">
      <div className="flex min-h-[56px] items-center justify-between gap-space-sm pr-[9px] pl-[13px]">
        <div className="min-w-0">
          <h3 id={`meal-${meal}`} className="text-[12px] uppercase">
            {label}
          </h3>
          <p className="text-[7px] uppercase">
            {recommended && `Anbefalet ${formatNumber(recommended[0])}–${formatNumber(recommended[1])} kcal`}
            {recommended && logs.length > 0 && " · "}
            {logs.length > 0 &&
              `Spist ${formatNumber(Math.round(totals.kcal))} kcal · ${formatNumber(Math.round(totals.protein_g))} g protein`}
          </p>
        </div>
        {/* + knappen: 24 px cirkel som i designet, 44 px touch-område */}
        <Link
          href={`/kost/tilfoej?meal=${meal}&dato=${date}`}
          aria-label={`Tilføj mad til ${label.toLowerCase()}`}
          className="-my-[10px] flex size-11 shrink-0 items-center justify-center"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-navy">
            <Image src="/design/plus.svg" alt="" width={8} height={8} />
          </span>
        </Link>
      </div>

      {logs.length > 0 && (
        <ul className="divide-y divide-navy/15 border-t-[0.5px] border-navy px-[13px]">
          {logs.map((log) => (
            <li key={log.id}>
              <FoodLogItem log={log} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
