"use client";

type RecipeActionBarProps = {
  saved: boolean;
  groceryFeedback: string;
  missingCount: number;
  onToggleSaved: () => void;
  onAddMissingToGroceryList: () => void;
};

export default function RecipeActionBar({
  saved,
  groceryFeedback,
  missingCount,
  onToggleSaved,
  onAddMissingToGroceryList,
}: RecipeActionBarProps) {
  return (
    <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] ring-1 ring-white/3">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
            Ready to cook
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Save the recipe or send missing ingredients straight to your grocery
            list.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onToggleSaved}
            className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
              saved
                ? "border border-emerald-200/20 bg-emerald-300/15 text-emerald-100"
                : "bg-[#fff4e2] text-[#19120e] hover:bg-white"
            }`}
          >
            {saved ? "✓ Saved" : "♡ Save recipe"}
          </button>

          <button
            type="button"
            onClick={onAddMissingToGroceryList}
            disabled={missingCount === 0}
            className="rounded-2xl border border-amber-100/15 bg-amber-100/6 px-5 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-100/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add missing to grocery
          </button>
        </div>
      </div>

      {groceryFeedback && (
        <div className="mt-4 rounded-2xl border border-emerald-200/15 bg-emerald-300/10 px-4 py-3 text-sm font-medium text-emerald-100">
          {groceryFeedback}
        </div>
      )}
    </section>
  );
}
