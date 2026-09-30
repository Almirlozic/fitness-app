import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import type { ExerciseSummary } from "@/lib/exercise-summary";
import { exercisePath } from "@/lib/exercise-name";
import { formatDate, formatKg, formatLift } from "@/lib/format";
import { type ThisMonthChange, describeThisMonth, monthlyMax } from "@/lib/progression";
import { Sparkline } from "./Sparkline";

function thisMonthBadge(change: ThisMonthChange) {
  if (change.kind !== "change") return describeThisMonth(change);
  const arrow = change.percent > 0 ? "↑" : change.percent < 0 ? "↓" : "→";
  return `${arrow} ${describeThisMonth(change)} denne måned`;
}

export function ExerciseCard({
  exercise,
  highlighted = false,
}: {
  exercise: ExerciseSummary;
  highlighted?: boolean;
}) {
  const { name, category, latest, previous, thisMonth, sets } = exercise;

  return (
    <Link
      href={exercisePath(name)}
      className="group flex flex-col gap-space-xs py-space-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-center justify-between gap-space-sm">
        <span className="font-mono text-caption-mono uppercase text-secondary">
          [ {category ? `${categoryLabel(category)} · ` : ""}
          {formatDate(latest.performed_on)} ]
        </span>
        <span className="bg-surface-container px-space-xs py-0.5 text-right font-mono text-caption-mono font-bold uppercase text-primary">
          {thisMonthBadge(thisMonth)}
        </span>
      </div>

      <div className="mt-space-xs flex items-baseline justify-between gap-space-md">
        <h3 className="min-w-0 text-headline-sm uppercase tracking-tight wrap-break-word text-primary">
          {name}
        </h3>
        <span className="shrink-0 font-mono text-headline-sm font-bold uppercase text-primary">
          {formatKg(latest.weight_kg)}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-space-md gap-y-0.5">
        <span className="text-body-sm font-semibold text-primary">
          Nuværende: {formatLift(latest.weight_kg, latest.reps)}
        </span>
        {previous && (
          <span className="font-mono text-caption-mono text-secondary">
            Tidligere: {formatLift(previous.weight_kg, previous.reps)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-space-md gap-y-space-sm pt-space-xs">
        <Sparkline values={monthlyMax(sets).map((m) => m.maxKg)} />
        <span
          className={`ml-auto whitespace-nowrap border px-space-sm py-1 font-mono text-label-tag uppercase transition-colors ${
            highlighted
              ? "border-primary text-primary group-hover:bg-primary group-hover:text-on-primary"
              : "border-surface-container-high text-secondary group-hover:border-primary group-hover:text-primary"
          }`}
        >
          [ Se historik / log sæt ]
        </span>
      </div>
    </Link>
  );
}
