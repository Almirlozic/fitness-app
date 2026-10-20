"use client";

import { useRouter } from "next/navigation";

/** "TILBAGE" øverst til venstre i designet – går en side tilbage (ellers til forsiden) */
export function BackLink() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="-ml-[8px] flex min-h-11 items-center px-[8px] font-serif text-[10px] text-white uppercase"
    >
      Tilbage
    </button>
  );
}
