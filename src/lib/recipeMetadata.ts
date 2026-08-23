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
   pasta: ["pasta", "spaghetti", "penne", "tagliatelle", "fusilli", "linguine", "rigatoni", "lasagna", "fettuccine", "carbonara"],
   rice: ["rice", "risotto", "fried rice", "paella", "pilaf", "biryani"],
   salad: ["salad", "slaw", "caesar salad", "greek salad"],
   soup: ["soup", "broth", "bisque", "chowder", "stew", "ramen"],
   sandwich: ["sandwich", "toast", "burger", "wrap", "bagel", "panini"],
   bowl: ["bowl", "poke", "grain bowl", "buddha bowl", "burrito bowl"],
   "stir-fry": ["stir fry", "stir-fry", "noodles", "wok", "chow mein", "pad thai"],
   breakfast: ["breakfast", "omelette", "oatmeal", "porridge", "pancake", "waffles", "granola", "scrambled eggs", "french toast"],
   dessert: ["cake", "cookie", "brownie", "dessert", "ice cream", "muffin", "sweet", "pie", "tart", "cheesecake"],
};

const MEAL_TYPE_KEYWORDS: Record<MealType, string[]> = {
   breakfast: ["breakfast", "omelette", "oatmeal", "porridge", "pancake", "waffles", "granola", "scrambled eggs", "french toast", "brunch"],
   lunch: ["salad", "wrap", "sandwich", "toast", "bowl", "soup", "lunch"],
   dinner: ["pasta", "rice", "stir fry", "stir-fry", "curry", "bake", "roast", "chicken", "beef", "pork", "steak", "salmon", "casserole", "dinner"],
   snack: ["snack", "cookie", "muffin", "bar", "smoothie", "dip"],
};

const TAG_KEYWORDS: Record<string, string[]> = {
   vegetarian: ["halloumi", "tofu", "mozzarella", "parmesan", "cheddar", "feta", "spinach", "mushroom", "beans", "lentils"],
   vegan: ["tofu", "lentils", "beans", "chickpeas", "oat milk", "almond milk"],
   "high-protein": ["chicken", "beef", "turkey", "salmon", "tuna", "shrimp", "steak", "pork", "greek yogurt", "tofu"],
   quick: [],
   "low-calorie": [],
   creamy: ["cream", "creamy", "crème", "heavy cream", "cheese sauce", "parmesan", "sour cream"],
   spicy: ["chili", "jalapeno", "sriracha", "cayenne", "hot sauce", "spicy", "chipotle"],
   "comfort-food": ["cream", "cheese", "butter", "bake", "gratin", "pasta", "potatoes", "bacon"],
   chicken: ["chicken", "chicken breast", "chicken thighs"],
   beef: ["beef", "steak", "ground beef"],
   pork: ["pork", "bacon", "ham", "prosciutto"],
   fish: ["salmon", "tuna", "cod", "fish", "shrimp", "prawn"],
   pasta: ["pasta", "spaghetti", "penne", "tagliatelle", "fusilli", "linguine", "rigatoni"],
   rice: ["rice", "risotto", "fried rice"],
   halloumi: ["halloumi"],
   soup: ["soup", "broth", "bisque"],
   salad: ["salad"],
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
   const normalizedTitle = tokenize(title);
   const normalizedIngredients = tokenize(ingredients.join(" "));
   const combinedText = `${normalizedTitle} ${normalizedIngredients}`.trim();

   const categoryKeys = Object.keys(CATEGORY_KEYWORDS) as RecipeCategory[];
   const mealTypeKeys = Object.keys(MEAL_TYPE_KEYWORDS) as MealType[];
   const tagKeys = Object.keys(TAG_KEYWORDS);

   const categoryScores = createScoreMap(categoryKeys);
   const mealTypeScores = createScoreMap(mealTypeKeys);
   const tagScores = createScoreMap(tagKeys);

   // 1. Give heavy weight (+3) to matches in recipe title
   for (const category of categoryKeys) {
      categoryScores[category] += countKeywordMatches(normalizedTitle, CATEGORY_KEYWORDS[category]) * 3;
      categoryScores[category] += countKeywordMatches(normalizedIngredients, CATEGORY_KEYWORDS[category]);
   }

   for (const mealType of mealTypeKeys) {
      mealTypeScores[mealType] += countKeywordMatches(normalizedTitle, MEAL_TYPE_KEYWORDS[mealType]) * 3;
      mealTypeScores[mealType] += countKeywordMatches(normalizedIngredients, MEAL_TYPE_KEYWORDS[mealType]);
   }

   for (const tag of tagKeys) {
      tagScores[tag] += countKeywordMatches(normalizedTitle, TAG_KEYWORDS[tag]) * 2;
      tagScores[tag] += countKeywordMatches(normalizedIngredients, TAG_KEYWORDS[tag]);
   }

   if (cookTime !== undefined) {
      if (cookTime <= 20) {
         tagScores.quick += 2;
         mealTypeScores.lunch += 1;
      } else if (cookTime >= 40) {
         tagScores["comfort-food"] += 1;
         mealTypeScores.dinner += 2;
      }
   }

   if (calories !== undefined) {
      if (calories <= 450) {
         tagScores["low-calorie"] += 2;
      } else if (calories >= 650) {
         tagScores["comfort-food"] += 1;
         mealTypeScores.dinner += 1;
      }
   }

   const hasMeat =
      /chicken|beef|pork|bacon|ham|turkey|salmon|tuna|cod|fish|shrimp|prawn|steak/.test(
         normalizedIngredients,
      );

   const hasAnimalProducts =
      /egg|milk|cream|butter|cheese|parmesan|mozzarella|feta|halloumi|yogurt/.test(
         normalizedIngredients,
      );

   const hasPlantProtein = /tofu|lentils|beans|chickpeas/.test(normalizedIngredients);

   if (ingredients.length > 0 && !hasMeat) {
      tagScores.vegetarian += 2;
   }

   if (ingredients.length > 0 && !hasMeat && !hasAnimalProducts && hasPlantProtein) {
      tagScores.vegan += 2;
   }

   if (/pasta|spaghetti|penne|tagliatelle|fusilli|linguine|rigatoni/.test(combinedText)) {
      categoryScores.pasta += 3;
      mealTypeScores.dinner += 2;
   }

   if (/chicken|beef|pork|steak|salmon|curry|roast|casserole/.test(combinedText)) {
      mealTypeScores.dinner += 3;
   }

   if (/omelette|oatmeal|porridge|pancake|waffles|granola|french toast/.test(combinedText)) {
      mealTypeScores.breakfast += 3;
      categoryScores.breakfast += 3;
   }

   if (/cake|cookie|brownie|dessert|muffin|sweet|pie|tart/.test(combinedText)) {
      mealTypeScores.snack += 2;
      categoryScores.dessert += 3;
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