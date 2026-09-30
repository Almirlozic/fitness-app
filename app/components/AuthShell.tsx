import Image from "next/image";
import type { ReactNode } from "react";

/** Enkel ramme til login-sider: logo, titel og indhold – ingen menu */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-margin pt-[calc(env(safe-area-inset-top)+2rem)] pb-space-xl">
      <div className="mb-space-2xl flex items-center gap-space-sm">
        <Image src="/form-logo.png" alt="" width={32} height={32} priority />
        <span className="text-label-caps uppercase tracking-widest text-primary">Form</span>
      </div>
      <h1 className="text-display-hero-mobile uppercase leading-none tracking-tighter text-primary">
        {title}
      </h1>
      {description && (
        <p className="mt-space-md leading-relaxed text-secondary">{description}</p>
      )}
      <div className="mt-space-xl">{children}</div>
    </main>
  );
}
