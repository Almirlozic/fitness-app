import type { ReactNode } from "react";
import type { ExerciseSummary } from "@/lib/exercise-summary";
import { formatKg } from "@/lib/format";
import { describeThisMonthKg, monthlyMax, nextGoalKg } from "@/lib/progression";
import { StrengthChart } from "./StrengthChart";

/**
 * Kortet "Din styrke" fra Figma-designet (node 11:64). Afstandene er designets:
 * 32 px top, 30 px før grafen, 29 px før "Næste mål", 45 px før knappen og 40 px bund.
 * Alle tal kommer fra brugerens sæt; mangler der data, vises en fallback-tekst.
 * `children` er knappen (og log-formularen) nederst.
 */
export function StrengthCard({
  exercise,
  today,
  children,
}: {
  exercise: ExerciseSummary | null;
  today: string;
  children: ReactNode;
}) {
  // "Sidste bedst": tungeste kg i øvelsens seneste måned med sæt
  const best = exercise?.sinceStart.latestKg ?? null;

  return (
    <section
      aria-labelledby="strength-heading"
      className="border border-frame px-[23px] pt-[32px] pb-[40px] font-inter text-navy"
    >
      <h3 id="strength-heading" className="text-[18px] font-bold">
        Din styrke
      </h3>

      {exercise && best !== null ? (
        <>
          <p className="mt-[8px] text-[14px] font-medium text-ink">{exercise.name}</p>
          <p className="text-[48px] leading-[58px] font-extrabold tracking-[-0.96px] whitespace-nowrap">
            {formatKg(best)}
          </p>
          <p className="mt-[6px] text-[16px] font-semibold">
            {describeThisMonthKg(exercise.sets, today)}
          </p>

          <div className="mt-[30px]">
            <StrengthChart data={monthlyMax(exercise.sets)} />
          </div>

          <div className="mt-[29px] flex items-center justify-between text-[18px] font-bold text-ink">
            <span>Næste mål:</span>
            <span>{formatKg(nextGoalKg(best))}</span>
          </div>
        </>
      ) : (
        <>
          <p className="mt-[8px] text-[14px] font-medium text-ink">Ingen øvelser endnu</p>
          <p className="mt-[16px] text-[16px] font-semibold">
            Opret din første øvelse og log et sæt – så viser vi din styrke, din kurve og dit næste
            mål her.
          </p>
        </>
      )}

      <div className="mt-[45px]">{children}</div>
    </section>
  );
}
