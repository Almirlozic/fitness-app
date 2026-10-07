import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { OnboardingWizard } from "@/app/components/onboarding/OnboardingWizard";
import { requireUser } from "@/lib/auth";
import { todayIso } from "@/lib/format";
import { MAX_AGE } from "@/lib/profile-schema";
import { getProfile, hasCompletedOnboarding } from "@/lib/profile";

export const metadata: Metadata = { title: "FORM – Velkommen" };

// Kun for loggede brugere (proxy'en sender andre til /login), der ikke er færdige
export default async function OnboardingPage() {
  await requireUser();
  if (hasCompletedOnboarding(await getProfile())) redirect("/");

  const today = todayIso();
  const minBirthDate = `${Number(today.slice(0, 4)) - MAX_AGE}${today.slice(4)}`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-margin pt-[calc(env(safe-area-inset-top)+1rem)]">
      <div className="flex items-center gap-space-sm">
        <Image src="/form-logo.png" alt="" width={28} height={28} priority />
        <span className="text-label-caps uppercase tracking-widest text-primary">
          Form · Velkommen
        </span>
      </div>
      <OnboardingWizard today={today} minBirthDate={minBirthDate} />
    </main>
  );
}
