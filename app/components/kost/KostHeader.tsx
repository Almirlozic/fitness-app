import Image from "next/image";
import Link from "next/link";
import { remainingKcal } from "@/lib/food";
import { addDays, formatNumber } from "@/lib/format";
import { fraction } from "@/lib/kost";
import { BackLink } from "./BackLink";
import { KcalGauge } from "./KcalGauge";
import { WeightUpdate } from "./WeightUpdate";

/** "I DAG, 12 OKT." / "I GÅR, 11 OKT." / "MAN., 5 OKT." */
function dayHeading(date: string, today: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("da-DK", { ...o, timeZone: "UTC" }).format(d);
  const day =
    date === today ? "I dag" : date === addDays(today, -1) ? "I går" : fmt({ weekday: "short" });
  return `${day}, ${fmt({ day: "numeric" }).replace(".", "")} ${fmt({ month: "short" })}`.toUpperCase();
}

const arrowLink = "flex size-11 items-center justify-center";

/** Den mørkeblå top fra Figma-designet "Kost" (node 15:405) */
export function KostHeader({
  date,
  today,
  eatenKcal,
  targetKcal,
  weight,
}: {
  date: string;
  today: string;
  eatenKcal: number;
  targetKcal: number;
  weight: { currentKg: number | null; goalKg: number | null; progress: number | null };
}) {
  const left = remainingKcal(targetKcal, eatenKcal);
  const isToday = date >= today;

  return (
    <header className="bg-navy pt-[env(safe-area-inset-top)] text-white">
      {/* Toppen følger designets koordinater (TILBAGE 12, pile 58, måler 77, vægt 212,
          bund 285). Touch-områderne er 44 px og må derfor ikke skubbe layoutet. */}
      <div className="relative mx-auto max-w-2xl px-[24px] pt-[197px] pb-[16px]">
        <div className="absolute top-[-4px] left-[24px]">
          <BackLink />
        </div>

        {/* ← I DAG, 12 OKT. → */}
        <nav aria-label="Vælg dag" className="absolute inset-x-[24px] top-[36px] flex items-center justify-between">
          <Link href={`/kost?dato=${addDays(date, -1)}`} aria-label="Forrige dag" className={`-ml-[18px] ${arrowLink}`}>
            <Image src="/design/arrow-right-light.svg" alt="" width={8.36396} height={14.7279} className="rotate-180" />
          </Link>
          <h1 className="font-serif text-[14px]">{dayHeading(date, today)}</h1>
          {isToday ? (
            <span aria-hidden className={`-mr-[18px] opacity-30 ${arrowLink}`}>
              <Image src="/design/arrow-right-light.svg" alt="" width={8.36396} height={14.7279} />
            </span>
          ) : (
            <Link href={`/kost?dato=${addDays(date, 1)}`} aria-label="Næste dag" className={`-mr-[18px] ${arrowLink}`}>
              <Image src="/design/arrow-right-light.svg" alt="" width={8.36396} height={14.7279} />
            </Link>
          )}
        </nav>

        {/* INDTAGET · måler med TILBAGE I DAG */}
        <div className="absolute inset-x-[24px] top-[77px] h-[86px] font-serif">
          <div className="absolute top-[19px] left-0 text-center">
            <p className="text-[10px] uppercase">Indtaget</p>
            <p className="mt-[6px] text-[15px]">{formatNumber(Math.round(eatenKcal))}</p>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            <KcalGauge
              fraction={fraction(eatenKcal, targetKcal)}
              label={`${formatNumber(Math.round(eatenKcal))} af ${formatNumber(targetKcal)} kcal spist`}
            />
            <div className="absolute inset-x-0 top-[19px] text-center">
              <p className="text-[10px] uppercase">{left.over ? "Over i dag" : "Tilbage i dag"}</p>
              <p className="mt-[3px] text-[15px]">{targetKcal > 0 ? formatNumber(left.kcal) : "–"}</p>
              <p className="mt-[5px] text-[6px] uppercase">
                {targetKcal > 0 ? `Mål ${formatNumber(targetKcal)} kcal` : "Intet kaloriemål endnu"}
              </p>
            </div>
          </div>
        </div>

        <WeightUpdate {...weight} />
      </div>
    </header>
  );
}
