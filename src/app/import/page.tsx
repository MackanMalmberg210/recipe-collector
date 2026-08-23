"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import { saveRecipeToCloudOrLocal } from "../../lib/recipes";
import { useToast } from "../../components/ui/ToastProvider";

function extractUrlFromText(text: string): string {
  if (!text) return "";
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : text.trim();
}

function ImportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error } = useToast();

  const [inputUrl, setInputUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [extractedRecipe, setExtractedRecipe] = useState<AppRecipe | null>(null);
  const [hasStartedAuto, setHasStartedAuto] = useState(false);

  const sharedUrl = searchParams.get("url") || "";
  const sharedText = searchParams.get("text") || "";
  const effectiveUrl = extractUrlFromText(sharedUrl || sharedText);

  // Auto-trigger extraction if launched via Web Share Target (TikTok, Instagram, etc.)
  useEffect(() => {
    if (effectiveUrl && !hasStartedAuto) {
      setHasStartedAuto(true);
      setInputUrl(effectiveUrl);
      handlePerformImport(effectiveUrl);
    }
  }, [effectiveUrl, hasStartedAuto]);

  const handlePerformImport = async (urlToImport: string) => {
    const clean = urlToImport.trim();
    if (!clean) return;

    setLoading(true);
    setStatusMessage("Connecting to recipe source...");

    const isTikTok = clean.includes("tiktok.com");
    const isInstagram = clean.includes("instagram.com");

    const timer = setTimeout(() => {
      setStatusMessage(
        isTikTok || isInstagram
          ? "Extracting video caption & ingredients with AI..."
          : "Parsing culinary ingredients and method...",
      );
    }, 1200);

    try {
      const response = await fetch("/api/import-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: clean }),
      });

      clearTimeout(timer);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract recipe.");
      }

      const recipe: AppRecipe = data.recipe;
      setExtractedRecipe(recipe);

      // Auto-save to user's cookbook
      saveRecipeToCloudOrLocal(recipe);
      success(`"${recipe.title}" saved to your Cookbook! 📖✨`);

      // Smoothly navigate to newly saved recipe
      setTimeout(() => {
        router.push(`/recipes/${recipe.id}`);
      }, 1400);
    } catch (err: any) {
      error(err.message || "Failed to import recipe.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fbf9f5] px-4 py-12 text-stone-900 transition dark:bg-[#0e0c0a] dark:text-[#fff8ef] sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-6">
        
        {/* TOP BRANDING */}
        <div className="text-center space-y-2">
          <Link href="/saved" className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest hover:underline">
            ← Back to Cookbook
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-stone-950 dark:text-stone-50">
            Import Any Recipe
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            Paste any recipe link from TikTok, Instagram, YouTube, BBC, NYT, ICA or food blogs.
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-[#151210]">
          {loading ? (
            <div className="py-10 text-center space-y-4 animate-in fade-in duration-200">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <div className="h-7 w-7 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-950 dark:text-stone-100">
                  {statusMessage || "Analyzing recipe..."}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Using Culinary AI to extract ingredients &amp; cooking steps...
                </p>
              </div>
            </div>
          ) : extractedRecipe ? (
            <div className="text-center space-y-4 py-6 animate-in zoom-in-95">
              <div className="text-4xl">🎉</div>
              <h3 className="text-lg font-extrabold text-stone-950 dark:text-stone-100">
                {extractedRecipe.title}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Successfully extracted &amp; saved! Redirecting to recipe...
              </p>
              <Link
                href={`/recipes/${extractedRecipe.id}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-6 py-3 text-xs sm:text-sm font-bold text-stone-950 shadow-xs transition"
              >
                <span>View Recipe Now</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Recipe or Video Link
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="e.g. https://www.tiktok.com/@chef/video/... or https://bbcgoodfood.com/..."
                  className="flex-1 rounded-2xl border border-stone-300 bg-stone-50/70 px-4 py-3 text-xs sm:text-sm text-stone-900 outline-none placeholder-stone-400 focus:border-amber-500 focus:bg-white dark:border-white/10 dark:bg-white/5 dark:text-stone-100 dark:focus:border-amber-400"
                />

                <button
                  type="button"
                  onClick={() => handlePerformImport(inputUrl)}
                  disabled={!inputUrl.trim()}
                  className="rounded-2xl bg-amber-500 hover:bg-amber-600 px-6 py-3 text-xs sm:text-sm font-bold text-stone-950 shadow-xs transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                >
                  Import Recipe
                </button>
              </div>

              {/* SUPPORTED CHANNELS PILLS */}
              <div className="pt-4 border-t border-stone-100 dark:border-white/5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Works seamlessly with
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {["🎵 TikTok", "📸 Instagram Reels", "📺 YouTube Shorts", "🇬🇧 BBC Good Food", "🇸🇪 Köket.se", "🥗 AllRecipes", "📰 NYT Cooking"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-xl border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-semibold text-stone-600 dark:border-white/8 dark:bg-white/5 dark:text-stone-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

export default function ImportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fbf9f5] dark:bg-[#0e0c0a] flex items-center justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <ImportContent />
    </Suspense>
  );
}
