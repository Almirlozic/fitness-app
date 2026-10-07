"use client";

import { useActionState, useState } from "react";
import { type FoodFormState, logFood } from "@/app/(app)/kost/actions";
import { MEALS, type Meal, pickPortion } from "@/lib/food";
import {
  type FoodChoice,
  NUTRIENT_FIELDS,
  NUTRIENT_LABELS,
  type NutrientField,
  missingNutrients,
} from "@/lib/food-types";
import { formatNumber } from "@/lib/format";
import { parseDecimal } from "@/lib/profile-schema";
import { DecimalField } from "../DecimalField";
import { ChoiceButtons } from "../profile/ChoiceButtons";
import { type PortionValue, PortionInput, toPortionValue, useFoodUnits } from "./PortionInput";
import { FormMessage, SubmitButton } from "../TextField";

/** Hvordan serveren skal behandle varen – se logFood i kost/actions.ts */
function modeFor(food: FoodChoice) {
  if (food.id) return "existing";
  if (food.source === "off" && food.barcode) return "off_filled";
  return "manual";
}

export function FoodPortionForm({
  food,
  date,
  meal,
  onMealChange,
  onBack,
}: {
  food: FoodChoice;
  date: string;
  meal: Meal;
  onMealChange: (meal: Meal) => void;
  onBack: () => void;
}) {
  const missing = missingNutrients(food);
  const mode = modeFor(food);
  const { state: units, addUnit } = useFoodUnits(food.id);
  // null = brugeren har ikke ændret noget endnu → brug forvalget
  const [portion, setPortion] = useState<PortionValue | null>(null);
  const [filled, setFilled] = useState<Partial<Record<NutrientField, string>>>({});
  const [state, action, pending] = useActionState<FoodFormState, FormData>(logFood, {
    status: "idle",
  });

  // Tal pr. 100 g: fra varen, eller det brugeren har udfyldt
  const nutrient = (f: NutrientField) => food[f] ?? parseDecimal(filled[f] ?? "");
  const per100 = Object.fromEntries(NUTRIENT_FIELDS.map((f) => [f, nutrient(f)])) as Record<
    NutrientField,
    number
  >;
  const errors = state.fieldErrors ?? {};
  const unitList = units.status === "ready" ? units.units : [];
  const value: PortionValue | null =
    portion ??
    (units.status === "loading"
      ? null
      : toPortionValue(
          pickPortion(unitList, units.status === "ready" ? units.last : null, food.serving_g ?? 100),
        ));

  return (
    <form action={action} noValidate className="flex flex-col gap-space-lg">
      <input type="hidden" name="dato" value={date} />
      <input type="hidden" name="meal" value={meal} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="food_id" value={food.id ?? ""} />
      <input type="hidden" name="barcode" value={food.barcode ?? ""} />
      <input type="hidden" name="name" value={food.name} />
      <input type="hidden" name="brand" value={food.brand ?? ""} />
      <input type="hidden" name="serving_g" value={food.serving_g === null ? "" : String(food.serving_g)} />
      {/* Kendte tal sendes med; manglende kommer fra felterne nedenfor */}
      {NUTRIENT_FIELDS.filter((f) => food[f] !== null).map((f) => (
        <input key={f} type="hidden" name={f} value={String(food[f])} />
      ))}

      <div className="border-t-2 border-primary bg-surface-container-lowest p-space-md">
        <button
          type="button"
          onClick={onBack}
          className="-mt-space-xs mb-space-xs min-h-11 font-mono text-caption-mono uppercase text-primary underline underline-offset-2"
        >
          ← Vælg en anden
        </button>
        <h2 className="text-headline-sm uppercase text-primary">{food.name}</h2>
        {food.brand && (
          <p className="font-mono text-caption-mono uppercase text-secondary">{food.brand}</p>
        )}
        <dl className="mt-space-sm grid grid-cols-4 gap-space-xs font-mono text-caption-mono uppercase">
          {NUTRIENT_FIELDS.map((f) => (
            <div key={f}>
              <dt className="text-secondary">{NUTRIENT_LABELS[f].split(" ")[0]}</dt>
              <dd className={food[f] === null ? "text-error" : "text-primary"}>
                {food[f] === null ? "mangler" : formatNumber(food[f])}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-space-xs font-mono text-caption-mono text-secondary">pr. 100 g</p>
      </div>

      {missing.length > 0 && (
        <div className="flex flex-col gap-space-md">
          <FormMessage status="info">
            Open Food Facts mangler nogle tal. Udfyld dem fra emballagen – så gemmes varen som din
            egen, og du skal kun gøre det én gang.
          </FormMessage>
          <div className="grid grid-cols-2 gap-space-md">
            {missing.map((f) => (
              <DecimalField
                key={f}
                id={`fill-${f}`}
                name={f}
                label={`${NUTRIENT_LABELS[f]} / 100 g`}
                value={filled[f] ?? ""}
                onChange={(e) => setFilled((v) => ({ ...v, [f]: e.target.value }))}
                error={errors[f]}
              />
            ))}
          </div>
        </div>
      )}

      {value ? (
        <PortionInput
          idPrefix="log"
          foodId={food.id}
          units={unitList}
          onUnitAdded={addUnit}
          value={value}
          onChange={setPortion}
          per100={per100}
          error={errors.grams ?? errors.quantity ?? errors.unit_id}
        />
      ) : (
        <p role="status" className="font-mono text-caption-mono uppercase text-secondary">
          Henter enheder …
        </p>
      )}

      <ChoiceButtons
        id="meal"
        label="Måltid"
        options={MEALS.map((m) => ({ value: m.key, label: m.label }))}
        value={meal}
        onChange={onMealChange}
        error={errors.meal}
      />

      {state.status === "error" && state.message && (
        <FormMessage status="error">{state.message}</FormMessage>
      )}
      {errors.dato && <FormMessage status="error">{errors.dato}</FormMessage>}

      <SubmitButton pending={pending || !value}>Log</SubmitButton>
    </form>
  );
}
