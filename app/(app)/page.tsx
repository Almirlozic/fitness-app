import { AppHeader } from "@/app/components/AppHeader";
import { BottomNav } from "@/app/components/BottomNav";
import { ExerciseList } from "@/app/components/ExerciseList";
import { LedgerFooter } from "@/app/components/LedgerFooter";
import { LogSetPanel } from "@/app/components/LogSetPanel";
import { PageHero } from "@/app/components/PageHero";
import { StatsSummary } from "@/app/components/StatsSummary";
import { FormMessage } from "@/app/components/TextField";
import { formatPercent, todayIso } from "@/lib/format";
import { getExerciseSummaries } from "@/lib/sets";

export default async function ProgressionPage({ searchParams }: PageProps<"/">) {
  const { besked } = await searchParams;
  const today = todayIso();
  const exercises = await getExerciseSummaries(today);

  // Senest loggede øvelse med fremgang i denne måned
  const improved = exercises.find(
    (e) => e.thisMonth.kind === "change" && e.thisMonth.percent > 0,
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-margin pt-16 pb-24 md:px-margin-tablet">
        {besked === "adgangskode-gemt" && (
          <div className="mt-space-lg">
            <FormMessage status="success">Din adgangskode er gemt</FormMessage>
          </div>
        )}
        <PageHero
          title="Overblik"
          description="Log et sæt, når du vil. Følg dine øvelser, seneste løft og vægtstigninger."
        />
        <StatsSummary
          stats={[
            {
              label: "Registrerede øvelser",
              value: String(exercises.length),
              caption: "I alt i arkiv",
            },
            {
              label: "Seneste forbedring",
              value:
                improved?.thisMonth.kind === "change"
                  ? formatPercent(improved.thisMonth.percent)
                  : "—",
              caption: improved ? `↑ ${improved.name}` : "Ingen denne måned",
              emphasizeCaption: Boolean(improved),
            },
          ]}
        />
        <LogSetPanel
          defaultOpen={exercises.length === 0}
          today={today}
          ownExercises={exercises.map((e) => ({
            name: e.name,
            wgerExerciseId: e.wgerExerciseId,
            lastWeightKg: e.latest.weight_kg,
            lastReps: e.latest.reps,
          }))}
        />
        <ExerciseList exercises={exercises} />
        <LedgerFooter
          left="[ Form øvelsesbibliotek ]"
          right={`[ ${today.slice(0, 4)} / Protokol ]`}
        />
      </main>
      <BottomNav activeHref="/" />
    </>
  );
}
