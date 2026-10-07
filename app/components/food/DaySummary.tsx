import { type Macros, progressPercent, remainingKcal } from "@/lib/food";
import { formatNumber } from "@/lib/format";

export type DayTargets = { kcal: number; protein_g: number; carbs_g: number; fat_g: number };

function Bar({ percent, over = false, thick = false }: { percent: number; over?: boolean; thick?: boolean }) {
  return (
    <div className={`w-full bg-surface-container-high ${thick ? "h-2" : "h-1.5"}`}>
      <div
        className={`h-full ${over ? "bg-error" : "bg-primary"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function MacroBar({ label, eaten, target }: { label: string; eaten: number; target: number }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-caption-mono uppercase text-secondary">{label}</p>
      <p className="mt-space-xs mb-space-xs font-mono text-body-sm text-primary">
        <span className="font-bold">{formatNumber(Math.round(eaten))}</span>
        <span className="text-secondary"> / {formatNumber(target)} g</span>
      </p>
      <Bar percent={progressPercent(eaten, target)} over={eaten > target} />
    </div>
  );
}

export function DaySummary({ eaten, targets }: { eaten: Macros; targets: DayTargets }) {
  const left = remainingKcal(targets.kcal, eaten.kcal);

  return (
    <section
      aria-label="Dagens mål"
      className="mb-space-xl border border-surface-container-high bg-surface-container-lowest p-space-md"
    >
      <p className={`font-mono text-stat-display leading-none ${left.over ? "text-error" : "text-primary"}`}>
        {formatNumber(left.kcal)}
        <span className="ml-space-sm text-body-lg font-normal">kcal {left.over ? "over" : "tilbage"}</span>
      </p>
      <p className="mt-space-sm mb-space-xs font-mono text-caption-mono uppercase text-secondary">
        {formatNumber(Math.round(eaten.kcal))} / {formatNumber(targets.kcal)} kcal
      </p>
      <Bar percent={progressPercent(eaten.kcal, targets.kcal)} over={left.over} thick />

      <div className="mt-space-md grid grid-cols-3 gap-space-md">
        <MacroBar label="Protein" eaten={eaten.protein_g} target={targets.protein_g} />
        <MacroBar label="Kulhydrat" eaten={eaten.carbs_g} target={targets.carbs_g} />
        <MacroBar label="Fedt" eaten={eaten.fat_g} target={targets.fat_g} />
      </div>
    </section>
  );
}
