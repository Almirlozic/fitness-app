"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-space-md px-margin py-space-2xl">
      <h1 className="text-headline-sm uppercase text-primary">Kunne ikke hente dine data</h1>
      <p className="text-body-md text-secondary">
        Tjek din forbindelse og prøv igen. Sker det hver gang, så tjek at Supabase-nøglerne i
        .env.local er sat, og at migrationen er kørt.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="min-h-12 self-start bg-primary px-space-lg text-label-caps uppercase tracking-widest text-on-primary"
      >
        [ Prøv igen ]
      </button>
    </main>
  );
}
