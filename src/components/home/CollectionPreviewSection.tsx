import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import RecipePreviewRow from "./RecipePreviewRow";

type CollectionPreviewSectionProps = {
  recentImportedRecipes: AppRecipe[];
  savedPreviewRecipes: AppRecipe[];
  savedRecipeIds: number[];
};

export default function CollectionPreviewSection({
  recentImportedRecipes,
  savedPreviewRecipes,
  savedRecipeIds,
}: CollectionPreviewSectionProps) {
  return (
    <section className="mb-12">
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
          Collection
        </p>
        <h2 className="text-3xl font-semibold text-stone-50">
          Recent imports & saved recipes
        </h2>
        <p className="mt-3 max-w-2xl text-stone-400">
          Revisit recipes you imported recently or meals you saved for later.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-4xl border border-white/8 bg-stone-900/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-500">
                Recent imports
              </p>
              <h3 className="mt-2 text-xl font-semibold text-stone-50">
                Latest imported recipes
              </h3>
              <p className="mt-2 text-sm text-stone-400">
                The newest recipes added to your collection.
              </p>
            </div>

            <Link
              href="/saved"
              className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
            >
              View all
            </Link>
          </div>

          {recentImportedRecipes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-700 bg-[#151311] p-6">
              <p className="text-sm text-stone-400">
                No imported recipes yet. Import your first recipe to see it
                here.
              </p>

              <Link
                href="/import"
                className="mt-4 inline-flex rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-emerald-400"
              >
                Import recipe
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentImportedRecipes.map((recipe) => (
                <RecipePreviewRow
                  key={recipe.id}
                  recipe={recipe}
                  href={`/recipes/${recipe.id}`}
                  badges={[{ label: "Imported", variant: "dark" }]}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-4xl border border-white/8 bg-stone-900/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-500">
                Saved recipes
              </p>
              <h3 className="mt-2 text-xl font-semibold text-stone-50">
                Your saved picks
              </h3>
              <p className="mt-2 text-sm text-stone-400">
                Recipes you marked to revisit later.
              </p>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-white/6 bg-[#151311] p-4">
              <p className="text-sm text-stone-400">Saved total</p>
              <p className="mt-2 text-2xl font-semibold text-stone-50">
                {savedRecipeIds.length}
              </p>
            </div>

            <div className="rounded-3xl border border-white/6 bg-[#151311] p-4">
              <p className="text-sm text-stone-400">Imported saved</p>
              <p className="mt-2 text-2xl font-semibold text-stone-50">
                {
                  savedPreviewRecipes.filter(
                    (recipe) => recipe.origin === "imported",
                  ).length
                }
              </p>
            </div>
          </div>

          {savedPreviewRecipes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-700 bg-[#151311] p-6">
              <p className="text-sm text-stone-400">
                You have not saved any recipes yet. Open a recipe and click
                “Save recipe” to add it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPreviewRecipes.map((recipe) => (
                <RecipePreviewRow
                  key={recipe.id}
                  recipe={recipe}
                  href={`/recipes/${recipe.id}`}
                  badges={[
                    { label: "Saved", variant: "success" },
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
      </div>
    </section>
  );
}
