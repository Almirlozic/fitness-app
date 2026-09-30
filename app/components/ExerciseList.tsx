import type { ExerciseSummary } from "@/lib/exercise-summary";
import { ExerciseCard } from "./ExerciseCard";

export function ExerciseList({
  exercises,
  title = "Mine øvelser",
  emptyText = "Ingen øvelser endnu – log dit første sæt ovenfor",
}: {
  exercises: ExerciseSummary[];
  title?: string;
  emptyText?: string;
}) {
  return (
    <section className="pb-space-2xl" aria-labelledby="exercise-list-heading">
      <div className="mb-space-md flex items-center justify-between border-b border-primary pb-space-xs">
        <h2
          id="exercise-list-heading"
          className="text-label-caps uppercase tracking-widest text-primary"
        >
          [ {title} ]
        </h2>
        <span className="font-mono text-caption-mono uppercase text-secondary">
          [ {exercises.length} {exercises.length === 1 ? "øvelse" : "øvelser"} ]
        </span>
      </div>

      {exercises.length === 0 ? (
        <p className="border border-dashed border-surface-container-high px-space-md py-space-xl text-center font-mono text-caption-mono uppercase text-secondary">
          {emptyText}
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-surface-container-high">
          {exercises.map((exercise, i) => (
            <ExerciseCard key={exercise.key} exercise={exercise} highlighted={i === 0} />
          ))}
        </div>
      )}
    </section>
  );
}
