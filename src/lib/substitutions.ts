/**
 * Culinary Ingredient Substitution Engine
 * Provides practical, kitchen-tested substitutions for missing ingredients,
 * allergies, dietary requirements, and pantry alternatives.
 */

export type Substitution = {
  ingredientPattern: RegExp;
  ingredientName: string;
  substitutes: {
    name: string;
    ratio: string;
    notes?: string;
    dietaryTag?: "vegan" | "gluten_free" | "dairy_free" | "vegetarian";
  }[];
};

export const COMMON_SUBSTITUTIONS: Substitution[] = [
  {
    ingredientPattern: /\b(buttermilk)\b/i,
    ingredientName: "Buttermilk",
    substitutes: [
      {
        name: "Milk + Lemon Juice or White Vinegar",
        ratio: "1 cup milk + 1 tbsp lemon juice / vinegar (let stand 5 min)",
        notes: "Matches the acidity and leavening activation in baking.",
      },
      {
        name: "Plain Yogurt + Water",
        ratio: "¾ cup plain yogurt + ¼ cup water or milk",
        notes: "Great thick substitute for pancakes and marinades.",
      },
    ],
  },
  {
    ingredientPattern: /\b(sour cream|crème fraîche|creme fraiche)\b/i,
    ingredientName: "Sour Cream / Crème Fraîche",
    substitutes: [
      {
        name: "Plain Greek Yogurt",
        ratio: "1:1 equal amount",
        notes: "Higher in protein with the exact same tangy richness.",
      },
      {
        name: "Coconut Cream + Lemon Juice",
        ratio: "1 cup chilled coconut cream + 1 tsp lemon juice",
        dietaryTag: "dairy_free",
        notes: "Rich dairy-free and vegan alternative.",
      },
    ],
  },
  {
    ingredientPattern: /\b(heavy cream|double cream|heavy whipping cream)\b/i,
    ingredientName: "Heavy Cream",
    substitutes: [
      {
        name: "Milk + Melted Butter",
        ratio: "¾ cup whole milk + ¼ cup melted butter",
        notes: "Suitable for cooking and sauces (cannot be whipped into stiff peaks).",
      },
      {
        name: "Full-Fat Coconut Cream",
        ratio: "1:1 equal amount",
        dietaryTag: "dairy_free",
        notes: "Great for rich curries, soups, and dairy-free desserts.",
      },
    ],
  },
  {
    ingredientPattern: /\b(egg|eggs)\b/i,
    ingredientName: "Eggs (Baking)",
    substitutes: [
      {
        name: "Applesauce (Unsweetened)",
        ratio: "¼ cup applesauce per 1 egg",
        dietaryTag: "vegan",
        notes: "Keeps quick breads, muffins, and brownies moist.",
      },
      {
        name: "Mashed Ripe Banana",
        ratio: "½ mashed banana per 1 egg",
        dietaryTag: "vegan",
        notes: "Adds mild natural sweetness to pancakes and bakes.",
      },
      {
        name: "Flax Egg",
        ratio: "1 tbsp ground flaxseed + 3 tbsp water (rest 5 min)",
        dietaryTag: "vegan",
        notes: "Ideal binding agent for cookies and whole grain baking.",
      },
    ],
  },
  {
    ingredientPattern: /\b(butter)\b/i,
    ingredientName: "Butter",
    substitutes: [
      {
        name: "Coconut Oil or Olive Oil",
        ratio: "1:1 for cooking, or ¾ cup olive oil per 1 cup butter in baking",
        dietaryTag: "dairy_free",
        notes: "Olive oil is ideal for savory cooking and rich dressings.",
      },
      {
        name: "Applesauce (in sweet bakes)",
        ratio: "½ cup applesauce per 1 cup butter",
        notes: "Significantly cuts fat while retaining tender crumb.",
      },
    ],
  },
  {
    ingredientPattern: /\b(soy sauce|shoyu)\b/i,
    ingredientName: "Soy Sauce",
    substitutes: [
      {
        name: "Tamari",
        ratio: "1:1 equal amount",
        dietaryTag: "gluten_free",
        notes: "Naturally gluten-free with deep umami flavor.",
      },
      {
        name: "Coconut Aminos",
        ratio: "1:1 (add pinch of salt if needed)",
        dietaryTag: "gluten_free",
        notes: "Lower sodium, soy-free and naturally gluten-free.",
      },
    ],
  },
  {
    ingredientPattern: /\b(white wine)\b/i,
    ingredientName: "White Wine (Cooking)",
    substitutes: [
      {
        name: "Chicken or Vegetable Broth + Lemon Juice",
        ratio: "1 cup broth + 1 tbsp fresh lemon juice or white wine vinegar",
        notes: "Replicates both the body and bright acidity in deglazing.",
      },
      {
        name: "Apple Cider Vinegar + Water",
        ratio: "½ cup water + ½ cup apple cider vinegar",
        notes: "Great for braises and deglazing fond.",
      },
    ],
  },
  {
    ingredientPattern: /\b(red wine)\b/i,
    ingredientName: "Red Wine (Cooking)",
    substitutes: [
      {
        name: "Beef Broth + Red Wine Vinegar",
        ratio: "1 cup beef broth + 2 tbsp red wine vinegar",
        notes: "Adds depth and slight acidity to rich stews and ragùs.",
      },
    ],
  },
  {
    ingredientPattern: /\b(cornstarch|corn starch)\b/i,
    ingredientName: "Cornstarch (Thickener)",
    substitutes: [
      {
        name: "All-Purpose Flour",
        ratio: "2 tbsp flour per 1 tbsp cornstarch",
        notes: "Cook for an extra 1-2 minutes to eliminate raw flour taste.",
      },
      {
        name: "Arrowroot or Tapioca Starch",
        ratio: "1:1 equal amount",
        dietaryTag: "gluten_free",
        notes: "Leaves glossy, clear sauces without altering flavor.",
      },
    ],
  },
  {
    ingredientPattern: /\b(garlic clove|garlic cloves|fresh garlic)\b/i,
    ingredientName: "Fresh Garlic",
    substitutes: [
      {
        name: "Garlic Powder",
        ratio: "⅛ tsp garlic powder per 1 clove",
        notes: "Concentrated dry flavor, perfect for rubs and sauces.",
      },
      {
        name: "Garlic Paste / Minced Garlic",
        ratio: "½ tsp minced garlic per 1 clove",
      },
    ],
  },
  {
    ingredientPattern: /\b(fresh ginger|ginger root)\b/i,
    ingredientName: "Fresh Ginger",
    substitutes: [
      {
        name: "Ground Ginger Powder",
        ratio: "¼ tsp ground ginger per 1 tbsp grated fresh ginger",
        notes: "Potent dry substitute for stir-fries and dressings.",
      },
    ],
  },
  {
    ingredientPattern: /\b(ricotta|ricotta cheese)\b/i,
    ingredientName: "Ricotta Cheese",
    substitutes: [
      {
        name: "Cottage Cheese (Blended)",
        ratio: "1:1 blended until smooth",
        notes: "Higher protein, lower fat, identical texture in lasagna.",
      },
      {
        name: "Silken Tofu",
        ratio: "1:1 mashed with pinch of salt & lemon",
        dietaryTag: "vegan",
        notes: "Superb plant-based filling for pasta and bakes.",
      },
    ],
  },
  {
    ingredientPattern: /\b(honey|maple syrup)\b/i,
    ingredientName: "Honey / Maple Syrup",
    substitutes: [
      {
        name: "Agave Nectar",
        ratio: "1:1 equal amount",
        dietaryTag: "vegan",
        notes: "Dissolves easily in cold and hot liquids.",
      },
      {
        name: "Brown Sugar Syrup",
        ratio: "1:1 (made by simmering equal parts brown sugar & water)",
      },
    ],
  },
];

/**
 * Finds substitution options for a given ingredient name.
 */
export function findSubstitutionsForIngredient(ingredientText: string): Substitution | null {
  for (const item of COMMON_SUBSTITUTIONS) {
    if (item.ingredientPattern.test(ingredientText)) {
      return item;
    }
  }
  return null;
}
