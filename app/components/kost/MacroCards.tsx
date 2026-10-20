import { formatNumber } from "@/lib/format";
import { fraction } from "@/lib/kost";

type Macro = { label: string; eaten: number; target: number };

/** De tre mørkeblå makro-kort fra designet: KULHYDRATER · FEDT · PROTEIN */
export function MacroCards({ macros }: { macros: Macro[] }) {
  return (
    <section aria-label="Makroer i dag" className="grid grid-cols-3 gap-[22px]">
      {macros.map(({ label, eaten, target }) => {
        const over = target > 0 && eaten > target;
        return (
          <div key={label} className="flex h-[74px] flex-col items-center bg-navy px-[10px] pt-[12px] font-serif text-cream">
            <p className="text-[10px] uppercase">{label}</p>
            <div className="mt-[5px] w-full max-w-[68px]">
              <p className="text-[8px] uppercase">
                {formatNumber(Math.round(eaten))} / {target > 0 ? formatNumber(target) : "–"} g
              </p>
              <div
                className="mt-[4px] h-[5px] w-full rounded-[10px] bg-[#d9d9d9]"
                role="progressbar"
                aria-label={`${label}: ${Math.round(eaten)} af ${target} gram`}
                aria-valuenow={Math.round(fraction(eaten, target) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`h-full rounded-[10px] ${over ? "bg-[#c0533f]" : "bg-[#417a27]"}`}
                  style={{ width: `${fraction(eaten, target) * 100}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
