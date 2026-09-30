import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Skriv en gyldig e-mail, fx navn@mail.dk"));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Skriv din adgangskode"),
});

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, "Adgangskoden skal være mindst 8 tegn"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Adgangskoderne er ikke ens",
    path: ["confirm"],
  });

/** "a@b.dk, C@D.dk" → ["a@b.dk", "c@d.dk"] */
export function parseAdminEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null, adminEmails: string | undefined) {
  return Boolean(email) && parseAdminEmails(adminEmails).includes(email!.trim().toLowerCase());
}

/** Første fejl pr. felt, klar til at vise i en formular */
export function fieldErrors<T extends string>(error: z.ZodError) {
  const errors: Partial<Record<T, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as T;
    errors[field] ??= issue.message;
  }
  return errors;
}
