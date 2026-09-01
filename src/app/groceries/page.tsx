"use client";

import { useEffect, useState, useMemo } from "react";
import { GROCERY_LIST_KEY } from "../../lib/home";
import { getAllRecipes, getAllRecipesWithCloud } from "../../lib/recipes";
import { useToast } from "../../components/ui/ToastProvider";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ChefVisionStudio from "../../components/vision/ChefVisionStudio";
import GroceryHeader from "../../components/grocery/GroceryHeader";
import GroceryQuickAdd from "../../components/grocery/GroceryQuickAdd";
import GroceryAisleCard from "../../components/grocery/GroceryAisleCard";
import PantryInventoryView from "../../components/grocery/PantryInventoryView";
import CookWhatIHaveModal from "../../components/grocery/CookWhatIHaveModal";
import RenameListModal from "../../components/grocery/RenameListModal";
import CreateListModal from "../../components/grocery/CreateListModal";
import { getStoredUserSettings } from "../../lib/settings";
import {
  GROCERY_CATEGORIES,
  categorizeGroceryItem,
  saveLearnedCategory,
  getPantryInventory,
  savePantryInventory,
  GROCERY_CUSTOM_LISTS_KEY,
  formatGroceryItemName,
  type GroceryCategory,
  type GroceryListCollection,
  type StoredGroceryItem,
  type PantryItem,
} from "../../lib/groceries";
import type { AppRecipe } from "../../lib/types";
import { sanitizeCulinaryText } from "../../lib/culinaryTextSanitizer";
import { canonicalizeIngredients } from "../../lib/format";

export default function GroceriesPage() {
  const { success, info } = useToast();

  // Navigation & view states
  const [activeTab, setActiveTab] = useState<"shopping_list" | "pantry">("shopping_list");
  const [activeListId, setActiveListId] = useState<string>("main");
  const [groupByAisle, setGroupByAisle] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Grocery data
  const [mainListItems, setMainListItems] = useState<StoredGroceryItem[]>([]);
  const [customLists, setCustomLists] = useState<GroceryListCollection[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [recipes, setRecipes] = useState<AppRecipe[]>([]);
  const [learnedVocab, setLearnedVocab] = useState<string[]>([]);
  const [recentlyAddedItemId, setRecentlyAddedItemId] = useState<string | null>(null);

  // Modals
  const [isVisionModalOpen, setIsVisionModalOpen] = useState(false);
  const [isCookWhatIHaveOpen, setIsCookWhatIHaveOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [isRenameListModalOpen, setIsRenameListModalOpen] = useState(false);

  // Load initial data and guarantee capitalization across all stored items
  const loadData = () => {
    try {
      const storedMain = localStorage.getItem(GROCERY_LIST_KEY);
      if (storedMain) {
        const parsed = JSON.parse(storedMain) as StoredGroceryItem[];
        const enriched = parsed.map((item) => ({
          ...item,
          name: formatGroceryItemName(item.name),
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
            name: formatGroceryItemName(item.name),
            quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
            category: item.category || categorizeGroceryItem(item.name),
          })),
        }));
        setCustomLists(enrichedCustom);
      } else {
        setCustomLists([]);
      }

      setPantryItems(getPantryInventory());
      setRecipes(getAllRecipes());

      getAllRecipesWithCloud().then((cloudRecs) => {
        if (cloudRecs && cloudRecs.length > 0) {
          setRecipes(cloudRecs);
        }
      });
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
    setHasHydrated(true);

    // Build clean, deduplicated, capitalized autocomplete vocabulary
    const allRecs = getAllRecipes();
    const vocabSet = new Set<string>();

    allRecs.forEach((r) => {
      (r.ingredients || []).forEach((ing) => {
        const canonicalList = canonicalizeIngredients(ing);
        canonicalList.forEach((c) => {
          const clean = formatGroceryItemName(c);
          if (clean.length > 1 && clean.length < 35 && !/^\d+/.test(clean)) {
            vocabSet.add(clean);
          }
        });
      });
    });
    setLearnedVocab(Array.from(vocabSet));

    const handleStorageChange = () => loadData();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("grocery_list_updated", handleStorageChange);
    window.addEventListener("pantry_inventory_updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("grocery_list_updated", handleStorageChange);
      window.removeEventListener("pantry_inventory_updated", handleStorageChange);
    };
  }, []);

  // Sync to local storage
  const saveMainList = (items: StoredGroceryItem[]) => {
    setMainListItems(items);
    localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("grocery_list_updated"));
  };

  const saveCustomLists = (lists: GroceryListCollection[]) => {
    setCustomLists(lists);
    localStorage.setItem(GROCERY_CUSTOM_LISTS_KEY, JSON.stringify(lists));
    window.dispatchEvent(new Event("grocery_list_updated"));
  };

  // Active items reference
  const currentItems = useMemo(() => {
    if (activeListId === "main") return mainListItems;
    const found = customLists.find((l) => l.id === activeListId);
    return found ? found.items : [];
  }, [activeListId, mainListItems, customLists]);

  const updateCurrentListItems = (newItems: StoredGroceryItem[]) => {
    if (activeListId === "main") {
      saveMainList(newItems);
    } else {
      const updatedLists = customLists.map((l) =>
        l.id === activeListId ? { ...l, items: newItems } : l
      );
      saveCustomLists(updatedLists);
    }
  };

  // Add single item with automatic category resolution & Unicode capitalization
  const handleAddItem = (
    name: string,
    categoryOverride?: GroceryCategory,
    options?: { silent?: boolean; customMessage?: string }
  ) => {
    const cleanName = formatGroceryItemName(name);
    if (!cleanName) return;

    const category = categoryOverride || categorizeGroceryItem(cleanName);
    if (categoryOverride) {
      saveLearnedCategory(cleanName, categoryOverride);
    }

    const existingIndex = currentItems.findIndex(
      (i) => i.name.toLowerCase().trim() === cleanName.toLowerCase().trim() && !i.bought
    );

    if (existingIndex >= 0) {
      const updated = [...currentItems];
      const targetId = updated[existingIndex].id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      updated[existingIndex].id = targetId;
      updated[existingIndex].quantity = (updated[existingIndex].quantity || 1) + 1;
      updateCurrentListItems(updated);
      setRecentlyAddedItemId(targetId);
      setTimeout(() => setRecentlyAddedItemId(null), 2500);
      if (!options?.silent) {
        info(options?.customMessage || `Increased quantity for "${cleanName}" 🛒`);
      }
    } else {
      const newItemId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newItem: StoredGroceryItem = {
        id: newItemId,
        name: cleanName,
        quantity: 1,
        category,
        bought: false,
      };
      updateCurrentListItems([...currentItems, newItem]);
      setRecentlyAddedItemId(newItemId);
      setTimeout(() => setRecentlyAddedItemId(null), 2500);
      if (!options?.silent) {
        success(options?.customMessage || `Added "${cleanName}" to list!`);
      }
    }
  };

  // Add multiple items from recipe / pantry with capitalization
  const handleAddMultipleItems = (
    ingredients: string[],
    recipeTitle?: string,
    recipeId?: number | string
  ) => {
    const newItemsToAdd: StoredGroceryItem[] = [];
    const updated = [...currentItems];

    ingredients.forEach((ing) => {
      const clean = formatGroceryItemName(ing);
      if (!clean) return;

      const category = categorizeGroceryItem(clean);
      const existingIdx = updated.findIndex(
        (i) => i.name.toLowerCase().trim() === clean.toLowerCase().trim() && !i.bought
      );

      if (existingIdx >= 0) {
        updated[existingIdx].quantity = (updated[existingIdx].quantity || 1) + 1;
        if (recipeTitle) updated[existingIdx].sourceRecipeTitle = recipeTitle;
        if (recipeId) updated[existingIdx].sourceRecipeId = recipeId;
      } else {
        newItemsToAdd.push({
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: clean,
          quantity: 1,
          category,
          bought: false,
          sourceRecipeTitle: recipeTitle,
          sourceRecipeId: recipeId,
        });
      }
    });

    updateCurrentListItems([...updated, ...newItemsToAdd]);
    const totalAdded = ingredients.length;
    success(`Added ${totalAdded} items to your shopping list! 🛒`);
  };

  // Toggle bought status with Two-Way Pantry synchronization
  const handleToggleBought = (originalIndex: number) => {
    if (originalIndex < 0 || originalIndex >= currentItems.length) return;
    const updated = [...currentItems];
    const target = updated[originalIndex];
    const newBoughtState = !target.bought;
    updated[originalIndex] = {
      ...target,
      bought: newBoughtState,
    };
    updateCurrentListItems(updated);

    // Two-way sync: If item was just checked off (bought: true) and exists in Pantry as out-of-stock, restore it to in-stock!
    if (newBoughtState) {
      const targetName = target.name.toLowerCase().trim();
      const pantryMatch = pantryItems.find(
        (p) => p.name.toLowerCase().trim() === targetName && !p.inStock
      );
      if (pantryMatch) {
        const updatedPantry = pantryItems.map((p) =>
          p.id === pantryMatch.id ? { ...p, inStock: true } : p
        );
        setPantryItems(updatedPantry);
        savePantryInventory(updatedPantry);
        success(`"${target.name}" markerades som 'In Stock' i skafferiet! ✨`);
      }
    }
  };

  // Update item quantity
  const handleUpdateQuantity = (originalIndex: number, delta: number) => {
    if (originalIndex < 0 || originalIndex >= currentItems.length) return;
    const updated = [...currentItems];
    const target = updated[originalIndex];
    const currentQty = target.quantity && target.quantity > 0 ? target.quantity : 1;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      updated.splice(originalIndex, 1);
    } else {
      updated[originalIndex] = {
        ...target,
        quantity: newQty,
      };
    }
    updateCurrentListItems(updated);
  };

  // Delete single item
  const handleDeleteItem = (originalIndex: number) => {
    if (originalIndex < 0 || originalIndex >= currentItems.length) return;
    const updated = [...currentItems];
    updated.splice(originalIndex, 1);
    updateCurrentListItems(updated);
  };

  // Clear completed bought items
  const handleClearCompleted = () => {
    const active = currentItems.filter((i) => !i.bought);
    updateCurrentListItems(active);
  };

  // Clear all items in active list
  const handleClearAll = () => {
    updateCurrentListItems([]);
    setIsClearModalOpen(false);
    success("Cleared all items from this list.");
  };

  // Create new custom list
  const handleCreateNewList = (name: string) => {
    const newList: GroceryListCollection = {
      id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      createdAt: Date.now(),
      items: [],
    };
    const updated = [...customLists, newList];
    saveCustomLists(updated);
    setActiveListId(newList.id);
    setIsNewListModalOpen(false);
    success(`Created "${newList.name}"!`);
  };

  // Rename current custom list
  const handleRenameList = (newName: string) => {
    if (activeListId === "main") return;
    const updated = customLists.map((l) =>
      l.id === activeListId ? { ...l, name: newName.trim() } : l
    );
    saveCustomLists(updated);
    setIsRenameListModalOpen(false);
    success(`Renamed list to "${newName.trim()}"`);
  };

  // Delete current custom list
  const handleDeleteCurrentCustomList = () => {
    if (activeListId === "main") return;
    const target = customLists.find((l) => l.id === activeListId);
    const updated = customLists.filter((l) => l.id !== activeListId);
    saveCustomLists(updated);
    setActiveListId("main");
    info(`Deleted "${target?.name || "list"}" and switched to Main.`);
  };

  // Copy formatted list to clipboard
  const handleCopyList = async () => {
    if (currentItems.length === 0) return;
    const lines = currentItems.map((i) => {
      const mark = i.bought ? "[x]" : "[ ]";
      const qty = i.quantity && i.quantity > 1 ? ` (${i.quantity}x)` : "";
      const source = i.sourceRecipeTitle ? ` (For: ${i.sourceRecipeTitle})` : "";
      return `${mark} ${formatGroceryItemName(i.name)}${qty}${source}`;
    });

    const listName = activeListId === "main" ? "Main Shopping List" : customLists.find((l) => l.id === activeListId)?.name || "Shopping List";
    const textToCopy = `🛒 ${listName}\n\n${lines.join("\n")}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      success("List copied to clipboard! 📋");
    } catch {
      info("Could not copy list to clipboard.");
    }
  };

  // Pantry handlers
  const handleTogglePantryStock = (id: string) => {
    const targetItem = pantryItems.find((item) => item.id === id);
    const becomingOutOfStock = targetItem && targetItem.inStock;

    const updated = pantryItems.map((item) =>
      item.id === id ? { ...item, inStock: !item.inStock } : item
    );
    setPantryItems(updated);
    savePantryInventory(updated);

    // If item was marked as running low / out of stock, auto-add to active shopping list (single notification!)
    if (becomingOutOfStock && targetItem) {
      const userSettings = getStoredUserSettings();
      if (userSettings.autoAddLowPantryToList) {
        const listName =
          activeListId === "main"
            ? "Main Shopping List"
            : customLists.find((l) => l.id === activeListId)?.name || "Shopping List";
        handleAddItem(targetItem.name, targetItem.category, {
          customMessage: `"${targetItem.name}" lades automatiskt till i ${listName}!`,
        });
      }
    }
  };

  const handleAddPantryStaple = (name: string, category: GroceryCategory) => {
    const clean = formatGroceryItemName(name);
    if (!clean) return;

    const newItem: PantryItem = {
      id: `pantry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: clean,
      category,
      inStock: true,
    };
    const updated = [...pantryItems, newItem];
    setPantryItems(updated);
    savePantryInventory(updated);
    success(`Added "${clean}" to your pantry staples!`);
  };

  const handleDeletePantryStaple = (id: string) => {
    const updated = pantryItems.filter((i) => i.id !== id);
    setPantryItems(updated);
    savePantryInventory(updated);
  };

  // Stable category ordering (calibrated by number of ACTIVE unbought items)
  const [stableCategoryOrder, setStableCategoryOrder] = useState<GroceryCategory[]>([]);

  useEffect(() => {
    const activeCounts: Partial<Record<GroceryCategory, number>> = {};
    currentItems.forEach((item) => {
      if (!item.bought) {
        const cat = item.category || categorizeGroceryItem(item.name);
        activeCounts[cat] = (activeCounts[cat] || 0) + 1;
      }
    });

    const sortedCats = [...GROCERY_CATEGORIES]
      .sort((a, b) => (activeCounts[b.id] || 0) - (activeCounts[a.id] || 0))
      .map((c) => c.id);

    setStableCategoryOrder(sortedCats);
  }, [activeListId, currentItems.length]);

  // Aisle groups calculation (STABLE ORDER, SORTED ALPHABETICALLY A-Z WITHIN EACH AISLE)
  const { activeAisles, completedAisles } = useMemo(() => {
    const groups: Record<
      GroceryCategory,
      {
        active: { item: StoredGroceryItem; originalIndex: number }[];
        checked: { item: StoredGroceryItem; originalIndex: number }[];
      }
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

    const activeList: { cat: GroceryCategory; group: typeof groups[GroceryCategory] }[] = [];
    const completedList: { cat: GroceryCategory; group: typeof groups[GroceryCategory] }[] = [];

    GROCERY_CATEGORIES.forEach((meta) => {
      const g = groups[meta.id];
      if (g.active.length === 0 && g.checked.length === 0) return;

      // Sortera även Aisle-vyns varor i alfabetisk ordning (A–Ö)
      g.active.sort((a, b) => a.item.name.localeCompare(b.item.name, "sv", { sensitivity: "base" }));
      g.checked.sort((a, b) => a.item.name.localeCompare(b.item.name, "sv", { sensitivity: "base" }));

      if (g.active.length > 0) {
        activeList.push({ cat: meta.id, group: g });
      } else {
        completedList.push({ cat: meta.id, group: g });
      }
    });

    // Stable aisle sorting based on stableCategoryOrder
    activeList.sort((a, b) => {
      const idxA = stableCategoryOrder.indexOf(a.cat);
      const idxB = stableCategoryOrder.indexOf(b.cat);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return b.group.active.length - a.group.active.length;
    });

    return { activeAisles: activeList, completedAisles: completedList };
  }, [currentItems, stableCategoryOrder]);

  // Sort Flat View items: 1) Unchecked first, 2) Alphabetical A-Z
  const flatSortedItems = useMemo(() => {
    return currentItems
      .map((item, originalIndex) => ({ item, originalIndex }))
      .sort((a, b) => {
        if (a.item.bought !== b.item.bought) {
          return a.item.bought ? 1 : -1;
        }
        return a.item.name.localeCompare(b.item.name, "sv", { sensitivity: "base" });
      });
  }, [currentItems]);

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

  const remainingCount = currentItems.filter((i) => !i.bought).length;
  const boughtCount = currentItems.filter((i) => i.bought).length;
  const inStockPantryCount = pantryItems.filter((p) => p.inStock).length;
  const activeCustomList = customLists.find((l) => l.id === activeListId);

  if (!hasHydrated) {
    return (
      <main className="min-h-screen bg-[#110d0b] px-4 py-8 text-stone-100 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-[#16120f] border border-white/10 p-6 shadow-xl">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm font-semibold">Opening Kitchen Hub...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#110d0b] px-4 sm:px-6 xl:px-10 py-6 text-stone-100 pb-28">
      <div className="mx-auto flex w-full max-w-7xl 2xl:max-w-[1820px] flex-col gap-6">
        
        {/* HEADER BAR */}
        <GroceryHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeListId={activeListId}
          onListIdChange={setActiveListId}
          mainListCount={mainListItems.length}
          customLists={customLists}
          onOpenNewListModal={() => setIsNewListModalOpen(true)}
          onOpenRenameListModal={() => setIsRenameListModalOpen(true)}
          onDeleteCustomList={handleDeleteCurrentCustomList}
          remainingCount={remainingCount}
          boughtCount={boughtCount}
          pantryInStockCount={inStockPantryCount}
          onOpenVisionModal={() => setIsVisionModalOpen(true)}
          onOpenCookWhatIHave={() => setIsCookWhatIHaveOpen(true)}
          onCopyList={handleCopyList}
          onClearAll={() => setIsClearModalOpen(true)}
          groupByAisle={groupByAisle}
          onToggleGroupByAisle={setGroupByAisle}
        />

        {/* TAB A: SHOPPING LIST VIEW */}
        {activeTab === "shopping_list" && (
          <div className="space-y-6">
            
            {/* QUICK ADD AUTOCOMPLETE COMPONENT */}
            <GroceryQuickAdd
              onAddItem={handleAddItem}
              learnedVocab={learnedVocab}
              currentItems={currentItems}
            />

            {/* EMPTY STATE */}
            {currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#16120f]/50 py-20 text-center space-y-3">
                <span className="text-5xl">🧺</span>
                <h3 className="text-xl font-bold text-[#fff8ef]">Your shopping list is empty</h3>
                <p className="max-w-md text-xs sm:text-sm text-stone-400 leading-relaxed">
                  Add groceries using the input bar above, or click below to match your pantry staples against your recipes.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCookWhatIHaveOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-6 py-3 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-150 active:scale-95 cursor-pointer mt-2"
                >
                  <svg className="h-4 w-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Find What You Can Cook (Pantry Matcher)</span>
                </button>
              </div>
            ) : groupByAisle ? (
              /* RESPONSIVE BALANCED AISLE GRID (SORTED BY MOST ITEMS FIRST) */
              <div className="space-y-8">
                
                {/* ACTIVE AISLES (PRIORITIZED FIRST IN MULTI-COLUMN GRID) */}
                {activeAisles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {activeAisles.map(({ cat, group }) => (
                      <GroceryAisleCard
                        key={cat}
                        category={cat}
                        activeItems={group.active}
                        checkedItems={group.checked}
                        recentlyAddedItemId={recentlyAddedItemId}
                        onToggleBought={handleToggleBought}
                        onUpdateQuantity={handleUpdateQuantity}
                        onDeleteItem={handleDeleteItem}
                      />
                    ))}
                  </div>
                )}

                {/* COMPLETED AISLES (DROPPED TO BOTTOM IN COMPACT CARDS) */}
                {completedAisles.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-white/8">
                    <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-wider">
                      <span className="text-emerald-400">✓</span>
                      <span>Completed Aisles ({completedAisles.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 items-start">
                      {completedAisles.map(({ cat, group }) => (
                        <GroceryAisleCard
                          key={cat}
                          category={cat}
                          activeItems={group.active}
                          checkedItems={group.checked}
                          recentlyAddedItemId={recentlyAddedItemId}
                          onToggleBought={handleToggleBought}
                          onUpdateQuantity={handleUpdateQuantity}
                          onDeleteItem={handleDeleteItem}
                        />
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* FLAT CHECKLIST VIEW (SORTED: UNCHECKED FIRST, ALPHABETICAL A-Z) */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 items-start">
                {flatSortedItems.map(({ item, originalIndex }) => {
                  const displayName = formatGroceryItemName(item.name);
                  const isRecentlyAdded = Boolean(item.id && recentlyAddedItemId === item.id);

                  return (
                    <div
                      key={item.id || `${originalIndex}-${item.name}`}
                      className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 shadow-xs ${
                        isRecentlyAdded
                          ? "ring-2 ring-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.35)] bg-gradient-to-r from-emerald-950/60 via-emerald-900/25 to-[#1f1915] border-emerald-400/60 scale-[1.01]"
                          : item.bought
                          ? "border-white/5 bg-black/30 opacity-60"
                          : "border-white/8 bg-[#1f1915] hover:border-amber-400/30"
                      }`}
                    >
                      <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={item.bought}
                          onChange={() => handleToggleBought(originalIndex)}
                          className="h-4.5 w-4.5 rounded accent-amber-500 cursor-pointer shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm sm:text-[15px] font-bold leading-snug break-words ${
                                item.bought ? "text-stone-400 line-through" : "text-stone-100"
                              }`}
                            >
                              {displayName}
                            </span>
                            {isRecentlyAdded && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 text-stone-950 font-black text-[10px] px-2 py-0.5 shadow-sm shadow-emerald-400/50 animate-bounce">
                                ✓ Added
                              </span>
                            )}
                          </div>
                          {item.sourceRecipeTitle && (
                            <div className="text-xs font-semibold text-amber-400 mt-0.5 truncate">
                              📌 For: {item.sourceRecipeTitle}
                            </div>
                          )}
                        </div>
                      </label>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(originalIndex, -1)}
                            className="h-7 w-7 flex items-center justify-center text-stone-400 hover:text-white text-xs font-black cursor-pointer"
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-amber-300 min-w-[22px] text-center">
                            {item.quantity || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(originalIndex, 1)}
                            className="h-7 w-7 flex items-center justify-center text-stone-400 hover:text-white text-xs font-black cursor-pointer"
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
                                handleDeleteItem(originalIndex);
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
                            className="h-8 w-8 flex items-center justify-center rounded-xl text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="Delete item"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* TAB B: PANTRY INVENTORY & RECIPE MATCHER VIEW */}
        {activeTab === "pantry" && (
          <PantryInventoryView
            pantryItems={pantryItems}
            learnedVocab={learnedVocab}
            onToggleStock={handleTogglePantryStock}
            onAddItem={handleAddPantryStaple}
            onDeleteItem={handleDeletePantryStaple}
            onAddMissingToGroceryList={(items) => handleAddMultipleItems(items)}
            onOpenCookWhatIHave={() => setIsCookWhatIHaveOpen(true)}
          />
        )}

        {/* BACK TO TOP BUTTON (CENTERED AT BOTTOM) */}
        <div className="flex justify-center pt-8 pb-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-full border border-stone-300/80 bg-white px-5 py-2.5 text-xs font-extrabold text-stone-700 shadow-xs hover:border-amber-500 hover:bg-amber-500/5 hover:text-amber-700 dark:border-white/12 dark:bg-[#16120f] dark:text-stone-300 dark:hover:border-amber-400/50 dark:hover:bg-amber-500/10 dark:hover:text-amber-400 transition-all cursor-pointer"
            title="Scroll back to top"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>Back to Top</span>
          </button>
        </div>

      </div>

      {/* CREATE NEW LIST MODAL */}
      {isNewListModalOpen && (
        <CreateListModal
          isOpen={isNewListModalOpen}
          onClose={() => setIsNewListModalOpen(false)}
          onCreate={handleCreateNewList}
        />
      )}

      {/* RENAME LIST MODAL */}
      {isRenameListModalOpen && activeCustomList && (
        <RenameListModal
          isOpen={isRenameListModalOpen}
          onClose={() => setIsRenameListModalOpen(false)}
          currentName={activeCustomList.name}
          onSave={handleRenameList}
        />
      )}

      {/* PANTRY MATCHER MODAL */}
      <CookWhatIHaveModal
        isOpen={isCookWhatIHaveOpen}
        onClose={() => setIsCookWhatIHaveOpen(false)}
        recipes={recipes}
        pantryItems={pantryItems}
        onAddMissingToGroceryList={handleAddMultipleItems}
      />

      {/* VISION CAMERA OCR MODAL */}
      {isVisionModalOpen && (
        <div
          onClick={() => setIsVisionModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/12 bg-[#16120f] p-6 shadow-2xl space-y-4 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Grocery List Scanner</span>
              </div>
              <button
                type="button"
                onClick={() => setIsVisionModalOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Close scanner"
              >
                ✕
              </button>
            </div>
            <ChefVisionStudio
              initialMode="grocery"
              lockMode={true}
              onCloseModal={() => {
                setIsVisionModalOpen(false);
                loadData();
              }}
            />
          </div>
        </div>
      )}

      {/* CLEAR ALL CONFIRM MODAL */}
      {isClearModalOpen && (
        <ConfirmModal
          isOpen={isClearModalOpen}
          title="Empty Grocery List?"
          description="Are you sure you want to remove all items from this grocery list? This action cannot be undone."
          confirmLabel="Yes, Clear All"
          cancelLabel="Cancel"
          isDestructive={true}
          onConfirm={handleClearAll}
          onCancel={() => setIsClearModalOpen(false)}
        />
      )}

    </main>
  );
}
