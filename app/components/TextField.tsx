import type { InputHTMLAttributes } from "react";
import { FieldError } from "./Stepper";

export function TextField({
  id,
  label,
  error,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) {
  return (
    <div className="flex flex-col gap-space-xs">
      <label htmlFor={id} className="font-mono text-label-tag uppercase text-secondary">
        [ {label} ]
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-12 w-full border bg-surface-container-lowest px-space-sm text-body-lg text-primary placeholder:text-outline-variant focus:border-primary focus:outline-none ${
          error ? "border-error" : "border-surface-container-high"
        }`}
        {...input}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full items-center justify-center bg-primary px-space-md text-label-caps uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
    >
      {pending ? "[ Vent … ]" : `[ ${children} ]`}
    </button>
  );
}

export function FormMessage({
  status,
  children,
}: {
  status: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  const tone =
    status === "error"
      ? "border-error text-error"
      : status === "success"
        ? "border-primary text-primary"
        : "border-surface-container-high text-secondary";
  return (
    <p role={status === "error" ? "alert" : "status"} className={`border-l-2 py-space-xs pl-space-sm font-mono text-caption-mono uppercase ${tone}`}>
      {children}
    </p>
  );
}
