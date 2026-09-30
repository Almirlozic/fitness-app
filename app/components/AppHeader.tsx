import Image from "next/image";
import Link from "next/link";
import { PersonIcon } from "./Icons";

export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/80 pt-[env(safe-area-inset-top)] shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-margin md:px-margin-tablet">
        <Link href="/" className="flex items-center gap-space-sm">
          <Image src="/form-logo.png" alt="" width={32} height={32} priority />
          <span className="text-label-caps uppercase tracking-widest text-primary">
            Form
          </span>
        </Link>
        <Link
          href="/profil"
          aria-label="Profil"
          className="flex size-8 items-center justify-center rounded-full bg-primary text-on-primary"
        >
          <PersonIcon width={18} height={18} />
        </Link>
      </div>
    </header>
  );
}
