import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/auth-actions";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNav } from "@/app/components/BottomNav";
import { PageHero } from "@/app/components/PageHero";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "FORM – Profil" };

export default async function ProfilPage() {
  const user = await requireUser();

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-margin pt-16 pb-24 md:px-margin-tablet">
        <PageHero title="Profil" description="Din konto og adgang." />

        <dl className="mb-space-xl grid gap-space-md border border-surface-container-high bg-surface-container-lowest p-space-md">
          <div>
            <dt className="font-mono text-caption-mono uppercase text-secondary">E-mail</dt>
            <dd className="mt-space-xs break-all text-body-lg text-primary">{user.email}</dd>
          </div>
          <div>
            <dt className="font-mono text-caption-mono uppercase text-secondary">Medlem siden</dt>
            <dd className="mt-space-xs font-mono text-body-md text-primary">
              {formatDate(user.created_at)}
            </dd>
          </div>
        </dl>


        <div className="flex flex-col gap-space-sm">
          <Link
            href="/inviter"
            className="flex h-12 w-full items-center justify-center border border-primary bg-surface-container-lowest text-label-caps uppercase tracking-widest text-primary transition-colors hover:bg-surface-container"
          >
            [ + Inviter bruger ]
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center bg-primary text-label-caps uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container"
            >
              [ Log ud ]
            </button>
          </form>
        </div>
      </main>
      <BottomNav activeHref="/profil" />
    </>
  );
}
