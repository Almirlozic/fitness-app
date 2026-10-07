"use client";

import { useEffect, useState } from "react";
import { deleteCustomFood } from "@/app/(app)/kost/actions";
import { type FoodChoice, missingNutrients } from "@/lib/food-types";
import { formatNumber } from "@/lib/format";
import { DeleteButton } from "../DeleteButton";
import { TextField } from "../TextField";

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
        className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-space-md py-space-sm text-left hover:bg-surface-container-low"
      >
        <span className="min-w-0">
          <span className="block truncate text-body-md text-primary">{food.name}</span>
          {food.brand && (
            <span className="block truncate font-mono text-caption-mono uppercase text-secondary">
              {food.brand}
            </span>
          )}
        </span>
        <span
          className={`shrink-0 font-mono text-caption-mono uppercase ${incomplete ? "text-error" : "text-secondary"}`}
        >
          {food.kcal_100g === null
            ? "mangler tal"
            : `${formatNumber(Math.round(food.kcal_100g))} kcal/100 g`}
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
      <h3 className="border-b border-primary pb-space-xs font-mono text-caption-mono uppercase text-secondary">
        [ {title} ]
      </h3>
      <ul className="divide-y divide-surface-container-high">{children}</ul>
    </section>
  );
}

export function FoodSearch({
  recent,
  own,
  onSelect,
}: {
  recent: FoodChoice[];
  own: FoodChoice[];
  onSelect: (food: FoodChoice) => void;
}) {
  const [query, setQuery] = useState("");
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

  return (
    <div>
      <TextField
        id="food-search"
        label="Søg efter fødevare"
        type="search"
        autoComplete="off"
        enterKeyHint="search"
        placeholder="fx skyr, havregryn, banan"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-space-lg">
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
            {loading && (
              <li className="py-space-sm font-mono text-caption-mono uppercase text-secondary">Søger …</li>
            )}
            {!loading && off.error && (
              <li role="alert" className="py-space-sm font-mono text-caption-mono text-error">
                {off.error}
              </li>
            )}
            {!loading && !off.error && offItems.length === 0 && (
              <li className="py-space-sm font-mono text-caption-mono uppercase text-secondary">
                Ingen resultater – prøv et andet ord, eller opret fødevaren selv
              </li>
            )}
            {offItems.map((f) => (
              <FoodRow key={`off-${f.barcode}`} food={f} onSelect={onSelect} />
            ))}
          </Group>
        )}

        {!searching && recent.length === 0 && own.length === 0 && (
          <p className="font-mono text-caption-mono uppercase text-secondary">
            Skriv mindst 2 bogstaver for at søge
          </p>
        )}
      </div>
    </div>
  );
}
