import "server-only";
import { createClient } from "./supabase/server";
import type { ProfileRow } from "./supabase/database.types";

/** Den loggede brugers profil (RLS sikrer, at det kun er ens egen). null hvis ingen. */
export async function getProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw new Error(`Kunne ikke hente profil: ${error.message}`);
  return data;
}

export function hasCompletedOnboarding(profile: ProfileRow | null) {
  return Boolean(profile?.onboarding_completed_at);
}
