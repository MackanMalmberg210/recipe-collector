"use client";

import Link from "next/link";

type CookbookEmptyStateProps = {
  hasRecipes: boolean;
};

export default function CookbookEmptyState({
  hasRecipes,
}: CookbookEmptyStateProps) {
  if (!hasRecipes) {
    return (
      <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-[#17120f]/90 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-30%] h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
            No recipes yet
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#fff8ef] md:text-4xl">
            Your cookbook is ready for its first recipe.
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-stone-400">
            Start by creating your own recipe or importing one from a recipe
            page to build a collection that feels personal, useful and easy to
            cook from.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/create"
              className="rounded-2xl bg-[#fff4e2] px-5 py-3 text-sm font-bold text-[#19120e] shadow-sm transition hover:bg-white"
            >
              Create recipe
            </Link>

            <Link
              href="/import"
              className="rounded-2xl border border-amber-100/15 bg-amber-100/6 px-5 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-100/10"
            >
              Import recipe
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-4xl border border-white/10 bg-[#17120f]/90 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.3)] ring-1 ring-white/3">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-100/55">
        No matches found
      </p>

      <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#fff8ef] md:text-4xl">
        No recipes match your current filters.
      </h2>

      <p className="mx-auto mt-4 max-w-xl leading-7 text-stone-400">
        Try searching for another ingredient, changing the source filter, or
        resetting the current filters.
      </p>
    </section>
  );
}
