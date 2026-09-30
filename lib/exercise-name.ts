/** Fjerner mellemrum i enderne og samler flere mellemrum til ét */
export function normalizeExerciseName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

/** Nøgle til at samle samme øvelse uanset store/små bogstaver og mellemrum */
export function exerciseKey(name: string) {
  return normalizeExerciseName(name).toLowerCase();
}

export function exercisePath(name: string) {
  return `/ovelser/${encodeURIComponent(name)}`;
}
