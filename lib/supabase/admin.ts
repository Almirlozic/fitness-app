import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Admin-klient med service role-nøglen. Omgår RLS og kan administrere brugere.
 * Må KUN bruges på serveren (server-only sikrer, at den aldrig havner i browseren),
 * og kun til ting, der kræver det – fx invitationer. Almindelige queries skal
 * bruge den loggede brugers klient i ./server.ts.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY mangler i .env.local");

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
