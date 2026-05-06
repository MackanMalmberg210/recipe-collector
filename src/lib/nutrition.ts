import type { NutritionInfo } from "./types";

export type NormalizedNutrition = NutritionInfo;

export type NutritionEstimateInput = {
   calories?: number;
   protein?: string;
   fat?: string;
   carbohydrates?: string;
   sugar?: string;
   sodium?: string;
   fiber?: string;
};

type ParsedAmount = {
   amount: number;
   unit: string;
};

function parseNutritionAmount(value?: string) {
   if (!value) return undefined;

   const match = value.trim().match(/^([\d.,]+)\s*([a-zA-Zµ%]*)/);

   if (!match) return undefined;

   const amount = Number(match[1].replace(",", "."));

   if (!Number.isFinite(amount)) return undefined;

   return {
      amount,
      unit: match[2] || "",
   };
}

function formatAmount({ amount, unit }: ParsedAmount) {
   const roundedAmount = Number.isInteger(amount)
      ? amount
      : Number(amount.toFixed(1));

   return `${roundedAmount}${unit ? ` ${unit}` : ""}`;
}

function sumNutritionValues(values: Array<string | undefined>) {
   const parsedValues = values
      .map(parseNutritionAmount)
      .filter((value): value is ParsedAmount => Boolean(value));

   if (parsedValues.length === 0) return undefined;

   const unit = parsedValues[0].unit;

   const compatibleValues = parsedValues.filter((value) => value.unit === unit);

   if (compatibleValues.length === 0) return undefined;

   const total = compatibleValues.reduce((sum, value) => sum + value.amount, 0);

   return formatAmount({ amount: total, unit });
}

export function mergeNutritionValues(
   values: Array<NutritionInfo | undefined>,
): NutritionInfo | undefined {
   const validValues = values.filter(
      (value): value is NutritionInfo => value !== undefined,
   );

   if (validValues.length === 0) return undefined;

   const calories = validValues.reduce(
      (sum, value) => sum + (value.calories ?? 0),
      0,
   );

   return {
      calories: calories > 0 ? calories : undefined,
      protein: sumNutritionValues(validValues.map((value) => value.protein)),
      fat: sumNutritionValues(validValues.map((value) => value.fat)),
      carbohydrates: sumNutritionValues(
         validValues.map((value) => value.carbohydrates),
      ),
      sugar: sumNutritionValues(validValues.map((value) => value.sugar)),
      sodium: sumNutritionValues(validValues.map((value) => value.sodium)),
      fiber: sumNutritionValues(validValues.map((value) => value.fiber)),
      saturatedFat: sumNutritionValues(
         validValues.map((value) => value.saturatedFat),
      ),
      transFat: sumNutritionValues(validValues.map((value) => value.transFat)),
      cholesterol: sumNutritionValues(
         validValues.map((value) => value.cholesterol),
      ),
      vitaminD: sumNutritionValues(validValues.map((value) => value.vitaminD)),
      calcium: sumNutritionValues(validValues.map((value) => value.calcium)),
      iron: sumNutritionValues(validValues.map((value) => value.iron)),
      potassium: sumNutritionValues(validValues.map((value) => value.potassium)),
   };
}

export function createNutritionFromEstimate({
   calories,
   protein,
   fat,
   carbohydrates,
   sugar,
   sodium,
   fiber,
}: NutritionEstimateInput): NutritionInfo | undefined {
   const hasAnyValue =
      calories !== undefined ||
      protein ||
      fat ||
      carbohydrates ||
      sugar ||
      sodium ||
      fiber;

   if (!hasAnyValue) return undefined;

   return {
      calories,
      protein,
      fat,
      carbohydrates,
      sugar,
      sodium,
      fiber,
   };
}

export function getCaloriesFromNutrition(nutrition?: NutritionInfo) {
   return nutrition?.calories;
}

export function hasNutritionData(nutrition?: NutritionInfo) {
   if (!nutrition) return false;

   return Object.values(nutrition).some((value) => value !== undefined);
}