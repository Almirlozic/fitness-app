import { PlusIcon } from "./Icons";

export function AddExerciseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group mb-space-xl flex min-h-12 w-full items-center justify-between bg-primary px-space-lg py-space-md text-label-caps uppercase tracking-widest text-on-primary transition-all hover:bg-neutral-800 active:scale-[0.99]"
    >
      <span className="flex items-center gap-space-sm">
        <PlusIcon width={18} height={18} />
        <span>[ + Log et sæt ]</span>
      </span>
      <span className="font-mono text-caption-mono font-normal text-on-primary-container transition-colors group-hover:text-on-primary">
        [Opret]
      </span>
    </button>
  );
}
