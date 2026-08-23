/**
 * Smart Supermarket Aisle & Category Classification Engine for Global and Swedish Groceries.
 */

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
};

export const GROCERY_CATEGORIES: CategoryMeta[] = [
  {
    id: "produce",
    name: "Produce & Fresh Herbs",
    icon: "🥦",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  {
    id: "meat_seafood",
    name: "Meat, Poultry & Seafood",
    icon: "🥩",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  {
    id: "dairy_fridge",
    name: "Dairy & Refrigerated",
    icon: "🧀",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  {
    id: "bakery_grains",
    name: "Pantry, Bread & Grains",
    icon: "🍞",
    badgeClass: "bg-amber-700/20 text-amber-200 border-amber-600/30",
  },
  {
    id: "spices_condiments",
    name: "Oils, Sauces & Spices",
    icon: "🧂",
    badgeClass: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  },
  {
    id: "beverages",
    name: "Coffee, Tea & Drinks",
    icon: "☕",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  },
  {
    id: "household_other",
    name: "Household & Personal",
    icon: "🧼",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  },
];

export const LEARNED_CATEGORY_MAP_KEY = "recipe_learned_category_map";

export const COMMON_PANTRY_STAPLES = [
  "salt", "kosher salt", "havssalt", "black pepper", "svartpeppar", "peppar",
  "olive oil", "olivolja", "vegetable oil", "matolja", "cooking oil", "butter", "smör",
  "flour", "vetemjöl", "sugar", "strösocker", "socker", "baking powder", "bakpulver",
  "soy sauce", "soja", "vinegar", "vinäger", "ättika", "garlic powder", "vitlökspulver",
  "onion powder", "lökpulver", "paprika powder", "paprikapulver", "chili flakes", "chiliflakes",
  "oregano", "thyme", "timjan", "cumin", "spiskummin", "cinnamon", "kanel", "vaniljsocker"
];

const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  household_other: [
    "dish", "dishwasher", "dish washer", "tablet", "tablets", "tab", "tabs", "disktablett", "disktabletter",
    "maskindisk", "diskborste", "torkpapper", "schampo", "shampoo", "balsam", "conditioner", "tvål", "soap",
    "deodorant", "deo", "tandkräm", "toothpaste", "tandborste", "toothbrush", "tvättmedel", "detergent",
    "sköljmedel", "bleach", "klorin", "servett", "servetter", "napkin", "napkins", "wipe", "wipes",
    "sponge", "svamp", "folie", "foil", "plastfolie", "cling film", "bakplåtspapper", "parchment",
    "trash", "sopkasse", "sopkassar", "soppåse", "soppåsar", "batteri", "batterier", "battery", "batteries",
    "candle", "ljus", "cleaner", "rengöring", "wettex", "plåster", "bandage", "alvedon", "ipren", "piller", "pills"
  ],
  meat_seafood: [
    "chicken", "kyckling", "beef", "oxe", "nöt", "nötfärs", "pork", "fläsk", "fläskfilé", "steak", "biff",
    "salmon", "lax", "torsk", "cod", "tuna", "tonfisk", "shrimp", "räkor", "prawn", "prawns", "bacon",
    "sausage", "korv", "falukorv", "prinskorv", "meatball", "köttbullar", "turkey", "kalkon", "lamb", "lamm",
    "ham", "skinka", "kotlett", "prosciutto", "salami", "entrecote", "ryggbiff"
  ],
  dairy_fridge: [
    "milk", "mjölk", "cream", "grädde", "butter", "smör", "cheese", "ost", "feta", "fetaost", "cheddar",
    "parmesan", "mozzarella", "yogurt", "yoghurt", "kvarg", "fil", "filbunke", "egg", "eggs", "ägg",
    "halloumi", "keso", "sour cream", "gräddfil", "creme fraiche", "crème fraîche", "cottage cheese",
    "ricotta", "mascarpone", "vispgrädde", "matlagningsgrädde", "havredryck", "havremjölk", "oat milk",
    "almond milk", "mandelmjölk"
  ],
  bakery_grains: [
    "bread", "bröd", "bun", "buns", "bulle", "bullar", "fralla", "frallor", "toast", "pasta", "spaghetti",
    "penne", "fusilli", "macaroni", "makaroner", "rice", "ris", "jasmine rice", "basmati", "noodle", "nudlar",
    "flour", "mjöl", "vetemjöl", "panko", "ströbröd", "oats", "havregryn", "müsli", "granola", "cereal",
    "flingor", "quinoa", "couscous", "tortilla", "tortillas", "wrap", "wraps", "knäckebröd", "croissant",
    "bagel", "bagels", "socker", "sugar", "brown sugar", "baking powder", "bakpulver", "yeast", "jäst"
  ],
  spices_condiments: [
    "oil", "olja", "olive oil", "olivolja", "avocado oil", "sesame oil", "sesamolja", "vinegar", "vinäger",
    "ättika", "soy", "soja", "tamari", "sauce", "sås", "gochujang", "sriracha", "ketchup", "mustard", "senap",
    "mayo", "majonnäs", "mayonnaise", "salt", "pepper", "peppar", "paprika", "cumin", "spiskummin", "oregano",
    "thyme", "timjan", "rosemary", "rosmarin", "curry", "kanel", "cinnamon", "honey", "honung", "syrup", "sirap",
    "buljong", "fond", "dressing", "chili flakes", "garlic powder", "vitlökspulver"
  ],
  beverages: [
    "coffee", "kaffe", "kaffebönor", "espresso", "tea", "te", "juice", "äppeljuice", "apelsinjuice",
    "soda", "läsk", "cola", "fanta", "sprite", "water", "vatten", "loka", "ramlösa", "öl", "beer", "wine",
    "vin", "cider", "energidryck", "monster", "redbull", "nocco", "smoothie"
  ],
  produce: [
    "avocado", "avokado", "lemon", "citron", "lime", "garlic", "vitlök", "onion", "lök", "gullök", "rödlök",
    "scallion", "salladslök", "shallot", "schalottenlök", "tomato", "tomatoes", "tomat", "tomater",
    "potato", "potatoes", "potatis", "spinach", "spenat", "kale", "grönkål", "herb", "herbs", "parsley",
    "persilja", "dill", "cilantro", "koriander", "basil", "basilika", "mint", "mynta", "ginger", "ingefära",
    "chili", "pepper", "bell pepper", "paprika", "carrot", "morot", "morötter", "cucumber", "gurka",
    "lettuce", "sallad", "isbergssallad", "apple", "äpple", "äpplen", "banana", "banan", "bananer",
    "berries", "bär", "jordgubbar", "blåbär", "hallon", "mushroom", "svamp", "champinjon", "champinjoner",
    "zucchini", "aubergine", "eggplant", "broccoli", "blomkål", "cauliflower", "sparris", "asparagus", "zest"
  ],
};

/**
 * Intelligent categorization matching user's learned memory and Swedish/English vocabulary.
 */
export function categorizeGroceryItem(itemName: string): GroceryCategory {
  const norm = itemName.toLowerCase().trim();

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

  // 2. Keyword scanning in priority order (household checked before food ingredients)
  const priorityOrder: GroceryCategory[] = [
    "household_other",
    "meat_seafood",
    "dairy_fridge",
    "bakery_grains",
    "spices_condiments",
    "beverages",
    "produce"
  ];

  for (const cat of priorityOrder) {
    const keywords = CATEGORY_KEYWORDS[cat];
    for (const kw of keywords) {
      if (norm.includes(kw)) {
        return cat;
      }
    }
  }

  return "produce"; // Fallback
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

export type StoredGroceryItem = {
  id?: string;
  name: string;
  quantity?: number;
  amount?: string;
  unit?: string;
  category?: GroceryCategory;
  bought: boolean;
  sourceRecipeTitle?: string;
  sourceDay?: string;
};

export type GroceryListCollection = {
  id: string;
  name: string;
  createdAt: number;
  items: StoredGroceryItem[];
};

export const GROCERY_CUSTOM_LISTS_KEY = "recipe_collector_custom_grocery_lists";
