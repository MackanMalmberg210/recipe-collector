import { generateRecipeMetadata } from "./recipeMetadata";
import { parseIngredientList } from "./ingredientParser";
import type { AppRecipe, IngredientGroup, NutritionInfo } from "./types";

type NormalizerOrigin = AppRecipe["origin"];

export type RawRecipeInput = {
   id?: number;
   title?: string | null;
   description?: string | null;
   image?: string | null;
   cookTime?: number | null;
   readyInMinutes?: number | null;
   calories?: number | null;
   servings?: number | null;
   servingsText?: string | null;
   sourceUrl?: string | null;
   sourceName?: string | null;
   ingredients?: string[] | null;
   ingredientGroups?: IngredientGroup[] | null;
   instructions?: string[] | null;
   nutrition?: NutritionInfo | null;
   videoUrl?: string | null;
   videoEmbedUrl?: string | null;
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

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(value: string) {
   return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
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

export function upgradeToHighResImageUrl(imageUrl: string): string {
  if (!imageUrl) return "";

  let upgraded = imageUrl.trim();

  // 1. Remove WordPress thumbnail downscale dimension suffixes (e.g. -300x300.jpg, -500x375.webp, -150x150.jpg, -720x405.jpg, -768x...jpg)
  upgraded = upgraded.replace(/-\d+x\d+(\.[a-zA-Z0-9]+(?:\?.*)?)$/i, "$1");

  // 2. Remove WordPress / Tachyon / Mediavine / CDN resize query params (e.g. ?fit=225%2C225, ?resize=400%2C400, ?w=300)
  if (
    upgraded.includes("/tachyon/") ||
    upgraded.includes("/wp-content/uploads/") ||
    upgraded.includes("pinchofyum.com") ||
    upgraded.includes("mediavine")
  ) {
    upgraded = upgraded.split("?")[0];
  } else {
    try {
      const urlObj = new URL(upgraded);
      const paramsToDelete = ["resize", "fit", "w", "h", "width", "height", "crop", "zoom", "quality", "strip"];
      for (const p of paramsToDelete) {
        urlObj.searchParams.delete(p);
      }
      upgraded = urlObj.toString();
    } catch {
      // Fallback
    }
  }

  // 3. Upgrade Cloudinary / imgix / WordPress photon dimensions
  if (upgraded.includes("cloudinary.com") || upgraded.includes("imgix.net") || upgraded.includes("wp.com")) {
    upgraded = upgraded.replace(/\/c_fill,w_\d+,h_\d+\//, "/c_limit,w_1600/");
  }

  return upgraded;
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
   nutrients: SpoonacularNutrient[] | null | undefined,
   name: string,
) {
   if (!Array.isArray(nutrients)) return undefined;

   return nutrients.find(
      (nutrient) =>
         nutrient.name?.toLowerCase().trim() === name.toLowerCase().trim(),
   );
}

function mapSpoonacularNutrition(
   nutrition: SpoonacularRecipeInput["nutrition"],
): NutritionInfo | undefined {
   if (!nutrition?.nutrients) return undefined;

   const nutrients = nutrition.nutrients;
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
   const structuredIngredients = parseIngredientList(ingredients);
   const instructions = normalizeStringArray(input.instructions);
   const image = upgradeToHighResImageUrl(normalizeString(input.image) || FALLBACK_IMAGE);
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
      description: normalizeString(input.description) || undefined,
      image,
      cookTime,
      calories,
      ingredients,
      structuredIngredients,
      ingredientGroups: input.ingredientGroups ?? undefined,
      instructions,
      servings: normalizeNumber(input.servings),
      servingsText: normalizeString(input.servingsText) || undefined,
      nutrition: input.nutrition ?? undefined,
      sourceUrl: normalizeString(input.sourceUrl) || undefined,
      sourceName: normalizeString(input.sourceName) || undefined,
      videoUrl: normalizeString(input.videoUrl) || undefined,
      videoEmbedUrl: normalizeString(input.videoEmbedUrl) || undefined,
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