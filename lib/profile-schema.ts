import { z } from "zod";
import { todayIso } from "./format";
import { ageFromBirthDate } from "./nutrition";

// Validering af profilfelter. Bruges af onboarding og senere af en indstillingsside.
// Alle felter kommer som tekst fra formularer.

export const MIN_AGE = 13;
export const MAX_AGE = 100;

/** "82,5" eller "82.5" → 82.5. Ugyldig tekst → NaN */
export function parseDecimal(value: string) {
  const trimmed = value.trim().replace(",", ".");
  return /^\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}

function kgField(label: string, example: string) {
  const message = `Skriv ${label} i kg, fx ${example}`;
  return z
    .string()
    .transform(parseDecimal)
    .pipe(
      z
        .number(message)
        .refine((n) => !Number.isNaN(n), message)
        .refine((n) => n >= 30 && n <= 300, `${capitalize(label)} skal være mellem 30 og 300 kg`)
        // numeric(5,1) i databasen: én decimal
        .transform((n) => Math.round(n * 10) / 10),
    );
}

function intField(message: string, min: number, max: number, rangeMessage: string) {
  return z
    .string()
    .trim()
    .regex(/^\d+$/, message)
    .transform(Number)
    .pipe(z.number().min(min, rangeMessage).max(max, rangeMessage));
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const sexSchema = z.enum(["male", "female"], "Vælg mand eller kvinde");

export const trainingSchema = z.enum(["0", "1-3", "3-5", "6+"], "Vælg hvor tit du træner");

export const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Vælg din fødselsdato")
  .refine((d) => !Number.isNaN(Date.parse(d)), "Vælg en gyldig dato")
  .refine((d) => ageFromBirthDate(d, todayIso()) >= MIN_AGE, `Du skal være mindst ${MIN_AGE} år`)
  .refine((d) => ageFromBirthDate(d, todayIso()) <= MAX_AGE, "Tjek din fødselsdato");

export const heightSchema = intField(
  "Skriv din højde i hele cm, fx 178",
  100,
  250,
  "Højden skal være mellem 100 og 250 cm",
);

export const weightSchema = kgField("din vægt", "82,5");
export const goalWeightSchema = kgField("din målvægt", "78");

export const targetsSchema = z.object({
  kcal_target: intField("Skriv kalorier som et helt tal", 1000, 6000, "Kalorier skal være mellem 1.000 og 6.000"),
  protein_g: intField("Skriv protein i hele gram", 0, 1000, "Protein skal være mellem 0 og 1.000 g"),
  fat_g: intField("Skriv fedt i hele gram", 0, 1000, "Fedt skal være mellem 0 og 1.000 g"),
  carbs_g: intField("Skriv kulhydrat i hele gram", 0, 1000, "Kulhydrat skal være mellem 0 og 1.000 g"),
});

export const profileSchema = z
  .object({
    sex: sexSchema,
    birth_date: birthDateSchema,
    height_cm: heightSchema,
    weight_kg: weightSchema,
    training_per_week: trainingSchema,
    goal_weight_kg: goalWeightSchema,
  })
  .extend(targetsSchema.shape);

export type ProfileField = keyof z.input<typeof profileSchema>;
export type ProfileInput = z.output<typeof profileSchema>;
