import { describe, expect, it } from "vitest";
import { addDays, todayIso } from "./format";
import {
  customFoodSchema,
  dateSchema,
  gramsSchema,
  mealSchema,
  newUnitSchema,
  quantitySchema,
} from "./food-schema";

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
    unit_name: "",
    unit_grams: "",
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
      unit: null,
    });
  });

  it("afviser urealistiske værdier og forkerte stregkoder", () => {
    expect(customFoodSchema.safeParse({ ...valid, protein_100g: "120" }).success).toBe(false);
    expect(customFoodSchema.safeParse({ ...valid, barcode: "12ab" }).success).toBe(false);
  });
});

describe("enheder", () => {
  it("antal: hele og halve, komma og punktum", () => {
    expect(quantitySchema.parse("4")).toBe(4);
    expect(quantitySchema.parse("0,5")).toBe(0.5);
    expect(quantitySchema.parse("1.5")).toBe(1.5);
    expect(quantitySchema.safeParse("0").success).toBe(false);
    expect(quantitySchema.safeParse("fire").error?.issues[0].message).toBe(
      "Skriv antallet som et tal, fx 4 eller 0,5",
    );
  });

  it("ny enhed: navn og gram", () => {
    expect(newUnitSchema.parse({ name: " stk ", grams: "55" })).toEqual({ name: "stk", grams: 55 });
    expect(newUnitSchema.safeParse({ name: "en meget lang enhedsbetegnelse", grams: "5" }).success).toBe(false);
  });

  it("egen fødevare med valgfri enhed – begge felter eller ingen", () => {
    const food = {
      name: "Æg",
      brand: "",
      barcode: "",
      serving_g: "",
      kcal_100g: "143",
      protein_100g: "12,6",
      carbs_100g: "0,7",
      fat_100g: "9,9",
    };
    expect(customFoodSchema.parse({ ...food, unit_name: "stk", unit_grams: "55" }).unit).toEqual({
      name: "stk",
      grams: 55,
    });
    const r = customFoodSchema.safeParse({ ...food, unit_name: "stk", unit_grams: "" });
    expect(r.error?.issues[0]).toMatchObject({ path: ["unit_grams"] });
  });
});

