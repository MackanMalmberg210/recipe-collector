import type { AppRecipe } from "../../../lib/types";

export type SnackSlot = "morning_snack" | "afternoon_snack" | "evening_snack";

export interface SnackSlotConfig {
  badge: string;
  title: string;
  subtitle: string;
  recommendedTitle: string;
  gridTitle: string;
}

export function getSnackSlotConfig(slot: SnackSlot = "morning_snack"): SnackSlotConfig {
  switch (slot) {
    case "afternoon_snack":
      return {
        badge: "AFTERNOON SNACK",
        title: "Choose afternoon snack",
        subtitle: "Energizing, healthy options from your cookbook.",
        recommendedTitle: "Recommended for your afternoon",
        gridTitle: "Afternoon-friendly recipes",
      };
    case "evening_snack":
      return {
        badge: "EVENING SNACK",
        title: "Choose evening snack",
        subtitle: "Light, satisfying options from your cookbook.",
        recommendedTitle: "Recommended for your evening",
        gridTitle: "Evening-friendly recipes",
      };
    case "morning_snack":
    default:
      return {
        badge: "MORNING SNACK",
        title: "Choose morning snack",
        subtitle: "Quick, healthy options from your cookbook.",
        recommendedTitle: "Recommended for your morning",
        gridTitle: "Morning-friendly recipes",
      };
  }
}

export type MorningFilterId =
  | "all"
  | "recommended"
  | "quick"
  | "under500"
  | "my-recipes"
  | "imported";


export type MorningSortId =
  | "recommended"
  | "recent"
  | "quickest"
  | "lowest-calories"
  | "highest-protein";

export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Strict exclusion list: any recipe matching these categories, meal types,
 * tags, or titles is strictly barred from Morning Snack selections.
 */
const FORBIDDEN_TOKENS = new Set([
  "dinner",
  "main course",
  "main-course",
  "main",
  "pasta",
  "spaghetti",
  "fettuccine",
  "penne",
  "cacio e pepe",
  "meatball",
  "meatballs",
  "köttbullar",
  "steak",
  "sirloin",
  "beef",
  "stir-fry",
  "stirfry",
  "wok",
  "soup",
  "soppa",
  "dahl",
  "curry",
  "gryta",
  "taco",
  "tacos",
  "baja",
  "gyros",
  "salmon",
  "lax",
  "pork",
  "flank",
]);

/**
 * Positive tokens that identify genuine morning snacks & quick bites.
 */
const MORNING_POSITIVE_TOKENS = new Set([
  "snack",
  "mellanmål",
  "breakfast",
  "frukost",
  "brunch",
  "smoothie",
  "fruit",
  "frukt",
  "yogurt",
  "yoghurt",
  "parfait",
  "oats",
  "havregryn",
  "porridge",
  "gröt",
  "chia",
  "banana",
  "banan",
  "apple",
  "äpple",
  "berries",
  "bär",
  "toast",
  "egg",
  "ägg",
  "pancake",
  "pancakes",
  "pannkaka",
  "waffle",
  "waffles",
  "energy",
  "bite",
  "bites",
  "bar",
  "nuts",
  "nötter",
  "almond",
  "peanut",
  "rice cake",
  "hummus",
  "avocado",
  "light meal",
  "quick-bite",
  "quick",
]);

/**
 * Validates whether a recipe is genuinely suitable for a Morning Snack slot.
 * Returns false if it contains any forbidden dinner/main-course indicators.
 */
export function isMorningSnackAppropriate(recipe: AppRecipe): boolean {
  const mealType = normalizeText(recipe.mealType ?? "");
  const category = normalizeText(recipe.category ?? "");
  const title = normalizeText(recipe.title);
  const tags = (recipe.tags ?? []).map(normalizeText);

  // 1. HARD EXCLUSION: If designated as dinner or main course
  if (
    mealType === "dinner" ||
    mealType === "main course" ||
    category === "dinner" ||
    category === "main-course" ||
    category === "soup" ||
    category === "stir-fry" ||
    category === "pasta"
  ) {
    // Only exception is if it's explicitly flagged as a snack/breakfast override
    if (mealType !== "snack" && mealType !== "breakfast" && category !== "snack") {
      return false;
    }
  }

  // 2. CHECK FORBIDDEN WORDS IN TITLE OR TAGS
  for (const token of FORBIDDEN_TOKENS) {
    if (tags.includes(token)) return false;
    if (title.includes(token)) return false;
    if (category === token) return false;
  }

  // 3. CALORIC CEILING: A morning snack shouldn't be an 800 kcal feast
  if (recipe.calories !== undefined && recipe.calories > 650 && mealType !== "snack") {
    return false;
  }

  // 4. POSITIVE MATCH CRITERIA
  if (mealType === "breakfast" || mealType === "snack" || mealType === "brunch") {
    return true;
  }
  if (
    category === "breakfast" ||
    category === "snack" ||
    category === "smoothie" ||
    category === "appetizer" ||
    category === "baking"
  ) {
    return true;
  }

  const allTokens = [title, category, mealType, ...tags].join(" ");
  for (const token of MORNING_POSITIVE_TOKENS) {
    if (allTokens.includes(token)) return true;
  }

  // Fast recipes under 15m with moderate calories
  if (recipe.cookTime !== undefined && recipe.cookTime <= 15) {
    if (recipe.calories !== undefined && recipe.calories <= 450) {
      return true;
    }
  }

  return false;
}

/**
 * Deduplicates recipes:
 * 1. Primary: unique recipe.id
 * 2. Secondary: unique normalized title (with multi-language synonym mapping)
 */
export function deduplicateRecipes(recipes: AppRecipe[]): AppRecipe[] {
  const seenIds = new Set<number>();
  const seenTitles = new Set<string>();
  const deduped: AppRecipe[] = [];

  const SYNONYMS: Record<string, string> = {
    "banan": "banana",
    "äpple": "apple",
    "crisp apple": "apple",
    "fresh banana": "banana",
    "yoghurt": "yogurt",
    "keso": "cottage cheese",
    "ägg": "egg",
  };

  for (const recipe of recipes) {
    if (seenIds.has(recipe.id)) continue;
    let normalizedTitle = normalizeText(recipe.title);
    if (SYNONYMS[normalizedTitle]) {
      normalizedTitle = SYNONYMS[normalizedTitle];
    }
    if (seenTitles.has(normalizedTitle)) continue;

    seenIds.add(recipe.id);
    seenTitles.add(normalizedTitle);
    deduped.push(recipe);
  }

  return deduped;
}

/**
 * Multi-token fuzzy/substring matching across title, ingredients, tags, category.
 */
export function fuzzyMatchesRecipe(recipe: AppRecipe, query: string): boolean {
  if (!query) return true;
  const cleanQuery = normalizeText(query);
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return true;

  const title = normalizeText(recipe.title);
  const category = normalizeText(recipe.category ?? "");
  const mealType = normalizeText(recipe.mealType ?? "");
  const tags = (recipe.tags ?? []).map(normalizeText).join(" ");
  const ingredients = (recipe.ingredients ?? []).map(normalizeText).join(" ");

  const combinedSearchCorpus = `${title} ${category} ${mealType} ${tags} ${ingredients}`;

  // Every token in the user's query must match somewhere in the corpus
  return queryTokens.every((token) => combinedSearchCorpus.includes(token));
}

/**
 * Computes a suitability score for snack recommendation ranking based on slot.
 * Higher score = more suitable candidate for the specified snack time.
 */
export function calculateSnackScore(recipe: AppRecipe, slot: SnackSlot = "morning_snack"): number {
  let score = 0;
  const mealType = normalizeText(recipe.mealType ?? "");
  const category = normalizeText(recipe.category ?? "");
  const title = normalizeText(recipe.title);
  const tags = (recipe.tags ?? []).map(normalizeText);

  // Prepared recipe bonus: real snacks with ingredients & prep get priority over raw groceries
  const ingredientCount = recipe.ingredients?.length ?? 0;
  if (ingredientCount >= 2) {
    score += 14;
  } else {
    // Single raw items (e.g. "Banana" or "Crisp Apple") stay searchable but don't flood recommendations
    score -= 6;
  }

  // General snack meal type & category boost
  if (mealType === "snack") score += 12;
  if (category === "snack") score += 10;
  if (category === "appetizer" || category === "baking") score += 4;

  // Slot-specific category & keyword bonuses
  if (slot === "morning_snack") {
    if (mealType === "breakfast" || category === "breakfast") score += 8;
    if (category === "smoothie") score += 10;
    // Favourites: yogurt/parfait/kvarg, chia pudding, eggs, smoothies, oats, toast
    if (/chia|pudding/i.test(title)) score += 10;
    if (/yogurt|parfait|yoghurt|kvarg|quark/i.test(title)) score += 10;
    if (/egg|ägg|toast/i.test(title)) score += 9;
    if (/smoothie/i.test(title)) score += 9;
    if (/oats|porridge|gröt/i.test(title)) score += 7;

    if (recipe.calories !== undefined) {
      if (recipe.calories >= 120 && recipe.calories <= 320) score += 8;
      else if (recipe.calories <= 450) score += 4;
      else score -= 4;
    }
  } else if (slot === "afternoon_snack") {
    if (tags.includes("energy") || tags.includes("protein") || tags.includes("high-protein")) score += 8;
    if (/energy|bite|nuts|hummus|protein|shake|bar|dip|avocado|rice cake/i.test(title)) {
      score += 8;
    }
    if (/egg|ägg|cottage/i.test(title)) score += 7;
    if (recipe.calories !== undefined) {
      if (recipe.calories >= 120 && recipe.calories <= 350) score += 8;
      else if (recipe.calories <= 450) score += 4;
      else score -= 4;
    }
  } else if (slot === "evening_snack") {
    // Evening snack: prefer light, low-calorie, relaxing bites
    if (/yogurt|yoghurt|kvarg|berry|berries|tea|cottage|chia|fruit|almond/i.test(title)) {
      score += 8;
    }
    if (recipe.calories !== undefined) {
      if (recipe.calories <= 220) score += 10;
      else if (recipe.calories <= 320) score += 6;
      else score -= 6;
    }
  }

  // Prep speed (fast is ideal for snacks)
  if (recipe.cookTime !== undefined) {
    if (recipe.cookTime <= 5) score += 6;
    else if (recipe.cookTime <= 10) score += 5;
    else if (recipe.cookTime <= 15) score += 3;
    else if (recipe.cookTime > 25) score -= 6;
  }

  // Protein / energy bonuses across all snacks
  if (tags.includes("protein") || tags.includes("high-protein")) score += 4;
  if (tags.includes("energy") || tags.includes("quick")) score += 3;

  return score;
}

export const calculateMorningScore = (recipe: AppRecipe) => calculateSnackScore(recipe, "morning_snack");

/**
 * Filter, rank, and sort snack recipes according to user query, active filter chip,
 * slot type, and selected sort metric.
 */
export function filterAndRankSnackRecipes({
  recipes,
  query,
  activeFilter,
  sortId,
  slot = "morning_snack",
  showAllCookbook = false,
  selectedRecipeId = null,
}: {
  recipes: AppRecipe[];
  query: string;
  activeFilter: MorningFilterId;
  sortId: MorningSortId;
  slot?: SnackSlot;
  showAllCookbook?: boolean;
  selectedRecipeId?: number | null;
}): {
  recommendedRecipes: AppRecipe[];
  filteredRecipes: AppRecipe[];
  totalAvailableCount: number;
} {
  // 1. Deduplicate first
  const deduped = deduplicateRecipes(recipes);

  // 2. Base filter: Snack-appropriate ONLY (unless user explicitly requested entire cookbook)
  const candidatePool = deduped.filter((recipe) => {
    if (showAllCookbook) return true;
    return isMorningSnackAppropriate(recipe);
  });

  const totalAvailableCount = candidatePool.length;

  // 3. Search filter
  const searchFiltered = candidatePool.filter((recipe) =>
    fuzzyMatchesRecipe(recipe, query),
  );

  // 4. Chip filter
  const chipFiltered = searchFiltered.filter((recipe) => {
    switch (activeFilter) {
      case "recommended":
        return calculateSnackScore(recipe, slot) >= 16;
      case "quick":
        return recipe.cookTime !== undefined && recipe.cookTime <= 15;
      case "under500":
        return recipe.calories !== undefined && recipe.calories <= 500;
      case "my-recipes":
        return recipe.origin === "user";
      case "imported":
        return recipe.origin === "imported";
      case "all":
      default:
        return true;
    }
  });

  // 5. Calculate Top Recommendations with CATEGORY DIVERSITY
  // Sort candidate pool by score
  const sortedCandidates = [...candidatePool].sort(
    (a, b) => calculateSnackScore(b, slot) - calculateSnackScore(a, slot),
  );

  const recommendedCandidates: AppRecipe[] = [];
  const pickedCategories = new Set<string>();

  // First pass: pick highest scoring from distinct categories
  for (const r of sortedCandidates) {
    if (recommendedCandidates.length >= 4) break;
    const cat = r.category || "snack";
    if (!pickedCategories.has(cat)) {
      recommendedCandidates.push(r);
      pickedCategories.add(cat);
    }
  }

  // Second pass: fill up to 4 if fewer than 4 distinct categories existed
  for (const r of sortedCandidates) {
    if (recommendedCandidates.length >= 4) break;
    if (!recommendedCandidates.some((existing) => existing.id === r.id)) {
      recommendedCandidates.push(r);
    }
  }


  // 6. Sort remaining filtered list
  const sorted = [...chipFiltered].sort((a, b) => {
    // Keep currently selected recipe pinned to the top if present
    if (selectedRecipeId) {
      if (a.id === selectedRecipeId) return -1;
      if (b.id === selectedRecipeId) return 1;
    }

    switch (sortId) {
      case "recent":
        return b.id - a.id;
      case "quickest":
        return (a.cookTime ?? 999) - (b.cookTime ?? 999);
      case "lowest-calories":
        return (a.calories ?? 9999) - (b.calories ?? 9999);
      case "highest-protein": {
        const aProtein =
          (a.tags?.includes("protein") ? 10 : 0) +
          (a.tags?.includes("high-protein") ? 15 : 0);
        const bProtein =
          (b.tags?.includes("protein") ? 10 : 0) +
          (b.tags?.includes("high-protein") ? 15 : 0);
        return bProtein - aProtein;
      }
      case "recommended":
      default:
        return calculateSnackScore(b, slot) - calculateSnackScore(a, slot);
    }
  });

  return {
    recommendedRecipes: recommendedCandidates,
    filteredRecipes: sorted,
    totalAvailableCount,
  };
}

export const filterAndRankMorningRecipes = filterAndRankSnackRecipes;

