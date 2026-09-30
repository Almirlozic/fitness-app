import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/app/components/AuthShell";
import { SetPasswordForm } from "@/app/components/SetPasswordForm";
import { getUser } from "@/lib/auth";

export const metadata: Metadata = { title: "FORM – Vælg adgangskode" };

// Kræver den session, som /auth/confirm opretter ud fra linket i mailen
export default async function SetPasswordPage() {
  const user = await getUser();
  if (!user) redirect("/login?besked=udloebet");

  return (
    <AuthShell
      title="Vælg adgangskode"
      description={`Vælg den adgangskode, du vil logge ind med som ${user.email}.`}
    >
      <SetPasswordForm />
    </AuthShell>
  );
}
