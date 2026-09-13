/**
 * Recipe Language Detector
 * Fast, intelligent heuristic detection to determine if a recipe title, ingredients, or instructions
 * are primarily written in English versus another language (Swedish, Spanish, French, German, Italian, etc.)
 */

// Common culinary loanwords widely accepted in English recipes (prevents false positives)
const ACCEPTABLE_ENGLISH_LOANWORDS = new Set([
  "saute", "sauteed", "sauté", "sautéed",
  "jalapeno", "jalapenos", "jalapeño", "jalapeños",
  "creme", "fraiche", "crème", "fraîche",
  "puree", "purée", "pureed", "puréed",
  "crepe", "crepes", "crêpe", "crêpes",
  "chevre", "chèvre", "aioli", "aïoli",
  "souffle", "soufflé", "fondue", "flambe", "flambé",
  "pate", "pâté", "vinaigrette", "roux",
  "pasta", "pizza", "spaghetti", "parmesan", "mozzarella", "risotto", "lasagna",
  "taco", "tacos", "tortilla", "tortillas", "salsa", "guacamole", "cilantro",
  "croissant", "baguette", "brie", "camembert", "naan", "sushi", "tapas", "quesadilla"
]);

// Non-Latin alphabets (Cyrillic, Arabic, Hebrew, CJK, Greek, Thai, etc.)
const NON_LATIN_SCRIPT_REGEX = /[\u0400-\u04FF\u0600-\u06FF\u0590-\u05FF\u4E00-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\u0370-\u03FF\u0E00-\u0E7F]/;

// Uniquely Nordic / Germanic / Slavic accented characters that do not appear in English words
const DISTINCT_FOREIGN_CHARS = /[åäöÅÄÖæøÆØßłńśźżŁŃŚŹŻğüşöıİĞÜŞÖąćęłńóśźżĄĆĘŁŃÓŚŹŻčďěňřšťžů]/i;

// Strong English function words, units, and kitchen terms
const ENGLISH_INDICATORS = new Set([
  "the", "and", "with", "for", "from", "into", "over", "until", "then", "about", "each", "both", "your", "any", "all",
  "tbsp", "tsp", "tablespoon", "tablespoons", "teaspoon", "teaspoons", "cup", "cups", "oz", "lbs", "pound", "pounds",
  "clove", "cloves", "pinch", "pinches", "slice", "slices", "diced", "chopped", "minced", "sliced", "grated",
  "heat", "pan", "skillet", "pot", "bowl", "bake", "preheat", "simmer", "boil", "stir", "whisk", "toss",
  "serve", "golden", "brown", "minutes", "min", "mins", "seconds", "sec", "hours", "hr", "hrs", "degrees",
  "medium", "high", "low", "large", "small", "fresh", "dry", "dried", "warm", "cold", "hot",
  "season", "garnish", "drain", "rinse", "peel", "crush", "melt", "melted", "ground", "boneless", "skinless",
  "butter", "buter", "salt", "pepper", "sugar", "flour", "milk", "cheese", "oil", "water", "chicken", "beef",
  "pork", "fish", "garlic", "garlik", "onion", "onions", "tomato", "tomatoes", "potato", "potatoes", "fry", "cook"
]);

// Non-English culinary and function words (covers Swedish, Danish, Norwegian, Spanish, French, German, Italian, Portuguese, etc.)
const FOREIGN_INDICATORS = new Set([
  // Swedish / Scandinavian
  "och", "med", "eller", "till", "från", "fran", "för", "inte", "under", "efter",
  "stek", "koka", "vispa", "smält", "smalt", "hacka", "skiva", "tillsätt", "tillsatt", "blanda",
  "servera", "ugn", "kastrull", "stekpanna", "matsked", "tesked", "kryddmått", "dl", "krm", "msk", "tsk",
  "ägg", "agg", "smör", "smor", "mjöl", "mjol", "mjölk", "mjolk", "socker", "peppar",
  "vitlök", "vitlok", "lök", "lok", "kyckling", "nötfärs", "notfars", "blandfärs", "kött", "kott",
  "potatis", "morot", "grädde", "gradde", "olja", "vatten", "riven", "hackad", "skuren",
  "grader", "minuter", "gör", "gor", "så", "här", "ingredienser", "instruktioner", "bunke", "ströbröd", "ugnsform",
  "st", "burk", "burkar", "skivor", "tomatpuré", "tomatpure",
  // Danish / Norwegian
  "og", "ikke", "fløte", "flote", "hvitløk", "hvitlok", "laks", "poteter", "rømme", "romme",
  // Spanish
  "con", "para", "como", "pero", "cocinar", "mezclar", "agregar", "cebolla", "ajo", "aceite",
  "pimienta", "harina", "leche", "huevos", "agua", "fuego", "cucharada", "cucharadas", "cucharadita", "cucharaditas", "sartén", "sarten",
  // French
  "avec", "pour", "dans", "faire", "cuire", "mélanger", "melanger", "ajouter", "beurre",
  "farine", "sucre", "oeuf", "oeufs", "lait", "poivre", "oignon", "cuillère", "cuillere", "soupe", "cocotte",
  // German
  "und", "oder", "nach", "beim", "kochen", "braten", "mischen", "zugeben", "mehl", "zucker",
  "milch", "eier", "zwiebel", "knoblauch", "teelöffel", "esslöffel", "topf", "pfanne", "würstchen", "kartoffeln",
  // Italian
  "senza", "dopo", "cuocere", "mescolare", "aggiungere", "olio", "pepe", "cipolla", "aglio",
  "farina", "uova", "latte", "cucchiaio", "cucchiaino", "padella", "tagliare", "sbattere",
  // Portuguese
  "com", "azeite", "alho", "cebola", "ovos", "bacalhau", "batatas",
  // Finnish
  "keitto", "lohta", "perunaa", "tilliä", "vettä", "kermaa", "porkkanaa",
  // Polish
  "mąka", "mieso", "pieprz"
]);

export interface LanguageDetectionResult {
  isEnglish: boolean;
  detectedHint?: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Checks whether the recipe appears to be written in English.
 * Returns { isEnglish: true/false, detectedHint }
 */
export function detectRecipeLanguage(
  title: string,
  ingredients: string[] = [],
  instructions: string[] = []
): LanguageDetectionResult {
  const allText = [
    title,
    ...ingredients.slice(0, 10),
    ...instructions.slice(0, 6),
  ].join(" ").toLowerCase();

  if (!allText.trim()) {
    return { isEnglish: true, confidence: "low" };
  }

  // 1. Non-Latin script check (Cyrillic, Arabic, Asian, Hebrew, Greek, etc.)
  if (NON_LATIN_SCRIPT_REGEX.test(allText)) {
    return {
      isEnglish: false,
      detectedHint: "Non-Latin script detected (e.g. Cyrillic, Arabic, Asian)",
      confidence: "high",
    };
  }

  // 2. Tokenize words (letters)
  const rawWords = allText
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  if (rawWords.length === 0) {
    return { isEnglish: true, confidence: "low" };
  }

  let englishScore = 0;
  let foreignScore = 0;
  const matchedForeign: string[] = [];

  let hasDistinctForeignChars = false;
  for (const w of rawWords) {
    if (DISTINCT_FOREIGN_CHARS.test(w) && !ACCEPTABLE_ENGLISH_LOANWORDS.has(w)) {
      hasDistinctForeignChars = true;
      foreignScore += 2;
      if (!matchedForeign.includes(w) && matchedForeign.length < 3) {
        matchedForeign.push(w);
      }
    }

    if (FOREIGN_INDICATORS.has(w) && !ACCEPTABLE_ENGLISH_LOANWORDS.has(w)) {
      foreignScore++;
      if (!matchedForeign.includes(w) && matchedForeign.length < 3) {
        matchedForeign.push(w);
      }
    }

    if (ENGLISH_INDICATORS.has(w)) {
      englishScore++;
    }
  }

  // If distinct foreign characters are present (outside loanwords) and foreign signals outmatch English
  if (hasDistinctForeignChars && foreignScore > englishScore) {
    return {
      isEnglish: false,
      detectedHint: "Non-English letters or vocabulary detected (" + (matchedForeign.join(", ") || "special characters") + ")",
      confidence: "high",
    };
  }

  // Foreign vocabulary outmatches English words
  if (foreignScore >= 2 && foreignScore > englishScore) {
    return {
      isEnglish: false,
      detectedHint: "Non-English culinary terms detected (" + matchedForeign.join(", ") + ")",
      confidence: "high",
    };
  }

  // Short snippet with at least 1 strong foreign indicator and 0 English words
  if (foreignScore >= 1 && englishScore === 0 && rawWords.length >= 2) {
    return {
      isEnglish: false,
      detectedHint: "Non-English culinary terms detected (" + matchedForeign.join(", ") + ")",
      confidence: "medium",
    };
  }

  return {
    isEnglish: true,
    confidence: englishScore >= 2 ? "high" : "medium",
  };
}
