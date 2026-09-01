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
        className="w-full self-start rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-3.5 transition hover:border-emerald-500/40 hover:bg-emerald-950/30 shadow-xs"
      >
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsExpandedCompleted(!isExpandedCompleted)}
            className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer select-none"
          >
            <span className="text-emerald-400 font-bold text-sm">✓</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10 shrink-0 text-stone-200">
              <GroceryCategoryIcon category={category} className="h-4 w-4 text-stone-200" />
            </div>
            <span className="text-sm font-bold text-stone-200 truncate">
              {meta.name}
            </span>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300 shrink-0">
              {checkedItems.length} done
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpandedCompleted(!isExpandedCompleted)}
            className="text-stone-400 hover:text-stone-100 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-white/5 cursor-pointer shrink-0 transition"
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
                  className="flex items-center justify-between gap-2.5 rounded-xl bg-black/40 px-3 py-2 text-sm text-stone-400"
                >
                  <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.bought}
                      onChange={() => onToggleBought(originalIndex)}
                      className="h-4 w-4 rounded accent-emerald-500 cursor-pointer shrink-0"
                    />
                    <span className="line-through truncate text-stone-400 font-medium text-sm">
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
                        className="rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-bold px-2 py-0.5 hover:bg-rose-500/30 transition cursor-pointer"
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
  // CASE B: ACTIVE AISLE CARD -> Unified High-End Espresso Shelf Card (120 FPS)
  // =========================================================================
  return (
    <div
      style={{ contentVisibility: "auto", contain: "paint" }}
      className="w-full self-start rounded-3xl border border-white/10 bg-[#16120f] shadow-xl overflow-hidden flex flex-col justify-between transition-colors duration-150 hover:border-amber-500/30"
    >
      {/* AISLE SHELF HEADER */}
      <div>
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#1b1511] border-b border-white/8">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/5 border border-white/10 shrink-0 text-stone-200">
              <GroceryCategoryIcon category={category} className="h-4 w-4 text-stone-200" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-[#fff8ef] truncate">
              {meta.name}
            </h2>
          </div>

          <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs font-bold font-mono text-amber-300 shrink-0">
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
                    ? "ring-2 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.35)] bg-gradient-to-r from-emerald-950/60 via-emerald-900/25 to-[#1f1915] border-emerald-400/60 scale-[1.01]"
                    : "border-white/8 bg-[#1f1915] hover:border-amber-400/40 hover:bg-[#251d18]"
                }`}
              >
                {/* CHECKBOX & TITLE */}
                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none">
                  {/* Clean Native Checkbox */}
                  <input
                    type="checkbox"
                    checked={item.bought}
                    onChange={() => onToggleBought(originalIndex)}
                    className="h-4.5 w-4.5 rounded accent-amber-500 cursor-pointer shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-[15px] font-bold text-stone-100 group-hover:text-white leading-snug break-words">
                        {displayName}
                      </span>
                      {isRecentlyAdded && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 text-stone-950 font-black text-[10px] px-2 py-0.5 shadow-sm shadow-emerald-400/50 animate-bounce">
                          ✓ Added
                        </span>
                      )}
                    </div>

                    {/* RECIPE ORIGIN TAG (PIN) */}
                    {item.sourceRecipeTitle && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs font-semibold text-amber-400 truncate">
                        <span>📌</span>
                        <span className="truncate">For: {item.sourceRecipeTitle}</span>
                      </div>
                    )}
                  </div>
                </label>

                {/* QUANTITY STEPPERS & DELETE */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* QUANTITY STEPPER */}
                  <div className="flex items-center rounded-xl border border-white/10 bg-black/50 p-0.5">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(originalIndex, -1)}
                      className="h-6.5 w-6.5 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 text-xs font-black transition cursor-pointer"
                      title="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-1.5 text-xs font-mono font-bold text-amber-300 min-w-[20px] text-center">
                      {item.quantity || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(originalIndex, 1)}
                      className="h-6.5 w-6.5 flex items-center justify-center rounded-lg text-stone-400 hover:text-white hover:bg-white/10 text-xs font-black transition cursor-pointer"
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
                      className="h-7.5 w-7.5 flex items-center justify-center rounded-xl text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete item"
                    >
                      <svg className="h-3.5 w-3.5 text-stone-500 hover:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        <div className="px-4 pb-3.5 pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={() => setIsExpandedCompleted(!isExpandedCompleted)}
            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-200 transition cursor-pointer py-1"
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
                    className="flex items-center justify-between gap-2.5 rounded-xl border border-white/5 bg-black/20 p-2.5 opacity-60 hover:opacity-100 transition"
                  >
                    <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.bought}
                        onChange={() => onToggleBought(originalIndex)}
                        className="h-4 w-4 rounded accent-emerald-500 cursor-pointer shrink-0"
                      />
                      <span className="text-sm font-medium text-stone-400 line-through truncate">
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
