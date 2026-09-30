"use client";

/** "22,5" eller "22.5" → 22.5. Tom eller ugyldig tekst → null */
export function parseDecimal(value: string) {
  const n = Number(value.trim().replace(",", "."));
  return value.trim() === "" || Number.isNaN(n) ? null : n;
}

/** 22.5 → "22,5" */
export function toDecimalInput(n: number) {
  return String(Math.round(n * 100) / 100).replace(".", ",");
}

/**
 * Talfelt med − og +. Værdien er tekst, så man frit kan skrive fx "22,5";
 * serveren validerer. Knapperne tæller op/ned fra det, der står i feltet.
 */
export function Stepper({
  id,
  name,
  label,
  value,
  onChange,
  step,
  min = 0,
  inputMode,
  error,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: number;
  min?: number;
  inputMode: "decimal" | "numeric";
  error?: string;
}) {
  const stepBy = (delta: number) => {
    const current = parseDecimal(value);
    const next = current === null ? Math.max(min, delta) : Math.max(min, current + delta);
    onChange(toDecimalInput(next));
  };
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-space-xs">
      <label htmlFor={id} className="font-mono text-label-tag uppercase text-secondary">
        [ {label} ]
      </label>
      <div
        className={`flex h-12 items-center justify-between border bg-surface-container-lowest ${
          error ? "border-error" : "border-surface-container-high"
        }`}
      >
        <button
          type="button"
          aria-label={`Mindre ${label.toLowerCase()}`}
          onClick={() => stepBy(-step)}
          className="flex size-11 shrink-0 select-none items-center justify-center text-body-lg text-primary hover:bg-surface-container"
        >
          −
        </button>
        <input
          id={id}
          name={name}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="w-full min-w-0 bg-transparent text-center font-mono text-body-lg text-primary placeholder:text-outline-variant focus:outline-none"
          placeholder="–"
        />
        <button
          type="button"
          aria-label={`Mere ${label.toLowerCase()}`}
          onClick={() => stepBy(step)}
          className="flex size-11 shrink-0 select-none items-center justify-center text-body-lg text-primary hover:bg-surface-container"
        >
          +
        </button>
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} className="font-mono text-caption-mono text-error">
      {children}
    </p>
  );
}
