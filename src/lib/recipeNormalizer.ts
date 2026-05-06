import { generateRecipeMetadata } from "./recipeMetadata";
import type { AppRecipe, NutritionInfo } from "./types";

type NormalizerOrigin = AppRecipe["origin"];

export type RawRecipeInput = {
   id?: number;
   title?: string | null;
   image?: string | null;
   cookTime?: number | null;
   readyInMinutes?: number | null;
   calories?: number | null;
   servings?: number | null;
   sourceUrl?: string | null;
   sourceName?: string | null;
   ingredients?: string[] | null;
   instructions?: string[] | null;
   nutrition?: NutritionInfo | null;
   origin?: NormalizerOrigin;
};

export type SpoonacularRecipeInput = {
   id?: number;
   title?: string | null;
   image?: string | null;
   readyInMinutes?: number | null;
   servings?: number | null;
   sourceUrl?: string | null;
   sourceName?: string | null;
   extendedIngredients?: {
      original?: string | null;
      originalName?: string | null;
      name?: string | null;
      amount?: number | null;
      unit?: string | null;
   }[];
   analyzedInstructions?: {
      steps?: {
         number?: number;
         step?: string | null;
      }[];
   }[];
   nutrition?: {
      nutrients?: {
         name?: string | null;
         amount?: number | null;
         unit?: string | null;
      }[];
   } | null;
};

const FALLBACK_IMAGE =
   "https://images.unsplash.com/photo-1495521821757-a1efb6729352";

function createRecipeId() {
   return Date.now();
}

function cleanText(value: string) {
   return value.replace(/\s+/g, " ").trim();
}

function normalizeString(value: string | null | undefined) {
   if (!value) return "";
   return cleanText(value);
}

function normalizeNumber(value: number | null | undefined) {
   if (typeof value !== "number") return undefined;
   if (!Number.isFinite(value)) return undefined;
   return value;
}

function normalizeStringArray(values: string[] | null | undefined) {
   if (!Array.isArray(values)) return [];

   return values
      .map(normalizeString)
      .filter((value, index, array) => value && array.indexOf(value) === index);
}

function formatNutrientValue(amount?: number | null, unit?: string | null) {
   if (typeof amount !== "number" || !Number.isFinite(amount)) return undefined;

   const roundedAmount = Number.isInteger(amount)
      ? amount
      : Number(amount.toFixed(1));

   return `${roundedAmount}${unit ? ` ${unit}` : ""}`;
}

type SpoonacularNutrient = {
   name?: string | null;
   amount?: number | null;
   unit?: string | null;
};

function getNutrient(
   nutrients: SpoonacularNutrient[] | undefined,
   name: string,
) {
   if (!Array.isArray(nutrients)) return undefined;

   return nutrients.find(
      (nutrient) =>
         nutrient.name?.trim().toLowerCase() === name.trim().toLowerCase(),
   );
}

function mapSpoonacularNutrition(
   nutrition: SpoonacularRecipeInput["nutrition"],
): NutritionInfo | undefined {
   const nutrients = nutrition?.nutrients;

   if (!Array.isArray(nutrients)) return undefined;

   const calories = getNutrient(nutrients, "Calories");
   const fat = getNutrient(nutrients, "Fat");
   const saturatedFat = getNutrient(nutrients, "Saturated Fat");
   const transFat = getNutrient(nutrients, "Trans Fat");
   const cholesterol = getNutrient(nutrients, "Cholesterol");
   const sodium = getNutrient(nutrients, "Sodium");
   const carbohydrates = getNutrient(nutrients, "Carbohydrates");
   const fiber = getNutrient(nutrients, "Fiber");
   const sugar = getNutrient(nutrients, "Sugar");
   const protein = getNutrient(nutrients, "Protein");
   const vitaminD = getNutrient(nutrients, "Vitamin D");
   const calcium = getNutrient(nutrients, "Calcium");
   const iron = getNutrient(nutrients, "Iron");
   const potassium = getNutrient(nutrients, "Potassium");

   return {
      calories: normalizeNumber(calories?.amount),
      fat: formatNutrientValue(fat?.amount, fat?.unit),
      saturatedFat: formatNutrientValue(saturatedFat?.amount, saturatedFat?.unit),
      transFat: formatNutrientValue(transFat?.amount, transFat?.unit),
      cholesterol: formatNutrientValue(cholesterol?.amount, cholesterol?.unit),
      sodium: formatNutrientValue(sodium?.amount, sodium?.unit),
      carbohydrates: formatNutrientValue(
         carbohydrates?.amount,
         carbohydrates?.unit,
      ),
      fiber: formatNutrientValue(fiber?.amount, fiber?.unit),
      sugar: formatNutrientValue(sugar?.amount, sugar?.unit),
      protein: formatNutrientValue(protein?.amount, protein?.unit),
      vitaminD: formatNutrientValue(vitaminD?.amount, vitaminD?.unit),
      calcium: formatNutrientValue(calcium?.amount, calcium?.unit),
      iron: formatNutrientValue(iron?.amount, iron?.unit),
      potassium: formatNutrientValue(potassium?.amount, potassium?.unit),
   };
}

function normalizeSpoonacularIngredients(
   ingredients: SpoonacularRecipeInput["extendedIngredients"],
) {
   if (!Array.isArray(ingredients)) return [];

   return ingredients
      .map((ingredient) => {
         const original = normalizeString(ingredient.original);
         if (original) return original;

         const amount = normalizeNumber(ingredient.amount);
         const unit = normalizeString(ingredient.unit);
         const name =
            normalizeString(ingredient.originalName) || normalizeString(ingredient.name);

         return cleanText(
            [amount, unit, name].filter((value) => value !== undefined && value).join(" "),
         );
      })
      .filter(Boolean);
}

function normalizeSpoonacularInstructions(
   analyzedInstructions: SpoonacularRecipeInput["analyzedInstructions"],
) {
   if (!Array.isArray(analyzedInstructions)) return [];

   return analyzedInstructions
      .flatMap((instructionBlock) => instructionBlock.steps ?? [])
      .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
      .map((step) => normalizeString(step.step))
      .filter(Boolean);
}

export function normalizeRecipe(input: RawRecipeInput): AppRecipe {
   const title = normalizeString(input.title) || "Untitled recipe";
   const ingredients = normalizeStringArray(input.ingredients);
   const instructions = normalizeStringArray(input.instructions);
   const cookTime =
      normalizeNumber(input.cookTime) ?? normalizeNumber(input.readyInMinutes);
   const calories =
      normalizeNumber(input.calories) ?? normalizeNumber(input.nutrition?.calories);
   const metadata = generateRecipeMetadata({
      title,
      ingredients,
      cookTime,
      calories,
   });

   return {
      id: input.id ?? createRecipeId(),
      title,
      image: normalizeString(input.image) || FALLBACK_IMAGE,
      cookTime,
      calories,
      ingredients,
      instructions,
      servings: normalizeNumber(input.servings),
      nutrition: input.nutrition ?? undefined,
      sourceUrl: normalizeString(input.sourceUrl) || undefined,
      sourceName: normalizeString(input.sourceName) || undefined,
      category: metadata.category,
      mealType: metadata.mealType,
      tags: metadata.tags,
      origin: input.origin ?? "imported",
   };
}

export function normalizeSpoonacularRecipe(
   input: SpoonacularRecipeInput,
   origin: NormalizerOrigin = "imported",
): AppRecipe {
   const nutrition = mapSpoonacularNutrition(input.nutrition);
   const ingredients = normalizeSpoonacularIngredients(input.extendedIngredients);
   const instructions = normalizeSpoonacularInstructions(
      input.analyzedInstructions,
   );

   return normalizeRecipe({
      id: input.id,
      title: input.title,
      image: input.image,
      readyInMinutes: input.readyInMinutes,
      servings: input.servings,
      sourceUrl: input.sourceUrl,
      sourceName: input.sourceName,
      ingredients,
      instructions,
      nutrition,
      calories: nutrition?.calories,
      origin,
   });
}