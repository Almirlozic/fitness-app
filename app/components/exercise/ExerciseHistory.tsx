import { addDays, formatDate, formatKg, formatSignedKg } from "@/lib/format";
import type { SetRow } from "@/lib/supabase/database.types";
import { SetDeleteButton } from "./SetDeleteButton";

type Status = { label: string; tone: "pr" | "up" | "muted" };

/** Udviklingen fra det forrige sæt (kg først, ellers reps). "Ny PR" ved ny rekord. */
function statusFor(set: SetRow, before: SetRow | undefined, isPr: boolean): Status {
  if (!before) return { label: "Første sæt", tone: "muted" };
  const kgDiff = set.weight_kg - before.weight_kg;
  const repDiff = set.reps - before.reps;
  if (kgDiff > 0) return isPr ? { label: `${formatSignedKg(kgDiff)} · Ny PR`, tone: "pr" } : { label: formatSignedKg(kgDiff), tone: "up" };
  if (kgDiff < 0) return { label: formatSignedKg(kgDiff), tone: "muted" };
  if (repDiff > 0) return { label: `+${repDiff} reps`, tone: "up" };
  if (repDiff < 0) return { label: `−${Math.abs(repDiff)} reps`, tone: "muted" };
  return { label: "Uændret", tone: "muted" };
}

const toneClass: Record<Status["tone"], string> = {
  pr: "bg-navy text-cream font-bold",
  up: "bg-sand text-navy font-semibold",
  muted: "bg-sand/60 text-navy/70",
};

function relativeDate(iso: string, today: string) {
  if (iso === today) return "I dag";
  if (iso === addDays(today, -1)) return "I går";
  const days = Math.round((Date.parse(today) - Date.parse(iso)) / 86_400_000);
  if (days < 30) return `${days} dage siden`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? "måned" : "måneder"} siden`;
}

/** Alle sæt, nyeste øverst, i et kort som madloggen. `sets` er nyeste først. */
export function ExerciseHistory({ sets, today }: { sets: SetRow[]; today: string }) {
  const chronological = [...sets].reverse();
  const rows = chronological
    .map((set, i) => {
      const heaviestBefore = Math.max(...chronological.slice(0, i).map((s) => s.weight_kg));
      return { set, status: statusFor(set, chronological[i - 1], set.weight_kg > heaviestBefore) };
    })
    .reverse();

  return (
    <section aria-labelledby="history-heading" className="text-navy">
      <div className="flex items-baseline justify-between font-serif text-[12px] uppercase">
        <h2 id="history-heading">Historik</h2>
        <span className="text-[10px]">[ {sets.length} sæt ]</span>
      </div>

      <ul className="mt-[7px] divide-y divide-navy/15 rounded-[5px] border-[0.5px] border-navy px-[13px]">
        {rows.map(({ set, status }) => (
          <li key={set.id} className="flex min-h-[56px] items-center gap-[10px] py-[8px] font-inter">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold">{relativeDate(set.performed_on, today)}</p>
              <p className="text-[10px] text-navy/70">{formatDate(set.performed_on)}</p>
            </div>
            <p className="shrink-0 text-[14px] font-bold whitespace-nowrap">
              {formatKg(set.weight_kg)} × {set.reps}
            </p>
            <span className={`shrink-0 rounded-full px-[8px] py-[3px] text-[9px] uppercase ${toneClass[status.tone]}`}>
              {status.label}
            </span>
            <SetDeleteButton setId={set.id} label={`sættet ${formatKg(set.weight_kg)} × ${set.reps} fra ${formatDate(set.performed_on)}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}
