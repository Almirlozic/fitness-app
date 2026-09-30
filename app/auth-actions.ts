"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  emailSchema,
  fieldErrors,
  loginSchema,
  setPasswordSchema,
} from "@/lib/auth-schemas";
import { getUser, siteUrl } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type FormState<F extends string = string> = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<F, string>>;
  /** Indtastet e-mail, så feltet ikke tømmes ved fejl */
  email?: string;
};

const readString = (formData: FormData, key: string) => String(formData.get(key) ?? "");

export async function login(
  _prev: FormState<"email" | "password">,
  formData: FormData,
): Promise<FormState<"email" | "password">> {
  const email = readString(formData, "email");
  const parsed = loginSchema.safeParse({ email, password: readString(formData, "password") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Samme besked uanset om e-mailen findes, så man ikke kan gætte konti
    const message =
      error.code === "over_request_rate_limit"
        ? "For mange forsøg. Vent lidt og prøv igen."
        : "Forkert e-mail eller adgangskode";
    return { status: "error", message, email };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function setPassword(
  _prev: FormState<"password" | "confirm">,
  formData: FormData,
): Promise<FormState<"password" | "confirm">> {
  const parsed = setPasswordSchema.safeParse({
    password: readString(formData, "password"),
    confirm: readString(formData, "confirm"),
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?besked=udloebet");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const message =
      error.code === "same_password"
        ? "Vælg en anden adgangskode end den, du har nu."
        : error.code === "weak_password"
          ? "Adgangskoden er for svag. Vælg en længere eller mere varieret."
          : "Adgangskoden kunne ikke gemmes. Prøv igen.";
    return { status: "error", message };
  }

  redirect("/?besked=adgangskode-gemt");
}

const RESET_SENT = "Hvis e-mailen findes, har vi sendt et link";

export async function forgotPassword(
  _prev: FormState<"email">,
  formData: FormData,
): Promise<FormState<"email">> {
  const email = readString(formData, "email");
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { status: "error", fieldErrors: { email: parsed.error.issues[0].message }, email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl()}/auth/confirm`,
  });
  // Fejl logges, men brugeren får altid samme svar
  if (error) console.error("forgotPassword", error.code, error.message);

  return { status: "success", message: RESET_SENT };
}

export async function inviteUser(
  _prev: FormState<"email">,
  formData: FormData,
): Promise<FormState<"email">> {
  // Alle loggede brugere må invitere. Tjekkes her, da actions kan kaldes direkte.
  const user = await getUser();
  if (!user) redirect("/login");

  const email = readString(formData, "email");
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { status: "error", fieldErrors: { email: parsed.error.issues[0].message }, email };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data, {
    redirectTo: `${siteUrl()}/auth/confirm`,
  });
  if (error) {
    console.error("inviteUser", error.code, error.message);
    const message =
      error.code === "email_exists" || error.code === "user_already_exists"
        ? `Der findes allerede en bruger med ${parsed.data}.`
        : error.code === "over_email_send_rate_limit"
          ? "Grænsen for mails er nået (Supabase sender kun få i timen). Prøv igen senere."
          : error.code === "email_address_not_authorized"
            ? "Supabases indbyggede mail sender kun til medlemmer af dit Supabase-team. Tilføj personen dér, eller brug egen SMTP."
            : /sending .*email/i.test(error.message)
              ? "Mailen kunne ikke sendes. Tjek mailopsætningen i Supabase."
              : "Invitationen kunne ikke sendes. Prøv igen.";
    return { status: "error", message, email };
  }

  revalidatePath("/inviter");
  return { status: "success", message: `Invitation sendt til ${parsed.data}` };
}
