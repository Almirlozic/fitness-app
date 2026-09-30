import type { Metadata } from "next";
import { AuthShell } from "@/app/components/AuthShell";
import { ForgotPasswordForm } from "@/app/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "FORM – Glemt adgangskode" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Glemt adgangskode"
      description="Skriv din e-mail, så sender vi et link, hvor du kan vælge en ny adgangskode."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
