"use client";

import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
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
  { value: "quick", label: "⏱ Quick (<25m)" },
  { value: "low-cal", label: "🔥 Under 500 kcal" },
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

// Ultra-fast Hardware-Accelerated Picker Card
const FastPickerCard = memo(function FastPickerCard({
  id,
  title,
  image,
  cookTime,
  calories,
  isSelected,
  isRecommended,
  onSelect,
}: {
  id: number;
  title: string;
  image?: string;
  cookTime?: number;
  calories?: number;
  isSelected: boolean;
  isRecommended: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "0 280px",
        contain: "paint",
      }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border text-left cursor-pointer transition-colors duration-100 ease-out ${
        isSelected
          ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30 dark:border-amber-400 dark:bg-amber-500/15"
          : "border-stone-200/90 bg-white hover:border-amber-500 dark:border-white/10 dark:bg-[#181411] dark:hover:border-amber-400/70"
      }`}
    >
      <div>
        {/* Cover Photo */}
        <div className="relative h-40 w-full overflow-hidden bg-stone-200 dark:bg-stone-900">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl">🍲</div>
          )}

          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            {isSelected && (
              <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm">
                Active
              </span>
            )}
            {isRecommended && !isSelected && (
              <span className="rounded-full bg-amber-500 text-stone-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm">
                Recommended
              </span>
            )}
          </div>
        </div>

        {/* Text Details */}
        <div className="p-4 space-y-2">
          <h4 className="line-clamp-2 text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
            {title}
          </h4>

          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-medium">
            {cookTime && <span>⏱ {cookTime}m</span>}
            {calories && <span>• 🔥 {calories} kcal</span>}
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
  const [activeFilter, setActiveFilter] = useState<PickerFilter>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll completely while modal is open so mouse wheel operates 100% on the modal
  useEffect(() => {
    if (!isOpen) return;

    setSearch("");
    setActiveFilter("all");

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

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
  }, [recipes, search, slot, activeFilter, selectedRecipeId]);

  const handleCardSelect = useCallback(
    (id: number) => {
      onSelectRecipe(id);
      onClose();
    },
    [onSelectRecipe, onClose],
  );

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* SOLID HIGH-SPEED BACKDROP */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 transition-opacity"
      />

      {/* WIDE MODAL CONTAINER (EXPLICIT HEIGHT FOR NATIVE SCROLL) */}
      <div className="relative flex h-[88vh] max-h-[880px] w-full max-w-6xl xl:max-w-7xl flex-col overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-2xl dark:border-white/10 dark:bg-[#14100d] dark:text-stone-100">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 sm:px-8 dark:border-white/8 shrink-0">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-stone-950 dark:text-stone-50">
              Choose {formatMealSlot(slot)}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              {filteredRecipes.length} recipes available • Recommended matches prioritized
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
              className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer text-base font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* FULL-WIDTH SEARCH & FILTER CONTROLS */}
        <div className="border-b border-stone-100 bg-stone-50/70 px-6 py-4 sm:px-8 dark:border-white/8 dark:bg-[#1a1411]/80 space-y-3 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes by title, ingredients, cuisine..."
              autoFocus
              className="h-11 w-full rounded-2xl border border-stone-300 bg-white py-2 pl-11 pr-10 text-xs sm:text-sm font-semibold text-stone-950 placeholder:font-normal placeholder:text-stone-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/12 dark:bg-[#1e1713] dark:text-stone-50 dark:placeholder:text-stone-500"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-700 dark:text-stone-400 dark:hover:text-white cursor-pointer text-sm"
              >
                ✕
              </button>
            )}
          </div>

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
                      ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 shadow-xs border border-amber-600/50 font-black"
                      : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10"
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
          className="min-h-0 flex-1 overflow-y-scroll overscroll-contain p-6 sm:p-8"
        >
          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRecipes.map((recipe) => (
                <FastPickerCard
                  key={recipe.id}
                  id={recipe.id}
                  title={recipe.title}
                  image={recipe.image}
                  cookTime={recipe.cookTime}
                  calories={recipe.calories}
                  isSelected={recipe.id === selectedRecipeId}
                  isRecommended={matchesMealSlot(recipe, slot)}
                  onSelect={handleCardSelect}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50/50 p-12 text-center dark:border-white/10 dark:bg-white/2">
              <p className="text-base font-bold text-stone-800 dark:text-stone-200">
                No recipes found
              </p>
              <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Try searching for another keyword or switch your filter above.
              </p>
              {activeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className="mt-4 rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 cursor-pointer"
                >
                  Show all recipes
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body,
  );
}
