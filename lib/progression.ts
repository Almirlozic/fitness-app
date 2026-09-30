import { formatKg, formatMonthName, formatNumber, formatPercent } from "./format";

// Progression regnes KUN på kg. Reps indgår ikke.

export type ProgressionSet = {
  weight_kg: number;
  /** "YYYY-MM-DD" */
  performed_on: string;
  created_at?: string;
};

export type MonthlyMax = { month: string; maxKg: number };

export type ThisMonthChange =
  | { kind: "change"; percent: number }
  | { kind: "no-sets-this-month"; month: string }
  | { kind: "first-month" }
  /** Tidligere max var 0 kg, så procent kan ikke beregnes */
  | { kind: "from-zero" };

export type SinceStart = {
  firstKg: number;
  latestKg: number;
  diffKg: number;
  /** null, når første sæt var 0 kg og det seneste ikke er */
  percent: number | null;
};

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

const monthOf = (isoDate: string) => isoDate.slice(0, 7);
const maxKg = (sets: ProgressionSet[]) => Math.max(...sets.map((s) => s.weight_kg));

function percentChange(from: number, to: number): number | null {
  if (from === 0) return to === 0 ? 0 : null;
  return round1(((to - from) / from) * 100);
}

/** Tungeste kg pr. måned, ældste måned først */
export function monthlyMax(sets: ProgressionSet[]): MonthlyMax[] {
  const byMonth = new Map<string, number>();
  for (const set of sets) {
    const month = monthOf(set.performed_on);
    byMonth.set(month, Math.max(byMonth.get(month) ?? -Infinity, set.weight_kg));
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, maxKg]) => ({ month, maxKg }));
}

/**
 * (max kg i indeværende måned − max kg i alle måneder før) / max kg før × 100,
 * afrundet til 1 decimal.
 */
export function thisMonthChange(sets: ProgressionSet[], today: string): ThisMonthChange {
  const month = monthOf(today);
  const current = sets.filter((s) => monthOf(s.performed_on) === month);
  if (current.length === 0) return { kind: "no-sets-this-month", month };

  const before = sets.filter((s) => monthOf(s.performed_on) < month);
  if (before.length === 0) return { kind: "first-month" };

  const percent = percentChange(maxKg(before), maxKg(current));
  return percent === null ? { kind: "from-zero" } : { kind: "change", percent };
}

/** Max kg i seneste måned med sæt sammenlignet med kg i første sæt */
export function sinceStart(sets: ProgressionSet[]): SinceStart | null {
  if (sets.length === 0) return null;

  const chronological = [...sets].sort(
    (a, b) =>
      a.performed_on.localeCompare(b.performed_on) ||
      (a.created_at ?? "").localeCompare(b.created_at ?? ""),
  );
  const firstKg = chronological[0].weight_kg;
  const latestMonth = monthOf(chronological[chronological.length - 1].performed_on);
  const latestKg = maxKg(sets.filter((s) => monthOf(s.performed_on) === latestMonth));

  return {
    firstKg,
    latestKg,
    diffKg: Math.round((latestKg - firstKg) * 100) / 100,
    percent: percentChange(firstKg, latestKg),
  };
}

export function describeThisMonth(change: ThisMonthChange) {
  switch (change.kind) {
    case "change":
      return formatPercent(change.percent);
    case "no-sets-this-month":
      return `Ingen sæt i ${formatMonthName(change.month)}`;
    case "first-month":
      return "Første måned";
    case "from-zero":
      return "Fra 0 kg";
  }
}

/** Fx "+8,3 % · 24 → 26 kg" */
export function describeSinceStart({ firstKg, latestKg, percent }: SinceStart) {
  const head = percent === null ? "Fra 0 kg" : formatPercent(percent);
  return `${head} · ${formatNumber(firstKg)} → ${formatKg(latestKg)}`;
}
