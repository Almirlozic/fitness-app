import "server-only";
import { redirect } from "next/navigation";
import { isAdminEmail } from "./auth-schemas";
import { createClient } from "./supabase/server";

/**
 * Den loggede bruger, valideret mod Supabase Auth (getUser, ikke getSession,
 * da getSession kun læser cookien uden at tjekke den).
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Til sider: send til /login, hvis man ikke er logget ind */
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export function isAdmin(email: string | undefined | null) {
  return isAdminEmail(email, process.env.ADMIN_EMAILS);
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
