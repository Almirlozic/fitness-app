"use client";

import { TextField } from "../TextField";

export type TargetsValues = {
  kcal_target: string;
  protein_g: string;
  fat_g: string;
  carbs_g: string;
};

const FIELDS: { key: keyof TargetsValues; label: string; unit: string }[] = [
  { key: "kcal_target", label: "Kalorier", unit: "kcal" },
  { key: "protein_g", label: "Protein", unit: "g" },
  { key: "fat_g", label: "Fedt", unit: "g" },
  { key: "carbs_g", label: "Kulhydrat", unit: "g" },
];

/** De fire daglige mål, som brugeren kan rette */
export function TargetsEditor({
  values,
  onChange,
  errors = {},
}: {
  values: TargetsValues;
  onChange: (key: keyof TargetsValues, value: string) => void;
  errors?: Partial<Record<keyof TargetsValues, string>>;
}) {
  return (
    <div className="grid grid-cols-2 gap-space-md">
      {FIELDS.map(({ key, label, unit }) => (
        <TextField
          key={key}
          id={`target-${key}`}
          name={key}
          label={`${label} (${unit})`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={values[key]}
          onChange={(e) => onChange(key, e.target.value)}
          error={errors[key]}
        />
      ))}
    </div>
  );
}
