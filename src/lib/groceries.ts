/**
 * Smart Supermarket Aisle & Category Classification Engine for Global and Swedish Groceries.
 */

import { sanitizeCulinaryText } from "./culinaryTextSanitizer";

export type GroceryCategory =
  | "produce"
  | "meat_seafood"
  | "dairy_fridge"
  | "bakery_grains"
  | "spices_condiments"
  | "beverages"
  | "household_other";

export type CategoryMeta = {
  id: GroceryCategory;
  name: string;
  icon: string;
  badgeClass: string;
  cardBorder: string;
  headerBg: string;
  accentText: string;
  countBadge: string;
};

export const GROCERY_CATEGORIES: CategoryMeta[] = [
  {
    id: "produce",
    name: "Produce & Fresh Herbs",
    icon: "🥦",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    cardBorder: "border-emerald-500/25 hover:border-emerald-500/45",
    headerBg: "from-emerald-950/40 via-emerald-900/15 to-transparent",
    accentText: "text-emerald-400",
    countBadge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  {
    id: "meat_seafood",
    name: "Meat, Poultry & Seafood",
    icon: "🥩",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    cardBorder: "border-rose-500/25 hover:border-rose-500/45",
    headerBg: "from-rose-950/40 via-rose-900/15 to-transparent",
    accentText: "text-rose-400",
    countBadge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  {
    id: "dairy_fridge",
    name: "Dairy & Refrigerated",
    icon: "🧀",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    cardBorder: "border-amber-500/25 hover:border-amber-500/45",
    headerBg: "from-amber-950/40 via-amber-900/15 to-transparent",
    accentText: "text-amber-400",
    countBadge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  {
    id: "bakery_grains",
    name: "Pantry, Bread & Grains",
    icon: "🍞",
    badgeClass: "bg-yellow-600/20 text-yellow-200 border-yellow-600/30",
    cardBorder: "border-yellow-600/25 hover:border-yellow-600/45",
    headerBg: "from-yellow-950/40 via-yellow-900/15 to-transparent",
    accentText: "text-yellow-400",
    countBadge: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  },
  {
    id: "spices_condiments",
    name: "Oils, Sauces & Spices",
    icon: "🧂",
    badgeClass: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    cardBorder: "border-orange-500/25 hover:border-orange-500/45",
    headerBg: "from-orange-950/40 via-orange-900/15 to-transparent",
    accentText: "text-orange-400",
    countBadge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  },
  {
    id: "beverages",
    name: "Coffee, Tea & Drinks",
    icon: "☕",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    cardBorder: "border-cyan-500/25 hover:border-cyan-500/45",
    headerBg: "from-cyan-950/40 via-cyan-900/15 to-transparent",
    accentText: "text-cyan-400",
    countBadge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  {
    id: "household_other",
    name: "Household & Personal",
    icon: "🧼",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    cardBorder: "border-purple-500/25 hover:border-purple-500/45",
    headerBg: "from-purple-950/40 via-purple-900/15 to-transparent",
    accentText: "text-purple-400",
    countBadge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
];

export const LEARNED_CATEGORY_MAP_KEY = "recipe_learned_category_map";
export const PANTRY_INVENTORY_KEY = "recipe_pantry_inventory_items";
export const GROCERY_CUSTOM_LISTS_KEY = "recipe_collector_custom_grocery_lists";

export type StoredGroceryItem = {
  id?: string;
  name: string;
  quantity?: number;
  amount?: string;
  unit?: string;
  category?: GroceryCategory;
  bought: boolean;
  sourceRecipeTitle?: string;
  sourceRecipeId?: number | string;
  sourceDay?: string;
};

export type GroceryListCollection = {
  id: string;
  name: string;
  createdAt: number;
  items: StoredGroceryItem[];
};

export type PantryItem = {
  id: string;
  name: string;
  category: GroceryCategory;
  inStock: boolean;
  notes?: string;
};

export const DEFAULT_PANTRY_ITEMS: PantryItem[] = [
  // Oils & Sauces
  { id: "p1", name: "Olive oil", category: "spices_condiments", inStock: true },
  { id: "p2", name: "Vegetable oil", category: "spices_condiments", inStock: true },
  { id: "p3", name: "Soy sauce", category: "spices_condiments", inStock: true },
  { id: "p4", name: "Sesame oil", category: "spices_condiments", inStock: true },
  { id: "p5", name: "Balsamic vinegar", category: "spices_condiments", inStock: true },
  { id: "p6", name: "Dijon mustard", category: "spices_condiments", inStock: true },
  { id: "p7", name: "Mayonnaise", category: "spices_condiments", inStock: true },
  { id: "p8", name: "Honey", category: "spices_condiments", inStock: true },
  { id: "p9", name: "Sriracha", category: "spices_condiments", inStock: true },

  // Spices & Seasoning
  { id: "p10", name: "Kosher salt", category: "spices_condiments", inStock: true },
  { id: "p11", name: "Black pepper", category: "spices_condiments", inStock: true },
  { id: "p12", name: "Garlic powder", category: "spices_condiments", inStock: true },
  { id: "p13", name: "Paprika powder", category: "spices_condiments", inStock: true },
  { id: "p14", name: "Ground cumin", category: "spices_condiments", inStock: true },
  { id: "p15", name: "Chili flakes", category: "spices_condiments", inStock: true },
  { id: "p16", name: "Dried oregano", category: "spices_condiments", inStock: true },
  { id: "p17", name: "Dried thyme", category: "spices_condiments", inStock: true },
  { id: "p18", name: "Cinnamon", category: "spices_condiments", inStock: true },

  // Grains, Pasta & Baking
  { id: "p19", name: "All-purpose flour", category: "bakery_grains", inStock: true },
  { id: "p20", name: "White sugar", category: "bakery_grains", inStock: true },
  { id: "p21", name: "Brown sugar", category: "bakery_grains", inStock: true },
  { id: "p22", name: "Baking powder", category: "bakery_grains", inStock: true },
  { id: "p23", name: "Dry yeast", category: "bakery_grains", inStock: true },
  { id: "p24", name: "Pasta", category: "bakery_grains", inStock: true },
  { id: "p25", name: "Jasmine rice", category: "bakery_grains", inStock: true },
  { id: "p26", name: "Oats", category: "bakery_grains", inStock: true },
  { id: "p27", name: "Panko breadcrumbs", category: "bakery_grains", inStock: true },
  { id: "p28", name: "Canned diced tomatoes", category: "bakery_grains", inStock: true },
  { id: "p29", name: "Canned black beans", category: "bakery_grains", inStock: true },

  // Fridge & Dairy Staples
  { id: "p30", name: "Butter", category: "dairy_fridge", inStock: true },
  { id: "p31", name: "Eggs", category: "dairy_fridge", inStock: true },
  { id: "p32", name: "Milk", category: "dairy_fridge", inStock: true },
  { id: "p33", name: "Parmesan cheese", category: "dairy_fridge", inStock: true },

  // Long-lasting Produce Staples
  { id: "p34", name: "Garlic", category: "produce", inStock: true },
  { id: "p35", name: "Yellow onions", category: "produce", inStock: true },
  { id: "p36", name: "Potatoes", category: "produce", inStock: true },
];

export const COMMON_PANTRY_STAPLES = DEFAULT_PANTRY_ITEMS.map((item) => item.name.toLowerCase());

export function getPantryInventory(): PantryItem[] {
  if (typeof window === "undefined") return DEFAULT_PANTRY_ITEMS;
  try {
    const raw = localStorage.getItem(PANTRY_INVENTORY_KEY);
    if (!raw) {
      localStorage.setItem(PANTRY_INVENTORY_KEY, JSON.stringify(DEFAULT_PANTRY_ITEMS));
      return DEFAULT_PANTRY_ITEMS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PANTRY_ITEMS;
  }
}

export function savePantryInventory(items: PantryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PANTRY_INVENTORY_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("pantry_inventory_updated"));
  } catch {}
}

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  household_other: [
    "dish", "dishwasher", "disktablett", "disktabletter", "maskindisk", "diskmedel", "diskborste",
    "torkpapper", "hushållspapper", "paper towel", "toalettpapper", "toilet paper", "schampo", "shampoo",
    "balsam", "conditioner", "tvål", "soap", "deodorant", "deo", "tandkräm", "toothpaste", "tandborste",
    "toothbrush", "tvättmedel", "detergent", "sköljmedel", "bleach", "klorin", "servett", "servetter",
    "napkin", "napkins", "wipe", "wipes", "sponge", "svamp", "folie", "foil", "plastfolie", "cling film",
    "bakplåtspapper", "parchment", "trash", "sopkasse", "sopkassar", "soppåse", "soppåsar", "batteri",
    "batterier", "battery", "batteries", "candle", "ljus", "cleaner", "rengöring", "wettex", "plåster",
    "bandage", "alvedon", "ipren", "piller", "pills", "foil", "ziploc", "fryspåsar"
  ],
  beverages: [
    "coffee", "kaffe", "kaffebönor", "espresso", "bryggkaffe", "tea", "te", "earl grey", "grönt te",
    "juice", "äppeljuice", "apelsinjuice", "soda", "läsk", "cola", "coca cola", "pepsi", "fanta",
    "sprite", "7up", "water", "vatten", "mineralvatten", "loka", "ramlösa", "öl", "beer", "ipa",
    "lager", "wine", "vin", "rödvin", "vitvin", "cider", "energidryck", "monster", "redbull", "nocco",
    "celsius", "smoothie", "tonic", "kombucha", "must", "julmust", "påskmust"
  ],
  meat_seafood: [
    "chicken", "kyckling", "kycklingbröst", "kycklingfilé", "kycklinglår", "beef", "nötkött", "oxe",
    "nöt", "nötfärs", "ground beef", "minced beef", "pork", "fläsk", "fläskfilé", "fläskkarré", "fläskfärs",
    "steak", "biff", "oxfilé", "ryggbiff", "entrecote", "salmon", "lax", "laxfilé", "cod", "torsk",
    "torskrygg", "tuna", "tonfisk", "shrimp", "shrimps", "räkor", "handskalade räkor", "prawn", "prawns",
    "scampi", "bacon", "sausage", "korv", "falukorv", "prinskorv", "bratwurst", "chorizo", "meatball",
    "köttbullar", "turkey", "kalkon", "kalkonbröst", "lamb", "lamm", "lammfärs", "ham", "skinka",
    "rökt skinka", "prosciutto", "parmaskinka", "salami", "charkuterier", "duck", "anka", "tofu",
    "soyafärs", "quorn", "seitan", "vegofärs", "krabba", "musslor", "mussels", "hummer", "lobster"
  ],
  dairy_fridge: [
    "milk", "mjölk", "mellanmjölk", "lättmjölk", "standardmjölk", "cream", "grädde", "vispgrädde",
    "matlagningsgrädde", "heavy cream", "butter", "smör", "bregott", "margarin", "cheese", "ost",
    "hårdost", "herrgård", "prästost", "grevé", "feta", "fetaost", "cheddar", "parmesan", "parmigiano",
    "grana padano", "mozzarella", "burrata", "yogurt", "yoghurt", "turkisk yoghurt", "grekisk yoghurt",
    "kvarg", "fil", "filbunke", "filmjölk", "egg", "eggs", "ägg", "halloumi", "keso", "cottage cheese",
    "sour cream", "gräddfil", "creme fraiche", "crème fraîche", "ricotta", "mascarpone", "cream cheese",
    "philadelphia", "havredryck", "havremjölk", "oat milk", "oatley", "almond milk", "mandelmjölk",
    "sojamjölk", "kokosmjölk", "coconut milk", "plant butter", "smörgåsfett", "jäst", "yeast"
  ],
  bakery_grains: [
    "bread", "bröd", "surdegsbröd", "limpa", "formfranska", "bun", "buns", "bulle", "bullar",
    "kanelbulle", "fralla", "frallor", "toast", "rostbröd", "pasta", "spaghetti", "penne", "fusilli",
    "rigatoni", "lasagne", "macaroni", "makaroner", "tagliatelle", "rice", "ris", "jasmine rice",
    "jasminris", "basmati", "basmatiris", "arborio", "risottoris", "noodle", "noodles", "nudlar",
    "ramen", "udon", "äggnudlar", "glasnudlar", "flour", "mjöl", "vetemjöl", "rågmjöl", "dinkelmjöl",
    "panko", "ströbröd", "breadcrumbs", "oats", "havregryn", "müsli", "granola", "cereal", "flingor",
    "cornflakes", "quinoa", "couscous", "bulgur", "tortilla", "tortillas", "wrap", "wraps", "tacoskal",
    "nachos", "tortillachips", "knäckebröd", "wasa", "croissant", "bagel", "bagels", "socker", "sugar",
    "strösocker", "brown sugar", "farinsocker", "florsocker", "powdered sugar", "baking powder",
    "bakpulver", "bikarbonat", "baking soda", "vaniljsocker", "vanilla sugar", "kakao", "cocoa powder",
    "canned tomatoes", "krossade tomater", "passerade tomater", "diced tomatoes", "chickpeas",
    "kikärtor", "beans", "bönor", "svarta bönor", "kidneybönor", "lentils", "linser", "belugalinser",
    "röda linser", "crackers", "kex", "digestive", "chiafrön", "chia seeds", "linfrön", "flaxseed",
    "pumpakärnor", "solroskärnor", "sunflower seeds", "pumpkin seeds"
  ],
  spices_condiments: [
    "oil", "olja", "olive oil", "olivolja", "avocado oil", "sesame oil", "sesamolja", "matolja",
    "rapsolja", "canola oil", "solrosolja", "chili oil", "chiliolja", "sesame seeds", "sesamfrön", "sesamfrö",
    "vinegar", "vinäger", "rice vinegar", "risvinäger", "balsamico", "balsamic vinegar",
    "äppelcidervinäger", "apple cider vinegar", "vitvinsvinäger", "rödvinsvinäger", "ättika", "soy",
    "soja", "sojasås", "japansk soja", "kinesisk soja", "tamari", "sauce", "sås", "bbq sauce",
    "gochujang", "sriracha", "sambal oelek", "tabasco", "chilisås", "ketchup", "mustard", "senap",
    "dijonsenap", "mayo", "majonnäs", "mayonnaise", "salt", "flingsalt", "havssalt", "kosher salt",
    "peppar", "svartpeppar", "vitpeppar", "black pepper", "white pepper", "paprika", "paprikapulver",
    "rökt paprika", "smoked paprika", "cumin", "spiskummin", "oregano", "thyme", "timjan", "rosemary",
    "rosmarin", "basilika", "curry", "currypulver", "gurkmeja", "turmeric", "kanel", "cinnamon",
    "kardemumma", "cardamom", "ingefära pulver", "ground ginger", "muskot", "nutmeg", "lagerblad",
    "bay leaves", "chili flakes", "chiliflakes", "garlic powder", "vitlökspulver", "onion powder",
    "lökpulver", "honey", "honung", "syrup", "sirap", "lönnsirap", "maple syrup", "buljong",
    "grönsaksbuljong", "hönsbuljong", "köttbuljong", "fond", "kalvfond", "kycklingfond", "dressing",
    "pesto", "tomatpuré", "tomato paste", "tahini", "jordnötssmör", "peanut butter", "fish sauce",
    "fisksås", "oyster sauce", "ostronsås", "mirin", "hoisin", "hoisinsås", "teriyaki", "ponzu",
    "wasabi", "miso", "misopasta", "curry paste", "currypasta", "vaniljextrakt", "vanilla extract"
  ],
  produce: [
    "avocado", "avokado", "lemon", "citron", "citroner", "lime", "limes", "garlic", "vitlök",
    "vitlöksklyfta", "onion", "lök", "gullök", "gul lök", "yellow onion", "red onion", "rödlök",
    "scallion", "salladslök", "spring onion", "shallot", "schalottenlök", "leek", "purjolök",
    "tomato", "tomatoes", "tomat", "tomater", "körsbärstomater", "cherry tomatoes", "potato",
    "potatoes", "potatis", "färskpotatis", "sweet potato", "sötpotatis", "spinach", "spenat",
    "babyspenat", "kale", "grönkål", "herb", "herbs", "ört", "örter", "parsley", "persilja",
    "bladpersilja", "dill", "färsk dill", "cilantro", "koriander", "färsk koriander", "basil",
    "basilika", "färsk basilika", "mint", "mynta", "färsk mynta", "ginger", "ingefära", "färsk ingefära",
    "chili", "röd chili", "jalapeno", "habanero", "bell pepper", "paprika", "röd paprika", "grön paprika",
    "gul paprika", "carrot", "morot", "morötter", "cucumber", "gurka", "slanggurka", "lettuce",
    "sallad", "isbergssallad", "romansallad", "rucola", "arugula", "machesallad", "apple", "apples",
    "äpple", "äpplen", "banana", "bananas", "banan", "bananer", "berries", "bär", "strawberries",
    "jordgubbar", "blueberries", "blåbär", "raspberries", "hallon", "mushroom", "mushrooms", "svamp",
    "champinjoner", "kantareller", "portabello", "shiitake", "zucchini", "aubergine", "eggplant",
    "broccoli", "blomkål", "cauliflower", "sparris", "asparagus", "sockerärtor", "haricots verts",
    "ärtor", "peas", "majs", "corn", "selleri", "celery", "blekselleri", "kål", "cabbage", "vitkål",
    "rödkål", "spetskål", "zest", "limezest", "citronzest", "apelsin", "orange", "grapefrukt",
    "mango", "ananas", "pineapple", "vindruvor", "grapes", "granatäpple", "pomegranate"
  ],
};

/**
 * Intelligent categorization matching user's learned memory and Swedish/English vocabulary.
 */
export function categorizeGroceryItem(itemName: string): GroceryCategory {
  const norm = itemName.toLowerCase().trim();
  if (!norm) return "household_other";

  // 1. Check user's learned category overrides in localStorage
  if (typeof window !== "undefined") {
    try {
      const mapRaw = localStorage.getItem(LEARNED_CATEGORY_MAP_KEY);
      if (mapRaw) {
        const learnedMap = JSON.parse(mapRaw) as Record<string, GroceryCategory>;
        if (learnedMap[norm]) {
          return learnedMap[norm];
        }
      }
    } catch {}
  }

  // 2. Keyword scanning in strict priority order (Household -> Meat -> Dairy -> Bakery -> Spices -> Beverages -> Produce)
  const priorityOrder: GroceryCategory[] = [
    "household_other",
    "meat_seafood",
    "dairy_fridge",
    "bakery_grains",
    "spices_condiments",
    "beverages",
    "produce",
  ];

  // Token-based exact matching or word boundaries
  const words = norm.split(/[\s,.-]+/);

  for (const cat of priorityOrder) {
    const keywords = CATEGORY_KEYWORDS[cat];
    for (const kw of keywords) {
      // Check exact word match or phrase inclusion
      if (norm === kw || words.includes(kw) || norm.includes(` ${kw} `) || norm.startsWith(`${kw} `) || norm.endsWith(` ${kw}`)) {
        return cat;
      }
    }
  }

  // 3. Fallback to broad substring search
  for (const cat of priorityOrder) {
    const keywords = CATEGORY_KEYWORDS[cat];
    for (const kw of keywords) {
      if (kw.length >= 4 && norm.includes(kw)) {
        return cat;
      }
    }
  }

  // 4. Intelligent default fallback (general household/pantry instead of produce)
  return "bakery_grains";
}

/**
 * Saves a custom category mapping for a word so it is permanently categorized correctly.
 */
export function saveLearnedCategory(itemName: string, category: GroceryCategory) {
  if (typeof window === "undefined") return;
  const norm = itemName.toLowerCase().trim();
  try {
    const mapRaw = localStorage.getItem(LEARNED_CATEGORY_MAP_KEY);
    const learnedMap: Record<string, GroceryCategory> = mapRaw ? JSON.parse(mapRaw) : {};
    learnedMap[norm] = category;
    localStorage.setItem(LEARNED_CATEGORY_MAP_KEY, JSON.stringify(learnedMap));
  } catch {}
}

/**
 * Returns all custom grocery lists stored in localStorage.
 */
export function getCustomGroceryLists(): GroceryListCollection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GROCERY_CUSTOM_LISTS_KEY);
    return raw ? (JSON.parse(raw) as GroceryListCollection[]) : [];
  } catch {
    return [];
  }
}

/**
 * Smart Culinary Stemmer & Singular/Plural Normalizer.
 * Matches words regardless of singular/plural forms (e.g. Avocado <-> Avocados, Tomato <-> Tomatoes, Onion <-> Onions).
 */
export function getStemmedWord(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  let s = sanitizeCulinaryText(raw).toLowerCase().trim();

  // Strip common packaging/prep words
  s = s.replace(/\b(?:fresh|dried|organic|raw|ripe|chopped|diced|sliced|minced|peeled|ground)\b/g, "").replace(/\s+/g, " ").trim();

  // Common culinary irregulars and plural mappings (Swedish & English)
  const irregularPlurals: Record<string, string> = {
    tomatoes: "tomato",
    tomater: "tomat",
    potatoes: "potato",
    potatisar: "potatis",
    avocados: "avocado",
    avocadoes: "avocado",
    onions: "onion",
    lökar: "lök",
    cloves: "clove",
    klyftor: "klyfta",
    fillets: "fillet",
    filéer: "filé",
    eggs: "egg",
    ägg: "ägg",
    limes: "lime",
    lemons: "lemon",
    citroner: "citron",
    carrots: "carrot",
    morötter: "morot",
    cucumbers: "cucumber",
    gurkor: "gurka",
    peppers: "pepper",
    paprikor: "paprika",
    berries: "berry",
    bär: "bär",
    strawberries: "strawberry",
    jordgubbar: "jordgubb",
    blueberries: "blueberry",
    blåbär: "blåbär",
    cherries: "cherry",
    körsbär: "körsbär",
    apples: "apple",
    äpplen: "äpple",
    mushrooms: "mushroom",
    svampar: "svamp",
    noodles: "noodle",
    nudlar: "nudel",
    chickpeas: "chickpea",
    kikärtor: "kikärta",
    lentils: "lentil",
    linser: "lins",
    beans: "bean",
    bönor: "böna",
    walnuts: "walnut",
    valnötter: "valnöt",
    almonds: "almond",
    mandlar: "mandel",
    peanuts: "peanut",
    jordnötter: "jordnöt",
    pistachios: "pistachio",
    pistagenötter: "pistagenöt",
    seeds: "seed",
    frön: "frö",
    leaves: "leaf",
    blad: "blad",
    shallots: "shallot",
    schalottenlökar: "schalottenlök",
    scallions: "scallion",
    salladslökar: "salladslök",
    leeks: "leek",
    purjolökar: "purjolök",
  };

  if (irregularPlurals[s]) {
    return irregularPlurals[s];
  }

  // Multi-word stem check (e.g. "cherry tomatoes" -> "cherry tomato")
  const words = s.split(" ");
  const lastWord = words[words.length - 1];
  if (irregularPlurals[lastWord]) {
    words[words.length - 1] = irregularPlurals[lastWord];
    return words.join(" ");
  }

  // Standard regular suffix stripping
  if (s.endsWith("ies") && s.length > 4) {
    return s.slice(0, -3) + "y";
  }
  if (s.endsWith("es") && s.length > 4 && !s.endsWith("ches") && !s.endsWith("shes") && !s.endsWith("sses")) {
    return s.slice(0, -2);
  }
  if (s.endsWith("s") && !s.endsWith("ss") && s.length > 3) {
    return s.slice(0, -1);
  }

  return s;
}

export function isSameGroceryItem(a: string, b: string): boolean {
  if (!a || !b) return false;
  const stemA = getStemmedWord(a);
  const stemB = getStemmedWord(b);
  if (stemA === stemB) return true;
  return stemA.replace(/\s+/g, "") === stemB.replace(/\s+/g, "");
}

/**
 * Universal formatter for grocery item names:
 * Sanitizes input and guarantees that the first character is always capitalized.
 */
export function formatGroceryItemName(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const cleaned = sanitizeCulinaryText(raw).trim();
  if (!cleaned) return "";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Adds recipe ingredients directly to either the Main shopping list or any custom list.
 */
export function addIngredientsToChosenList(
  ingredients: string[],
  recipeTitle?: string,
  recipeId?: number | string,
  targetListId: string = "main",
): { addedCount: number; listName: string } {
  if (typeof window === "undefined" || !ingredients || ingredients.length === 0) {
    return { addedCount: 0, listName: "Main List" };
  }

  const cleanIngredients = ingredients
    .map((i) => formatGroceryItemName(i))
    .filter((i) => i.length > 0);

  if (cleanIngredients.length === 0) {
    return { addedCount: 0, listName: "Main List" };
  }

  if (targetListId === "main") {
    const stored = localStorage.getItem("groceryList");
    let current: StoredGroceryItem[] = [];
    if (stored) {
      try {
        current = JSON.parse(stored) as StoredGroceryItem[];
      } catch {}
    }

    const existingStems = new Set(current.map((i) => getStemmedWord(i.name)));
    const newItems: StoredGroceryItem[] = [];

    cleanIngredients.forEach((ing) => {
      const stem = getStemmedWord(ing);
      if (!existingStems.has(stem)) {
        newItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: ing,
          quantity: 1,
          category: categorizeGroceryItem(ing),
          bought: false,
          sourceRecipeTitle: recipeTitle,
          sourceRecipeId: recipeId,
        });
        existingStems.add(stem);
      }
    });

    localStorage.setItem("groceryList", JSON.stringify([...current, ...newItems]));
    window.dispatchEvent(new CustomEvent("grocery_items_updated", { detail: { count: newItems.length } }));

    return { addedCount: newItems.length, listName: "Main Shopping List" };
  }

  // Custom list
  const customLists = getCustomGroceryLists();
  const targetListIndex = customLists.findIndex((l) => l.id === targetListId);
  const targetList = targetListIndex >= 0 ? customLists[targetListIndex] : null;

  if (!targetList) {
    return { addedCount: 0, listName: "Shopping List" };
  }

  const existingStems = new Set(targetList.items.map((i) => getStemmedWord(i.name)));
  const newItems: StoredGroceryItem[] = [];

  cleanIngredients.forEach((ing) => {
    const stem = getStemmedWord(ing);
    if (!existingStems.has(stem)) {
      newItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: ing,
        quantity: 1,
        category: categorizeGroceryItem(ing),
        bought: false,
        sourceRecipeTitle: recipeTitle,
        sourceRecipeId: recipeId,
      });
      existingStems.add(stem);
    }
  });

  const updatedLists = [...customLists];
  updatedLists[targetListIndex] = {
    ...targetList,
    items: [...targetList.items, ...newItems],
  };

  localStorage.setItem(GROCERY_CUSTOM_LISTS_KEY, JSON.stringify(updatedLists));
  window.dispatchEvent(new CustomEvent("grocery_items_updated", { detail: { count: newItems.length } }));

  return { addedCount: newItems.length, listName: targetList.name };
}

