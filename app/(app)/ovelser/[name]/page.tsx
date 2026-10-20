import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deleteExercise } from "@/app/actions";
import { BottomNav } from "@/app/components/BottomNav";
import { DeleteButton } from "@/app/components/DeleteButton";
import { ExerciseHeader } from "@/app/components/exercise/ExerciseHeader";
import { ExerciseHistory } from "@/app/components/exercise/ExerciseHistory";
import { ExerciseLogCard } from "@/app/components/exercise/ExerciseLogCard";
import { ExerciseStats } from "@/app/components/exercise/ExerciseStats";
import { StrengthChart } from "@/app/components/home/StrengthChart";
import { categoryLabel } from "@/lib/categories";
import { formatDate, formatKg, formatMonthShort, formatNumber, formatPercent, todayIso } from "@/lib/format";
import { describeThisMonth, monthlyMax } from "@/lib/progression";
import { getExerciseSummary } from "@/lib/sets";

type Props = PageProps<"/ovelser/[name]">;

function exerciseName(param: string) {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `FORM – ${exerciseName((await params).name)}` };
}

// Øvelsens side ("Se hele historikken") i samme stil som resten af appen.
export default async function ExercisePage({ params }: Props) {
  const today = todayIso();
  const exercise = await getExerciseSummary(exerciseName((await params).name), today);
  if (!exercise) notFound();

  const { name, category, latest, previous, thisMonth, sinceStart, wgerExerciseId, sets } = exercise;
  const months = monthlyMax(sets);
  const tag = wgerExerciseId
    ? `${category ? `${categoryLabel(category)} - ` : ""}wger #${wgerExerciseId}`
    : "Egen øvelse";

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-[22px] pt-[calc(env(safe-area-inset-top)+27px)] pb-[calc(env(safe-area-inset-bottom)+112px)] text-navy">
        <ExerciseHeader key={name} name={name} tag={tag} />

        <div className="mt-[18px]">
          <ExerciseStats
            stats={[
              {
                label: "Nu",
                value: formatKg(latest.weight_kg),
                caption: previous
                  ? `× ${latest.reps} reps · før ${formatKg(previous.weight_kg)}`
                  : `× ${latest.reps} reps`,
              },
              {
                label: "Denne måned",
                value: thisMonth.kind === "change" ? formatPercent(thisMonth.percent) : "–",
                caption: thisMonth.kind === "change" ? "Max kg vs. før" : describeThisMonth(thisMonth),
              },
              {
                label: "Siden start",
                value: sinceStart.percent === null ? "Fra 0 kg" : formatPercent(sinceStart.percent),
                caption: `${formatNumber(sinceStart.firstKg)} → ${formatKg(sinceStart.latestKg)}`,
              },
            ]}
          />
        </div>

        <section aria-labelledby="chart-heading" className="mt-[31px]">
          <div className="flex items-baseline justify-between font-serif text-[12px] uppercase">
            <h2 id="chart-heading">Tungeste kg pr. måned</h2>
            <span className="text-[10px]">
              [ {months.length} {months.length === 1 ? "måned" : "måneder"} ]
            </span>
          </div>
          <div className="mx-auto mt-[10px] max-w-[300px]">
            <StrengthChart data={months} color="#2C3240" id="exercise-chart" />
            {months.length > 1 && (
              <div className="mt-[4px] flex justify-between font-inter text-[9px] uppercase">
                <span>{formatMonthShort(months[0].month)}</span>
                <span>{formatMonthShort(months[months.length - 1].month)}</span>
              </div>
            )}
          </div>
        </section>

        <div className="mt-[31px]">
          <ExerciseLogCard
            key={latest.id}
            exerciseName={name}
            wgerExerciseId={wgerExerciseId}
            lastWeightKg={latest.weight_kg}
            lastReps={latest.reps}
            today={today}
          />
        </div>

        <div className="mt-[31px]">
          <ExerciseHistory sets={sets} today={today} />
        </div>

        <div className="mt-[32px] text-center">
          <DeleteButton
            onDelete={deleteExercise.bind(null, name)}
            label="Slet øvelse og alle sæt"
            confirmLabel="Sikker? Tryk igen for at slette alt"
            className="px-space-sm font-inter text-[12px] underline underline-offset-[3px]"
          />
          <p className="font-inter text-[10px] text-navy/70">
            Sletter al historik for øvelsen. Kan ikke fortrydes.
          </p>
        </div>

        <p className="mt-[32px] font-inter text-[10px] text-navy/70">
          Seneste sæt {formatDate(latest.performed_on)} · Øvelsesdata fra{" "}
          <a href="https://wger.de" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            wger.de
          </a>
        </p>
      </main>
      <BottomNav activeHref="/progression" />
    </div>
  );
}
