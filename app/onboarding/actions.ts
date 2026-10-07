"use server";

import { redirect } from "next/navigation";
import { fieldErrors } from "@/lib/auth-schemas";
import { getUser } from "@/lib/auth";
import { type ProfileField, profileSchema } from "@/lib/profile-schema";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<ProfileField, string>>;
};

const FIELDS = Object.keys(profileSchema.shape) as ProfileField[];

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await getUser();
  if (!user) redirect("/login");

  const raw = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Tjek de markerede felter.",
      fieldErrors: fieldErrors<ProfileField>(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    ...parsed.data,
    onboarding_completed_at: new Date().toISOString(),
  });
  if (error) {
    console.error("completeOnboarding", error.code, error.message);
    return { status: "error", message: "Din profil kunne ikke gemmes. Prøv igen." };
  }

  redirect("/");
}
