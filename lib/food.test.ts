import { describe, expect, it } from "vitest";
import {
  dayTotals,
  macrosForGrams,
  progressPercent,
  remainingKcal,
  sumMacros,
  totalsByMeal,
} from "./food";

const skyr = { kcal_100g: 63, protein_100g: 11, carbs_100g: 4, fat_100g: 0.2 };

describe("macrosForGrams", () => {
  it("150 g af en vare med 130 kcal/100 g = 195 kcal", () => {
    const food = { kcal_100g: 130, protein_100g: 2.7, carbs_100g: 28, fat_100g: 0.3 };
    expect(macrosForGrams(food, 150)).toEqual({
      kcal: 195,
      protein_g: 4.1, // 4,05 rundet
      carbs_g: 42,
      fat_g: 0.5, // 0,45 rundet
    });
  });

  it("runder til 1 decimal", () => {
    expect(macrosForGrams(skyr, 200)).toEqual({ kcal: 126, protein_g: 22, carbs_g: 8, fat_g: 0.4 });
    expect(macrosForGrams(skyr, 33.3).kcal).toBe(21);
  });
});

describe("totaler", () => {
  const logs = [
    { meal: "breakfast", kcal: 300, protein_g: 20, carbs_g: 30, fat_g: 10 },
    { meal: "breakfast", kcal: 126, protein_g: 22, carbs_g: 8, fat_g: 0.4 },
    { meal: "lunch", kcal: 650.5, protein_g: 40.1, carbs_g: 70, fat_g: 20.2 },
    { meal: "snack", kcal: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3 },
  ];

  it("summerer pr. måltid, også tomme måltider", () => {
    const meals = totalsByMeal(logs);
    expect(meals.breakfast).toEqual({ kcal: 426, protein_g: 42, carbs_g: 38, fat_g: 10.4 });
    expect(meals.dinner).toEqual({ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  });

  it("summerer på tværs af måltider for hele dagen", () => {
    expect(dayTotals(logs)).toEqual({ kcal: 1171.5, protein_g: 82.6, carbs_g: 133, fat_g: 30.9 });
  });

  it("undgår flydende-tals-støj", () => {
    expect(sumMacros([{ kcal: 0.1, protein_g: 0.2, carbs_g: 0, fat_g: 0 }, { kcal: 0.2, protein_g: 0.1, carbs_g: 0, fat_g: 0 }]).kcal).toBe(0.3);
  });
});

describe("remainingKcal", () => {
  it("kcal tilbage", () => {
    expect(remainingKcal(2400, 1750)).toEqual({ kcal: 650, over: false });
  });

  it("over målet", () => {
    expect(remainingKcal(2400, 2520.4)).toEqual({ kcal: 120, over: true });
  });

  it("præcis ramt", () => {
    expect(remainingKcal(2000, 2000)).toEqual({ kcal: 0, over: false });
  });
});

describe("progressPercent", () => {
  it("holder sig mellem 0 og 100", () => {
    expect(progressPercent(1200, 2400)).toBe(50);
    expect(progressPercent(3000, 2400)).toBe(100);
    expect(progressPercent(0, 0)).toBe(0);
  });
});
