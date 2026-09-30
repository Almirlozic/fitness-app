import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-container ${className}`} />;
}

export default function Loading() {
  return (
    <>
      <AppHeader />
      <main
        aria-busy="true"
        aria-label="Henter …"
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-space-md px-margin pt-24 pb-24 md:px-margin-tablet"
      >
        <Bar className="h-10 w-3/4" />
        <Bar className="h-4 w-2/3" />
        <Bar className="mt-space-md h-28 w-full" />
        <Bar className="h-12 w-full" />
        {[0, 1, 2].map((i) => (
          <Bar key={i} className="h-24 w-full" />
        ))}
        <p className="sr-only">Henter dine øvelser …</p>
      </main>
      <BottomNav />
    </>
  );
}
