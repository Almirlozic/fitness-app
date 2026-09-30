"use client";

import { useState } from "react";
import { AddExerciseButton } from "./AddExerciseButton";
import type { OwnExercise } from "./ExerciseSearch";
import { LogSetForm } from "./LogSetForm";

/** Knappen "Tilføj ny øvelse" folder log-formularen ud */
export function LogSetPanel({
  defaultOpen,
  ownExercises,
  today,
}: {
  defaultOpen: boolean;
  ownExercises: OwnExercise[];
  today: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return open ? (
    <LogSetForm ownExercises={ownExercises} today={today} onClose={() => setOpen(false)} />
  ) : (
    <AddExerciseButton onClick={() => setOpen(true)} />
  );
}
