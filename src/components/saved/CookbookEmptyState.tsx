"use client";

import Link from "next/link";
import type { SidebarFilter } from "./CookbookSidebar";

type CookbookEmptyStateProps = {
  activeFilter: SidebarFilter;
  searchQuery: string;
  hasTotalRecipes: boolean;
  onResetFilters: () => void;
  onSelectFilter: (filter: SidebarFilter) => void;
  onOpenImportModal?: () => void;
};

export default function CookbookEmptyState({
  activeFilter,
  searchQuery,
  hasTotalRecipes,
  onResetFilters,
  onSelectFilter,
  onOpenImportModal,
}: CookbookEmptyStateProps) {
  // 1. TRASH EMPTY STATE
  if (activeFilter.type === "trash") {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-8 text-center shadow-sm dark:border-white/[0.08] dark:bg-[#151210] md:p-12">
        <span className="text-4xl block mb-3">🗑️</span>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
          Trash is empty
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          No deleted recipes. When you delete a recipe, it will be stored here safely for 30 days before being permanently removed.
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => onSelectFilter({ type: "all" })}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-xs transition active:scale-[0.98] cursor-pointer"
          >
            Back to All Recipes
          </button>
        </div>
      </section>
    );
  }

  // 2. SEARCH EMPTY STATE
  if (searchQuery) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-8 text-center shadow-sm dark:border-white/[0.08] dark:bg-[#151210] md:p-12">
        <span className="text-4xl block mb-3">🔍</span>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
          No recipes found for &ldquo;{searchQuery}&rdquo;
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          We couldn&apos;t find any recipes matching your search. Try checking for typos or searching by a different ingredient.
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-xs transition active:scale-[0.98] cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      </section>
    );
  }

  // 3. FAVORITES EMPTY STATE
  if (activeFilter.type === "favorites") {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-8 text-center shadow-sm dark:border-white/[0.08] dark:bg-[#151210] md:p-12">
        <span className="text-4xl block mb-3">⭐</span>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
          No favorite recipes yet
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          Click the star icon on any recipe to save it directly to your favorites collection.
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => onSelectFilter({ type: "all" })}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-xs transition active:scale-[0.98] cursor-pointer"
          >
            Browse All Recipes
          </button>
        </div>
      </section>
    );
  }

  // 4. TOTAL ZERO RECIPES
  if (!hasTotalRecipes) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-8 text-center shadow-sm dark:border-white/[0.08] dark:bg-[#151210] md:p-12">
        <span className="text-4xl block mb-3">📖</span>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
          Your cookbook is ready for its first recipe
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
          Start by creating your own recipe or importing one from a URL to build your personal culinary library.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/create"
            className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-xs transition active:scale-[0.98]"
          >
            + Create Recipe
          </Link>

          {onOpenImportModal ? (
            <button
              type="button"
              onClick={onOpenImportModal}
              className="rounded-xl border border-stone-200/90 bg-stone-50/80 px-5 py-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-200 dark:hover:bg-white/5 active:scale-[0.98] cursor-pointer"
            >
              Import from URL
            </button>
          ) : (
            <Link
              href="/import"
              className="rounded-xl border border-stone-200/90 bg-stone-50/80 px-5 py-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-200 dark:hover:bg-white/5 active:scale-[0.98]"
            >
              Import from URL
            </Link>
          )}
        </div>
      </section>
    );
  }

  // 5. FILTER EMPTY (e.g. Category empty)
  return (
    <section className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-8 text-center shadow-sm dark:border-white/[0.08] dark:bg-[#151210] md:p-12">
      <span className="text-4xl block mb-3">🍲</span>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
        No recipes found in this filter
      </h2>

      <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
        You don&apos;t have any recipes in this specific category yet.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/create"
          className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-xs transition active:scale-[0.98]"
        >
          + Add Recipe
        </Link>

        <button
          type="button"
          onClick={() => onSelectFilter({ type: "all" })}
          className="rounded-xl border border-stone-200/90 bg-stone-50/80 px-5 py-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-200 dark:hover:bg-white/5 cursor-pointer"
        >
          View All Recipes
        </button>
      </div>
    </section>
  );
}
