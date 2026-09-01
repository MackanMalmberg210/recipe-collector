"use client";

import { useEffect, useState, useMemo } from "react";
import type { AppRecipe } from "../../lib/types";
import type { MealPlan } from "../../lib/planner";
import { getUniquePlannedIngredients, getPlannedRecipes } from "../../lib/planner";
import {
  getCustomGroceryLists,
  addIngredientsToChosenList,
  getPantryInventory,
  type GroceryListCollection,
  type StoredGroceryItem,
  type PantryItem,
} from "../../lib/groceries";
import { useToast } from "../ui/ToastProvider";

type PlannerGroceryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  recipes: AppRecipe[];
  mealPlan: MealPlan;
};

export default function PlannerGroceryModal({
  isOpen,
  onClose,
  recipes,
  mealPlan,
}: PlannerGroceryModalProps) {
  const { success, info } = useToast();
  const [customLists, setCustomLists] = useState<GroceryListCollection[]>([]);
  const [mainListCount, setMainListCount] = useState<number>(0);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [existingGroceryNames, setExistingGroceryNames] = useState<Set<string>>(new Set());
  const [selectedListId, setSelectedListId] = useState<string>("main");
  const [newListName, setNewListName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedIngredientNames, setSelectedIngredientNames] = useState<Set<string>>(new Set());

  const plannedIngredients = useMemo(
    () => getUniquePlannedIngredients(recipes, mealPlan),
    [recipes, mealPlan],
  );
  const plannedRecipes = useMemo(
    () => getPlannedRecipes(recipes, mealPlan),
    [recipes, mealPlan],
  );

  useEffect(() => {
    if (isOpen) {
      setCustomLists(getCustomGroceryLists());
      setSelectedListId("main");
      setIsCreatingNew(false);
      setNewListName("");

      // Load pantry items
      const pantry = getPantryInventory();
      setPantryItems(pantry);
      const pantrySet = new Set(pantry.map((p) => p.name.toLowerCase().trim()));

      // Load main grocery list
      const grocerySet = new Set<string>();
      try {
        const storedMain = localStorage.getItem("groceryList");
        if (storedMain) {
          const parsed = JSON.parse(storedMain) as StoredGroceryItem[];
          if (Array.isArray(parsed)) {
            setMainListCount(parsed.length);
            parsed.forEach((item) => grocerySet.add(item.name.toLowerCase().trim()));
          }
        }
      } catch {
        setMainListCount(0);
      }
      setExistingGroceryNames(grocerySet);

      // Auto-select ONLY items that are NOT in pantry AND NOT in grocery list
      const initialSelected = new Set<string>();
      plannedIngredients.forEach((item) => {
        const norm = item.name.toLowerCase().trim();
        const inPantry = pantrySet.has(norm) || Array.from(pantrySet).some((p) => norm.includes(p) || p.includes(norm));
        const inGrocery = grocerySet.has(norm);

        if (!inPantry && !inGrocery) {
          initialSelected.add(item.name);
        }
      });

      setSelectedIngredientNames(initialSelected);
    }
  }, [isOpen, plannedIngredients]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const pantryNamesLower = useMemo(
    () => pantryItems.map((p) => p.name.toLowerCase().trim()),
    [pantryItems],
  );

  // Split ingredients into missing (to add) and already owned (pantry / list)
  const { missingItems, alreadyOwnedItems } = useMemo(() => {
    const missing: typeof plannedIngredients = [];
    const owned: typeof plannedIngredients = [];

    plannedIngredients.forEach((item) => {
      const norm = item.name.toLowerCase().trim();
      const inPantry = pantryNamesLower.some((p) => norm.includes(p) || p.includes(norm));
      const inGrocery = existingGroceryNames.has(norm);

      if (inPantry || inGrocery) {
        owned.push(item);
      } else {
        missing.push(item);
      }
    });

    return { missingItems: missing, alreadyOwnedItems: owned };
  }, [plannedIngredients, pantryNamesLower, existingGroceryNames]);

  if (!isOpen) return null;

  const toggleIngredient = (name: string) => {
    setSelectedIngredientNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleAdd = () => {
    const itemsToAdd = plannedIngredients
      .filter((item) => selectedIngredientNames.has(item.name))
      .map((item) => item.name);

    if (itemsToAdd.length === 0) {
      info("Please select at least one ingredient to add.");
      return;
    }

    let targetId = selectedListId;

    if (isCreatingNew) {
      const cleanNewName = newListName.trim();
      if (!cleanNewName) {
        info("Please enter a name for the new list.");
        return;
      }
      const newListId = `list-${Date.now()}`;
      const newCollection: GroceryListCollection = {
        id: newListId,
        name: cleanNewName,
        createdAt: Date.now(),
        items: [],
      };
      const existing = getCustomGroceryLists();
      localStorage.setItem(
        "recipe_collector_custom_grocery_lists",
        JSON.stringify([...existing, newCollection]),
      );
      targetId = newListId;
    }

    const { addedCount, listName } = addIngredientsToChosenList(
      itemsToAdd,
      "Weekly Meal Plan",
      0,
      targetId,
    );

    if (addedCount === 0) {
      info(`All selected ingredients are already in "${listName}". 🛒`);
    } else {
      success(
        `Added ${addedCount} ingredients to "${listName}"! 🛒`,
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* SOLID HIGH-SPEED BACKDROP */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* WIDE LUXURY MODAL DIALOG */}
      <div className="relative flex max-h-[92vh] w-full max-w-4xl xl:max-w-5xl flex-col overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-2xl transition-all dark:border-white/10 dark:bg-[#16120f] dark:text-stone-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-5 sm:px-8 dark:border-white/8">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
              Send Week to Grocery List
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              {plannedIngredients.length} ingredients from {plannedRecipes.length} planned meals
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer text-base font-bold"
          >
            ✕
          </button>
        </div>

        {/* BODY (100% NATIVE HARDWARE COMPOSITOR SCROLL) */}
        <div
          style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
          className="flex-1 overflow-y-scroll overscroll-contain p-6 sm:p-8 space-y-6"
        >
          {/* MAIN INGREDIENTS SECTION */}
          <div className="space-y-4">
            {/* ITEMS TO ADD (TOP) */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-5 dark:border-amber-500/20 dark:bg-[#1c1612] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Ingredients to Add ({selectedIngredientNames.size} selected)
                </span>
                <span className="text-xs text-stone-400">
                  Click any item to toggle
                </span>
              </div>

              {missingItems.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {missingItems.map((item) => {
                    const isSelected = selectedIngredientNames.has(item.name);
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => toggleIngredient(item.name)}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/20 text-amber-950 dark:text-amber-200 shadow-2xs"
                            : "border-stone-200 bg-white text-stone-400 line-through opacity-70 hover:opacity-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-500"
                        }`}
                      >
                        <span className="text-xs">{isSelected ? "✓" : "✕"}</span>
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-stone-500 py-2">
                  All weekly ingredients are already in your pantry or shopping list!
                </p>
              )}
            </div>

            {/* ALREADY IN PANTRY OR LIST (BOTTOM - MUTED) */}
            {alreadyOwnedItems.length > 0 && (
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4.5 dark:border-white/8 dark:bg-white/[0.02] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Already in Pantry or Shopping List ({alreadyOwnedItems.length})
                  </span>
                  <span className="text-[11px] text-stone-400">
                    Unselected by default
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                  {alreadyOwnedItems.map((item) => {
                    const isSelected = selectedIngredientNames.has(item.name);
                    const norm = item.name.toLowerCase().trim();
                    const inPantry = pantryNamesLower.some((p) => norm.includes(p) || p.includes(norm));

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => toggleIngredient(item.name)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/15 text-amber-950 dark:text-amber-200 shadow-2xs font-bold"
                            : "border-stone-200 bg-white/70 text-stone-500 hover:text-stone-800 dark:border-white/8 dark:bg-white/3 dark:text-stone-400 dark:hover:text-stone-200"
                        }`}
                      >
                        <span>{isSelected ? "✓" : "+"}</span>
                        <span>{item.name}</span>
                        <span className="rounded-md bg-stone-200/80 dark:bg-white/10 px-1.5 py-0.2 text-[10px] font-bold text-stone-600 dark:text-stone-300">
                          {inPantry ? "Pantry" : "In List"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* DESTINATION LIST CHOOSER */}
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Select Destination Shopping List
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* MAIN LIST */}
              <label
                onClick={() => {
                  setSelectedListId("main");
                  setIsCreatingNew(false);
                }}
                className={`flex items-center justify-between p-4 rounded-2xl border transition cursor-pointer ${
                  selectedListId === "main" && !isCreatingNew
                    ? "border-amber-500/70 bg-amber-500/10 text-stone-950 dark:text-amber-300 font-bold ring-1 ring-amber-500/30"
                    : "border-stone-200 bg-stone-50/70 hover:bg-stone-100 dark:border-white/8 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛒</span>
                  <div>
                    <p className="text-sm font-bold">Main Shopping List</p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {mainListCount} {mainListCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  selectedListId === "main" && !isCreatingNew
                    ? "border-amber-500 bg-amber-500"
                    : "border-stone-400 dark:border-stone-600"
                }`}>
                  {selectedListId === "main" && !isCreatingNew && (
                    <div className="h-2 w-2 rounded-full bg-white dark:bg-stone-950" />
                  )}
                </div>
              </label>

              {/* CUSTOM LISTS */}
              {customLists.map((list) => {
                const isChosen = selectedListId === list.id && !isCreatingNew;
                return (
                  <label
                    key={list.id}
                    onClick={() => {
                      setSelectedListId(list.id);
                      setIsCreatingNew(false);
                    }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition cursor-pointer ${
                      isChosen
                        ? "border-amber-500/70 bg-amber-500/10 text-stone-950 dark:text-amber-300 font-bold ring-1 ring-amber-500/30"
                        : "border-stone-200 bg-stone-50/70 hover:bg-stone-100 dark:border-white/8 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📋</span>
                      <div>
                        <p className="text-sm font-bold">{list.name}</p>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          {list.items.length} {list.items.length === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      isChosen
                        ? "border-amber-500 bg-amber-500"
                        : "border-stone-400 dark:border-stone-600"
                    }`}>
                      {isChosen && (
                        <div className="h-2 w-2 rounded-full bg-white dark:bg-stone-950" />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* CREATE NEW LIST */}
            <div>
              {!isCreatingNew ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer pt-1"
                >
                  <span>+ Create new custom list (e.g. &ldquo;Weekly Shopping&rdquo;)</span>
                </button>
              ) : (
                <div className="p-4 rounded-2xl border border-amber-500/50 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      New List Name
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g. Weekly Groceries, Sunday Market..."
                    autoFocus
                    className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-stone-950 placeholder:font-normal placeholder:text-stone-400 outline-none focus:border-amber-500 dark:border-white/12 dark:bg-[#1a1512] dark:text-stone-50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS FOOTER */}
        <div className="flex items-center justify-end gap-3 border-t border-stone-100 px-6 py-4.5 sm:px-8 dark:border-white/8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAdd}
            disabled={selectedIngredientNames.size === 0}
            className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-6 py-2.5 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition active:scale-95 cursor-pointer disabled:opacity-40"
          >
            Send {selectedIngredientNames.size} Ingredients 🛒
          </button>
        </div>

      </div>
    </div>
  );
}
