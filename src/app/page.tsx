"use client";

import { useEffect, useMemo, useState, useDeferredValue } from "react";
import Link from "next/link";
import { getAllRecipes, getAllRecipesWithCloud, getMockRecipes } from "../lib/recipes";
import type { AppRecipe, RecipeSortMode } from "../lib/types";
import HomeHero, { type TasteVibe } from "../components/home/HomeHero";
import RecipeMatchesSection from "../components/home/RecipeMatchesSection";
import ImportRecipeModal from "../components/import/ImportRecipeModal";
import TodaysMenuBanner from "../components/home/TodaysMenuBanner";
import CulinaryAiShowcaseBanner from "../components/home/CulinaryAiShowcaseBanner";
import VisionScanModal from "../components/vision/VisionScanModal";
import ChefProModal from "../components/subscription/ChefProModal";
import { getFilteredRecipes } from "../lib/home";
import { getStoredUserSettings, DEFAULT_USER_SETTINGS, isRecipeDietaryCompatible, type UserSettings } from "../lib/settings";
import { useAuth } from "../contexts/AuthContext";

export default function HomePage() {
  const { isGuest } = useAuth();
  const [hideGuestBanner, setHideGuestBanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [allRecipes, setAllRecipes] = useState<AppRecipe[]>(getMockRecipes);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [activeVibe, setActiveVibe] = useState<TasteVibe>("all");
  const [sortMode, setSortMode] = useState<RecipeSortMode>("alphabetical");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isVisionScanOpen, setIsVisionScanOpen] = useState(false);
  const [isChefProOpen, setIsChefProOpen] = useState(false);
  const [visionMode, setVisionMode] = useState<"recipe" | "meal_analyzer">("meal_analyzer");

  const loadRecipes = async () => {
    const local = getAllRecipes();
    setAllRecipes(local);
    try {
      const combined = await getAllRecipesWithCloud();
      if (combined.length !== local.length || combined.some((r, i) => r.id !== local[i]?.id)) {
        setAllRecipes(combined);
      }
    } catch {}
  };

  useEffect(() => {
    loadRecipes();
    setUserSettings(getStoredUserSettings());

    const handleSettingsUpdate = () => {
      setUserSettings(getStoredUserSettings());
    };

    window.addEventListener("storage", handleSettingsUpdate);
    window.addEventListener("user_settings_updated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("storage", handleSettingsUpdate);
      window.removeEventListener("user_settings_updated", handleSettingsUpdate);
    };
  }, []);

  // Strict Dietary Preferences filtering
  const dietaryFilteredRecipes = useMemo(() => {
    if (!userSettings.strictDietaryFilter || userSettings.dietaryPreferences.length === 0) {
      return allRecipes;
    }
    return allRecipes.filter((recipe) =>
      isRecipeDietaryCompatible(recipe, userSettings.dietaryPreferences),
    );
  }, [allRecipes, userSettings]);

  // Primary filtering by vibe / mood
  const vibeFilteredRecipes = useMemo(() => {
    if (activeVibe === "all") return dietaryFilteredRecipes;

    return dietaryFilteredRecipes.filter((recipe) => {
      if (activeVibe === "quick") {
        return recipe.cookTime !== undefined && recipe.cookTime <= 25;
      }

      if (activeVibe === "protein") {
        const keywords = ["chicken", "beef", "salmon", "egg", "tuna", "pork", "steak", "turkey", "shrimp"];
        return recipe.ingredients.some((ing) =>
          keywords.some((kw) => ing.toLowerCase().includes(kw)),
        );
      }

      if (activeVibe === "vegetarian") {
        const meatWords = ["chicken", "beef", "pork", "bacon", "salmon", "shrimp", "steak", "tuna", "meat"];
        return !recipe.ingredients.some((ing) =>
          meatWords.some((mw) => ing.toLowerCase().includes(mw)),
        );
      }

      if (activeVibe === "family") {
        return (recipe.servings ?? 0) >= 4 || recipe.category === "main-course" || recipe.category === "pasta";
      }

      if (activeVibe === "budget") {
        const staples = ["pasta", "rice", "beans", "potato", "onion", "egg", "canned"];
        return recipe.ingredients.some((ing) =>
          staples.some((s) => ing.toLowerCase().includes(s)),
        );
      }

      return true;
    });
  }, [dietaryFilteredRecipes, activeVibe]);

  // Secondary search and sorting
  const filteredRecipes = useMemo(
    () =>
      getFilteredRecipes(
        vibeFilteredRecipes,
        [],
        deferredSearchTerm,
        false,
        sortMode,
      ),
    [vibeFilteredRecipes, deferredSearchTerm, sortMode],
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 transition-colors duration-300 dark:bg-[#110d0b] dark:text-stone-100 px-4 py-6 sm:px-6 xl:px-10">
      <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1820px] space-y-6">
        
        {/* 1. PROMINENT FULL-WIDTH SEARCH & TASTE VIBES HERO */}
        <HomeHero
          activeVibe={activeVibe}
          onVibeChange={setActiveVibe}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalRecipes={allRecipes.length}
          filteredCount={filteredRecipes.length}
          onOpenImport={() => setIsImportModalOpen(true)}
        />

        {/* 2. DYNAMIC 2-COLUMN HUB: TODAY'S MENU & CHEF AI VISION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <TodaysMenuBanner allRecipes={allRecipes} />
          
          <CulinaryAiShowcaseBanner
            onOpenSnapPlate={() => {
              setVisionMode("meal_analyzer");
              setIsVisionScanOpen(true);
            }}
            onOpenScanCookbook={() => {
              setVisionMode("recipe");
              setIsVisionScanOpen(true);
            }}
          />
        </div>

        {/* 4. INSTANT RECIPE MATCHES & DISCOVERY GRID */}
        <RecipeMatchesSection
          filteredRecipes={filteredRecipes}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          activeVibe={activeVibe}
          searchTerm={searchTerm}
        />

      </div>

      {/* IMPORT RECIPE MODAL OVERLAY */}
      <ImportRecipeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onRecipeSaved={() => {
          loadRecipes();
        }}
      />

      {/* VISION SCAN MODAL OVERLAY */}
      <VisionScanModal
        isOpen={isVisionScanOpen}
        onClose={() => setIsVisionScanOpen(false)}
        defaultMode={visionMode}
        onRecipeExtracted={() => {
          loadRecipes();
        }}
      />

      {/* CHEF PRO SUBSCRIPTION MODAL */}
      <ChefProModal
        isOpen={isChefProOpen}
        onClose={() => setIsChefProOpen(false)}
      />

      {/* GUEST PERKS FLOATING PROMPT (Positioned bottom-left so it never collides with Grocery List drawer) */}
      {isGuest && !hideGuestBanner && (
        <aside aria-label="Guest session reminder" className="fixed bottom-6 left-4 sm:left-6 z-30 max-w-sm rounded-2xl border border-slate-200 bg-white/95 dark:border-white/10 dark:bg-[#16120f]/95 backdrop-blur-xl p-3.5 shadow-2xl text-slate-900 dark:text-stone-100 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-stone-100">Cooking as a Guest?</p>
              <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate">Create a free account to sync recipes across devices.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 font-bold px-3 py-1 text-xs transition shadow-xs cursor-pointer"
            >
              Sign In
            </Link>
            <button
              type="button"
              onClick={() => setHideGuestBanner(true)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs p-1 cursor-pointer"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
