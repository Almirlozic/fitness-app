import { BottomNav } from "@/app/components/BottomNav";
import { ExercisePicker } from "@/app/components/home/ExercisePicker";
import { StrengthCard } from "@/app/components/home/StrengthCard";
import { LogSetPanel } from "@/app/components/LogSetPanel";
import { FormMessage } from "@/app/components/TextField";
import { exerciseKey } from "@/lib/exercise-name";
import { todayIso } from "@/lib/format";
import { getExerciseSummaries } from "@/lib/sets";

// Forsiden efter Figma-designet "Fitness-tracker" (node 1:25 "Progression - lightmode").
// Afstande: titel 62 px fra toppen → 16 px → dropdown → 71 px → "SIDSTE BEDST" → 16 px → kort.
export default async function ProgressionPage({ searchParams }: PageProps<"/">) {
  const { besked, ovelse } = await searchParams;
  const today = todayIso();
  const exercises = await getExerciseSummaries(today);

  // Valgt øvelse fra dropdown'en; "Alle øvelser" viser den senest loggede
  const picked =
    typeof ovelse === "string"
      ? exercises.find((e) => e.key === exerciseKey(ovelse))
      : undefined;
  const shown = picked ?? exercises[0] ?? null;

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-[27px] pt-[calc(env(safe-area-inset-top)+62px)] pb-[calc(env(safe-area-inset-bottom)+112px)]">
        {besked === "adgangskode-gemt" && (
          <div className="mb-space-md">
            <FormMessage status="success">Din adgangskode er gemt</FormMessage>
          </div>
        )}

        <h1 className="font-serif text-[32px] leading-[38px] text-navy uppercase">Progression</h1>

        <div className="mt-[16px]">
          <ExercisePicker names={exercises.map((e) => e.name)} selected={picked?.name ?? ""} />
        </div>

        <h2 className="mt-[71px] font-inter text-[24px] leading-[29px] font-normal text-navy uppercase">
          Sidste bedst
        </h2>

        <div className="mt-[16px]">
          <StrengthCard exercise={shown} today={today}>
            <LogSetPanel
              defaultOpen={false}
              today={today}
              ownExercises={exercises.map((e) => ({
                name: e.name,
                wgerExerciseId: e.wgerExerciseId,
                lastWeightKg: e.latest.weight_kg,
                lastReps: e.latest.reps,
              }))}
            />
          </StrengthCard>
        </div>
      </main>
      <BottomNav activeHref="/" />
    </div>
  );
}
