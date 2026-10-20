import Image from "next/image";
import Link from "next/link";
import { StrengthChart } from "@/app/components/home/StrengthChart";
import { QuickSetDialog } from "./QuickSetDialog";
import { categoryLabel } from "@/lib/categories";
import type { ExerciseSummary } from "@/lib/exercise-summary";
import { exercisePath } from "@/lib/exercise-name";
import { formatDayMonthLong, formatKg, formatNumber } from "@/lib/format";
import { describeThisMonth, monthlyMax } from "@/lib/progression";

const lift = (weightKg: number, reps: number) => `${formatKg(weightKg)} ${reps} reps`;

/**
 * Én øvelse fra Figma-designet "Progression" (node 22:7): kategori og dato,
 * navn med blyant-knap, START (første sæt), NUVÆRENDE (seneste sæt) og grafen
 * med "denne måned". Alle tal kommer fra brugerens sæt.
 */
export function ProgressionItem({ exercise, today }: { exercise: ExerciseSummary; today: string }) {
  const { name, category, latest, sets, thisMonth } = exercise;
  const first = sets[sets.length - 1]; // sets er nyeste først
  const href = exercisePath(name);
  const change = thisMonth.kind === "change" ? thisMonth.percent : null;

  return (
    <article className="text-navy">
      <p className="text-[10px] leading-[12px] uppercase">
        [ {category ? `${categoryLabel(category)} - ` : ""}
        {formatDayMonthLong(latest.performed_on)} ]
      </p>

      <div className="mt-[13px] flex h-5 items-center justify-between gap-space-sm">
        <h3 className="min-w-0 truncate text-[14px] leading-[17px] uppercase">
          <Link href={href} className="hover:underline">
            {name}
          </Link>
        </h3>
        {/* Blyanten åbner et overlay til at logge et nyt sæt */}
        <QuickSetDialog
          exerciseName={name}
          wgerExerciseId={exercise.wgerExerciseId}
          lastWeightKg={latest.weight_kg}
          lastReps={latest.reps}
          today={today}
          historyHref={href}
        />
      </div>

      <p className="mt-[11px] text-[10px] leading-[12px] font-semibold uppercase">
        Start: {lift(first.weight_kg, first.reps)}
      </p>

      <p className="mt-[23px] text-center text-[10px] leading-[12px] font-semibold uppercase">
        Nuværende {lift(latest.weight_kg, latest.reps)}
      </p>

      <div className="relative mx-auto mt-[5px] max-w-[300px]">
        <StrengthChart data={monthlyMax(sets)} color="#2C3240" id={`chart-${exercise.key.replace(/\W+/g, "-")}`} />
        {/* "↑ 25% DENNE MÅNED" i grafens øverste venstre hjørne */}
        <p className="absolute top-[5px] left-[18px] flex items-center gap-[3px] text-[6px] leading-[7px] font-semibold uppercase">
          {change !== null && change !== 0 && (
            <Image
              src="/design/arrow-right-small.svg"
              alt=""
              width={3.25}
              height={3.68198}
              className={change > 0 ? "-rotate-90" : "rotate-90"}
            />
          )}
          {change !== null
            ? `${formatNumber(Math.abs(change))} % denne måned`
            : describeThisMonth(thisMonth)}
        </p>
      </div>
    </article>
  );
}
