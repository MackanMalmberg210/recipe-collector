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
    <section className="rounded-4xl bg-linear-to-br from-emerald-100/10 via-white/4 to-black/20 p-1 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <div className="rounded-4xl border border-white/6 bg-[#17120f]/95 p-5 ring-1 ring-white/4">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="mb-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-4 text-emerald-100/55">
              Grocery list
            </p>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#fff8ef]">
                  Shopping
                </h2>

                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Generated from your planned meals.
                </p>
              </div>

              <div className="rounded-2xl bg-white/4 px-3 py-2 text-right ring-1 ring-white/7">
                <p className="text-xs text-stone-500">Items</p>
                <p className="mt-1 text-lg font-bold text-[#fff8ef]">
                  {groceryItems.length}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/4 px-4 py-3 ring-1 ring-white/7">
              <p className="text-xs text-stone-500">Recipes</p>
              <p className="mt-1 text-lg font-bold text-[#fff8ef]">
                {selectedRecipesCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white/4 px-4 py-3 ring-1 ring-white/7">
              <p className="text-xs text-stone-500">Items</p>
              <p className="mt-1 text-lg font-bold text-[#fff8ef]">
                {groceryItems.length}
              </p>
            </div>
          </div>
        </div>

        {groceryItems.length > 0 ? (
          <>
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-black/20 px-4 py-3 ring-1 ring-white/7">
              <p className="text-sm text-stone-400">
                {boughtItems.length}/{groceryItems.length} items checked
              </p>

              <button
                type="button"
                onClick={copyGroceryList}
                className="rounded-xl bg-white/5 px-4 py-2 text-xs font-semibold text-stone-200 ring-1 ring-white/8 transition hover:bg-white/8 hover:ring-emerald-100/15"
              >
                Copy list
              </button>
            </div>

            <div className="space-y-5">
              {groupedItems.map((group) => (
                <div key={group.category}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-3 text-emerald-100/65">
                      {group.category}
                    </h3>

                    <span className="rounded-full bg-white/4 px-3 py-1 text-xs text-stone-400 ring-1 ring-white/7">
                      {group.items.length} items
                    </span>
                  </div>

                  <div className="grid gap-3">
                    {group.items.map((item) => {
                      const bought = boughtItems.includes(item.name);

                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => toggleBoughtItem(item.name)}
                          className={`group rounded-2xl p-4 text-left ring-1 transition ${
                            bought
                              ? "bg-emerald-300/8 ring-emerald-200/15"
                              : "bg-black/22 ring-white/7 hover:bg-black/30 hover:ring-white/10"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 transition ${
                                bought
                                  ? "bg-emerald-300 text-black ring-emerald-200/30"
                                  : "bg-white/4 text-transparent ring-white/10 group-hover:text-stone-500"
                              }`}
                            >
                              ✓
                            </span>

                            <div className="min-w-0">
                              <p
                                className={`text-sm font-semibold ${
                                  bought
                                    ? "text-emerald-100 line-through decoration-emerald-100/50"
                                    : "text-[#fff8ef]"
                                }`}
                              >
                                {item.name}
                              </p>

                              <p className="mt-1 line-clamp-1 text-xs text-stone-500">
                                Used in {item.recipeTitles.join(", ")}
                              </p>

                              <p className="mt-1 text-xs text-stone-600">
                                {item.days
                                  .map((day) => formatWeekDay(day).slice(0, 3))
                                  .join(", ")}
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
          <div className="rounded-3xl bg-black/20 p-8 text-center ring-1 ring-white/7">
            <p className="text-base font-semibold text-[#fff8ef]">
              No groceries yet
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
              Add recipes to your weekly planner and your shopping list will be
              generated automatically.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
