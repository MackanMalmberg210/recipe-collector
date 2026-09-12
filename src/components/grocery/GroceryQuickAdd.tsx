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
          <div className="pointer-events-none absolute left-4 text-slate-400 dark:text-stone-500">
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
            className="w-full rounded-[24px] border border-slate-200 bg-white py-3.5 pl-12 pr-32 text-sm text-slate-950 placeholder-slate-400 dark:border-white/10 dark:bg-[#121212] dark:text-stone-100 dark:placeholder-stone-500 shadow-[0_4px_20px_rgb(0,0,0,0.03)] focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:border-white dark:focus:ring-white/10 transition"
          />

          {/* INLINE EMBEDDED AISLE BADGE & OVERRIDE PICKER */}
          <div className="absolute right-2.5 flex items-center gap-1.5" ref={aislePickerRef}>
            <button
              type="button"
              onClick={() => setShowAislePicker(!showAislePicker)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 transition cursor-pointer shadow-xs"
              title="Click to select or change supermarket aisle"
            >
              <GroceryCategoryIcon category={activeCategory} className="h-3.5 w-3.5 text-slate-700 dark:text-stone-200" />
              <span className="hidden sm:inline">{activeCategoryMeta.name.split("&")[0].trim()}</span>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>

            {/* AISLE PICKER DROPDOWN */}
            {showAislePicker && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 rounded-[24px] border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#161616] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("auto");
                    setShowAislePicker(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition text-left cursor-pointer ${
                    selectedCategory === "auto" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs" : "text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span>Auto-detect aisle</span>
                  {selectedCategory === "auto" && <span>✓</span>}
                </button>

                {/* DIVIDER */}
                <div className="my-1 border-t border-slate-100 dark:border-white/5" />

                <div className="space-y-0.5">
                  {GROCERY_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setShowAislePicker(false);
                      }}
                      className={`w-full flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition text-left cursor-pointer ${
                        selectedCategory === cat.id
                          ? "bg-slate-900 text-white font-bold dark:bg-white dark:text-slate-950 shadow-xs"
                          : "text-slate-700 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <GroceryCategoryIcon
                        category={cat.id}
                        className={`h-3.5 w-3.5 ${selectedCategory === cat.id ? "text-white dark:text-slate-950" : "text-slate-600 dark:text-stone-400"}`}
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
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[24px] border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-white/10 dark:bg-[#161616] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-stone-300 border-b border-slate-100 dark:border-white/8">
                Suggested Ingredients
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-white/5 py-1">
                {suggestions.map((word) => {
                  const inList = existingNames.has(word.toLowerCase());
                  const detectedCat = categorizeGroceryItem(word);

                  return (
                    <li
                      key={word}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition cursor-pointer"
                      onClick={() => handleSelectSuggestion(word)}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GroceryCategoryIcon category={detectedCat} className="h-4 w-4 text-slate-500 dark:text-stone-300 shrink-0" />
                        <span className={`text-xs sm:text-sm font-semibold truncate ${inList ? "text-slate-400 line-through" : "text-slate-800 dark:text-stone-100"}`}>
                          {word}
                        </span>
                      </div>

                      <span className={`text-[11px] font-bold shrink-0 ${inList ? "text-slate-400 dark:text-stone-500" : "text-slate-900 dark:text-white"}`}>
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
          className="rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white dark:hover:bg-slate-100 px-7 py-3.5 text-sm font-bold shadow-sm transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        >
          Add
        </button>
      </form>

      {/* QUICK TAP STAPLES CHIPS */}
      <div className="flex items-center gap-2 pt-0.5 overflow-x-auto no-scrollbar pb-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-stone-500 shrink-0 mr-0.5 select-none">
          Quick add:
        </span>

        {POPULAR_QUICK_STAPLES.map((staple) => (
          <button
            key={staple}
            type="button"
            onClick={() => handleQuickAddStaple(staple)}
            className="shrink-0 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 shadow-2xs dark:border-white/10 dark:bg-[#121212] dark:text-stone-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-950 transition-all cursor-pointer"
          >
            <span>+</span>
            <span>{staple}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
