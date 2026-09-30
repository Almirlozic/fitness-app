import { describe, expect, it } from "vitest";
import { categoryFromWger, isCategory } from "./categories";

describe("categories", () => {
  it("oversætter wger-kategorier", () => {
    expect(categoryFromWger("Chest")).toBe("bryst");
    expect(categoryFromWger("Arms")).toBe("arme");
    expect(categoryFromWger("Calves")).toBe("laegge");
    expect(categoryFromWger("Ukendt")).toBeNull();
    expect(categoryFromWger(undefined)).toBeNull();
  });

  it("genkender gyldige nøgler", () => {
    expect(isCategory("bryst")).toBe(true);
    expect(isCategory("chest")).toBe(false);
  });
});
