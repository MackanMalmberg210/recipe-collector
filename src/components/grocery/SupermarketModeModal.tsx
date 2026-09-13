"use client";

import { useState, useEffect, useMemo } from "react";
import {
  GROCERY_CATEGORIES,
  type GroceryCategory,
  type StoredGroceryItem,
  formatGroceryItemName,
} from "../../lib/groceries";
import GroceryCategoryIcon from "./GroceryCategoryIcon";
import { requestWakeLock, releaseWakeLock } from "../../lib/wakeLock";

type SupermarketModeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  items: StoredGroceryItem[];
  listTitle: string;
  onToggleBought: (originalIndex: number) => void;
  onUpdateQuantity: (originalIndex: number, delta: number) => void;
  isOnline: boolean;
};

export default function SupermarketModeModal({
  isOpen,
  onClose,
  items,
  listTitle,
  onToggleBought,
  onUpdateQuantity,
  isOnline,
}: SupermarketModeModalProps) {
  const [filterMode, setFilterMode] = useState<"remaining" | "all">("remaining");
  const [wakeLockActive, setWakeLockActive] = useState(false);

  // Manage Screen Wake Lock while in Supermarket Mode
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    requestWakeLock().then((active) => {
      if (mounted) setWakeLockActive(active);
    });

    // Re-acquire wake lock if user switches tabs and comes back
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isOpen) {
        requestWakeLock().then((active) => {
          if (mounted) setWakeLockActive(active);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isOpen]);

  // Handle ESC key to exit
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Group items by Aisle
  const groupedAisles = useMemo(() => {
    const map = new Map<GroceryCategory, { item: StoredGroceryItem; originalIndex: number }[]>();

    items.forEach((item, originalIndex) => {
      const cat = item.category || "household_other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push({ item, originalIndex });
    });

    const list: {
      category: GroceryCategory;
      name: string;
      icon: string;
      badgeClass: string;
      items: { item: StoredGroceryItem; originalIndex: number }[];
    }[] = [];

    GROCERY_CATEGORIES.forEach((catMeta) => {
      const aisleItems = map.get(catMeta.id) || [];
      const visibleItems = filterMode === "remaining"
        ? aisleItems.filter((entry) => !entry.item.bought)
        : aisleItems;

      if (visibleItems.length > 0) {
        // Sort unchecked first, then alphabetical
        visibleItems.sort((a, b) => {
          if (a.item.bought !== b.item.bought) return a.item.bought ? 1 : -1;
          return a.item.name.localeCompare(b.item.name, "sv", { sensitivity: "base" });
        });

        list.push({
          category: catMeta.id,
          name: catMeta.name,
          icon: catMeta.icon,
          badgeClass: catMeta.badgeClass,
          items: visibleItems,
        });
      }
    });

    return list;
  }, [items, filterMode]);

  const totalItems = items.length;
  const boughtItems = items.filter((i) => i.bought).length;
  const remainingItems = totalItems - boughtItems;
  const progressPercent = totalItems > 0 ? Math.round((boughtItems / totalItems) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#F9F9F8] dark:bg-[#0c0d0e] text-slate-900 dark:text-stone-100 overflow-hidden select-none animate-in fade-in duration-200">
      
      {/* 1. TOP SUPERMARKET NAVIGATION BAR */}
      <header className="shrink-0 border-b border-slate-200/90 dark:border-[#2e2722] bg-white/95 dark:bg-[#141210]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-black shadow-sm border border-amber-600/50 shrink-0">
            <svg className="h-5 w-5 stroke-[2.4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black tracking-tight truncate text-slate-950 dark:text-white">
                {listTitle}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-900 dark:text-amber-300 border border-amber-500/25 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                Supermarket Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-stone-400 truncate mt-0.5">
              {remainingItems === 0
                ? "All items checked off! 🎉"
                : `${remainingItems} items left to pick • ${boughtItems} in cart (${progressPercent}%)`}
            </p>
          </div>
        </div>

        {/* CONTROLS: NETWORK BADGE, WAKE LOCK, FILTER & EXIT */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Online / Offline Status Badge */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition ${
              isOnline
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50"
                : "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50 animate-pulse"
            }`}
            title={isOnline ? "Online: Changes sync to the cloud" : "Offline: Working locally in offline supermarket mode"}
          >
            <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="hidden sm:inline">{isOnline ? "Online" : "Offline Mode"}</span>
          </div>

          {/* Screen Keep Awake Indicator */}
          {wakeLockActive && (
            <div
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-stone-300 bg-slate-100 dark:bg-[#1e1a17] border border-slate-200/80 dark:border-[#2e2722] rounded-full px-3 py-1.5"
              title="Screen stays awake while in Supermarket Mode"
            >
              <span className="text-amber-500 text-xs">☀️</span>
              <span>Screen Awake</span>
            </div>
          )}

          {/* FILTER: REMAINING VS ALL */}
          <div className="flex items-center rounded-full border border-slate-200/80 bg-slate-100 p-1 dark:border-[#2e2722] dark:bg-[#1a1715]">
            <button
              type="button"
              onClick={() => setFilterMode("remaining")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                filterMode === "remaining"
                  ? "bg-white text-slate-950 shadow-xs dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 dark:border-amber-600/50"
                  : "text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              To Buy ({remainingItems})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                filterMode === "all"
                  ? "bg-white text-slate-950 shadow-xs dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:text-stone-950 dark:border-amber-600/50"
                  : "text-slate-600 hover:text-slate-900 dark:text-stone-400 dark:hover:text-stone-200"
              }`}
            >
              All ({totalItems})
            </button>
          </div>

          {/* EXIT BUTTON (Standard neutral button) */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-[#2e2722] dark:bg-[#24201c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823] dark:hover:text-[#fafaf9] px-3.5 py-1.5 text-xs sm:text-sm font-bold shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <span>Exit</span>
            <span className="text-xs text-slate-400 dark:text-stone-400">✕</span>
          </button>
        </div>
      </header>

      {/* 2. PROGRESS BAR */}
      <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 shrink-0 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3. AISLE GROUPS & LARGE TOUCH TARGET CHECKLIST */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full space-y-8">
        {groupedAisles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-3xl">
              ✓
            </div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">
              {remainingItems === 0 ? "You are all set!" : "No items match this filter"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-stone-400 max-w-md">
              {remainingItems === 0
                ? "Every item on your list has been checked into your cart. Ready for checkout!"
                : "Switch to 'All' to see items you have already checked off."}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 shadow-sm dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border-amber-600/50 font-bold px-6 py-2.5 text-sm cursor-pointer hover:scale-105 transition active:scale-95"
            >
              Back to Main View
            </button>
          </div>
        ) : (
          groupedAisles.map((aisle) => (
            <section key={aisle.category} className="space-y-3">
              {/* AISLE STICKY HEADER */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-stone-300">
                    <GroceryCategoryIcon category={aisle.category} className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-slate-800 dark:text-stone-200">
                    {aisle.name}
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-stone-400">
                  {aisle.items.filter((i) => !i.item.bought).length} left
                </span>
              </div>

              {/* AISLE ITEM ROWS (Optimized for one-hand thumb tapping) */}
              <div className="space-y-2.5">
                {aisle.items.map(({ item, originalIndex }) => {
                  const displayName = formatGroceryItemName(item.name);
                  const isBought = Boolean(item.bought);

                  return (
                    <div
                      key={item.id || `${originalIndex}-${item.name}`}
                      className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all duration-150 cursor-pointer ${
                        isBought
                          ? "border-slate-200/60 bg-slate-100/70 opacity-55 dark:border-white/5 dark:bg-white/5"
                          : "border-slate-200 bg-white hover:border-slate-400 dark:border-white/10 dark:bg-[#151619] dark:hover:border-white/20 shadow-xs hover:shadow-sm active:scale-[0.99]"
                      }`}
                      onClick={() => onToggleBought(originalIndex)}
                    >
                      {/* Left: Big Touch Checkbox + Text */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                            isBought
                              ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
                              : "border-slate-300 bg-white dark:border-white/20 dark:bg-black/30"
                          }`}
                        >
                          {isBought && (
                            <svg className="h-4 w-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span
                            className={`text-base sm:text-lg font-bold leading-snug break-words ${
                              isBought
                                ? "text-slate-400 line-through dark:text-stone-500"
                                : "text-slate-950 dark:text-white"
                            }`}
                          >
                            {displayName}
                          </span>

                          {item.sourceRecipeTitle && (
                            <p className="text-xs text-slate-500 dark:text-amber-400/90 font-medium truncate mt-0.5">
                              For: {item.sourceRecipeTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Quantity Stepper (Stop propagation so tapping buttons doesn't toggle item) */}
                      <div
                        className="flex items-center rounded-full border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-black/40 p-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(originalIndex, -1)}
                          className="h-8 w-8 flex items-center justify-center rounded-full text-slate-700 hover:bg-white hover:text-slate-950 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white font-black text-sm transition cursor-pointer"
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-2 font-mono font-bold text-sm text-slate-950 dark:text-white min-w-[24px] text-center">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(originalIndex, 1)}
                          className="h-8 w-8 flex items-center justify-center rounded-full text-slate-700 hover:bg-white hover:text-slate-950 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white font-black text-sm transition cursor-pointer"
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      {/* 4. BOTTOM FLOATING ACTION BAR */}
      <footer className="shrink-0 border-t border-slate-200/90 dark:border-[#2e2722] bg-white/95 dark:bg-[#141210]/95 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-stone-400">
          <span>Tap anywhere on an item to check it off</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 shadow-sm dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border-amber-600/50 font-black px-5 py-2.5 text-xs sm:text-sm cursor-pointer transition active:scale-95"
        >
          Done Shopping
        </button>
      </footer>

    </div>
  );
}
