"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { saveRecipeToCloudOrLocal } from "../../lib/recipes";
import { parseIngredientList } from "../../lib/ingredientParser";
import { capitalize } from "../../lib/format";

type ImportRecipeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onRecipeSaved?: (savedRecipe: AppRecipe) => void;
};

const POPULAR_DOMAINS = [
  { name: "Serious Eats", icon: "🍳" },
  { name: "BBC Good Food", icon: "🇬🇧" },
  { name: "NYT Cooking", icon: "📰" },
  { name: "Köket.se", icon: "🇸🇪" },
  { name: "AllRecipes", icon: "🥗" },
  { name: "ICA.se", icon: "🛒" },
];

export default function ImportRecipeModal({
  isOpen,
  onClose,
  onBack,
  onRecipeSaved,
}: ImportRecipeModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [extractedRecipe, setExtractedRecipe] = useState<AppRecipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setUrl("");
      setError("");
      setExtractedRecipe(null);
      setSaveSuccess(false);
      setSavedId(null);
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

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith("http")) {
        setUrl(text.trim());
      }
    } catch {
      // Clipboard permission denied
    }
  };

  const handleExtract = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setExtractedRecipe(null);

    try {
      const response = await fetch("/api/import-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to extract recipe from this URL.");
        return;
      }

      const recipe: AppRecipe = data.recipe;

      if (!recipe.structuredIngredients || recipe.structuredIngredients.length === 0) {
        recipe.structuredIngredients = parseIngredientList(recipe.ingredients);
      }

      setExtractedRecipe(recipe);
    } catch {
      setError("Network error while connecting to the recipe site. Please verify the URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!extractedRecipe) return;

    setIsSaving(true);
    setError("");

    try {
      const cleanedRecipe: AppRecipe = {
        ...extractedRecipe,
        id: extractedRecipe.id || Date.now(),
        origin: "imported",
        sourceUrl: extractedRecipe.sourceUrl || url.trim(),
      };

      const result = await saveRecipeToCloudOrLocal(cleanedRecipe);

      if (!result.success || !result.recipe) {
        setError(result.error || "Failed to save recipe.");
        return;
      }

      const finalRecipe = result.recipe;
      setSavedId(finalRecipe.id);
      setExtractedRecipe(finalRecipe);
      setSaveSuccess(true);
      if (onRecipeSaved) {
        onRecipeSaved(finalRecipe);
      }
    } catch {
      setError("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Solid High-Speed Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-4xl border border-stone-200/90 bg-white text-stone-900 shadow-2xl dark:border-white/10 dark:bg-[#151210] dark:text-stone-100 animate-in zoom-in-95 fade-in duration-200 my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-100 p-5 sm:p-6 dark:border-white/8">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go Back to options"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
                title="Back to Add Recipe options"
              >
                ←
              </button>
            )}

            <span className="text-2xl">🌐</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
                Import Recipe from Web
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Paste any recipe link to extract clean ingredients and steps.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* HERO GUIDE BANNER */}
          {!saveSuccess && !extractedRecipe && (
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Smart Web Extractor
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                    Paste any recipe link. Our engine strips out ads, life stories, and clutter to save pure ingredients and cooking steps.
                  </p>
                </div>
                <div className="shrink-0 text-xs font-bold text-stone-500 dark:text-stone-400 bg-white/60 dark:bg-black/30 border border-stone-200/80 dark:border-white/10 rounded-2xl px-3.5 py-2">
                  ⚡ 100+ Food Sites Supported
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {saveSuccess ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <span className="text-5xl block mb-2">✨</span>

              <h3 className="text-xl font-extrabold text-stone-950 dark:text-stone-50">
                Recipe Saved to Cookbook!
              </h3>

              <p className="mx-auto max-w-sm text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                &ldquo;{extractedRecipe?.title}&rdquo; has been added to your collection with clean structured ingredients.
              </p>

              <div className="pt-2 flex justify-center gap-3">
                {savedId && (
                  <Link
                    href={`/recipes/${savedId}`}
                    onClick={onClose}
                    className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-xs hover:bg-amber-400 transition"
                  >
                    Open Recipe →
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setUrl("");
                    setExtractedRecipe(null);
                    setSaveSuccess(false);
                  }}
                  className="rounded-xl border border-stone-200 bg-stone-50 px-5 py-2.5 text-xs font-semibold text-stone-700 dark:border-white/10 dark:bg-[#1f1a17] dark:text-stone-200 hover:bg-stone-100 cursor-pointer"
                >
                  Import Another
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* URL INPUT BAR */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Recipe Web Address (URL)
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                      🔗
                    </span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                      placeholder="https://www.seriouseats.com/..."
                      className="h-11 w-full rounded-2xl border border-stone-300 bg-stone-50 pl-10 pr-12 text-xs sm:text-sm font-semibold text-stone-950 placeholder:font-normal placeholder:text-stone-400 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/20 dark:bg-[#221d19] dark:text-stone-50 dark:placeholder:text-stone-500 dark:focus:border-amber-400 dark:focus:bg-[#221d19] dark:focus:ring-amber-400/25"
                    />

                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      title="Paste from clipboard"
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7.5 w-7.5 items-center justify-center rounded-xl bg-stone-200/80 text-stone-700 hover:bg-stone-300 dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/20 transition cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleExtract}
                    disabled={loading || !url.trim()}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-amber-500 px-5 text-xs font-bold text-stone-950 shadow-xs transition hover:bg-amber-400 disabled:opacity-50 active:scale-[0.98] cursor-pointer shrink-0"
                  >
                    {loading ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
                        <span>Extracting...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Extract</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SUPPORTED DOMAINS PILLS */}
              {!extractedRecipe && (
                <div className="pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2">
                    Works seamlessly with:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_DOMAINS.map((domain, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-xl border border-stone-200/80 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600 dark:border-white/6 dark:bg-white/4 dark:text-stone-300"
                      >
                        <span>{domain.icon}</span>
                        <span>{domain.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ERROR NOTIFICATION */}
              {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-800 dark:text-rose-200">
                  {error}
                </div>
              )}

              {/* EXTRACTED RECIPE PREVIEW */}
              {extractedRecipe && (
                <div className="space-y-4 rounded-2xl border border-stone-200/90 bg-stone-50/70 p-4 dark:border-white/8 dark:bg-[#1a1614] animate-in fade-in duration-200">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-stone-200 dark:bg-stone-800">
                      {extractedRecipe.image ? (
                        <img
                          src={extractedRecipe.image}
                          alt={extractedRecipe.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          🍲
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span>✓</span>
                        <span>Recipe Ready</span>
                      </span>

                      <h4 className="text-base font-bold text-stone-950 dark:text-stone-50 line-clamp-1">
                        {extractedRecipe.title}
                      </h4>

                      <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-stone-500 dark:text-stone-400">
                        {extractedRecipe.cookTime && (
                          <span className="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                            <span>⏱</span>
                            <span>{extractedRecipe.cookTime}m</span>
                          </span>
                        )}
                        {(extractedRecipe.servingsText || extractedRecipe.servings) && (
                          <span>👥 {extractedRecipe.servingsText || `${extractedRecipe.servings} servings`}</span>
                        )}
                        {extractedRecipe.category && (
                          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                            {capitalize(extractedRecipe.category)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clean Ingredients Overview */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">
                      🥕 Extracted Ingredients ({extractedRecipe.ingredients.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {extractedRecipe.structuredIngredients?.slice(0, 8).map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-200/80 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-800 dark:border-white/8 dark:bg-[#221c19] dark:text-stone-200"
                        >
                          {item.amount && <strong className="text-amber-600 dark:text-amber-400">{item.amount}</strong>}
                          {item.unit && <span>{item.unit}</span>}
                          <span>{item.name}</span>
                        </span>
                      ))}
                      {extractedRecipe.ingredients.length > 8 && (
                        <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          +{extractedRecipe.ingredients.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Save CTA */}
                  <div className="pt-2 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setExtractedRecipe(null)}
                      className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 dark:border-white/10 dark:bg-transparent dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-stone-950 shadow-xs hover:bg-amber-400 transition cursor-pointer active:scale-[0.98]"
                    >
                      {isSaving ? "Saving..." : "Add to My Cookbook ✨"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
}
