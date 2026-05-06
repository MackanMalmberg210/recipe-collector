import type { MealType, RecipeCategory } from "./types";

type RecipeMetadataInput = {
   title: string;
   ingredients: string[];
   cookTime?: number;
   calories?: number;
};

type RecipeMetadataResult = {
   category: RecipeCategory;
   mealType: MealType;
   tags: string[];
};

type ScoreMap<T extends string> = Record<T, number>;

const CATEGORY_KEYWORDS: Record<RecipeCategory, string[]> = {
   "main-course": [],
   pasta: ["pasta", "spaghetti", "penne", "tagliatelle", "fusilli", "linguine"],
   rice: ["rice", "risotto", "fried rice"],
   salad: ["salad", "slaw"],
   soup: ["soup", "broth", "bisque"],
   sandwich: ["sandwich", "toast", "burger", "wrap", "bagel"],
   bowl: ["bowl", "poke", "grain bowl"],
   "stir-fry": ["stir fry", "stir-fry", "noodles"],
   breakfast: ["breakfast", "omelette", "oatmeal", "porridge", "pancake", "granola", "yogurt"],
   dessert: ["cake", "cookie", "brownie", "dessert", "ice cream", "muffin", "sweet"],
};

const MEAL_TYPE_KEYWORDS: Record<MealType, string[]> = {
   breakfast: ["breakfast", "omelette", "oatmeal", "porridge", "pancake", "granola", "yogurt", "toast", "egg"],
   lunch: ["salad", "wrap", "sandwich", "toast", "bowl", "soup"],
   dinner: ["pasta", "rice", "stir fry", "stir-fry", "curry", "bake", "roast"],
   snack: ["snack", "cookie", "muffin", "bar", "smoothie"],
};

const TAG_KEYWORDS: Record<string, string[]> = {
   vegetarian: ["halloumi", "tofu", "mozzarella", "parmesan", "cheddar", "feta", "spinach", "mushroom", "beans", "lentils"],
   vegan: ["tofu", "lentils", "beans", "chickpeas", "oat milk", "almond milk"],
   "high-protein": ["chicken", "beef", "turkey", "salmon", "tuna", "shrimp", "egg", "greek yogurt", "tofu"],
   quick: [],
   "low-calorie": [],
   creamy: ["cream", "creamy", "crème", "cheese sauce", "parmesan"],
   spicy: ["chili", "jalapeno", "sriracha", "cayenne", "hot sauce", "spicy"],
   "comfort-food": ["cream", "cheese", "butter", "bake", "gratin", "pasta"],
   chicken: ["chicken"],
   beef: ["beef"],
   pork: ["pork", "bacon", "ham"],
   fish: ["salmon", "tuna", "cod", "fish", "shrimp", "prawn"],
   pasta: ["pasta", "spaghetti", "penne", "tagliatelle", "fusilli", "linguine"],
   rice: ["rice", "risotto", "fried rice"],
   halloumi: ["halloumi"],
   soup: ["soup", "broth", "bisque"],
   salad: ["salad"],
   breakfast: ["breakfast", "omelette", "oatmeal", "porridge", "pancake", "granola", "yogurt", "egg"],
};

function normalize(value: string) {
   return value.trim().toLowerCase();
}

function tokenize(text: string) {
   return normalize(text)
      .replace(/[^\w\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
}

function includesPhrase(text: string, phrase: string) {
   return text.includes(normalize(phrase));
}

function countKeywordMatches(text: string, keywords: string[]) {
   return keywords.reduce((score, keyword) => {
      return score + (includesPhrase(text, keyword) ? 1 : 0);
   }, 0);
}

function createScoreMap<T extends string>(keys: readonly T[]): ScoreMap<T> {
   return keys.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
   }, {} as ScoreMap<T>);
}

function getTopScoringKey<T extends string>(
   scores: ScoreMap<T>,
   fallback: T,
): T {
   let bestKey = fallback;
   let bestScore = -Infinity;

   for (const [key, score] of Object.entries(scores) as [T, number][]) {
      if (score > bestScore) {
         bestKey = key;
         bestScore = score;
      }
   }

   return bestScore <= 0 ? fallback : bestKey;
}

export function generateRecipeMetadata({
   title,
   ingredients,
   cookTime,
   calories,
}: RecipeMetadataInput): RecipeMetadataResult {
   const combinedText = tokenize([title, ...ingredients].join(" "));
   const ingredientText = tokenize(ingredients.join(" "));

   const categoryKeys = Object.keys(CATEGORY_KEYWORDS) as RecipeCategory[];
   const mealTypeKeys = Object.keys(MEAL_TYPE_KEYWORDS) as MealType[];
   const tagKeys = Object.keys(TAG_KEYWORDS);

   const categoryScores = createScoreMap(categoryKeys);
   const mealTypeScores = createScoreMap(mealTypeKeys);
   const tagScores = createScoreMap(tagKeys);

   for (const category of categoryKeys) {
      categoryScores[category] += countKeywordMatches(
         combinedText,
         CATEGORY_KEYWORDS[category],
      );
   }

   for (const mealType of mealTypeKeys) {
      mealTypeScores[mealType] += countKeywordMatches(
         combinedText,
         MEAL_TYPE_KEYWORDS[mealType],
      );
   }

   for (const tag of tagKeys) {
      tagScores[tag] += countKeywordMatches(combinedText, TAG_KEYWORDS[tag]);
   }

   if (cookTime !== undefined) {
      if (cookTime <= 20) {
         tagScores.quick += 2;
         mealTypeScores.lunch += 1;
      } else if (cookTime >= 45) {
         tagScores["comfort-food"] += 1;
         mealTypeScores.dinner += 1;
      }
   }

   if (calories !== undefined) {
      if (calories <= 450) {
         tagScores["low-calorie"] += 2;
         mealTypeScores.lunch += 1;
      } else if (calories >= 700) {
         tagScores["comfort-food"] += 1;
         mealTypeScores.dinner += 1;
      }
   }

   const hasMeat =
      /chicken|beef|pork|bacon|ham|turkey|salmon|tuna|cod|fish|shrimp|prawn/.test(
         ingredientText,
      );

   const hasAnimalProducts =
      /egg|milk|cream|butter|cheese|parmesan|mozzarella|feta|halloumi|yogurt/.test(
         ingredientText,
      );

   const hasPlantProtein = /tofu|lentils|beans|chickpeas/.test(ingredientText);

   if (!hasMeat) {
      tagScores.vegetarian += 2;
   }

   if (!hasMeat && !hasAnimalProducts && hasPlantProtein) {
      tagScores.vegan += 2;
   }

   if (/pasta|spaghetti|penne|tagliatelle|fusilli|linguine/.test(combinedText)) {
      categoryScores.pasta += 2;
      mealTypeScores.dinner += 1;
   }

   if (/salad|wrap|sandwich|toast/.test(combinedText)) {
      mealTypeScores.lunch += 2;
   }

   if (/omelette|oatmeal|porridge|pancake|granola|yogurt|egg/.test(combinedText)) {
      mealTypeScores.breakfast += 2;
      categoryScores.breakfast += 2;
   }

   if (/cake|cookie|brownie|dessert|muffin|sweet/.test(combinedText)) {
      mealTypeScores.snack += 2;
      categoryScores.dessert += 2;
   }

   const category = getTopScoringKey(categoryScores, "main-course");
   const mealType = getTopScoringKey(mealTypeScores, "dinner");

   const tags = Object.entries(tagScores)
      .filter(([, score]) => score >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 6);

   return {
      category,
      mealType,
      tags,
   };
}