import Link from "next/link";
import type { Macros, Meal } from "@/lib/food";
import { formatNumber } from "@/lib/format";
import type { FoodLogRow } from "@/lib/supabase/database.types";
import { PlusIcon } from "../Icons";
import { FoodLogItem } from "./FoodLogItem";

export function MealSection({
  meal,
  label,
  date,
  totals,
  logs,
}: {
  meal: Meal;
  label: string;
  date: string;
  totals: Macros;
  logs: FoodLogRow[];
}) {
  return (
    <section aria-labelledby={`meal-${meal}`} className="mb-space-lg">
      <div className="flex items-end justify-between gap-space-md border-b border-primary pb-space-xs">
        <h2 id={`meal-${meal}`} className="text-label-caps uppercase tracking-widest text-primary">
          [ {label} ]
        </h2>
        <span className="font-mono text-caption-mono uppercase text-secondary">
          {formatNumber(Math.round(totals.kcal))} kcal · {formatNumber(Math.round(totals.protein_g))} g protein
        </span>
      </div>

      {logs.length > 0 && (
        <ul className="divide-y divide-surface-container-high">
          {logs.map((log) => (
            <li key={log.id}>
              <FoodLogItem log={log} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/kost/tilfoej?meal=${meal}&dato=${date}`}
        className="mt-space-xs flex min-h-11 items-center gap-space-xs font-mono text-label-tag uppercase text-primary hover:underline"
      >
        <PlusIcon width={16} height={16} />
        Tilføj
      </Link>
    </section>
  );
}
