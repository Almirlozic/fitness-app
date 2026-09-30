import { deleteSet } from "@/app/actions";
import { formatDate, formatNumber, formatSignedKg } from "@/lib/format";
import type { SetRow } from "@/lib/supabase/database.types";
import { DeleteButton } from "./DeleteButton";

type Status = { label: string; tone: "pr" | "up" | "muted" };

function statusFor(set: SetRow, before: SetRow | undefined, isPr: boolean): Status {
  if (!before) return { label: "[ Baseline ]", tone: "muted" };

  const kgDiff = set.weight_kg - before.weight_kg;
  const repDiff = set.reps - before.reps;

  if (kgDiff > 0) {
    return isPr
      ? { label: `${formatSignedKg(kgDiff)} // Ny PR`, tone: "pr" }
      : { label: `${formatSignedKg(kgDiff)} stigning`, tone: "up" };
  }
  if (kgDiff < 0) return { label: `${formatSignedKg(kgDiff)} fald`, tone: "muted" };
  if (repDiff > 0) return { label: `+${repDiff} reps`, tone: "up" };
  if (repDiff < 0) return { label: `−${Math.abs(repDiff)} reps`, tone: "muted" };
  return { label: "Uændret", tone: "muted" };
}

const toneClass: Record<Status["tone"], string> = {
  pr: "bg-primary text-on-primary font-bold",
  up: "bg-surface-container text-primary",
  muted: "bg-surface-container text-secondary",
};

function relativeDate(iso: string, today: string) {
  const days = Math.round((Date.parse(today) - Date.parse(iso)) / 86_400_000);
  if (days <= 0) return "I dag";
  if (days === 1) return "I går";
  if (days < 30) return `${days} dage siden`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? "måned" : "måneder"} siden`;
}

/** Alle sæt, nyeste øverst. `sets` forventes nyeste først. */
export function HistoryTable({ sets, today }: { sets: SetRow[]; today: string }) {
  const chronological = [...sets].reverse();
  const rows = chronological
    .map((set, i) => {
      const heaviestBefore = Math.max(...chronological.slice(0, i).map((s) => s.weight_kg));
      return {
        set,
        status: statusFor(set, chronological[i - 1], set.weight_kg > heaviestBefore),
        isFirst: i === 0,
      };
    })
    .reverse();

  return (
    <table className="mt-space-md w-full table-fixed">
      <caption className="sr-only">Alle sæt, nyeste øverst</caption>
      <thead>
        <tr className="border-b border-surface-container-high font-mono text-label-tag uppercase text-secondary">
          <th scope="col" className="py-space-xs text-left font-normal">[ Dato ]</th>
          <th scope="col" className="py-space-xs text-center font-normal">[ Kg × reps ]</th>
          <th scope="col" className="py-space-xs text-right font-normal">[ Delta ]</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-surface-container-high font-mono text-body-sm">
        {rows.map(({ set, status, isFirst }, i) => (
          <tr key={set.id} className={i === 0 ? "bg-surface-container-lowest" : undefined}>
            <td className="py-space-sm pl-space-xs align-top">
              <span className={`block font-bold uppercase ${isFirst ? "text-secondary" : "text-primary"}`}>
                {isFirst ? "Første sæt" : relativeDate(set.performed_on, today)}
              </span>
              <span className="text-caption-mono text-secondary">{formatDate(set.performed_on)}</span>
            </td>
            <td
              className={`py-space-sm text-center align-top text-body-lg ${
                isFirst ? "text-secondary" : "text-primary"
              }`}
            >
              {formatNumber(set.weight_kg)}{" "}
              <span className="text-caption-mono text-secondary">KG</span> × {set.reps}
            </td>
            <td className="py-space-sm pr-space-xs text-right align-top">
              <span
                className={`inline-block px-1.5 py-0.5 text-[9px] uppercase leading-tight tracking-wider ${toneClass[status.tone]}`}
              >
                {status.label}
              </span>
              <DeleteButton
                onDelete={deleteSet.bind(null, set.id)}
                label="[ Slet ]"
                confirmLabel="[ Slet? ]"
                ariaLabel={`Slet sæt fra ${formatDate(set.performed_on)}`}
                className="-mr-space-xs block w-full px-space-xs text-right text-caption-mono"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
