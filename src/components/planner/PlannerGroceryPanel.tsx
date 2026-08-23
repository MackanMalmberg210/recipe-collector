"use client";

import { useMemo, useState } from "react";
import type { AppRecipe } from "../../lib/types";
import type { DayPlan, WeekDay } from "../../lib/planner";
import { WEEK_DAYS, formatWeekDay } from "../../lib/planner";

type PlannerGroceryPanelProps = {
  recipes: AppRecipe[];
  mealPlan: Record<WeekDay, DayPlan>;
};

type GroceryCategory =
  | "Produce"
  | "Protein"
  | "Dairy"
  | "Pantry"
  | "Spices"
  | "Other";

type GroceryItem = {
  name: string;
  category: GroceryCategory;
  recipeTitles: string[];
  days: WeekDay[];
};

const CATEGORY_ORDER: GroceryCategory[] = [
  "Produce",
  "Protein",
  "Dairy",
  "Pantry",
  "Spices",
  "Other",
];

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function cleanIngredientName(ingredient: string) {
  return ingredient
    .replace(/^\d+([.,]\d+)?\s*/g, "")
    .replace(/\b(g|kg|ml|l|dl|tsk|msk|cup|cups|tbsp|tsp|oz|lb|lbs)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getIngredientCategory(ingredient: string): GroceryCategory {
  const value = normalize(ingredient);

  const produce = [
    "tomato",
    "onion",
    "garlic",
    "lettuce",
    "spinach",
    "carrot",
    "potato",
    "pepper",
    "broccoli",
    "cucumber",
    "avocado",
    "lemon",
    "lime",
    "apple",
    "banana",
    "mushroom",
    "zucchini",
  ];

  const protein = [
    "chicken",
    "beef",
    "pork",
    "salmon",
    "fish",
    "tuna",
    "egg",
    "tofu",
    "turkey",
    "shrimp",
    "lentil",
    "beans",
  ];

  const dairy = [
    "milk",
    "cheese",
    "cream",
    "yogurt",
    "butter",
    "feta",
    "mozzarella",
    "parmesan",
    "halloumi",
  ];

  const pantry = [
    "rice",
    "pasta",
    "flour",
    "sugar",
    "oil",
    "olive oil",
    "vinegar",
    "bread",
    "oats",
    "quinoa",
    "couscous",
    "noodle",
  ];

  const spices = [
    "salt",
    "pepper",
    "paprika",
    "cumin",
    "oregano",
    "basil",
    "thyme",
    "cinnamon",
    "chili",
    "curry",
  ];

  if (produce.some((word) => value.includes(word))) return "Produce";
  if (protein.some((word) => value.includes(word))) return "Protein";
  if (dairy.some((word) => value.includes(word))) return "Dairy";
  if (pantry.some((word) => value.includes(word))) return "Pantry";
  if (spices.some((word) => value.includes(word))) return "Spices";

  return "Other";
}

function getSelectedRecipes(
  recipes: AppRecipe[],
  mealPlan: Record<WeekDay, DayPlan>,
) {
  return WEEK_DAYS.flatMap((day) => {
    return Object.values(mealPlan[day])
      .filter((recipeId): recipeId is number => recipeId !== null)
      .map((recipeId) => {
        const recipe = recipes.find((item) => item.id === recipeId);

        if (!recipe) return null;

        return {
          day,
          recipe,
        };
      })
      .filter(
        (item): item is { day: WeekDay; recipe: AppRecipe } => item !== null,
      );
  });
}

export default function PlannerGroceryPanel({
  recipes,
  mealPlan,
}: PlannerGroceryPanelProps) {
  const [boughtItems, setBoughtItems] = useState<string[]>([]);

  const groceryItems = useMemo(() => {
    const selectedRecipes = getSelectedRecipes(recipes, mealPlan);
    const itemMap = new Map<string, GroceryItem>();

    selectedRecipes.forEach(({ day, recipe }) => {
      recipe.ingredients.forEach((ingredient) => {
        const cleanedName = cleanIngredientName(ingredient);
        const key = normalize(cleanedName);

        if (!key) return;

        const existingItem = itemMap.get(key);

        if (existingItem) {
          if (!existingItem.recipeTitles.includes(recipe.title)) {
            existingItem.recipeTitles.push(recipe.title);
          }

          if (!existingItem.days.includes(day)) {
            existingItem.days.push(day);
          }

          return;
        }

        itemMap.set(key, {
          name: cleanedName,
          category: getIngredientCategory(cleanedName),
          recipeTitles: [recipe.title],
          days: [day],
        });
      });
    });

    return Array.from(itemMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [recipes, mealPlan]);

  const groupedItems = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: groceryItems.filter((item) => item.category === category),
    })).filter((group) => group.items.length > 0);
  }, [groceryItems]);

  const selectedRecipesCount = getSelectedRecipes(recipes, mealPlan).length;

  function toggleBoughtItem(itemName: string) {
    setBoughtItems((current) =>
      current.includes(itemName)
        ? current.filter((name) => name !== itemName)
        : [...current, itemName],
    );
  }

  async function copyGroceryList() {
    const text = groupedItems
      .map((group) => {
        const items = group.items.map((item) => `- ${item.name}`).join("\n");
        return `${group.category}\n${items}`;
      })
      .join("\n\n");

    await navigator.clipboard.writeText(text);
  }

  return (
    <section className="rounded-4xl border border-stone-200/80 bg-white p-5 shadow-xl dark:border-white/6 dark:bg-[#17120f]/95">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Grocery list
          </p>

          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-[#fff8ef]">
            Shopping list
          </h2>

          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Generated automatically from planned meals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-center dark:border-white/10 dark:bg-white/4">
            <p className="text-[10px] font-semibold text-stone-500">Recipes</p>
            <p className="text-sm font-bold text-stone-900 dark:text-[#fff8ef]">
              {selectedRecipesCount}
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-center dark:border-white/10 dark:bg-white/4">
            <p className="text-[10px] font-semibold text-stone-500">Items</p>
            <p className="text-sm font-bold text-stone-900 dark:text-[#fff8ef]">
              {groceryItems.length}
            </p>
          </div>
        </div>
      </div>

      {groceryItems.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 dark:border-white/7 dark:bg-black/20">
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">
              {boughtItems.length}/{groceryItems.length} items checked
            </p>

            <button
              type="button"
              onClick={copyGroceryList}
              className="rounded-xl border border-stone-200 bg-white px-3 py-1 text-xs font-bold text-stone-700 shadow-sm transition hover:bg-stone-100 dark:border-white/8 dark:bg-white/5 dark:text-stone-200 cursor-pointer"
            >
              Copy list
            </button>
          </div>

          <div className="space-y-4">
            {groupedItems.map((group) => (
              <div key={group.category}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {group.category}
                  </h3>

                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:border-white/10 dark:bg-white/4">
                    {group.items.length} items
                  </span>
                </div>

                <div className="grid gap-2">
                  {group.items.map((item) => {
                    const bought = boughtItems.includes(item.name);

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => toggleBoughtItem(item.name)}
                        className={`group rounded-2xl p-3 text-left border transition ${
                          bought
                            ? "border-emerald-500/30 bg-emerald-50 text-emerald-900 dark:border-emerald-200/15 dark:bg-emerald-300/8 dark:text-emerald-100"
                            : "border-stone-200 bg-stone-50 hover:bg-white dark:border-white/7 dark:bg-black/22 dark:hover:bg-black/30"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition ${
                              bought
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-stone-300 text-transparent group-hover:border-stone-400"
                            }`}
                          >
                            ✓
                          </span>

                          <div className="min-w-0">
                            <p
                              className={`text-xs sm:text-sm font-semibold ${
                                bought
                                  ? "line-through text-stone-400 dark:text-stone-500"
                                  : "text-stone-900 dark:text-[#fff8ef]"
                              }`}
                            >
                              {item.name}
                            </p>

                            <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-500">
                              For {item.recipeTitles.join(", ")}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6 text-center dark:border-white/7 dark:bg-black/20">
          <p className="text-sm font-bold text-stone-800 dark:text-[#fff8ef]">
            No groceries yet
          </p>

          <p className="mt-1 text-xs text-stone-500">
            Add recipes to your meal plan to generate the shopping list automatically.
          </p>
        </div>
      )}
    </section>
  );
}
