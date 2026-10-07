import { describe, expect, it } from "vitest";
import { addDays, todayIso } from "./format";
import { customFoodSchema, dateSchema, gramsSchema, mealSchema } from "./food-schema";

describe("gramsSchema", () => {
  it("accepterer komma og punktum", () => {
    expect(gramsSchema.parse("12,5")).toBe(12.5);
    expect(gramsSchema.parse("150")).toBe(150);
  });

  it("giver danske fejlbeskeder", () => {
    expect(gramsSchema.safeParse("abc").error?.issues[0].message).toBe(
      "Skriv mængden i gram, fx 150 eller 12,5",
    );
    expect(gramsSchema.safeParse("0").success).toBe(false);
  });
});

describe("dateSchema", () => {
  it("tillader i dag, men ikke i morgen", () => {
    expect(dateSchema.safeParse(todayIso()).success).toBe(true);
    expect(dateSchema.safeParse(addDays(todayIso(), 1)).error?.issues[0].message).toBe(
      "Du kan ikke logge mad i fremtiden",
    );
  });
});

describe("mealSchema", () => {
  it("kun de fire måltider", () => {
    expect(mealSchema.safeParse("lunch").success).toBe(true);
    expect(mealSchema.safeParse("brunch").success).toBe(false);
  });
});

describe("customFoodSchema", () => {
  const valid = {
    name: " Hjemmelavet müsli ",
    brand: "",
    barcode: "",
    serving_g: "",
    kcal_100g: "380",
    protein_100g: "12,5",
    carbs_100g: "55",
    fat_100g: "11",
  };

  it("omsætter tekst til tal og tomme felter til null", () => {
    expect(customFoodSchema.parse(valid)).toEqual({
      name: "Hjemmelavet müsli",
      brand: null,
      barcode: null,
      serving_g: null,
      kcal_100g: 380,
      protein_100g: 12.5,
      carbs_100g: 55,
      fat_100g: 11,
    });
  });

  it("afviser urealistiske værdier og forkerte stregkoder", () => {
    expect(customFoodSchema.safeParse({ ...valid, protein_100g: "120" }).success).toBe(false);
    expect(customFoodSchema.safeParse({ ...valid, barcode: "12ab" }).success).toBe(false);
  });
});
