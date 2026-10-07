import Link from "next/link";
import { addDays, formatDate, formatDayLabel } from "@/lib/format";
import { ChevronLeftIcon, ChevronRightIcon } from "../Icons";

/** ← I dag → – kan ikke gå frem i fremtiden */
export function DayNav({ date, today }: { date: string; today: string }) {
  const isToday = date >= today;
  const arrow =
    "flex size-11 shrink-0 items-center justify-center border border-surface-container-high bg-surface-container-lowest text-primary";

  return (
    <nav aria-label="Vælg dag" className="mt-space-lg mb-space-lg flex items-center justify-between gap-space-sm">
      <Link href={`/kost?dato=${addDays(date, -1)}`} aria-label="Forrige dag" className={`${arrow} hover:border-primary`}>
        <ChevronLeftIcon width={18} height={18} />
      </Link>
      <div className="min-w-0 text-center">
        <p className="text-headline-sm uppercase text-primary">{formatDayLabel(date, today)}</p>
        <p className="font-mono text-caption-mono uppercase text-secondary">{formatDate(date)}</p>
      </div>
      {isToday ? (
        <span aria-hidden className={`${arrow} opacity-30`}>
          <ChevronRightIcon width={18} height={18} />
        </span>
      ) : (
        <Link href={`/kost?dato=${addDays(date, 1)}`} aria-label="Næste dag" className={`${arrow} hover:border-primary`}>
          <ChevronRightIcon width={18} height={18} />
        </Link>
      )}
    </nav>
  );
}
