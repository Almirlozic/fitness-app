import { AuthShell } from "./AuthShell";

/** Loading til login-siderne – uden appens menu */
export function AuthLoading({ title }: { title: string }) {
  return (
    <AuthShell title={title}>
      <div aria-busy="true" className="flex flex-col gap-space-md">
        <div className="h-16 animate-pulse bg-surface-container" />
        <div className="h-16 animate-pulse bg-surface-container" />
        <div className="h-12 animate-pulse bg-surface-container" />
        <p className="sr-only">Henter …</p>
      </div>
    </AuthShell>
  );
}
