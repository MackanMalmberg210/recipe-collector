"use client";

export type SourceFilter = "all" | "saved" | "created" | "imported";
export type SortMode = "newest" | "oldest" | "alphabetical" | "cookTime";

type SavedToolbarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sourceFilter: SourceFilter;
  onSourceFilterChange: (value: SourceFilter) => void;
  sortMode: SortMode;
  onSortModeChange: (value: SortMode) => void;
  resultCount: number;
};

export default function SavedToolbar({
  searchQuery,
  onSearchQueryChange,
  sourceFilter,
  onSourceFilterChange,
  sortMode,
  onSortModeChange,
  resultCount,
}: SavedToolbarProps) {
  return (
    <section className="rounded-4xl border border-white/10 bg-[#17120f]/85 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] ring-1 ring-white/3 md:p-6">
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
            Browse cookbook
          </p>

          <h2 className="text-2xl font-semibold tracking-tight text-[#fff8ef]">
            Find the right recipe faster
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_220px]">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-stone-300">Search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search by title, ingredient, tag or category..."
              className="h-12 rounded-2xl border border-white/10 bg-[#211915] px-4 text-sm text-[#fff8ef] outline-none transition placeholder:text-stone-500 focus:border-amber-100/25 focus:bg-[#261d17]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-stone-300">Source</span>
            <select
              value={sourceFilter}
              onChange={(e) =>
                onSourceFilterChange(e.target.value as SourceFilter)
              }
              className="h-12 rounded-2xl border border-white/10 bg-[#211915] px-4 text-sm text-[#fff8ef] outline-none transition focus:border-amber-100/25"
            >
              <option value="all">All recipes</option>
              <option value="saved">Saved library</option>
              <option value="created">Created by you</option>
              <option value="imported">Imported</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-stone-300">Sort by</span>
            <select
              value={sortMode}
              onChange={(e) => onSortModeChange(e.target.value as SortMode)}
              className="h-12 rounded-2xl border border-white/10 bg-[#211915] px-4 text-sm text-[#fff8ef] outline-none transition focus:border-amber-100/25"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="alphabetical">Alphabetical</option>
              <option value="cookTime">Cook time</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <p className="text-sm text-stone-400">
            Showing{" "}
            <span className="font-semibold text-[#fff8ef]">{resultCount}</span>{" "}
            recipe{resultCount === 1 ? "" : "s"}
          </p>

          {(searchQuery || sourceFilter !== "all" || sortMode !== "newest") && (
            <button
              type="button"
              onClick={() => {
                onSearchQueryChange("");
                onSourceFilterChange("all");
                onSortModeChange("newest");
              }}
              className="rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-sm font-medium text-stone-200 transition hover:bg-white/8"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
