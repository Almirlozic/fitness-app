import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNav } from "@/app/components/BottomNav";
import { ExerciseActions } from "@/app/components/ExerciseActions";
import { ExerciseTitle } from "@/app/components/ExerciseTitle";
import { LedgerFooter } from "@/app/components/LedgerFooter";
import { MonthlyMaxChart } from "@/app/components/MonthlyMaxChart";
import { ProgressionHistory } from "@/app/components/ProgressionHistory";
import { QuickLog } from "@/app/components/QuickLog";
import { StatsSummary } from "@/app/components/StatsSummary";
import { categoryLabel } from "@/lib/categories";
import { formatDate, formatKg, formatNumber, formatPercent, todayIso } from "@/lib/format";
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

export default async function ExercisePage({ params }: Props) {
  const today = todayIso();
  const exercise = await getExerciseSummary(exerciseName((await params).name), today);
  if (!exercise) notFound();

  const { name, category, latest, thisMonth, sinceStart, wgerExerciseId, sets } = exercise;

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-margin pt-16 pb-24 md:px-margin-tablet">
        <ExerciseTitle
          key={name}
          name={name}
          type={
            wgerExerciseId
              ? `${category ? categoryLabel(category) : "Ukendt muskelgruppe"} // wger #${wgerExerciseId}`
              : "Egen øvelse"
          }
        />

        <QuickLog
          key={latest.id}
          exerciseName={name}
          wgerExerciseId={wgerExerciseId}
          lastWeightKg={latest.weight_kg}
          lastReps={latest.reps}
          today={today}
          todayLabel={formatDate(today)}
        />

        <div className="mt-space-xl">
          <StatsSummary
            label="Progression i kg"
            stats={[
              {
                label: "Nu",
                value: formatKg(latest.weight_kg),
                caption: `× ${latest.reps} reps · ${formatDate(latest.performed_on)}`,
              },
              {
                label: "Denne måned",
                value: thisMonth.kind === "change" ? formatPercent(thisMonth.percent) : "—",
                caption: thisMonth.kind === "change" ? "Max kg vs. før" : describeThisMonth(thisMonth),
                emphasizeCaption: thisMonth.kind === "change",
              },
              {
                label: "Siden start",
                value: sinceStart.percent === null ? "Fra 0 kg" : formatPercent(sinceStart.percent),
                caption: `${formatNumber(sinceStart.firstKg)} → ${formatKg(sinceStart.latestKg)}`,
                emphasizeCaption: true,
              },
            ]}
          />
        </div>

        <MonthlyMaxChart data={monthlyMax(sets)} />
        <ProgressionHistory exercise={exercise} today={today} />
        <ExerciseActions exerciseName={name} />

        <div className="mt-space-2xl">
          <LedgerFooter left="Form discipline // Nordic core" right={`© ${today.slice(0, 4)}`} />
        </div>
      </main>
      <BottomNav />
    </>
  );
}
