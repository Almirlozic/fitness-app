"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { deleteCustomFood } from "@/app/(app)/kost/actions";
import { type FoodChoice, missingNutrients } from "@/lib/food-types";
import { formatNumber } from "@/lib/format";
import { DeleteButton } from "../DeleteButton";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 400;

type OffResult = { query: string; items: FoodChoice[]; error?: string };

function FoodRow({
  food,
  onSelect,
  deletable = false,
}: {
  food: FoodChoice;
  onSelect: (f: FoodChoice) => void;
  /** Egne fødevarer kan slettes (fx hvis tallene er tastet forkert) */
  deletable?: boolean;
}) {
  const incomplete = missingNutrients(food).length > 0;
  return (
    <li className="flex items-center gap-space-xs">
      <button
        type="button"
        onClick={() => onSelect(food)}
        className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-space-md py-space-sm text-left hover:bg-sand/60"
      >
        <span className="min-w-0">
          <span className="block truncate font-inter text-[14px] text-navy">{food.name}</span>
          {food.brand && (
            <span className="block truncate font-inter text-[10px] text-navy/70 uppercase">
              {food.brand}
            </span>
          )}
        </span>
        <span
          className={`shrink-0 font-inter text-[10px] uppercase ${incomplete ? "text-error" : "text-navy/70"}`}
        >
          {food.kcal_100g === null
            ? "mangler tal"
            : `${formatNumber(Math.round(food.kcal_100g))} kcal/100 ${food.unit}`}
        </span>
      </button>
      {deletable && food.id && (
        <DeleteButton
          onDelete={deleteCustomFood.bind(null, food.id)}
          label="Slet"
          confirmLabel="Slet?"
          ariaLabel={`Slet fødevaren ${food.name}`}
          className="shrink-0 px-space-sm text-caption-mono"
        />
      )}
    </li>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-space-md">
      <h3 className="border-b-[0.5px] border-navy pb-space-xs font-serif text-[10px] text-navy uppercase">
        [ {title} ]
      </h3>
      <ul className="divide-y divide-navy/15">{children}</ul>
    </section>
  );
}

export function FoodSearch({
  recent,
  own,
  onSelect,
  onScan,
  onCreate,
  idleContent,
}: {
  recent: FoodChoice[];
  own: FoodChoice[];
  onSelect: (food: FoodChoice) => void;
  /** Scanner-ikonet ved siden af søgefeltet */
  onScan: () => void;
  /** "Opret egen fødevare" nederst i resultaterne */
  onCreate: () => void;
  /** Vises, når man ikke søger (dagligt indtag og måltidets mad) */
  idleContent: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [off, setOff] = useState<OffResult>({ query: "", items: [] });
  const q = query.trim().toLowerCase();
  const searching = q.length >= MIN_CHARS;

  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { items?: FoodChoice[]; error?: string };
        setOff({ query: q, items: data.items ?? [], error: res.ok ? undefined : data.error });
      } catch {
        if (!controller.signal.aborted) {
          setOff({
            query: q,
            items: [],
            error: "Kunne ikke hente fra Open Food Facts – prøv igen eller opret fødevaren selv",
          });
        }
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, searching]);

  const matches = (f: FoodChoice) =>
    f.name.toLowerCase().includes(q) || (f.brand ?? "").toLowerCase().includes(q);
  const ownMatches = searching ? own.filter(matches) : own.slice(0, 10);
  const recentMatches = searching ? recent.filter(matches) : recent;
  const loading = searching && off.query !== q;
  // Undgå dubletter: OFF-varer, der allerede står under Seneste/Mine
  const shownBarcodes = new Set([...ownMatches, ...recentMatches].map((f) => f.barcode).filter(Boolean));
  const offItems = off.query === q ? off.items.filter((f) => !shownBarcodes.has(f.barcode)) : [];

  // Resultaterne vises, når man trykker i feltet eller har skrevet noget
  const showResults = focused || query.trim().length > 0;

  return (
    <div>
      {/* Søgefelt + scanner fra designet */}
      <div className="flex items-center gap-[20px]">
        <label htmlFor="food-search" className="sr-only">
          Søg efter mad, måltid eller brand
        </label>
        <input
          id="food-search"
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="MAD, MÅLTID ELLER BRAND"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          // Lille forsinkelse, så et tryk på et resultat når at registreres
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className="h-8 min-w-0 flex-1 rounded-[5px] border-[0.5px] border-navy bg-cream px-[10px] font-inter text-[16px] text-navy placeholder:font-serif placeholder:text-[10px] placeholder:text-navy/70 focus:outline-2 focus:outline-offset-1 focus:outline-navy"
        />
        <button
          type="button"
          onClick={onScan}
          aria-label="Scan stregkode"
          className="-m-[6px] flex size-11 shrink-0 items-center justify-center"
        >
          <Image src="/design/barcode-scanner.svg" alt="" width={32} height={32} />
        </button>
      </div>

      {!showResults && <div className="mt-[22px]">{idleContent}</div>}

      {showResults && (
        <div className="mt-[22px]">
          {recentMatches.length > 0 && (
            <Group title="Seneste">
              {recentMatches.map((f, i) => (
                <FoodRow key={`r-${f.id ?? f.name}-${i}`} food={f} onSelect={onSelect} />
              ))}
            </Group>
          )}

          {ownMatches.length > 0 && (
            <Group title="Mine fødevarer">
              {ownMatches.map((f) => (
                <FoodRow key={`o-${f.id}`} food={f} onSelect={onSelect} deletable />
              ))}
            </Group>
          )}

          {searching && (
            <Group title="Open Food Facts">
              {loading && <li className="py-space-sm font-inter text-[12px] text-navy/70">Søger …</li>}
              {!loading && off.error && (
                <li role="alert" className="py-space-sm font-inter text-[12px] text-error">
                  {off.error}
                </li>
              )}
              {!loading && !off.error && offItems.length === 0 && (
                <li className="py-space-sm font-inter text-[12px] text-navy/70">
                  Ingen resultater – prøv et andet ord, eller opret fødevaren selv
                </li>
              )}
              {offItems.map((f) => (
                <FoodRow key={`off-${f.barcode}`} food={f} onSelect={onSelect} />
              ))}
            </Group>
          )}

          {!searching && recent.length === 0 && own.length === 0 && (
            <p className="font-inter text-[12px] text-navy/70">Skriv mindst 2 bogstaver for at søge</p>
          )}

          <button
            type="button"
            onClick={onCreate}
            className="mt-[8px] flex min-h-11 items-center font-serif text-[12px] text-navy uppercase underline underline-offset-[3px]"
          >
            + Kan du ikke finde den? Opret egen fødevare
          </button>
        </div>
      )}
    </div>
  );
}
