"use client";

import { useEffect, useId, useState } from "react";
import type { WgerExercise } from "@/app/api/exercises/search/route";
import { categoryFromWger, categoryLabel } from "@/lib/categories";
import { exerciseKey } from "@/lib/exercise-name";
import { formatLift } from "@/lib/format";
import { FieldError } from "./Stepper";

export type OwnExercise = {
  name: string;
  wgerExerciseId: number | null;
  lastWeightKg: number;
  lastReps: number;
};

export type ExerciseChoice = {
  name: string;
  wgerExerciseId: number | null;
  /** Sat, når det er en øvelse, jeg har logget før */
  own?: OwnExercise;
};

type Option = ExerciseChoice & { id: string; group: "own" | "wger" | "new"; detail?: string };

const MIN_CHARS = 2;
const DEBOUNCE_MS = 300;

/**
 * Søgefelt med forslag: først egne øvelser, derefter wger, og til sidst
 * mulighed for at bruge teksten som en ny øvelse.
 */
export function ExerciseSearch({
  value,
  onValueChange,
  onSelect,
  ownExercises,
  error,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSelect: (choice: ExerciseChoice) => void;
  ownExercises: OwnExercise[];
  error?: string;
}) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [wger, setWger] = useState<{ query: string; items: WgerExercise[] }>({
    query: "",
    items: [],
  });

  const query = exerciseKey(value);
  const searching = query.length >= MIN_CHARS;

  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/exercises/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const items = res.ok ? ((await res.json()) as WgerExercise[]) : [];
        setWger({ query, items });
      } catch {
        if (!controller.signal.aborted) setWger({ query, items: [] });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searching]);

  const loadingWger = searching && wger.query !== query;
  const options: Option[] = [];
  if (searching) {
    const ownMatches = ownExercises.filter((e) => exerciseKey(e.name).includes(query));
    const ownKeys = new Set(ownExercises.map((e) => exerciseKey(e.name)));
    for (const own of ownMatches.slice(0, 5)) {
      options.push({
        id: `own-${exerciseKey(own.name)}`,
        group: "own",
        name: own.name,
        wgerExerciseId: own.wgerExerciseId,
        own,
        detail: `Sidst: ${formatLift(own.lastWeightKg, own.lastReps)}`,
      });
    }
    if (!loadingWger) {
      for (const ex of wger.items) {
        if (ownKeys.has(exerciseKey(ex.name))) continue;
        const category = categoryFromWger(ex.category);
        options.push({
          id: `wger-${ex.id}`,
          group: "wger",
          name: ex.name,
          wgerExerciseId: ex.id,
          detail: category ? categoryLabel(category) : ex.category,
        });
      }
    }
    if (!options.some((o) => exerciseKey(o.name) === query)) {
      options.push({
        id: "new",
        group: "new",
        name: value.trim(),
        wgerExerciseId: null,
      });
    }
  }

  const showList = open && searching;

  function choose(option: Option) {
    onSelect({
      name: option.name,
      wgerExerciseId: option.wgerExerciseId,
      own: option.own,
    });
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && active >= 0 && options[active]) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative flex flex-col gap-space-xs">
      <label htmlFor={`${listboxId}-input`} className="font-mono text-label-tag uppercase text-secondary">
        [ Øvelse ]
      </label>
      <input
        id={`${listboxId}-input`}
        name="exercise_name"
        type="text"
        role="combobox"
        autoComplete="off"
        autoCapitalize="words"
        enterKeyHint="next"
        placeholder="Søg fx incline press"
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listboxId}-${options[active]?.id}` : undefined}
        aria-invalid={error ? true : undefined}
        className={`h-12 w-full border bg-surface-container-lowest px-space-sm text-body-lg text-primary placeholder:text-outline-variant focus:border-primary focus:outline-none ${
          error ? "border-error" : "border-surface-container-high"
        }`}
      />
      {error && <FieldError>{error}</FieldError>}

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Forslag til øvelser"
          className="absolute top-full right-0 left-0 z-40 mt-px max-h-80 overflow-y-auto border border-primary bg-surface-container-lowest shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          {options.map((option, i) => {
            const firstInGroup = options[i - 1]?.group !== option.group;
            return (
              <li key={option.id} role="presentation">
                {firstInGroup && option.group !== "new" && (
                  <div className="border-b border-surface-container-high bg-surface-container-low px-space-sm py-space-xs font-mono text-caption-mono uppercase text-secondary">
                    {option.group === "own" ? "[ Mine øvelser ]" : "[ Fra wger ]"}
                  </div>
                )}
                <div
                  id={`${listboxId}-${option.id}`}
                  role="option"
                  aria-selected={i === active}
                  // mousedown i stedet for click, så feltet ikke mister fokus først
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(option);
                  }}
                  className={`flex min-h-11 cursor-pointer items-center justify-between gap-space-sm border-b border-surface-container-high px-space-sm py-space-xs last:border-b-0 ${
                    i === active ? "bg-surface-container" : "hover:bg-surface-container-low"
                  }`}
                >
                  {option.group === "new" ? (
                    <span className="font-mono text-label-tag uppercase text-primary">
                      [ + Brug “{option.name}” som ny øvelse ]
                    </span>
                  ) : (
                    <>
                      <span className="text-body-md text-primary">{option.name}</span>
                      {option.detail && (
                        <span className="shrink-0 font-mono text-caption-mono uppercase text-secondary">
                          {option.detail}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
          {loadingWger && (
            <li
              role="presentation"
              className="px-space-sm py-space-sm font-mono text-caption-mono uppercase text-secondary"
            >
              Søger i wger…
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
