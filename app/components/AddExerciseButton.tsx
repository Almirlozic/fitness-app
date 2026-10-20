/** "OPRET ØVELSE" fra designet – folder log-formularen ud */
export function AddExerciseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[62px] w-full items-center justify-center bg-navy font-inter text-[18px] font-bold uppercase text-sand transition-opacity hover:opacity-90 active:scale-[0.99]"
    >
      Opret øvelse
    </button>
  );
}
