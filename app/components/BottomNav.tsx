import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { AccountIcon, GridIcon, TrendIcon } from "./Icons";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const items: NavItem[] = [
  { href: "/", label: "Overblik", Icon: GridIcon },
  { href: "/progression", label: "Progression", Icon: TrendIcon },
  { href: "/profil", label: "Profil", Icon: AccountIcon },
];

export function BottomNav({ activeHref }: { activeHref?: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <ul className="mx-auto flex h-16 max-w-2xl items-center justify-around px-space-xs">
        {items.map(({ href, label, Icon }) => {
          const active = href === activeHref;
          return (
            <li key={href} className="flex h-full flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 flex-1 flex-col items-center justify-center transition-colors ${
                  active
                    ? "font-bold text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon />
                <span className="mt-space-xs font-mono text-label-tag uppercase tracking-wider">
                  [{label}]
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
