"use client";

import { useEffect, useState, useTransition } from "react";

/**
 * Sletteknap med bekræftelse i UI'et: første tryk skifter teksten til
 * "Slet?", andet tryk sletter. Nulstilles efter et par sekunder.
 */
export function DeleteButton({
  onDelete,
  label,
  confirmLabel,
  ariaLabel,
  className = "",
}: {
  onDelete: () => Promise<{ ok: boolean }>;
  label: string;
  confirmLabel: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={confirming ? undefined : ariaLabel}
      onClick={() => {
        if (!confirming) {
          setFailed(false);
          setConfirming(true);
          return;
        }
        startTransition(async () => {
          const { ok } = await onDelete();
          setConfirming(false);
          setFailed(!ok);
        });
      }}
      className={`min-h-11 font-mono uppercase text-error disabled:opacity-60 ${
        confirming ? "font-bold underline" : "hover:underline"
      } ${className}`}
    >
      {pending ? "Sletter …" : failed ? "Fejl – prøv igen" : confirming ? confirmLabel : label}
    </button>
  );
}
