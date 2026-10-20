"use client";

import Image from "next/image";
import { type ReactNode, useActionState, useState } from "react";
import { type FoodFormState, createFoodUnit, logFood, saveFoodLogEdit } from "@/app/(app)/kost/actions";
import { MEASURES, type Meal, findMeasure, gramsFromUnit, macrosForGrams, pickPortion } from "@/lib/food";
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
import { toDecimalInput } from "../Stepper";
import { FormMessage, TextField } from "../TextField";
import { useFoodUnits } from "./useFoodUnits";

/** Valgt enhed i dropdown'en: basisenhed, standardmål (kg, l …) eller varens egen enhed */
type Choice = { key: string; quantity: string };
const NEW_UNIT = "__ny__";

/** Hvordan serveren skal behandle varen – se logFood i kost/actions.ts */
function modeFor(food: FoodChoice) {
  if (food.id) return "existing";
  if (food.source === "off" && food.barcode) return "off_filled";
  return "manual";
}

/**
 * "Vælg mængde" fra Figma-designet (node 35:148): et lille felt til antal og et
 * langt felt til enhed (gram/ml, varens enheder som "Hel ( 125 g )", kg eller
 * cl/dl/l). FÆRDIG logger varen. `summary` er kortet med dagligt indtag.
 */
/** Når man retter noget, man har logget: loggen og hvor man skal tilbage til */
export type EditingLog = {
  id: string;
  grams: number;
  quantity: number | null;
  unit_name: string | null;
  amount_unit: "g" | "ml";
  back: "kost" | "tilfoej";
};

export function FoodAmountForm({
  food,
  date,
  meal,
  summary,
  editing,
}: {
  food: FoodChoice;
  date: string;
  meal: Meal;
  summary: ReactNode;
  /** Sat, når man retter en logget vare – formularen starter med det loggede */
  editing?: EditingLog;
}) {
  const missing = missingNutrients(food);
  const { state: unitsState, addUnit } = useFoodUnits(food.id);
  const units = unitsState.status === "ready" ? unitsState.units : [];
  const base = food.unit;
  const baseLabel = base;

  const [choice, setChoice] = useState<Choice | null>(null);
  const [filled, setFilled] = useState<Partial<Record<NutrientField, string>>>({});
  const [adding, setAdding] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: "", grams: "" });
  const [newUnitErrors, setNewUnitErrors] = useState<Partial<Record<"name" | "grams", string>>>({});
  const [savingUnit, setSavingUnit] = useState(false);
  const [state, action, pending] = useActionState<FoodFormState, FormData>(
    editing ? saveFoodLogEdit : logFood,
    { status: "idle" },
  );
  const errors = state.fieldErrors ?? {};

  // Forvalg ved rettelse: det loggede (samme tal og enhed). Findes varens enhed
  // ikke længere, vises mængden i g/ml.
  const fromLog = (log: EditingLog): Choice => {
    const n = (v: number) => toDecimalInput(v);
    if (log.unit_name && log.quantity !== null) {
      if (findMeasure(base, log.unit_name)) return { key: `m:${log.unit_name}`, quantity: n(log.quantity) };
      const unit = units.find((u) => u.name.toLowerCase() === log.unit_name!.toLowerCase());
      if (unit) return { key: `u:${unit.id}`, quantity: n(log.quantity) };
    }
    if (log.amount_unit !== base) return { key: `m:${log.amount_unit}`, quantity: n(log.grams) };
    return { key: "base", quantity: n(log.grams) };
  };

  // Forvalg: det, der blev brugt sidst for varen; ellers første enhed; ellers gram/ml
  const current: Choice | null =
    choice ??
    (unitsState.status === "loading"
      ? null
      : editing
        ? fromLog(editing)
        : (() => {
          const pick = pickPortion(
            units,
            unitsState.status === "ready" ? unitsState.last : null,
            food.serving_g ?? 100,
          );
          return pick.mode === "unit"
            ? { key: `u:${pick.unitId}`, quantity: toDecimalInput(pick.quantity) }
            : { key: "base", quantity: toDecimalInput(pick.grams) };
        })());

  // Standardenhederne vises bare med navn (g, kg, ml, cl, dl, l) – tallet i feltet er
  // altid i den valgte enhed. Varens egne enheder viser, hvor meget én er.
  const options = [
    { key: "base", label: baseLabel },
    ...MEASURES[base].map((m) => ({ key: `m:${m.name}`, label: m.name })),
    ...units.map((u) => ({ key: `u:${u.id}`, label: `${u.name} ( ${formatNumber(u.grams)} ${base} )` })),
  ];
  const selected = options.find((o) => o.key === current?.key) ?? options[0];

  // Valgt standardmål (ml, l, kg …) – mængden måles i målets egen enhed
  const measure =
    current?.key.startsWith("m:") ? findMeasure(base, current.key.slice(2)) : undefined;

  // Mængden i den valgte enhed (g eller ml)
  const quantity = parseDecimal(current?.quantity ?? "");
  const amount = (() => {
    if (!current || !(quantity > 0)) return Number.NaN;
    if (current.key === "base") return quantity;
    if (current.key.startsWith("m:")) {
      return measure ? gramsFromUnit(quantity, measure.factor) : Number.NaN;
    }
    const unit = units.find((u) => `u:${u.id}` === current.key);
    return unit ? gramsFromUnit(quantity, unit.grams) : Number.NaN;
  })();

  // Det, man har valgt, i ens egen enhed: "1 kg", "500 ml", "1 portion (500 g)"
  const chosenUnit = current?.key.startsWith("u:")
    ? units.find((u) => `u:${u.id}` === current.key)
    : undefined;
  const amountText = measure
    ? `${formatNumber(quantity)} ${measure.name}`
    : chosenUnit
      ? `${formatNumber(quantity)} ${chosenUnit.name} (${formatNumber(amount)} ${base})`
      : `${formatNumber(quantity)} ${base}`;

  const per100 = Object.fromEntries(
    NUTRIENT_FIELDS.map((f) => [f, food[f] ?? parseDecimal(filled[f] ?? "")]),
  ) as Record<NutrientField, number>;
  const known = NUTRIENT_FIELDS.every((f) => !Number.isNaN(per100[f]));
  const macros = amount > 0 && known ? macrosForGrams(per100, amount) : null;

  // Felterne, logFood forventer
  const portionFields: Record<string, string> = !current
    ? {}
    : current.key === "base"
      ? { portion: "grams", grams: current.quantity }
      : current.key.startsWith("m:")
        ? { portion: "measure", measure: current.key.slice(2), quantity: current.quantity }
        : { portion: "unit", unit_id: current.key.slice(2), quantity: current.quantity };

  async function saveNewUnit() {
    if (!food.id) return;
    setSavingUnit(true);
    const result = await createFoodUnit(food.id, newUnit);
    setSavingUnit(false);
    if (result.unit) {
      addUnit(result.unit);
      setChoice({ key: `u:${result.unit.id}`, quantity: "1" });
      setAdding(false);
      setNewUnit({ name: "", grams: "" });
      setNewUnitErrors({});
    } else {
      setNewUnitErrors(result.fieldErrors ?? {});
    }
  }

  return (
    <form action={action} noValidate>
      {/* Varen og dens tal sendes med; serveren slår selv op, når den kan */}
      <input type="hidden" name="dato" value={date} />
      {editing && <input type="hidden" name="log_id" value={editing.id} />}
      {editing && <input type="hidden" name="tilbage" value={editing.back} />}
      <input type="hidden" name="meal" value={meal} />
      <input type="hidden" name="mode" value={modeFor(food)} />
      <input type="hidden" name="food_id" value={food.id ?? ""} />
      <input type="hidden" name="barcode" value={food.barcode ?? ""} />
      <input type="hidden" name="name" value={food.name} />
      <input type="hidden" name="brand" value={food.brand ?? ""} />
      <input type="hidden" name="serving_g" value={food.serving_g === null ? "" : String(food.serving_g)} />
      <input type="hidden" name="amount_unit" value={base} />
      {NUTRIENT_FIELDS.filter((f) => food[f] !== null).map((f) => (
        <input key={f} type="hidden" name={f} value={String(food[f])} />
      ))}
      {Object.entries(portionFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {/* [ 1 ] [ Hel ( 125 g )        ⌄ ] */}
      <div className="flex items-center gap-[15px]">
        <label htmlFor="amount-quantity" className="sr-only">
          Antal
        </label>
        <input
          id="amount-quantity"
          inputMode="decimal"
          autoComplete="off"
          value={current?.quantity ?? ""}
          disabled={!current}
          onChange={(e) => current && setChoice({ ...current, quantity: e.target.value })}
          aria-invalid={errors.quantity || errors.grams ? true : undefined}
          className={`h-8 w-[37px] shrink-0 rounded-[5px] border-[0.5px] bg-cream text-center font-inter text-[16px] font-light text-black focus:outline-2 focus:outline-offset-1 focus:outline-navy ${
            errors.quantity || errors.grams ? "border-error" : "border-navy"
          }`}
        />

        <div className="relative h-8 min-w-0 flex-1 rounded-[5px] border-[0.5px] border-navy focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-navy">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-[28px] left-[10px] -translate-y-1/2 truncate font-serif text-[10px] text-navy/70"
          >
            {current ? selected.label : "Henter enheder …"}
          </span>
          <Image
            src="/design/chevron-small.svg"
            alt=""
            width={4.18198}
            height={7.36396}
            className="pointer-events-none absolute top-1/2 right-[14px] -translate-y-1/2 rotate-90"
          />
          <label htmlFor="amount-unit" className="sr-only">
            Enhed
          </label>
          <select
            id="amount-unit"
            value={current?.key ?? "base"}
            disabled={!current}
            onChange={(e) => {
              const key = e.target.value;
              if (key === NEW_UNIT) return setAdding(true);
              // Tallet bevares: står der 1, og man vælger ml, er det 1 ml
              setChoice({ key, quantity: current?.quantity ?? "1" });
            }}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 text-[16px]"
          >
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
            {food.id && <option value={NEW_UNIT}>+ Ny enhed …</option>}
          </select>
        </div>
      </div>

      {(errors.quantity || errors.grams || errors.measure || errors.unit_id) && (
        <p className="mt-[6px] font-inter text-[10px] text-error">
          {errors.quantity ?? errors.grams ?? errors.measure ?? errors.unit_id}
        </p>
      )}

      {adding && (
        <div className="mt-[12px] flex flex-col gap-[8px] rounded-[5px] border-[0.5px] border-navy p-[10px]">
          <p className="font-serif text-[10px] text-navy uppercase">Ny enhed</p>
          <div className="grid grid-cols-2 gap-[10px]">
            <TextField
              id="new-unit-name"
              label="Navn"
              placeholder="fx hel, skive, dåse"
              autoComplete="off"
              value={newUnit.name}
              onChange={(e) => setNewUnit((u) => ({ ...u, name: e.target.value }))}
              error={newUnitErrors.name}
            />
            <DecimalField
              id="new-unit-grams"
              label={`1 enhed = ${base === "ml" ? "ml" : "gram"}`}
              placeholder={base === "ml" ? "fx 330" : "fx 125"}
              value={newUnit.grams}
              onChange={(e) => setNewUnit((u) => ({ ...u, grams: e.target.value }))}
              error={newUnitErrors.grams}
            />
          </div>
          <div className="flex justify-end gap-[8px]">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="min-h-11 px-[12px] font-serif text-[10px] text-navy uppercase"
            >
              Annuller
            </button>
            <button
              type="button"
              disabled={savingUnit}
              onClick={saveNewUnit}
              className="min-h-11 bg-navy px-[14px] font-inter text-[12px] font-bold text-cream uppercase disabled:opacity-60"
            >
              {savingUnit ? "Gemmer …" : "Gem enhed"}
            </button>
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="mt-[16px] flex flex-col gap-[10px]">
          <FormMessage status="info">
            Open Food Facts mangler nogle tal. Udfyld dem fra emballagen – så gemmes varen som din
            egen, og du skal kun gøre det én gang.
          </FormMessage>
          <div className="grid grid-cols-2 gap-[10px]">
            {missing.map((f) => (
              <DecimalField
                key={f}
                id={`fill-${f}`}
                name={f}
                label={`${NUTRIENT_LABELS[f]} / 100 ${base}`}
                value={filled[f] ?? ""}
                onChange={(e) => setFilled((v) => ({ ...v, [f]: e.target.value }))}
                error={errors[f]}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-[22px]">{summary}</div>

      {/* Hvad der logges – opdateres med det samme */}
      <p aria-live="polite" className="mt-[16px] text-center font-inter text-[12px] text-navy">
        <span className="font-semibold">{food.name}</span>
        {amount > 0 && ` · ${amountText}`}
        {macros && ` · ${formatNumber(Math.round(macros.kcal))} kcal · ${formatNumber(macros.protein_g)} g protein`}
      </p>

      {state.status === "error" && state.message && (
        <div className="mt-[16px]">
          <FormMessage status="error">{state.message}</FormMessage>
        </div>
      )}

      {/* FÆRDIG logger varen og går tilbage til søgningen */}
      <button
        type="submit"
        disabled={pending || !current}
        className="mx-auto mt-[40px] flex h-[62px] w-[214px] items-center justify-center bg-navy font-inter text-[14px] font-bold text-cream uppercase hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Gemmer …" : "Færdig"}
      </button>
    </form>
  );
}
