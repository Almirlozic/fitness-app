import { describe, expect, it } from "vitest";
import { missingNutrients } from "./food-types";
import { mapOffProduct } from "./off-map";

describe("mapOffProduct", () => {
  it("omsætter et søgeresultat (brands som liste)", () => {
    // Svar-format fra search.openfoodfacts.org
    const food = mapOffProduct({
      code: "8710624358174",
      product_name: "Skyr naturel",
      product_name_da: null,
      brands: ["Skyr", " Isey Skyr"],
      serving_quantity: null,
      nutriments: { "energy-kcal_100g": 62, proteins_100g: 11, carbohydrates_100g: 4, fat_100g: 0.200000002980232 },
    });
    expect(food).toEqual({
      id: null,
      source: "off",
      barcode: "8710624358174",
      name: "Skyr naturel",
      brand: "Skyr",
      kcal_100g: 62,
      protein_100g: 11,
      carbs_100g: 4,
      fat_100g: 0.2,
      serving_g: null,
    });
  });

  it("foretrækker det danske navn og læser brands som tekst (produkt-API)", () => {
    const food = mapOffProduct({
      code: "5701211015703",
      product_name: "Skyr plain",
      product_name_da: "Skyr naturel",
      brands: "Arla, Arla Foods",
      serving_quantity: "170",
      nutriments: { "energy-kcal_100g": "63", proteins_100g: "11", carbohydrates_100g: 4, fat_100g: 0.2 },
    });
    expect(food?.name).toBe("Skyr naturel");
    expect(food?.brand).toBe("Arla");
    expect(food?.serving_g).toBe(170);
    expect(food?.kcal_100g).toBe(63);
  });

  it("markerer manglende tal og regner kcal ud fra kJ, hvis kcal mangler", () => {
    const food = mapOffProduct({
      code: "123456789",
      product_name: "Ukendt bar",
      nutriments: { "energy-kj_100g": 2092, fat_100g: 20 },
    })!;
    expect(food.kcal_100g).toBe(500);
    expect(missingNutrients(food)).toEqual(["protein_100g", "carbs_100g"]);
  });

  it("springer produkter uden navn eller stregkode over", () => {
    expect(mapOffProduct({ code: "123", product_name: "" })).toBeNull();
    expect(mapOffProduct({ product_name: "Uden kode" })).toBeNull();
  });
});
