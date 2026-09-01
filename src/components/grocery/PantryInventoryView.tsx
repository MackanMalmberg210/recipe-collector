"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  GROCERY_CATEGORIES,
  categorizeGroceryItem,
  type PantryItem,
  type GroceryCategory,
  formatGroceryItemName,
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

  // Group pantry items by aisle/category
  const visibleCategories = GROCERY_CATEGORIES.filter(
    (cat) => filterCategory === "all" || filterCategory === cat.id
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* QUICK ADD NEW STAPLE WITH AUTOMATIC AISLE DETECTION & SEARCH RECOMMENDATIONS */}
      <div className="rounded-3xl border border-white/10 bg-[#16120f] p-4 sm:p-5 shadow-lg space-y-3 relative">
        <form onSubmit={handleAddNewStaple} className="flex flex-col sm:flex-row gap-2.5 relative">
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
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none transition pr-36"
            />
            {newStapleName.trim() && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-[11px] font-bold text-stone-300">
                <GroceryCategoryIcon category={detectedCategory} className="h-3.5 w-3.5 text-stone-300" />
                <span>{detectedMeta.name.split("&")[0].trim()}</span>
              </span>
            )}

            {/* AUTOCOMPLETE SUGGESTIONS IN PANTRY VIEW */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-amber-500/30 bg-[#1b1512] shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-amber-400/80 border-b border-white/8 bg-white/2">
                  Recommended Pantry Staples
                </div>
                <ul className="divide-y divide-white/5 py-1">
                  {suggestions.map((word) => {
                    const detectedCat = categorizeGroceryItem(word);
                    const alreadyExists = pantryItems.some(
                      (p) => p.name.toLowerCase().trim() === word.toLowerCase().trim()
                    );

                    return (
                      <li
                        key={word}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-amber-400/10 transition cursor-pointer"
                        onClick={() => handleSelectSuggestion(word)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <GroceryCategoryIcon category={detectedCat} className="h-4 w-4 text-stone-300 shrink-0" />
                          <span className="text-xs sm:text-sm font-semibold text-stone-100 truncate">
                            {word}
                          </span>
                        </div>

                        <span className={`text-[11px] font-bold shrink-0 ${alreadyExists ? "text-stone-500" : "text-amber-400"}`}>
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
            className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-6 py-3 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-150 active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
          >
            + Add to Pantry
          </button>
        </form>

        {/* CATEGORY FILTER CHIPS WITH SIGNATURE ACTIVE STYLING */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs transition cursor-pointer ${
              filterCategory === "all"
                ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 dark:border-amber-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)]"
                : "bg-white/5 text-stone-400 hover:text-white border border-transparent font-medium"
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
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition cursor-pointer ${
                  filterCategory === cat.id
                    ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 dark:border-amber-600/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)]"
                    : "bg-white/5 text-stone-400 hover:text-white border border-transparent font-medium"
                }`}
              >
                <GroceryCategoryIcon
                  category={cat.id}
                  className={`h-3.5 w-3.5 ${filterCategory === cat.id ? "text-stone-950" : "text-stone-400"}`}
                />
                <span>{cat.name.split("&")[0].trim()}</span>
                <span className="opacity-70 font-mono text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PANTRY INVENTORY CATEGORIZED SHELVES */}
      <div className="space-y-6">
        {visibleCategories.map((cat) => {
          const itemsInCat = pantryItems.filter((p) => p.category === cat.id);
          if (itemsInCat.length === 0) return null;

          return (
            <div
              key={cat.id}
              style={{ contentVisibility: "auto", contain: "paint" }}
              className="rounded-3xl border border-white/10 bg-[#16120f] p-5 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-stone-200">
                    <GroceryCategoryIcon category={cat.id} className="h-4 w-4 text-stone-200" />
                  </div>
                  <h3 className="text-sm font-extrabold text-[#fff8ef]">{cat.name}</h3>
                </div>
                <span className="text-xs font-mono text-stone-400">
                  {itemsInCat.filter((i) => i.inStock).length}/{itemsInCat.length} in stock
                </span>
              </div>

              {/* ITEMS CHIPS */}
              <div className="flex flex-wrap gap-2">
                {itemsInCat.map((item) => {
                  const cleanName = formatGroceryItemName(item.name);
                  return (
                    <div
                      key={item.id}
                      className={`group inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold transition-all duration-150 select-none ${
                        item.inStock
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                          : "border-stone-700/60 bg-stone-900/60 text-stone-400 line-through hover:border-amber-400/40 hover:text-stone-200"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleStock(item.id)}
                        className="cursor-pointer flex items-center gap-1.5"
                        title={item.inStock ? "Click to mark as running low (auto-adds to shopping list)" : "Click to mark as in stock"}
                      >
                        <span>{item.inStock ? "✓" : "✕"}</span>
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
                            className="rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-bold px-1.5 py-0.5 hover:bg-rose-500/30 transition cursor-pointer"
                            title="Confirm removal"
                          >
                            Delete?
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-stone-400 hover:text-stone-200 text-xs px-0.5 cursor-pointer"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="text-stone-500 hover:text-rose-400 transition ml-1 text-xs cursor-pointer p-0.5"
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
