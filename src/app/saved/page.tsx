"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CookbookEmptyState from "../../components/saved/CookbookEmptyState";
import CookbookGrid from "../../components/saved/CookbookGrid";
import CookbookSidebar, {
  type SidebarFilter,
} from "../../components/saved/CookbookSidebar";
import CookbookHeader from "../../components/saved/CookbookHeader";
import QuickPeekModal from "../../components/saved/QuickPeekModal";
import DeleteConfirmModal from "../../components/saved/DeleteConfirmModal";
import ImportRecipeModal from "../../components/import/ImportRecipeModal";
import AddRecipeModal from "../../components/cookbook/AddRecipeModal";
import VisionScanModal from "../../components/vision/VisionScanModal";
import AddIngredientsToListModal from "../../components/saved/AddIngredientsToListModal";
import { useToast } from "../../components/ui/ToastProvider";
import type { SortMode, ViewMode } from "../../components/saved/SavedToolbar";
import {
  getAllRecipes,
  getAllRecipesWithCloud,
  fetchUserRecipesFromCloud,
  getImportedRecipes,
  getSavedRecipeIds,
  getUserRecipes,
  saveRecipeId,
  removeSavedRecipe,
  getTrashedRecipes,
  moveRecipeToTrash,
  restoreRecipeFromTrash,
  permanentlyDeleteFromTrash,
  emptyTrash,
  type TrashedRecipe,
} from "../../lib/recipes";
import type { AppRecipe, RecipeCategory, MealType } from "../../lib/types";
import { addRecipeIngredientsToGrocery } from "../../lib/home";
import { getRecipeRatings } from "../../lib/ratings";
import { capitalize } from "../../lib/format";

const CATEGORY_META: { category: RecipeCategory; label: string }[] = [
  { category: "pasta", label: "Pasta" },
  { category: "main-course", label: "Main Course" },
  { category: "salad", label: "Salad" },
  { category: "soup", label: "Soup" },
  { category: "bowl", label: "Bowl" },
  { category: "stir-fry", label: "Stir-fry" },
  { category: "sandwich", label: "Sandwich & Wraps" },
  { category: "rice", label: "Rice & Grains" },
  { category: "breakfast", label: "Breakfast" },
  { category: "dessert", label: "Dessert" },
];

const MEAL_TYPE_META: { mealType: MealType; label: string }[] = [
  { mealType: "breakfast", label: "Breakfast" },
  { mealType: "lunch", label: "Lunch" },
  { mealType: "dinner", label: "Dinner" },
  { mealType: "snack", label: "Snack" },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function getRecipeTimestamp(recipe: AppRecipe) {
  const record = recipe as AppRecipe & {
    createdAt?: string | number;
    importedAt?: string | number;
    savedAt?: string | number;
  };

  const candidate = record.createdAt ?? record.importedAt ?? record.savedAt;

  if (typeof candidate === "number") return candidate;

  if (typeof candidate === "string") {
    const parsed = new Date(candidate).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function getRecipeSearchTokens(recipe: AppRecipe) {
  return [
    recipe.title,
    ...recipe.ingredients,
    ...(recipe.tags ?? []),
    ...(recipe.category ? [recipe.category] : []),
    ...(recipe.mealType ? [recipe.mealType] : []),
  ];
}

function SavedRecipesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allRecipes, setAllRecipes] = useState<AppRecipe[]>([]);
  const [userRecipes, setUserRecipes] = useState<AppRecipe[]>([]);
  const [importedRecipes, setImportedRecipes] = useState<AppRecipe[]>([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<number[]>([]);
  const [trashedRecipes, setTrashedRecipes] = useState<TrashedRecipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>({ type: "all" });
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [hasHydrated, setHasHydrated] = useState(false);
  const [peekRecipe, setPeekRecipe] = useState<AppRecipe | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<AppRecipe | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isVisionScanOpen, setIsVisionScanOpen] = useState(false);
  const [visionScanMode, setVisionScanMode] = useState<"recipe" | "meal_analyzer">("recipe");
  const [recipeForGroceryModal, setRecipeForGroceryModal] = useState<AppRecipe | null>(null);

  const { success: toastSuccess, info: toastInfo } = useToast();

  // Automatically trigger import modal if navigated with ?import=true
  useEffect(() => {
    if (searchParams.get("import") === "true") {
      setIsImportModalOpen(true);
    }
  }, [searchParams]);

  const loadData = async () => {
    setSavedRecipeIds(getSavedRecipeIds());
    const initialCombined = getAllRecipes();
    setAllRecipes(initialCombined);
    setUserRecipes(getUserRecipes());
    setImportedRecipes(getImportedRecipes());
    setTrashedRecipes(getTrashedRecipes());
    setHasHydrated(true);

    const cloud = await fetchUserRecipesFromCloud();
    if (cloud.length > 0) {
      const combined = await getAllRecipesWithCloud();
      setAllRecipes(combined);
      setUserRecipes(combined.filter((r) => r.origin === "user"));
      setImportedRecipes(combined.filter((r) => r.origin === "imported"));
    }

    // Preload & warm image cache for instant smooth rendering
    if (typeof window !== "undefined") {
      initialCombined.forEach((r) => {
        if (r.image) {
          const img = new window.Image();
          img.src = r.image;
        }
      });
    }
  };

  useEffect(() => {
    loadData();

    const handleFocus = () => loadData();
    const handleStorage = () => loadData();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const cookbookRecipes = useMemo(() => {
    const byId = new Map<number, AppRecipe>();
    const trashedIds = new Set(trashedRecipes.map((t) => t.id));

    allRecipes.forEach((recipe) => {
      if (!trashedIds.has(recipe.id)) byId.set(recipe.id, recipe);
    });

    return Array.from(byId.values());
  }, [allRecipes, trashedRecipes]);

  // Combined personal recipes created or imported by user
  const myRecipes = useMemo(() => {
    return cookbookRecipes.filter((r) => r.origin === "user" || r.origin === "imported");
  }, [cookbookRecipes]);

  // Compute counts for sidebar
  const favoritesCount = useMemo(() => {
    return savedRecipeIds.length;
  }, [savedRecipeIds]);

  const myRecipesCount = useMemo(() => {
    return myRecipes.length;
  }, [myRecipes]);

  const quickCount = useMemo(() => {
    return cookbookRecipes.filter((r) => r.cookTime !== undefined && r.cookTime <= 30).length;
  }, [cookbookRecipes]);

  const mealTypeCounts = useMemo(() => {
    return MEAL_TYPE_META.map((meta) => {
      const count = cookbookRecipes.filter((r) => r.mealType === meta.mealType).length;
      return {
        ...meta,
        count,
      };
    });
  }, [cookbookRecipes]);

  const categoryCounts = useMemo(() => {
    return CATEGORY_META.map((meta) => {
      const count = cookbookRecipes.filter((r) => r.category === meta.category).length;
      return {
        ...meta,
        count,
      };
    });
  }, [cookbookRecipes]);

  const isTrashActive = activeFilter.type === "trash";

  // Compute active title for header
  const activeTitle = useMemo(() => {
    if (activeFilter.type === "all") return "All Recipes";
    if (activeFilter.type === "my_recipes") return "My Recipes";
    if (activeFilter.type === "favorites") return "Favorites";
    if (activeFilter.type === "quick") return "Quick Meals (<30m)";
    if (activeFilter.type === "trash") return "Trash";
    if (activeFilter.type === "mealType") {
      const meta = MEAL_TYPE_META.find((m) => m.mealType === activeFilter.value);
      return meta ? meta.label : capitalize(activeFilter.value);
    }
    if (activeFilter.type === "category") {
      const meta = CATEGORY_META.find((c) => c.category === activeFilter.value);
      return meta ? meta.label : capitalize(activeFilter.value.replace(/-/g, " "));
    }
    return "My Recipes";
  }, [activeFilter]);

  useEffect(() => {
    document.title = `${activeTitle} • Recipe Collector`;
  }, [activeTitle]);

  const currentDataset = isTrashActive ? trashedRecipes : cookbookRecipes;

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);

    const filterMatched = currentDataset.filter((recipe) => {
      if (activeFilter.type === "all" || activeFilter.type === "trash") return true;
      if (activeFilter.type === "my_recipes") {
        return recipe.origin === "user" || recipe.origin === "imported";
      }
      if (activeFilter.type === "favorites") {
        return savedRecipeIds.includes(recipe.id);
      }
      if (activeFilter.type === "quick") {
        return recipe.cookTime !== undefined && recipe.cookTime <= 30;
      }
      if (activeFilter.type === "mealType") {
        return recipe.mealType === activeFilter.value;
      }
      if (activeFilter.type === "category") {
        return recipe.category === activeFilter.value;
      }
      return true;
    });

    const searchFiltered = filterMatched.filter((recipe) => {
      if (!normalizedQuery) return true;

      const tokens = getRecipeSearchTokens(recipe)
        .map(normalizeText)
        .filter(Boolean);

      return tokens.some((token) => token.includes(normalizedQuery));
    });

    const ratingsMap = getRecipeRatings();

    const sorted = [...searchFiltered].sort((a, b) => {
      if (sortMode === "alphabetical") {
        return a.title.localeCompare(b.title);
      }

      if (sortMode === "oldest") {
        return getRecipeTimestamp(a) - getRecipeTimestamp(b);
      }

      if (sortMode === "cookTime") {
        const aTime = a.cookTime ?? 9999;
        const bTime = b.cookTime ?? 9999;
        return aTime - bTime;
      }

      if (sortMode === "rating" || sortMode === "highest-rated") {
        const aRating = ratingsMap[a.id] ?? 0;
        const bRating = ratingsMap[b.id] ?? 0;
        if (bRating !== aRating) return bRating - aRating;
      }

      return getRecipeTimestamp(b) - getRecipeTimestamp(a);
    });

    return sorted;
  }, [currentDataset, searchQuery, activeFilter, sortMode, savedRecipeIds]);

  const handleAddToGrocery = (recipe: AppRecipe) => {
    setRecipeForGroceryModal(recipe);
  };

  const handleRemoveSaved = (id: number) => {
    removeSavedRecipe(id);
    setSavedRecipeIds((prev) => prev.filter((savedId) => savedId !== id));
  };

  const handleToggleSave = (id: number) => {
    if (savedRecipeIds.includes(id)) {
      removeSavedRecipe(id);
      setSavedRecipeIds((prev) => prev.filter((savedId) => savedId !== id));
      toastInfo("Removed from favorites.");
    } else {
      saveRecipeId(id);
      setSavedRecipeIds((prev) => [...prev, id]);
      toastSuccess("Saved to favorites! ⭐");
    }
  };

  // Trigger delete modal
  const handleRequestDelete = (recipe: AppRecipe) => {
    setRecipeToDelete(recipe);
  };

  // Confirm delete handler
  const handleConfirmDelete = async (recipe: AppRecipe) => {
    if (isTrashActive) {
      // Permanent delete from trash
      await permanentlyDeleteFromTrash(recipe.id, recipe.origin);
      setTrashedRecipes((prev) => prev.filter((item) => item.id !== recipe.id));
      toastSuccess(`Permanently deleted "${recipe.title}".`);
    } else {
      // Move to trash (with Undo!)
      const updatedTrash = moveRecipeToTrash(recipe);
      setTrashedRecipes(updatedTrash);
      setUserRecipes((prev) => prev.filter((item) => item.id !== recipe.id));
      setImportedRecipes((prev) => prev.filter((item) => item.id !== recipe.id));
      setAllRecipes((prev) => prev.filter((item) => item.id !== recipe.id));

      toastSuccess(`"${recipe.title}" moved to Trash.`, {
        label: "Undo",
        onClick: () => {
          restoreRecipeFromTrash(recipe.id);
          loadData();
          toastSuccess(`"${recipe.title}" restored!`);
        },
      });
    }

    setRecipeToDelete(null);
  };

  const handleRestoreRecipe = (id: number) => {
    restoreRecipeFromTrash(id);
    loadData();
    toastSuccess("Recipe restored to your Cookbook! ✨");
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
    setTrashedRecipes([]);
    toastSuccess("Trash emptied successfully.");
  };

  const handleResetFilters = () => {
    setActiveFilter({ type: "all" });
    setSearchQuery("");
  };

  const hasActiveFilter = activeFilter.type !== "all" || searchQuery !== "";

  const handleSelectAddOption = (option: "scratch" | "scan_cookbook" | "import_url" | "snap_plate") => {
    if (option === "scan_cookbook") {
      setVisionScanMode("recipe");
      setIsVisionScanOpen(true);
    } else if (option === "snap_plate") {
      setVisionScanMode("meal_analyzer");
      setIsVisionScanOpen(true);
    } else if (option === "import_url") {
      setIsImportModalOpen(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f5f0] text-stone-900 transition-colors duration-300 dark:bg-[#0e0c0a] dark:text-stone-100 px-4 py-6 sm:px-6 xl:px-10">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 dark:opacity-100 transition-opacity">
        <div className="absolute left-1/3 top-0 h-120 w-120 -translate-x-1/2 rounded-full bg-amber-500/8 blur-[160px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl 2xl:max-w-[1820px] flex-col gap-6">
        
        {/* 1. TOP FULL-WIDTH HEADER & SEARCH TOOLBAR */}
        <CookbookHeader
          title={activeTitle}
          resultCount={filteredRecipes.length}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hasActiveFilter={hasActiveFilter}
          onResetFilters={handleResetFilters}
          onOpenAddRecipeModal={() => setIsAddModalOpen(true)}
        />

        {/* 2. MAIN 2-COLUMN WORKSPACE (Sidebar & Recipe Grid start at exact same height) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <CookbookSidebar
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
            onOpenAddRecipeModal={() => setIsAddModalOpen(true)}
            totalCount={cookbookRecipes.length}
            myRecipesCount={myRecipesCount}
            favoritesCount={favoritesCount}
            quickCount={quickCount}
            trashCount={trashedRecipes.length}
            mealTypeCounts={mealTypeCounts}
            categoryCounts={categoryCounts}
          />

          {/* RIGHT MAIN WORKSPACE */}
          <div className="flex-1 min-w-0 w-full space-y-5">
            
            {/* Trash Retention Banner when in Trash mode */}
            {isTrashActive && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs sm:text-sm text-rose-800 dark:text-rose-200">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">🗑️</span>
                  <span>Recipes in Trash will be kept for <strong>30 days</strong> before automatic permanent deletion.</span>
                </div>
                {trashedRecipes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleEmptyTrash}
                    className="self-start sm:self-auto rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-rose-500 transition cursor-pointer"
                  >
                    Empty Trash
                  </button>
                )}
              </div>
            )}

            {/* Recipes Grid or List View or Adaptive Empty State */}
            {filteredRecipes.length === 0 ? (
              <CookbookEmptyState
                activeFilter={activeFilter}
                searchQuery={searchQuery}
                hasTotalRecipes={currentDataset.length > 0}
                onResetFilters={handleResetFilters}
                onSelectFilter={setActiveFilter}
                onOpenImportModal={() => setIsImportModalOpen(true)}
              />
            ) : (
              <CookbookGrid
                recipes={filteredRecipes}
                savedRecipeIds={savedRecipeIds}
                viewMode={viewMode}
                isTrashMode={isTrashActive}
                onRemoveSaved={handleRemoveSaved}
                onToggleSave={handleToggleSave}
                onDeleteRecipe={handleRequestDelete}
                onRestoreRecipe={handleRestoreRecipe}
                onAddToGrocery={handleAddToGrocery}
                onQuickPeek={(recipe) => setPeekRecipe(recipe)}
              />
            )}

          </div>

        </div>

      </div>

      {/* ADD RECIPE HUB MODAL OVERLAY */}
      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelectOption={handleSelectAddOption}
      />

      {/* QUICK PEEK MODAL OVERLAY */}
      {peekRecipe && (
        <QuickPeekModal
          recipe={peekRecipe}
          onClose={() => setPeekRecipe(null)}
          onAddToGrocery={handleAddToGrocery}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {recipeToDelete && (
        <DeleteConfirmModal
          recipe={recipeToDelete}
          isPermanent={isTrashActive}
          onConfirm={handleConfirmDelete}
          onCancel={() => setRecipeToDelete(null)}
        />
      )}

      {/* IMPORT RECIPE MODAL OVERLAY (With Back button to Add Hub) */}
      <ImportRecipeModal
        isOpen={isImportModalOpen}
        initialUrl={searchParams.get("url") || ""}
        onClose={() => {
          setIsImportModalOpen(false);
          if (searchParams.get("import") === "true") {
            router.replace("/saved");
          }
        }}
        onBack={() => {
          setIsImportModalOpen(false);
          setIsAddModalOpen(true);
          if (searchParams.get("import") === "true") {
            router.replace("/saved");
          }
        }}
        onRecipeSaved={() => {
          loadData();
          toastSuccess("Imported recipe added to your cookbook! ✨");
        }}
      />

      {/* DEDICATED INLINE VISION SCAN MODAL OVERLAY (With Back button to Add Hub) */}
      <VisionScanModal
        isOpen={isVisionScanOpen}
        onClose={() => setIsVisionScanOpen(false)}
        onBack={() => {
          setIsVisionScanOpen(false);
          setIsAddModalOpen(true);
        }}
        defaultMode={visionScanMode}
        onRecipeExtracted={() => {
          loadData();
          setIsVisionScanOpen(false);
          toastSuccess("Recipe extracted & added to your cookbook! 📷✨");
        }}
      />

      {/* CHOOSE DESTINATION GROCERY LIST MODAL */}
      <AddIngredientsToListModal
        recipe={recipeForGroceryModal}
        isOpen={Boolean(recipeForGroceryModal)}
        onClose={() => setRecipeForGroceryModal(null)}
      />
    </main>
  );
}

export default function SavedRecipesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f5f0] dark:bg-[#12100e] flex items-center justify-center p-8">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <SavedRecipesContent />
    </Suspense>
  );
}
