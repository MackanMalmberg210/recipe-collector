"use client";

import { useState, useEffect } from "react";
import {
  GROCERY_CATEGORIES,
  type GroceryCategory,
  type StoredGroceryItem,
  formatGroceryItemName,
} from "../../lib/groceries";
import GroceryCategoryIcon from "./GroceryCategoryIcon";

type GroceryAisleCardProps = {
  category: GroceryCategory;
  activeItems: { item: StoredGroceryItem; originalIndex: number }[];
  checkedItems: { item: StoredGroceryItem; originalIndex: number }[];
  recentlyAddedItemId?: string | null;
  onToggleBought: (index: number) => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onDeleteItem: (index: number) => void;
};

const CATEGORY_HEADER_THEMES: Record<
  GroceryCategory,
  { headerBg: string; iconBg: string; countBadge: string }
> = {
  produce: {
    headerBg: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-500/20",
    iconBg: "bg-emerald-600 text-white shadow-xs",
    countBadge: "bg-emerald-100 border-emerald-300 text-emerald-950 font-bold dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-300",
  },
  meat_seafood: {
    headerBg: "bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-500/20",
    iconBg: "bg-rose-600 text-white shadow-xs",
    countBadge: "bg-rose-100 border-rose-300 text-rose-950 font-bold dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-300",
  },
  dairy_fridge: {
    headerBg: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-500/20",
    iconBg: "bg-amber-600 text-white shadow-xs",
    countBadge: "bg-amber-100 border-amber-300 text-amber-950 font-bold dark:bg-amber-500/20 dark:border-amber-500/30 dark:text-amber-300",
  },
  bakery_grains: {
    headerBg: "bg-orange-50/70 dark:bg-orange-950/20 border-orange-200/80 dark:border-orange-500/20",
    iconBg: "bg-orange-600 text-white shadow-xs",
    countBadge: "bg-orange-100 border-orange-300 text-orange-950 font-bold dark:bg-orange-500/20 dark:border-orange-500/30 dark:text-orange-300",
  },
  spices_condiments: {
    headerBg: "bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-500/20",
    iconBg: "bg-indigo-600 text-white shadow-xs",
    countBadge: "bg-indigo-100 border-indigo-300 text-indigo-950 font-bold dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300",
  },
  beverages: {
    headerBg: "bg-sky-50/70 dark:bg-sky-950/20 border-sky-200/80 dark:border-sky-500/20",
    iconBg: "bg-sky-600 text-white shadow-xs",
    countBadge: "bg-sky-100 border-sky-300 text-sky-950 font-bold dark:bg-sky-500/20 dark:border-sky-500/30 dark:text-sky-300",
  },
  household_other: {
    headerBg: "bg-slate-100/80 dark:bg-white/5 border-slate-200/90 dark:border-white/10",
    iconBg: "bg-slate-900 text-white shadow-xs",
    countBadge: "bg-slate-200 border-slate-300 text-slate-900 font-bold dark:bg-white/10 dark:border-white/15 dark:text-white",
  },
};

export default function GroceryAisleCard({
  category,
  activeItems,
  checkedItems,
  recentlyAddedItemId,
  onToggleBought,
  onUpdateQuantity,
  onDeleteItem,
}: GroceryAisleCardProps) {
  const meta = GROCERY_CATEGORIES.find((c) => c.id === category) || GROCERY_CATEGORIES[0];
  const headerTheme = CATEGORY_HEADER_THEMES[category] || CATEGORY_HEADER_THEMES.produce;
  const [isExpandedCompleted, setIsExpandedCompleted] = useState(false);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);

  // Close delete confirmation when clicking anywhere outside
  useEffect(() => {
    if (confirmDeleteIndex === null) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-confirm-delete]")) return;
      setConfirmDeleteIndex(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    const timer = setTimeout(() => setConfirmDeleteIndex(null), 4500);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      clearTimeout(timer);
    };
  }, [confirmDeleteIndex]);

  const totalInAisle = activeItems.length + checkedItems.length;
  if (totalInAisle === 0) return null;

  const isAllCompleted = activeItems.length === 0 && checkedItems.length > 0;

  // =========================================================================
  // CASE A: 100% COMPLETED AISLE -> Sleek Compact Collapsed Bar
  // =========================================================================
  if (isAllCompleted) {
    return (
      <div
        style={{ contentVisibility: "auto", contain: "paint" }}
        className="w-full self-start rounded-[24px] border border-emerald-500/25 bg-emerald-500/5 dark:border-emerald-500/20 dark:bg-emerald-950/20 p-4 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 dark:hover:bg-emerald-950/30 shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsExpandedCompleted(!isExpandedCompleted)}
            className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer select-none"
          >
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">✓</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
              <GroceryCategoryIcon category={category} className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-stone-200 truncate">
              {meta.name}
            </span>
            <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-mono font-bold shrink-0">
              {checkedItems.length} done
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpandedCompleted(!isExpandedCompleted)}
            className="text-slate-500 hover:text-slate-900 dark:text-stone-400 dark:hover:text-stone-100 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/5 cursor-pointer shrink-0 transition"
          >
            {isExpandedCompleted ? "Hide" : "Show"}
          </button>
        </div>

        {/* EXPANDED COMPLETED ITEMS */}
        {isExpandedCompleted && (
          <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-2 animate-in fade-in duration-150">
            {checkedItems.map(({ item, originalIndex }) => {
              const displayName = formatGroceryItemName(item.name);
              return (
                <div
                  key={item.id || `${originalIndex}-${item.name}`}
                  className="flex items-center justify-between gap-2.5 rounded-[18px] bg-white/90 dark:bg-[#161616] border border-emerald-500/15 px-3.5 py-2 text-sm text-slate-500 dark:text-stone-400 shadow-2xs"
                >
                  <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.bought}
                      onChange={() => onToggleBought(originalIndex)}
                      className="h-4.5 w-4.5 rounded accent-emerald-600 cursor-pointer shrink-0"
                    />
                    <span className="line-through truncate text-slate-400 dark:text-stone-400 font-medium text-sm">
                      {displayName}
                    </span>
                  </label>

                  {confirmDeleteIndex === originalIndex ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteItem(originalIndex);
                          setConfirmDeleteIndex(null);
                        }}
                        className="rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold px-2 py-0.5 hover:bg-rose-500/30 transition cursor-pointer"
                        title="Confirm delete"
                      >
                        Delete?
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIndex(null)}
                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-1 cursor-pointer"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteIndex(originalIndex)}
                      className="text-stone-400 hover:text-rose-600 dark:text-stone-500 dark:hover:text-rose-400 text-xs p-1 cursor-pointer transition"
                      title="Delete item"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CASE B: ACTIVE AISLE CARD -> Unified High-End Shelf Card
  // =========================================================================
  return (
    <div
      style={{ contentVisibility: "auto", contain: "paint" }}
      className="w-full self-start rounded-[32px] border border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#121212] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col justify-between transition-colors duration-150 hover:border-slate-300 dark:hover:border-white/20"
    >
      {/* AISLE SHELF HEADER */}
      <div>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${headerTheme.headerBg}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`flex h-7 w-7 items-center justify-center rounded-xl shrink-0 ${headerTheme.iconBg}`}>
              <GroceryCategoryIcon category={category} className="h-4 w-4" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-950 dark:text-white truncate">
              {meta.name}
            </h2>
          </div>

          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold font-mono shrink-0 ${headerTheme.countBadge}`}>
            {activeItems.length} left
          </span>
        </div>

        {/* ACTIVE ITEMS */}
        <div className="p-3.5 sm:p-4 space-y-2">
          {activeItems.map(({ item, originalIndex }) => {
            const displayName = formatGroceryItemName(item.name);
            const isRecentlyAdded = Boolean(item.id && recentlyAddedItemId === item.id);

            return (
              <div
                key={item.id || `${originalIndex}-${item.name}`}
                className={`group flex items-center justify-between gap-3 rounded-[20px] border p-3 sm:p-3.5 transition-all duration-200 shadow-2xs ${
                  isRecentlyAdded
                    ? "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] bg-emerald-50/70 border-emerald-500 dark:bg-emerald-950/40 dark:border-emerald-500 scale-[1.01]"
                    : "border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 dark:border-white/8 dark:bg-[#161616] dark:hover:bg-[#1c1c1c]"
                }`}
              >
                {/* CHECKBOX & TITLE */}
                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none">
                  {/* Clean Checkbox */}
                  <input
                    type="checkbox"
                    checked={item.bought}
                    onChange={() => onToggleBought(originalIndex)}
                    className="h-5 w-5 rounded-md accent-emerald-600 cursor-pointer shrink-0 transition"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-slate-950 transition-colors leading-snug break-words">
                        {displayName}
                      </span>
                      {isRecentlyAdded && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 shadow-sm animate-bounce">
                          ✓ Added
                        </span>
                      )}
                    </div>

                    {/* RECIPE ORIGIN TAG (PIN) */}
                    {item.sourceRecipeTitle && (
                      <div className="flex items-center gap-1.5 mt-1 truncate">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-200/90 dark:bg-white/15 border border-slate-300 dark:border-white/20 text-[11px] font-bold text-slate-900 dark:text-white truncate shadow-2xs">
                          <svg className="h-3 w-3 text-slate-600 dark:text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="text-slate-600 dark:text-slate-300 font-semibold">For:</span>
                          <span className="truncate">{item.sourceRecipeTitle}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </label>

                {/* QUANTITY STEPPERS & DELETE */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* QUANTITY STEPPER */}
                  <div className="flex items-center rounded-full border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-black/50 p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(originalIndex, -1)}
                      className="h-6.5 w-6.5 flex items-center justify-center rounded-full text-slate-600 hover:text-slate-900 hover:bg-white dark:text-stone-400 dark:hover:text-white dark:hover:bg-white/10 text-xs font-black transition cursor-pointer"
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white min-w-[20px] text-center">
                      {item.quantity || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(originalIndex, 1)}
                      className="h-6.5 w-6.5 flex items-center justify-center rounded-full text-slate-600 hover:text-slate-900 hover:bg-white dark:text-stone-400 dark:hover:text-white dark:hover:bg-white/10 text-xs font-black transition cursor-pointer"
                      title="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* DELETE BUTTON WITH INLINE CONFIRMATION */}
                  {confirmDeleteIndex === originalIndex ? (
                    <div data-confirm-delete="true" className="flex items-center gap-1 shrink-0 animate-in fade-in duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteItem(originalIndex);
                          setConfirmDeleteIndex(null);
                        }}
                        className="rounded-full bg-rose-600 text-white text-[11px] font-bold px-3 py-1 hover:bg-rose-700 transition cursor-pointer shadow-sm"
                        title="Click to confirm removal"
                      >
                        Delete?
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIndex(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 text-xs px-1 cursor-pointer"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteIndex(originalIndex)}
                      className="h-7.5 w-7.5 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                      title="Delete item"
                    >
                      <svg className="h-3.5 w-3.5 text-slate-400 hover:text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHECKED OFF SECTION IN ACTIVE AISLE */}
      {checkedItems.length > 0 && (
        <div className="px-4 pb-3.5 pt-1.5 border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => setIsExpandedCompleted(!isExpandedCompleted)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-stone-400 dark:hover:text-stone-200 transition cursor-pointer py-1"
          >
            <span>{isExpandedCompleted ? "▼" : "▶"}</span>
            <span>{checkedItems.length} checked off in this aisle</span>
          </button>

          {isExpandedCompleted && (
            <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
              {checkedItems.map(({ item, originalIndex }) => {
                const displayName = formatGroceryItemName(item.name);
                return (
                  <div
                    key={item.id || `${originalIndex}-${item.name}`}
                    className="flex items-center justify-between gap-2.5 rounded-[16px] border border-slate-200/60 bg-slate-100/50 text-slate-600 dark:border-white/5 dark:bg-black/20 dark:text-stone-400 p-2.5 opacity-60 hover:opacity-100 transition"
                  >
                    <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.bought}
                        onChange={() => onToggleBought(originalIndex)}
                        className="h-4.5 w-4.5 rounded accent-emerald-600 cursor-pointer shrink-0"
                      />
                      <span className="text-sm font-medium text-slate-500 dark:text-stone-400 line-through truncate">
                        {displayName}
                      </span>
                    </label>

                    {confirmDeleteIndex === originalIndex ? (
                      <div data-confirm-delete="true" className="flex items-center gap-1 shrink-0 animate-in fade-in duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteItem(originalIndex);
                            setConfirmDeleteIndex(null);
                          }}
                          className="rounded-full bg-rose-600 text-white text-[11px] font-bold px-2.5 py-0.5 hover:bg-rose-700 transition cursor-pointer shadow-xs"
                          title="Confirm delete"
                        >
                          Delete?
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteIndex(null)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 text-xs px-1 cursor-pointer"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIndex(originalIndex)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs p-1 cursor-pointer transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
