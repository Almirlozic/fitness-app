"use client";

import { useEffect, useState } from "react";
import { createFoodUnit } from "@/app/(app)/kost/actions";
import { type PortionChoice, formatUnitChip, gramsFromUnit, macrosForGrams } from "@/lib/food";
import type { FoodUnit, LastPortion, NutrientField } from "@/lib/food-types";
import { formatNumber } from "@/lib/format";
import { parseDecimal } from "@/lib/profile-schema";
import { DecimalField } from "../DecimalField";
import { FieldError, Stepper, toDecimalInput } from "../Stepper";
import { TextField } from "../TextField";

/** Mængden, som den står i felterne (tekst, så man frit kan skrive "0,5") */
export type PortionValue =
  | { mode: "grams"; grams: string }
  | { mode: "unit"; unitId: string; quantity: string };

export function toPortionValue(choice: PortionChoice): PortionValue {
  return choice.mode === "grams"
    ? { mode: "grams", grams: toDecimalInput(choice.grams) }
    : { mode: "unit", unitId: choice.unitId, quantity: toDecimalInput(choice.quantity) };
}

/** Felterne, server actions forventer: portion + grams eller unit_id + quantity */
export function portionFields(value: PortionValue) {
  return value.mode === "grams"
    ? { portion: "grams", grams: value.grams }
    : { portion: "unit", unit_id: value.unitId, quantity: value.quantity };
}

type UnitsState =
  | { status: "loading" }
  | { status: "ready"; units: FoodUnit[]; last: LastPortion | null }
  | { status: "error" };

/**
 * Henter varens enheder og det, brugeren loggede sidst. For varer uden id
 * (ikke gemt i databasen) er der ingen enheder.
 */
export function useFoodUnits(foodId: string | null) {
  const [state, setState] = useState<UnitsState>(
    foodId ? { status: "loading" } : { status: "ready", units: [], last: null },
  );

  useEffect(() => {
    if (!foodId) return;
    const controller = new AbortController();
    fetch(`/api/foods/${foodId}/units`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { units: FoodUnit[]; last: LastPortion | null }) =>
        setState({ status: "ready", units: data.units, last: data.last }),
      )
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: "error" });
      });
    return () => controller.abort();
  }, [foodId]);

  const addUnit = (unit: FoodUnit) =>
    setState((s) =>
      s.status === "ready"
        ? { ...s, units: [...s.units.filter((u) => u.id !== unit.id), unit] }
        : s,
    );

  return { state, addUnit };
}


function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`min-h-11 border px-space-md font-mono text-label-tag uppercase transition-colors ${
        selected
          ? "border-primary bg-primary text-on-primary"
          : "border-surface-container-high bg-surface-container-lowest text-primary hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}

export function PortionInput({
  idPrefix,
  foodId,
  units,
  onUnitAdded,
  value,
  onChange,
  per100,
  error,
}: {
  idPrefix: string;
  foodId: string | null;
  units: FoodUnit[];
  onUnitAdded: (unit: FoodUnit) => void;
  value: PortionValue;
  onChange: (value: PortionValue) => void;
  /** Tal pr. 100 g til live-beregningen (NaN, hvis de mangler) */
  per100: Record<NutrientField, number>;
  error?: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newUnit, setNewUnit] = useState({ name: "", grams: "" });
  const [newUnitErrors, setNewUnitErrors] = useState<Partial<Record<"name" | "grams", string>>>({});
  const [saving, setSaving] = useState(false);

  const unit = value.mode === "unit" ? units.find((u) => u.id === value.unitId) : undefined;
  const quantity = value.mode === "unit" ? parseDecimal(value.quantity) : Number.NaN;
  const grams =
    value.mode === "grams"
      ? parseDecimal(value.grams)
      : unit && quantity > 0
        ? gramsFromUnit(quantity, unit.grams)
        : Number.NaN;
  const known = Object.values(per100).every((v) => !Number.isNaN(v));
  const macros = grams > 0 && known ? macrosForGrams(per100, grams) : null;

  async function saveNewUnit() {
    if (!foodId) return;
    setSaving(true);
    const result = await createFoodUnit(foodId, newUnit);
    setSaving(false);
    if (result.unit) {
      onUnitAdded(result.unit);
      onChange({ mode: "unit", unitId: result.unit.id, quantity: "1" });
      setAdding(false);
      setNewUnit({ name: "", grams: "" });
      setNewUnitErrors({});
    } else {
      setNewUnitErrors(result.fieldErrors ?? {});
    }
  }

  return (
    <div className="flex flex-col gap-space-md">
      {/* Felterne, server action'en læser */}
      {Object.entries(portionFields(value)).map(([name, v]) => (
        <input key={name} type="hidden" name={name} value={v} />
      ))}

      <fieldset>
        <legend className="mb-space-xs font-mono text-label-tag uppercase text-secondary">
          [ Mængde i ]
        </legend>
        <div role="radiogroup" className="flex flex-wrap gap-space-xs">
          <Chip
            selected={value.mode === "grams"}
            onClick={() =>
              onChange({ mode: "grams", grams: toDecimalInput(grams > 0 ? grams : 100) })
            }
          >
            gram
          </Chip>
          {units.map((u) => (
            <Chip
              key={u.id}
              selected={value.mode === "unit" && value.unitId === u.id}
              onClick={() => onChange({ mode: "unit", unitId: u.id, quantity: "1" })}
            >
              {formatUnitChip(u)}
            </Chip>
          ))}
          {foodId && !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="min-h-11 border border-dashed border-primary px-space-md font-mono text-label-tag uppercase text-primary"
            >
              + Ny enhed
            </button>
          )}
        </div>
      </fieldset>

      {adding && (
        <div className="flex flex-col gap-space-sm border-l-2 border-primary bg-surface-container-low p-space-sm">
          <div className="grid grid-cols-2 gap-space-sm">
            <TextField
              id={`${idPrefix}-unit-name`}
              label="Navn"
              placeholder="fx stk"
              autoComplete="off"
              value={newUnit.name}
              onChange={(e) => setNewUnit((u) => ({ ...u, name: e.target.value }))}
              error={newUnitErrors.name}
            />
            <DecimalField
              id={`${idPrefix}-unit-grams`}
              label="1 enhed = gram"
              placeholder="fx 55"
              value={newUnit.grams}
              onChange={(e) => setNewUnit((u) => ({ ...u, grams: e.target.value }))}
              error={newUnitErrors.grams}
            />
          </div>
          <div className="flex justify-end gap-space-sm">
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="min-h-11 px-space-md font-mono text-label-tag uppercase text-secondary"
            >
              Annuller
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={saveNewUnit}
              className="min-h-11 bg-primary px-space-md font-mono text-label-tag uppercase text-on-primary disabled:opacity-60"
            >
              {saving ? "Gemmer …" : "Gem enhed"}
            </button>
          </div>
        </div>
      )}

      {value.mode === "grams" ? (
        <DecimalField
          id={`${idPrefix}-grams`}
          label="Gram"
          value={value.grams}
          onChange={(e) => onChange({ mode: "grams", grams: e.target.value })}
          error={error}
        />
      ) : (
        <Stepper
          id={`${idPrefix}-quantity`}
          name="quantity-visible"
          label={`Antal ${unit?.name ?? ""}`.trim()}
          value={value.quantity}
          onChange={(q) => onChange({ ...value, quantity: q })}
          step={1}
          min={0.5}
          inputMode="decimal"
          error={error}
        />
      )}

      <p aria-live="polite" className="font-mono text-body-sm text-primary">
        {value.mode === "unit" && unit && quantity > 0 && (
          <>
            {formatNumber(quantity)} {unit.name} ={" "}
          </>
        )}
        {grams > 0 ? `${formatNumber(grams)} g` : "–"}
        {macros && (
          <>
            {" · "}
            <span className="font-bold">{formatNumber(Math.round(macros.kcal))} kcal</span>
            {` · ${formatNumber(macros.protein_g)} g protein`}
          </>
        )}
      </p>
      {value.mode === "unit" && !unit && units.length > 0 && (
        <FieldError>Vælg en enhed</FieldError>
      )}
    </div>
  );
}
