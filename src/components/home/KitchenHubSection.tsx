"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import RecipePreviewRow from "./RecipePreviewRow";
import RecipePreviewCard from "./RecipePreviewCard";

type KitchenHubTab = "saved" | "imported" | "recent";

type KitchenHubSectionProps = {
  savedRecipes: AppRecipe[];
  importedRecipes: AppRecipe[];
  recentlyViewedRecipes: AppRecipe[];
  savedRecipeIds: number[];
};

export default function KitchenHubSection({
  savedRecipes,
  importedRecipes,
  recentlyViewedRecipes,
  savedRecipeIds,
}: KitchenHubSectionProps) {
  const [activeTab, setActiveTab] = useState<KitchenHubTab>("saved");

  const tabCounts = {
    saved: savedRecipes.length,
    imported: importedRecipes.length,
    recent: recentlyViewedRecipes.length,
  };

  const activeContent = useMemo(() => {
    switch (activeTab) {
      case "imported":
        return importedRecipes;
      case "recent":
        return recentlyViewedRecipes;
      case "saved":
      default:
        return savedRecipes;
    }
  }, [activeTab, savedRecipes, importedRecipes, recentlyViewedRecipes]);

  return (
    <section id="kitchen-hub" className="mb-12 scroll-mt-28">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
            Kitchen hub
          </p>
          <h2 className="text-3xl font-semibold text-stone-50">
            Your recipes, all in one place
          </h2>
          <p className="mt-3 max-w-2xl text-stone-400">
            Switch between saved recipes, imported meals, and recently viewed
            dishes without scrolling through multiple separate sections.
          </p>
        </div>

        <Link
          href="/saved"
          className="inline-flex w-fit rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-stone-100 transition hover:bg-white/10"
        >
          Open full collection
        </Link>
      </div>

      <div className="rounded-4xl border border-white/8 bg-stone-900/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex w-full flex-wrap gap-2 rounded-2xl border border-white/6 bg-[#151311] p-2 lg:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === "saved"
                  ? "bg-emerald-500 text-stone-950"
                  : "text-stone-300 hover:bg-white/6"
              }`}
            >
              Saved ({tabCounts.saved})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("imported")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === "imported"
                  ? "bg-amber-500 text-stone-950"
                  : "text-stone-300 hover:bg-white/6"
              }`}
            >
              Imported ({tabCounts.imported})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recent")}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === "recent"
                  ? "bg-stone-200 text-stone-950"
                  : "text-stone-300 hover:bg-white/6"
              }`}
            >
              Recently viewed ({tabCounts.recent})
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:w-90">
            <div className="rounded-[1.25rem] border border-white/6 bg-[#151311] p-3">
              <p className="text-xs text-stone-400">Saved</p>
              <p className="mt-1 text-lg font-semibold text-stone-50">
                {tabCounts.saved}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-white/6 bg-[#151311] p-3">
              <p className="text-xs text-stone-400">Imported</p>
              <p className="mt-1 text-lg font-semibold text-stone-50">
                {tabCounts.imported}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-white/6 bg-[#151311] p-3">
              <p className="text-xs text-stone-400">Recent</p>
              <p className="mt-1 text-lg font-semibold text-stone-50">
                {tabCounts.recent}
              </p>
            </div>
          </div>
        </div>

        {activeTab === "recent" ? (
          recentlyViewedRecipes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-700 bg-[#151311] p-6">
              <p className="text-sm text-stone-400">
                No recently viewed recipes yet. Open a recipe to see it here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {activeContent.map((recipe) => (
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
          )
        ) : activeContent.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-700 bg-[#151311] p-6">
            <p className="text-sm text-stone-400">
              {activeTab === "saved" &&
                "You haven’t saved any recipes yet. Save recipes to access them here."}
              {activeTab === "imported" &&
                "You haven’t imported any recipes yet. Import a recipe to see it here."}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              {activeTab === "saved" && (
                <Link
                  href="/"
                  className="inline-flex rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-emerald-400"
                >
                  Discover recipes
                </Link>
              )}

              {activeTab === "imported" && (
                <Link
                  href="/saved?import=true"
                  className="inline-flex rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-xs px-4 py-2 text-sm transition active:scale-95"
                >
                  Import recipe
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeContent.map((recipe) => (
              <RecipePreviewRow
                key={recipe.id}
                recipe={recipe}
                href={`/recipes/${recipe.id}`}
                badges={[
                  ...(activeTab === "saved"
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
      </div>
    </section>
  );
}
