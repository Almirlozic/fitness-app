import { describe, expect, it } from "vitest";
import { parseDecimal, profileSchema, weightSchema } from "./profile-schema";

const valid = {
  sex: "male",
  birth_date: "1996-01-15",
  height_cm: "180",
  weight_kg: "82,5",
  training_per_week: "3-5",
  goal_weight_kg: "78",
  kcal_target: "2250",
  protein_g: "135",
  fat_g: "65",
  carbs_g: "280",
};

describe("profileSchema", () => {
  it("accepterer en gyldig profil og omsætter tekst til tal", () => {
    const r = profileSchema.parse(valid);
    expect(r.weight_kg).toBe(82.5);
    expect(r.height_cm).toBe(180);
    expect(r.kcal_target).toBe(2250);
  });

  it("giver danske fejlbeskeder", () => {
    const r = profileSchema.safeParse({ ...valid, weight_kg: "abc", sex: "" });
    const messages = r.error?.issues.map((i) => i.message);
    expect(messages).toContain("Skriv din vægt i kg, fx 82,5");
    expect(messages).toContain("Vælg mand eller kvinde");
  });

  it("afviser værdier uden for grænserne", () => {
    expect(profileSchema.safeParse({ ...valid, height_cm: "90" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, goal_weight_kg: "301" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, birth_date: "2020-01-01" }).success).toBe(false);
  });
});

describe("kg-felter", () => {
  it("accepterer komma og punktum", () => {
    expect(parseDecimal("82,5")).toBe(82.5);
    expect(parseDecimal("82.5")).toBe(82.5);
    expect(Number.isNaN(parseDecimal("8x"))).toBe(true);
    expect(weightSchema.parse(" 70,25 ")).toBe(70.3);
  });
});
