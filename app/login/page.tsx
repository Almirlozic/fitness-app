import type { Metadata } from "next";
import { AuthShell } from "@/app/components/AuthShell";
import { HashForwarder } from "@/app/components/HashForwarder";
import { LoginForm } from "@/app/components/LoginForm";

export const metadata: Metadata = { title: "FORM – Log ind" };

const NOTICES: Record<string, string> = {
  udloebet: "Linket er udløbet. Bed om en ny invitation.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { besked } = await searchParams;
  const notice = typeof besked === "string" ? NOTICES[besked] : undefined;

  return (
    <AuthShell title="Log ind" description="Log ind for at se og logge din træning.">
      <HashForwarder />
      <LoginForm notice={notice} />
    </AuthShell>
  );
}
