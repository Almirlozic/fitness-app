// Beregning af dagligt kalorie- og makromål. Rene funktioner uden side-effekter.

export type Sex = "male" | "female";
export type TrainingPerWeek = "0" | "1-3" | "3-5" | "6+";
export type GoalDirection = "lose" | "maintain" | "gain";

export type NutritionInput = {
  sex: Sex;
  /** "YYYY-MM-DD" */
  birthDate: string;
  heightCm: number;
  weightKg: number;
  trainingPerWeek: TrainingPerWeek;
  goalWeightKg: number;
};

export type NutritionTargets = {
  kcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  goal: GoalDirection;
  /** true, når kaloriemålet er hævet til minimumsgrænsen */
  hitMinimum: boolean;
};

export const ACTIVITY_FACTORS: Record<TrainingPerWeek, number> = {
  "0": 1.2,
  "1-3": 1.375,
  "3-5": 1.55,
  "6+": 1.725,
};

export const MIN_KCAL: Record<Sex, number> = { male: 1500, female: 1200 };

const DEFICIT_KCAL = 500;
const SURPLUS_KCAL = 300;
/** Inden for ±1 kg af nuværende vægt regnes som vedligehold */
const MAINTAIN_MARGIN_KG = 1;
const PROTEIN_G_PER_KG = 1.8;
const FAT_SHARE = 0.25;

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

/** Alder i hele år på datoen `today` ("YYYY-MM-DD") */
export function ageFromBirthDate(birthDate: string, today: string) {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const hadBirthday = tm > bm || (tm === bm && td >= bd);
  return ty - by - (hadBirthday ? 0 : 1);
}

/** Basalstofskifte efter Mifflin-St Jeor */
export function bmr(sex: Sex, weightKg: number, heightCm: number, age: number) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function maintenanceKcal(input: NutritionInput, today: string) {
  const age = ageFromBirthDate(input.birthDate, today);
  return (
    bmr(input.sex, input.weightKg, input.heightCm, age) * ACTIVITY_FACTORS[input.trainingPerWeek]
  );
}

export function goalDirection(weightKg: number, goalWeightKg: number): GoalDirection {
  if (goalWeightKg < weightKg - MAINTAIN_MARGIN_KG) return "lose";
  if (goalWeightKg > weightKg + MAINTAIN_MARGIN_KG) return "gain";
  return "maintain";
}

export function calculateTargets(input: NutritionInput, today: string): NutritionTargets {
  const goal = goalDirection(input.weightKg, input.goalWeightKg);
  const maintenance = maintenanceKcal(input, today);
  const adjusted =
    goal === "lose"
      ? maintenance - DEFICIT_KCAL
      : goal === "gain"
        ? maintenance + SURPLUS_KCAL
        : maintenance;

  const minimum = MIN_KCAL[input.sex];
  const kcal = roundTo(Math.max(adjusted, minimum), 50);

  // Protein ud fra den laveste af nuværende vægt og målvægt
  const proteinG = roundTo(PROTEIN_G_PER_KG * Math.min(input.weightKg, input.goalWeightKg), 5);
  const fatG = roundTo((kcal * FAT_SHARE) / 9, 5);
  const carbsG = Math.max(0, roundTo((kcal - proteinG * 4 - fatG * 9) / 4, 5));

  return { kcal, proteinG, fatG, carbsG, goal, hitMinimum: adjusted < minimum };
}

/** Kort forklaring til brugeren, fx "Vægttab på ca. ½ kg om ugen" */
export function describeGoal(targets: Pick<NutritionTargets, "goal" | "hitMinimum">) {
  switch (targets.goal) {
    case "lose":
      return targets.hitMinimum
        ? "Vægttab i et roligt tempo. Vi går ikke under det anbefalede minimum."
        : "Vægttab på ca. ½ kg om ugen";
    case "gain":
      return "Vægtøgning på ca. ¼ kg om ugen";
    case "maintain":
      return "Hold din nuværende vægt";
  }
}
