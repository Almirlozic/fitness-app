import type { Metadata } from "next";
import { AuthShell } from "@/app/components/AuthShell";
import { HashSessionHandler } from "@/app/components/HashSessionHandler";

export const metadata: Metadata = { title: "FORM – Logger ind" };

export default function AuthCallbackPage() {
  return (
    <AuthShell title="Et øjeblik" description="Vi tjekker dit link …">
      <HashSessionHandler />
    </AuthShell>
  );
}
