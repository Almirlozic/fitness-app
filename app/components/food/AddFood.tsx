"use client";

import { useState } from "react";
import type { Meal } from "@/lib/food";
import type { FoodChoice } from "@/lib/food-types";
import { FormMessage } from "../TextField";
import { BarcodeScanner } from "./BarcodeScanner";
import { CustomFoodForm } from "./CustomFoodForm";
import { FoodPortionForm } from "./FoodPortionForm";
import { FoodSearch } from "./FoodSearch";

type Tab = "search" | "scan" | "create";
const TABS: { key: Tab; label: string }[] = [
  { key: "search", label: "Søg" },
  { key: "scan", label: "Scan" },
  { key: "create", label: "Opret" },
];

type Lookup =
  | { status: "idle" }
  | { status: "loading"; code: string }
  | { status: "not_found"; code: string }
  | { status: "error"; message: string };

type BarcodeResponse =
  | { status: "found" | "incomplete"; food: FoodChoice }
  | { status: "not_found" }
  | { error: string };

export function AddFood({
  date,
  initialMeal,
  recent,
  own,
}: {
  date: string;
  initialMeal: Meal;
  recent: FoodChoice[];
  own: FoodChoice[];
}) {
  const [tab, setTab] = useState<Tab>("search");
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [selected, setSelected] = useState<FoodChoice | null>(null);
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" });
  const [createBarcode, setCreateBarcode] = useState("");
  // Ny key genstarter scanneren efter "Scan igen"
  const [scanRun, setScanRun] = useState(0);

  async function lookUpBarcode(code: string) {
    setLookup({ status: "loading", code });
    try {
      const res = await fetch(`/api/foods/barcode/${encodeURIComponent(code)}`);
      const data = (await res.json()) as BarcodeResponse;
      if ("error" in data) return setLookup({ status: "error", message: data.error });
      if (data.status === "not_found") return setLookup({ status: "not_found", code });
      setLookup({ status: "idle" });
      setSelected(data.food);
    } catch {
      setLookup({
        status: "error",
        message: "Kunne ikke hente fra Open Food Facts – prøv igen eller opret fødevaren selv",
      });
    }
  }

  function scanAgain() {
    setLookup({ status: "idle" });
    setScanRun((n) => n + 1);
  }

  if (selected) {
    return (
      <FoodPortionForm
        // Ny formular for hver vare, så gram og udfyldte tal nulstilles
        key={`${selected.id ?? selected.barcode ?? selected.name}`}
        food={selected}
        date={date}
        meal={meal}
        onMealChange={setMeal}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <div role="tablist" aria-label="Tilføj mad" className="mb-space-lg grid grid-cols-3 border border-primary">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              setLookup({ status: "idle" });
            }}
            className={`min-h-11 text-label-caps uppercase tracking-widest transition-colors ${
              tab === t.key ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "search" && <FoodSearch recent={recent} own={own} onSelect={setSelected} />}

      {tab === "scan" && (
        <div role="tabpanel">
          {lookup.status === "idle" && <BarcodeScanner key={scanRun} onDetected={lookUpBarcode} />}

          {lookup.status === "loading" && (
            <p role="status" className="py-space-xl text-center font-mono text-caption-mono uppercase text-secondary">
              Slår {lookup.code} op …
            </p>
          )}

          {lookup.status === "not_found" && (
            <div className="flex flex-col gap-space-md">
              <FormMessage status="info">
                Stregkoden {lookup.code} findes ikke i Open Food Facts. Opret fødevaren selv – så
                kan du scanne den næste gang.
              </FormMessage>
              <button
                type="button"
                onClick={() => {
                  setCreateBarcode(lookup.code);
                  setTab("create");
                  setLookup({ status: "idle" });
                }}
                className="min-h-12 bg-primary text-label-caps uppercase tracking-widest text-on-primary"
              >
                [ Opret med stregkoden ]
              </button>
            </div>
          )}

          {lookup.status === "error" && <FormMessage status="error">{lookup.message}</FormMessage>}

          {(lookup.status === "not_found" || lookup.status === "error") && (
            <button
              type="button"
              onClick={scanAgain}
              className="mt-space-md min-h-11 w-full border border-primary text-label-caps uppercase tracking-widest text-primary"
            >
              [ Scan igen ]
            </button>
          )}
        </div>
      )}

      {tab === "create" && (
        <div role="tabpanel">
          <CustomFoodForm key={createBarcode} initialBarcode={createBarcode} onCreated={setSelected} />
        </div>
      )}
    </div>
  );
}
