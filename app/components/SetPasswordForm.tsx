"use client";

import { useActionState } from "react";
import { type FormState, setPassword } from "@/app/auth-actions";
import { FormMessage, SubmitButton, TextField } from "./TextField";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState<FormState<"password" | "confirm">, FormData>(
    setPassword,
    { status: "idle" },
  );

  return (
    <form action={action} noValidate className="flex flex-col gap-space-md">
      {state.message && <FormMessage status="error">{state.message}</FormMessage>}
      <TextField
        id="password"
        name="password"
        label="Ny adgangskode"
        type="password"
        autoComplete="new-password"
        minLength={8}
        error={state.fieldErrors?.password}
      />
      <TextField
        id="confirm"
        name="confirm"
        label="Gentag adgangskode"
        type="password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirm}
      />
      <p className="font-mono text-caption-mono text-secondary">Mindst 8 tegn.</p>
      <SubmitButton pending={pending}>Gem adgangskode</SubmitButton>
    </form>
  );
}
