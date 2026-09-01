"use client";

import { useEffect, useState } from "react";
import type { AppRecipe } from "../../lib/types";
import {
  getCustomGroceryLists,
  addIngredientsToChosenList,
  type GroceryListCollection,
} from "../../lib/groceries";
import { useToast } from "../ui/ToastProvider";

type AddIngredientsToListModalProps = {
  recipe: AppRecipe | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function AddIngredientsToListModal({
  recipe,
  isOpen,
  onClose,
}: AddIngredientsToListModalProps) {
  const { success, info } = useToast();
  const [customLists, setCustomLists] = useState<GroceryListCollection[]>([]);
  const [mainListCount, setMainListCount] = useState<number>(0);
  const [selectedListId, setSelectedListId] = useState<string>("main");
  const [newListName, setNewListName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCustomLists(getCustomGroceryLists());
      setSelectedListId("main");
      setIsCreatingNew(false);
      setNewListName("");

      try {
        const storedMain = localStorage.getItem("groceryList");
        if (storedMain) {
          const parsed = JSON.parse(storedMain) as unknown[];
          setMainListCount(Array.isArray(parsed) ? parsed.length : 0);
        } else {
          setMainListCount(0);
        }
      } catch {
        setMainListCount(0);
      }
    }
  }, [isOpen]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !recipe) return null;

  const handleAdd = () => {
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
      recipe.ingredients,
      recipe.title,
      recipe.id,
      targetId,
    );

    if (addedCount === 0) {
      info(`All ingredients for "${recipe.title}" are already in "${listName}". 🛒`);
    } else {
      success(
        `Added ${addedCount} ingredient${addedCount === 1 ? "" : "s"} to "${listName}"! 🛒`,
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* SOLID HIGH-SPEED BACKDROP */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity duration-200"
        onClick={onClose}
      />

      {/* MODAL DIALOG */}
      <div className="relative w-full max-w-lg rounded-3xl border border-stone-200/90 bg-white p-6 shadow-2xl transition-all dark:border-white/10 dark:bg-[#16120f] dark:text-stone-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-stone-950 dark:text-stone-50">
                Add to Grocery List
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Choose which shopping list to send these ingredients to
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* RECIPE BEING ADDED - VISUAL PREVIEW CARD */}
        <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 dark:border-amber-500/25 dark:bg-[#201813]">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-950">
            {recipe.image ? (
              <img src={recipe.image} alt={recipe.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl">🍲</div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Recipe Ingredients
              </span>
              <span className="rounded-md bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-900 dark:text-amber-300">
                {recipe.ingredients.length} items
              </span>
            </div>
            <h4 className="text-sm font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
              {recipe.title}
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              {recipe.ingredients.slice(0, 4).join(", ")}
              {recipe.ingredients.length > 4 ? "..." : ""}
            </p>
          </div>
        </div>

        {/* LIST OPTIONS */}
        <div className="my-5 space-y-2.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Select Destination List
          </label>

          {/* MAIN LIST */}
          <label
            onClick={() => {
              setSelectedListId("main");
              setIsCreatingNew(false);
            }}
            className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
              selectedListId === "main" && !isCreatingNew
                ? "border-amber-500/60 bg-amber-500/10 text-stone-950 dark:text-amber-300 font-bold"
                : "border-stone-200 bg-stone-50/70 hover:bg-stone-100 dark:border-white/8 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🛒</span>
              <div className="text-xs sm:text-sm">
                <span className="font-bold">Main Shopping List</span>
                <span className="ml-2 text-[11px] text-stone-400 font-normal">
                  ({mainListCount} {mainListCount === 1 ? "item" : "items"})
                </span>
              </div>
            </div>
            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
              selectedListId === "main" && !isCreatingNew
                ? "border-amber-500 bg-amber-500"
                : "border-stone-400 dark:border-stone-600"
            }`}>
              {selectedListId === "main" && !isCreatingNew && (
                <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-stone-950" />
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
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition cursor-pointer ${
                  isChosen
                    ? "border-amber-500/60 bg-amber-500/10 text-stone-950 dark:text-amber-300 font-bold"
                    : "border-stone-200 bg-stone-50/70 hover:bg-stone-100 dark:border-white/8 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/8"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">📋</span>
                  <div className="text-xs sm:text-sm">
                    <span className="font-bold">{list.name}</span>
                    <span className="ml-2 text-[11px] text-stone-400 font-normal">
                      ({list.items.length} {list.items.length === 1 ? "item" : "items"})
                    </span>
                  </div>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  isChosen
                    ? "border-amber-500 bg-amber-500"
                    : "border-stone-400 dark:border-stone-600"
                }`}>
                  {isChosen && (
                    <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-stone-950" />
                  )}
                </div>
              </label>
            );
          })}

          {/* CREATE NEW LIST TOGGLE */}
          <div className="pt-1">
            {!isCreatingNew ? (
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                <span>+ Create new custom list</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl border border-amber-500/50 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    New List Name
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-[11px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Costco, Weekend Dinner..."
                  autoFocus
                  className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-stone-950 placeholder:font-normal placeholder:text-stone-400 outline-none focus:border-amber-500 dark:border-white/12 dark:bg-[#1a1512] dark:text-stone-50"
                />
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4 dark:border-white/8">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 transition hover:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAdd}
            className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 dark:border-amber-600/50 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] transition active:scale-95 cursor-pointer"
          >
            Add Ingredients ({recipe.ingredients.length})
          </button>
        </div>

      </div>
    </div>
  );
}
