"use client";

import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import type { AppRecipe } from "../../lib/types";
import type { MealSlot } from "../../lib/planner";
import { formatMealSlot } from "../../lib/planner";
import { saveRecipeToCloudOrLocal } from "../../lib/recipes";
import { estimateSnackNutrition, type SnackNutritionEstimate, DEFAULT_SNACK_IMAGES } from "../../lib/snackNutrition";
import {
  FlameIcon,
  ClockIcon,
  SparklesIcon,
  PlateIcon,
  SnackShelfIcon,
  PlusIcon,
} from "./PlannerIcons";
import { SnackPickerModal } from "./morning-snack";




type RecipePickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  recipes: AppRecipe[];
  slot: MealSlot;
  selectedRecipeId: number | null;
  onSelectRecipe: (recipeId: number, createdRecipe?: AppRecipe) => void;
  onClearRecipe?: () => void;
};

// 100% Verified, Dark-Themed Culinary Photography for Quick Snack Presets
export const QUICK_SNACK_PRESETS = [
  {
    title: "Fresh Banana",
    image: DEFAULT_SNACK_IMAGES.banana,
    calories: 105,
    portion: "1 medium banana (~118g)",
    category: "Fruit",
  },
  {
    title: "Crisp Apple",
    image: DEFAULT_SNACK_IMAGES.apple,
    calories: 80,
    portion: "1 medium apple (~150g)",
    category: "Fruit",
  },
  {
    title: "Greek Yogurt & Berries",
    image: DEFAULT_SNACK_IMAGES.berries,
    calories: 160,
    portion: "150g yogurt + 50g berries",
    category: "Dairy",
  },
  {
    title: "Whey Protein Shake",
    image: DEFAULT_SNACK_IMAGES.protein,
    calories: 180,
    portion: "1 scoop (30g) + water/milk",
    category: "Protein",
  },
  {
    title: "Roasted Mixed Nuts",
    image: DEFAULT_SNACK_IMAGES.nuts,
    calories: 185,
    portion: "1 handful (~30g)",
    category: "Nuts & Seeds",
  },
  {
    title: "Carrot Sticks & Hummus",
    image: DEFAULT_SNACK_IMAGES.hummus,
    calories: 140,
    portion: "Sliced carrot + 2 tbsp hummus",
    category: "Veggies",
  },
  {
    title: "Hard-Boiled Eggs",
    image: DEFAULT_SNACK_IMAGES.egg,
    calories: 140,
    portion: "2 large eggs with sea salt",
    category: "Protein",
  },
  {
    title: "Avocado on Crispbread",
    image: DEFAULT_SNACK_IMAGES.avocado,
    calories: 210,
    portion: "1 crispbread + 1/2 avocado",
    category: "Whole Grains",
  },
  {
    title: "Rice Cakes & Peanut Butter",
    image: DEFAULT_SNACK_IMAGES.ricecake,
    calories: 175,
    portion: "2 rice cakes + 1 tbsp peanut butter",
    category: "Quick Energy",
  },
  {
    title: "Oat & Protein Bar",
    image: DEFAULT_SNACK_IMAGES.bar,
    calories: 200,
    portion: "1 snack bar (~55g)",
    category: "Bar & Bite",
  },
];

type PickerFilter =
  | "all"
  | "recommended"
  | "quick"
  | "low-cal"
  | "your-recipes"
  | "imported";

type FilterChip = {
  value: PickerFilter;
  label: string;
};

const FILTER_CHIPS: FilterChip[] = [
  { value: "all", label: "All Recipes" },
  { value: "recommended", label: "Recommended" },
  { value: "quick", label: "Quick (<25m)" },
  { value: "low-cal", label: "Under 500 kcal" },
  { value: "your-recipes", label: "My Creations" },
  { value: "imported", label: "Imported" },
];

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function matchesMealSlot(recipe: AppRecipe, slot: MealSlot) {
  const mealType = normalize(recipe.mealType ?? "");
  const category = normalize(recipe.category ?? "");
  const tags = (recipe.tags ?? []).map(normalize);

  const values = [mealType, category, ...tags];

  if (slot === "morning_snack" || slot === "afternoon_snack" || slot === "evening_snack") {
    // Strictly exclude heavy dinner meals, pastas, steaks, chicken mains
    const isDinnerMain =
      mealType === "dinner" ||
      mealType === "main course" ||
      category === "dinner" ||
      category === "main course" ||
      tags.includes("dinner") ||
      tags.includes("main course") ||
      tags.includes("pasta") ||
      tags.includes("meatballs") ||
      tags.includes("steak") ||
      tags.includes("chicken");

    if (isDinnerMain && category !== "snack" && mealType !== "snack") {
      return false;
    }

    return (
      values.some((v) =>
        [
          "snack",
          "mellanmål",
          "smoothie",
          "fruit",
          "dessert",
          "bowl",
          "appetizer",
          "baking",
          "light meal",
          "breakfast",
          "toast",
        ].includes(v),
      ) ||
      recipe.category === "snack" ||
      recipe.mealType === "snack"
    );
  }

  if (slot === "breakfast") {
    return (
      values.some((v) => ["breakfast", "brunch", "morning", "bowl"].includes(v)) ||
      (recipe.cookTime !== undefined && recipe.cookTime <= 20)
    );
  }

  if (slot === "lunch") {
    return (
      values.some((v) => ["lunch", "light meal", "salad", "sandwich", "soup", "bowl", "wrap"].includes(v)) ||
      (recipe.cookTime !== undefined && recipe.cookTime <= 30)
    );
  }

  if (slot === "dinner") {
    return (
      values.some((v) => ["dinner", "main course", "pasta", "rice", "stir-fry"].includes(v)) ||
      recipe.cookTime === undefined ||
      recipe.cookTime >= 20
    );
  }

  return true;
}

// Compact, performant recipe item card
const RecipeItemCard = memo(function RecipeItemCard({
  recipe,
  isSelected,
  isPreferred,
  onSelect,
}: {
  recipe: AppRecipe;
  isSelected: boolean;
  isPreferred: boolean;
  onSelect: (id: number) => void;
}) {
  const { title, image, cookTime, calories, mealType, category } = recipe;

  return (
    <button
      type="button"
      onClick={() => onSelect(recipe.id)}
      style={{ willChange: "transform", transform: "translateZ(0)" }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[24px] border text-left transition-all duration-150 ease-out cursor-pointer active:scale-98 ${
        isSelected
          ? "border-slate-900 bg-slate-900/5 shadow-md dark:border-white dark:bg-white/10 ring-2 ring-slate-900 dark:ring-white"
          : "border-slate-200/90 bg-white hover:border-slate-400 hover:shadow-md dark:border-white/10 dark:bg-[#1f1915] dark:hover:border-white/20"
      }`}
    >
      <div>
        {/* Thumbnail Hero */}
        <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-slate-100 dark:bg-stone-900">
          {image ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <PlateIcon className="h-10 w-10 text-slate-300 dark:text-stone-700" />
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 pointer-events-none">
            {isPreferred && (
              <span className="rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                Recommended
              </span>
            )}
            {category && (
              <span className="rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {category}
              </span>
            )}
          </div>

          {isSelected && (
            <div className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-xs font-black shadow-sm">
              ✓
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="p-4 space-y-2">
          <h4 className="line-clamp-2 text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
            {title}
          </h4>

          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
            {cookTime !== undefined && (
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                <span>{cookTime}m</span>
              </span>
            )}
            {calories !== undefined && (
              <span className="inline-flex items-center gap-1">
                <span>•</span>
                <FlameIcon className="h-3 w-3 text-amber-500" />
                <span>{calories} kcal</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Select footer */}
      <div className="flex items-center justify-between border-t border-stone-100 dark:border-white/6 px-4 py-2.5 text-xs font-bold text-amber-700 dark:text-amber-400 bg-stone-50/60 dark:bg-white/[0.02]">
        <span>{isSelected ? "Currently active" : "Select recipe"}</span>
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </div>
    </button>
  );
});

function StandardRecipePickerModal({
  isOpen,
  onClose,
  recipes,
  slot,
  selectedRecipeId,
  onSelectRecipe,
  onClearRecipe,
}: RecipePickerModalProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PickerFilter>("all");
  const [mounted, setMounted] = useState(false);
  const [showAllRecipes, setShowAllRecipes] = useState(false);
  const [isLoggingCustom, setIsLoggingCustom] = useState(false);

  const isSnackSlot = slot === "morning_snack" || slot === "afternoon_snack" || slot === "evening_snack";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll completely while modal is open so mouse wheel operates 100% on the modal
  useEffect(() => {
    if (!isOpen) return;

    setSearch("");
    setActiveFilter("all");
    setShowAllRecipes(false);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleSelectPreset = async (preset: (typeof QUICK_SNACK_PRESETS)[number]) => {
    // 1. Check if an identical snack already exists in recipes
    const existing = recipes.find(
      (r) => normalize(r.title) === normalize(preset.title) && (r.mealType === "snack" || r.category === "snack"),
    );
    if (existing) {
      onSelectRecipe(existing.id);
      onClose();
      return;
    }

    // 2. Create lightweight recipe with verified high-resolution food image
    const newSnackRecipe: Partial<AppRecipe> = {
      title: preset.title,
      image: preset.image,
      category: "snack",
      mealType: "snack",
      calories: preset.calories,
      cookTime: 1,
      servings: 1,
      origin: "user",
      ingredients: [preset.portion ? `${preset.title} (${preset.portion})` : preset.title],
      instructions: ["Prepare and enjoy."],
      tags: ["snack", "quick-bite", "healthy"],
    };

    const res = await saveRecipeToCloudOrLocal(newSnackRecipe);
    if (res.success && res.recipe) {
      onSelectRecipe(res.recipe.id, res.recipe);
      onClose();
    }
  };

  const handleLogEstimated = async (est: SnackNutritionEstimate) => {
    setIsLoggingCustom(true);

    const newSnackRecipe: Partial<AppRecipe> = {
      title: est.title,
      image: est.defaultImage,
      category: "snack",
      mealType: "snack",
      calories: est.calories,
      cookTime: 1,
      servings: 1,
      origin: "user",
      ingredients: [`${est.title} (${est.portion})`],
      instructions: ["Serve and enjoy."],
      tags: ["snack", "custom", "quick-bite", est.category.toLowerCase().replace(/\s+/g, "-")],
    };

    const res = await saveRecipeToCloudOrLocal(newSnackRecipe);
    setIsLoggingCustom(false);
    if (res.success && res.recipe) {
      onSelectRecipe(res.recipe.id, res.recipe);
      onClose();
    }
  };

  // Smart nutrition estimate for current search query
  const smartEstimate = useMemo(() => {
    if (!isSnackSlot || search.trim().length < 2) return null;
    return estimateSnackNutrition(search.trim());
  }, [isSnackSlot, search]);

  const filteredRecipes = useMemo(() => {
    const query = normalize(search);

    const searched = recipes.filter((recipe) => {
      if (!query) return true;

      const title = normalize(recipe.title);
      const ingredients = recipe.ingredients.map(normalize).join(" ");
      const tags = (recipe.tags ?? []).map(normalize).join(" ");
      const category = normalize(recipe.category ?? "");

      return (
        title.includes(query) ||
        ingredients.includes(query) ||
        tags.includes(query) ||
        category.includes(query)
      );
    });

    const filtered = searched.filter((recipe) => {
      // When picking a snack, strictly filter OUT heavy dinners/pastas by default
      if (isSnackSlot && !showAllRecipes && !search) {
        if (!matchesMealSlot(recipe, slot)) return false;
      }
      if (activeFilter === "recommended") return matchesMealSlot(recipe, slot);
      if (activeFilter === "quick") return recipe.cookTime !== undefined && recipe.cookTime <= 25;
      if (activeFilter === "low-cal") return recipe.calories !== undefined && recipe.calories <= 500;
      if (activeFilter === "imported") return recipe.origin === "imported";
      if (activeFilter === "your-recipes") return recipe.origin === "user";
      return true;
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
  }, [recipes, search, activeFilter, slot, selectedRecipeId, isSnackSlot, showAllRecipes]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8">
      {/* SOLID HIGH-SPEED BACKDROP */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* MODAL DIALOG - OBSIDIAN PALETTE */}
      <div className="relative z-10 flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[32px] sm:rounded-[36px] border border-slate-200/90 bg-white text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all dark:border-white/10 dark:bg-[#16120f] dark:text-stone-100">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 sm:px-8 dark:border-white/8">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-800 dark:text-stone-300">
                {formatMealSlot(slot)}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-stone-50">
                Choose {formatMealSlot(slot)}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-stone-400 mt-0.5">
              {isSnackSlot
                ? "Select a healthy quick bite, fruit, smoothie, or search to log any snack."
                : `${filteredRecipes.length} recipes available • Recommended matches prioritized`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedRecipeId !== null && onClearRecipe && (
              <button
                type="button"
                onClick={() => {
                  onClearRecipe();
                  onClose();
                }}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 cursor-pointer"
              >
                Clear Slot
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer text-base font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* FULL-WIDTH SEARCH & FILTER CONTROLS */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8 dark:border-white/8 dark:bg-[#1a1411]/80 space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isSnackSlot ? "Search snacks, fruits, smoothies, energy bites..." : "Search recipes by title, ingredients, cuisine..."}
              autoFocus
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white py-2 pl-11 pr-10 text-xs sm:text-sm font-semibold text-slate-950 placeholder:font-normal placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-white/12 dark:bg-[#1e1713] dark:text-stone-50 dark:placeholder:text-stone-500"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-700 dark:text-stone-400 dark:hover:text-white cursor-pointer text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* SMART 1-CLICK QUICK LOG BAR */}
          {smartEstimate && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-300 bg-white dark:bg-black/30 text-slate-900 dark:text-stone-100 animate-in fade-in slide-in-from-top-1 duration-150 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900">
                  <img
                    src={smartEstimate.defaultImage}
                    alt={smartEstimate.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-amber-400">
                      Smart 1-Click Log
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-stone-400 font-medium">
                      • {smartEstimate.portion}
                    </span>
                  </div>
                  <p className="truncate text-xs sm:text-sm font-bold text-slate-950 dark:text-stone-50">
                    {smartEstimate.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLogEstimated(smartEstimate)}
                disabled={isLoggingCustom}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 text-xs shadow-xs transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-50 dark:bg-white dark:text-slate-950"
              >
                <FlameIcon className="h-3.5 w-3.5 text-amber-400" />
                <span>Log {smartEstimate.calories} kcal</span>
                <PlusIcon className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Filter Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {FILTER_CHIPS.map((chip) => {
              const active = chip.value === activeFilter;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setActiveFilter(chip.value)}
                  className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow-xs border border-slate-900 font-bold dark:bg-white dark:text-slate-950 dark:border-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 100% NATIVE SMOOTH SCROLL GRID */}
        <div
          style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
          className="min-h-0 flex-1 overflow-y-scroll overscroll-contain p-6 sm:p-8 space-y-6"
        >
          {/* QUICK SNACK PRESETS - CLEAN OBSIDIAN THEME */}
          {isSnackSlot && !search && (
            <div className="space-y-3 pb-6 border-b border-stone-200/80 dark:border-white/8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SnackShelfIcon className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-950 dark:text-stone-50">
                      Quick Snacks & Healthy Bites (1-Click Log)
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Tap any item to instantly log it with verified calories.
                    </p>
                  </div>
                </div>
              </div>

              {/* CURATED PRESETS PHOTOGRAPHY GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {QUICK_SNACK_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white hover:border-amber-500 hover:shadow-md dark:border-white/10 dark:bg-[#1a1411] dark:hover:border-amber-400/50 dark:hover:bg-[#201915] text-left transition-all cursor-pointer active:scale-98"
                  >
                    <div className="relative h-24 sm:h-26 w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
                      <img
                        src={preset.image}
                        alt={preset.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {/* SLEEK FROSTED PILL BADGE */}
                      <div className="absolute top-2 right-2 rounded-full bg-black/65 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold text-stone-200 border border-white/10 flex items-center gap-1 shadow-xs">
                        <FlameIcon className="h-2.5 w-2.5 text-amber-400" />
                        <span>{preset.calories}</span>
                      </div>
                    </div>

                    <div className="p-3 space-y-0.5">
                      <p className="text-xs font-bold text-stone-950 dark:text-stone-50 truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {preset.title}
                      </p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate">
                        {preset.portion}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* COOKBOOK RECIPES SECTION HEADER */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <h3 className="text-sm font-extrabold text-stone-950 dark:text-stone-50">
                {isSnackSlot ? "Cookbook Snack & Light Meal Recipes" : "Cookbook Recipes"}
              </h3>
              {isSnackSlot && (
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {showAllRecipes
                    ? "Showing all recipes in your cookbook."
                    : "Filtered to show only snacks, bowls, and smoothies (dinners excluded)."}
                </p>
              )}
            </div>

            {isSnackSlot && (
              <button
                type="button"
                onClick={() => setShowAllRecipes((prev) => !prev)}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {showAllRecipes ? "Show Only Snack Recipes" : "Browse All Cookbook Recipes"}
              </button>
            )}
          </div>

          {/* RECIPES LISTING / EMPTY STATE */}
          {filteredRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-stone-400 dark:text-stone-500">
              <PlateIcon className="h-12 w-12 mb-3 text-stone-400 dark:text-stone-600" />
              <p className="text-base font-bold text-stone-800 dark:text-stone-200">
                No matching recipes found
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-sm">
                Try clearing search terms, or use the quick log bar above to add this snack directly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRecipes.map((recipe) => (
                <RecipeItemCard
                  key={recipe.id}
                  recipe={recipe}
                  isSelected={recipe.id === selectedRecipeId}
                  isPreferred={matchesMealSlot(recipe, slot)}
                  onSelect={(id) => {
                    onSelectRecipe(id);
                    onClose();
                  }}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default function RecipePickerModal(props: RecipePickerModalProps) {
  if (
    props.slot === "morning_snack" ||
    props.slot === "afternoon_snack" ||
    props.slot === "evening_snack"
  ) {
    return (
      <SnackPickerModal
        isOpen={props.isOpen}
        onClose={props.onClose}
        recipes={props.recipes}
        slot={props.slot}
        selectedRecipeId={props.selectedRecipeId}
        onSelectRecipe={props.onSelectRecipe}
        onClearRecipe={props.onClearRecipe}
      />
    );
  }

  return <StandardRecipePickerModal {...props} />;
}


