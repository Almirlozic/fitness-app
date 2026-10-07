import type { InputHTMLAttributes } from "react";
import { TextField } from "./TextField";

/**
 * Talfelt til decimaltal (kg, gram, kcal …). Viser decimal-tastaturet på mobil og
 * accepterer både komma og punktum – parses med parseDecimal i lib/profile-schema.
 */
export function DecimalField({
  id,
  label,
  error,
  ...input
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode"> & {
  id: string;
  label: string;
  error?: string;
}) {
  return (
    <TextField
      id={id}
      label={label}
      error={error}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      {...input}
    />
  );
}
