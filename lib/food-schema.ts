import { z } from "zod";
import { MEAL_KEYS } from "./food";
import { addDays, isIsoDate, todayIso } from "./format";
import { parseDecimal } from "./profile-schema";

// Validering til kalorie-trackeren. Felter kommer som tekst fra formularer.

function decimal(message: string, min: number, max: number, rangeMessage: string) {
  return z
    .string()
    .transform(parseDecimal)
    .pipe(
      z
        .number(message)
        .refine((v) => !Number.isNaN(v), message)
        .refine((v) => v >= min && v <= max, rangeMessage),
    );
}

const optionalDecimal = (message: string, min: number, max: number, rangeMessage: string) =>
  z.union([z.literal("").transform(() => null), decimal(message, min, max, rangeMessage)]);

export const gramsSchema = decimal(
  "Skriv mængden i gram, fx 150 eller 12,5",
  0.1,
  5000,
  "Mængden skal være mellem 0,1 og 5.000 g",
).transform((g) => Math.round(g * 10) / 10);

export const mealSchema = z.enum(MEAL_KEYS, "Vælg et måltid");

/** Dato i dansk tid; ikke frem i tiden og højst et år tilbage */
export const dateSchema = z
  .string()
  .refine(isIsoDate, "Vælg en gyldig dato")
  .refine((d) => d <= todayIso(), "Du kan ikke logge mad i fremtiden")
  .refine((d) => d >= addDays(todayIso(), -366), "Datoen er for langt tilbage");

export const barcodeSchema = z.string().trim().regex(/^\d{6,14}$/, "Stregkoden skal være 6–14 cifre");

export const per100Schema = z.object({
  kcal_100g: decimal("Skriv kalorier pr. 100 g, fx 63", 0, 900, "Kalorier skal være mellem 0 og 900 pr. 100 g"),
  protein_100g: decimal("Skriv protein pr. 100 g, fx 11", 0, 100, "Protein skal være mellem 0 og 100 g pr. 100 g"),
  carbs_100g: decimal("Skriv kulhydrat pr. 100 g, fx 4", 0, 100, "Kulhydrat skal være mellem 0 og 100 g pr. 100 g"),
  fat_100g: decimal("Skriv fedt pr. 100 g, fx 0,2", 0, 100, "Fedt skal være mellem 0 og 100 g pr. 100 g"),
});

export const customFoodSchema = z
  .object({
    name: z.string().trim().min(1, "Skriv et navn").max(120, "Navnet må højst være 120 tegn"),
    brand: z
      .string()
      .trim()
      .max(120, "Mærket må højst være 120 tegn")
      .transform((v) => v || null),
    barcode: z.union([z.literal("").transform(() => null), barcodeSchema]),
    serving_g: optionalDecimal(
      "Skriv portionen i gram, fx 170",
      0.1,
      5000,
      "Portionen skal være mellem 0,1 og 5.000 g",
    ),
  })
  .extend(per100Schema.shape);

export type CustomFoodInput = z.output<typeof customFoodSchema>;
