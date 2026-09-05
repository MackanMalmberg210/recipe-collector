"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { GROCERY_LIST_KEY } from "../../lib/home";
import { getAllRecipesWithCloud } from "../../lib/recipes";
import { getPantryInventory, savePantryInventory, formatGroceryItemName, isSameGroceryItem } from "../../lib/groceries";

type GroceryItem = {
  name: string;
  bought: boolean;
};

const LEARNED_PANTRY_KEY = "recipe_learned_pantry_vocab";

const COMMON_PANTRY_SUGGESTIONS = [
  "Milk", "Oat milk", "Almond milk", "Eggs", "Butter", "Olive oil", "Avocado oil",
  "Garlic", "Yellow onions", "Red onions", "Scallions", "Lemons", "Limes",
  "Chicken breast", "Chicken thighs", "Ground beef", "Salmon fillets", "Bacon",
  "Feta cheese", "Parmesan cheese", "Cheddar cheese", "Heavy cream", "Greek yogurt",
  "Pasta", "Rice", "Panko breadcrumbs", "Flour", "Sugar", "Brown sugar", "Baking powder",
  "Soy sauce", "Sesame oil", "Gochujang sauce", "Dijon mustard", "Mayonnaise",
  "Kosher salt", "Black pepper", "Garlic powder", "Paprika", "Cumin", "Chili flakes",
  "Fresh parsley", "Fresh dill", "Fresh cilantro", "Fresh basil",
  "Spinach", "Tomatoes", "Canned diced tomatoes", "Avocados", "Bell peppers",
  "Coffee beans", "Tea", "Buns", "Bread", "Tortillas", "Apples", "Bananas", "Toothpaste", "Dish soap"
];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

export default function FloatingGroceryDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [learnedVocab, setLearnedVocab] = useState<string[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [pulseCount, setPulseCount] = useState<number | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Load items & learned vocabulary from localStorage
  const loadItems = () => {
    try {
      const stored = localStorage.getItem(GROCERY_LIST_KEY);
      if (stored) {
        setItems(JSON.parse(stored) as GroceryItem[]);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
  };

  const loadLearnedVocab = () => {
    try {
      const stored = localStorage.getItem(LEARNED_PANTRY_KEY);
      if (stored) {
        setLearnedVocab(JSON.parse(stored) as string[]);
      }
    } catch {
      setLearnedVocab([]);
    }
  };

  useEffect(() => {
    loadItems();
    loadLearnedVocab();

    // Extract ingredients from recipes to enrich suggestions
    getAllRecipesWithCloud()
      .then((recipes) => {
        if (!Array.isArray(recipes)) return;
        const allIngs = new Set<string>();
        const AMOUNT_PREFIX_REGEX = /^\d+[\d\s\/\.]*\s*(?:tbsp|tsp|cup|c\.|oz|lb|g|kg|ml|slices|cloves)?\.?\s*/i;
        recipes.forEach((r) => {
          (r.ingredients || []).forEach((ing) => {
            const cleaned = ing.replace(AMOUNT_PREFIX_REGEX, "").trim();
            if (cleaned.length > 2 && cleaned.length < 35) {
              allIngs.add(formatGroceryItemName(cleaned));
            }
          });
        });
        setRecipeIngredients(Array.from(allIngs));
      })
      .catch(() => {});

    const handleStorage = (e: Event) => {
      const storageEvent = e as StorageEvent;
      if (!storageEvent.key || storageEvent.key === GROCERY_LIST_KEY) {
        loadItems();
      }
      if (!storageEvent.key || storageEvent.key === LEARNED_PANTRY_KEY) {
        loadLearnedVocab();
      }
    };

    const handleCustomChange = () => {
      loadItems();
      loadLearnedVocab();
    };

    const handleCustomAdd = (e: Event) => {
      const customEvent = e as CustomEvent<{ count?: number }>;
      const addedCount = customEvent.detail?.count || 1;
      loadItems();
      loadLearnedVocab();

      // Trigger crisp pulse animation
      setPulseCount(addedCount);
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 300);
      setTimeout(() => setPulseCount(null), 1800);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("grocery_items_changed", handleCustomChange);
    window.addEventListener("grocery_items_updated", handleCustomAdd);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("grocery_items_changed", handleCustomChange);
      window.removeEventListener("grocery_items_updated", handleCustomAdd);
    };
  }, []);

  const saveItems = (updated: GroceryItem[]) => {
    setItems(updated);
    localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  };

  const saveLearnedWord = (word: string) => {
    const formatted = formatGroceryItemName(word.trim());
    if (!formatted || formatted.length < 2) return;

    let existingStored: string[] = [];
    try {
      const raw = localStorage.getItem(LEARNED_PANTRY_KEY);
      if (raw) existingStored = JSON.parse(raw) as string[];
    } catch {}

    const updated = Array.from(new Set([formatted, ...existingStored, ...learnedVocab]));
    setLearnedVocab(updated);
    try {
      localStorage.setItem(LEARNED_PANTRY_KEY, JSON.stringify(updated.slice(0, 300)));
    } catch {}
  };

  const removeLearnedWord = (word: string) => {
    const norm = normalize(word);
    const updated = learnedVocab.filter((w) => normalize(w) !== norm);
    setLearnedVocab(updated);
    try {
      localStorage.setItem(LEARNED_PANTRY_KEY, JSON.stringify(updated));
    } catch {}
  };

  const toggleBought = (index: number) => {
    const target = items[index];
    const willBeBought = target ? !target.bought : false;
    const updated = items.map((item, i) =>
      i === index ? { ...item, bought: !item.bought } : item,
    );
    saveItems(updated);

    if (willBeBought && target) {
      try {
        const pantry = getPantryInventory();
        const match = pantry.find(
          (p) => p.name.toLowerCase().trim() === target.name.toLowerCase().trim() && !p.inStock
        );
        if (match) {
          const updatedPantry = pantry.map((p) =>
            p.id === match.id ? { ...p, inStock: true } : p
          );
          savePantryInventory(updatedPantry);
        }
      } catch {}
    }
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    saveItems(updated);
  };

  const addItemWithName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Automatically capitalize the first letter using Unicode
    const formatted = formatGroceryItemName(trimmed);

    // Immediately save word to learned vocabulary dictionary
    saveLearnedWord(formatted);

    const exists = items.some((item) => isSameGroceryItem(item.name, formatted));
    if (exists) {
      setNewItemText("");
      setShowSuggestions(false);
      return;
    }

    const updated = [...items, { name: formatted, bought: false }];
    saveItems(updated);
    setNewItemText("");
    setShowSuggestions(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    addItemWithName(newItemText);
  };

  const handleClearCompleted = () => {
    const updated = items.filter((item) => !item.bought);
    saveItems(updated);
  };

  const handleClearAll = () => {
    saveItems([]);
  };

  const handleCopyList = () => {
    const unbought = items.filter((i) => !i.bought).map((i) => `• ${i.name}`).join("\n");
    const bought = items.filter((i) => i.bought).map((i) => `✓ ${i.name}`).join("\n");
    const fullText = `🛒 GROCERY LIST\n\n${unbought}${bought ? `\n\nAlready Bought:\n${bought}` : ""}`;
    navigator.clipboard.writeText(fullText);
  };

  // Smart Autocomplete Suggestions with Exact Prefix Prioritization
  const suggestions = useMemo(() => {
    const query = newItemText.trim().toLowerCase();
    if (query.length < 1) return [];

    const existingItemNames = new Set(items.map((i) => normalize(i.name)));
    const learnedSet = new Set(learnedVocab.map((w) => normalize(w)));

    const allSources = [
      ...learnedVocab,           // Tier 1: User's learned words
      ...recipeIngredients,       // Tier 2: Recipe ingredients
      ...COMMON_PANTRY_SUGGESTIONS // Tier 3: Common essentials
    ];

    const seen = new Set<string>();
    const prefixMatches: { word: string; inList: boolean; isCustom: boolean }[] = [];
    const containsMatches: { word: string; inList: boolean; isCustom: boolean }[] = [];

    for (const word of allSources) {
      const norm = normalize(word);
      if (seen.has(norm)) continue;
      seen.add(norm);

      const inList = existingItemNames.has(norm);
      const isCustom = learnedSet.has(norm);

      if (norm.startsWith(query)) {
        prefixMatches.push({ word, inList, isCustom });
      } else if (norm.includes(query)) {
        containsMatches.push({ word, inList, isCustom });
      }
    }

    // Sort: prefix matches first, items not currently in the active list prioritized
    const combined = [...prefixMatches, ...containsMatches];
    combined.sort((a, b) => {
      if (a.inList !== b.inList) return a.inList ? 1 : -1;
      return 0;
    });

    return combined.slice(0, 6);
  }, [newItemText, items, learnedVocab, recipeIngredients]);

  // Sort: 1) Unchecked first, 2) Alphabetical A-Z
  const sortedItems = useMemo(() => {
    return items
      .map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => {
        if (a.item.bought !== b.item.bought) {
          return a.item.bought ? 1 : -1;
        }
        return a.item.name.localeCompare(b.item.name, "sv", { sensitivity: "base" });
      });
  }, [items]);

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

  const remainingCount = items.filter((item) => !item.bought).length;
  const boughtCount = items.filter((item) => item.bought).length;

  return (
    <>
      {/* FLOATING QUICK TRIGGER BUTTON (Ultra-snappy 100ms hover) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className={`group relative flex items-center gap-2.5 rounded-full border px-4 py-2.5 shadow-2xl backdrop-blur-md transition-all duration-100 cursor-pointer ${
            isPulsing
              ? "scale-105 border-amber-400 bg-amber-500 text-stone-950 shadow-amber-400/30"
              : "border-white/12 bg-[#1a1410]/95 text-stone-100 shadow-black/70 hover:scale-105 hover:border-amber-400/40 hover:bg-[#231b15]"
          }`}
          title="Open Grocery List"
        >
          <svg className="h-4 w-4 text-stone-100 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          
          <span className="text-xs font-bold tracking-tight">
            Grocery List
          </span>

          {items.length > 0 && (
            <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-extrabold transition-colors duration-100 ${
              isPulsing
                ? "bg-stone-950 text-amber-300"
                : "bg-amber-500 text-stone-950 shadow-sm"
            }`}>
              {remainingCount}
            </span>
          )}

          {/* CRISP +X POP BADGE */}
          {pulseCount !== null && (
            <span className="absolute -top-2.5 -right-1.5 flex h-5.5 items-center justify-center rounded-full bg-emerald-400 px-2 text-[11px] font-black text-stone-950 shadow-md border border-stone-950">
              +{pulseCount}
            </span>
          )}
        </button>
      </div>

      {/* SLIDE-OVER DRAWER OVERLAY */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-150 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* BACKDROP */}
        <div
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-black/70 transition-opacity duration-150 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* DRAWER PANEL */}
        <aside
          className={`drawer-spring-transition absolute right-0 top-0 bottom-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#15110e] text-stone-100 shadow-2xl ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
        >
          {/* DRAWER HEADER */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6 bg-[#1a1511]">
            <div className="flex items-center gap-2.5">
              <svg className="h-5 w-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <h2 className="text-base font-bold text-[#fff8ef]">
                  Grocery List
                </h2>
                <p className="text-[11px] text-stone-400">
                  {remainingCount} to buy {boughtCount > 0 ? `• ${boughtCount} checked` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/groceries"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-stone-300 hover:bg-white/10 hover:text-amber-300 transition-colors duration-100 cursor-pointer text-xs font-bold"
                title="Open full-page grocery manager"
              >
                ↗
              </Link>

              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyList}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white transition-colors duration-100 cursor-pointer text-xs"
                  title="Copy to clipboard"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-stone-400 hover:bg-white/15 hover:text-white transition-colors duration-100 cursor-pointer text-xs font-bold"
                title="Close Drawer"
              >
                ✕
              </button>
            </div>
          </header>

          {/* QUICK ADD WITH SELF-LEARNING SUGGESTIONS & FORGET OPTION */}
          <div className="relative border-b border-white/8 p-4 bg-[#1a1410]/50">
            <form onSubmit={handleAddItem} className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newItemText}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setNewItemText(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Add item (e.g. Milk, Toothpaste, Coffee)..."
                className="flex-1 rounded-2xl border border-white/10 bg-[#221b16] px-4 py-2.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none transition-colors duration-100"
              />
              <button
                type="submit"
                disabled={!newItemText.trim()}
                className="rounded-2xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-600 transition-colors duration-100 cursor-pointer disabled:opacity-40 shadow-sm"
              >
                Add
              </button>
            </form>

            {/* CLEAN AUTOCOMPLETE SUGGESTIONS (With quick 'Forget / ✕' for misspelled words) */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-4 right-4 top-[calc(100%-4px)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#201813] shadow-xl">
                <ul className="divide-y divide-white/5 py-0.5">
                  {suggestions.map((item) => (
                    <li
                      key={item.word}
                      className="group/item flex items-center justify-between hover:bg-amber-400/10 transition-colors duration-100 px-3 py-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => addItemWithName(item.word)}
                        className="flex-1 text-left text-xs font-medium text-stone-200 hover:text-amber-300 transition-colors duration-100 cursor-pointer py-1"
                      >
                        <span className={item.inList ? "text-stone-400" : "text-stone-100 font-semibold"}>
                          {item.word}
                        </span>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] ${item.inList ? "text-stone-500" : "text-amber-400 font-semibold"}`}>
                          {item.inList ? "✓ In list" : "+ Add"}
                        </span>

                        {/* DELETE / FORGET BUTTON FOR LEARNED WORDS */}
                        {item.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeLearnedWord(item.word);
                            }}
                            className="text-stone-500 hover:text-rose-400 transition-colors duration-100 cursor-pointer text-xs p-1 rounded hover:bg-white/5"
                            title="Remove word from learned suggestions"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ITEMS CHECKLIST */}
          <div
            style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
            className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain"
          >
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 text-center">
                <span className="text-3xl mb-2 text-stone-600">🧺</span>
                <h3 className="text-sm font-bold text-stone-300">
                  Your grocery list is empty
                </h3>
                <p className="mt-1 text-xs text-stone-500 max-w-xs leading-relaxed">
                  Add ingredients from recipes, plan your week, or pick suggested items above!
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {sortedItems.map(({ item, originalIndex }) => (
                  <li
                    key={`${item.name}-${originalIndex}`}
                    style={{
                      contentVisibility: "auto",
                      containIntrinsicSize: "0 52px",
                      contain: "paint",
                    }}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border p-3 ${
                      item.bought
                        ? "border-emerald-500/15 bg-emerald-500/5 opacity-60"
                        : "border-white/8 bg-[#1e1713]/90 hover:bg-[#251d18] hover:border-amber-400/25 shadow-xs"
                    }`}
                  >
                    <label className="flex flex-1 items-center gap-3 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={item.bought}
                        onChange={() => toggleBought(originalIndex)}
                        className="h-4 w-4 shrink-0 accent-emerald-400 cursor-pointer"
                      />
                      <span
                        className={`truncate text-xs sm:text-sm font-medium ${
                          item.bought
                            ? "text-emerald-200 line-through"
                            : "text-stone-100"
                        }`}
                      >
                        {item.name}
                      </span>
                    </label>

                    {confirmDeleteIndex === originalIndex ? (
                      <div data-confirm-delete="true" className="flex items-center gap-1 shrink-0 animate-in fade-in duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            removeItem(originalIndex);
                            setConfirmDeleteIndex(null);
                          }}
                          className="rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-bold px-1.5 py-0.5 hover:bg-rose-500/30 transition cursor-pointer"
                          title="Confirm removal"
                        >
                          Delete?
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteIndex(null)}
                          className="text-stone-400 hover:text-stone-200 text-xs px-0.5 cursor-pointer"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIndex(originalIndex)}
                        className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 transition-colors duration-100 cursor-pointer text-xs p-1"
                        title="Delete item"
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* DRAWER FOOTER */}
          {items.length > 0 && (
            <footer className="border-t border-white/10 p-4 bg-[#1a1511] flex items-center justify-between gap-3">
              {boughtCount > 0 ? (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="text-xs font-semibold text-stone-400 hover:text-stone-200 transition-colors duration-100 cursor-pointer"
                >
                  Clear {boughtCount} checked
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-rose-400/80 hover:text-rose-300 transition-colors duration-100 cursor-pointer"
                >
                  Clear all
                </button>
              )}

              <span className="text-[11px] text-stone-500">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </footer>
          )}
        </aside>
      </div>
    </>
  );
}
