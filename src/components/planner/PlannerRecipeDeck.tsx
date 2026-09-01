"use client";

import { useState, useMemo, useEffect } from "react";
import type { AppRecipe } from "../../lib/types";

type PlannerRecipeDeckProps = {
  isOpen: boolean;
  onClose: () => void;
  recipes: AppRecipe[];
  onDragStart: (recipeId: number) => void;
};

type DeckFilter = "all" | "quick" | "breakfast" | "dinner" | "pasta";

export default function PlannerRecipeDeck({
  isOpen,
  onClose,
  recipes,
  onDragStart,
}: PlannerRecipeDeckProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DeckFilter>("all");

  // Lock body scroll while drawer is open so mouse wheel scrolls drawer directly
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchIng = r.ingredients.some((i) => i.toLowerCase().includes(q));
        if (!matchTitle && !matchIng) return false;
      }

      // Filters
      if (filter === "quick") return r.cookTime !== undefined && r.cookTime <= 30;
      if (filter === "breakfast") {
        return r.mealType === "breakfast" || r.title.toLowerCase().includes("egg") || (r.cookTime !== undefined && r.cookTime <= 15);
      }
      if (filter === "dinner") return r.mealType === "dinner" || r.category === "main-course";
      if (filter === "pasta") return r.category === "pasta" || r.title.toLowerCase().includes("pasta");
      return true;
    });
  }, [recipes, search, filter]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-200 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* SOLID HIGH-SPEED BACKDROP */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/75 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* SLIDE-OUT PANTRY DRAWER */}
      <aside
        className={`absolute left-0 top-0 bottom-0 flex h-full w-full max-w-md sm:max-w-xl lg:max-w-2xl flex-col overflow-hidden border-r border-stone-200/90 bg-white text-stone-950 shadow-2xl transition-transform duration-200 ease-out dark:border-white/12 dark:bg-[#15110e] dark:text-stone-100 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* PANTRY HEADER - CLEAN TYPOGRAPHY */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-stone-100 px-6 sm:px-8 bg-stone-50/80 dark:border-white/10 dark:bg-[#1a1511]">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
              My Cookbook
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Click or drag recipes directly into your week • {filteredRecipes.length} available
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer text-base font-bold"
            title="Close Drawer"
          >
            ✕
          </button>
        </header>

        {/* SEARCH & FILTERS */}
        <div className="border-b border-stone-100 p-5 sm:p-6 bg-white dark:border-white/8 dark:bg-[#1a1410]/60 space-y-3.5 shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes, ingredients, tags..."
            className="w-full rounded-2xl border border-stone-300 bg-stone-50/60 px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-950 placeholder-stone-400 focus:border-amber-500 focus:bg-white focus:outline-none transition dark:border-white/10 dark:bg-[#221b16] dark:text-stone-100 dark:placeholder-stone-500"
          />

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Recipes" },
              { id: "quick", label: "⏱ Quick (<30m)" },
              { id: "breakfast", label: "Breakfast" },
              { id: "dinner", label: "Dinner" },
              { id: "pasta", label: "Pasta" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as DeckFilter)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  filter === f.id
                    ? "bg-amber-500 text-stone-950 shadow-xs border border-amber-600/50"
                    : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-400 dark:hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-COLUMN RECIPE GRID - 100% NATIVE COMPOSITOR SCROLL */}
        <div
          style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
          className="min-h-0 flex-1 overflow-y-scroll overscroll-contain p-5 sm:p-6"
        >
          {filteredRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-center text-stone-400 dark:text-stone-500">
              <span className="text-4xl mb-3">🔍</span>
              <p className="text-sm font-bold text-stone-800 dark:text-stone-200">No recipes matched your search</p>
              <p className="text-xs text-stone-500 mt-1">Try clearing filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  draggable
                  onDragStart={() => {
                    onDragStart(recipe.id);
                    setTimeout(() => onClose(), 150);
                  }}
                  style={{
                    contentVisibility: "auto",
                    containIntrinsicSize: "0 140px",
                    contain: "paint",
                  }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-stone-200/90 bg-white p-4 hover:border-amber-500/60 dark:border-white/10 dark:bg-[#1f1915] dark:hover:border-amber-400/50 dark:hover:bg-[#251e19] cursor-grab active:cursor-grabbing shadow-xs transition-colors duration-100 ease-out"
                  title="Drag recipe into any day slot"
                >
                  <div className="flex gap-4 items-start">
                    {/* LARGER THUMBNAIL */}
                    <div className="relative h-20 w-20 sm:h-22 sm:w-22 shrink-0 overflow-hidden rounded-2xl bg-stone-200 dark:bg-stone-900 shadow-sm border border-stone-200/80 dark:border-white/10">
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">🍲</div>
                      )}
                    </div>

                    {/* DETAILS */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="line-clamp-2 text-sm sm:text-base font-bold text-stone-950 group-hover:text-amber-600 dark:text-stone-100 dark:group-hover:text-amber-400 transition-colors leading-snug">
                        {recipe.title}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-stone-500 dark:text-stone-400 font-medium">
                        {recipe.cookTime !== undefined && (
                          <span>⏱ {recipe.cookTime}m</span>
                        )}
                        {recipe.calories !== undefined && (
                          <span>• 🔥 {recipe.calories} kcal</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM FOOTER OF CARD */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs dark:border-white/6">
                    <span className="text-stone-500 dark:text-stone-400 text-[11px]">
                      {recipe.ingredients.length} ingredients
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-400 group-hover:underline transition flex items-center gap-1">
                      <span>Drag to plan</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
