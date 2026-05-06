export type AppRecipe = {
   id: number;
   title: string;
   image: string;
   cookTime?: number;
   calories?: number;
   ingredients: string[];
   instructions?: string[];
   servings?: number;
   nutrition?: {
      calories?: number;
      fat?: string;
      saturatedFat?: string;
      transFat?: string;
      cholesterol?: string;
      sodium?: string;
      carbohydrates?: string;
      fiber?: string;
      sugar?: string;
      protein?: string;
      vitaminD?: string;
      calcium?: string;
      iron?: string;
      potassium?: string;
   };
   sourceUrl?: string;
   sourceName?: string;
   category?: RecipeCategory;
   mealType?: MealType;
   tags?: string[];
   origin: "mock" | "imported" | "user";
};

export type NutritionInfo = {
   calories?: number;
   fat?: string;
   saturatedFat?: string;
   transFat?: string;
   cholesterol?: string;
   sodium?: string;
   carbohydrates?: string;
   fiber?: string;
   sugar?: string;
   protein?: string;
   vitaminD?: string;
   calcium?: string;
   iron?: string;
   potassium?: string;
};

export type ImportedRecipe = {
   title: string;
   image: string;
   cookTime?: number;
   servings?: number;
   ingredients: string[];
   instructions: string[];
   sourceUrl: string;
   sourceName?: string;
   nutrition?: NutritionInfo;
};

export type SavedImportedRecipe = ImportedRecipe & {
   id: number;
};

export type RecipeMatchResult = AppRecipe & {
   matchedIngredients: number;
   totalIngredients: number;
   matchesSearch: boolean;
};

export type RecipeSortMode =
   | "best-match"
   | "cook-time"
   | "calories"
   | "alphabetical";

export type RecipeCategory =
   | "main-course"
   | "pasta"
   | "rice"
   | "salad"
   | "soup"
   | "sandwich"
   | "bowl"
   | "stir-fry"
   | "breakfast"
   | "dessert";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type SavedUserRecipe = {
   id: number;
   title: string;
   image: string;
   cookTime?: number;
   calories?: number;
   ingredients: string[];
   instructions?: string[];
   servings?: number;
   category?: RecipeCategory;
   mealType?: MealType;
   tags?: string[];
};