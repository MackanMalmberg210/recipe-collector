import Link from "next/link";

type HomeHeroProps = {
  totalRecipes: number;
  selectedIngredientsCount: number;
  groceryItemsCount: number;
  importedRecipesCount: number;
};

export default function HomeHero({
  totalRecipes,
  selectedIngredientsCount,
  groceryItemsCount,
  importedRecipesCount,
}: HomeHeroProps) {
  return (
    <header className="mb-10">
      <div className="overflow-hidden rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.15),transparent_30%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_35%),linear-gradient(135deg,#1a1612_0%,#120f0d_55%,#0f0d0b_100%)] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] md:p-12">
        <div className="grid gap-10 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Recipe Collector
            </div>

            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-stone-50 md:text-6xl md:leading-[1.05]">
              A smarter home for recipes, meal planning, and everyday cooking.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-300">
              Import recipes, create your own, plan your week, manage groceries,
              and find the best meals based on what you already have at home.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/create"
                className="rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-stone-950 transition hover:bg-emerald-400"
              >
                Create recipe
              </Link>

              <Link
                href="/import"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-stone-100 backdrop-blur-sm transition hover:bg-white/10"
              >
                Import recipe
              </Link>

              <Link
                href="/saved"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-stone-100 backdrop-blur-sm transition hover:bg-white/10"
              >
                View collection
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-sm text-stone-400">Recipes available</p>
              <p className="mt-2 text-3xl font-semibold text-stone-50">
                {totalRecipes}
              </p>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-sm text-stone-400">Pantry ingredients</p>
              <p className="mt-2 text-3xl font-semibold text-stone-50">
                {selectedIngredientsCount}
              </p>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-sm text-stone-400">Grocery items</p>
              <p className="mt-2 text-3xl font-semibold text-stone-50">
                {groceryItemsCount}
              </p>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-sm text-stone-400">Imported recipes</p>
              <p className="mt-2 text-3xl font-semibold text-stone-50">
                {importedRecipesCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
