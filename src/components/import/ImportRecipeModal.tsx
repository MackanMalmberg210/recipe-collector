"use client";

import { useState, useEffect, useCallback } from "react";
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
  initialUrl?: string;
};

const SAMPLE_RECIPES = [
  {
    name: "Classic Lasagne (BBC Good Food)",
    url: "https://www.bbcgoodfood.com/recipes/classic-lasagne",
  },
  {
    name: "Chicken Shawarma (RecipeTin Eats)",
    url: "https://www.recipetineats.com/chicken-sharwama-middle-eastern/",
  },
  {
    name: "Chewy Cookies (Sally's Baking)",
    url: "https://sallysbakingaddiction.com/chewy-chocolate-chip-cookies/",
  },
];

const SAMPLE_RAW_TEXT = `Grandma's Lemon Garlic Chicken
4 chicken breasts
2 tbsp olive oil
3 cloves garlic, minced
Juice of 2 fresh lemons
1 tsp dried oregano
Salt and black pepper to taste

1. Season chicken breasts on both sides with salt and pepper.
2. Heat olive oil in a skillet over medium-high heat. Sear chicken 6 minutes per side until golden.
3. Whisk lemon juice, garlic, and oregano together. Pour over chicken and simmer 5 minutes.
4. Serves 4 with fluffy rice!`;

const POPULAR_CHANNELS = [
  "BBC Good Food",
  "RecipeTin Eats",
  "Sally's Baking Addiction",
  "Pinch of Yum",
  "Love & Lemons",
  "Minimalist Baker",
  "Smitten Kitchen",
  "1,000+ Food Blogs",
];

export default function ImportRecipeModal({
  isOpen,
  onClose,
  onBack,
  onRecipeSaved,
  initialUrl = "",
}: ImportRecipeModalProps) {
  const [importMode, setImportMode] = useState<"url" | "text">("url");
  const [url, setUrl] = useState(initialUrl);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [extractedRecipe, setExtractedRecipe] = useState<AppRecipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);

  // Check clipboard on open for quick paste hint
  useEffect(() => {
    if (!isOpen) return;

    if (navigator?.clipboard?.readText) {
      navigator.clipboard
        .readText()
        .then((text) => {
          const match = text ? text.match(/https?:\/\/[^\s]+/i) : null;
          if (match && match[0] && match[0] !== url) {
            setClipboardUrl(match[0]);
          }
        })
        .catch(() => {
          // Clipboard read not permitted
        });
    }
  }, [isOpen, url]);

  // Sync initialUrl or reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialUrl && !url) {
        setUrl(initialUrl);
        handleExtract(initialUrl);
      }
    } else {
      setUrl("");
      setRawText("");
      setImportMode("url");
      setError("");
      setStatusMessage("");
      setExtractedRecipe(null);
      setSaveSuccess(false);
      setSavedId(null);
      setLoadingStep(1);
      setClipboardUrl(null);
    }
  }, [isOpen, initialUrl]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleExtract = useCallback(
    async (urlToExtract?: string) => {
      const targetUrl = (urlToExtract || url).trim();
      if (!targetUrl) return;

      setLoading(true);
      setError("");
      setExtractedRecipe(null);
      setLoadingStep(1);
      setStatusMessage("Connecting to recipe site...");

      const t1 = setTimeout(() => {
        setLoadingStep(2);
        setStatusMessage("Stripping ads & extracting ingredients...");
      }, 900);

      const t2 = setTimeout(() => {
        setLoadingStep(3);
        setStatusMessage("Structuring measurements and cooking instructions...");
      }, 1800);

      try {
        const response = await fetch("/api/import-recipe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: targetUrl }),
        });

        clearTimeout(t1);
        clearTimeout(t2);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to extract recipe from this link. Please verify the URL.");
          return;
        }

        const recipe: AppRecipe = data.recipe;

        if (!recipe.structuredIngredients || recipe.structuredIngredients.length === 0) {
          recipe.structuredIngredients = parseIngredientList(recipe.ingredients);
        }

        setExtractedRecipe(recipe);
      } catch {
        setError("Network error while connecting to recipe site. Please verify the URL.");
      } finally {
        setLoading(false);
        setStatusMessage("");
        setLoadingStep(1);
      }
    },
    [url]
  );

  const handleExtractText = useCallback(
    async (textToExtract?: string) => {
      const targetText = (textToExtract || rawText).trim();
      if (!targetText) return;

      setLoading(true);
      setError("");
      setExtractedRecipe(null);
      setLoadingStep(1);
      setStatusMessage("Reading recipe notes & culinary content...");

      const t1 = setTimeout(() => {
        setLoadingStep(2);
        setStatusMessage("Categorizing ingredients, meal type & timings...");
      }, 900);

      const t2 = setTimeout(() => {
        setLoadingStep(3);
        setStatusMessage("Building structured cooking steps with AI...");
      }, 1800);

      try {
        const response = await fetch("/api/import-recipe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: targetText }),
        });

        clearTimeout(t1);
        clearTimeout(t2);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Could not parse a recipe from this text. Please ensure it contains ingredients or cooking steps.");
          return;
        }

        const recipe: AppRecipe = data.recipe;

        if (!recipe.structuredIngredients || recipe.structuredIngredients.length === 0) {
          recipe.structuredIngredients = parseIngredientList(recipe.ingredients);
        }

        setExtractedRecipe(recipe);
      } catch {
        setError("Network error while communicating with AI parser. Please try again.");
      } finally {
        setLoading(false);
        setStatusMessage("");
        setLoadingStep(1);
      }
    },
    [rawText]
  );

  const handleSave = useCallback(async () => {
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
        setError(result.error || "Failed to save recipe to your collection.");
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
  }, [extractedRecipe, url, onRecipeSaved]);

  // Handle keyboard shortcuts (ESC to close, Enter to save when recipe preview is ready)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
      if (e.key === "Enter" && isOpen && extractedRecipe && !isSaving && !saveSuccess) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, extractedRecipe, isSaving, saveSuccess, handleSave]);

  if (!isOpen) return null;

  const handlePasteClipboardUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const match = text ? text.match(/https?:\/\/[^\s]+/i) : null;
      if (match && match[0]) {
        setUrl(match[0]);
        setClipboardUrl(null);
      }
    } catch {
      // Permission denied or unavailable
    }
  };

  const handlePasteClipboardText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text.trim());
      }
    } catch {
      // Permission denied or unavailable
    }
  };

  const handleUseSampleUrl = (sampleUrl: string) => {
    setUrl(sampleUrl);
    handleExtract(sampleUrl);
  };

  const handleUseSampleText = () => {
    setRawText(SAMPLE_RAW_TEXT);
    handleExtractText(SAMPLE_RAW_TEXT);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* High-Contrast Backdrop with subtle ambient blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Floating Studio Modal Box */}
      <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-stone-200/90 bg-[#faf8f5] text-stone-900 shadow-[0_25px_70px_rgba(0,0,0,0.4)] dark:border-[#2e2722] dark:border-t-amber-500/30 dark:bg-[#181513] dark:text-[#fafaf9] animate-in zoom-in-95 fade-in duration-200 my-auto">
        
        {/* Subtle Top Ambient Amber Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-amber-500/10 blur-3xl" />

        {/* Modal Header Bar */}
        <div className="relative flex items-center justify-between border-b border-stone-200/70 px-6 py-5 dark:border-[#2e2722]/80">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go back to options"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:border-[#2e2722] dark:bg-[#221e1b] dark:text-[#d6d3d1] dark:hover:bg-[#2a2420] dark:hover:text-white transition cursor-pointer"
                title="Back to options"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}

            <svg className="h-6 w-6 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight text-stone-950 dark:text-[#fafaf9]">
                  Smart Recipe Studio
                </h2>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  AI Importer
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-[#a8a29e]">
                Extract clean recipes from web links or paste unorganized recipe notes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-200/60 hover:text-stone-800 dark:hover:bg-[#24201c] dark:hover:text-white transition cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="relative p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* SUCCESS STATE */}
          {saveSuccess ? (
            <div className="py-10 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex justify-center">
                <svg className="h-12 w-12 text-emerald-500 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight text-stone-950 dark:text-[#fafaf9]">
                  Recipe Saved to Your Cookbook!
                </h3>
                <p className="mx-auto max-w-md text-xs sm:text-sm text-stone-600 dark:text-[#d6d3d1]">
                  &ldquo;{extractedRecipe?.title}&rdquo; is now stored with clean ingredients, scalable servings, and step-by-step directions.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                {savedId && (
                  <Link
                    href={`/recipes/${savedId}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-6 py-3 text-xs sm:text-sm transition active:scale-95 cursor-pointer"
                  >
                    <span>Open Recipe</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setUrl("");
                    setRawText("");
                    setExtractedRecipe(null);
                    setSaveSuccess(false);
                    setSavedId(null);
                  }}
                  className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-stone-700 dark:border-[#2e2722] dark:bg-[#221e1b] dark:text-[#d6d3d1] hover:bg-stone-100 dark:hover:bg-[#2a2420] transition cursor-pointer active:scale-95"
                >
                  Import Another Recipe
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STUDIO MODE TABS: URL vs RAW TEXT */}
              {!extractedRecipe && !loading && (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-1 rounded-2xl bg-stone-200/70 p-1 dark:bg-[#221e1b]">
                    <button
                      type="button"
                      onClick={() => {
                        setImportMode("url");
                        setError("");
                      }}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                        importMode === "url"
                          ? "bg-white text-stone-950 shadow-xs dark:bg-[#181513] dark:text-[#fafaf9]"
                          : "text-stone-600 hover:text-stone-950 dark:text-[#a8a29e] dark:hover:text-[#fafaf9]"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>Web Link (URL)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImportMode("text");
                        setError("");
                      }}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                        importMode === "text"
                          ? "bg-white text-stone-950 shadow-xs dark:bg-[#181513] dark:text-[#fafaf9]"
                          : "text-stone-600 hover:text-stone-950 dark:text-[#a8a29e] dark:hover:text-[#fafaf9]"
                      }`}
                    >
                      <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Paste Text / Notes</span>
                    </button>
                  </div>

                  {/* Mode Helper Badge */}
                  <span className="hidden sm:inline-block text-[11px] font-semibold text-stone-400 dark:text-[#78716c]">
                    {importMode === "url" ? "Extracts from 1000+ sites" : "Auto-categorized by AI"}
                  </span>
                </div>
              )}

              {/* MODE 1: WEB URL EXTRACTION */}
              {importMode === "url" && !extractedRecipe && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-[#a8a29e]">
                      Paste Recipe URL
                    </label>

                    {/* Clipboard Quick-Paste Helper Pill */}
                    {clipboardUrl && !url && (
                      <button
                        type="button"
                        onClick={() => {
                          setUrl(clipboardUrl);
                          setClipboardUrl(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>Paste copied link</span>
                      </button>
                    )}
                  </div>

                  {/* Tactile Omnibar Container */}
                  <div className="relative flex items-center rounded-2xl border border-stone-300 bg-white p-1.5 shadow-xs transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-[#2e2722] dark:bg-[#221e1b] dark:focus-within:border-amber-400 dark:focus-within:ring-amber-400/20">
                    <div className="pl-3.5 pr-2 text-stone-400 dark:text-[#78716c]">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>

                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                      placeholder="https://www.bbcgoodfood.com/recipes/... or food blog link"
                      className="h-11 flex-1 bg-transparent pr-2 text-xs sm:text-sm font-semibold text-stone-950 placeholder:font-normal placeholder:text-stone-400 outline-none dark:text-[#fafaf9] dark:placeholder-[#78716c]"
                    />

                    {/* Inline Paste Button */}
                    <button
                      type="button"
                      onClick={handlePasteClipboardUrl}
                      title="Paste from clipboard"
                      className="mr-1.5 flex h-8 px-2.5 items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 text-[11px] font-bold text-stone-700 hover:bg-stone-200 dark:border-[#2e2722] dark:bg-[#181513] dark:text-[#d6d3d1] dark:hover:bg-[#2a2420] transition cursor-pointer"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Paste</span>
                    </button>

                    {/* Signature Orange Extract CTA */}
                    <button
                      type="button"
                      onClick={() => handleExtract()}
                      disabled={loading || !url.trim()}
                      className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-5 text-xs sm:text-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
                          <span>Extracting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Extract</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Example Links Quick Helper */}
                  {!loading && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] font-semibold text-stone-400 dark:text-[#78716c]">
                        Try a sample:
                      </span>
                      {SAMPLE_RECIPES.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleUseSampleUrl(sample.url)}
                          className="rounded-lg border border-stone-200 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-stone-600 hover:border-amber-500/40 hover:text-amber-700 dark:border-[#2e2722] dark:bg-[#221e1b] dark:text-[#d6d3d1] dark:hover:border-amber-400/40 dark:hover:text-amber-300 transition cursor-pointer"
                        >
                          {sample.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: PASTE RAW RECIPE TEXT / NOTES */}
              {importMode === "text" && !extractedRecipe && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-[#a8a29e]">
                      Paste Recipe Text, Email, or Notes
                    </label>

                    <button
                      type="button"
                      onClick={handlePasteClipboardText}
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[11px] font-bold text-stone-700 hover:bg-stone-200 dark:border-[#2e2722] dark:bg-[#221e1b] dark:text-[#d6d3d1] dark:hover:bg-[#2a2420] transition cursor-pointer"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Paste clipboard text</span>
                    </button>
                  </div>

                  {/* Textarea Omnibar */}
                  <div className="relative rounded-2xl border border-stone-300 bg-white p-3 shadow-xs transition focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-[#2e2722] dark:bg-[#221e1b] dark:focus-within:border-amber-400 dark:focus-within:ring-amber-400/20">
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      rows={5}
                      placeholder="Paste ingredients, cooking steps, or unformatted text from a food caption, family email, or forum..."
                      className="w-full bg-transparent text-xs sm:text-sm font-medium text-stone-950 placeholder:font-normal placeholder:text-stone-400 outline-none resize-y min-h-[120px] dark:text-[#fafaf9] dark:placeholder-[#78716c]"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-[#2e2722]/80">
                      <button
                        type="button"
                        onClick={handleUseSampleText}
                        className="rounded-lg border border-stone-200 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-stone-600 hover:border-amber-500/40 hover:text-amber-700 dark:border-[#2e2722] dark:bg-[#181513] dark:text-[#d6d3d1] dark:hover:text-amber-300 transition cursor-pointer"
                      >
                        Try sample notes
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExtractText()}
                        disabled={loading || !rawText.trim()}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-6 text-xs sm:text-sm transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-950 border-t-transparent" />
                            <span>Structuring with AI...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>Structure with AI ✨</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC EXTRACTION PROGRESS */}
              {loading && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 text-center space-y-3 dark:border-amber-400/20 dark:bg-[#1f1b18] animate-in fade-in duration-200">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      {statusMessage || "Analyzing recipe..."}
                    </span>
                  </div>

                  {/* Step indicators */}
                  <div className="grid grid-cols-3 gap-2 max-w-md mx-auto pt-1">
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        loadingStep >= 1 ? "bg-amber-500" : "bg-stone-200 dark:bg-stone-800"
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        loadingStep >= 2 ? "bg-amber-500" : "bg-stone-200 dark:bg-stone-800"
                      }`}
                    />
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        loadingStep >= 3 ? "bg-amber-500" : "bg-stone-200 dark:bg-stone-800"
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* ERROR NOTIFICATION */}
              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-xs font-semibold text-rose-800 dark:text-rose-200 animate-in fade-in">
                  <svg className="h-4 w-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* EDITORIAL RECIPE BENTO PREVIEW CARD */}
              {extractedRecipe && !loading && (
                <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-md dark:border-[#2e2722] dark:bg-[#221e1b] animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)]">
                    {/* Left: Recipe Hero Image or Icon Badge */}
                    <div className="relative min-h-[160px] md:min-h-full bg-stone-200 dark:bg-stone-900 overflow-hidden">
                      {extractedRecipe.image ? (
                        <img
                          src={extractedRecipe.image}
                          alt={extractedRecipe.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center p-6 text-stone-400 dark:text-stone-600">
                          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}

                      {/* Source Domain Badge Pill */}
                      {extractedRecipe.sourceUrl && (
                        <div className="absolute bottom-2 left-2 rounded-lg bg-black/75 px-2 py-1 text-[10px] font-bold text-stone-200 backdrop-blur-xs">
                          {(() => {
                            try {
                              return new URL(extractedRecipe.sourceUrl).hostname.replace(/^www\./, "");
                            } catch {
                              return "Web Recipe";
                            }
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Right: Recipe Details & Ingredients */}
                    <div className="p-5 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Ready to save</span>
                          </span>

                          {extractedRecipe.category && (
                            <span className="rounded-md bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              {capitalize(extractedRecipe.category)}
                            </span>
                          )}

                          {extractedRecipe.mealType && (
                            <span className="rounded-md bg-stone-200/70 dark:bg-[#181513] px-2 py-0.5 text-[10px] font-bold text-stone-700 dark:text-stone-300">
                              {capitalize(extractedRecipe.mealType)}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-black tracking-tight text-stone-950 dark:text-[#fafaf9] line-clamp-2">
                          {extractedRecipe.title}
                        </h3>

                        {/* Quick Stats Row */}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-stone-600 dark:text-[#d6d3d1]">
                          {extractedRecipe.cookTime && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{extractedRecipe.cookTime} mins</span>
                            </span>
                          )}
                          {(extractedRecipe.servingsText || extractedRecipe.servings) && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span>{extractedRecipe.servingsText || `${extractedRecipe.servings} servings`}</span>
                            </span>
                          )}
                          {Boolean(extractedRecipe.instructions && extractedRecipe.instructions.length > 0) && (
                            <span className="inline-flex items-center gap-1 text-stone-500 dark:text-[#a8a29e]">
                              <span>•</span>
                              <span>{extractedRecipe.instructions?.length} cooking steps</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ingredients Preview */}
                      <div className="space-y-1.5 pt-2 border-t border-stone-100 dark:border-[#2e2722]">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          <span>Ingredients ({extractedRecipe.ingredients.length})</span>
                          <span className="text-[10px] lowercase font-normal text-stone-400">clean structured</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {extractedRecipe.structuredIngredients?.slice(0, 8).map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] font-medium text-stone-800 dark:border-[#2e2722] dark:bg-[#181513] dark:text-[#fafaf9]"
                            >
                              {item.amount && <strong className="text-amber-600 dark:text-amber-400 font-mono">{item.amount}</strong>}
                              {item.unit && <span>{item.unit}</span>}
                              <span>{item.name}</span>
                            </span>
                          ))}
                          {extractedRecipe.ingredients.length > 8 && (
                            <span className="rounded-lg bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                              +{extractedRecipe.ingredients.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className="pt-3 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setExtractedRecipe(null)}
                          className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-stone-600 dark:border-[#2e2722] dark:bg-[#181513] dark:text-[#d6d3d1] hover:bg-stone-100 dark:hover:bg-[#2a2420] transition cursor-pointer"
                        >
                          Clear
                        </button>

                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-5 py-2.5 text-xs sm:text-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <svg className="h-4 w-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{isSaving ? "Saving..." : "Save to Cookbook (Enter ↵)"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* THREE FEATURE HIGHLIGHTS (When in Empty State) */}
              {!extractedRecipe && !loading && (
                <div className="pt-4 border-t border-stone-200/80 dark:border-[#2e2722]/80 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Feature 1 */}
                    <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 dark:border-[#2e2722] dark:bg-[#221e1b]/70 space-y-1">
                      <div className="text-amber-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h4 className="text-xs font-bold text-stone-950 dark:text-[#fafaf9]">
                        Instant Recipe Parsing
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-[#a8a29e] leading-snug">
                        Directly extracts ingredients, timings, and cooking instructions.
                      </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 dark:border-[#2e2722] dark:bg-[#221e1b]/70 space-y-1">
                      <div className="text-amber-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 className="text-xs font-bold text-stone-950 dark:text-[#fafaf9]">
                        Pure Recipe, Zero Ads
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-[#a8a29e] leading-snug">
                        Strips 4,000 words of blog stories and popup banners automatically.
                      </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 dark:border-[#2e2722] dark:bg-[#221e1b]/70 space-y-1">
                      <div className="text-amber-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <h4 className="text-xs font-bold text-stone-950 dark:text-[#fafaf9]">
                        Structured Grocery Data
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-[#a8a29e] leading-snug">
                        Isolates quantities and units so you can add items straight to your cart.
                      </p>
                    </div>
                  </div>

                  {/* Channel support pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-[#78716c] mr-1">
                      Supports:
                    </span>
                    {POPULAR_CHANNELS.map((ch, i) => (
                      <span
                        key={i}
                        className="rounded-lg border border-stone-200 bg-stone-100/70 px-2 py-0.5 text-[11px] font-semibold text-stone-600 dark:border-[#2e2722] dark:bg-[#221e1b] dark:text-[#d6d3d1]"
                      >
                        {ch}
                      </span>
                    ))}
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
