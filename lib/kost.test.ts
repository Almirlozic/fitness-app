import { describe, expect, it } from "vitest";
import {
  GLASSES_PER_DAY,
  fraction,
  recommendedMealKcal,
  waterLiters,
  weightProgress,
} from "./kost";

describe("recommendedMealKcal", () => {
  it("andele af dagens mål, rundet til 10", () => {
    expect(recommendedMealKcal("breakfast", 3290)).toEqual([820, 1090]);
    expect(recommendedMealKcal("lunch", 3290)).toEqual([990, 1320]);
    expect(recommendedMealKcal("dinner", 3290)).toEqual([1280, 1680]);
  });

  it("snack er et fast interval", () => {
    expect(recommendedMealKcal("snack", 3290)).toEqual([100, 300]);
  });

  it("uden mål: null", () => {
    expect(recommendedMealKcal("lunch", 0)).toBeNull();
  });
});

describe("weightProgress", () => {
  it("vægttab: 90 → 80, nu 85 = halvvejs", () => {
    expect(weightProgress(90, 85, 80)).toBe(0.5);
  });

  it("vægtøgning: 70 → 80, nu 74 = 40 %", () => {
    expect(weightProgress(70, 74, 80)).toBeCloseTo(0.4);
  });

  it("holder sig mellem 0 og 1", () => {
    expect(weightProgress(90, 95, 80)).toBe(0);
    expect(weightProgress(90, 78, 80)).toBe(1);
  });

  it("mangler data eller start = mål", () => {
    expect(weightProgress(null, 80, 75)).toBeNull();
    expect(weightProgress(80, 80, 80)).toBe(1);
  });
});

describe("fraction", () => {
  it("0–1", () => {
    expect(fraction(1200, 2400)).toBe(0.5);
    expect(fraction(3000, 2400)).toBe(1);
    expect(fraction(0, 0)).toBe(0);
  });
});

describe("vand", () => {
  it("hvert glas er 0,25 L, og målet er 2 L", () => {
    expect(waterLiters(1)).toBe(0.25);
    expect(waterLiters(3)).toBe(0.75);
    expect(waterLiters(GLASSES_PER_DAY)).toBe(2);
    expect(waterLiters(0)).toBe(0);
  });
});

