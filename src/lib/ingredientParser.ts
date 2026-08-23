import { capitalize } from "./format";

export type StructuredIngredient = {
  name: string;
  amount?: number | null;
  unit?: string | null;
  notes?: string | null;
  original: string;
};

// Map unicode fractions to standard decimals/fractions
const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

// Recognized volume & weight units (canonical normalization)
const UNIT_CANONICAL_MAP: Record<string, string> = {
  // Tablespoons
  tbsp: "tbsp",
  tbs: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  "tablespoons of": "tbsp",
  "tablespoon of": "tbsp",
  msk: "tbsp",
  matssked: "tbsp",
  matsskedar: "tbsp",

  // Teaspoons
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  "teaspoons of": "tsp",
  "teaspoon of": "tsp",
  tsk: "tsp",
  tesked: "tsp",
  teskedar: "tsp",
  krm: "pinch",
  kryddmått: "pinch",

  // Cups & Volume
  cup: "cup",
  cups: "cup",
  "cups of": "cup",
  "cup of": "cup",
  c: "cup",
  dl: "dl",
  deciliter: "dl",
  deciliters: "dl",
  "dl of": "dl",
  cl: "cl",
  centiliter: "cl",

  // Ounces & Fluid Ounces
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  "ounces of": "oz",
  "ounce of": "oz",
  "fl oz": "fl oz",
  "fluid ounce": "fl oz",
  "fluid ounces": "fl oz",

  // Pounds
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  "pounds of": "lb",

  // Grams
  g: "g",
  gram: "g",
  grams: "g",
  "grams of": "g",
  "gram of": "g",
  gr: "g",

  // Kilograms
  kg: "kg",
  kilo: "kg",
  kilos: "kg",
  "kilos of": "kg",
  kilogram: "kg",
  kilograms: "kg",

  // Milliliters & Liters
  ml: "ml",
  "ml of": "ml",
  milliliter: "ml",
  milliliters: "ml",
  "milliliters of": "ml",
  l: "l",
  liter: "l",
  liters: "l",
  "liters of": "l",

  // Pieces & Counts
  clove: "clove",
  cloves: "clove",
  "cloves of": "clove",
  klyfta: "clove",
  klyftor: "clove",
  can: "can",
  cans: "can",
  "cans of": "can",
  burk: "can",
  burkar: "can",
  pinch: "pinch",
  pinches: "pinch",
  "pinches of": "pinch",
  nypa: "pinch",
  nypor: "pinch",
  dash: "dash",
  dashes: "dash",
  slice: "slice",
  slices: "slice",
  "slices of": "slice",
  skiva: "slice",
  skivor: "slice",
  stalk: "stalk",
  stalks: "stalk",
  stjälk: "stalk",
  stjälkar: "stalk",
  bunch: "bunch",
  bunches: "bunch",
  "bunches of": "bunch",
  kruka: "bunch",
  krukor: "bunch",
  knippe: "bunch",
  sprig: "sprig",
  sprigs: "sprig",
  "sprigs of": "sprig",
  head: "head",
  heads: "head",
  "heads of": "head",
  packet: "packet",
  packets: "packet",
  pkg: "packet",
  pkgs: "packet",
  package: "packet",
  packages: "packet",
  pkt: "packet",
  påse: "packet",
  påsar: "packet",
  piece: "piece",
  pieces: "piece",
  st: "piece",
  styck: "piece",
  stk: "piece",
};

// Common preparation keywords to separate into notes
const PREP_KEYWORDS = [
  "chopped",
  "finely chopped",
  "coarsely chopped",
  "diced",
  "finely diced",
  "minced",
  "grated",
  "freshly grated",
  "shredded",
  "sliced",
  "thinly sliced",
  "crushed",
  "melted",
  "softened",
  "at room temperature",
  "divided",
  "rinsed and drained",
  "drained",
  "rinsed",
  "to taste",
  "for garnish",
  "for serving",
  "optional",
  "peeled",
  "halved",
  "stemmed",
  "seeded",
  "trimmed",
  "packed",
  "lightly packed",
  "beaten",
  "whisked",
  "sifted",
  "boneless",
  "skinless",
  "cooked",
  "uncooked",
  "raw",
];

// Clean fraction string to numeric float
function parseFraction(value: string): number | null {
  const clean = value.trim();

  // Mixed fraction: "1 1/2" or "1-1/2"
  const mixedMatch = clean.match(/^(\d+)\s*[- ]\s*(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseFloat(mixedMatch[1]);
    const num = parseFloat(mixedMatch[2]);
    const den = parseFloat(mixedMatch[3]);
    if (den !== 0) return whole + num / den;
  }

  // Simple fraction: "3/4"
  const fractionMatch = clean.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]);
    const den = parseFloat(fractionMatch[2]);
    if (den !== 0) return num / den;
  }

  // Range: "2-3" or "2 to 3" -> average 2.5
  const rangeMatch = clean.match(/^(\d+(\.\d+)?)\s*(?:-|to)\s*(\d+(\.\d+)?)$/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[3]);
    return (min + max) / 2;
  }

  // Regular decimal or integer
  const num = parseFloat(clean);
  return Number.isFinite(num) ? num : null;
}

export function parseIngredientString(raw: string): StructuredIngredient {
  if (!raw || typeof raw !== "string") {
    return { name: "", original: "" };
  }

  const original = raw.trim();

  // 1. Normalize unicode fractions (e.g. ½ -> 1/2)
  let text = original;
  for (const [unicode, ascii] of Object.entries(UNICODE_FRACTIONS)) {
    text = text.replace(new RegExp(unicode, "g"), ` ${ascii} `);
  }

  // 2. Normalize whitespace, tabs and punctuation
  text = text.replace(/\s+/g, " ").trim();

  // 3. Remove leading bullet characters
  text = text.replace(/^[-*•·►]\s*/, "");

  // 4. Fix glued numbers and units e.g. "200g" -> "200 g", "1/2cup" -> "1/2 cup", "500ml" -> "500 ml"
  text = text.replace(/(\d+)(g|kg|ml|dl|cl|l|oz|lb|tbsp|tsp|cup|c|clove|can|krm|msk|tsk)\b/gi, "$1 $2");

  // 5. Extract parenthetical notes or containers (e.g. "2 (15 oz) cans black beans")
  let parentheticalInfo: string | null = null;
  const parenMatch = text.match(/\(([^)]+)\)/);
  if (parenMatch) {
    parentheticalInfo = parenMatch[1].trim();
    text = text.replace(/\([^)]+\)/, " ").replace(/\s+/g, " ").trim();
  }

  // 6. Extract trailing prep notes after comma e.g. "garlic, minced and peeled"
  let extractedNotes: string[] = [];
  if (parentheticalInfo) {
    extractedNotes.push(parentheticalInfo);
  }

  if (text.includes(",")) {
    const parts = text.split(",");
    text = parts[0].trim();
    const rest = parts.slice(1).join(", ").trim();
    if (rest) extractedNotes.push(rest);
  }

  // 7. Match leading quantity
  // Matches: "1", "1 1/2", "3/4", "0.5", "2 - 3", "2 to 3", "500"
  const quantityRegex =
    /^((?:\d+\s+)?\d+\/\d+|\d+(?:\.\d+)?(?:\s*(?:-|to)\s*\d+(?:\.\d+)?)?)\s*/i;

  let amount: number | null = null;
  let unit: string | null = null;

  const quantityMatch = text.match(quantityRegex);
  if (quantityMatch && quantityMatch[1]) {
    amount = parseFraction(quantityMatch[1]);
    // Strip quantity from text
    text = text.slice(quantityMatch[0].length).trim();
  }

  // 8. Match unit at the beginning of the remaining text (handle 1-word, 2-word, or 3-word units like "grams of")
  const words = text.split(" ");
  const word0 = words[0]?.toLowerCase().replace(/[.,]$/, "");
  const word1 = words[1]?.toLowerCase().replace(/[.,]$/, "");
  const word2 = words[2]?.toLowerCase().replace(/[.,]$/, "");

  const threeWords = `${word0} ${word1} ${word2}`.trim();
  const twoWords = `${word0} ${word1}`.trim();

  if (threeWords in UNIT_CANONICAL_MAP) {
    unit = UNIT_CANONICAL_MAP[threeWords];
    text = words.slice(3).join(" ").trim();
  } else if (twoWords in UNIT_CANONICAL_MAP) {
    unit = UNIT_CANONICAL_MAP[twoWords];
    text = words.slice(2).join(" ").trim();
  } else if (word0 && word0 in UNIT_CANONICAL_MAP) {
    unit = UNIT_CANONICAL_MAP[word0];
    text = words.slice(1).join(" ").trim();
  }

  // Remove optional leading "of" after unit e.g. "of chicken" -> "chicken"
  text = text.replace(/^of\s+/i, "").trim();

  // 9. Check for prep keywords in remaining text (e.g. "chopped cilantro" or "salt to taste")
  for (const keyword of PREP_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(text)) {
      text = text.replace(regex, "").replace(/\s+/g, " ").trim();
      extractedNotes.push(keyword);
    }
  }

  // 10. Clean up final ingredient name
  let name = text
    .replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Fallback: If stripping left name empty, use original
  if (!name) {
    name = original;
  }

  // Clean canonical capitalization: capitalize first character
  name = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    name,
    amount: amount !== null && Number.isFinite(amount) ? Number(amount.toFixed(2)) : null,
    unit: unit || null,
    notes: extractedNotes.length > 0 ? extractedNotes.join(", ") : null,
    original,
  };
}

export function parseIngredientList(rawIngredients: string[]): StructuredIngredient[] {
  if (!Array.isArray(rawIngredients)) return [];
  return rawIngredients
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .map(parseIngredientString);
}
