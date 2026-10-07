import { describe, expect, it } from "vitest";
import {
  addDays,
  formatDate,
  formatDayLabel,
  formatKg,
  formatLift,
  formatPercent,
  isIsoDate,
  todayIso,
} from "./format";
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

describe("datoer", () => {
  it("lægger dage til på tværs af måneder og sommertid", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-29", -1)).toBe("2026-03-28");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("validerer datoer", () => {
    expect(isIsoDate("2026-10-07")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("i-dag")).toBe(false);
  });

  it("dagsetiketter", () => {
    expect(formatDayLabel("2026-10-07", "2026-10-07")).toBe("I dag");
    expect(formatDayLabel("2026-10-06", "2026-10-07")).toBe("I går");
    expect(formatDayLabel("2026-10-05", "2026-10-07")).toMatch(/^Man\.? 5\. okt$/);
  });

  it("dags dato regnes i dansk tid lige efter midnat", () => {
    // 23:30 UTC den 6. = 01:30 dansk tid den 7.
    expect(todayIso(new Date("2026-10-06T23:30:00Z"))).toBe("2026-10-07");
  });
});

