import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { getProfile, hasCompletedOnboarding } from "@/lib/profile";

/**
 * Fælles layout for appens beskyttede sider. Proxy'en sikrer allerede login;
 * her sendes brugere, der ikke har gennemført onboarding, til /onboarding.
 * Tjekket ligger her og ikke i proxy'en, så der ikke laves et databasekald
 * på hver request (layouts genrenderes ikke ved navigation mellem siderne).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  if (!hasCompletedOnboarding(await getProfile())) redirect("/onboarding");
  return children;
}
