import Link from "next/link";

export type FilterOption = { key: string; label: string; count: number };

/** Filterknapper som links (?kategori=…), så filteret virker uden JavaScript */
export function CategoryFilter({
  options,
  active,
}: {
  options: FilterOption[];
  active: string;
}) {
  return (
    <nav aria-label="Filtrér efter muskelgruppe" className="mb-space-lg">
      <ul className="flex flex-wrap gap-space-sm">
        {options.map((option) => {
          const isActive = option.key === active;
          return (
            <li key={option.key}>
              <Link
                href={option.key === "alle" ? "/progression" : `/progression?kategori=${option.key}`}
                aria-current={isActive ? "page" : undefined}
                scroll={false}
                className={`flex min-h-11 items-center gap-space-xs border px-space-md font-mono text-label-tag uppercase transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-on-primary"
                    : option.count === 0
                      ? "border-surface-container-high bg-transparent text-secondary hover:border-primary"
                      : "border-surface-container-high bg-surface-container-lowest text-primary hover:border-primary"
                }`}
              >
                {option.label}
                <span className={isActive ? "text-on-primary-container" : "text-secondary"}>
                  {option.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
