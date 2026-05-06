"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { AppRecipe } from "../../lib/types";
import type { MealSlot } from "../../lib/planner";
import { formatMealSlot } from "../../lib/planner";

type RecipePickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  recipes: AppRecipe[];
  slot: MealSlot;
  selectedRecipeId: number | null;
  onSelectRecipe: (recipeId: number) => void;
  onClearRecipe?: () => void;
};

type PickerFilter =
  | "all"
  | "recommended"
  | "breakfast"
  | "lunch"
  | "dinner"
  | "imported"
  | "your-recipes";

type FilterChip = {
  value: PickerFilter;
  label: string;
};

const FILTER_CHIPS: FilterChip[] = [
  { value: "all", label: "All" },
  { value: "recommended", label: "Recommended" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "imported", label: "Imported" },
  { value: "your-recipes", label: "Your recipes" },
];

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function matchesMealSlot(recipe: AppRecipe, slot: MealSlot) {
  const mealType = normalize(recipe.mealType ?? "");
  const category = normalize(recipe.category ?? "");
  const tags = (recipe.tags ?? []).map(normalize);

  const values = [mealType, category, ...tags];

  if (slot === "breakfast") {
    return values.some((value) =>
      ["breakfast", "brunch", "morning"].includes(value),
    );
  }

  if (slot === "lunch") {
    return values.some((value) =>
      ["lunch", "light meal", "salad"].includes(value),
    );
  }

  if (slot === "dinner") {
    return values.some((value) =>
      ["dinner", "main course", "main dish"].includes(value),
    );
  }

  return false;
}

function recipeMatchesFilter(recipe: AppRecipe, filter: PickerFilter) {
  if (filter === "all") return true;
  if (filter === "recommended") return true;

  if (filter === "breakfast") return matchesMealSlot(recipe, "breakfast");
  if (filter === "lunch") return matchesMealSlot(recipe, "lunch");
  if (filter === "dinner") return matchesMealSlot(recipe, "dinner");

  if (filter === "imported") return recipe.origin === "imported";
  if (filter === "your-recipes") return recipe.origin === "user";

  return true;
}

function getOriginLabel(recipe: AppRecipe) {
  if (recipe.origin === "user") return "Your recipe";
  if (recipe.origin === "imported") return "Imported";
  return "Library";
}

function getFilterLabel(filter: PickerFilter) {
  return FILTER_CHIPS.find((chip) => chip.value === filter)?.label ?? "All";
}

export default function RecipePickerModal({
  isOpen,
  onClose,
  recipes,
  slot,
  selectedRecipeId,
  onSelectRecipe,
  onClearRecipe,
}: RecipePickerModalProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PickerFilter>("recommended");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setSearch("");
    setActiveFilter("recommended");

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const recommendedCount = useMemo(() => {
    return recipes.filter((recipe) => matchesMealSlot(recipe, slot)).length;
  }, [recipes, slot]);

  const filteredRecipes = useMemo(() => {
    const query = normalize(search);

    const searched = recipes.filter((recipe) => {
      if (!query) return true;

      const title = normalize(recipe.title);
      const ingredients = recipe.ingredients
        .map((ingredient) => normalize(ingredient))
        .join(" ");
      const tags = (recipe.tags ?? []).map(normalize).join(" ");

      return (
        title.includes(query) ||
        ingredients.includes(query) ||
        tags.includes(query)
      );
    });

    const filtered = searched.filter((recipe) => {
      if (activeFilter === "recommended") {
        return matchesMealSlot(recipe, slot);
      }

      return recipeMatchesFilter(recipe, activeFilter);
    });

    return [...filtered].sort((a, b) => {
      const aSelected = a.id === selectedRecipeId;
      const bSelected = b.id === selectedRecipeId;

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      const aPreferred = matchesMealSlot(a, slot);
      const bPreferred = matchesMealSlot(b, slot);

      if (aPreferred && !bPreferred) return -1;
      if (!aPreferred && bPreferred) return 1;

      return a.title.localeCompare(b.title);
    });
  }, [recipes, search, slot, activeFilter, selectedRecipeId]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-md"
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Close recipe picker"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <div className="relative flex max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-4xl border border-white/10 bg-[#17120f] shadow-2xl ring-1 ring-white/5">
        <aside className="hidden w-80 shrink-0 border-r border-white/10 bg-white/3 p-7 lg:block">
          <p className="mb-3 text-sm font-bold uppercase tracking-4 text-amber-100/50">
            Recipe Picker
          </p>

          <h2 className="text-4xl font-bold leading-tight text-[#fff8ef]">
            Choose {formatMealSlot(slot)}
          </h2>

          <p className="mt-4 text-sm leading-6 text-stone-400">
            Search your cookbook and pick a recipe for this meal slot.
            Recommended recipes appear first.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-3 text-stone-500">
                Results
              </p>
              <p className="mt-2 text-2xl font-bold text-[#fff8ef]">
                {filteredRecipes.length}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-3 text-stone-500">
                Suggested
              </p>
              <p className="mt-2 text-2xl font-bold text-[#fff8ef]">
                {recommendedCount}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-3 text-stone-500">
              Filter
            </p>
            <p className="mt-2 text-sm font-semibold text-[#fff8ef]">
              {getFilterLabel(activeFilter)}
            </p>
          </div>

          {selectedRecipeId !== null && onClearRecipe && (
            <button
              type="button"
              onClick={() => {
                onClearRecipe();
                onClose();
              }}
              className="mt-4 w-full rounded-2xl border border-red-300/15 bg-red-400/10 px-5 py-3 text-sm font-medium text-red-100 transition hover:bg-red-400/15"
            >
              Clear slot
            </button>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-white/10 p-5 sm:p-6 lg:hidden">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-4 text-amber-100/50">
                  Recipe Picker
                </p>

                <h2 className="text-2xl font-bold text-[#fff8ef]">
                  Choose {formatMealSlot(slot)}
                </h2>

                <p className="mt-1 text-xs text-stone-500">
                  {filteredRecipes.length} results
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-300 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </header>

          <div className="hidden justify-end border-b border-white/10 p-5 lg:flex">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-300 transition hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <div className="sticky top-0 z-10 border-b border-white/10 bg-[#17120f]/95 p-5 backdrop-blur">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search recipes, ingredients, or tags..."
              className="h-13 w-full rounded-2xl border border-white/10 bg-black/30 px-5 text-sm text-white outline-none transition placeholder:text-stone-500 focus:border-amber-100/25"
            />

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {FILTER_CHIPS.map((chip) => {
                const active = chip.value === activeFilter;

                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setActiveFilter(chip.value)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-amber-200/40 bg-amber-200/15 text-amber-50"
                        : "border-white/10 bg-white/4 text-stone-400 hover:border-white/20 hover:bg-white/7 hover:text-stone-200"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5"
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            {filteredRecipes.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredRecipes.map((recipe) => {
                  const recommended = matchesMealSlot(recipe, slot);
                  const selected = recipe.id === selectedRecipeId;

                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => {
                        onSelectRecipe(recipe.id);
                        onClose();
                      }}
                      className={`group overflow-hidden rounded-3xl border text-left transition hover:-translate-y-1 ${
                        selected
                          ? "border-amber-200/40 bg-amber-200/10"
                          : "border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          {recommended && (
                            <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-black">
                              Recommended
                            </span>
                          )}

                          {selected && (
                            <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                              Selected
                            </span>
                          )}
                        </div>

                        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                          <div className="rounded-2xl border border-white/10 bg-black/65 px-3 py-2 text-center text-xs font-semibold text-white backdrop-blur">
                            Select recipe
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="line-clamp-2 text-base font-semibold text-[#fff8ef]">
                          {recipe.title}
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-400">
                          {recipe.cookTime !== undefined && (
                            <span>{recipe.cookTime} min</span>
                          )}

                          <span>{recipe.calories ?? 0} kcal</span>
                          <span>{getOriginLabel(recipe)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/3 p-8 text-center">
                <p className="text-sm font-semibold text-[#fff8ef]">
                  No recipes found
                </p>
                <p className="mt-2 text-sm text-stone-500">
                  Try another search term, switch filter, or add more recipes to
                  your cookbook.
                </p>

                {activeFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter("all")}
                    className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-stone-200 transition hover:bg-white/10"
                  >
                    Show all recipes
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
