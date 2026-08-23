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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl">
            🍲
          </div>
          <h2 className="text-xl font-bold">Recipe Not Found</h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
            We couldn&apos;t locate this recipe. It may have been deleted or moved.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/saved"
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-xs hover:bg-amber-400 transition"
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
