"use client";

import type { AppRecipe } from "../../lib/types";

type DeleteConfirmModalProps = {
  recipe: AppRecipe | null;
  onConfirm: (recipe: AppRecipe) => void;
  onCancel: () => void;
  isPermanent?: boolean;
};

export default function DeleteConfirmModal({
  recipe,
  onConfirm,
  onCancel,
  isPermanent = false,
}: DeleteConfirmModalProps) {
  if (!recipe) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#151210] dark:text-stone-100 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Badge */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-2xl text-rose-600 dark:text-rose-400">
          🗑️
        </div>

        <h3 className="text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
          {isPermanent ? "Permanently Delete Recipe?" : "Move to Trash?"}
        </h3>

        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-400">
          {isPermanent ? (
            <>
              Are you sure you want to permanently delete <strong className="text-stone-900 dark:text-stone-200">{recipe.title}</strong>? This action cannot be undone.
            </>
          ) : (
            <>
              Are you sure you want to remove <strong className="text-stone-900 dark:text-stone-200">{recipe.title}</strong>? It will be safely moved to your <strong className="text-stone-900 dark:text-stone-200">Trash</strong> folder and kept for 30 days, where you can restore it anytime.
            </>
          )}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-100 pt-5 dark:border-white/8">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-300 dark:hover:bg-white/5 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm(recipe)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-rose-500 active:scale-[0.98] cursor-pointer"
          >
            <span>{isPermanent ? "Delete Permanently" : "Move to Trash"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
