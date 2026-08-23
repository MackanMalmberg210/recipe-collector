"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { saveRecipeToCloudOrLocal } from "../../lib/recipes";
import { addItemsToGroceryList } from "../../lib/home";
import { useToast } from "../ui/ToastProvider";

export type VisionMode = "recipe" | "grocery" | "meal_analyzer";

type ChefVisionStudioProps = {
  initialMode?: VisionMode;
  lockMode?: boolean;
  onRecipeExtracted?: (recipe: AppRecipe) => void;
  onCloseModal?: () => void;
};

type NutritionData = {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

type GroceryItem = {
  name: string;
  category?: string;
};

export default function ChefVisionStudio({
  initialMode = "recipe",
  lockMode = false,
  onRecipeExtracted,
  onCloseModal,
}: ChefVisionStudioProps) {
  const { success, error, info } = useToast();

  const [activeMode, setActiveMode] = useState<VisionMode>(initialMode);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStep, setScanStep] = useState<string>("");

  // Extracted Results
  const [extractedRecipe, setExtractedRecipe] = useState<AppRecipe | null>(null);
  const [extractedGroceryItems, setExtractedGroceryItems] = useState<GroceryItem[]>([]);
  const [extractedNutrition, setExtractedNutrition] = useState<NutritionData | null>(null);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [dishName, setDishName] = useState<string>("");
  const [dishDescription, setDishDescription] = useState<string>("");
  const [savedRecipeId, setSavedRecipeId] = useState<number | null>(null);
  const [savedGrocerySuccess, setSavedGrocerySuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      error("Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      // Reset extracted state for new scan
      setExtractedRecipe(null);
      setExtractedGroceryItems([]);
      setExtractedNutrition(null);
      setSavedRecipeId(null);
      setSavedGrocerySuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const startVisionAnalysis = async () => {
    if (!selectedImage) {
      error("Please take a photo or select an image first.");
      return;
    }

    setLoading(true);
    setScanStep("Scanning image with AI Vision...");

    const stepTimer1 = setTimeout(() => {
      setScanStep(
        activeMode === "recipe"
          ? "Recognizing text, amounts & cooking steps..."
          : activeMode === "grocery"
          ? "Extracting handwritten items & categories..."
          : "Identifying ingredients & calculating nutritional macros...",
      );
    }, 1200);

    const stepTimer2 = setTimeout(() => {
      setScanStep(
        activeMode === "meal_analyzer"
          ? "Generating reverse home-cook recipe..."
          : "Structuring culinary data...",
      );
    }, 2400);

    try {
      const res = await fetch("/api/vision-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: selectedImage,
          mode: activeMode,
          userNotes: userNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze image.");
      }

      if (activeMode === "recipe") {
        const recipe: AppRecipe = {
          ...data.recipe,
          image: selectedImage,
        };
        setExtractedRecipe(recipe);
        if (onRecipeExtracted) {
          onRecipeExtracted(recipe);
        }
        success("Recipe extracted with high precision! 📖✨");
      } else if (activeMode === "grocery") {
        setExtractedGroceryItems(data.items || []);
        success(`Extracted ${data.items?.length || 0} grocery items! 🛒`);
      } else if (activeMode === "meal_analyzer") {
        setDishName(data.dishName || "Analyzed Dish");
        setDishDescription(data.description || "");
        setExtractedNutrition(data.nutrition || null);
        setDetectedIngredients(data.detectedIngredients || []);
        if (data.recipe) {
          setExtractedRecipe({
            ...data.recipe,
            image: selectedImage,
          });
        }
        success("Meal identified with nutrition & reverse recipe! 🍽️✨");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      error(e.message || "Vision scan failed. Please try again.");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
      setScanStep("");
    }
  };

  const handleSaveRecipeToCookbook = async () => {
    if (!extractedRecipe) return;

    try {
      const result = await saveRecipeToCloudOrLocal(extractedRecipe);
      if (result.success) {
        setSavedRecipeId(result.recipe?.id ?? extractedRecipe.id);
        success("Recipe saved directly to your cookbook! 📖✨");
      } else {
        error("Failed to save recipe.");
      }
    } catch {
      error("Failed to save recipe.");
    }
  };

  const handleAddScannedItemsToGrocery = () => {
    if (extractedGroceryItems.length === 0) return;

    const names = extractedGroceryItems.map((item) => item.name);
    addItemsToGroceryList(names);
    setSavedGrocerySuccess(true);
    success(`Added ${names.length} items to your grocery list! 🛒`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP MODE SWITCHER (Hidden if single-purpose locked mode) */}
      {!lockMode && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveMode("recipe");
              setExtractedRecipe(null);
              setExtractedGroceryItems([]);
              setExtractedNutrition(null);
            }}
            className={`flex flex-col items-start rounded-2xl p-4 border text-left transition cursor-pointer ${
              activeMode === "recipe"
                ? "border-amber-500 bg-amber-500/10 text-stone-950 dark:text-[#fff8ef] ring-2 ring-amber-500/25"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:bg-[#181310] dark:text-stone-300 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">📖</span>
              <span className="text-sm font-extrabold">Cookbook / Recipe</span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium leading-relaxed">
              Scan cookbook pages, magazines, or handwritten recipe cards.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("grocery");
              setExtractedRecipe(null);
              setExtractedGroceryItems([]);
              setExtractedNutrition(null);
            }}
            className={`flex flex-col items-start rounded-2xl p-4 border text-left transition cursor-pointer ${
              activeMode === "grocery"
                ? "border-amber-500 bg-amber-500/10 text-stone-950 dark:text-[#fff8ef] ring-2 ring-amber-500/25"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:bg-[#181310] dark:text-stone-300 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <span className="text-sm font-extrabold">Paper Grocery List</span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium leading-relaxed">
              Scan handwritten notes or fridge lists into your cart.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode("meal_analyzer");
              setExtractedRecipe(null);
              setExtractedGroceryItems([]);
              setExtractedNutrition(null);
            }}
            className={`flex flex-col items-start rounded-2xl p-4 border text-left transition cursor-pointer ${
              activeMode === "meal_analyzer"
                ? "border-amber-500 bg-amber-500/10 text-stone-950 dark:text-[#fff8ef] ring-2 ring-amber-500/25"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-white/10 dark:bg-[#181310] dark:text-stone-300 dark:hover:bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🍽️</span>
              <span className="text-sm font-extrabold">Snap My Plate</span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium leading-relaxed">
              Estimate calories &amp; generate a reverse recipe from a food photo.
            </span>
          </button>
        </div>
      )}

      {/* 2. PHOTO CAPTURE / UPLOAD ZONE (Flat seamless canvas, NO box inside box) */}
      <div className="space-y-5">
        
        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
          }}
        />
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
          }}
        />

        {!selectedImage ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-300/80 bg-stone-50/50 p-10 text-center transition hover:border-amber-500 hover:bg-amber-500/5 dark:border-white/15 dark:bg-[#181310]/60 dark:hover:border-amber-400/40"
          >
            {/* Pure Standalone Glyph (NO background box container!) */}
            <span className="text-5xl block mb-3 transition-transform duration-200 hover:scale-110">
              {activeMode === "recipe" ? "📖" : activeMode === "grocery" ? "📝" : "🍽️"}
            </span>

            <h3 className="text-lg sm:text-xl font-extrabold text-stone-950 dark:text-[#fff8ef]">
              {activeMode === "recipe"
                ? "Photograph or upload your recipe"
                : activeMode === "grocery"
                ? "Photograph your paper grocery list"
                : "Snap a photo of your plated meal"}
            </h3>

            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-md leading-relaxed">
              Drag and drop an image here, or snap a photo directly using your camera.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-5 py-3 text-xs font-bold text-stone-950 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span>📷</span>
                <span>Open Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-2xl border border-stone-300 bg-white hover:bg-stone-100 px-5 py-3 text-xs font-bold text-stone-800 dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10 transition cursor-pointer shadow-xs active:scale-95"
              >
                <span>🖼️</span>
                <span>Upload Image</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* IMAGE PREVIEW & ACTIONS */}
            <div className="relative aspect-16/9 sm:aspect-21/9 w-full overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 dark:border-white/10">
              <img
                src={selectedImage}
                alt="Selected vision scan"
                className="h-full w-full object-cover"
              />

              {/* SMOOTH NON-FLICKERING SCANNING OVERLAY */}
              {loading && (
                <div className="absolute inset-0 bg-stone-950/75 flex flex-col items-center justify-center p-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-stone-900 border border-amber-500/40 px-5 py-3 shadow-2xl text-white">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                    <span className="text-xs sm:text-sm font-bold text-amber-300">
                      {scanStep}
                    </span>
                  </div>
                </div>
              )}

              {!loading && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="flex items-center gap-1.5 rounded-xl bg-stone-950/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-stone-900 transition cursor-pointer"
                  >
                    <span>✕</span>
                    <span>Retake / Change Photo</span>
                  </button>
                </div>
              )}
            </div>

            {/* CUSTOM NOTES / DIETARY INSTRUCTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                  Optional notes / dietary tweaks
                </label>
                <input
                  type="text"
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder={
                    activeMode === "meal_analyzer"
                      ? "e.g. 'I want the recipe for 2 people' or 'make it dairy-free'"
                      : "e.g. 'Double the garlic' or 'family portion'"
                  }
                  className="w-full rounded-xl border border-stone-300 bg-[#faf7f2] px-3.5 py-2.5 text-xs font-semibold text-stone-900 outline-none focus:border-amber-500 dark:border-white/10 dark:bg-[#1d1713] dark:text-stone-100 placeholder-stone-400"
                />
              </div>

              <button
                type="button"
                onClick={startVisionAnalysis}
                disabled={loading}
                className="w-full sm:w-auto shrink-0 rounded-2xl bg-amber-500 hover:bg-amber-600 px-6 py-3 text-xs sm:text-sm font-black text-stone-950 shadow-md shadow-amber-400/25 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "⚡ Run AI Vision Scan"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. EXTRACTED RESULTS PRESENTATION */}

      {/* A) EXTRACTED RECIPE (Cookbook or Snap My Plate Reverse Recipe) */}
      {extractedRecipe && (
        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-[#16120f] space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
          
          {/* Snap My Plate Nutrition Card if available */}
          {extractedNutrition && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  <span>🍽️</span>
                  <span>Identified Meal: {dishName}</span>
                </span>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                  Estimated Nutrition
                </span>
              </div>

              {dishDescription && (
                <p className="text-xs font-medium text-stone-700 dark:text-stone-300 leading-relaxed">
                  {dishDescription}
                </p>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="rounded-xl border border-amber-500/20 bg-white p-3 text-center dark:bg-[#201813]">
                  <span className="block text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Calories
                  </span>
                  <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                    🔥 {extractedNutrition.calories} kcal
                  </span>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-white p-3 text-center dark:bg-[#201813]">
                  <span className="block text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Protein
                  </span>
                  <span className="text-lg font-black text-stone-900 dark:text-[#fff8ef]">
                    🥩 {extractedNutrition.proteinGrams}g
                  </span>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-white p-3 text-center dark:bg-[#201813]">
                  <span className="block text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Carbohydrates
                  </span>
                  <span className="text-lg font-black text-stone-900 dark:text-[#fff8ef]">
                    🌾 {extractedNutrition.carbsGrams}g
                  </span>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-white p-3 text-center dark:bg-[#201813]">
                  <span className="block text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                    Healthy Fat
                  </span>
                  <span className="text-lg font-black text-stone-900 dark:text-[#fff8ef]">
                    🥑 {extractedNutrition.fatGrams}g
                  </span>
                </div>
              </div>

              {detectedIngredients.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    Key Detected Ingredients:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {detectedIngredients.map((item, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-white/80 dark:bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-transparent"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recipe Details Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4 dark:border-white/10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <span>✓</span>
                <span>
                  {activeMode === "meal_analyzer"
                    ? "Reverse Home-Cook Recipe Ready"
                    : "Scanned Recipe Extracted"}
                </span>
              </span>
              <h2 className="text-2xl font-black text-stone-950 dark:text-[#fff8ef] mt-1">
                {extractedRecipe.title}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                ⏱ {extractedRecipe.cookTime} min • 👥 {extractedRecipe.servings} servings • 🏷️ {extractedRecipe.category}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {savedRecipeId ? (
                <Link
                  href={`/recipes/${savedRecipeId}`}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-black shadow-md transition cursor-pointer"
                >
                  View in Cookbook →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveRecipeToCookbook}
                  className="rounded-2xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-black text-stone-950 shadow-md shadow-amber-400/20 transition cursor-pointer"
                >
                  Save to Cookbook ✨
                </button>
              )}
            </div>
          </div>

          {/* Ingredients & Instructions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ingredients */}
            <div className="rounded-2xl border border-stone-200 bg-[#faf7f2] p-4 dark:border-white/8 dark:bg-[#1d1713] space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                🥕 Ingredients ({extractedRecipe.ingredients.length})
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-800 dark:text-stone-200">
                {extractedRecipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="rounded-2xl border border-stone-200 bg-[#faf7f2] p-4 dark:border-white/8 dark:bg-[#1d1713] space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                📝 Cooking Instructions ({(extractedRecipe.instructions || []).length} steps)
              </h4>
              <ol className="space-y-2 text-xs text-stone-800 dark:text-stone-200">
                {(extractedRecipe.instructions || []).map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-black text-amber-600 shrink-0">{i + 1}.</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* B) EXTRACTED GROCERY ITEMS */}
      {extractedGroceryItems.length > 0 && (
        <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-[#16120f] space-y-5 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4 dark:border-white/10">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <span>✓</span>
                <span>Scanned {extractedGroceryItems.length} Grocery Items</span>
              </span>
              <h3 className="text-xl font-black text-stone-950 dark:text-[#fff8ef] mt-1">
                Paper List OCR Result
              </h3>
            </div>

            {savedGrocerySuccess ? (
              <Link
                href="/groceries"
                className="rounded-2xl bg-emerald-600 text-white px-5 py-2.5 text-xs font-black shadow-md transition"
              >
                Open Grocery List 🛒 →
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleAddScannedItemsToGrocery}
                className="rounded-2xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-black text-stone-950 shadow-md shadow-amber-400/20 transition cursor-pointer"
              >
                Add All to Grocery List 🛒
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {extractedGroceryItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-[#faf7f2] p-3 text-xs dark:border-white/8 dark:bg-[#1d1713]"
              >
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {item.name}
                </span>
                {item.category && (
                  <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-stone-600 border border-stone-200 dark:bg-white/10 dark:text-stone-300 dark:border-transparent">
                    {item.category}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
