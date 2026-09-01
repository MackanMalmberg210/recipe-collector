import { parseIngredientString } from "./ingredientParser";

export function capitalize(value: string) {
  if (!value) return "";
  return value
    .split(" ")
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word
    )
    .join(" ");
}

const NON_INGREDIENTS = new Set([
  "water",
  "tap water",
  "cold water",
  "warm water",
  "hot water",
  "boiling water",
  "ice",
  "ice cubes",
  "for serving",
  "to serve",
  "serving",
  "to taste",
  "as needed",
  "optional",
  "garnish",
  "for garnish",
  "an easy green salad",
  "green salad",
  "simple green salad",
  "side salad",
  "salad",
  "crusty bread for serving",
  "crusty bread",
  "bread for serving",
  "serving suggestion",
  "serving suggestions",
  "see note",
  "see notes",
  "notes",
  "instructions",
  "extra virgin olive oil for drizzling",
  "for drizzling",
]);

/**
 * Intelligent Canonicalizer:
 * - Strips measurements, units, conversational quantities ("a handful of", "zest of half of a")
 * - Handles compound lines ("salt and pepper" -> ["Salt", "Black Pepper"])
 * - Merges derivatives ("Lemon juice", "Lemon wedges", "Slice of lemon", "Zest of lemon" -> "Lemon")
 * - Filters out non-ingredients ("An easy green salad", "water", "for serving")
 */
export function canonicalizeIngredients(raw: string): string[] {
  if (!raw || typeof raw !== "string") return [];

  let text = raw.trim();

  // Strip leading numbers/fractions and standard units
  const parsed = parseIngredientString(text);
  text = parsed.name || text;

  // Normalize lower
  let clean = text.toLowerCase().trim();

  // Strip parentheticals
  clean = clean.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();

  // Strip alternatives e.g. "cilantro or greens" -> "cilantro", "fettuccine or penne" -> "fettuccine"
  if (clean.includes(" or ")) {
    clean = clean.split(/\s+or\s+/i)[0].trim();
  }

  // Check non-ingredients
  if (NON_INGREDIENTS.has(clean)) return [];

  // Check compound "salt and pepper" / "salt & pepper"
  if (
    clean.includes("salt and pepper") ||
    clean.includes("salt & pepper") ||
    clean.includes("salt and black pepper") ||
    clean === "salt pepper"
  ) {
    return ["Salt", "Black Pepper"];
  }

  // Iteratively strip conversational / qualitative prefix phrases
  let prev = "";
  while (prev !== clean) {
    prev = clean;
    clean = clean
      .replace(
        /^(an?\s+)?(handful|pinch|splash|drizzle|squeeze|dash|touch|drop|knob|slice|slices|piece|pieces|bunch|sprig|sprigs|clove|cloves|head|heads|can|cans|jar|jars|tin|packet|bag|box|stalk|stalks|wedge|wedges|zest|juice|half|quarter)\s+(of\s+)?(a\s+)?/i,
        "",
      )
      .replace(/^(an?\s+)?(easy|simple|quick|fresh|dried|frozen|raw|organic)\s+/i, "")
      .replace(/^(half\s+of\s+a|half\s+a|quarter\s+of\s+a|quarter\s+a|about|approximately|extra|some)\s+/i, "")
      .trim();
  }

  // Strip trailing notes
  clean = clean.replace(/\b(for\s+serving|to\s+taste|for\s+garnish|optional|as\s+needed|divided)\b/gi, "").trim();

  // Strip common culinary modifiers
  clean = clean
    .replace(
      /\b(fresh|freshly|dried|frozen|raw|organic|chopped|finely\s+chopped|coarsely\s+chopped|diced|minced|grated|freshly\s+grated|shredded|sliced|thinly\s+sliced|crushed|melted|softened|mashed|ground|warm|cold|lukewarm|chilled|peeled|deveined|trimmed|stemmed|seeded|hulled|cubed|leaves|leaf|sprigs|sprig|stalks|stalk|cloves|clove|head|heads|wedges|wedge|slices|slice|halves|half|pieces|piece|and\s+drained|rinsed|drained|cooked|uncooked|boneless|skinless|large|medium|small)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  // Check non-ingredients again after stripping
  if (!clean || NON_INGREDIENTS.has(clean)) return [];

  // Canonical mapping dictionary
  if (clean.includes("lemon") && !clean.includes("grass")) {
    return ["Lemon"];
  }
  if (clean.includes("lime") && !clean.includes("bean")) {
    return ["Lime"];
  }
  if (clean.includes("orange") && !clean.includes("chicken")) {
    return ["Orange"];
  }
  if (clean === "garlic" || clean.includes("garlic")) {
    if (clean.includes("powder")) return ["Garlic Powder"];
    return ["Garlic"];
  }
  if (clean === "basil" || clean.includes("basil")) {
    return ["Basil"];
  }
  if (clean === "parsley" || clean.includes("parsley")) {
    return ["Parsley"];
  }
  if (clean === "cilantro" || clean.includes("coriander leaf") || clean.includes("coriander leaves")) {
    return ["Cilantro"];
  }
  if (clean === "rosemary" || clean.includes("rosemary")) {
    return ["Rosemary"];
  }
  if (clean === "thyme" || clean.includes("thyme")) {
    return ["Thyme"];
  }
  if (clean === "dill" || clean.includes("dill")) {
    return ["Dill"];
  }
  if (clean === "mint" || clean.includes("mint")) {
    return ["Mint"];
  }
  if (clean.includes("olive oil") || clean === "evoo") {
    return ["Olive Oil"];
  }
  if (clean.includes("black pepper") || clean === "pepper" || clean.includes("ground pepper")) {
    return ["Black Pepper"];
  }
  if (clean === "salt" || clean.includes("kosher salt") || clean.includes("sea salt")) {
    return ["Salt"];
  }
  if (clean.includes("salmon") || clean.includes("lax")) {
    return ["Salmon"];
  }
  if (clean.includes("chicken") || clean.includes("kyckling")) {
    if (clean.includes("breast") || clean.includes("bröst") || clean.includes("filé")) return ["Chicken Breast"];
    if (clean.includes("thigh") || clean.includes("lår")) return ["Chicken Thighs"];
    return ["Chicken"];
  }
  if (clean.includes("parmesan") || clean.includes("parmigiano")) {
    return ["Parmesan Cheese"];
  }
  if (clean.includes("mozzarella")) {
    return ["Mozzarella"];
  }
  if (clean.includes("cheddar")) {
    return ["Cheddar Cheese"];
  }
  if (clean.includes("feta")) {
    return ["Feta Cheese"];
  }
  if (clean.includes("heavy cream") || clean.includes("whipping cream") || clean.includes("double cream")) {
    return ["Heavy Cream"];
  }
  if (clean.includes("sour cream")) {
    return ["Sour Cream"];
  }
  if (clean.includes("butter") && !clean.includes("peanut") && !clean.includes("almond")) {
    return ["Butter"];
  }
  if (clean === "egg" || clean === "eggs" || clean.includes("egg yolk") || clean.includes("egg white")) {
    return ["Eggs"];
  }
  if (clean.includes("chicken breast") || clean === "chicken breasts") {
    return ["Chicken Breast"];
  }
  if (clean.includes("chicken thigh") || clean === "chicken thighs") {
    return ["Chicken Thighs"];
  }
  if (clean.includes("ground beef") || clean.includes("minced beef")) {
    return ["Ground Beef"];
  }
  if (clean.includes("salmon")) {
    return ["Salmon"];
  }
  if (clean.includes("shrimp") || clean.includes("prawn")) {
    return ["Shrimp"];
  }
  if (clean.includes("soy sauce")) {
    return ["Soy Sauce"];
  }
  if (clean.includes("sesame oil")) {
    return ["Sesame Oil"];
  }
  if (clean.includes("sesame seed") || clean.includes("sesame seeds")) {
    return ["Sesame Seeds"];
  }
  if (clean.includes("dijon")) {
    return ["Dijon Mustard"];
  }
  if (clean.includes("mayonnaise") || clean === "mayo") {
    return ["Mayonnaise"];
  }
  if (clean.includes("chicken broth") || clean.includes("chicken stock")) {
    return ["Chicken Broth"];
  }
  if (clean.includes("beef broth") || clean.includes("beef stock")) {
    return ["Beef Broth"];
  }
  if (clean.includes("vegetable broth") || clean.includes("vegetable stock")) {
    return ["Vegetable Broth"];
  }
  if (clean.includes("spinach")) {
    return ["Spinach"];
  }
  if (clean.includes("avocado")) {
    return ["Avocado"];
  }
  if (clean.includes("cucumber")) {
    return ["Cucumber"];
  }
  if (clean.includes("tomato paste")) {
    return ["Tomato Paste"];
  }
  if (clean.includes("diced tomato") || clean.includes("crushed tomato") || clean.includes("canned tomato")) {
    return ["Diced Tomatoes"];
  }
  if (clean.includes("brown sugar")) {
    return ["Brown Sugar"];
  }
  if (clean.includes("sugar")) {
    return ["Sugar"];
  }
  if (clean.includes("flour") && !clean.includes("tortilla")) {
    return ["Flour"];
  }
  if (clean.includes("honey")) {
    return ["Honey"];
  }
  if (clean.includes("ginger")) {
    return ["Fresh Ginger"];
  }
  if (clean.includes("red onion")) {
    return ["Red Onion"];
  }
  if (clean.includes("green onion") || clean.includes("scallion") || clean.includes("spring onion")) {
    return ["Green Onions"];
  }
  if (clean.includes("onion")) {
    return ["Yellow Onion"];
  }

  return [capitalize(clean)];
}

export function cleanIngredientName(raw: string): string {
  const list = canonicalizeIngredients(raw);
  return list[0] || capitalize(raw.trim());
}