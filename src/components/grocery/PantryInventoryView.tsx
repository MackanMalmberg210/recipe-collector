"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  GROCERY_CATEGORIES,
  categorizeGroceryItem,
  type PantryItem,
  type GroceryCategory,
  formatGroceryItemName,
  TEN_PANTRY_ESSENTIALS,
} from "../../lib/groceries";
import GroceryCategoryIcon from "./GroceryCategoryIcon";

type PantryInventoryViewProps = {
  pantryItems: PantryItem[];
  learnedVocab?: string[];
  onToggleStock: (id: string) => void;
  onAddItem: (name: string, category: GroceryCategory) => void;
  onDeleteItem: (id: string) => void;
  onAddMissingToGroceryList?: (itemNames: string[]) => void;
  onOpenCookWhatIHave?: () => void;
};

export default function PantryInventoryView({
  pantryItems,
  learnedVocab = [],
  onToggleStock,
  onAddItem,
  onDeleteItem,
}: PantryInventoryViewProps) {
  const [newStapleName, setNewStapleName] = useState("");
  const [filterCategory, setFilterCategory] = useState<GroceryCategory | "all">("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Close delete confirmation when clicking anywhere outside
  useEffect(() => {
    if (confirmDeleteId === null) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-confirm-delete]")) return;
      setConfirmDeleteId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    const timer = setTimeout(() => setConfirmDeleteId(null), 4500);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      clearTimeout(timer);
    };
  }, [confirmDeleteId]);

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-pantry-search]")) return;
      setShowSuggestions(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Live auto-aisle detection
  const detectedCategory = newStapleName.trim()
    ? categorizeGroceryItem(newStapleName)
    : "spices_condiments";
  const detectedMeta = GROCERY_CATEGORIES.find((c) => c.id === detectedCategory) || GROCERY_CATEGORIES[0];

  // Suggestions filtered by current input
  const suggestions = useMemo(() => {
    const q = newStapleName.trim().toLowerCase();
    if (!q || q.length < 1) return [];
    return learnedVocab.filter((w) => w.toLowerCase().includes(q)).slice(0, 6);
  }, [newStapleName, learnedVocab]);

  const handleAddNewStaple = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newStapleName.trim();
    if (!clean) return;
    onAddItem(clean, detectedCategory);
    setNewStapleName("");
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (word: string) => {
    const cat = categorizeGroceryItem(word);
    onAddItem(word, cat);
    setNewStapleName("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleAddAllEssentials = () => {
    TEN_PANTRY_ESSENTIALS.forEach((item) => {
      const already = pantryItems.some(
        (p) => p.name.toLowerCase().trim() === item.name.toLowerCase().trim()
      );
      if (!already) {
        onAddItem(item.name, item.category);
      }
    });
  };

  // Group pantry items by aisle/category
  const visibleCategories = GROCERY_CATEGORIES.filter(
    (cat) => filterCategory === "all" || filterCategory === cat.id
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* QUICK ADD NEW STAPLE WITH AUTOMATIC AISLE DETECTION & SEARCH RECOMMENDATIONS */}
      <div className="rounded-[32px] border border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#121212] p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4 relative">
        <form onSubmit={handleAddNewStaple} className="flex flex-col sm:flex-row gap-3 relative">
          <div className="relative flex-1" data-pantry-search="true">
            <input
              ref={inputRef}
              type="text"
              value={newStapleName}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setNewStapleName(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Add pantry staple (e.g. Sriracha, Jasmine rice, Greek yogurt, Cinnamon)..."
              className="w-full rounded-[24px] border border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-black/40 px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 dark:text-stone-100 dark:placeholder-stone-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-white transition pr-36"
            />
            {newStapleName.trim() && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-stone-300 shadow-2xs">
                <GroceryCategoryIcon category={detectedCategory} className="h-3.5 w-3.5 text-slate-700 dark:text-stone-200" />
                <span>{detectedMeta.name.split("&")[0].trim()}</span>
              </span>
            )}

            {/* AUTOCOMPLETE SUGGESTIONS IN PANTRY VIEW */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-white/10 dark:bg-[#161616] shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-stone-300 border-b border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-white/5">
                  Recommended Pantry Staples
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-white/5 py-1">
                  {suggestions.map((word) => {
                    const detectedCat = categorizeGroceryItem(word);
                    const alreadyExists = pantryItems.some(
                      (p) => p.name.toLowerCase().trim() === word.toLowerCase().trim()
                    );

                    return (
                      <li
                        key={word}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
                        onClick={() => handleSelectSuggestion(word)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GroceryCategoryIcon category={detectedCat} className="h-4 w-4 text-slate-500 dark:text-stone-300 shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-stone-100 truncate">
                            {word}
                          </span>
                        </div>

                        <span className={`text-[11px] font-bold shrink-0 ${alreadyExists ? "text-slate-400 dark:text-stone-500" : "text-slate-900 dark:text-white"}`}>
                          {alreadyExists ? "In pantry" : "+ Add"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!newStapleName.trim()}
            className="rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border-amber-600/50 px-6 py-3.5 text-xs sm:text-sm font-bold shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
          >
            + Add to Pantry
          </button>
        </form>

        {/* CATEGORY FILTER CHIPS WITH SIGNATURE ACTIVE STYLING */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`rounded-full px-4 py-2 text-xs transition cursor-pointer ${
              filterCategory === "all"
                ? "bg-slate-900 text-white font-bold shadow-sm dark:bg-amber-500 dark:text-stone-950"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-stone-400 dark:hover:text-white font-semibold"
            }`}
          >
            All Staples ({pantryItems.length})
          </button>

          {GROCERY_CATEGORIES.map((cat) => {
            const count = pantryItems.filter((p) => p.category === cat.id).length;
            if (count === 0) return null;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs transition cursor-pointer ${
                  filterCategory === cat.id
                    ? "bg-slate-900 text-white font-bold shadow-sm dark:bg-amber-500 dark:text-stone-950"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-stone-400 dark:hover:text-white font-semibold"
                }`}
              >
                <GroceryCategoryIcon
                  category={cat.id}
                  className={`h-3.5 w-3.5 ${filterCategory === cat.id ? "text-white dark:text-stone-950" : "text-slate-600 dark:text-amber-500"}`}
                />
                <span>{cat.name.split("&")[0].trim()}</span>
                <span className="opacity-70 font-mono text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* EMPTY STATE IF NO PANTRY ITEMS */}
      {pantryItems.length === 0 && (
        <div className="rounded-[32px] border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#121212] p-10 text-center space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-stone-300 mx-auto">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-black text-slate-950 dark:text-white tracking-tight">
              Your pantry is empty
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-stone-400 leading-relaxed">
              Track staples you keep at home (oil, salt, garlic, eggs, pasta) so smart cooking and grocery features only add what you truly need.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleAddAllEssentials}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-gradient-to-b dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 dark:text-stone-950 dark:border dark:border-amber-600/50 px-6 py-3 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span>+ Add 10 Kitchen Essentials</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-white/5 max-w-lg mx-auto">
            <p className="text-[11px] font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider mb-2.5">
              Or tap individual staples:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {TEN_PANTRY_ESSENTIALS.map((essential) => (
                <button
                  key={essential.id}
                  type="button"
                  onClick={() => onAddItem(essential.name, essential.category)}
                  className="rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-stone-300 hover:bg-slate-900 hover:text-white hover:border-slate-900 dark:hover:bg-white dark:hover:text-slate-950 transition cursor-pointer shadow-2xs"
                >
                  +{essential.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PANTRY INVENTORY CATEGORIZED SHELVES */}
      <div className="space-y-6">
        {visibleCategories.map((cat) => {
          const itemsInCat = pantryItems.filter((p) => p.category === cat.id);
          if (itemsInCat.length === 0) return null;

          return (
            <div
              key={cat.id}
              style={{ contentVisibility: "auto", contain: "paint" }}
              className="rounded-[32px] border border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#121212] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/8 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white/10 dark:text-white shadow-xs">
                    <GroceryCategoryIcon category={cat.id} className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">{cat.name}</h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-stone-400">
                  {itemsInCat.filter((i) => i.inStock).length}/{itemsInCat.length} in stock
                </span>
              </div>

              {/* ITEMS CHIPS */}
              <div className="flex flex-wrap gap-2.5">
                {itemsInCat.map((item) => {
                  const cleanName = formatGroceryItemName(item.name);
                  return (
                    <div
                      key={item.id}
                      className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-150 select-none shadow-2xs ${
                        item.inStock
                          ? "border-emerald-500/40 bg-emerald-50 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300 hover:bg-emerald-100"
                          : "border-slate-200 bg-slate-100/70 text-slate-400 line-through hover:border-slate-300 hover:text-slate-700 dark:border-white/8 dark:bg-black/30 dark:text-stone-500"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleStock(item.id)}
                        className="cursor-pointer flex items-center gap-2"
                        title={item.inStock ? "Click to mark as running low (auto-adds to shopping list)" : "Click to mark as in stock"}
                      >
                        <span className={item.inStock ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-slate-400"}>
                          {item.inStock ? "✓" : "✕"}
                        </span>
                        <span>{cleanName}</span>
                      </button>

                      {/* INLINE CONFIRMATION FOR DELETION */}
                      {confirmDeleteId === item.id ? (
                        <div data-confirm-delete="true" className="flex items-center gap-1 ml-1 animate-in fade-in duration-100">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteItem(item.id);
                              setConfirmDeleteId(null);
                            }}
                            className="rounded-full bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 hover:bg-rose-700 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 dark:text-rose-300 dark:border dark:border-rose-500/30 transition cursor-pointer shadow-xs"
                            title="Confirm removal"
                          >
                            Delete?
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-stone-200 text-xs px-0.5 cursor-pointer"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="text-slate-400 hover:text-rose-600 dark:text-stone-500 dark:hover:text-rose-400 transition ml-1 text-xs cursor-pointer p-0.5"
                          title="Remove staple from pantry tracker"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
