"use client";

import { useEffect } from "react";
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
  // Lock body scroll while modal is open
  useEffect(() => {
    if (!recipe) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [recipe]);

  if (!recipe) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150"
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

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-2.5 text-xs sm:text-sm font-bold text-stone-700 hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(recipe)}
            className="rounded-2xl bg-rose-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-700 shadow-md hover:shadow-rose-600/30 transition cursor-pointer"
          >
            {isPermanent ? "Yes, Delete Permanently" : "Move to Trash"}
          </button>
        </div>
      </div>
    </div>
  );
}
