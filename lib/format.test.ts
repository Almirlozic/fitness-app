import { describe, expect, it } from "vitest";
import { formatDate, formatKg, formatLift, formatPercent, todayIso } from "./format";
import { exerciseKey, normalizeExerciseName } from "./exercise-name";

describe("format", () => {
  it("skriver tal på dansk", () => {
    expect(formatKg(24.5)).toBe("24,5 kg");
    expect(formatKg(26)).toBe("26 kg");
    expect(formatLift(26, 6)).toBe("26 kg × 6");
    expect(formatPercent(8.3)).toBe("+8,3 %");
    expect(formatPercent(-2.5)).toBe("−2,5 %");
  });

  it("skriver datoer som 12. okt 2026", () => {
    expect(formatDate("2026-10-12")).toBe("12. okt 2026");
    expect(formatDate("2026-05-01")).toBe("1. maj 2026");
  });

  it("bruger dansk tid for dags dato", () => {
    expect(todayIso(new Date("2026-10-11T22:30:00Z"))).toBe("2026-10-12");
  });
});

describe("exercise-name", () => {
  it("samler navne uanset store/små bogstaver og mellemrum", () => {
    expect(normalizeExerciseName("  Incline   Chest Press ")).toBe("Incline Chest Press");
    expect(exerciseKey("incline chest  PRESS")).toBe(exerciseKey("Incline Chest Press"));
  });
});
