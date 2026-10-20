import type { Metadata } from "next";
import { BottomNav } from "@/app/components/BottomNav";
import { KostHeader } from "@/app/components/kost/KostHeader";
import { MacroCards } from "@/app/components/kost/MacroCards";
import { MealCard } from "@/app/components/kost/MealCard";
import { WaterCard } from "@/app/components/kost/WaterCard";
import { MEALS, dayTotals, totalsByMeal } from "@/lib/food";
import { getFoodLogsForDay, getWaterGlasses } from "@/lib/foods";
import { isIsoDate, todayIso } from "@/lib/format";
import { recommendedMealKcal, weightProgress } from "@/lib/kost";
import { getProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "FORM – Kost" };

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// Kostsiden efter Figma-designet "Fitness-tracker" (node 15:405 "Kost - lightmode").
export default async function KostPage({ searchParams }: PageProps<"/kost">) {
  const { dato, besked } = await searchParams;
  const today = todayIso();
  // Ugyldige datoer og datoer i fremtiden falder tilbage til i dag
  const date = isIsoDate(dato) && dato <= today ? dato : today;

  const [logs, profile, glasses] = await Promise.all([
    getFoodLogsForDay(date),
    getProfile(),
    getWaterGlasses(date),
  ]);
  const meals = totalsByMeal(logs);
  const eaten = dayTotals(logs);
  const targetKcal = profile?.kcal_target ?? 0;

  const currentKg = num(profile?.weight_kg);
  const goalKg = num(profile?.goal_weight_kg);
  const startKg = num(profile?.start_weight_kg) ?? currentKg;

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <KostHeader
        date={date}
        today={today}
        eatenKcal={eaten.kcal}
        targetKcal={targetKcal}
        weight={{ currentKg, goalKg, progress: weightProgress(startKg, currentKg, goalKg) }}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-[38px] pt-[25px] pb-[calc(env(safe-area-inset-bottom)+112px)]">
        {typeof besked === "string" && besked && (
          <p role="status" className="mb-[16px] border-l-2 border-[#417a27] py-[4px] pl-[10px] font-inter text-[12px] font-semibold text-navy">
            {besked}
          </p>
        )}

        <MacroCards
          macros={[
            { label: "Kulhydrater", eaten: eaten.carbs_g, target: profile?.carbs_g ?? 0 },
            { label: "Fedt", eaten: eaten.fat_g, target: profile?.fat_g ?? 0 },
            { label: "Protein", eaten: eaten.protein_g, target: profile?.protein_g ?? 0 },
          ]}
        />

        <h2 className="mt-[31px] font-serif text-[12px] text-navy uppercase">Madlog</h2>
        {logs.length === 0 && (
          <p className="mt-[4px] font-inter text-[10px] text-navy/70">
            Intet logget endnu – tryk + ved et måltid for at tilføje mad.
          </p>
        )}

        <div className="mt-[7px] flex flex-col gap-[13px]">
          {MEALS.map(({ key, label }) => (
            <MealCard
              key={key}
              meal={key}
              label={label}
              date={date}
              recommended={recommendedMealKcal(key, targetKcal)}
              totals={meals[key]}
              logs={logs.filter((l) => l.meal === key)}
            />
          ))}
          <WaterCard key={date} date={date} glasses={glasses} />
        </div>

        <p className="mt-[32px] font-inter text-[10px] text-navy/70">
          Fødevaredata fra{" "}
          <a
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Open Food Facts
          </a>{" "}
          (ODbL)
        </p>
      </main>
      <BottomNav activeHref="/kost" />
    </div>
  );
}
