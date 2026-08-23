"use client";

import { useState, useMemo } from "react";
import type { AppRecipe } from "../../lib/types";

type PlannerRecipeDeckProps = {
  isOpen: boolean;
  onClose: () => void;
  recipes: AppRecipe[];
  onDragStart: (recipeId: number) => void;
};

type DeckFilter = "all" | "quick" | "favorites" | "breakfast" | "pasta" | "chicken";

function CookbookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M9 7h7" />
      <path d="M9 11h7" />
      <path d="M9 15h4" />
      <path d="M4 19.5a2.5 2.5 0 0 0 2.5 2.5H20" />
    </svg>
  );
}

export default function PlannerRecipeDeck({
  isOpen,
  onClose,
  recipes,
  onDragStart,
}: PlannerRecipeDeckProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DeckFilter>("all");

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
      if (filter === "pasta") return r.category === "pasta" || r.title.toLowerCase().includes("pasta");
      if (filter === "chicken") return r.ingredients.some((i) => i.toLowerCase().includes("chicken"));
      return true;
    });
  }, [recipes, search, filter]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* SLIDE-OUT PANTRY DRAWER (LUXURIOUS WIDE OVERLAY) */}
      <aside
        className={`drawer-spring-transition absolute left-0 top-0 bottom-0 flex h-full w-full max-w-md sm:max-w-xl lg:max-w-2xl flex-col border-r border-white/12 bg-[#15110e] text-stone-100 shadow-[0_0_90px_rgba(0,0,0,0.85)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* PANTRY HEADER */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-6 sm:px-8 bg-[#1a1511]">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 shadow-inner">
              <CookbookIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#fff8ef]">
                Recipe Pantry
              </h2>
              <p className="text-xs text-stone-400">
                Drag recipes directly into your week • {filteredRecipes.length} available
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/5 text-stone-400 hover:bg-white/15 hover:text-white transition cursor-pointer text-sm font-bold"
            title="Close Pantry"
          >
            ✕
          </button>
        </header>

        {/* SEARCH & FILTERS */}
        <div className="border-b border-white/8 p-5 sm:p-6 bg-[#1a1410]/60 space-y-3.5 shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes, ingredients, tags..."
            className="w-full rounded-2xl border border-white/10 bg-[#221b16] px-4 py-3 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none transition"
          />

          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Recipes" },
              { id: "quick", label: "⏱ Quick (<30m)" },
              { id: "breakfast", label: "☀️ Breakfast" },
              { id: "chicken", label: "🍗 Chicken" },
              { id: "pasta", label: "🍝 Pasta" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as DeckFilter)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  filter === f.id
                    ? "bg-amber-500 text-stone-950 shadow-sm"
                    : "bg-white/5 text-stone-400 hover:bg-white/10 hover:text-stone-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2-COLUMN LUXURIOUS RECIPE GRID */}
        <div
          className="flex-1 overflow-y-auto p-5 sm:p-6 overscroll-contain"
          style={{
            transform: "translateZ(0)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {filteredRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-center text-stone-500">
              <span className="text-4xl mb-3">🔍</span>
              <p className="text-sm font-medium">No recipes matched your search</p>
              <p className="text-xs text-stone-600 mt-1">Try clearing filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  draggable
                  onDragStart={() => {
                    onDragStart(recipe.id);
                    setTimeout(() => onClose(), 150);
                  }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/8 bg-[#211915]/90 p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-[#281e18] hover:shadow-xl cursor-grab active:cursor-grabbing"
                  style={{ transform: "translateZ(0)" }}
                  title="Drag recipe into any day slot"
                >
                  <div className="flex gap-3.5 items-start">
                    {/* THUMBNAIL */}
                    <div className="relative h-16 w-16 sm:h-18 sm:w-18 shrink-0 overflow-hidden rounded-2xl bg-stone-900 shadow-inner">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                        loading="lazy"
                      />
                    </div>

                    {/* DETAILS */}
                    <div className="flex-1 min-w-0">
                      <h4 className="line-clamp-2 text-xs sm:text-sm font-bold text-stone-100 group-hover:text-amber-300 transition-colors leading-snug">
                        {recipe.title}
                      </h4>
                      
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-400 font-mono">
                        {recipe.cookTime !== undefined && (
                          <span>⏱ {recipe.cookTime}m</span>
                        )}
                        {recipe.calories !== undefined && (
                          <span>🔥 {recipe.calories} kcal</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM FOOTER OF CARD */}
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-stone-500">
                    <span className="text-stone-400">
                      {recipe.ingredients.length} ingredients
                    </span>
                    <span className="font-semibold text-amber-400/80 group-hover:text-amber-300 transition flex items-center gap-1">
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
