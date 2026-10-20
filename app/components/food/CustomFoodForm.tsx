"use client";

import { useActionState, useState } from "react";
import { type FoodFormState, createCustomFood } from "@/app/(app)/kost/actions";
import { type AmountUnit, type FoodChoice, NUTRIENT_FIELDS, NUTRIENT_LABELS } from "@/lib/food-types";
import { ChoiceButtons } from "../profile/ChoiceButtons";
import { DecimalField } from "../DecimalField";
import { FormMessage, SubmitButton, TextField } from "../TextField";

/** Opret egen fødevare. Når den er gemt, åbnes den med det samme, så den kan logges. */
export function CustomFoodForm({
  initialBarcode = "",
  onCreated,
}: {
  initialBarcode?: string;
  onCreated: (food: FoodChoice) => void;
}) {
  const [state, action, pending] = useActionState(
    async (prev: FoodFormState, formData: FormData) => {
      const result = await createCustomFood(prev, formData);
      if (result.status === "success" && result.food) onCreated(result.food);
      return result;
    },
    { status: "idle" } as FoodFormState,
  );
  const errors = state.fieldErrors ?? {};
  // Drikkevarer måles i ml; næringstal og portion følger enheden
  const [amountUnit, setAmountUnit] = useState<AmountUnit>("g");
  const unitWord = amountUnit === "ml" ? "ml" : "gram";

  return (
    <form action={action} noValidate className="flex flex-col gap-space-md">
      {state.status === "error" && state.message && (
        <FormMessage status="error">{state.message}</FormMessage>
      )}
      <TextField id="custom-name" name="name" label="Navn" autoComplete="off" error={errors.name} />
      <TextField
        id="custom-brand"
        name="brand"
        label="Mærke (valgfrit)"
        autoComplete="off"
        error={errors.brand}
      />

      <input type="hidden" name="amount_unit" value={amountUnit} />
      <ChoiceButtons
        id="custom-amount-unit"
        label="Måles i"
        options={[
          { value: "g", label: "Gram", hint: "Mad" },
          { value: "ml", label: "Ml", hint: "Drikkevarer" },
        ]}
        value={amountUnit}
        onChange={setAmountUnit}
        error={errors.amount_unit}
      />

      <p className="mt-space-sm font-mono text-label-tag uppercase text-secondary">
        Næringsindhold pr. 100 {amountUnit}
      </p>
      <div className="grid grid-cols-2 gap-space-md">
        {NUTRIENT_FIELDS.map((f) => (
          <DecimalField key={f} id={`custom-${f}`} name={f} label={NUTRIENT_LABELS[f]} error={errors[f]} />
        ))}
      </div>

      <p className="mt-space-sm font-mono text-label-tag uppercase text-secondary">
        Enhed (valgfrit) – fx {amountUnit === "ml" ? "1 glas = 250 ml" : "1 stk = 55 g"}
      </p>
      <div className="grid grid-cols-2 gap-space-md">
        <TextField
          id="custom-unit-name"
          name="unit_name"
          label="Navn"
          placeholder="fx stk"
          autoComplete="off"
          error={errors.unit_name}
        />
        <DecimalField
          id="custom-unit-grams"
          name="unit_grams"
          label={`1 enhed = ${unitWord}`}
          placeholder={amountUnit === "ml" ? "fx 250" : "fx 55"}
          error={errors.unit_grams}
        />
      </div>

      <DecimalField
        id="custom-serving"
        name="serving_g"
        label={`Portion i ${unitWord} (valgfrit)`}
        placeholder="fx 170"
        error={errors.serving_g}
      />
      <TextField
        id="custom-barcode"
        name="barcode"
        label="Stregkode (valgfrit)"
        inputMode="numeric"
        autoComplete="off"
        defaultValue={initialBarcode}
        error={errors.barcode}
      />

      <SubmitButton pending={pending}>Gem fødevare</SubmitButton>
    </form>
  );
}
