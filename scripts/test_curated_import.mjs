import fs from "fs";

const curatedUrls = [
  // BREAKFAST (15)
  { url: "https://downshiftology.com/recipes/shakshuka/", mealType: "breakfast", category: "breakfast" },
  { url: "https://downshiftology.com/recipes/banana-pancakes/", mealType: "breakfast", category: "breakfast" },
  { url: "https://downshiftology.com/recipes/chia-seed-pudding/", mealType: "breakfast", category: "breakfast" },
  { url: "https://downshiftology.com/recipes/overnight-oats/", mealType: "breakfast", category: "breakfast" },
  { url: "https://downshiftology.com/recipes/breakfast-egg-muffins/", mealType: "breakfast", category: "breakfast" },
  { url: "https://downshiftology.com/recipes/baked-oatmeal/", mealType: "breakfast", category: "breakfast" },
  { url: "https://downshiftology.com/recipes/spinach-frittata/", mealType: "breakfast", category: "breakfast" },
  { url: "https://downshiftology.com/recipes/avocado-toast/", mealType: "breakfast", category: "breakfast" },
  { url: "https://downshiftology.com/recipes/smoothie-bowl/", mealType: "breakfast", category: "smoothie" },
  { url: "https://www.loveandlemons.com/breakfast-burrito/", mealType: "breakfast", category: "wrap" },
  { url: "https://www.loveandlemons.com/french-toast-recipe/", mealType: "breakfast", category: "breakfast" },
  { url: "https://www.loveandlemons.com/tofu-scramble/", mealType: "breakfast", category: "breakfast" },
  { url: "https://www.loveandlemons.com/acai-bowl/", mealType: "breakfast", category: "bowl" },
  { url: "https://www.loveandlemons.com/best-waffles-recipe/", mealType: "breakfast", category: "breakfast" },
  { url: "https://www.loveandlemons.com/frittata-recipe/", mealType: "breakfast", category: "breakfast" },

  // LUNCH (25)
  { url: "https://downshiftology.com/recipes/greek-salad/", mealType: "lunch", category: "salad" },
  { url: "https://downshiftology.com/recipes/mediterranean-chickpea-salad/", mealType: "lunch", category: "salad" },
  { url: "https://downshiftology.com/recipes/quinoa-salad/", mealType: "lunch", category: "salad" },
  { url: "https://downshiftology.com/recipes/egg-salad/", mealType: "lunch", category: "sandwich" },
  { url: "https://downshiftology.com/recipes/tuna-salad/", mealType: "lunch", category: "sandwich" },
  { url: "https://downshiftology.com/recipes/chicken-salad/", mealType: "lunch", category: "salad" },
  { url: "https://downshiftology.com/recipes/roasted-tomato-soup/", mealType: "lunch", category: "soup" },
  { url: "https://downshiftology.com/recipes/butternut-squash-soup/", mealType: "lunch", category: "soup" },
  { url: "https://cookieandkate.com/best-lentil-soup-recipe/", mealType: "lunch", category: "soup" },
  { url: "https://cookieandkate.com/favorite-quinoa-salad-recipe/", mealType: "lunch", category: "salad" },
  { url: "https://cookieandkate.com/classic-minestrone-soup-recipe/", mealType: "lunch", category: "soup" },
  { url: "https://cookieandkate.com/greek-salad-recipe/", mealType: "lunch", category: "salad" },
  { url: "https://cookieandkate.com/black-bean-burrito-bowl-recipe/", mealType: "lunch", category: "bowl" },
  { url: "https://cookieandkate.com/lemony-green-salad-with-orzo/", mealType: "lunch", category: "salad" },
  { url: "https://cookieandkate.com/spicy-thai-zucchini-noodle-salad/", mealType: "lunch", category: "stir-fry" },
  { url: "https://cookieandkate.com/best-tabbouleh-recipe/", mealType: "lunch", category: "salad" },
  { url: "https://www.loveandlemons.com/caesar-salad/", mealType: "lunch", category: "salad" },
  { url: "https://www.loveandlemons.com/broccoli-salad/", mealType: "lunch", category: "salad" },
  { url: "https://www.loveandlemons.com/pasta-salad/", mealType: "lunch", category: "pasta" },
  { url: "https://www.loveandlemons.com/caprese-sandwich/", mealType: "lunch", category: "sandwich" },
  { url: "https://www.loveandlemons.com/club-sandwich/", mealType: "lunch", category: "sandwich" },
  { url: "https://www.loveandlemons.com/burrito-bowl/", mealType: "lunch", category: "bowl" },
  { url: "https://www.loveandlemons.com/falafel/", mealType: "lunch", category: "wrap" },
  { url: "https://www.loveandlemons.com/gazpacho/", mealType: "lunch", category: "soup" },
  { url: "https://www.loveandlemons.com/sesame-noodles/", mealType: "lunch", category: "stir-fry" },

  // DINNER (25)
  { url: "https://www.recipetineats.com/easy-coconut-curry/", mealType: "dinner", category: "curry" },
  { url: "https://www.recipetineats.com/spaghetti-bolognese/", mealType: "dinner", category: "pasta" },
  { url: "https://www.recipetineats.com/thai-green-curry/", mealType: "dinner", category: "curry" },
  { url: "https://www.recipetineats.com/beef-stir-fry/", mealType: "dinner", category: "stir-fry" },
  { url: "https://www.recipetineats.com/baked-salmon-with-lemon-butter-sauce/", mealType: "dinner", category: "main-course" },
  { url: "https://www.recipetineats.com/honey-garlic-chicken/", mealType: "dinner", category: "main-course" },
  { url: "https://www.recipetineats.com/crispy-parmesan-crusted-chicken/", mealType: "dinner", category: "main-course" },
  { url: "https://www.recipetineats.com/chicken-fajitas/", mealType: "dinner", category: "tacos" },
  { url: "https://www.recipetineats.com/teriyaki-chicken/", mealType: "dinner", category: "main-course" },
  { url: "https://www.recipetineats.com/classic-shepherds-pie/", mealType: "dinner", category: "main-course" },
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

async function runBulkImport() {
  console.log(`Starting bulk import of ${curatedUrls.length} recipes...`);
  const results = [];
  const failures = [];

  let startId = 101; // Start IDs for new curated recipes

  for (let i = 0; i < curatedUrls.length; i++) {
    const item = curatedUrls[i];
    process.stdout.write(`[${i + 1}/${curatedUrls.length}] Importing: ${item.url} ... `);
    try {
      const res = await fetch("http://localhost:3000/api/import-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url })
      });

      if (!res.ok) {
        console.log(`FAILED HTTP ${res.status}`);
        failures.push({ url: item.url, reason: `HTTP ${res.status}` });
        continue;
      }

      const json = await res.json();
      const r = json.recipe;

      if (!r || !r.title || !r.ingredients || r.ingredients.length === 0) {
        console.log(`FAILED invalid recipe payload`);
        failures.push({ url: item.url, reason: "Invalid payload" });
        continue;
      }

      // Clean and sanitize recipe object
      const formatted = {
        id: startId++,
        title: r.title.replace(/\s+Recipe\b/i, "").trim(),
        image: r.image || "",
        cookTime: r.cookTime || 25,
        calories: r.nutrition?.calories || 450,
        servings: r.servings || 4,
        category: item.category,
        mealType: item.mealType,
        tags: Array.from(new Set([item.mealType, item.category, ...(r.tags || [])])),
        ingredients: r.ingredients.map(ing => typeof ing === "string" ? ing : ing.original || ing.name),
        instructions: r.instructions || [],
        nutrition: {
          calories: r.nutrition?.calories || 450,
          protein: r.nutrition?.protein || "25g",
          carbohydrates: r.nutrition?.carbohydrates || "35g",
          fat: r.nutrition?.fat || "18g",
          saturatedFat: r.nutrition?.saturatedFat || "5g",
          fiber: r.nutrition?.fiber || "4g",
          sodium: r.nutrition?.sodium || "550mg"
        },
        sourceUrl: item.url,
        sourceName: new URL(item.url).hostname.replace(/^www\./, ""),
        origin: "mock",
        isPublic: true
      };

      results.push(formatted);
      console.log(`OK: "${formatted.title}" (${formatted.ingredients.length} ings, ${formatted.instructions.length} steps)`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      failures.push({ url: item.url, reason: err.message });
    }
  }

  console.log(`\nImport complete! Success: ${results.length}, Failures: ${failures.length}`);
  fs.writeFileSync("scripts/imported_curated_recipes.json", JSON.stringify(results, null, 2), "utf-8");
  console.log("Saved results to scripts/imported_curated_recipes.json");
}

runBulkImport();
