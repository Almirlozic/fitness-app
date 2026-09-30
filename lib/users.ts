import "server-only";
import { createAdminClient } from "./supabase/admin";

export type AppUser = {
  id: string;
  email: string;
  /** Inviteret, men har ikke valgt adgangskode endnu */
  pending: boolean;
  invitedAt: string | null;
  lastSignInAt: string | null;
};

/** Alle brugere i projektet, nyeste først. Kræver service role (kun admin-sider). */
export async function listAppUsers(): Promise<AppUser[]> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error(`Kunne ikke hente brugere: ${error.message}`);

  return data.users
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(uden e-mail)",
      pending: !u.email_confirmed_at,
      invitedAt: u.invited_at ?? null,
      lastSignInAt: u.last_sign_in_at ?? null,
    }))
    .sort((a, b) => (b.invitedAt ?? "").localeCompare(a.invitedAt ?? ""));
}
