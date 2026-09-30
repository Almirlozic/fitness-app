import Link from "next/link";
import { deleteExercise } from "@/app/actions";
import { DeleteButton } from "./DeleteButton";
import { ArrowBackIcon } from "./Icons";

export function ExerciseActions({ exerciseName }: { exerciseName: string }) {
  return (
    <div className="mt-space-xl flex flex-col gap-space-sm">
      <Link
        href="/"
        className="flex h-12 w-full items-center justify-center gap-space-xs border border-primary bg-surface-container-lowest text-label-caps uppercase tracking-widest text-primary transition-colors hover:bg-surface-container"
      >
        <ArrowBackIcon width={18} height={18} />
        <span>[ Tilbage til oversigt ]</span>
      </Link>
      <DeleteButton
        onDelete={deleteExercise.bind(null, exerciseName)}
        label="[ Slet øvelse og alle sæt ]"
        confirmLabel="[ Slet øvelse? Tryk igen ]"
        className="w-full text-center text-label-tag tracking-wider"
      />
    </div>
  );
}
