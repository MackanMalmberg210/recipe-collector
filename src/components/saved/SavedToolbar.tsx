"use client";

export type CulinaryFilter = "all" | "favorites" | "quick" | "dinner" | "lunch" | "breakfast";
export type SortMode =
  | "newest"
  | "oldest"
  | "alphabetical"
  | "cookTime"
  | "rating"
  | "highest-rated";

export type ViewMode = "grid" | "list";

type SavedToolbarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  activeFilter: CulinaryFilter;
  onFilterChange: (value: CulinaryFilter) => void;
  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  resultCount: number;
  counts: {
    total: number;
    favorites: number;
    quick: number;
    dinner: number;
    lunch: number;
    breakfast: number;
  };
};

export default function SavedToolbar({
  searchQuery,
  onSearchQueryChange,
  activeFilter,
  onFilterChange,
  sortMode,
  onSortModeChange,
  viewMode,
  onViewModeChange,
  resultCount,
  counts,
}: SavedToolbarProps) {
  const tabs: { id: CulinaryFilter; label: string; count: number; icon?: string }[] = [
    { id: "all" as CulinaryFilter, label: "All Recipes", count: counts.total },
    { id: "favorites" as CulinaryFilter, label: "Favorites", count: counts.favorites, icon: "⭐" },
    { id: "quick" as CulinaryFilter, label: "Quick (<30m)", count: counts.quick, icon: "⏱" },
    { id: "dinner" as CulinaryFilter, label: "Dinner", count: counts.dinner },
    { id: "lunch" as CulinaryFilter, label: "Lunch", count: counts.lunch },
    { id: "breakfast" as CulinaryFilter, label: "Breakfast", count: counts.breakfast },
  ].filter((tab) => tab.id === "all" || tab.count > 0);

  const hasActiveFilter =
    Boolean(searchQuery) || activeFilter !== "all" || sortMode !== "newest";

  return (
    <section className="relative overflow-hidden rounded-4xl border border-stone-200/90 bg-white p-5 shadow-sm transition dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:p-6">
      {/* Subtle top border hairline highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent dark:via-amber-400/20" />

      <div className="flex flex-col gap-4">
        
        {/* TOP ROW: CULINARY FILTER PILL TABS */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex flex-nowrap items-center gap-2">
            {tabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onFilterChange(tab.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-stone-950 shadow-sm ring-2 ring-amber-500/30 dark:bg-amber-400 dark:text-stone-950"
                      : "border border-stone-200/90 bg-stone-50/70 text-stone-700 hover:border-stone-300 hover:bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-300 dark:hover:border-white/20 dark:hover:bg-[#221d19]"
                  }`}
                >
                  {tab.icon && <span>{tab.icon}</span>}
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                      isActive
                        ? "bg-black/15 text-stone-950"
                        : "bg-stone-200/70 text-stone-600 dark:bg-white/10 dark:text-stone-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM ROW: SEARCH INPUT + SORT DROPDOWN + VIEW TOGGLES */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-stone-100 dark:border-white/6">
          
          {/* Search box */}
          <div className="relative flex-1 min-w-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search recipes, ingredients, tags..."
              className="w-full rounded-2xl border border-stone-300 bg-stone-50/60 py-2.5 pl-11 pr-9 text-xs sm:text-sm font-medium text-stone-950 placeholder:font-normal placeholder:text-stone-400 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 dark:border-white/12 dark:bg-[#1c1815] dark:text-stone-50 dark:placeholder:text-stone-500 dark:focus:border-amber-400 dark:focus:bg-[#221e1a] dark:focus:ring-amber-400/20"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchQueryChange("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-700 dark:text-stone-400 dark:hover:text-white cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls: Sort + View Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sort select */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-stone-200/90 bg-stone-50/70 px-3 py-1.5 dark:border-white/10 dark:bg-[#1c1815]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Sort:
              </span>
              <select
                value={sortMode}
                onChange={(e) => onSortModeChange(e.target.value as SortMode)}
                className="bg-transparent text-xs sm:text-sm font-bold text-stone-800 outline-none dark:text-stone-200 cursor-pointer"
              >
                <option value="newest" className="dark:bg-stone-900">Newest</option>
                <option value="oldest" className="dark:bg-stone-900">Oldest</option>
                <option value="alphabetical" className="dark:bg-stone-900">A-Z</option>
                <option value="cookTime" className="dark:bg-stone-900">Cook Time</option>
                <option value="rating" className="dark:bg-stone-900">Top Rated</option>
              </select>
            </div>

            {/* View Mode Toggle (Grid vs List) */}
            <div className="flex items-center gap-1 rounded-2xl border border-stone-200/90 bg-stone-50/70 p-1 dark:border-white/10 dark:bg-[#1c1815]">
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-stone-950 shadow-xs dark:bg-amber-500 dark:text-stone-950 font-bold"
                    : "text-stone-400 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-stone-950 shadow-xs dark:bg-amber-500 dark:text-stone-950 font-bold"
                    : "text-stone-400 hover:text-stone-800 dark:text-stone-400 dark:hover:text-white"
                }`}
                title="List view"
                aria-label="List view"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Reset button if filter active */}
            {hasActiveFilter && (
              <button
                type="button"
                onClick={() => {
                  onSearchQueryChange("");
                  onFilterChange("all");
                  onSortModeChange("newest");
                }}
                className="rounded-2xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 shadow-2xs transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1">
          <p>
            Showing <strong className="text-stone-900 dark:text-stone-100">{resultCount}</strong> recipe{resultCount === 1 ? "" : "s"}
          </p>
        </div>

      </div>
    </section>
  );
}
