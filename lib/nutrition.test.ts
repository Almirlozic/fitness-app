import { describe, expect, it } from "vitest";
import {
  type NutritionInput,
  ageFromBirthDate,
  bmr,
  calculateTargets,
  describeGoal,
  goalDirection,
} from "./nutrition";

const TODAY = "2026-10-06";

const man: NutritionInput = {
  sex: "male",
  birthDate: "1996-01-15", // 30 år
  heightCm: 180,
  weightKg: 80,
  trainingPerWeek: "3-5",
  goalWeightKg: 75,
};

describe("ageFromBirthDate", () => {
  it("tæller kun hele år", () => {
    expect(ageFromBirthDate("1996-10-06", TODAY)).toBe(30); // fødselsdag i dag
    expect(ageFromBirthDate("1996-10-07", TODAY)).toBe(29); // fødselsdag i morgen
    expect(ageFromBirthDate("1996-01-15", TODAY)).toBe(30);
  });
});

describe("bmr (Mifflin-St Jeor)", () => {
  it("mand og kvinde", () => {
    expect(bmr("male", 80, 180, 30)).toBe(1780);
    expect(bmr("female", 80, 180, 30)).toBe(1614);
  });
});

describe("calculateTargets", () => {
  it("mand, 30 år, 80 kg, 180 cm, 3-5, målvægt 75", () => {
    expect(calculateTargets(man, TODAY)).toEqual({
      kcal: 2250,
      proteinG: 135,
      fatG: 65,
      carbsG: 280,
      goal: "lose",
      hitMinimum: false,
    });
  });

  it("kvinde med lav vægt og vægttabsmål rammer minimum på 1.200 kcal", () => {
    const result = calculateTargets(
      {
        sex: "female",
        birthDate: "1996-01-15",
        heightCm: 160,
        weightKg: 50,
        trainingPerWeek: "0",
        goalWeightKg: 45,
      },
      TODAY,
    );
    expect(result).toEqual({
      kcal: 1200,
      proteinG: 80, // 1,8 × 45 kg (målvægten, da den er lavere)
      fatG: 35,
      carbsG: 140,
      goal: "lose",
      hitMinimum: true,
    });
  });

  it("mand rammer minimum på 1.500 kcal", () => {
    const result = calculateTargets(
      { ...man, weightKg: 50, heightCm: 150, birthDate: "1950-01-01", trainingPerWeek: "0", goalWeightKg: 45 },
      TODAY,
    );
    expect(result.kcal).toBe(1500);
    expect(result.hitMinimum).toBe(true);
  });

  it("målvægt = nuværende vægt giver vedligehold", () => {
    const result = calculateTargets({ ...man, goalWeightKg: 80 }, TODAY);
    expect(result.goal).toBe("maintain");
    expect(result.kcal).toBe(2750); // 1.780 × 1,55 = 2.759
    expect(result.proteinG).toBe(145); // 1,8 × 80 = 144
  });

  it("målvægt over nuværende vægt giver vægtøgning (+300 kcal)", () => {
    const result = calculateTargets({ ...man, goalWeightKg: 85 }, TODAY);
    expect(result.goal).toBe("gain");
    expect(result.kcal).toBe(3050); // 2.759 + 300 = 3.059
    expect(result.proteinG).toBe(145); // nuværende vægt, da den er lavest
  });

  it("makroerne går op i kalorierne (inden for afrundingen)", () => {
    const { kcal, proteinG, fatG, carbsG } = calculateTargets(man, TODAY);
    expect(Math.abs(proteinG * 4 + fatG * 9 + carbsG * 4 - kcal)).toBeLessThanOrEqual(20);
  });
});

describe("goalDirection", () => {
  it("±1 kg regnes som vedligehold", () => {
    expect(goalDirection(80, 79)).toBe("maintain");
    expect(goalDirection(80, 81)).toBe("maintain");
    expect(goalDirection(80, 78.9)).toBe("lose");
    expect(goalDirection(80, 81.1)).toBe("gain");
  });
});

describe("describeGoal", () => {
  it("giver en kort forklaring", () => {
    expect(describeGoal({ goal: "lose", hitMinimum: false })).toBe("Vægttab på ca. ½ kg om ugen");
    expect(describeGoal({ goal: "gain", hitMinimum: false })).toBe("Vægtøgning på ca. ¼ kg om ugen");
    expect(describeGoal({ goal: "maintain", hitMinimum: false })).toBe("Hold din nuværende vægt");
  });
});
