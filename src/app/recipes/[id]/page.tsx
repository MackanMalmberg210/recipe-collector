"use client";

import { useEffect, useState } from "react";
import RecipeDetailedView from "../../../components/RecipeDetailedView";
import { getAllRecipes } from "../../../lib/recipes";
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
    const loadRecipe = async () => {
      const resolvedParams = await params;
      const recipeId = Number(resolvedParams.id);

      if (Number.isNaN(recipeId)) {
        setRecipe(null);
        setLoading(false);
        return;
      }

      const allRecipes = getAllRecipes();
      const foundRecipe = allRecipes.find((r) => r.id === recipeId) ?? null;

      setRecipe(foundRecipe);
      setLoading(false);
    };

    loadRecipe();
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Loading recipe...
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen bg-black p-6 text-white">
        Recipe not found
      </main>
    );
  }

  return <RecipeDetailedView recipe={recipe} />;
}
