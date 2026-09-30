import { formatLift, formatSignedKg } from "@/lib/format";
import type { SetRow } from "@/lib/supabase/database.types";

export function LiftComparison({ current, previous }: { current: SetRow; previous: SetRow }) {
  const kgDiff = current.weight_kg - previous.weight_kg;
  const repDiff = current.reps - previous.reps;

  return (
    <div className="mt-space-xs flex flex-col gap-space-xs border border-primary bg-surface-container-lowest p-space-md">
      <div className="flex items-center justify-between gap-space-sm border-b border-surface-container-high pb-space-xs">
        <span className="font-mono text-label-tag uppercase text-secondary">
          [ Seneste to sæt ]
        </span>
        <span className="bg-surface-container-high px-1.5 py-0.5 font-mono text-caption-mono font-bold uppercase text-primary">
          {kgDiff > 0 ? "Tungere" : kgDiff < 0 ? "Lettere" : "Samme vægt"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
        <div className="min-w-0">
          <span className="block font-mono text-caption-mono uppercase text-secondary">
            Nuværende løft
          </span>
          <span className="block font-mono text-body-lg font-bold uppercase text-primary">
            {formatLift(current.weight_kg, current.reps)}
          </span>
          <span className="font-mono text-caption-mono text-primary">[ Seneste sæt ]</span>
        </div>
        <div className="min-w-0 border-l border-surface-container-high pl-space-sm">
          <span className="block font-mono text-caption-mono uppercase text-secondary">
            Forrige løft
          </span>
          <span className="block font-mono text-body-lg font-bold uppercase text-secondary">
            {formatLift(previous.weight_kg, previous.reps)}
          </span>
          <span className="font-mono text-caption-mono text-secondary">
            [ {formatSignedKg(kgDiff)} / {repDiff > 0 ? "+" : repDiff < 0 ? "−" : ""}
            {Math.abs(repDiff)} reps ]
          </span>
        </div>
      </div>
    </div>
  );
}
