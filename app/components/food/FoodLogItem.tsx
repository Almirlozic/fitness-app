"use client";

import { useState, useTransition } from "react";
import { deleteFoodLog, updateFoodLog } from "@/app/(app)/kost/actions";
import { MEALS, type Meal, formatPortion, pickPortion } from "@/lib/food";
import type { NutrientField } from "@/lib/food-types";
import { formatNumber } from "@/lib/format";
import type { FoodLogRow } from "@/lib/supabase/database.types";
import { DeleteButton } from "../DeleteButton";
import { ChoiceButtons } from "../profile/ChoiceButtons";
import {
  type PortionValue,
  PortionInput,
  portionFields,
  toPortionValue,
  useFoodUnits,
} from "./PortionInput";

/** Rediger-formularen. Hentes først, når man åbner en logget vare. */
function EditFoodLog({
  log,
  onClose,
}: {
  log: FoodLogRow;
  onClose: () => void;
}) {
  const { state: units, addUnit } = useFoodUnits(log.food_id);
  const [portion, setPortion] = useState<PortionValue | null>(null);
  const [meal, setMeal] = useState(log.meal as Meal);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const unitList = units.status === "ready" ? units.units : [];
  // Åbn med den loggede enhed og antal. Findes enheden ikke længere (slettet,
  // omdøbt eller fejl ved hentning), åbnes i gram med de gemte gram.
  const value: PortionValue | null =
    portion ??
    (units.status === "loading"
      ? null
      : toPortionValue(pickPortion(unitList, log, log.grams)));

  // Tal pr. 100 g ud fra det, der er logget – til live-beregningen
  const per100 = Object.fromEntries(
    (
      [
        ["kcal_100g", log.kcal],
        ["protein_100g", log.protein_g],
        ["carbs_100g", log.carbs_g],
        ["fat_100g", log.fat_g],
      ] as [NutrientField, number][]
    ).map(([f, v]) => [f, (v / log.grams) * 100]),
  ) as Record<NutrientField, number>;

  return (
    <form
      className="mb-space-md flex flex-col gap-space-md border-l-2 border-primary bg-surface-container-low p-space-md"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value) return;
        startTransition(async () => {
          const result = await updateFoodLog(log.id, {
            meal,
            ...portionFields(value),
          });
          if (result.ok) onClose();
          else setError(result.error);
        });
      }}
    >
      {value ? (
        <PortionInput
          idPrefix={`edit-${log.id}`}
          foodId={log.food_id}
          units={unitList}
          onUnitAdded={addUnit}
          value={value}
          onChange={(v) => {
            setPortion(v);
            setError(undefined);
          }}
          per100={per100}
          error={error}
        />
      ) : (
        <p
          role="status"
          className="font-mono text-caption-mono uppercase text-secondary"
        >
          Henter enheder …
        </p>
      )}

      <ChoiceButtons
        id={`meal-${log.id}`}
        label="Måltid"
        options={MEALS.map((m) => ({ value: m.key, label: m.label }))}
        value={meal}
        onChange={setMeal}
      />

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
          disabled={pending || !value}
          className="min-h-11 bg-primary px-space-lg text-label-caps uppercase tracking-widest text-on-primary disabled:opacity-60"
        >
          {pending ? "[ Gemmer … ]" : "[ Gem ]"}
        </button>
      </div>
    </form>
  );
}

/** En logget madvare: "Æg · 4 stk (220 g) · 314 kcal". Tryk for at rette eller slette. */
export function FoodLogItem({ log }: { log: FoodLogRow }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-space-xs">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`Ret ${log.food_name}`}
          className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-space-md py-space-sm text-left"
        >
          <span className="min-w-0">
            <span className="block truncate text-body-md text-primary">
              {log.food_name}
            </span>
            <span className="font-mono text-caption-mono text-secondary">
              {formatPortion(log)}
            </span>
          </span>
          <span className="shrink-0 font-mono text-body-md font-bold text-primary">
            {formatNumber(Math.round(log.kcal))} kcal
          </span>
        </button>
        {/* Slet direkte fra listen – første tryk viser "Slet?", andet sletter */}
        <DeleteButton
          onDelete={deleteFoodLog.bind(null, log.id)}
          label="Slet"
          confirmLabel="Slet?"
          ariaLabel={`Slet ${log.food_name}`}
          className="shrink-0 px-space-sm text-caption-mono"
        />
      </div>

      {/* Ny formular ved hver åbning, så den altid starter fra det gemte */}
      {open && (
        <EditFoodLog
          key={`${log.id}-${log.grams}-${log.meal}`}
          log={log}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
