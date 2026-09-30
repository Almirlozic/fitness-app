"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type FormState, forgotPassword } from "@/app/auth-actions";
import { FormMessage, SubmitButton, TextField } from "./TextField";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<FormState<"email">, FormData>(
    forgotPassword,
    { status: "idle" },
  );

  return (
    <form action={action} noValidate className="flex flex-col gap-space-md">
      {state.status === "success" && <FormMessage status="success">{state.message}</FormMessage>}
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
      <SubmitButton pending={pending}>Send link</SubmitButton>
      <Link
        href="/login"
        className="flex min-h-11 items-center justify-center font-mono text-caption-mono uppercase text-primary underline underline-offset-2"
      >
        Tilbage til login
      </Link>
    </form>
  );
}
