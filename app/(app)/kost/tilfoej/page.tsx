import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AddFood } from "@/app/components/food/AddFood";
import { DayIntakeCard } from "@/app/components/kost/DayIntakeCard";
import { requireUser } from "@/lib/auth";
import { dayTotals, isMeal, mealLabel } from "@/lib/food";
import { getCustomFoods, getFoodLogsForDay, getRecentFoods } from "@/lib/foods";
import { isIsoDate, todayIso } from "@/lib/format";
import { getProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "FORM – Tilføj mad" };

// "Tilføj mad" efter Figma-designet "Fitness-tracker" (node 22:285 "Kost scanner").
export default async function TilfoejPage({ searchParams }: PageProps<"/kost/tilfoej">) {
  const { meal: mealParam, dato, besked, opret, stregkode } = await searchParams;
  const today = todayIso();
  const date = isIsoDate(dato) && dato <= today ? dato : today;
  const meal = isMeal(mealParam) ? mealParam : "snack";
  const backHref = `/kost?dato=${date}`;

  const user = await requireUser();
  const [recent, own, logs, profile] = await Promise.all([
    getRecentFoods(),
    getCustomFoods(user.id),
    getFoodLogsForDay(date),
    getProfile(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-[22px] pt-[calc(env(safe-area-inset-top)+27px)] pb-[calc(env(safe-area-inset-bottom)+40px)]">
        {/* × og måltidets navn */}
        <div className="relative flex h-6 items-center justify-center">
          <Link
            href={backHref}
            aria-label="Luk og gå tilbage til kost"
            className="absolute -top-[10px] -left-[10px] flex size-11 items-center justify-center"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-navy">
              <Image src="/design/plus.svg" alt="" width={8} height={8} className="rotate-45" />
            </span>
          </Link>
          <h1 className="font-serif text-[20px] leading-6 text-black uppercase">{mealLabel(meal)}</h1>
        </div>

        {typeof besked === "string" && besked && (
          <p
            role="status"
            className="mt-[16px] border-l-2 border-[#417a27] py-[4px] pl-[10px] font-inter text-[12px] font-semibold text-navy"
          >
            {besked}
          </p>
        )}

        <div className="mt-[22px]">
          <AddFood
            key={`${meal}-${date}`}
            date={date}
            meal={meal}
            // "Opret med stregkoden" fra "Vælg mængde" åbner Opret med koden udfyldt
            initialMode={opret === "1" ? "create" : "search"}
            initialBarcode={typeof stregkode === "string" && /^\d{6,14}$/.test(stregkode) ? stregkode : ""}
            recent={recent}
            own={own}
            summary={
              <DayIntakeCard
                eaten={dayTotals(logs)}
                targets={{
                  kcal: profile?.kcal_target ?? 0,
                  protein_g: profile?.protein_g ?? 0,
                  carbs_g: profile?.carbs_g ?? 0,
                  fat_g: profile?.fat_g ?? 0,
                }}
                mealLabel={mealLabel(meal)}
                logs={logs.filter((l) => l.meal === meal)}
              />
            }
          />
        </div>

        <Link
          href={backHref}
          className="mx-auto mt-[40px] flex h-[62px] w-[214px] items-center justify-center bg-navy font-inter text-[14px] font-bold text-cream uppercase hover:opacity-90"
        >
          Færdig
        </Link>

        <p className="mt-[32px] font-inter text-[10px] text-navy/70">
          Fødevaredata fra{" "}
          <a
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Open Food Facts
          </a>
        </p>
      </main>
    </div>
  );
}
