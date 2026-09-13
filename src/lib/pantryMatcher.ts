import type { AppRecipe } from "./types";
import type { PantryItem } from "./groceries";
import { sanitizeCulinaryText } from "./culinaryTextSanitizer";
import { parseIngredientString } from "./ingredientParser";

export type PantryRecipeMatch = {
  recipe: AppRecipe;
  totalIngredientsCount: number;
  matchedIngredientsCount: number;
  missingIngredientsCount: number;
  matchPercentage: number;
  matchedItems: string[];
  missingItems: string[];
};

// Non-discriminating descriptors / states / forms that MUST NEVER be the sole basis of a match
const CULINARY_DESCRIPTORS = new Set([
  "powder", "powdered", "ground", "crushed", "whole", "diced", "sliced", "chopped",
  "minced", "shredded", "grated", "raw", "cooked", "uncooked", "roasted", "toasted",
  "smoked", "steamed", "fried", "baked", "boiled", "creamy", "chunky", "smooth",
  "crispy", "crisp", "canned", "fresh", "freshly", "frozen", "dried", "dry", "organic",
  "pure", "extra", "virgin", "black", "white", "brown", "red", "green", "yellow",
  "sweet", "hot", "spicy", "mild", "bitter", "sour", "salted", "unsalted", "baby",
  "large", "medium", "small", "leaves", "leaf", "seeds", "seed", "cloves", "clove",
  "stalks", "stalk", "head", "heads", "bunches", "bunch", "pieces", "piece", "flakes",
  "flake", "sauce", "paste", "extract", "oil", "vinegar", "can", "cans", "jar", "jars",
  "cup", "cups", "tbsp", "tsp", "tablespoon", "tablespoons", "teaspoon", "teaspoons",
  "pinch", "dash", "slice", "slices", "half", "halved", "halves", "drizzle", "handful",
  "färsk", "fryst", "hackad", "skivad", "riven", "tärnad", "krossad", "mald", "malen",
  "torr", "torkad", "eko", "ekologisk", "kallpressad", "and", "or", "for", "to", "taste",
  "serving", "garnish", "optional", "divided", "st", "msk", "tsk", "krm"
]);

// Canonical culinary equivalence classes
const CANONICAL_EQUIVALENCES: Array<{ key: string; patterns: RegExp[] }> = [
  {
    key: "salt",
    patterns: [/\b(sea\s+salt|kosher\s+salt|table\s+salt|flaky\s+salt|fine\s+salt|havssalt|flingsalt|salt)\b/i],
  },
  {
    key: "black_pepper",
    patterns: [/\b(black\s+pepper|ground\s+black\s+pepper|black\s+peppercorns|peppercorns|svartpeppar)\b/i],
  },
  {
    key: "white_pepper",
    patterns: [/\b(white\s+pepper|vitpeppar)\b/i],
  },
  {
    key: "olive_oil",
    patterns: [/\b(extra\s+virgin\s+olive\s+oil|olive\s+oil|evoo|olivolja)\b/i],
  },
  {
    key: "sesame_oil",
    patterns: [/\b(toasted\s+sesame\s+oil|sesame\s+oil|sesamolja)\b/i],
  },
  {
    key: "vegetable_oil",
    patterns: [/\b(vegetable\s+oil|canola\s+oil|neutral\s+oil|cooking\s+oil|matolja|rapsolja|solrosolja)\b/i],
  },
  {
    key: "soy_sauce",
    patterns: [/\b(soy\s+sauce|tamari|dark\s+soy\s+sauce|light\s+soy\s+sauce|sojasås|japansk\s+soja|kinesisk\s+soja|soja)\b/i],
  },
  {
    key: "balsamic_vinegar",
    patterns: [/\b(balsamic\s+vinegar|balsamic\s+glaze|balsamico|balsamvinäger)\b/i],
  },
  {
    key: "dijon_mustard",
    patterns: [/\b(dijon\s+mustard|dijonsenap)\b/i],
  },
  {
    key: "mayonnaise",
    patterns: [/\b(mayonnaise|mayo|majonnäs)\b/i],
  },
  {
    key: "honey",
    patterns: [/\b(honey|raw\s+honey|pure\s+honey|honung)\b/i],
  },
  {
    key: "sriracha",
    patterns: [/\b(sriracha|srirachasås)\b/i],
  },
  {
    key: "garlic_powder",
    patterns: [/\b(garlic\s+powder|vitlökspulver)\b/i],
  },
  {
    key: "onion_powder",
    patterns: [/\b(onion\s+powder|lökpulver)\b/i],
  },
  {
    key: "paprika_powder",
    patterns: [/\b(paprika\s+powder|smoked\s+paprika|sweet\s+paprika|paprikapulver|rökt\s+paprikapulver)\b/i],
  },
  {
    key: "ground_cumin",
    patterns: [/\b(ground\s+cumin|cumin\s+powder|cumin|spiskummin)\b/i],
  },
  {
    key: "chili_flakes",
    patterns: [/\b(chili\s+flakes|red\s+pepper\s+flakes|chiliflakes|chiliflingor)\b/i],
  },
  {
    key: "oregano",
    patterns: [/\b(dried\s+oregano|oregano)\b/i],
  },
  {
    key: "thyme",
    patterns: [/\b(dried\s+thyme|fresh\s+thyme|thyme|timjan)\b/i],
  },
  {
    key: "cinnamon",
    patterns: [/\b(ground\s+cinnamon|cinnamon\s+stick|cinnamon|kanel)\b/i],
  },
  {
    key: "flour",
    patterns: [/\b(all-purpose\s+flour|plain\s+flour|wheat\s+flour|vetemjöl|flour)\b/i],
  },
  {
    key: "white_sugar",
    patterns: [/\b(white\s+sugar|granulated\s+sugar|strösocker|sugar|socker)\b/i],
  },
  {
    key: "brown_sugar",
    patterns: [/\b(brown\s+sugar|light\s+brown\s+sugar|dark\s+brown\s+sugar|farinsocker|brunt\s+socker)\b/i],
  },
  {
    key: "baking_powder",
    patterns: [/\b(baking\s+powder|bakpulver)\b/i],
  },
  {
    key: "dry_yeast",
    patterns: [/\b(dry\s+yeast|active\s+dry\s+yeast|instant\s+yeast|torrjäst|jäst)\b/i],
  },
  {
    key: "pasta",
    patterns: [/\b(pasta|spaghetti|fettuccine|penne|rigatoni|fusilli|linguine|tagliatelle|macaroni|makaroner)\b/i],
  },
  {
    key: "jasmine_rice",
    patterns: [/\b(jasmine\s+rice|jasminris)\b/i],
  },
  {
    key: "oats",
    patterns: [/\b(rolled\s+oats|old-fashioned\s+oats|quick\s+oats|steel-cut\s+oats|oats|oatmeal|havregryn)\b/i],
  },
  {
    key: "breadcrumbs",
    patterns: [/\b(panko\s+breadcrumbs|panko|breadcrumbs|ströbröd)\b/i],
  },
  {
    key: "canned_tomatoes",
    patterns: [/\b(canned\s+diced\s+tomatoes|crushed\s+tomatoes|diced\s+tomatoes|canned\s+tomatoes|krossade\s+tomater|tomatkross)\b/i],
  },
  {
    key: "canned_black_beans",
    patterns: [/\b(canned\s+black\s+beans|black\s+beans|svarta\s+bönor)\b/i],
  },
  {
    key: "dairy_butter",
    patterns: [/\b(unsalted\s+butter|salted\s+butter|butter|smör)\b/i],
  },
  {
    key: "eggs",
    patterns: [/\b(eggs?|egg\s+yolks?|egg\s+whites?|ägg)\b/i],
  },
  {
    key: "dairy_milk",
    patterns: [/\b(whole\s+milk|skim\s+milk|dairy\s+milk|milk|mjölk|standardmjölk|mellanmjölk)\b/i],
  },
  {
    key: "parmesan",
    patterns: [/\b(parmesan\s+cheese|parmigiano-reggiano|parmigiano|parmesan|parmesanost)\b/i],
  },
  {
    key: "garlic_fresh",
    patterns: [/\b(garlic\s+cloves?|fresh\s+garlic|head\s+of\s+garlic|garlic|vitlöksklyftor?|vitlök)\b/i],
  },
  {
    key: "yellow_onion",
    patterns: [/\b(yellow\s+onions?|brown\s+onions?|onions?|gul\s+lök|lök)\b/i],
  },
  {
    key: "potatoes",
    patterns: [/\b(potatoes?|russet\s+potatoes?|baby\s+potatoes?|potatis|potatisar)\b/i],
  },
  // Specific non-staples that often get falsely matched
  {
    key: "almond_butter",
    patterns: [/\b(creamy\s+almond\s+butter|almond\s+butter|mandelsmör)\b/i],
  },
  {
    key: "peanut_butter",
    patterns: [/\b(creamy\s+peanut\s+butter|crunchy\s+peanut\s+butter|peanut\s+butter|jordnötssmör)\b/i],
  },
  {
    key: "cacao_powder",
    patterns: [/\b(raw\s+cacao\s+powder|cacao\s+powder|cocoa\s+powder|unsweetened\s+cocoa|kakao|kakaopulver)\b/i],
  },
  {
    key: "flaxseed",
    patterns: [/\b(ground\s+flaxseed|flaxseed\s+meal|flaxseeds?|flax\s+seeds?|linfrön?|krossade\s+linfrön)\b/i],
  },
  {
    key: "chia_seeds",
    patterns: [/\b(chia\s+seeds?|chiafrön?)\b/i],
  },
  {
    key: "salmon",
    patterns: [/\b(salmon\s+fillet|salmon\s+fillets|salmon|laxfilé|lax)\b/i],
  },
  {
    key: "chicken_breast",
    patterns: [/\b(chicken\s+breasts?|kycklingbröst|kycklingfilé)\b/i],
  },
  {
    key: "chicken_thighs",
    patterns: [/\b(chicken\s+thighs?|kycklinglår|kycklinglårfilé)\b/i],
  },
  {
    key: "beef",
    patterns: [/\b(ground\s+beef|flank\s+steak|sirloin\s+steak|steak|beef|nötfärs|köttfärs|biff)\b/i],
  }
];

function getCanonicalClass(text: string): string | null {
  const lower = text.toLowerCase();
  for (const item of CANONICAL_EQUIVALENCES) {
    for (const pat of item.patterns) {
      if (pat.test(lower)) {
        return item.key;
      }
    }
  }
  return null;
}

// Check hard negative guards between ingredient text and pantry text
function isNegativeGuardViolation(ingText: string, pantryText: string): boolean {
  const ing = ingText.toLowerCase();
  const pan = pantryText.toLowerCase();

  // 1. Nut/seed butter vs Dairy butter
  const ingIsNutButter = /\b(almond|peanut|cashew|sunflower|seed)\s+butter\b/i.test(ing) || /mandelsmör|jordnötssmör/i.test(ing);
  const panIsNutButter = /\b(almond|peanut|cashew|sunflower|seed)\s+butter\b/i.test(pan) || /mandelsmör|jordnötssmör/i.test(pan);
  const ingIsDairyButter = /\bbutter\b/i.test(ing) && !ingIsNutButter;
  const panIsDairyButter = /\bbutter\b/i.test(pan) && !panIsNutButter;
  if ((ingIsNutButter && panIsDairyButter) || (ingIsDairyButter && panIsNutButter)) return true;

  // 2. Non-dairy milk vs Dairy milk
  const ingIsPlantMilk = /\b(almond|coconut|oat|soy|cashew|hemp|rice)\s+milk\b/i.test(ing) || /mandelmjölk|havremjölk|kokosmjölk|sojamjölk/i.test(ing);
  const panIsPlantMilk = /\b(almond|coconut|oat|soy|cashew|hemp|rice)\s+milk\b/i.test(pan) || /mandelmjölk|havremjölk|kokosmjölk|sojamjölk/i.test(pan);
  const ingIsDairyMilk = /\bmilk\b/i.test(ing) && !ingIsPlantMilk;
  const panIsDairyMilk = /\bmilk\b/i.test(pan) && !panIsPlantMilk;
  if ((ingIsPlantMilk && panIsDairyMilk) || (ingIsDairyMilk && panIsPlantMilk)) return true;

  // 3. Black pepper spice vs Bell pepper vegetable vs Chili
  const ingIsBellPepper = /\bbell\s+pepper\b/i.test(ing) || (/\bpaprika\b/i.test(ing) && !/pulver|powder/i.test(ing));
  const panIsBlackPepper = /\bblack\s+pepper\b/i.test(pan) || /\bsvartpeppar\b/i.test(pan);
  if (ingIsBellPepper && panIsBlackPepper) return true;
  if (/\bblack\s+pepper\b/i.test(ing) && /\bblack\s+beans\b/i.test(pan)) return true;
  if (/\bblack\s+beans\b/i.test(ing) && /\bblack\s+pepper\b/i.test(pan)) return true;

  // 4. Rice cakes vs Rice
  if (/\brice\s+cakes?\b/i.test(ing) && !/\brice\s+cakes?\b/i.test(pan)) return true;
  if (!/\brice\s+cakes?\b/i.test(ing) && /\brice\s+cakes?\b/i.test(pan)) return true;

  // 5. Powders: Cacao powder vs Garlic powder / Baking powder / Paprika powder
  const isCacao = /\b(cacao|cocoa|kakao)\b/i.test(ing);
  const panIsOtherPowder = /\b(garlic|onion|baking|paprika|chili|curry)\s+powder\b/i.test(pan) || /\bbakpulver\b/i.test(pan);
  if (isCacao && panIsOtherPowder) return true;

  // 6. Flaxseed vs Cumin or Salmon
  if (/\b(flax|flaxseed|linfrö)\b/i.test(ing) && /\b(cumin|spiskummin|salmon|lax)\b/i.test(pan)) return true;

  // 7. Ground meat vs Ground spice
  const ingIsGroundMeat = /\bground\s+(beef|pork|turkey|chicken|lamb)\b/i.test(ing) || /färs/i.test(ing);
  const panIsGroundSpice = /\bground\s+(cumin|cinnamon|ginger|coriander|cloves|nutmeg)\b/i.test(pan);
  if (ingIsGroundMeat && panIsGroundSpice) return true;

  // 8. Cheeses: Parmesan vs Feta vs Mozzarella vs Cheddar vs Cottage
  const cheeses = ["parmesan", "feta", "mozzarella", "cheddar", "cottage", "ricotta", "goat"];
  const ingCheeses = cheeses.filter((c) => ing.includes(c));
  const panCheeses = cheeses.filter((c) => pan.includes(c));
  if (ingCheeses.length > 0 && panCheeses.length > 0) {
    if (!ingCheeses.some((c) => panCheeses.includes(c))) return true;
  }

  // 9. Allium powders vs Fresh alliums (garlic/onion powder vs fresh garlic/onion)
  const isAlliumPowder = (s: string) => /\b(garlic|onion)\s+powder\b/i.test(s) || /vitlökspulver|lökpulver/i.test(s);
  const isFreshAllium = (s: string) => /\b(fresh\s+garlic|garlic\s+cloves?|yellow\s+onion|red\s+onion|vitlök|lök)\b/i.test(s) && !isAlliumPowder(s);
  if ((isAlliumPowder(ing) && isFreshAllium(pan)) || (isFreshAllium(ing) && isAlliumPowder(pan))) return true;

  return false;
}

// Clean tokens for general fallback matching
function extractCleanCoreTokens(text: string): string[] {
  const sanitized = sanitizeCulinaryText(text).toLowerCase();
  const withoutNumbers = sanitized.replace(/[\d\/\.\,\-\–\—\(\)]+/g, " ");
  const tokens = withoutNumbers
    .split(/[\s,.-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !CULINARY_DESCRIPTORS.has(w));
  return tokens;
}

/**
 * Checks if a specific recipe ingredient string matches a pantry item.
 */
export function isIngredientPantryMatch(ingredientText: string, pantryItemName: string): boolean {
  if (!ingredientText || !pantryItemName) return false;

  if (isNegativeGuardViolation(ingredientText, pantryItemName)) {
    return false;
  }

  // 1. Check Canonical Equivalence classes
  const ingClass = getCanonicalClass(ingredientText);
  const panClass = getCanonicalClass(pantryItemName);
  if (ingClass && panClass) {
    return ingClass === panClass;
  }

  // 2. Parse structured ingredient name (e.g. "1/2 cup Creamy almond butter" -> "Creamy almond butter")
  const parsed = parseIngredientString(ingredientText);
  const ingCoreName = (parsed.name || ingredientText).toLowerCase().trim();
  const panLower = pantryItemName.toLowerCase().trim();

  // Exact match on cleaned name
  if (ingCoreName === panLower) return true;

  // 3. Fallback to core non-descriptor tokens
  const ingTokens = extractCleanCoreTokens(ingCoreName);
  const panTokens = extractCleanCoreTokens(panLower);

  if (ingTokens.length === 0 || panTokens.length === 0) return false;

  // An ingredient matches if all of the pantry's core tokens are in the ingredient,
  // or all of the ingredient's core tokens are in the pantry
  const allPanInIng = panTokens.every((pt) => ingTokens.includes(pt));
  const allIngInPan = ingTokens.every((it) => panTokens.includes(it));

  return allPanInIng || allIngInPan;
}

export function calculateRecipePantryMatch(
  recipe: AppRecipe,
  inStockPantryItems: PantryItem[],
  _precomputedPantryKeywords?: string[]
): PantryRecipeMatch {
  const inStock = inStockPantryItems.filter((p) => p.inStock);

  const ingredients = recipe.ingredients || [];
  const totalCount = Math.max(1, ingredients.length);

  const matchedItems: string[] = [];
  const missingItems: string[] = [];

  ingredients.forEach((ing) => {
    const rawClean = sanitizeCulinaryText(ing).trim();
    if (!rawClean) return;

    // Check if any in-stock pantry item genuinely matches this ingredient
    const hasMatch = inStock.some((pantryItem) =>
      isIngredientPantryMatch(rawClean, pantryItem.name)
    );

    if (hasMatch) {
      matchedItems.push(rawClean);
    } else {
      missingItems.push(rawClean);
    }
  });

  const matchedCount = matchedItems.length;
  const missingCount = missingItems.length;
  const matchPercentage = Math.round((matchedCount / totalCount) * 100);

  return {
    recipe,
    totalIngredientsCount: totalCount,
    matchedIngredientsCount: matchedCount,
    missingIngredientsCount: missingCount,
    matchPercentage,
    matchedItems,
    missingItems,
  };
}

export function findBestPantryMatches(
  recipes: AppRecipe[],
  pantryItems: PantryItem[],
  minMatchPercentage: number = 20
): PantryRecipeMatch[] {
  const inStock = pantryItems.filter((p) => p.inStock);
  if (inStock.length === 0 || recipes.length === 0) return [];

  // Deduplicate recipes by ID so identical recipes never compete or swap
  const uniqueRecipesMap = new Map<number | string, AppRecipe>();
  for (const r of recipes) {
    if (r && r.id != null && !uniqueRecipesMap.has(r.id)) {
      uniqueRecipesMap.set(r.id, r);
    }
  }

  const evaluated = Array.from(uniqueRecipesMap.values()).map((recipe) =>
    calculateRecipePantryMatch(recipe, inStock)
  );

  // Filter recipes that have at least some match and sort by highest match percentage with rock-solid tie-breakers
  return evaluated
    .filter((m) => m.matchedIngredientsCount > 0 && m.matchPercentage >= minMatchPercentage)
    .sort((a, b) => {
      // 1. Highest match percentage first
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      // 2. Fewest missing ingredients first
      if (a.missingIngredientsCount !== b.missingIngredientsCount) {
        return a.missingIngredientsCount - b.missingIngredientsCount;
      }
      // 3. Most matched ingredients first (e.g. 5/5 matched is richer than 1/1)
      if (b.matchedIngredientsCount !== a.matchedIngredientsCount) {
        return b.matchedIngredientsCount - a.matchedIngredientsCount;
      }
      // 4. Stable alphabetical title tie-breaker
      const titleA = (a.recipe.title || "").trim();
      const titleB = (b.recipe.title || "").trim();
      const titleDiff = titleA.localeCompare(titleB, "sv", { sensitivity: "base" });
      if (titleDiff !== 0) return titleDiff;
      // 5. Absolute ID tie-breaker
      return String(a.recipe.id).localeCompare(String(b.recipe.id));
    });
}

export function rollRandomPantryRecipe(matches: PantryRecipeMatch[]): PantryRecipeMatch | null {
  if (!matches || matches.length === 0) return null;
  // Weight towards top 50% matches
  const pool = matches.slice(0, Math.max(3, Math.ceil(matches.length * 0.6)));
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || matches[0];
}
