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
    headerBg: "bg-emerald-50/90 dark:bg-[#1b1511] border-emerald-200 dark:border-white/8",
    iconBg: "bg-emerald-100 border-emerald-300 text-emerald-950 dark:bg-emerald-500/15 dark:text-emerald-300",
    countBadge: "bg-emerald-100 border-emerald-300 text-emerald-950 font-bold dark:bg-white/5 dark:border-white/10 dark:text-amber-300",
  },
  meat_seafood: {
    headerBg: "bg-rose-50/90 dark:bg-[#1b1511] border-rose-200 dark:border-white/8",
    iconBg: "bg-rose-100 border-rose-300 text-rose-950 dark:bg-rose-500/15 dark:text-rose-300",
    countBadge: "bg-rose-100 border-rose-300 text-rose-950 font-bold dark:bg-white/5 dark:border-white/10 dark:text-amber-300",
  },
  dairy_fridge: {
    headerBg: "bg-amber-50/90 dark:bg-[#1b1511] border-amber-200 dark:border-white/8",
    iconBg: "bg-amber-100 border-amber-300 text-amber-950 dark:bg-amber-500/15 dark:text-amber-300",
    countBadge: "bg-amber-100 border-amber-300 text-amber-950 font-bold dark:bg-white/5 dark:border-white/10 dark:text-amber-300",
  },
  bakery_grains: {
    headerBg: "bg-amber-50/60 dark:bg-[#1b1511] border-amber-200 dark:border-white/8",
    iconBg: "bg-amber-100 border-amber-300 text-amber-950 dark:bg-yellow-600/15 dark:text-yellow-300",
    countBadge: "bg-amber-100 border-amber-300 text-amber-950 font-bold dark:bg-white/5 dark:border-white/10 dark:text-amber-300",
  },
  spices_condiments: {
    headerBg: "bg-orange-50/90 dark:bg-[#1b1511] border-orange-200 dark:border-white/8",
    iconBg: "bg-orange-100 border-orange-300 text-orange-950 dark:bg-orange-500/15 dark:text-orange-300",
    countBadge: "bg-orange-100 border-orange-300 text-orange-950 font-bold dark:bg-white/5 dark:border-white/10 dark:text-amber-300",
  },
  beverages: {
    headerBg: "bg-sky-50/90 dark:bg-[#1b1511] border-sky-200 dark:border-white/8",
    iconBg: "bg-sky-100 border-sky-300 text-sky-950 dark:bg-cyan-500/15 dark:text-cyan-300",
    countBadge: "bg-sky-100 border-sky-300 text-sky-950 font-bold dark:bg-white/5 dark:border-white/10 dark:text-amber-300",
  },
  household_other: {
    headerBg: "bg-slate-100 dark:bg-[#1b1511] border-slate-200 dark:border-white/8",
    iconBg: "bg-slate-200 border-slate-300 text-slate-900 dark:bg-purple-500/15 dark:text-purple-300",
    countBadge: "bg-slate-200 border-slate-300 text-slate-900 font-bold dark:bg-white/5 dark:border-white/10 dark:text-amber-300",
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
        className="w-full self-start rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-500/25 dark:bg-emerald-950/20 p-3.5 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 dark:hover:bg-emerald-950/30 shadow-xs"
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsExpandedCompleted(!isExpandedCompleted)}
            className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer select-none"
          >
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">✓</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0 text-emerald-800 dark:text-stone-200">
              <GroceryCategoryIcon category={category} className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">
              {meta.name}
            </span>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
              {checkedItems.length} done
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpandedCompleted(!isExpandedCompleted)}
            className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-stone-200/50 dark:hover:bg-white/5 cursor-pointer shrink-0 transition"
          >
            {isExpandedCompleted ? "Hide" : "Show"}
          </button>
        </div>

        {/* EXPANDED COMPLETED ITEMS */}
        {isExpandedCompleted && (
          <div className="mt-3 pt-2.5 border-t border-emerald-500/15 space-y-2 animate-in fade-in duration-150">
            {checkedItems.map(({ item, originalIndex }) => {
              const displayName = formatGroceryItemName(item.name);
              return (
                <div
                  key={item.id || `${originalIndex}-${item.name}`}
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-white/70 dark:bg-black/40 border border-emerald-500/10 px-3 py-2 text-sm text-stone-500 dark:text-stone-400"
                >
                  <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.bought}
                      onChange={() => onToggleBought(originalIndex)}
                      className="h-4 w-4 rounded accent-emerald-500 cursor-pointer shrink-0"
                    />
                    <span className="line-through truncate text-stone-500 dark:text-stone-400 font-medium text-sm">
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
      className="w-full self-start rounded-3xl border border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#16120f] shadow-xs dark:shadow-xl overflow-hidden flex flex-col justify-between transition-colors duration-150 hover:border-slate-300 dark:hover:border-amber-500/30"
    >
      {/* AISLE SHELF HEADER */}
      <div>
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${headerTheme.headerBg}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`flex h-7 w-7 items-center justify-center rounded-xl border shrink-0 ${headerTheme.iconBg}`}>
              <GroceryCategoryIcon category={category} className="h-4 w-4" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-950 dark:text-[#fff8ef] truncate">
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
                className={`group flex items-center justify-between gap-3 rounded-2xl border p-3 sm:p-3.5 transition-all duration-200 shadow-xs ${
                  isRecentlyAdded
                    ? "ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)] bg-emerald-50/60 border-emerald-400 dark:bg-gradient-to-r dark:from-emerald-950/60 dark:via-emerald-900/25 dark:to-[#1f1915] dark:border-emerald-400/60 scale-[1.01]"
                    : "border-slate-200/90 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/60 shadow-2xs dark:border-white/8 dark:bg-[#1f1915] dark:hover:border-amber-400/40 dark:hover:bg-[#251d18]"
                }`}
              >
                {/* CHECKBOX & TITLE */}
                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none">
                  {/* Clean Native Checkbox */}
                  <input
                    type="checkbox"
                    checked={item.bought}
                    onChange={() => onToggleBought(originalIndex)}
                    className="h-4.5 w-4.5 rounded-md accent-amber-500 cursor-pointer shrink-0 transition"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-stone-100 group-hover:text-slate-950 dark:group-hover:text-amber-300 transition-colors leading-snug break-words">
                        {displayName}
                      </span>
                      {isRecentlyAdded && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white dark:bg-emerald-400 dark:text-stone-950 font-black text-[10px] px-2 py-0.5 shadow-sm shadow-emerald-400/50 animate-bounce">
                          ✓ Added
                        </span>
                      )}
                    </div>

                    {/* RECIPE ORIGIN TAG (PIN) */}
                    {item.sourceRecipeTitle && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs font-semibold text-amber-800 dark:text-amber-400 truncate">
                        <svg className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/>
                        </svg>
                        <span className="truncate">For: {item.sourceRecipeTitle}</span>
                      </div>
                    )}
                  </div>
                </label>

                {/* QUANTITY STEPPERS & DELETE */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* QUANTITY STEPPER */}
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-black/50 p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(originalIndex, -1)}
                      className="h-6.5 w-6.5 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white dark:text-stone-400 dark:hover:text-white dark:hover:bg-white/10 text-xs font-black transition cursor-pointer"
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-1.5 text-xs font-mono font-bold text-slate-800 dark:text-amber-300 min-w-[20px] text-center">
                      {item.quantity || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(originalIndex, 1)}
                      className="h-6.5 w-6.5 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white dark:text-stone-400 dark:hover:text-white dark:hover:bg-white/10 text-xs font-black transition cursor-pointer"
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
                        className="rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[11px] font-bold px-2 py-1 hover:bg-rose-500/30 transition cursor-pointer shadow-xs"
                        title="Click to confirm removal"
                      >
                        Delete?
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIndex(null)}
                        className="text-slate-400 hover:text-slate-200 text-xs px-1 cursor-pointer"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteIndex(originalIndex)}
                      className="h-7.5 w-7.5 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-stone-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete item"
                    >
                      <svg className="h-3.5 w-3.5 text-slate-400 hover:text-rose-600 dark:text-stone-500 dark:hover:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <div className="px-4 pb-3.5 pt-1 border-t border-stone-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => setIsExpandedCompleted(!isExpandedCompleted)}
            className="flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition cursor-pointer py-1"
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
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-stone-200/60 bg-stone-100/60 text-stone-600 dark:border-white/5 dark:bg-black/20 dark:text-stone-400 p-2.5 opacity-60 hover:opacity-100 transition"
                  >
                    <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.bought}
                        onChange={() => onToggleBought(originalIndex)}
                        className="h-4 w-4 rounded accent-emerald-500 cursor-pointer shrink-0"
                      />
                      <span className="text-sm font-medium text-stone-500 dark:text-stone-400 line-through truncate">
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
                          className="rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[11px] font-bold px-2 py-0.5 hover:bg-rose-500/30 transition cursor-pointer"
                          title="Confirm delete"
                        >
                          Delete?
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteIndex(null)}
                          className="text-stone-400 hover:text-stone-200 text-xs px-1 cursor-pointer"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIndex(originalIndex)}
                        className="text-stone-500 hover:text-rose-400 text-xs p-1 cursor-pointer transition"
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
