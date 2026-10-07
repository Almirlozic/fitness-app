import type { Metadata } from "next";
import { deleteExercises } from "@/app/actions";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNav } from "@/app/components/BottomNav";
import { CategoryFilter, type FilterOption } from "@/app/components/CategoryFilter";
import { DeleteButton } from "@/app/components/DeleteButton";
import { ExerciseList } from "@/app/components/ExerciseList";
import { LedgerFooter } from "@/app/components/LedgerFooter";
import { PageHero } from "@/app/components/PageHero";
import { StatsSummary } from "@/app/components/StatsSummary";
import { CATEGORIES, categoryLabel, isCategory } from "@/lib/categories";
import type { ExerciseSummary } from "@/lib/exercise-summary";
import { formatMonthName, formatPercent, todayIso } from "@/lib/format";
import { getExerciseSummaries } from "@/lib/sets";

export const metadata: Metadata = { title: "FORM – Progression" };

const UNCATEGORIZED = "uden";

function matches(exercise: ExerciseSummary, filter: string) {
  if (filter === "alle") return true;
  if (filter === UNCATEGORIZED) return exercise.category === null;
  return exercise.category === filter;
}

export default async function ProgressionPage({ searchParams }: PageProps<"/progression">) {
  const { kategori } = await searchParams;
  const today = todayIso();
  const all = await getExerciseSummaries(today);

  const count = (filter: string) => all.filter((e) => matches(e, filter)).length;
  const options: FilterOption[] = [
    { key: "alle", label: "Alle", count: all.length },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.label, count: count(c.key) })),
    ...(count(UNCATEGORIZED) > 0
      ? [{ key: UNCATEGORIZED, label: "Uden kategori", count: count(UNCATEGORIZED) }]
      : []),
  ];

  const requested = typeof kategori === "string" ? kategori : "alle";
  const active =
    isCategory(requested) || requested === UNCATEGORIZED ? requested : "alle";
  const activeLabel =
    active === "alle" ? "Alle" : active === UNCATEGORIZED ? "Uden kategori" : categoryLabel(active);
  const exercises = all.filter((e) => matches(e, active));

  const month = today.slice(0, 7);
  const setsThisMonth = exercises
    .flatMap((e) => e.sets)
    .filter((s) => s.performed_on.startsWith(month)).length;
  const best = exercises
    .flatMap((e) => (e.thisMonth.kind === "change" ? [{ e, percent: e.thisMonth.percent }] : []))
    .sort((a, b) => b.percent - a.percent)[0];

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-margin pt-16 pb-24 md:px-margin-tablet">
        <PageHero
          title="Progression"
          description="Se din udvikling i kg. Filtrér på muskelgruppe for kun at se de øvelser."
        />

        <CategoryFilter options={options} active={active} />

        <StatsSummary
          label={`Nøgletal for ${activeLabel}`}
          stats={[
            {
              label: "Øvelser",
              value: String(exercises.length),
              caption: activeLabel,
            },
            {
              label: `Sæt i ${formatMonthName(month)}`,
              value: String(setsThisMonth),
              caption: "Denne måned",
            },
            {
              label: "Bedste fremgang denne måned",
              value: best ? formatPercent(best.percent) : "—",
              caption: best
                ? `↑ ${best.e.name}`
                : "Kræver sæt i en tidligere måned at sammenligne med",
              emphasizeCaption: Boolean(best),
            },
          ]}
        />

        <ExerciseList
          exercises={exercises}
          title={active === "alle" ? "Alle øvelser" : activeLabel}
          emptyText={
            all.length === 0
              ? "Ingen øvelser endnu – log dit første sæt på Overblik"
              : `Ingen øvelser i ${activeLabel.toLowerCase()} endnu`
          }
        />

        {exercises.length > 0 && (
          <div className="mb-space-xl border-t border-surface-container-high pt-space-md">
            <DeleteButton
              key={active}
              onDelete={deleteExercises.bind(
                null,
                active === "alle" ? null : exercises.map((e) => e.name),
              )}
              label={`[ ${
                exercises.length === 1 ? "Slet 1 øvelse" : `Slet alle ${exercises.length} øvelser`
              }${active === "alle" ? "" : ` i ${activeLabel.toLowerCase()}`} ]`}
              confirmLabel="[ Sikker? Tryk igen for at slette alle sæt ]"
              className="w-full text-center text-label-tag tracking-wider"
            />
            <p className="mt-space-xs text-center font-mono text-caption-mono text-secondary">
              Sletter også al historik for øvelserne. Kan ikke fortrydes.
            </p>
          </div>
        )}

        <LedgerFooter left="[ Form progression ]" right={`[ ${today.slice(0, 4)} / Protokol ]`} />
      </main>
      <BottomNav activeHref="/progression" />
    </>
  );
}
