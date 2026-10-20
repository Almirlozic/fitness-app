import Link from "next/link";

const items = [
  { href: "/", label: "Overblik" },
  { href: "/progression", label: "Progression" },
  { href: "/kost", label: "Kost" },
  { href: "/profil", label: "Profil" },
];

/**
 * Bundmenuen fra Figma-designet: mørkeblå bjælke med lyse "[ LABEL ]"-felter.
 * Selve feltet er 27 px højt som i designet, men hele linket er mindst 44 px
 * (touch target).
 */
export function BottomNav({ activeHref }: { activeHref?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-navy pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex h-20 max-w-2xl items-center justify-between gap-space-sm px-5.75">
        {items.map(({ href, label }) => {
          const active = href === activeHref;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex min-h-11 items-center"
              >
                <span
                  className={`flex h-6.75 items-center bg-cream px-3 font-serif text-[10px] whitespace-nowrap text-navy uppercase transition-opacity group-hover:opacity-90 ${
                    active ? "underline decoration-1 underline-offset-[3px]" : ""
                  }`}
                >
                  [ {label} ]
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
