import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNav } from "@/app/components/BottomNav";
import { AddFood } from "@/app/components/food/AddFood";
import { isMeal, mealLabel } from "@/lib/food";
import { getCustomFoods, getRecentFoods } from "@/lib/foods";
import { formatDayLabel, isIsoDate, todayIso } from "@/lib/format";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "FORM – Tilføj mad" };

export default async function TilfoejPage({ searchParams }: PageProps<"/kost/tilfoej">) {
  const { meal: mealParam, dato } = await searchParams;
  const today = todayIso();
  const date = isIsoDate(dato) && dato <= today ? dato : today;
  const meal = isMeal(mealParam) ? mealParam : "snack";

  const user = await requireUser();
  const [recent, own] = await Promise.all([getRecentFoods(), getCustomFoods(user.id)]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-margin pt-16 pb-24 md:px-margin-tablet">
        <Link
          href={`/kost?dato=${date}`}
          className="mt-space-md -ml-space-xs flex min-h-11 items-center self-start px-space-xs font-mono text-caption-mono uppercase text-primary"
        >
          ← Kost
        </Link>
        <h1 className="mb-space-xs text-display-hero-mobile uppercase leading-none tracking-tighter text-primary">
          Tilføj mad
        </h1>
        <p className="mb-space-lg font-mono text-caption-mono uppercase text-secondary">
          {mealLabel(meal)} · {formatDayLabel(date, today)}
        </p>

        <AddFood date={date} initialMeal={meal} recent={recent} own={own} />

        <p className="mt-space-2xl font-mono text-caption-mono text-secondary">
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
      <BottomNav activeHref="/kost" />
    </>
  );
}
