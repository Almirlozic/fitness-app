import type { ExerciseSummary } from "@/lib/exercise-summary";
import { HistoryTable } from "./HistoryTable";
import { LiftComparison } from "./LiftComparison";

export function ProgressionHistory({
  exercise,
  today,
}: {
  exercise: ExerciseSummary;
  today: string;
}) {
  const { sets, latest, previous } = exercise;

  return (
    <section className="mt-space-xl" aria-labelledby="history-heading">
      <div className="flex items-start justify-between gap-space-md border-b border-primary pb-space-xs">
        <h2 id="history-heading" className="text-label-caps uppercase tracking-widest text-primary">
          [ Historik // alle sæt ]
        </h2>
        <span className="text-right font-mono text-caption-mono uppercase text-secondary">
          [ {sets.length} {sets.length === 1 ? "sæt" : "sæt i alt"} ]
        </span>
      </div>
      {previous && <LiftComparison current={latest} previous={previous} />}
      <HistoryTable sets={sets} today={today} />
    </section>
  );
}
