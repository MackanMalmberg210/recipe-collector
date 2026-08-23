"use client";

type RecipeActionBarProps = {
  isFavorite: boolean;
  missingCount: number;
  isAddedToGrocery?: boolean;
  onToggleFavorite: () => void;
  onAddMissingToGroceryList: () => void;
  onUndoAddMissing?: () => void;
  onOpenCookMode: () => void;
  onShareRecipe: () => void;
  onDeleteRecipe?: () => void;
};

export default function RecipeActionBar({
  isFavorite,
  missingCount,
  isAddedToGrocery = false,
  onToggleFavorite,
  onAddMissingToGroceryList,
  onUndoAddMissing,
  onOpenCookMode,
  onShareRecipe,
  onDeleteRecipe,
}: RecipeActionBarProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#17120f]/90 p-4 sm:p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] ring-1 ring-white/3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* COOK MODE TRIGGER */}
          <button
            type="button"
            onClick={onOpenCookMode}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-bold text-stone-950 hover:bg-amber-600 transition cursor-pointer shadow-lg shadow-amber-400/20"
          >
            <span>👨‍🍳</span>
            <span>Start Cook Mode</span>
          </button>

          {/* GROCERY LIST BUTTON WITH SUCCESS & UNDO STATES */}
          {isAddedToGrocery ? (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-200 animate-in fade-in">
              <span>✓ Added to Grocery List</span>
              {onUndoAddMissing && (
                <button
                  type="button"
                  onClick={onUndoAddMissing}
                  className="rounded-lg bg-white/10 px-2 py-0.5 text-xs text-stone-200 hover:bg-white/20 transition cursor-pointer ml-1"
                >
                  Undo
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onAddMissingToGroceryList}
              disabled={missingCount === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-200 hover:bg-amber-400/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>🛒</span>
              <span>
                {missingCount === 0 ? "All in Grocery" : `Add Missing (${missingCount})`}
              </span>
            </button>
          )}
        </div>

        {/* UTILITY ACTIONS */}
        <div className="flex items-center gap-2">
          {/* FAVORITE BUTTON */}
          <button
            type="button"
            onClick={onToggleFavorite}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition cursor-pointer ${
              isFavorite
                ? "border-amber-400/30 bg-amber-400/15 text-amber-300"
                : "border-white/10 bg-white/5 text-stone-200 hover:bg-white/10 hover:text-white"
            }`}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          >
            <span>{isFavorite ? "★" : "☆"}</span>
            <span>{isFavorite ? "Favorited" : "Favorite"}</span>
          </button>

          {/* SHARE / COPY LINK */}
          <button
            type="button"
            onClick={onShareRecipe}
            className="inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Share & Copy Recipe Link"
          >
            🔗
          </button>

          {/* TRASH */}
          {onDeleteRecipe && (
            <button
              type="button"
              onClick={onDeleteRecipe}
              className="inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-stone-400 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
              title="Delete / Move to Trash"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
