import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { BottomNav } from "@/app/components/BottomNav";
import { InviteForm } from "@/app/components/InviteForm";
import { PageHero } from "@/app/components/PageHero";
import { FormMessage } from "@/app/components/TextField";
import { UserList } from "@/app/components/UserList";
import { isAdmin, requireUser } from "@/lib/auth";
import { type AppUser, listAppUsers } from "@/lib/users";

export const metadata: Metadata = { title: "FORM – Inviter bruger" };

export default async function InvitePage() {
  // Alle loggede brugere kan invitere. Brugerlisten (alle e-mails) vises kun for admin.
  const user = await requireUser();
  const admin = isAdmin(user.email);

  const configured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  let users: AppUser[] = [];
  let usersError = false;
  if (configured && admin) {
    try {
      users = await listAppUsers();
    } catch (error) {
      console.error(error);
      usersError = true;
    }
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-margin pt-16 pb-24 md:px-margin-tablet">
        <PageHero
          title="Inviter"
          description="Personen får en mail med et link, hvor de vælger deres adgangskode. Man kan ikke oprette sig selv."
        />
        {configured ? (
          <InviteForm />
        ) : (
          <FormMessage status="error">
            SUPABASE_SERVICE_ROLE_KEY mangler i .env.local. Indsæt den (Supabase → Project Settings →
            API → service_role) og genstart npm run dev.
          </FormMessage>
        )}
        {usersError && <FormMessage status="error">Brugerlisten kunne ikke hentes.</FormMessage>}
        {users.length > 0 && <UserList users={users} currentEmail={user.email} />}
        <Link
          href="/profil"
          className="mt-space-xl flex min-h-11 items-center justify-center font-mono text-caption-mono uppercase text-primary underline underline-offset-2"
        >
          Tilbage til profil
        </Link>
      </main>
      <BottomNav activeHref="/profil" />
    </>
  );
}
