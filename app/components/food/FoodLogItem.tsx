"use client";

import { useState, useTransition } from "react";
import { deleteFoodLog, updateFoodLog } from "@/app/(app)/kost/actions";
import { MEALS, type Meal } from "@/lib/food";
import { formatNumber } from "@/lib/format";
import type { FoodLogRow } from "@/lib/supabase/database.types";
import { DecimalField } from "../DecimalField";
import { DeleteButton } from "../DeleteButton";
import { ChoiceButtons } from "../profile/ChoiceButtons";
import { toDecimalInput } from "../Stepper";

/** En logget madvare. Tryk for at rette gram/måltid eller slette. */
export function FoodLogItem({ log }: { log: FoodLogRow }) {
  const [open, setOpen] = useState(false);
  const [grams, setGrams] = useState(toDecimalInput(log.grams));
  const [meal, setMeal] = useState(log.meal as Meal);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between gap-space-md py-space-sm text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-body-md text-primary">{log.food_name}</span>
          <span className="font-mono text-caption-mono text-secondary">{formatNumber(log.grams)} g</span>
        </span>
        <span className="shrink-0 font-mono text-body-md font-bold text-primary">
          {formatNumber(Math.round(log.kcal))} kcal
        </span>
      </button>

      {open && (
        <form
          className="mb-space-md flex flex-col gap-space-md border-l-2 border-primary bg-surface-container-low p-space-md"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const result = await updateFoodLog(log.id, { grams, meal });
              if (result.ok) {
                setError(undefined);
                setOpen(false);
              } else setError(result.error);
            });
          }}
        >
          <DecimalField
            id={`grams-${log.id}`}
            label="Mængde (g)"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            error={error}
          />
          <ChoiceButtons
            id={`meal-${log.id}`}
            label="Måltid"
            options={MEALS.map((m) => ({ value: m.key, label: m.label }))}
            value={meal}
            onChange={setMeal}
          />
          <p className="font-mono text-caption-mono text-secondary">
            {formatNumber(log.protein_g)} g protein · {formatNumber(log.carbs_g)} g kulhydrat ·{" "}
            {formatNumber(log.fat_g)} g fedt
          </p>
          <div className="flex items-center justify-between gap-space-md">
            <DeleteButton
              onDelete={deleteFoodLog.bind(null, log.id)}
              label="[ Slet ]"
              confirmLabel="[ Slet? ]"
              ariaLabel={`Slet ${log.food_name}`}
              className="px-space-xs text-label-tag"
            />
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 bg-primary px-space-lg text-label-caps uppercase tracking-widest text-on-primary disabled:opacity-60"
            >
              {pending ? "[ Gemmer … ]" : "[ Gem ]"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
