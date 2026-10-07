import type { Metadata } from "next";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNav } from "@/app/components/BottomNav";
import { DayNav } from "@/app/components/food/DayNav";
import { DaySummary } from "@/app/components/food/DaySummary";
import { MealSection } from "@/app/components/food/MealSection";
import { FormMessage } from "@/app/components/TextField";
import { MEALS, dayTotals, totalsByMeal } from "@/lib/food";
import { getFoodLogsForDay } from "@/lib/foods";
import { isIsoDate, todayIso } from "@/lib/format";
import { getProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "FORM – Kost" };

export default async function KostPage({ searchParams }: PageProps<"/kost">) {
  const { dato, besked } = await searchParams;
  const today = todayIso();
  // Ugyldige datoer og datoer i fremtiden falder tilbage til i dag
  const date = isIsoDate(dato) && dato <= today ? dato : today;

  const [logs, profile] = await Promise.all([getFoodLogsForDay(date), getProfile()]);
  const meals = totalsByMeal(logs);
  const targets = {
    kcal: profile?.kcal_target ?? 0,
    protein_g: profile?.protein_g ?? 0,
    carbs_g: profile?.carbs_g ?? 0,
    fat_g: profile?.fat_g ?? 0,
  };

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-margin pt-16 pb-24 md:px-margin-tablet">
        <DayNav date={date} today={today} />

        {typeof besked === "string" && besked && (
          <div className="mb-space-md">
            <FormMessage status="success">{besked}</FormMessage>
          </div>
        )}

        <DaySummary eaten={dayTotals(logs)} targets={targets} />

        {logs.length === 0 && (
          <p className="mb-space-lg border border-dashed border-surface-container-high px-space-md py-space-lg text-center font-mono text-caption-mono uppercase text-secondary">
            Intet logget endnu – tryk + Tilføj under et måltid
          </p>
        )}

        {MEALS.map(({ key, label }) => (
          <MealSection
            key={key}
            meal={key}
            label={label}
            date={date}
            totals={meals[key]}
            logs={logs.filter((l) => l.meal === key)}
          />
        ))}

        <footer className="mt-space-xl border-t border-surface-container-high pt-space-md pb-space-lg font-mono text-caption-mono text-secondary">
          Fødevaredata fra{" "}
          <a
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-primary"
          >
            Open Food Facts
          </a>{" "}
          (ODbL)
        </footer>
      </main>
      <BottomNav activeHref="/kost" />
    </>
  );
}
