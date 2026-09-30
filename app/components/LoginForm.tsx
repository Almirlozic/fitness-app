"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type FormState, login } from "@/app/auth-actions";
import { FormMessage, SubmitButton, TextField } from "./TextField";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<FormState<"email" | "password">, FormData>(
    login,
    { status: "idle" },
  );

  return (
    <form action={action} noValidate className="flex flex-col gap-space-md">
      {notice && state.status === "idle" && <FormMessage status="info">{notice}</FormMessage>}
      {state.message && <FormMessage status="error">{state.message}</FormMessage>}

      <TextField
        id="email"
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        defaultValue={state.email}
        error={state.fieldErrors?.email}
      />
      <TextField
        id="password"
        name="password"
        label="Adgangskode"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
      />

      <div className="-mt-space-xs flex justify-end">
        <Link
          href="/forgot-password"
          className="flex min-h-11 items-center font-mono text-caption-mono uppercase text-primary underline underline-offset-2 hover:text-secondary"
        >
          Glemt adgangskode?
        </Link>
      </div>

      <SubmitButton pending={pending}>Log ind</SubmitButton>

      <p className="mt-space-md text-center font-mono text-caption-mono uppercase text-secondary">
        Adgang kun via invitation
      </p>
    </form>
  );
}
