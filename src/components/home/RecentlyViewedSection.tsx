import type { AppRecipe } from "../../lib/types";
import RecipePreviewCard from "./RecipePreviewCard";

type RecentlyViewedSectionProps = {
  recentlyViewedRecipes: AppRecipe[];
  savedRecipeIds: number[];
};

export default function RecentlyViewedSection({
  recentlyViewedRecipes,
  savedRecipeIds,
}: RecentlyViewedSectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
          Continue cooking
        </p>
        <h2 className="text-3xl font-semibold text-stone-50">
          Recently viewed
        </h2>
        <p className="mt-3 max-w-2xl text-stone-400">
          Jump back into recipes you recently opened and keep cooking where you
          left off.
        </p>
      </div>

      {recentlyViewedRecipes.length === 0 ? (
        <div className="rounded-4xl border border-white/8 bg-stone-900/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
          <p className="text-sm text-stone-400">
            No recently viewed recipes yet. Open a recipe to see it here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {recentlyViewedRecipes.map((recipe) => (
            <RecipePreviewCard
              key={recipe.id}
              recipe={recipe}
              href={`/recipes/${recipe.id}`}
              badges={[
                { label: "Recently viewed", variant: "default" },
                ...(savedRecipeIds.includes(recipe.id)
                  ? [{ label: "Saved", variant: "success" as const }]
                  : []),
                ...(recipe.origin === "imported"
                  ? [{ label: "Imported", variant: "dark" as const }]
                  : recipe.origin === "user"
                    ? [{ label: "Your recipe", variant: "dark" as const }]
                    : []),
              ]}
            />
          ))}
        </div>
      )}
    </section>
  );
}
