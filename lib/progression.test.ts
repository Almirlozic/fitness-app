import { describe, expect, it } from "vitest";
import {
  describeSinceStart,
  describeThisMonth,
  monthlyMax,
  sinceStart,
  thisMonthChange,
} from "./progression";

const set = (performed_on: string, weight_kg: number) => ({ performed_on, weight_kg });
const TODAY = "2026-10-12";

describe("thisMonthChange", () => {
  it("24 → 26 kg giver +8,3 %", () => {
    const change = thisMonthChange([set("2026-09-20", 24), set("2026-10-05", 26)], TODAY);
    expect(change).toEqual({ kind: "change", percent: 8.3 });
    expect(describeThisMonth(change)).toBe("+8,3 %");
  });

  it("sammenligner max i denne måned med max i ALLE måneder før", () => {
    const sets = [
      set("2026-07-01", 30),
      set("2026-09-01", 24),
      set("2026-10-01", 20),
      set("2026-10-10", 27),
    ];
    expect(thisMonthChange(sets, TODAY)).toEqual({ kind: "change", percent: -10 });
  });

  it("ignorerer reps – kun kg tæller", () => {
    const sets = [
      { ...set("2026-09-01", 24), reps: 5 },
      { ...set("2026-10-01", 24), reps: 12 },
    ];
    expect(thisMonthChange(sets, TODAY)).toEqual({ kind: "change", percent: 0 });
  });

  it("ingen sæt i denne måned", () => {
    const change = thisMonthChange([set("2026-09-20", 24)], TODAY);
    expect(change).toEqual({ kind: "no-sets-this-month", month: "2026-10" });
    expect(describeThisMonth(change)).toBe("Ingen sæt i oktober");
  });

  it("første måned, når der ikke er sæt før denne måned", () => {
    const change = thisMonthChange([set("2026-10-01", 20), set("2026-10-08", 22)], TODAY);
    expect(change).toEqual({ kind: "first-month" });
    expect(describeThisMonth(change)).toBe("Første måned");
  });

  it("0 kg før giver ikke division med 0", () => {
    expect(thisMonthChange([set("2026-09-01", 0), set("2026-10-01", 5)], TODAY)).toEqual({
      kind: "from-zero",
    });
    expect(thisMonthChange([set("2026-09-01", 0), set("2026-10-01", 0)], TODAY)).toEqual({
      kind: "change",
      percent: 0,
    });
  });
});

describe("sinceStart", () => {
  it("bruger første sæt og max i seneste måned med sæt", () => {
    const sets = [
      set("2026-10-02", 25),
      set("2026-08-01", 24),
      set("2026-09-15", 28),
      set("2026-10-06", 26),
    ];
    const result = sinceStart(sets);
    expect(result).toEqual({ firstKg: 24, latestKg: 26, diffKg: 2, percent: 8.3 });
    expect(describeSinceStart(result!)).toBe("+8,3 % · 24 → 26 kg");
  });

  it("første sæt på samme dag afgøres af created_at", () => {
    const sets = [
      { ...set("2026-10-01", 30), created_at: "2026-10-01T10:00:00Z" },
      { ...set("2026-10-01", 20), created_at: "2026-10-01T09:00:00Z" },
    ];
    expect(sinceStart(sets)?.firstKg).toBe(20);
  });

  it("0 kg i første sæt giver ikke division med 0", () => {
    expect(sinceStart([set("2026-09-01", 0), set("2026-10-01", 10)])?.percent).toBeNull();
    expect(sinceStart([set("2026-09-01", 0), set("2026-10-01", 0)])?.percent).toBe(0);
  });

  it("returnerer null uden sæt", () => {
    expect(sinceStart([])).toBeNull();
  });
});

describe("monthlyMax", () => {
  it("giver tungeste kg pr. måned i kronologisk rækkefølge", () => {
    const sets = [set("2026-10-01", 26), set("2026-09-01", 24), set("2026-10-09", 25)];
    expect(monthlyMax(sets)).toEqual([
      { month: "2026-09", maxKg: 24 },
      { month: "2026-10", maxKg: 26 },
    ]);
  });

  it("håndterer 0 kg", () => {
    expect(monthlyMax([set("2026-10-01", 0)])).toEqual([{ month: "2026-10", maxKg: 0 }]);
  });
});
