"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { type OnboardingState, completeOnboarding } from "@/app/onboarding/actions";
import { fieldErrors } from "@/lib/auth-schemas";
import { formatNumber } from "@/lib/format";
import {
  type NutritionTargets,
  type Sex,
  type TrainingPerWeek,
  calculateTargets,
  describeGoal,
} from "@/lib/nutrition";
import { type ProfileField, profileSchema } from "@/lib/profile-schema";
import { ArrowBackIcon } from "../Icons";
import { type Choice, ChoiceButtons } from "../profile/ChoiceButtons";
import { TargetsEditor } from "../profile/TargetsEditor";
import { FormMessage, TextField } from "../TextField";

type Values = Record<ProfileField, string>;
type Errors = Partial<Record<ProfileField, string>>;

const STEPS: { title: string; intro: string; fields: ProfileField[] }[] = [
  { title: "Om dig", intro: "Vi bruger det til at beregne dit forbrug.", fields: ["sex", "birth_date"] },
  { title: "Din krop", intro: "Din højde og vægt lige nu.", fields: ["height_cm", "weight_kg"] },
  { title: "Træning", intro: "Hvor mange gange træner du om ugen?", fields: ["training_per_week"] },
  { title: "Dit mål", intro: "Hvad vil du gerne veje?", fields: ["goal_weight_kg"] },
  {
    title: "Dit forslag",
    intro: "Beregnet ud fra dine svar. Ret tallene, hvis du vil.",
    fields: ["kcal_target", "protein_g", "fat_g", "carbs_g"],
  },
];

const BODY_FIELDS: ProfileField[] = [
  "sex",
  "birth_date",
  "height_cm",
  "weight_kg",
  "training_per_week",
  "goal_weight_kg",
];

const SEX_OPTIONS: Choice<Sex>[] = [
  { value: "male", label: "Mand" },
  { value: "female", label: "Kvinde" },
];

const TRAINING_OPTIONS: Choice<TrainingPerWeek>[] = [
  { value: "0", label: "0", hint: "Træner ikke" },
  { value: "1-3", label: "1–3", hint: "gange om ugen" },
  { value: "3-5", label: "3–5", hint: "gange om ugen" },
  { value: "6+", label: "6+", hint: "gange om ugen" },
];

const EMPTY: Values = {
  sex: "",
  birth_date: "",
  height_cm: "",
  weight_kg: "",
  training_per_week: "",
  goal_weight_kg: "",
  kcal_target: "",
  protein_g: "",
  fat_g: "",
  carbs_g: "",
};

const pick = (values: Values, fields: ProfileField[]) =>
  Object.fromEntries(fields.map((f) => [f, values[f]])) as Partial<Values>;

/** Validerer et trins felter med samme regler som serveren */
function validate(values: Values, fields: ProfileField[]): Errors {
  const mask = Object.fromEntries(fields.map((f) => [f, true])) as Partial<
    Record<ProfileField, true>
  >;
  const result = profileSchema.pick(mask).safeParse(pick(values, fields));
  return result.success ? {} : fieldErrors<ProfileField>(result.error);
}

export function OnboardingWizard({ today, minBirthDate }: { today: string; minBirthDate: string }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [suggestion, setSuggestion] = useState<NutritionTargets | null>(null);
  // Hvilke svar forslaget er beregnet ud fra, så rettede tal ikke overskrives unødigt
  const [suggestionFor, setSuggestionFor] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: OnboardingState, formData: FormData) => {
      const result = await completeOnboarding(prev, formData);
      if (result.fieldErrors) {
        setErrors(result.fieldErrors);
        // Gå til det første trin med en fejl
        const first = STEPS.findIndex((s) => s.fields.some((f) => result.fieldErrors?.[f]));
        if (first >= 0) setStep(first);
      }
      return result;
    },
    { status: "idle" },
  );

  // Flyt fokus til overskriften, når trinnet skifter (skærmlæsere og tastatur)
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const set = (field: ProfileField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  function prepareSuggestion() {
    const key = BODY_FIELDS.map((f) => values[f]).join("|");
    if (key === suggestionFor) return;
    const body = profileSchema
      .pick({
        sex: true,
        birth_date: true,
        height_cm: true,
        weight_kg: true,
        training_per_week: true,
        goal_weight_kg: true,
      })
      .parse(pick(values, BODY_FIELDS));
    const targets = calculateTargets(
      {
        sex: body.sex,
        birthDate: body.birth_date,
        heightCm: body.height_cm,
        weightKg: body.weight_kg,
        trainingPerWeek: body.training_per_week,
        goalWeightKg: body.goal_weight_kg,
      },
      today,
    );
    setSuggestion(targets);
    setSuggestionFor(key);
    setValues((v) => ({
      ...v,
      kcal_target: String(targets.kcal),
      protein_g: String(targets.proteinG),
      fat_g: String(targets.fatG),
      carbs_g: String(targets.carbsG),
    }));
  }

  function next() {
    const stepErrors = validate(values, STEPS[step].fields);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    if (step === STEPS.length - 2) prepareSuggestion();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <form
      action={formAction}
      noValidate
      onSubmit={(e) => {
        // Enter på de første trin går videre i stedet for at gemme
        if (!isLast) {
          e.preventDefault();
          next();
        }
      }}
      className="flex flex-1 flex-col"
    >
      {/* Fremskridt og tilbage */}
      <div className="flex items-center justify-between gap-space-md pt-space-lg">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="-ml-space-xs flex min-h-11 items-center gap-space-xs px-space-xs font-mono text-caption-mono uppercase text-primary"
          >
            <ArrowBackIcon width={16} height={16} />
            Tilbage
          </button>
        ) : (
          <span />
        )}
        <span className="font-mono text-caption-mono uppercase text-secondary" aria-live="polite">
          {step + 1} af {STEPS.length}
        </span>
      </div>
      <div className="mt-space-xs grid grid-cols-5 gap-space-xs" aria-hidden>
        {STEPS.map((s, i) => (
          <div key={s.title} className={`h-1 ${i <= step ? "bg-primary" : "bg-surface-container-high"}`} />
        ))}
      </div>

      <section className="mt-space-xl flex flex-1 flex-col">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-display-hero-mobile uppercase leading-none tracking-tighter text-primary outline-none"
        >
          {current.title}
        </h1>
        <p className="mt-space-sm mb-space-xl text-secondary">{current.intro}</p>

        {state.status === "error" && state.message && (
          <div className="mb-space-md">
            <FormMessage status="error">{state.message}</FormMessage>
          </div>
        )}

        <div className="flex flex-col gap-space-lg">
          {step === 0 && (
            <>
              <ChoiceButtons
                id="sex"
                label="Køn"
                options={SEX_OPTIONS}
                value={values.sex as Sex | ""}
                onChange={(v) => set("sex", v)}
                error={errors.sex}
              />
              <TextField
                id="birth_date"
                label="Fødselsdato"
                type="date"
                min={minBirthDate}
                max={today}
                value={values.birth_date}
                onChange={(e) => set("birth_date", e.target.value)}
                error={errors.birth_date}
              />
            </>
          )}

          {step === 1 && (
            <>
              <TextField
                id="height_cm"
                label="Højde (cm)"
                inputMode="numeric"
                autoComplete="off"
                placeholder="fx 178"
                value={values.height_cm}
                onChange={(e) => set("height_cm", e.target.value)}
                error={errors.height_cm}
              />
              <TextField
                id="weight_kg"
                label="Vægt (kg)"
                inputMode="decimal"
                autoComplete="off"
                placeholder="fx 82,5"
                value={values.weight_kg}
                onChange={(e) => set("weight_kg", e.target.value)}
                error={errors.weight_kg}
              />
            </>
          )}

          {step === 2 && (
            <ChoiceButtons
              id="training"
              label="Træning pr. uge"
              options={TRAINING_OPTIONS}
              value={values.training_per_week as TrainingPerWeek | ""}
              onChange={(v) => set("training_per_week", v)}
              error={errors.training_per_week}
            />
          )}

          {step === 3 && (
            <TextField
              id="goal_weight_kg"
              label="Målvægt (kg)"
              inputMode="decimal"
              autoComplete="off"
              placeholder="fx 78"
              value={values.goal_weight_kg}
              onChange={(e) => set("goal_weight_kg", e.target.value)}
              error={errors.goal_weight_kg}
            />
          )}

          {isLast && (
            <>
              {suggestion && (
                <div className="border-t-2 border-primary bg-surface-container-lowest p-space-md">
                  <p className="font-mono text-caption-mono uppercase text-secondary">Dagligt mål</p>
                  <p className="mt-space-xs font-mono text-stat-display leading-none text-primary">
                    {formatNumber(suggestion.kcal)} kcal
                  </p>
                  <p className="mt-space-sm font-mono text-caption-mono font-bold uppercase text-primary">
                    {describeGoal(suggestion)}
                  </p>
                </div>
              )}
              <TargetsEditor
                values={{
                  kcal_target: values.kcal_target,
                  protein_g: values.protein_g,
                  fat_g: values.fat_g,
                  carbs_g: values.carbs_g,
                }}
                onChange={(key, value) => set(key, value)}
                errors={errors}
              />
            </>
          )}
        </div>

        {/* Svarene fra de tidligere trin sendes med, når der gemmes */}
        {isLast &&
          BODY_FIELDS.map((f) => <input key={f} type="hidden" name={f} value={values[f]} />)}

        <div className="mt-auto pt-space-xl pb-space-lg">
          {isLast ? (
            <>
              <button
                // Egen key: ellers genbruger React "Næste"-knappen og gør den til
                // en submit-knap midt i klikket, så formularen gemmes med det samme
                key="save"
                type="submit"
                disabled={pending}
                className="flex min-h-12 w-full items-center justify-center bg-primary px-space-md text-label-caps uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
              >
                {pending ? "[ Gemmer … ]" : "[ Gem og kom i gang ]"}
              </button>
              <p className="mt-space-sm text-center font-mono text-caption-mono text-secondary">
                Tallene er et skøn. Du kan altid ændre dem senere.
              </p>
            </>
          ) : (
            <button
              key="next"
              type="button"
              onClick={next}
              className="flex min-h-12 w-full items-center justify-center bg-primary px-space-md text-label-caps uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container"
            >
              [ Næste ]
            </button>
          )}
        </div>
      </section>
    </form>
  );
}
