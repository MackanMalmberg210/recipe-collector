"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { GROCERY_LIST_KEY } from "../../lib/home";
import { getAllRecipesWithCloud } from "../../lib/recipes";
import { useToast } from "../../components/ui/ToastProvider";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ChefVisionStudio from "../../components/vision/ChefVisionStudio";
import {
  GROCERY_CATEGORIES,
  categorizeGroceryItem,
  saveLearnedCategory,
  COMMON_PANTRY_STAPLES,
  GROCERY_CUSTOM_LISTS_KEY,
  type GroceryCategory,
  type GroceryListCollection,
  type StoredGroceryItem,
} from "../../lib/groceries";

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
  "Coffee beans", "Tea", "Buns", "Bread", "Tortillas", "Apples", "Bananas",
  "Dish washer tablets", "Dish soap", "Toothpaste", "Laundry detergent"
];

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function formatGroceryItemName(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return "";
  const chars = Array.from(trimmed);
  return chars[0].toLocaleUpperCase("sv-SE") + chars.slice(1).join("");
}

export default function GroceriesPage() {
  const { success, info } = useToast();
  const [activeListId, setActiveListId] = useState<string>("main");
  const [mainListItems, setMainListItems] = useState<StoredGroceryItem[]>([]);
  const [customLists, setCustomLists] = useState<GroceryListCollection[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Input & suggestion state
  const [newItemText, setNewItemText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GroceryCategory | "auto">("auto");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [learnedVocab, setLearnedVocab] = useState<string[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // View state
  const [groupByAisle, setGroupByAisle] = useState(true);
  const [isStoreMode, setIsStoreMode] = useState(false);
  const [showCompleted, setShowCompleted] = useState<Record<string, boolean>>({});
  const [isPantryBannerDismissed, setIsPantryBannerDismissed] = useState(false);
  const [animatingQtyIndex, setAnimatingQtyIndex] = useState<{ index: number; delta: number } | null>(null);

  // Modals
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Load state from storage
  const loadData = () => {
    try {
      const storedMain = localStorage.getItem(GROCERY_LIST_KEY);
      if (storedMain) {
        const parsed = JSON.parse(storedMain) as StoredGroceryItem[];
        const enriched = parsed.map((item) => ({
          ...item,
          quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
          category: item.category || categorizeGroceryItem(item.name),
        }));
        setMainListItems(enriched);
      } else {
        setMainListItems([]);
      }

      const storedCustom = localStorage.getItem(GROCERY_CUSTOM_LISTS_KEY);
      if (storedCustom) {
        const parsedCustom = JSON.parse(storedCustom) as GroceryListCollection[];
        const enrichedCustom = parsedCustom.map((col) => ({
          ...col,
          items: col.items.map((item) => ({
            ...item,
            quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
            category: item.category || categorizeGroceryItem(item.name),
          })),
        }));
        setCustomLists(enrichedCustom);
      } else {
        setCustomLists([]);
      }

      const storedVocab = localStorage.getItem(LEARNED_PANTRY_KEY);
      if (storedVocab) {
        setLearnedVocab(JSON.parse(storedVocab) as string[]);
      }
    } catch {
      setMainListItems([]);
    }
  };

  useEffect(() => {
    loadData();

    getAllRecipesWithCloud().then((recipes) => {
      const allIngs = new Set<string>();
      recipes.forEach((r) => {
        r.ingredients.forEach((ing) => {
          const cleaned = ing.replace(/^\d+[\d\s\/\.]*\s*(?:tbsp|tsp|cup|c\.|oz|lb|g|kg|ml|slices|cloves)?\.?\s*/i, "").trim();
          if (cleaned.length > 2 && cleaned.length < 35) {
            allIngs.add(formatGroceryItemName(cleaned));
          }
        });
      });
      setRecipeIngredients(Array.from(allIngs));
    });

    setHasHydrated(true);

    const handleStorage = () => loadData();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("grocery_items_updated", handleStorage);
    window.addEventListener("grocery_items_changed", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("grocery_items_updated", handleStorage);
      window.removeEventListener("grocery_items_changed", handleStorage);
    };
  }, []);

  // Active items reference
  const currentItems = useMemo(() => {
    if (activeListId === "main") {
      return mainListItems;
    }
    const found = customLists.find((l) => l.id === activeListId);
    return found ? found.items : [];
  }, [activeListId, mainListItems, customLists]);

  const activeListName = useMemo(() => {
    if (activeListId === "main") return "Main Grocery List";
    const found = customLists.find((l) => l.id === activeListId);
    return found ? found.name : "Custom List";
  }, [activeListId, customLists]);

  // Detected un-bought pantry staples
  const detectedPantryStaples = useMemo(() => {
    return currentItems.filter((item) => {
      if (item.bought) return false;
      const norm = normalize(item.name);
      return COMMON_PANTRY_STAPLES.some((staple) => norm.includes(staple));
    });
  }, [currentItems]);

  // Save current list with precise event dispatching
  const updateCurrentListItems = (updated: StoredGroceryItem[], addedSingleItem = false) => {
    if (activeListId === "main") {
      setMainListItems(updated);
      localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("grocery_items_changed"));
      if (addedSingleItem) {
        window.dispatchEvent(new CustomEvent("grocery_items_updated", { detail: { count: 1 } }));
      }
    } else {
      const nextCustom = customLists.map((l) =>
        l.id === activeListId ? { ...l, items: updated } : l
      );
      setCustomLists(nextCustom);
      localStorage.setItem(GROCERY_CUSTOM_LISTS_KEY, JSON.stringify(nextCustom));
    }
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

  const handleAddItem = (nameToAdd?: string) => {
    const target = nameToAdd || newItemText;
    const trimmed = target.trim();
    if (!trimmed) return;

    let parsedQty = 1;
    let cleanName = trimmed;
    const qtyMatch = trimmed.match(/^(\d+)\s*(?:x|\*|\s)\s*(.*)$/i);
    if (qtyMatch) {
      parsedQty = parseInt(qtyMatch[1], 10) || 1;
      cleanName = qtyMatch[2].trim();
    }

    const formatted = formatGroceryItemName(cleanName);
    const category = selectedCategory === "auto" ? categorizeGroceryItem(formatted) : selectedCategory;

    if (selectedCategory !== "auto") {
      saveLearnedCategory(formatted, selectedCategory);
    }

    saveLearnedWord(formatted);

    const existsIndex = currentItems.findIndex((i) => normalize(i.name) === normalize(formatted));
    if (existsIndex >= 0) {
      const updated = currentItems.map((item, idx) =>
        idx === existsIndex
          ? { ...item, quantity: (item.quantity || 1) + parsedQty, bought: false }
          : item
      );
      updateCurrentListItems(updated);
      info(`Increased quantity of "${formatted}" (+${parsedQty}).`);
      setNewItemText("");
      setShowSuggestions(false);
      return;
    }

    const newItem: StoredGroceryItem = {
      name: formatted,
      quantity: parsedQty,
      category,
      bought: false,
    };

    updateCurrentListItems([...currentItems, newItem], true);
    setNewItemText("");
    setShowSuggestions(false);
    setSelectedCategory("auto");
    success(`Added ${formatted}! 🛒`);
  };

  const toggleBought = (index: number) => {
    const updated = currentItems.map((item, i) =>
      i === index ? { ...item, bought: !item.bought } : item
    );
    updateCurrentListItems(updated);
  };

  const updateQuantity = (index: number, delta: number) => {
    const item = currentItems[index];
    if (!item) return;

    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) {
      removeItem(index);
      return;
    }

    // Trigger visual pulse animation
    setAnimatingQtyIndex({ index, delta });
    setTimeout(() => setAnimatingQtyIndex(null), 350);

    const updated = currentItems.map((it, i) =>
      i === index ? { ...it, quantity: newQty } : it
    );
    updateCurrentListItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = currentItems.filter((_, i) => i !== index);
    updateCurrentListItems(updated);
  };

  const handleClearCompleted = () => {
    const updated = currentItems.filter((item) => !item.bought);
    updateCurrentListItems(updated);
    success("Cleared purchased items.");
  };

  const handleConfirmClearAll = () => {
    updateCurrentListItems([]);
    setIsClearModalOpen(false);
    success("Cleared all items in this list.");
  };

  // Pantry Check: Mark all detected pantry staples as bought
  const handlePantryCheck = () => {
    let matchedCount = 0;
    const updated = currentItems.map((item) => {
      const norm = normalize(item.name);
      const isStaple = COMMON_PANTRY_STAPLES.some((staple) => norm.includes(staple));
      if (isStaple && !item.bought) {
        matchedCount++;
        return { ...item, bought: true };
      }
      return item;
    });

    if (matchedCount === 0) {
      info("No un-bought pantry staples found in this list.");
    } else {
      updateCurrentListItems(updated);
      setIsPantryBannerDismissed(true);
      success(`Checked off ${matchedCount} pantry staples in your kitchen! 🧂`);
    }
  };

  const handleCreateNewList = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;

    const newList: GroceryListCollection = {
      id: `list-${Date.now()}`,
      name: formatGroceryItemName(trimmed),
      createdAt: Date.now(),
      items: [],
    };

    const nextCustom = [...customLists, newList];
    setCustomLists(nextCustom);
    localStorage.setItem(GROCERY_CUSTOM_LISTS_KEY, JSON.stringify(nextCustom));
    setActiveListId(newList.id);
    setNewListName("");
    setIsNewListModalOpen(false);
    success(`Created "${newList.name}"! 📋`);
  };

  const handleDeleteCurrentCustomList = () => {
    if (activeListId === "main") return;
    const nextCustom = customLists.filter((l) => l.id !== activeListId);
    setCustomLists(nextCustom);
    localStorage.setItem(GROCERY_CUSTOM_LISTS_KEY, JSON.stringify(nextCustom));
    setActiveListId("main");
    info("Custom list deleted.");
  };

  const handleCopyForExport = () => {
    const unbought = currentItems
      .filter((i) => !i.bought)
      .map((i) => `• ${(i.quantity || 1) > 1 ? `${i.quantity}x ` : ""}${i.name}`)
      .join("\n");
    const bought = currentItems
      .filter((i) => i.bought)
      .map((i) => `✓ ${(i.quantity || 1) > 1 ? `${i.quantity}x ` : ""}${i.name}`)
      .join("\n");
    const fullText = `🛒 ${activeListName.toUpperCase()}\n\n${unbought}${bought ? `\n\nAlready Bought:\n${bought}` : ""}`;
    navigator.clipboard.writeText(fullText);
    success("Copied grocery list to clipboard! 📋");
  };

  // Autocomplete Suggestions
  const suggestions = useMemo(() => {
    const query = newItemText.trim().toLowerCase();
    if (query.length < 1) return [];

    const existingNames = new Set(currentItems.map((i) => normalize(i.name)));
    const learnedSet = new Set(learnedVocab.map((w) => normalize(w)));

    const allSources = [
      ...learnedVocab,
      ...recipeIngredients,
      ...COMMON_PANTRY_SUGGESTIONS,
    ];

    const seen = new Set<string>();
    const matches: { word: string; inList: boolean; isCustom: boolean }[] = [];

    for (const word of allSources) {
      const norm = normalize(word);
      if (seen.has(norm)) continue;
      seen.add(norm);

      if (norm.startsWith(query) || norm.includes(query)) {
        matches.push({
          word,
          inList: existingNames.has(norm),
          isCustom: learnedSet.has(norm),
        });
        if (matches.length >= 6) break;
      }
    }

    return matches;
  }, [newItemText, currentItems, learnedVocab, recipeIngredients]);

  // Group items by category (splitting into active & checked)
  const categorizedGroups = useMemo(() => {
    const groups: Record<
      GroceryCategory,
      { active: { item: StoredGroceryItem; originalIndex: number }[]; checked: { item: StoredGroceryItem; originalIndex: number }[] }
    > = {
      produce: { active: [], checked: [] },
      meat_seafood: { active: [], checked: [] },
      dairy_fridge: { active: [], checked: [] },
      bakery_grains: { active: [], checked: [] },
      spices_condiments: { active: [], checked: [] },
      beverages: { active: [], checked: [] },
      household_other: { active: [], checked: [] },
    };

    currentItems.forEach((item, index) => {
      const cat = item.category || categorizeGroceryItem(item.name);
      if (!groups[cat]) groups[cat] = { active: [], checked: [] };
      if (item.bought) {
        groups[cat].checked.push({ item, originalIndex: index });
      } else {
        groups[cat].active.push({ item, originalIndex: index });
      }
    });

    return groups;
  }, [currentItems]);

  const toggleSectionCompleted = (sectionKey: string) => {
    setShowCompleted((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const remainingCount = currentItems.filter((i) => !i.bought).length;
  const boughtCount = currentItems.filter((i) => i.bought).length;

  if (!hasHydrated) {
    return (
      <main className="relative min-h-screen bg-[#110d0b] px-4 py-8 text-stone-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-white/10 bg-[#16120f] p-8 text-stone-400">
            Loading your grocery manager...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#110d0b] px-4 py-6 sm:px-6 lg:px-8 text-stone-100">
      <div className="mx-auto flex w-full max-w-7xl 2xl:max-w-[1820px] flex-col gap-6">
        
        {/* HEADER BAR */}
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#16120f]/95 p-5 sm:p-6 shadow-[0_18px_60px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 text-xs font-bold uppercase tracking-widest text-amber-400">
                <span>🛒</span>
                <span>Grocery Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#fff8ef]">
                {activeListName}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-stone-400">
                {remainingCount} items to buy {boughtCount > 0 ? `• ${boughtCount} checked off` : ""}
              </p>
            </div>

            {/* STREAMLINED ACTION BAR */}
            <div className="flex flex-wrap items-center gap-2">
              {/* STORE MODE TOGGLE */}
              <button
                type="button"
                onClick={() => setIsStoreMode(!isStoreMode)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs sm:text-sm font-bold transition-all duration-100 cursor-pointer ${
                  isStoreMode
                    ? "border-emerald-400 bg-emerald-400/20 text-emerald-300 shadow-emerald-400/20"
                    : "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white"
                }`}
                title="Simplified large shopping checklist"
              >
                <span>📱</span>
                <span>Store Mode</span>
              </button>

              {/* GROUP BY AISLE / FLAT TOGGLE */}
              <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-0.5">
                <button
                  type="button"
                  onClick={() => setGroupByAisle(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    groupByAisle
                      ? "bg-amber-500 text-stone-950 shadow-xs"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                  title="Organize by supermarket aisles"
                >
                  🏪 Aisles
                </button>
                <button
                  type="button"
                  onClick={() => setGroupByAisle(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    !groupByAisle
                      ? "bg-amber-500 text-stone-950 shadow-xs"
                      : "text-stone-400 hover:text-stone-200"
                  }`}
                  title="Flat simple list"
                >
                  ≡ Flat
                </button>
              </div>

              {/* AI VISION SCANNER BUTTON */}
              <button
                type="button"
                onClick={() => setIsVisionModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs sm:text-sm font-bold text-amber-300 transition-all duration-100 cursor-pointer"
                title="Scan handwritten note or printed receipt with camera"
              >
                <span>📷</span>
                <span>Scan List</span>
              </button>

              {/* SHARE ICON BUTTON */}
              {currentItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleCopyForExport}
                  aria-label="Share / Copy List"
                  title="Share / Copy list to clipboard"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-2xl border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              )}

              {/* CLEAR DONE BUTTON */}
              {boughtCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearCompleted}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <span>✓</span>
                  <span>Clear {boughtCount} Done</span>
                </button>
              )}

              {/* CLEAR ALL BUTTON */}
              {currentItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(true)}
                  aria-label="Clear All Items"
                  title="Clear all items from list"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

              {activeListId !== "main" && (
                <button
                  type="button"
                  onClick={handleDeleteCurrentCustomList}
                  className="inline-flex items-center gap-1 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                >
                  Delete List
                </button>
              )}
            </div>
          </div>

          {/* MULTI-LIST TABS */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/8">
            <button
              type="button"
              onClick={() => setActiveListId("main")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-100 cursor-pointer ${
                activeListId === "main"
                  ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-400/20"
                  : "bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>🛒</span>
              <span>Main List</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                activeListId === "main" ? "bg-stone-950/20 text-stone-950" : "bg-white/10 text-stone-400"
              }`}>
                {mainListItems.length}
              </span>
            </button>

            {customLists.map((list) => (
              <button
                key={list.id}
                type="button"
                onClick={() => setActiveListId(list.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-100 cursor-pointer ${
                  activeListId === list.id
                    ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-400/20"
                    : "bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>📋</span>
                <span>{list.name}</span>
                <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  activeListId === list.id ? "bg-stone-950/20 text-stone-950" : "bg-white/10 text-stone-400"
                }`}>
                  {list.items.length}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setIsNewListModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/2 px-3 py-1.5 text-xs font-semibold text-stone-400 hover:border-amber-400 hover:text-amber-300 transition-all duration-100 cursor-pointer"
            >
              <span>+</span>
              <span>New List</span>
            </button>
          </div>
        </header>

        {/* PROACTIVE SMART PANTRY CHECK BANNER */}
        {detectedPantryStaples.length > 0 && !isPantryBannerDismissed && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-[#1f1812] p-3.5 sm:px-4 sm:py-3 shadow-md">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-stone-200">
              <span className="text-base">🧂</span>
              <span>
                Found <strong className="text-amber-300">{detectedPantryStaples.length} kitchen staples</strong> (
                {detectedPantryStaples.slice(0, 3).map((s) => s.name).join(", ")}
                {detectedPantryStaples.length > 3 ? "..." : ""}). Already have these at home?
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handlePantryCheck}
                className="rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-600 transition cursor-pointer shadow-sm"
              >
                Mark as Owned
              </button>
              <button
                type="button"
                onClick={() => setIsPantryBannerDismissed(true)}
                className="rounded-xl bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Dismiss hint"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* QUICK ADD WITH VISUAL CATEGORY RIBBON */}
        <section className="relative rounded-3xl border border-white/10 bg-[#16120f] p-4 sm:p-5 shadow-md space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddItem();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={newItemText}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setNewItemText(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Add item (e.g. 2x Avocados, Dish washer tablets, Feta cheese)..."
                className="w-full rounded-2xl border border-white/10 bg-[#201813] px-4 py-3 text-sm sm:text-base text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none transition-colors duration-100"
              />

              {/* CLEAN AUTOCOMPLETE DROPDOWN */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-white/12 bg-[#201813] shadow-2xl">
                  <ul className="divide-y divide-white/5 py-1">
                    {suggestions.map((item) => (
                      <li
                        key={item.word}
                        className="group flex items-center justify-between hover:bg-amber-400/10 transition-colors duration-100 px-4 py-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => handleAddItem(item.word)}
                          className="flex-1 text-left text-xs sm:text-sm font-medium text-stone-200 hover:text-amber-300 transition-colors duration-100 cursor-pointer"
                        >
                          <span className={item.inList ? "text-stone-400 line-through" : "text-stone-100 font-semibold"}>
                            {item.word}
                          </span>
                        </button>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[11px] ${item.inList ? "text-stone-500" : "text-amber-400 font-semibold"}`}>
                            {item.inList ? "✓ In list" : "+ Add"}
                          </span>

                          {item.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLearnedWord(item.word);
                              }}
                              className="text-stone-500 hover:text-rose-400 transition-colors duration-100 cursor-pointer text-xs p-1 rounded hover:bg-white/5"
                              title="Remove from learned vocabulary"
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

            <button
              type="submit"
              disabled={!newItemText.trim()}
              className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-stone-950 hover:bg-amber-600 transition-all duration-100 cursor-pointer disabled:opacity-40 shadow-md shadow-amber-400/20"
            >
              Add Item
            </button>
          </form>

          {/* INTUITIVE CATEGORY ICON RIBBON */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-stone-500 font-semibold mr-1">
              Aisle:
            </span>

            {/* AUTO PILL */}
            <button
              type="button"
              onClick={() => setSelectedCategory("auto")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all duration-100 cursor-pointer ${
                selectedCategory === "auto"
                  ? "bg-amber-500 text-stone-950 shadow-sm"
                  : "bg-white/5 text-stone-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>✨</span>
              <span>Auto-detect</span>
            </button>

            {/* CATEGORY ICON PILLS */}
            {GROCERY_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition-all duration-100 cursor-pointer ${
                    isSelected
                      ? "bg-amber-500 text-stone-950 font-bold shadow-sm"
                      : "bg-white/5 text-stone-400 hover:bg-white/10 hover:text-stone-200"
                  }`}
                  title={cat.name}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name.split("&")[0].trim()}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ITEMS LIST */}
        {currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#16120f]/50 py-16 text-center">
            <span className="text-4xl mb-3 text-stone-600">🧺</span>
            <h3 className="text-lg font-bold text-stone-200">This grocery list is empty</h3>
            <p className="mt-1 max-w-sm text-xs sm:text-sm text-stone-500 leading-relaxed">
              Add items using the search above, or send all ingredients for your week from the{" "}
              <Link href="/planner" className="text-amber-400 hover:underline">
                Meal Planner
              </Link>
              !
            </p>
          </div>
        ) : groupByAisle ? (
          /* AISLE-CATEGORIZED VIEW */
          <div className="space-y-6">
            {GROCERY_CATEGORIES.map((cat) => {
              const group = categorizedGroups[cat.id];
              const activeItems = group?.active || [];
              const checkedItems = group?.checked || [];
              const totalInCategory = activeItems.length + checkedItems.length;
              if (totalInCategory === 0) return null;

              const isAccordionOpen = showCompleted[cat.id] ?? false;

              return (
                <section
                  key={cat.id}
                  className="rounded-3xl border border-white/10 bg-[#16120f] p-5 sm:p-6 shadow-md"
                >
                  {/* AISLE HEADER */}
                  <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{cat.icon}</span>
                      <h2 className="text-base sm:text-lg font-bold text-[#fff8ef]">
                        {cat.name}
                      </h2>
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${cat.badgeClass}`}>
                      {activeItems.length > 0 ? `${activeItems.length} left` : "✓ Done"}
                    </span>
                  </div>

                  {/* ACTIVE (UNBOUGHT) ITEMS */}
                  {activeItems.length > 0 && (
                    <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {activeItems.map(({ item, originalIndex }) => {
                        const isAnimating = animatingQtyIndex?.index === originalIndex;
                        return (
                          <li
                            key={`${item.name}-${originalIndex}`}
                            className="group flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#201813]/90 hover:bg-[#271e18] hover:border-amber-400/30 p-3.5 shadow-sm transition-all duration-100"
                          >
                            <label className="flex flex-1 items-center gap-3 cursor-pointer min-w-0">
                              <input
                                type="checkbox"
                                checked={item.bought}
                                onChange={() => toggleBought(originalIndex)}
                                className="h-5 w-5 shrink-0 accent-emerald-400 cursor-pointer rounded-md"
                              />
                              <div className="min-w-0 flex-1">
                                <span
                                  className={`truncate block font-semibold ${
                                    isStoreMode ? "text-base sm:text-lg" : "text-sm"
                                  } text-stone-100`}
                                >
                                  {item.name}
                                </span>
                              </div>
                            </label>

                            {/* TACTILE QUANTITY STEPPER WITH MICRO-ANIMATION */}
                            <div className="relative flex items-center gap-1 rounded-xl bg-black/40 border border-white/10 px-1 py-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateQuantity(originalIndex, -1)}
                                className="h-6 w-6 rounded-lg text-xs font-bold text-stone-400 hover:bg-white/10 hover:text-rose-400 transition-transform active:scale-75 cursor-pointer flex items-center justify-center"
                                title="Decrease quantity"
                              >
                                -
                              </button>
                              
                              <span
                                className={`px-1.5 text-xs font-mono font-bold min-w-5 text-center transition-all duration-150 ${
                                  isAnimating
                                    ? "scale-125 text-amber-200 bg-amber-400/25 rounded-md"
                                    : "text-amber-300"
                                }`}
                              >
                                {item.quantity || 1}
                              </span>

                              <button
                                type="button"
                                onClick={() => updateQuantity(originalIndex, 1)}
                                className="h-6 w-6 rounded-lg text-xs font-bold text-stone-400 hover:bg-white/10 hover:text-emerald-300 transition-transform active:scale-75 cursor-pointer flex items-center justify-center"
                                title="Increase quantity"
                              >
                                +
                              </button>

                              {/* POP INDICATOR */}
                              {isAnimating && (
                                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-amber-300 animate-bounce">
                                  {animatingQtyIndex.delta > 0 ? "+1" : "-1"}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(originalIndex)}
                              className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 transition-colors duration-100 cursor-pointer p-1"
                              title="Delete item"
                            >
                              ✕
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* COLLAPSIBLE CHECKED ITEMS ACCORDION */}
                  {checkedItems.length > 0 && (
                    <div className={activeItems.length > 0 ? "mt-4 pt-3 border-t border-white/5" : ""}>
                      <button
                        type="button"
                        onClick={() => toggleSectionCompleted(cat.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/6 bg-white/2 px-3 py-1.5 text-xs font-semibold text-stone-400 hover:border-white/12 hover:bg-white/5 hover:text-stone-200 transition-all duration-100 cursor-pointer group"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                          ✓
                        </span>
                        <span>
                          {checkedItems.length} purchased {checkedItems.length === 1 ? "item" : "items"}
                        </span>
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`h-3 w-3 transition-transform duration-200 ${
                            isAccordionOpen ? "rotate-180 text-amber-300" : "rotate-0 text-stone-500 group-hover:text-stone-300"
                          }`}
                        >
                          <path d="M4 6l4 4 4-4" />
                        </svg>
                      </button>

                      {isAccordionOpen && (
                        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 mt-2.5">
                          {checkedItems.map(({ item, originalIndex }) => (
                            <li
                              key={`${item.name}-${originalIndex}`}
                              className="group flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-3 opacity-60 hover:opacity-100 transition duration-100"
                            >
                              <label className="flex flex-1 items-center gap-3 cursor-pointer min-w-0">
                                <input
                                  type="checkbox"
                                  checked={item.bought}
                                  onChange={() => toggleBought(originalIndex)}
                                  className="h-4.5 w-4.5 shrink-0 accent-emerald-400 cursor-pointer rounded-md"
                                />
                                <div className="min-w-0 flex-1">
                                  <span className="truncate block text-xs sm:text-sm font-medium text-emerald-200 line-through">
                                    {(item.quantity || 1) > 1 ? `${item.quantity}x ` : ""}
                                    {item.name}
                                  </span>
                                </div>
                              </label>

                              <button
                                type="button"
                                onClick={() => removeItem(originalIndex)}
                                className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 transition-colors duration-100 cursor-pointer text-xs p-1"
                                title="Delete item"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          /* FLAT CHECKLIST VIEW */
          <section className="rounded-3xl border border-white/10 bg-[#16120f] p-5 sm:p-6 shadow-md">
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {currentItems.map((item, index) => {
                const catMeta = GROCERY_CATEGORIES.find((c) => c.id === item.category);
                const isAnimating = animatingQtyIndex?.index === index;

                return (
                  <li
                    key={`${item.name}-${index}`}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all duration-100 ${
                      item.bought
                        ? "border-emerald-500/15 bg-emerald-500/5 opacity-60"
                        : "border-white/8 bg-[#201813]/90 hover:bg-[#271e18] hover:border-amber-400/30 shadow-sm"
                    }`}
                  >
                    <label className="flex flex-1 items-center gap-3 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={item.bought}
                        onChange={() => toggleBought(index)}
                        className="h-5 w-5 shrink-0 accent-emerald-400 cursor-pointer rounded-md"
                      />
                      <div className="min-w-0 flex-1">
                        <span
                          className={`truncate block font-medium ${
                            isStoreMode ? "text-base sm:text-lg" : "text-sm"
                          } ${
                            item.bought ? "text-emerald-200 line-through" : "text-stone-100 font-semibold"
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                    </label>

                    {/* QUANTITY STEPPER WITH MICRO-ANIMATION */}
                    <div className="relative flex items-center gap-1 rounded-xl bg-black/40 border border-white/10 px-1 py-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, -1)}
                        className="h-6 w-6 rounded-lg text-xs font-bold text-stone-400 hover:bg-white/10 hover:text-rose-400 transition-transform active:scale-75 cursor-pointer flex items-center justify-center"
                        title="Decrease quantity"
                      >
                        -
                      </button>
                      <span
                        className={`px-1.5 text-xs font-mono font-bold min-w-5 text-center transition-all duration-150 ${
                          isAnimating
                            ? "scale-125 text-amber-200 bg-amber-400/25 rounded-md"
                            : "text-amber-300"
                        }`}
                      >
                        {item.quantity || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, 1)}
                        className="h-6 w-6 rounded-lg text-xs font-bold text-stone-400 hover:bg-white/10 hover:text-emerald-300 transition-transform active:scale-75 cursor-pointer flex items-center justify-center"
                        title="Increase quantity"
                      >
                        +
                      </button>

                      {isAnimating && (
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-amber-300 animate-bounce">
                          {animatingQtyIndex.delta > 0 ? "+1" : "-1"}
                        </span>
                      )}
                    </div>

                    {catMeta && (
                      <span className="text-xs text-stone-500 shrink-0" title={catMeta.name}>
                        {catMeta.icon}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-rose-400 transition-colors duration-100 cursor-pointer p-1"
                      title="Delete item"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {/* CREATE NEW LIST MODAL */}
      {isNewListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsNewListModalOpen(false)}
            className="absolute inset-0 bg-black/70 transition-opacity"
          />
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#191410] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[#fff8ef] mb-2">Create New Grocery List</h3>
            <p className="text-xs text-stone-400 mb-4">
              Give your list a name (e.g. <em>Asian Supermarket</em>, <em>Party Supplies</em>, <em>Costco</em>).
            </p>
            <form onSubmit={handleCreateNewList} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                className="w-full rounded-2xl border border-white/10 bg-[#221b16] px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewListModalOpen(false)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-stone-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="rounded-2xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-600 disabled:opacity-40"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISION SCANNER MODAL */}
      {isVisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            onClick={() => setIsVisionModalOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#16120f] my-auto">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">📷</span>
                <h3 className="text-lg font-bold text-stone-950 dark:text-[#fff8ef]">
                  Scan Paper Grocery List
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVisionModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/20 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <ChefVisionStudio
              initialMode="grocery"
              onCloseModal={() => setIsVisionModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* CLEAR ALL CONFIRM MODAL */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear All Items?"
        description={`This will delete all items from "${activeListName}". This cannot be undone.`}
        confirmLabel="Clear All"
        cancelLabel="Keep Items"
        isDestructive
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </main>
  );
}
