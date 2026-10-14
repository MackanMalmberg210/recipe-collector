import fs from "fs";

const dinnerUrls = [
  { url: "https://www.recipetineats.com/swedish-meatballs/", mealType: "dinner", category: "main-course" },
  { url: "https://www.recipetineats.com/penne-arrabbiata/", mealType: "dinner", category: "pasta" },
  { url: "https://www.recipetineats.com/vegetable-lasagna/", mealType: "dinner", category: "pasta" },
  { url: "https://www.recipetineats.com/slow-cooker-chili/", mealType: "dinner", category: "main-course" },
  { url: "https://www.recipetineats.com/creamy-garlic-prawns-shrimp/", mealType: "dinner", category: "main-course" },
  { url: "https://www.gimmesomeoven.com/easy-fried-rice-recipe/", mealType: "dinner", category: "rice" },
  { url: "https://www.gimmesomeoven.com/easy-sesame-chicken/", mealType: "dinner", category: "main-course" },
  { url: "https://www.gimmesomeoven.com/sheet-pan-chicken-and-veggies/", mealType: "dinner", category: "main-course" },
  { url: "https://www.gimmesomeoven.com/baked-salmon-recipe/", mealType: "dinner", category: "main-course" },
  { url: "https://www.gimmesomeoven.com/creamy-tuscan-chicken/", mealType: "dinner", category: "main-course" },
  { url: "https://natashaskitchen.com/pan-seared-steak/", mealType: "dinner", category: "main-course" },
  { url: "https://natashaskitchen.com/lemon-chicken-recipe/", mealType: "dinner", category: "main-course" },
  { url: "https://natashaskitchen.com/creamy-shrimp-pasta/", mealType: "dinner", category: "pasta" },
  { url: "https://natashaskitchen.com/chicken-pot-pie/", mealType: "dinner", category: "main-course" },
  { url: "https://damndelicious.net/2019/01/22/sheet-pan-lemon-herb-salmon/", mealType: "dinner", category: "main-course" }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function importDinners() {
  console.log(`Importing remaining ${dinnerUrls.length} dinners with delay...`);
  const existing = JSON.parse(fs.readFileSync("scripts/imported_curated_recipes.json", "utf-8"));
  let startId = 100 + existing.length + 1;

  for (let i = 0; i < dinnerUrls.length; i++) {
    const item = dinnerUrls[i];
    process.stdout.write(`[${i + 1}/${dinnerUrls.length}] ${item.url} ... `);
    try {
      await sleep(1500); // Respect rate limiter
      const res = await fetch("http://localhost:3000/api/import-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url })
      });

      if (!res.ok) {
        console.log(`FAILED HTTP ${res.status}`);
        continue;
      }

      const json = await res.json();
      const r = json.recipe;
      if (!r || !r.title || !r.ingredients || r.ingredients.length === 0) {
        console.log("FAILED invalid payload");
        continue;
      }

      const formatted = {
        id: startId++,
        title: r.title.replace(/\s+Recipe\b/i, "").trim(),
        image: r.image || "",
        cookTime: r.cookTime || 25,
        calories: r.nutrition?.calories || 520,
        servings: r.servings || 4,
        category: item.category,
        mealType: item.mealType,
        tags: Array.from(new Set([item.mealType, item.category, ...(r.tags || [])])),
        ingredients: r.ingredients.map(ing => typeof ing === "string" ? ing : ing.original || ing.name),
        instructions: r.instructions || [],
        nutrition: {
          calories: r.nutrition?.calories || 520,
          protein: r.nutrition?.protein || "32g",
          carbohydrates: r.nutrition?.carbohydrates || "42g",
          fat: r.nutrition?.fat || "20g",
          saturatedFat: r.nutrition?.saturatedFat || "6g",
          fiber: r.nutrition?.fiber || "4g",
          sodium: r.nutrition?.sodium || "620mg"
        },
        sourceUrl: item.url,
        sourceName: new URL(item.url).hostname.replace(/^www\./, ""),
        origin: "mock",
        isPublic: true
      };

      existing.push(formatted);
      console.log(`OK: "${formatted.title}"`);
    } catch (e) {
      console.log(`ERR: ${e.message}`);
    }
  }

  fs.writeFileSync("scripts/imported_curated_recipes.json", JSON.stringify(existing, null, 2), "utf-8");
  console.log(`Total recipes now: ${existing.length}`);
}

importDinners();
