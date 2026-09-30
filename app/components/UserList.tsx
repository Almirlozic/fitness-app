import type { AppUser } from "@/lib/users";
import { formatDate } from "@/lib/format";
import { ResendInviteButton } from "./ResendInviteButton";

export function UserList({ users, currentEmail }: { users: AppUser[]; currentEmail?: string }) {
  const pendingCount = users.filter((u) => u.pending).length;

  return (
    <section className="mt-space-xl" aria-labelledby="users-heading">
      <div className="mb-space-xs flex items-center justify-between gap-space-md border-b border-primary pb-space-xs">
        <h2 id="users-heading" className="text-label-caps uppercase tracking-widest text-primary">
          [ Brugere ]
        </h2>
        <span className="font-mono text-caption-mono uppercase text-secondary">
          [ {users.length} i alt · {pendingCount} venter ]
        </span>
      </div>

      <ul className="divide-y divide-surface-container-high">
        {users.map((user) => (
          <li key={user.id} className="flex items-center justify-between gap-space-md py-space-sm">
            <div className="min-w-0">
              <p className="truncate text-body-md text-primary">
                {user.email}
                {user.email === currentEmail && (
                  <span className="ml-space-xs font-mono text-caption-mono text-secondary">(dig)</span>
                )}
              </p>
              <p className="font-mono text-caption-mono uppercase text-secondary">
                {user.pending
                  ? `Inviteret${user.invitedAt ? ` ${formatDate(user.invitedAt)}` : ""} · venter`
                  : user.lastSignInAt
                    ? `Aktiv · sidst logget ind ${formatDate(user.lastSignInAt)}`
                    : "Aktiv"}
              </p>
            </div>
            {user.pending ? (
              <ResendInviteButton email={user.email} />
            ) : (
              <span className="shrink-0 bg-surface-container px-1.5 py-0.5 font-mono text-caption-mono font-bold uppercase text-primary">
                Aktiv
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
