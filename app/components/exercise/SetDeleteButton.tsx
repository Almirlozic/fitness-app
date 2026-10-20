"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { deleteSet } from "@/app/actions";

/** × fra designet: første tryk bliver til "Slet?", andet tryk sletter sættet */
export function SetDeleteButton({ setId, label }: { setId: string; label: string }) {
  const [confirming, setConfirming] = useState(false);
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
      onClick={() => {
        if (!confirming) return setConfirming(true);
        startTransition(async () => {
          await deleteSet(setId);
          setConfirming(false);
        });
      }}
      aria-label={confirming ? `Bekræft: slet ${label}` : `Slet ${label}`}
      className="-my-[10px] -mr-[10px] flex h-11 min-w-11 shrink-0 items-center justify-center disabled:opacity-60"
    >
      {confirming || pending ? (
        <span className="rounded-full bg-error px-[10px] py-[5px] font-inter text-[10px] font-bold text-cream">
          {pending ? "Sletter …" : "Slet?"}
        </span>
      ) : (
        <span className="flex size-6 items-center justify-center rounded-full bg-navy">
          <Image src="/design/plus.svg" alt="" width={8} height={8} className="rotate-45" />
        </span>
      )}
    </button>
  );
}
