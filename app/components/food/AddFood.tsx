"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import type { Meal } from "@/lib/food";
import type { FoodChoice } from "@/lib/food-types";
import { BarcodeScanner } from "./BarcodeScanner";
import { CustomFoodForm } from "./CustomFoodForm";
import { FoodSearch } from "./FoodSearch";

/** Søg (standard) · Scan (scanner-ikonet) · Opret (link under søgeresultaterne) */
type Mode = "search" | "scan" | "create";

/**
 * Første side i "Tilføj mad" (Figma node 22:285): søg, scan eller opret en vare.
 * Når en vare er valgt, går man videre til "Vælg mængde" (/kost/tilfoej/vare).
 * `summary` er kortet med dagligt indtag og måltidets mad.
 */
export function AddFood({
  date,
  meal,
  recent,
  own,
  summary,
  initialMode = "search",
  initialBarcode = "",
}: {
  date: string;
  meal: Meal;
  recent: FoodChoice[];
  own: FoodChoice[];
  summary: ReactNode;
  initialMode?: Mode;
  initialBarcode?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);

  /** Videre til "Vælg mængde" – med varens id, stregkode eller den log, den kom fra */
  function open(ref: { id?: string | null; barcode?: string | null; logId?: string }) {
    const params = new URLSearchParams({ meal, dato: date });
    if (ref.id) params.set("id", ref.id);
    else if (ref.barcode) params.set("stregkode", ref.barcode);
    else if (ref.logId) params.set("log", ref.logId);
    else return;
    router.push(`/kost/tilfoej/vare?${params}`);
  }

  const backToSearch = (
    <button
      type="button"
      onClick={() => setMode("search")}
      className="mb-3 flex min-h-11 items-center font-serif text-[12px] text-navy uppercase underline underline-offset-[3px]"
    >
      ← Tilbage til søgning
    </button>
  );

  if (mode === "scan") {
    return (
      <div>
        {backToSearch}
        <BarcodeScanner onDetected={(code) => open({ barcode: code })} />
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div>
        {backToSearch}
        <CustomFoodForm initialBarcode={initialBarcode} onCreated={(food) => open({ id: food.id })} />
      </div>
    );
  }

  return (
    <FoodSearch
      recent={recent}
      own={own}
      onSelect={(food) => open({ id: food.id, barcode: food.barcode, logId: food.logId })}
      onScan={() => setMode("scan")}
      onCreate={() => setMode("create")}
      idleContent={summary}
    />
  );
}
