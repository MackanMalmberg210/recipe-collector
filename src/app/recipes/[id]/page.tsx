"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RecipeDetailedView from "../../../components/RecipeDetailedView";
import { getRecipeById } from "../../../lib/recipes";
import type { AppRecipe } from "../../../lib/types";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function RecipePage({ params }: Props) {
  const [recipe, setRecipe] = useState<AppRecipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRecipe = async () => {
      try {
        const resolvedParams = await params;
        const recipeId = Number(resolvedParams.id);

        if (Number.isNaN(recipeId)) {
          if (isMounted) {
            setRecipe(null);
            setLoading(false);
          }
          return;
        }

        const found = await getRecipeById(recipeId);

        if (isMounted) {
          setRecipe(found);
          setLoading(false);
          if (found) {
            document.title = `${found.title} • Recipe Collector`;
          } else {
            document.title = "Recipe Not Found • Recipe Collector";
          }
        }
      } catch (err) {
        console.error("Error loading recipe:", err);
        if (isMounted) {
          setRecipe(null);
          setLoading(false);
        }
      }
    };

    loadRecipe();

    return () => {
      isMounted = false;
    };
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] p-8 text-stone-700 dark:bg-[#0e0c0a] dark:text-stone-300 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-[#151210] border border-stone-200 dark:border-white/10 p-6 shadow-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <span className="text-sm font-semibold">Opening recipe...</span>
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-[#f7f5f0] p-8 text-stone-900 dark:bg-[#0e0c0a] dark:text-stone-100 flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-4 rounded-3xl bg-white dark:bg-[#151210] border border-stone-200 dark:border-white/10 p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Recipe Not Found</h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            We couldn&apos;t locate this recipe. It may have been deleted or moved.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/saved"
              className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] px-5 py-2.5 text-xs transition active:scale-95"
            >
              Browse Cookbook
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <RecipeDetailedView recipe={recipe} />;
}
