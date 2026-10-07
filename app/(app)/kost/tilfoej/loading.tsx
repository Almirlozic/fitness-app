import { AppHeader } from "@/app/components/AppHeader";
import { BottomNav } from "@/app/components/BottomNav";

const Bar = ({ className }: { className: string }) => (
  <div className={`animate-pulse bg-surface-container ${className}`} />
);

export default function Loading() {
  return (
    <>
      <AppHeader />
      <main
        aria-busy="true"
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-space-md px-margin pt-24 pb-24 md:px-margin-tablet"
      >
        <Bar className="h-11 w-full" />
        <Bar className="h-40 w-full" />
        {[0, 1, 2, 3].map((i) => (
          <Bar key={i} className="h-20 w-full" />
        ))}
        <p className="sr-only">Henter dagens mad …</p>
      </main>
      <BottomNav activeHref="/kost" />
    </>
  );
}
