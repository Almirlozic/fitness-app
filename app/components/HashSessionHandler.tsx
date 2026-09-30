"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Læser login-data fra #-delen af adressen (Supabases standardlinks) og gemmer
 * sessionen i cookies, så serveren kan se den. Sender derefter videre til
 * "Vælg adgangskode" ved invitationer og nulstilling.
 */
export function HashSessionHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    const go = (path: string) => window.location.replace(path);

    if (!accessToken || !refreshToken) {
      go("/login?besked=udloebet");
      return;
    }

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) go("/login?besked=udloebet");
        else go(type === "invite" || type === "recovery" ? "/auth/set-password" : "/");
      });
  }, []);

  return (
    <p role="status" className="font-mono text-caption-mono uppercase text-secondary">
      Logger ind …
    </p>
  );
}
