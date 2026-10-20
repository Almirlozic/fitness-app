import type { Macros } from "@/lib/food";
import { formatNumber } from "@/lib/format";
import { fraction } from "@/lib/kost";
import type { FoodLogRow } from "@/lib/supabase/database.types";
import { MacroCards } from "./MacroCards";
import { MealLogRow } from "./MealLogRow";

/**
 * Kortet fra "Tilføj mad"-designet: DAGLIGT INDTAG (kcal-bar), makro-kortene og
 * det, der er logget i måltidet. Alle tal kommer fra brugerens logs og profil.
 */
export function DayIntakeCard({
  eaten,
  targets,
  mealLabel,
  logs,
}: {
  eaten: Macros;
  targets: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  mealLabel: string;
  logs: FoodLogRow[];
}) {
  const over = targets.kcal > 0 && eaten.kcal > targets.kcal;
  return (
    <section
      aria-label="Dagligt indtag"
      className="rounded-[5px] border-[0.5px] border-navy px-[10px] pt-[10px] pb-[16px]"
    >
      <div className="flex items-baseline justify-between font-serif text-[10px] text-black uppercase">
        <h2>Dagligt indtag</h2>
        <p>
          {formatNumber(Math.round(eaten.kcal))} / {targets.kcal > 0 ? formatNumber(targets.kcal) : "–"}
        </p>
      </div>
      <div
        className="mt-[6px] h-[8px] w-full rounded-[10px] bg-navy"
        role="progressbar"
        aria-label={`${Math.round(eaten.kcal)} af ${targets.kcal} kcal i dag`}
        aria-valuenow={Math.round(fraction(eaten.kcal, targets.kcal) * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-[10px] ${over ? "bg-[#c0533f]" : "bg-[#417a27]"}`}
          style={{ width: `${fraction(eaten.kcal, targets.kcal) * 100}%` }}
        />
      </div>

      <div className="mt-[22px] px-[6px]">
        <MacroCards
          macros={[
            { label: "Kulhydrater", eaten: eaten.carbs_g, target: targets.carbs_g },
            { label: "Fedt", eaten: eaten.fat_g, target: targets.fat_g },
            { label: "Protein", eaten: eaten.protein_g, target: targets.protein_g },
          ]}
        />
      </div>

      <div className="mt-[18px] px-[6px]">
        {logs.length === 0 ? (
          <p className="font-inter text-[10px] text-navy/70">
            Intet i {mealLabel.toLowerCase()} endnu – søg eller scan for at tilføje.
          </p>
        ) : (
          <ul className="flex flex-col gap-[2px]">
            {logs.map((log) => (
              <MealLogRow key={log.id} log={log} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
