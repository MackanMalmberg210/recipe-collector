"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  GROCERY_CATEGORIES,
  categorizeGroceryItem,
  type GroceryCategory,
  type StoredGroceryItem,
} from "../../lib/groceries";
import GroceryCategoryIcon from "./GroceryCategoryIcon";

type GroceryQuickAddProps = {
  onAddItem: (name: string, category?: GroceryCategory) => void;
  learnedVocab?: string[];
  currentItems?: StoredGroceryItem[];
};

const POPULAR_QUICK_STAPLES = [
  "Milk",
  "Eggs",
  "Butter",
  "Bananas",
  "Avocados",
  "Bread",
  "Coffee",
  "Olive oil",
  "Pasta",
  "Garlic",
  "Yellow onions",
  "Tomatoes",
];

export default function GroceryQuickAdd({
  onAddItem,
  learnedVocab = [],
  currentItems = [],
}: GroceryQuickAddProps) {
  const [text, setText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory | "auto">("auto");
  const [showAislePicker, setShowAislePicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const aislePickerRef = useRef<HTMLDivElement | null>(null);

  // Close aisle picker when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (aislePickerRef.current && !aislePickerRef.current.contains(e.target as Node)) {
        setShowAislePicker(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Compute live auto-categorization
  const autoCategory = useMemo(() => {
    if (!text.trim()) return "spices_condiments";
    return categorizeGroceryItem(text);
  }, [text]);

  const activeCategory = selectedCategory === "auto" ? autoCategory : selectedCategory;
  const activeCategoryMeta =
    GROCERY_CATEGORIES.find((c) => c.id === activeCategory) || GROCERY_CATEGORIES[0];

  // Suggestions filtered by current input
  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const matches = learnedVocab
      .filter((w) => w.toLowerCase().includes(q))
      .slice(0, 6);

    return matches;
  }, [text, learnedVocab]);

  // Set of existing lowercase names in current list
  const existingNames = useMemo(() => {
    return new Set(currentItems.map((i) => i.name.toLowerCase().trim()));
  }, [currentItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;

    if (selectedCategory === "auto") {
      onAddItem(clean);
    } else {
      onAddItem(clean, selectedCategory);
    }

    setText("");
    setShowSuggestions(false);
    setSelectedCategory("auto");
  };

  const handleSelectSuggestion = (word: string) => {
    if (selectedCategory === "auto") {
      onAddItem(word);
    } else {
      onAddItem(word, selectedCategory);
    }
    setText("");
    setShowSuggestions(false);
    setSelectedCategory("auto");
    inputRef.current?.focus();
  };

  const handleQuickAddStaple = (staple: string) => {
    onAddItem(staple);
  };

  return (
    <div className="space-y-3">
      {/* QUICK ADD FORM */}
      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <div className="relative flex-1 flex items-center">
          {/* SEARCH / INPUT ICON */}
          <div className="pointer-events-none absolute left-4 text-stone-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={text}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setText(e.target.value);
              setShowSuggestions(true);
            }}
            placeholder="Add items to your list (e.g. 2x Avocados, Oat milk, Feta cheese, Bread)..."
            className="w-full rounded-2xl border border-white/10 bg-[#16120f] py-3.5 pl-12 pr-28 sm:pr-32 text-sm text-stone-100 placeholder-stone-500 shadow-inner focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
          />

          {/* INLINE EMBEDDED AISLE BADGE & OVERRIDE PICKER */}
          <div className="absolute right-2.5 flex items-center gap-1.5" ref={aislePickerRef}>
            <button
              type="button"
              onClick={() => setShowAislePicker(!showAislePicker)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 text-xs font-bold text-stone-200 transition cursor-pointer shadow-xs"
              title="Click to select or change supermarket aisle"
            >
              {selectedCategory === "auto" ? (
                <svg className="h-3.5 w-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                </svg>
              ) : (
                <GroceryCategoryIcon category={selectedCategory} className="h-3.5 w-3.5 text-stone-300 shrink-0" />
              )}
              <span className="hidden sm:inline max-w-[85px] truncate font-medium text-stone-300">
                {selectedCategory === "auto" ? "Auto" : activeCategoryMeta.name.split("&")[0].trim()}
              </span>
              <span className="text-[9px] text-stone-400">▾</span>
            </button>

            {/* AISLE PICKER DROPDOWN */}
            {showAislePicker && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-2xl border border-amber-500/30 bg-[#1c1613] p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("auto");
                    setShowAislePicker(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition text-left cursor-pointer ${
                    selectedCategory === "auto"
                      ? "bg-amber-500 text-stone-950 font-black"
                      : "text-stone-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className={`h-3.5 w-3.5 ${selectedCategory === "auto" ? "text-stone-950" : "text-amber-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                    </svg>
                    <span>Auto-detect Aisle</span>
                  </div>
                  {selectedCategory === "auto" && <span>✓</span>}
                </button>

                <div className="pt-1 border-t border-white/8 space-y-0.5">
                  {GROCERY_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setShowAislePicker(false);
                      }}
                      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-bold transition text-left cursor-pointer ${
                        selectedCategory === cat.id
                          ? "bg-amber-500 text-stone-950 font-black"
                          : "text-stone-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <GroceryCategoryIcon
                        category={cat.id}
                        className={`h-3.5 w-3.5 ${selectedCategory === cat.id ? "text-stone-950" : "text-stone-300"}`}
                      />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* HIGH Z-INDEX AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-amber-500/30 bg-[#1b1512] shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-amber-400/80 border-b border-white/8 bg-white/2">
                Suggested Ingredients
              </div>
              <ul className="divide-y divide-white/5 py-1">
                {suggestions.map((word) => {
                  const inList = existingNames.has(word.toLowerCase());
                  const detectedCat = categorizeGroceryItem(word);

                  return (
                    <li
                      key={word}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-amber-400/10 transition cursor-pointer"
                      onClick={() => handleSelectSuggestion(word)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GroceryCategoryIcon category={detectedCat} className="h-4 w-4 text-stone-300 shrink-0" />
                        <span className={`text-xs sm:text-sm font-semibold truncate ${inList ? "text-stone-400 line-through" : "text-stone-100"}`}>
                          {word}
                        </span>
                      </div>

                      <span className={`text-[11px] font-bold shrink-0 ${inList ? "text-stone-500" : "text-amber-400"}`}>
                        {inList ? "✓ In list" : "+ Add"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-6 py-3.5 text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          Add
        </button>
      </form>

      {/* QUICK TAP STAPLES CHIPS (ORIGINAL CLEAN AESTHETIC RESTORED) */}
      <div className="flex items-center gap-2 pt-0.5 overflow-x-auto no-scrollbar pb-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 shrink-0 mr-0.5 select-none">
          Quick add:
        </span>

        {POPULAR_QUICK_STAPLES.map((staple) => (
          <button
            key={staple}
            type="button"
            onClick={() => handleQuickAddStaple(staple)}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 hover:border-amber-400/40 hover:bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-stone-300 hover:text-white transition whitespace-nowrap cursor-pointer shrink-0"
            title={`Add ${staple} to list`}
          >
            <span>+</span>
            <span>{staple}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
