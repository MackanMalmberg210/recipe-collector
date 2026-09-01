import { sanitizeCulinaryText } from "./culinaryTextSanitizer";

/**
 * Comprehensive culinary unit definitions and normalizations.
 * Full names and standard abbreviations with strict word-boundary matching.
 */

const UNICODE_FRACTIONS: Record<string, string> = {
  "1/2": "½",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/4": "¼",
  "3/4": "¾",
  "1/5": "⅕",
  "2/5": "⅖",
  "3/5": "⅗",
  "4/5": "⅘",
  "1/6": "⅙",
  "5/6": "⅚",
  "1/8": "⅛",
  "3/8": "⅜",
  "5/8": "⅝",
  "7/8": "⅞",
};

/**
 * Converts a decimal number to a clean fraction string with unicode fractions where suitable.
 */
export function formatAmountToFraction(amount: number): string {
  if (amount <= 0 || !Number.isFinite(amount)) return "";

  const whole = Math.floor(amount);
  const remainder = amount - whole;

  if (remainder > 0.96) {
    return String(whole + 1);
  }
  if (remainder < 0.04) {
    return whole > 0 ? String(whole) : "";
  }

  const fractions = [
    { value: 0.125, text: "1/8" },
    { value: 0.25, text: "1/4" },
    { value: 0.333, text: "1/3" },
    { value: 0.375, text: "3/8" },
    { value: 0.5, text: "1/2" },
    { value: 0.625, text: "5/8" },
    { value: 0.666, text: "2/3" },
    { value: 0.75, text: "3/4" },
    { value: 0.875, text: "7/8" },
  ];

  let closest = fractions[0];
  let minDiff = Math.abs(remainder - closest.value);

  for (const f of fractions) {
    const diff = Math.abs(remainder - f.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = f;
    }
  }

  if (minDiff < 0.06) {
    const fracUnicode = UNICODE_FRACTIONS[closest.text] || closest.text;
    if (whole === 0) return fracUnicode;
    return `${whole} ${fracUnicode}`;
  }

  if (amount >= 10) {
    return String(Math.round(amount));
  }
  return String(Number(amount.toFixed(1)));
}

/**
 * Strips parenthetical editorial commentary, author remarks, affiliate links, and secondary metric/imperial weights.
 * e.g. "(about 2 1/4 lb.)" -> ""
 * e.g. "(about 7 oz.)" -> ""
 * e.g. "(I use this one)" -> ""
 * e.g. "(my personal preference for texture!)" -> ""
 * e.g. "(see note)" -> ""
 */
export function cleanAuthorNotes(text: string): string {
  if (!text) return "";
  let cleaned = text
    // Remove all parenthetical notes like (about 7 oz), (approx 200g), (I use this one), (divided), (optional) etc.
    .replace(/\s*\([^)]*\)/g, "")
    // Remove trailing/leading punctuation
    .replace(/^[,.\s:;–-]+|[,.\s:;–-]+$/g, "")
    .trim();
  return cleaned;
}

// Canonical unit mappings
const UNIT_MAP: Record<string, string> = {
  // Tablespoons
  "tablespoons": "tbsp",
  "tablespoon": "tbsp",
  "tbsp.": "tbsp",
  "tbsp": "tbsp",
  "tbs.": "tbsp",
  "tbs": "tbsp",
  "tb.": "tbsp",
  "tb": "tbsp",

  // Teaspoons
  "teaspoons": "tsp",
  "teaspoon": "tsp",
  "tsp.": "tsp",
  "tsp": "tsp",
  "ts.": "tsp",
  "ts": "tsp",

  // Cups
  "cups": "cup",
  "cup": "cup",
  "c.": "cup",
  "c": "cup",

  // Pounds
  "pounds": "lb",
  "pound": "lb",
  "lbs.": "lb",
  "lbs": "lb",
  "lb.": "lb",
  "lb": "lb",

  // Ounces
  "fluid ounces": "fl oz",
  "fluid ounce": "fl oz",
  "fl. oz.": "fl oz",
  "fl. oz": "fl oz",
  "fl oz": "fl oz",
  "ounces": "oz",
  "ounce": "oz",
  "oz.": "oz",
  "oz": "oz",

  // Metric
  "kilograms": "kg",
  "kilogram": "kg",
  "kg.": "kg",
  "kg": "kg",
  "grams": "g",
  "gram": "g",
  "g.": "g",
  "g": "g",
  "milliliters": "ml",
  "milliliter": "ml",
  "ml.": "ml",
  "ml": "ml",
  "liters": "l",
  "liter": "l",
  "l.": "l",
  "l": "l",

  // Units of count / packages / items
  "packages": "pack",
  "package": "pack",
  "pkg.": "pack",
  "pkg": "pack",
  "packs": "pack",
  "pack": "pack",
  "slices": "slices",
  "slice": "slice",
  "cloves": "clove",
  "clove": "clove",
  "pieces": "pcs",
  "piece": "pc",
  "pcs.": "pcs",
  "pcs": "pcs",
  "pc.": "pc",
  "pc": "pc",
  "cans": "can",
  "can": "can",
  "stalks": "stalks",
  "stalk": "stalk",
  "bunches": "bunch",
  "bunch": "bunch",
  "pinches": "pinch",
  "pinch": "pinch",
  "dashes": "dash",
  "dash": "dash",
  "heads": "head",
  "head": "head",
  "sprigs": "sprig",
  "sprig": "sprig",
  "sticks": "stick",
  "stick": "stick",
};

// WORDS THAT START WITH A UNIT LETTER BUT ARE ACTUALLY FOOD / ADJECTIVES (Must NEVER be parsed as a unit abbreviation!)
const NON_UNIT_WORDS = new Set([
  "large", "medium", "small", "lean", "little", "light", "long", "lemon", "lemons", "lime", "limes", "loaf", "loaves",
  "ground", "green", "garlic", "greek", "ginger", "grated", "golden",
  "canola", "chicken", "cheddar", "cheese", "chopped", "chili", "chilies", "cilantro", "crumbled", "cooked", "crushed", "cubed", "cold",
  "toasted", "thick", "thin", "tomato", "tomatoes", "turkey", "thyme", "trimmed",
  "sweet", "sour", "smoked", "shredded", "sliced", "sea", "salt", "sesame", "scallion", "scallions", "shallot", "shallots",
  "white", "whole", "warm", "water", "worcestershire",
  "fresh", "frozen", "flour", "fish", "filet", "fillet", "fillets", "feta",
  "boneless", "skinless", "brown", "black", "baking", "butter", "bell", "bread", "breadcrumbs", "buns",
  "extra", "egg", "eggs", "each",
  "organic", "olive", "onion", "onions",
  "red", "raw", "ripe", "roasted", "rice"
]);

// Sorted by descending length
const SORTED_UNITS = Object.keys(UNIT_MAP).sort((a, b) => b.length - a.length);

/**
 * Robustly parses amount, unit and ingredient name without falsely matching adjective prefixes.
 */
export function splitAmountAndIngredient(
  rawText: string,
  scaleRatio: number = 1,
): {
  amount: string;
  unit: string;
  name: string;
} {
  const sanitized = sanitizeCulinaryText(rawText);
  const cleanedRaw = cleanAuthorNotes(sanitized);
  if (!cleanedRaw) return { amount: "", unit: "", name: "" };

  let numValue: number | null = null;
  let remainingText = cleanedRaw;

  // 1. Mixed Fraction with whole number (e.g. "1 1/2 c. mayonnaise", "2 1/4 lb.")
  const mixedFractionMatch = cleanedRaw.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/);
  if (mixedFractionMatch) {
    numValue = (Number(mixedFractionMatch[1]) + Number(mixedFractionMatch[2]) / Number(mixedFractionMatch[3])) * scaleRatio;
    remainingText = mixedFractionMatch[4];
  } else {
    // 2. Simple fraction (e.g. "1/2 c. mayonnaise", "3/4 tsp salt")
    const fractionMatch = cleanedRaw.match(/^(\d+)\/(\d+)\s*(.*)$/);
    if (fractionMatch) {
      numValue = (Number(fractionMatch[1]) / Number(fractionMatch[2])) * scaleRatio;
      remainingText = fractionMatch[3];
    } else {
      // 3. Whole number + Unicode fraction (e.g. "1 ½ c. crumbled feta")
      const uniMixedMatch = cleanedRaw.match(/^(\d+)\s*([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])\s*(.*)$/);
      if (uniMixedMatch) {
        const whole = Number(uniMixedMatch[1]);
        const uni = uniMixedMatch[2];
        const fracEntry = Object.entries(UNICODE_FRACTIONS).find(([, u]) => u === uni);
        const fracVal = fracEntry ? Number(fracEntry[0].split("/")[0]) / Number(fracEntry[0].split("/")[1]) : 0.5;
        numValue = (whole + fracVal) * scaleRatio;
        remainingText = uniMixedMatch[3];
      } else {
        // 4. Standalone Unicode fraction (e.g. "½ c. mayonnaise", "¼ c. parsley")
        let matchedUni = false;
        for (const [frac, uni] of Object.entries(UNICODE_FRACTIONS)) {
          if (cleanedRaw.startsWith(uni)) {
            const parts = frac.split("/");
            numValue = (Number(parts[0]) / Number(parts[1])) * scaleRatio;
            remainingText = cleanedRaw.slice(uni.length).trim();
            matchedUni = true;
            break;
          }
        }

        if (!matchedUni) {
          // 5. Decimal or integer number (e.g. "1 large salmon fillet", "2.5 cups", "6 slices")
          const numberMatch = cleanedRaw.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
          if (numberMatch) {
            numValue = Number(numberMatch[1]) * scaleRatio;
            remainingText = numberMatch[2];
          }
        }
      }
    }
  }

  if (numValue !== null) {
    const formattedAmount = formatAmountToFraction(numValue);
    const trimmedRemaining = remainingText.trim();

    // Check if remainingText begins with a unit
    for (const testUnit of SORTED_UNITS) {
      // Create strict check: unit must be followed by dot/space/end, OR if unit has dot, followed by space/end
      const escaped = testUnit.replace(/\./g, "\\.");
      const regex = new RegExp(`^${escaped}(?:\\s+|\\.\\s*|$|(?=[,;]))`, "i");
      
      if (regex.test(trimmedRemaining)) {
        // Extract what matched
        const match = trimmedRemaining.match(regex);
        if (match) {
          const matchedToken = match[0].trim().toLowerCase().replace(/\.$/, "");
          const afterUnitText = trimmedRemaining.slice(match[0].length).trim();
          const firstWordAfter = afterUnitText.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");

          // Guard against single letter or short units falsely matching adjectives
          const isShortOrLetter = testUnit.length <= 2;
          const isWordAdjective = NON_UNIT_WORDS.has(trimmedRemaining.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, ""));

          if (isShortOrLetter && isWordAdjective) {
            // It's a word like "large" or "canola", not a unit!
            break;
          }

          const canonicalUnit = UNIT_MAP[testUnit.toLowerCase()] || testUnit;
          const cleanedName = cleanAuthorNotes(afterUnitText);

          return {
            amount: formattedAmount,
            unit: canonicalUnit,
            name: cleanedName,
          };
        }
      }
    }

    // No recognized unit -> amount is a count of items (e.g. "1 large salmon fillet")
    return {
      amount: formattedAmount,
      unit: "",
      name: cleanAuthorNotes(trimmedRemaining),
    };
  }

  // No number present (e.g. "Cooking spray", "Buns")
  return {
    amount: "",
    unit: "",
    name: cleanAuthorNotes(cleanedRaw),
  };
}

/**
 * Scales an individual ingredient text string by multiplying any leading quantity.
 */
export function scaleIngredientText(
  originalText: string,
  scaleRatio: number,
): string {
  if (scaleRatio === 1 || scaleRatio <= 0 || !Number.isFinite(scaleRatio)) {
    return cleanAuthorNotes(originalText);
  }

  const { amount, unit, name } = splitAmountAndIngredient(originalText, scaleRatio);
  if (amount) {
    return `${amount}${unit ? ` ${unit}` : ""} ${name}`.trim();
  }
  return cleanAuthorNotes(originalText);
}
