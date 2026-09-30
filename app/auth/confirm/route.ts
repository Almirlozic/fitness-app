import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Linket i invitations- og nulstillingsmails lander her. To formater virker:
 *  1. Egen mailskabelon: /auth/confirm?token_hash=…&type=invite|recovery
 *     → verificeres her på serveren.
 *  2. Supabases standardskabelon ({{ .ConfirmationURL }}): Supabase har allerede
 *     verificeret linket og sender login-data efter # i adressen, som serveren
 *     ikke kan se → videre til /auth/callback, der læser det i browseren.
 *     Browseren beholder #-delen ved redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const to = (pathname: string, search = "") => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    return url;
  };

  const supabase = await createClient();
  // Er en anden bruger logget ind i browseren (fx admin, der tester sit eget
  // invitationslink), logges vedkommende ud – kun i denne browser.
  await supabase.auth.signOut({ scope: "local" });

  if (!tokenHash) return NextResponse.redirect(to("/auth/callback"));

  if (type === "invite" || type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(to("/auth/set-password"));
    console.error("verifyOtp", error.code, error.message);
  }

  return NextResponse.redirect(to("/login", "besked=udloebet"));
}
