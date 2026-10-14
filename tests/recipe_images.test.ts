import { describe, it, expect } from "vitest";
import { recipes } from "../src/lib/mockData";

describe("Recipe database image integrity", () => {
  it("should have valid URLs for every single recipe", () => {
    expect(recipes.length).toBeGreaterThan(50);

    for (const r of recipes) {
      expect(r.image, `Recipe ID ${r.id} (${r.title}) has missing image`).toBeTruthy();
      expect(r.image.startsWith("http"), `Recipe ID ${r.id} (${r.title}) image is not http(s)`).toBe(true);
      expect(r.image.includes("img.spoonacular.com"), `Recipe ID ${r.id} still has broken spoonacular URL`).toBe(false);
      expect(r.image.includes("photo-1495521821757-a1efb6729352"), `Recipe ID ${r.id} still has generic tablet placeholder`).toBe(false);
    }
  });

  it("should have title, ingredients, instructions and nutritional info for all recipes", () => {
    for (const r of recipes) {
      expect(r.title.trim().length).toBeGreaterThan(3);
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.instructions.length).toBeGreaterThan(0);
      expect(r.cookTime).toBeDefined();
    }
  });
});
