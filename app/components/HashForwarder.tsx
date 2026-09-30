"use client";

import { useEffect } from "react";

/**
 * Lander et Supabase-link på en anden side end /auth/confirm (fx fordi
 * redirect-URL'en ikke er godkendt i Supabase, så den falder tilbage til
 * Site URL), ligger login-data stadig efter # i adressen. Send dem videre
 * til /auth/callback, som gemmer sessionen.
 */
export function HashForwarder() {
  useEffect(() => {
    const hash = window.location.hash;
    if (/[#&](access_token|error_code)=/.test(hash)) {
      window.location.replace(`/auth/callback${hash}`);
    }
  }, []);
  return null;
}
