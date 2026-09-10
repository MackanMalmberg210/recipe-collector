/**
 * Comprehensive Snack Nutrition & Calorie Estimation Engine
 * Provides instant, zero-latency calorie estimates and realistic portion sizes
 * for quick snacks, fruits, nuts, smoothies, and light bites.
 */

export type SnackNutritionEstimate = {
  title: string;
  calories: number;
  portion: string;
  category: "Fruit" | "Protein" | "Nuts & Seeds" | "Dairy" | "Bar & Bite" | "Veggie" | "Quick Snack";
  defaultImage: string;
};

// Verified dark-culinary photography mapping
export const DEFAULT_SNACK_IMAGES = {
  fruit: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80", // Fresh dark berries & fruit
  banana: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=600&auto=format&fit=crop&q=80", // Bananas on dark table
  apple: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80", // Crisp red apples
  berries: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80", // Berries & yogurt
  nuts: "https://images.unsplash.com/photo-1536591375315-1b838875508a?w=600&auto=format&fit=crop&q=80", // Mixed roasted nuts in bowl
  protein: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=600&auto=format&fit=crop&q=80", // Authentic protein shake glass
  bar: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80", // Granola bar
  egg: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80", // Boiled eggs sliced
  avocado: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80", // Avocado toast
  smoothie: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80", // Berry smoothie
  yogurt: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80", // Greek yogurt bowl
  chia: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=80", // Chia seed pudding with berries
  hummus: "https://images.unsplash.com/photo-1577906096429-f73c2c312435?w=600&auto=format&fit=crop&q=80", // Hummus dip & vegetables
  ricecake: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80", // Rice cake / bread
  generic: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=80", // Healthy snack bowl
};

// Known snack items with calibrated calories and portion sizes
const SNACK_DATABASE: {
  keywords: string[];
  calories: number;
  portion: string;
  category: SnackNutritionEstimate["category"];
  image: string;
}[] = [
  // FRUITS
  {
    keywords: ["banana", "banan"],
    calories: 105,
    portion: "1 medium banana (~118g)",
    category: "Fruit",
    image: DEFAULT_SNACK_IMAGES.banana,
  },
  {
    keywords: ["apple", "äpple", "crisp apple"],
    calories: 80,
    portion: "1 medium apple (~150g)",
    category: "Fruit",
    image: DEFAULT_SNACK_IMAGES.apple,
  },
  {
    keywords: ["orange", "apelsin", "clementine", "klementin", "mandarin"],
    calories: 62,
    portion: "1 fruit (~130g)",
    category: "Fruit",
    image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=600&auto=format&fit=crop&q=80",
  },
  {
    keywords: ["pear", "päron"],
    calories: 100,
    portion: "1 medium pear (~175g)",
    category: "Fruit",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
  },
  {
    keywords: ["berries", "bär", "blueberries", "blåbär", "strawberries", "jordgubbar", "raspberries", "hallon"],
    calories: 70,
    portion: "1 cup fresh berries (~140g)",
    category: "Fruit",
    image: DEFAULT_SNACK_IMAGES.berries,
  },
  {
    keywords: ["grapes", "vindruvor", "druvor"],
    calories: 90,
    portion: "1 cup grapes (~150g)",
    category: "Fruit",
    image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&auto=format&fit=crop&q=80",
  },
  {
    keywords: ["kiwi"],
    calories: 42,
    portion: "1 medium kiwi (~69g)",
    category: "Fruit",
    image: "https://images.unsplash.com/photo-1585059895524-72359e06133a?w=600&auto=format&fit=crop&q=80",
  },

  // DAIRY & PLANT ALTERNATIVES
  {
    keywords: ["greek yogurt", "grekisk yoghurt", "yoghurt", "yogurt", "turkish yogurt"],
    calories: 130,
    portion: "150g yogurt",
    category: "Dairy",
    image: DEFAULT_SNACK_IMAGES.yogurt,
  },
  {
    keywords: ["cottage cheese", "keso"],
    calories: 140,
    portion: "150g cottage cheese",
    category: "Protein",
    image: DEFAULT_SNACK_IMAGES.yogurt,
  },
  {
    keywords: ["kvarg", "quark"],
    calories: 120,
    portion: "150g low-fat kvarg",
    category: "Protein",
    image: DEFAULT_SNACK_IMAGES.yogurt,
  },
  {
    keywords: ["cheese", "ost", "cheddar", "brie", "ostbit"],
    calories: 110,
    portion: "30g cheese slice",
    category: "Dairy",
    image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&auto=format&fit=crop&q=80",
  },

  // NUTS & SEEDS
  {
    keywords: ["nuts", "nötter", "mixed nuts", "almonds", "mandlar", "walnuts", "valnötter", "cashews", "cashewnötter", "peanuts", "jordnötter"],
    calories: 185,
    portion: "1 handful (~30g)",
    category: "Nuts & Seeds",
    image: DEFAULT_SNACK_IMAGES.nuts,
  },
  {
    keywords: ["peanut butter", "jordnötssmör", "almond butter", "mandelsmör"],
    calories: 190,
    portion: "2 tablespoons (~32g)",
    category: "Nuts & Seeds",
    image: DEFAULT_SNACK_IMAGES.nuts,
  },

  // PROTEIN & EGGS
  {
    keywords: ["egg", "ägg", "boiled egg", "kokt ägg", "hard-boiled eggs"],
    calories: 140,
    portion: "2 large eggs",
    category: "Protein",
    image: DEFAULT_SNACK_IMAGES.egg,
  },
  {
    keywords: ["protein shake", "whey", "proteinshake", "proteindryck"],
    calories: 180,
    portion: "1 scoop (30g) + water/milk",
    category: "Protein",
    image: DEFAULT_SNACK_IMAGES.protein,
  },
  {
    keywords: ["protein bar", "proteinbar", "barebells", "quest bar"],
    calories: 200,
    portion: "1 bar (~55g)",
    category: "Bar & Bite",
    image: DEFAULT_SNACK_IMAGES.bar,
  },
  {
    keywords: ["oat bar", "granola bar", "muesli bar", "flapjacks"],
    calories: 190,
    portion: "1 bar (~45g)",
    category: "Bar & Bite",
    image: DEFAULT_SNACK_IMAGES.bar,
  },

  // CRISPBREAD & TOAST
  {
    keywords: ["rice cake", "riskaka", "riskakor", "rice cakes"],
    calories: 175,
    portion: "2 cakes + light spread",
    category: "Quick Snack",
    image: DEFAULT_SNACK_IMAGES.ricecake,
  },
  {
    keywords: ["crispbread", "knäckebröd", "knäcke", "avocado toast"],
    calories: 180,
    portion: "1 slice with topping",
    category: "Quick Snack",
    image: DEFAULT_SNACK_IMAGES.avocado,
  },

  // VEGGIES & DIPS
  {
    keywords: ["hummus", "carrots", "morot", "morötter", "carrot sticks", "selleri", "cucumber", "gurka"],
    calories: 140,
    portion: "Sliced veggies + 2 tbsp hummus",
    category: "Veggie",
    image: DEFAULT_SNACK_IMAGES.hummus,
  },
  {
    keywords: ["edamame", "edamamebönor"],
    calories: 120,
    portion: "1 cup in pods (~100g beans)",
    category: "Veggie",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
  },

  // SMOOTHIES
  {
    keywords: ["smoothie", "fruit smoothie", "bärsmoothie"],
    calories: 195,
    portion: "1 glass (~300ml)",
    category: "Fruit",
    image: DEFAULT_SNACK_IMAGES.smoothie,
  },

  // TREATS
  {
    keywords: ["dark chocolate", "mörk choklad", "chocolate", "choklad"],
    calories: 150,
    portion: "3 squares (~25g, 70%+)",
    category: "Quick Snack",
    image: "https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&auto=format&fit=crop&q=80",
  },
];

/**
 * Normalizes input text for smart matching
 */
function cleanText(text: string): string {
  return text.toLowerCase().trim().replace(/[.,!?;:()]/g, "");
}

/**
 * Estimates calories and portion for any snack name typed by the user.
 * Guarantees a realistic, intelligent estimate without forcing manual guessing.
 */
export function estimateSnackNutrition(query: string): SnackNutritionEstimate {
  const clean = cleanText(query);
  if (!clean) {
    return {
      title: "Quick Snack",
      calories: 150,
      portion: "1 serving",
      category: "Quick Snack",
      defaultImage: DEFAULT_SNACK_IMAGES.generic,
    };
  }

  // 1. Exact or full-word match only (no premature prefix guessing!)
  for (const item of SNACK_DATABASE) {
    if (
      item.keywords.some(
        (k) =>
          clean === k ||
          clean.startsWith(k + " ") ||
          clean.endsWith(" " + k) ||
          clean.includes(" " + k + " "),
      )
    ) {
      return {
        title: capitalizeWords(query.trim()),
        calories: item.calories,
        portion: item.portion,
        category: item.category,
        defaultImage: item.image,
      };
    }
  }

  // 2. Heuristic category matching
  if (clean.includes("juice") || clean.includes("frukt") || clean.includes("berry") || clean.includes("fruit")) {
    return {
      title: capitalizeWords(query.trim()),
      calories: 110,
      portion: "1 fruit / serving",
      category: "Fruit",
      defaultImage: DEFAULT_SNACK_IMAGES.fruit,
    };
  }

  if (clean.includes("protein") || clean.includes("shake") || clean.includes("whey")) {
    return {
      title: capitalizeWords(query.trim()),
      calories: 180,
      portion: "1 serving",
      category: "Protein",
      defaultImage: DEFAULT_SNACK_IMAGES.protein,
    };
  }

  if (clean.includes("bar") || clean.includes("kaka") || clean.includes("cookie") || clean.includes("biscuit")) {
    return {
      title: capitalizeWords(query.trim()),
      calories: 200,
      portion: "1 bar / cookie (~50g)",
      category: "Bar & Bite",
      defaultImage: DEFAULT_SNACK_IMAGES.bar,
    };
  }

  if (clean.includes("nut") || clean.includes("frö") || clean.includes("seed")) {
    return {
      title: capitalizeWords(query.trim()),
      calories: 180,
      portion: "1 handful (~30g)",
      category: "Nuts & Seeds",
      defaultImage: DEFAULT_SNACK_IMAGES.nuts,
    };
  }

  // 3. Sensible general fallback
  return {
    title: capitalizeWords(query.trim()),
    calories: 150,
    portion: "1 standard serving",
    category: "Quick Snack",
    defaultImage: DEFAULT_SNACK_IMAGES.generic,
  };
}

function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
}
