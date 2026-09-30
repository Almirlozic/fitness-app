"use client";

import { useActionState } from "react";
import { type FormState, inviteUser } from "@/app/auth-actions";
import { FormMessage, SubmitButton, TextField } from "./TextField";

export function InviteForm() {
  const [state, action, pending] = useActionState<FormState<"email">, FormData>(inviteUser, {
    status: "idle",
  });

  return (
    <form
      action={action}
      noValidate
      className="flex flex-col gap-space-md border-t-2 border-primary bg-surface-container-low p-space-md"
    >
      {state.status === "success" && <FormMessage status="success">{state.message}</FormMessage>}
      {state.status === "error" && state.message && (
        <FormMessage status="error">{state.message}</FormMessage>
      )}
      <TextField
        // Ny key efter succes tømmer feltet
        key={state.status === "success" ? state.message : "invite"}
        id="invite-email"
        name="email"
        label="E-mail på den, du vil invitere"
        type="email"
        autoComplete="off"
        inputMode="email"
        autoCapitalize="none"
        defaultValue={state.status === "error" ? state.email : undefined}
        error={state.fieldErrors?.email}
      />
      <SubmitButton pending={pending}>Send invitation</SubmitButton>
    </form>
  );
}
