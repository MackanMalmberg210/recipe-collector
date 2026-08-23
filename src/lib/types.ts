export type StructuredIngredient = {
  name: string;
  amount?: number | null;
  unit?: string | null;
  notes?: string | null;
  original: string;
};

export type IngredientGroup = {
  heading?: string;
  ingredients: string[];
  structuredIngredients?: StructuredIngredient[];
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
  vitaminA?: string;
  vitaminC?: string;
  vitaminD?: string;
  calcium?: string;
  iron?: string;
  potassium?: string;
  phosphorus?: string;
};

export type AppRecipe = {
  id: number;
  title: string;
  description?: string;
  image: string;
  cookTime?: number;
  calories?: number;
  ingredients: string[];
  structuredIngredients?: StructuredIngredient[];
  ingredientGroups?: IngredientGroup[];
  instructions?: string[];
  servings?: number;
  servingsText?: string;
  nutrition?: NutritionInfo;
  sourceUrl?: string;
  sourceName?: string;
  videoUrl?: string;
  videoEmbedUrl?: string;
  category?: RecipeCategory;
  mealType?: MealType;
  tags?: string[];
  origin: "mock" | "imported" | "user";
};

export type ImportedRecipe = {
  title: string;
  description?: string;
  image: string;
  cookTime?: number;
  servings?: number;
  servingsText?: string;
  ingredients: string[];
  structuredIngredients?: StructuredIngredient[];
  ingredientGroups?: IngredientGroup[];
  instructions: string[];
  sourceUrl: string;
  sourceName?: string;
  videoUrl?: string;
  videoEmbedUrl?: string;
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
  | "alphabetical"
  | "highest-rated";

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

export type MealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack";

export type SavedUserRecipe = {
  id: number;
  title: string;
  description?: string;
  image?: string;
  cookTime?: number;
  calories?: number;
  servings?: number;
  servingsText?: string;
  ingredients: string[];
  instructions: string[];
  category?: RecipeCategory;
  mealType?: MealType;
  tags?: string[];
  sourceUrl?: string;
  sourceName?: string;
  videoUrl?: string;
  videoEmbedUrl?: string;
};