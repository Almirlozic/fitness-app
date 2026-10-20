import type { Metadata } from "next";
import Link from "next/link";
import { deleteExercises } from "@/app/actions";
import { BottomNav } from "@/app/components/BottomNav";
import { DeleteButton } from "@/app/components/DeleteButton";
import { CategoryPicker, type CategoryOption } from "@/app/components/progression/CategoryPicker";
import { ProgressionItem } from "@/app/components/progression/ProgressionItem";
import { CATEGORIES, categoryLabel, isCategory } from "@/lib/categories";
import type { ExerciseSummary } from "@/lib/exercise-summary";
import { todayIso } from "@/lib/format";
import { getExerciseSummaries } from "@/lib/sets";

export const metadata: Metadata = { title: "FORM – Progression" };

const UNCATEGORIZED = "uden";
/** Som i designet vises de første øvelser, resten bag "SE ALLE ØVELSER" */
const INITIAL_COUNT = 2;

function matches(exercise: ExerciseSummary, filter: string) {
  if (filter === "alle") return true;
  if (filter === UNCATEGORIZED) return exercise.category === null;
  return exercise.category === filter;
}

// Progression-siden efter Figma-designet "Fitness-tracker" (node 22:2).
export default async function ProgressionPage({ searchParams }: PageProps<"/progression">) {
  const { kategori, alle } = await searchParams;
  const today = todayIso();
  const all = await getExerciseSummaries(today);

  const count = (filter: string) => all.filter((e) => matches(e, filter)).length;
  const options: CategoryOption[] = [
    { key: "alle", label: "Alle", count: all.length },
    ...CATEGORIES.map((c) => ({ key: c.key, label: c.label, count: count(c.key) })),
    ...(count(UNCATEGORIZED) > 0
      ? [{ key: UNCATEGORIZED, label: "Uden kategori", count: count(UNCATEGORIZED) }]
      : []),
  ];

  const requested = typeof kategori === "string" ? kategori : "alle";
  const active = isCategory(requested) || requested === UNCATEGORIZED ? requested : "alle";
  const activeLabel =
    active === "alle" ? "Alle" : active === UNCATEGORIZED ? "Uden kategori" : categoryLabel(active);
  const exercises = all.filter((e) => matches(e, active));

  const showAll = alle === "1" || exercises.length <= INITIAL_COUNT;
  const shown = showAll ? exercises : exercises.slice(0, INITIAL_COUNT);
  const seeAllHref = `/progression?${active === "alle" ? "" : `kategori=${active}&`}alle=1`;

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-[27px] pt-[calc(env(safe-area-inset-top)+62px)] pb-[calc(env(safe-area-inset-bottom)+112px)] font-inter text-navy">
        <h1 className="font-serif text-[32px] leading-[38px] uppercase">Overblik</h1>

        {/* [ ALLE ØVELSER ]  ·  [ 4 ØVELSER ] */}
        <div className="mt-[28px] flex items-center justify-between gap-space-md border-b border-navy pb-[14px]">
          <CategoryPicker options={options} active={active} />
          <p className="text-[14px] leading-[17px] whitespace-nowrap uppercase">
            [ {exercises.length} {exercises.length === 1 ? "øvelse" : "øvelser"} ]
          </p>
        </div>

        {exercises.length === 0 ? (
          <div className="mt-[24px] text-[14px]">
            <p className="font-semibold">
              {all.length === 0
                ? "Ingen øvelser endnu."
                : `Ingen øvelser i ${activeLabel.toLowerCase()} endnu.`}
            </p>
            <p className="mt-[8px]">
              {all.length === 0
                ? "Opret din første øvelse på forsiden, så kan du følge din progression her."
                : "Vælg en anden muskelgruppe, eller log en øvelse i denne."}
            </p>
            <Link
              href="/"
              className="mx-auto mt-[32px] flex h-[62px] w-[214px] items-center justify-center bg-navy text-[14px] font-bold text-cream uppercase hover:opacity-90"
            >
              Opret øvelse
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-[13px] flex flex-col gap-[59px]">
              {shown.map((exercise) => (
                <ProgressionItem key={exercise.key} exercise={exercise} today={today} />
              ))}
            </div>

            {!showAll && (
              <Link
                href={seeAllHref}
                scroll={false}
                className="mx-auto mt-[42px] flex h-[62px] w-[214px] items-center justify-center bg-navy text-[14px] font-bold text-cream uppercase hover:opacity-90"
              >
                Se alle øvelser
              </Link>
            )}

            <div className="mt-[40px] text-center">
              <DeleteButton
                key={active}
                onDelete={deleteExercises.bind(
                  null,
                  active === "alle" ? null : exercises.map((e) => e.name),
                )}
                label={`${
                  exercises.length === 1 ? "Slet 1 øvelse" : `Slet alle ${exercises.length} øvelser`
                }${active === "alle" ? "" : ` i ${activeLabel.toLowerCase()}`}`}
                confirmLabel="Sikker? Tryk igen for at slette alle sæt"
                className="px-space-sm font-inter text-[12px] underline underline-offset-[3px]"
              />
              <p className="text-[10px] text-navy/70">
                Sletter også al historik for øvelserne. Kan ikke fortrydes.
              </p>
            </div>
          </>
        )}

        <p className="mt-[32px] text-[10px] text-navy/70">
          Øvelsesdata fra{" "}
          <a
            href="https://wger.de"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            wger.de
          </a>
        </p>
      </main>
      <BottomNav activeHref="/progression" />
    </div>
  );
}
