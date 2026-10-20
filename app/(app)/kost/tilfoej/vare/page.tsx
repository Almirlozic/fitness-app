import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { z } from "zod";
import { type EditingLog, FoodAmountForm } from "@/app/components/food/FoodAmountForm";
import { DayIntakeCard } from "@/app/components/kost/DayIntakeCard";
import { FormMessage } from "@/app/components/TextField";
import { requireUser } from "@/lib/auth";
import { dayTotals, isMeal, mealLabel } from "@/lib/food";
import { barcodeSchema } from "@/lib/food-schema";
import { type FoodForPortion, getFoodForPortion, getFoodLogsForDay, toFoodLog } from "@/lib/foods";
import { isIsoDate, todayIso } from "@/lib/format";
import { OFF_ERROR_MESSAGE, OffError } from "@/lib/off";
import { getProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "FORM – Vælg mængde" };

const param = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

// "Vælg mængde" efter Figma-designet "Fitness-tracker" (node 35:148 "Kost enheder").
// Åbnes med ?id= (vare i databasen), ?stregkode= (scannet/søgt), ?log= (tidligere log)
// eller ?rediger= (ret noget, man har logget – med samme tal og enhed som før).
export default async function VarePage({ searchParams }: PageProps<"/kost/tilfoej/vare">) {
  const sp = await searchParams;
  const today = todayIso();
  const user = await requireUser();

  // Rettelse: loggen bestemmer vare, måltid og dato
  const editId = z.uuid().safeParse(param(sp.rediger));
  let editing: EditingLog | undefined;
  let editFoodId: string | null = null;
  let editDate: string | undefined;
  let editMeal: string | undefined;
  if (editId.success) {
    const supabase = await createClient();
    const { data } = await supabase.from("food_logs").select("*").eq("id", editId.data).maybeSingle();
    if (data) {
      const log = toFoodLog(data);
      editing = {
        id: log.id,
        grams: log.grams,
        quantity: log.quantity,
        unit_name: log.unit_name,
        amount_unit: log.amount_unit === "ml" ? "ml" : "g",
        back: param(sp.tilbage) === "tilfoej" ? "tilfoej" : "kost",
      };
      editFoodId = log.food_id;
      editDate = log.eaten_on;
      editMeal = log.meal;
    }
  }

  const dato = editDate ?? param(sp.dato);
  const date = isIsoDate(dato) && dato <= today ? dato : today;
  const mealParam = editMeal ?? param(sp.meal);
  const meal = isMeal(mealParam) ? mealParam : "snack";
  const searchHref = `/kost/tilfoej?meal=${meal}&dato=${date}`;
  const closeHref = editing?.back === "kost" ? `/kost?dato=${date}` : searchHref;

  const id = z.uuid().safeParse(editing ? (editFoodId ?? undefined) : param(sp.id));
  // Rettelse af en vare, der er slettet: tallene kommer fra selve loggen
  const logId = z.uuid().safeParse(editing && !editFoodId ? editing.id : param(sp.log));
  const barcode = barcodeSchema.safeParse(editing ? "" : (param(sp.stregkode) ?? ""));

  let result: FoodForPortion | { status: "error" };
  try {
    result = await getFoodForPortion(user.id, {
      id: id.success ? id.data : undefined,
      barcode: barcode.success ? barcode.data : undefined,
      logId: logId.success ? logId.data : undefined,
    });
  } catch (error) {
    if (!(error instanceof OffError)) throw error;
    result = { status: "error" };
  }

  const [logs, profile] = await Promise.all([getFoodLogsForDay(date), getProfile()]);

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-[22px] pt-[calc(env(safe-area-inset-top)+27px)] pb-[calc(env(safe-area-inset-bottom)+40px)]">
        {/* × (tilbage til søgningen) og måltidets navn */}
        <div className="relative flex h-6 items-center justify-center">
          <Link
            href={closeHref}
            aria-label={editing ? "Luk uden at gemme" : "Luk og gå tilbage til søgningen"}
            className="absolute -top-[10px] -left-[10px] flex size-11 items-center justify-center"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-navy">
              <Image src="/design/plus.svg" alt="" width={8} height={8} className="rotate-45" />
            </span>
          </Link>
          <h1 className="font-serif text-[20px] leading-6 text-black uppercase">{mealLabel(meal)}</h1>
        </div>

        <div className="mt-[22px]">
          {result.status === "found" || result.status === "incomplete" ? (
            <FoodAmountForm
              key={result.food.id ?? result.food.barcode ?? result.food.logId ?? result.food.name}
              food={result.food}
              date={date}
              meal={meal}
              editing={editing}
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
          ) : (
            <div className="flex flex-col gap-[16px]">
              <FormMessage status={result.status === "error" ? "error" : "info"}>
                {result.status === "error"
                  ? OFF_ERROR_MESSAGE
                  : barcode.success
                    ? `Stregkoden ${barcode.data} findes ikke i Open Food Facts. Opret fødevaren selv – så kan du scanne den næste gang.`
                    : "Fødevaren findes ikke længere."}
              </FormMessage>
              {barcode.success && result.status === "not_found" && (
                <Link
                  href={`${searchHref}&opret=1&stregkode=${barcode.data}`}
                  className="mx-auto flex h-[62px] w-[214px] items-center justify-center bg-navy font-inter text-[14px] font-bold text-cream uppercase"
                >
                  Opret med stregkoden
                </Link>
              )}
              <Link
                href={searchHref}
                className="flex min-h-11 items-center justify-center font-serif text-[12px] text-navy uppercase underline underline-offset-[3px]"
              >
                Tilbage til søgning
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
