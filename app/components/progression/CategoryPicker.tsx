"use client";

import { useRouter } from "next/navigation";

export type CategoryOption = { key: string; label: string; count: number };

/**
 * "[ ALLE ØVELSER ]" fra designet: kategorifilteret. Den synlige tekst er designets;
 * den rigtige <select> ligger usynligt ovenpå (16 px, så iPhone ikke zoomer).
 */
export function CategoryPicker({
  options,
  active,
}: {
  options: CategoryOption[];
  active: string;
}) {
  const router = useRouter();
  const current = options.find((o) => o.key === active) ?? options[0];

  return (
    // Teksten fylder 17 px som i designet; den usynlige select stikker ud, så
    // touch-området er 44 px uden at skubbe layoutet
    <div className="relative focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy">
      <span aria-hidden className="block text-[14px] leading-[17px] whitespace-nowrap uppercase">
        [ {current.key === "alle" ? "Alle øvelser" : current.label} ]
      </span>
      <label htmlFor="category-picker" className="sr-only">
        Filtrér efter muskelgruppe
      </label>
      <select
        id="category-picker"
        value={current.key}
        onChange={(e) => {
          const key = e.target.value;
          router.replace(key === "alle" ? "/progression" : `/progression?kategori=${key}`, {
            scroll: false,
          });
        }}
        className="absolute inset-x-0 -inset-y-[14px] cursor-pointer appearance-none opacity-0 text-[16px]"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key} disabled={o.count === 0 && o.key !== active}>
            {o.key === "alle" ? "Alle øvelser" : o.label} ({o.count})
          </option>
        ))}
      </select>
    </div>
  );
}
