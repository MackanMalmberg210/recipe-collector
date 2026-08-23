/**
 * Automated Culinary Unit Converter & Fraction Formatter
 * Converts between Metric and Imperial systems cleanly without ugly floating decimals.
 */

import { formatAmountToFraction, splitAmountAndIngredient } from "./fractionScaler";
import type { MeasurementUnitSystem } from "./settings";

// Helper to round to nearest 5 or 10 for clean metric weights/volumes
function roundCleanMetric(num: number): number {
  if (num < 10) return Math.round(num);
  if (num < 50) return Math.round(num / 5) * 5;
  if (num < 200) return Math.round(num / 5) * 5;
  return Math.round(num / 10) * 10;
}

export type ConvertedQuantity = {
  amount: string;
  unit: string;
  name: string;
  originalAmount?: string;
  originalUnit?: string;
};

/**
 * Parses numeric value from amount string (handles "1 1/2", "½", "0.5", "2", etc.)
 */
export function parseNumericAmount(amountStr: string): number | null {
  if (!amountStr) return null;
  const trimmed = amountStr.trim();

  // Mixed Fraction (e.g. "1 1/2")
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  }

  // Simple Fraction (e.g. "1/2")
  const frac = trimmed.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    return Number(frac[1]) / Number(frac[2]);
  }

  // Unicode Fraction Map
  const unicodeMap: Record<string, number> = {
    "½": 0.5,
    "⅓": 0.333,
    "⅔": 0.666,
    "¼": 0.25,
    "¾": 0.75,
    "⅕": 0.2,
    "⅖": 0.4,
    "⅗": 0.6,
    "⅘": 0.8,
    "⅙": 0.166,
    "⅚": 0.833,
    "⅛": 0.125,
    "⅜": 0.375,
    "⅝": 0.625,
    "⅞": 0.875,
  };

  // Whole + Unicode (e.g. "1 ½")
  const uniMixed = trimmed.match(/^(\d+)\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
  if (uniMixed) {
    return Number(uniMixed[1]) + (unicodeMap[uniMixed[2]] || 0.5);
  }

  if (unicodeMap[trimmed]) {
    return unicodeMap[trimmed];
  }

  const num = Number(trimmed);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Converts an ingredient text to the user's preferred measurement system (Metric or Imperial).
 */
export function convertIngredient(
  rawIngredient: string,
  targetSystem: MeasurementUnitSystem,
  scaleRatio: number = 1,
): ConvertedQuantity {
  const parsed = splitAmountAndIngredient(rawIngredient, scaleRatio);
  const { unit, name } = parsed;
  const numAmount = parseNumericAmount(parsed.amount);

  if (!numAmount || !unit) {
    return {
      amount: parsed.amount,
      unit: parsed.unit,
      name: parsed.name || rawIngredient,
    };
  }

  const normUnit = unit.toLowerCase().replace(/\.$/, "");

  // ==========================================
  // CASE A: TARGET IS IMPERIAL (US Standard)
  // ==========================================
  if (targetSystem === "imperial") {
    // 1. Grams to Ounces / Pounds
    if (normUnit === "g" || normUnit === "gram" || normUnit === "grams") {
      const ozTotal = numAmount / 28.3495;
      if (ozTotal >= 14) {
        const lbTotal = numAmount / 453.592;
        return {
          amount: formatAmountToFraction(lbTotal),
          unit: "lb",
          name,
          originalAmount: parsed.amount,
          originalUnit: unit,
        };
      }
      return {
        amount: formatAmountToFraction(ozTotal),
        unit: "oz",
        name,
        originalAmount: parsed.amount,
        originalUnit: unit,
      };
    }

    // 2. Kilograms to Pounds
    if (normUnit === "kg" || normUnit === "kilogram" || normUnit === "kilograms") {
      const lbTotal = numAmount * 2.20462;
      return {
        amount: formatAmountToFraction(lbTotal),
        unit: "lb",
        name,
        originalAmount: parsed.amount,
        originalUnit: unit,
      };
    }

    // 3. Milliliters to Tsp / Tbsp / Cups
    if (normUnit === "ml" || normUnit === "milliliter" || normUnit === "milliliters") {
      if (numAmount < 14) {
        const tspVal = numAmount / 4.92892;
        return {
          amount: formatAmountToFraction(tspVal),
          unit: "tsp",
          name,
          originalAmount: parsed.amount,
          originalUnit: unit,
        };
      }
      if (numAmount < 50) {
        const tbspVal = numAmount / 14.7868;
        return {
          amount: formatAmountToFraction(tbspVal),
          unit: "tbsp",
          name,
          originalAmount: parsed.amount,
          originalUnit: unit,
        };
      }
      const cupVal = numAmount / 236.588;
      return {
        amount: formatAmountToFraction(cupVal),
        unit: "cup",
        name,
        originalAmount: parsed.amount,
        originalUnit: unit,
      };
    }

    // 4. Deciliters (dl) to Cups / Tbsp
    if (normUnit === "dl" || normUnit === "deciliter" || normUnit === "deciliters") {
      const ml = numAmount * 100;
      if (ml < 50) {
        const tbspVal = ml / 14.7868;
        return {
          amount: formatAmountToFraction(tbspVal),
          unit: "tbsp",
          name,
          originalAmount: parsed.amount,
          originalUnit: unit,
        };
      }
      const cupVal = ml / 236.588;
      return {
        amount: formatAmountToFraction(cupVal),
        unit: "cup",
        name,
        originalAmount: parsed.amount,
        originalUnit: unit,
      };
    }

    // 5. Liters (l) to Cups / Quarts
    if (normUnit === "l" || normUnit === "liter" || normUnit === "liters") {
      const cupVal = numAmount * 4.22675;
      return {
        amount: formatAmountToFraction(cupVal),
        unit: "cups",
        name,
        originalAmount: parsed.amount,
        originalUnit: unit,
      };
    }

    // If already imperial (cups, tbsp, tsp, lb, oz), format cleanly
    return {
      amount: formatAmountToFraction(numAmount),
      unit,
      name,
    };
  }

  // ==========================================
  // CASE B: TARGET IS METRIC (Grams / Milliliters)
  // ==========================================
  if (targetSystem === "metric") {
    // 1. Ounces (oz) to Grams
    if (normUnit === "oz" || normUnit === "ounce" || normUnit === "ounces") {
      const grams = roundCleanMetric(numAmount * 28.3495);
      return {
        amount: String(grams),
        unit: "g",
        name,
        originalAmount: parsed.amount,
        originalUnit: unit,
      };
    }

    // 2. Pounds (lb) to Grams or Kilograms (1 lb standard culinary = 450g)
    if (normUnit === "lb" || normUnit === "lbs" || normUnit === "pound" || normUnit === "pounds") {
      const grams = Math.round(numAmount * 450);
      if (grams >= 1000 && grams % 500 === 0) {
        const kgVal = grams / 1000;
        return {
          amount: formatAmountToFraction(kgVal),
          unit: "kg",
          name,
          originalAmount: parsed.amount,
          originalUnit: unit,
        };
      }
      return {
        amount: String(grams),
        unit: "g",
        name,
        originalAmount: parsed.amount,
        originalUnit: unit,
      };
    }

    // 3. Cups to Milliliters (or dl)
    if (normUnit === "cup" || normUnit === "cups" || normUnit === "c") {
      const ml = roundCleanMetric(numAmount * 240);
      if (ml >= 100 && ml % 50 === 0) {
        const dlVal = ml / 100;
        return {
          amount: formatAmountToFraction(dlVal),
          unit: "dl",
          name,
          originalAmount: parsed.amount,
          originalUnit: unit,
        };
      }
      return {
        amount: String(ml),
        unit: "ml",
        name,
        originalAmount: parsed.amount,
        originalUnit: unit,
      };
    }

    // 4. Fluid Ounces (fl oz) to Milliliters
    if (normUnit === "fl oz" || normUnit === "fl. oz" || normUnit === "fluid ounce" || normUnit === "fluid ounces") {
      const ml = roundCleanMetric(numAmount * 29.5735);
      return {
        amount: String(ml),
        unit: "ml",
        name,
        originalAmount: parsed.amount,
        originalUnit: unit,
      };
    }

    // Universal culinary units (tbsp, tsp, pinches, clove, etc.) stay untouched
    return {
      amount: formatAmountToFraction(numAmount),
      unit,
      name,
    };
  }

  return {
    amount: parsed.amount,
    unit: parsed.unit,
    name: parsed.name || rawIngredient,
  };
}
