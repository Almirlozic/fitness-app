import type { ReactNode } from "react";

export type Stat = {
  label: string;
  value: string;
  caption: ReactNode;
  emphasizeCaption?: boolean;
};

/** To nøgletal pr. række. Et ulige sidste nøgletal fylder hele rækken. */
export function StatsSummary({ stats, label = "Nøgletal" }: { stats: Stat[]; label?: string }) {
  return (
    <section
      aria-label={label}
      className="mb-space-lg grid grid-cols-2 gap-x-gutter gap-y-space-md border border-surface-container-high bg-surface-container-lowest p-space-md"
    >
      {stats.map((stat, i) => {
        const fullWidth = i === stats.length - 1 && i % 2 === 0 && i > 0;
        return (
          <div
            key={stat.label}
            className={`flex min-w-0 flex-col ${
              fullWidth
                ? "col-span-2 border-t border-surface-container-high pt-space-md"
                : i % 2 === 1
                  ? "border-l border-surface-container-high pl-space-md"
                  : ""
            }`}
          >
            <span className="font-mono text-caption-mono uppercase text-secondary">
              {stat.label}
            </span>
            <span className="mt-space-xs wrap-break-word font-mono text-stat-display uppercase leading-none text-primary">
              {stat.value}
            </span>
            <span
              className={`mt-space-xs font-mono text-caption-mono uppercase ${
                stat.emphasizeCaption ? "font-bold text-primary" : "text-secondary"
              }`}
            >
              {stat.caption}
            </span>
          </div>
        );
      })}
    </section>
  );
}
