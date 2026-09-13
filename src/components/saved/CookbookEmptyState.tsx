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

const BRAND_BTN_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 shadow-sm dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border-amber-600/50 px-5 py-2.5 text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer";

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
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:border-white/[0.08] dark:bg-[#151210] md:p-12">
        <svg className="h-10 w-10 text-slate-400 dark:text-stone-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-stone-50">
          Trash is empty
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-500 dark:text-stone-400 leading-relaxed">
          No deleted recipes. When you delete a recipe, it will be stored here safely for 30 days before being permanently removed.
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => onSelectFilter({ type: "all" })}
            className={BRAND_BTN_CLASS}
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
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:border-white/[0.08] dark:bg-[#151210] md:p-12">
        <svg className="h-10 w-10 text-slate-400 dark:text-stone-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-stone-50">
          No recipes found for &ldquo;{searchQuery}&rdquo;
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-500 dark:text-stone-400 leading-relaxed">
          We couldn&apos;t find any recipes matching your search. Try checking for typos or searching by a different ingredient.
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onResetFilters}
            className={BRAND_BTN_CLASS}
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
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:border-white/[0.08] dark:bg-[#151210] md:p-12">
        <svg className="h-10 w-10 text-slate-400 dark:text-amber-500/80 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-stone-50">
          No favorite recipes yet
        </h2>

        <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-500 dark:text-stone-400 leading-relaxed">
          Click the star icon on any recipe to save it directly to your favorites collection.
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => onSelectFilter({ type: "all" })}
            className={BRAND_BTN_CLASS}
          >
            Browse All Recipes
          </button>
        </div>
      </section>
    );
  }

  // 4. TOTAL ZERO RECIPES (ONBOARDING MODE)
  if (!hasTotalRecipes) {
    return (
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-7 sm:p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:border-white/[0.08] dark:bg-gradient-to-b dark:from-[#191411] dark:via-[#15110e] dark:to-[#120e0c]">
        {/* Ambient warm culinary glow */}
        <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 h-64 w-[32rem] rounded-full bg-slate-900/5 blur-3xl opacity-70 dark:bg-amber-500/10" />

        <div className="relative mx-auto max-w-xl text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950 dark:text-[#fff8ef]">
            Start building your culinary library
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-stone-400 leading-relaxed font-medium">
            Your cookbook is currently empty. Choose one of three simple ways to get started:
          </p>
        </div>

        <div className="relative mt-8 grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          {/* OPTION 1: INSTANT URL IMPORT */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-slate-50/50 dark:border-white/[0.08] dark:bg-[#181310] p-6 sm:p-7 transition-all duration-300 hover:border-slate-300 hover:bg-white hover:shadow-md dark:hover:border-amber-500/35 dark:hover:from-amber-500/15">
            <div>
              <svg className="h-7 w-7 text-slate-900 dark:text-amber-500 mb-4 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="font-bold text-base sm:text-lg text-slate-950 dark:text-stone-100">
                Import from the Web
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-stone-400 leading-relaxed">
                Paste any recipe link from food blogs or cooking sites to extract clean ingredients and instructions, completely ad-free.
              </p>
            </div>
            <div className="mt-6">
              {onOpenImportModal ? (
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 text-xs sm:text-sm border border-slate-900 shadow-sm dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 dark:border-amber-600/60 transition active:scale-95 cursor-pointer"
                >
                  <span>Import a Recipe</span>
                  <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                </button>
              ) : (
                <Link
                  href="/import"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 text-xs sm:text-sm border border-slate-900 shadow-sm dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 dark:border-amber-600/60 transition active:scale-95"
                >
                  <span>Import a Recipe</span>
                  <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                </Link>
              )}
            </div>
          </div>

          {/* OPTION 2: EXPLORE CURATED RECIPES */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-slate-50/50 dark:border-white/[0.08] dark:bg-[#181310] p-6 sm:p-7 transition-all duration-300 hover:border-slate-300 hover:bg-white hover:shadow-md dark:hover:border-amber-500/35 dark:hover:from-amber-500/15">
            <div>
              <svg className="h-7 w-7 text-slate-900 dark:text-amber-500 mb-4 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
              </svg>
              <h3 className="font-bold text-base sm:text-lg text-slate-950 dark:text-stone-100">
                Explore &amp; Star Dishes
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-stone-400 leading-relaxed">
                Browse tested studio &amp; community recipes. Star any dish to immediately pin it to your library.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 text-xs sm:text-sm border border-slate-900 shadow-sm dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 dark:border-amber-600/60 transition active:scale-95"
              >
                <span>Explore Recipes</span>
                <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>

          {/* OPTION 3: CREATE CUSTOM RECIPE */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-slate-50/50 dark:border-white/[0.08] dark:bg-[#181310] p-6 sm:p-7 transition-all duration-300 hover:border-slate-300 hover:bg-white hover:shadow-md dark:hover:border-amber-500/35 dark:hover:from-amber-500/15">
            <div>
              <svg className="h-7 w-7 text-slate-900 dark:text-amber-500 mb-4 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h3 className="font-bold text-base sm:text-lg text-slate-950 dark:text-stone-100">
                Write Your Own
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-stone-400 leading-relaxed">
                Add cherished family recipes, type up old favorites from a handwritten notebook, or build your own creations from scratch.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/create"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 text-xs sm:text-sm border border-slate-900 shadow-sm dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 dark:border-amber-600/60 transition active:scale-95"
              >
                <span>Create Recipe</span>
                <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 5. FILTER EMPTY (e.g. Category empty)
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-slate-200/90 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.05)] dark:border-white/[0.08] dark:bg-[#151210] md:p-12">
      <span className="text-4xl block mb-3">🍲</span>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-stone-50">
        No recipes found in this filter
      </h2>

      <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-slate-500 dark:text-stone-400 leading-relaxed">
        You don&apos;t have any recipes in this specific category yet.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/create"
          className={BRAND_BTN_CLASS}
        >
          + Add Recipe
        </Link>

        <button
          type="button"
          onClick={() => onSelectFilter({ type: "all" })}
          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-800 transition shadow-2xs cursor-pointer dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-200 dark:hover:bg-white/5"
        >
          View All Recipes
        </button>
      </div>
    </section>
  );
}
