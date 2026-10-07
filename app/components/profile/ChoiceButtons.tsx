"use client";

import { FieldError } from "../Stepper";

export type Choice<T extends string> = { value: T; label: string; hint?: string };

/** Store valgknapper (radiogruppe), fx køn eller træning pr. uge */
export function ChoiceButtons<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
  error,
  columns = 2,
}: {
  id: string;
  label: string;
  options: Choice<T>[];
  value: T | "";
  onChange: (value: T) => void;
  error?: string;
  columns?: 1 | 2;
}) {
  return (
    <fieldset className="flex flex-col gap-space-xs">
      <legend id={`${id}-legend`} className="mb-space-xs font-mono text-label-tag uppercase text-secondary">
        [ {label} ]
      </legend>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-legend`}
        className={`grid gap-space-sm ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={`flex min-h-16 flex-col items-center justify-center border px-space-sm py-space-sm text-center transition-colors ${
                selected
                  ? "border-primary bg-primary text-on-primary"
                  : "border-surface-container-high bg-surface-container-lowest text-primary hover:border-primary"
              }`}
            >
              <span className="text-headline-sm uppercase">{option.label}</span>
              {option.hint && (
                <span
                  className={`mt-space-xs font-mono text-caption-mono uppercase ${
                    selected ? "text-on-primary-container" : "text-secondary"
                  }`}
                >
                  {option.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </fieldset>
  );
}
