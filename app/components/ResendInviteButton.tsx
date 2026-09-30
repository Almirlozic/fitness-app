"use client";

import { useActionState } from "react";
import { type FormState, inviteUser } from "@/app/auth-actions";

export function ResendInviteButton({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState<"email">, FormData>(inviteUser, {
    status: "idle",
  });

  return (
    <form action={action} className="flex flex-col items-end">
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={pending || state.status === "success"}
        className="min-h-11 px-space-xs font-mono text-caption-mono uppercase text-primary underline underline-offset-2 hover:text-secondary disabled:no-underline disabled:opacity-60"
      >
        {pending ? "Sender …" : state.status === "success" ? "Sendt" : "[ Send igen ]"}
      </button>
      {state.status === "error" && (
        <span role="alert" className="font-mono text-caption-mono text-error">
          {state.message}
        </span>
      )}
    </form>
  );
}
