import Link from "next/link";
import type { AppRecipe } from "../../lib/types";
import type { WeekDay } from "../../lib/planner";
import { formatWeekDay } from "../../lib/planner";

type PlannedRecipeSummary = {
  day: WeekDay;
  recipe: AppRecipe;
};

type PlannerPreviewSectionProps = {
  plannedMealsCount: number;
  daysRemaining: number;
  plannedRecipes: PlannedRecipeSummary[];
};

export default function PlannerPreviewSection({
  plannedMealsCount,
  daysRemaining,
  plannedRecipes,
}: PlannerPreviewSectionProps) {
  return (
    <section id="planner-preview" className="mb-12 scroll-mt-28">
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
          Meal planner
        </p>
        <h2 className="text-3xl font-semibold text-stone-50">
          This week’s plan
        </h2>
        <p className="mt-3 max-w-2xl text-stone-400">
          Keep track of your weekly meals and jump back into what you plan to
          cook next.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-4xl border border-white/8 bg-stone-900/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-stone-500">
                Planner status
              </p>
              <h3 className="mt-2 text-xl font-semibold text-stone-50">
                Weekly overview
              </h3>
              <p className="mt-2 text-sm text-stone-400">
                See how much of your week is already planned.
              </p>
            </div>

            <Link
              href="/planner"
              className="shrink-0 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20"
            >
              Open planner
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-white/6 bg-[#151311] p-4">
              <p className="text-sm text-stone-400">Planned meals</p>
              <p className="mt-2 text-2xl font-semibold text-stone-50">
                {plannedMealsCount}
              </p>
            </div>

            <div className="rounded-3xl border border-white/6 bg-[#151311] p-4">
              <p className="text-sm text-stone-400">Days remaining</p>
              <p className="mt-2 text-2xl font-semibold text-stone-50">
                {daysRemaining}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm text-stone-400">
              <span>Week progress</span>
              <span>{plannedMealsCount} / 7</span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-stone-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${Math.round((plannedMealsCount / 7) * 100)}%`,
                }}
              />
            </div>
          </div>
        </section>

        <section className="rounded-4xl border border-white/8 bg-stone-900/80 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm">
          <div className="mb-5">
            <p className="text-sm font-medium text-stone-500">Planned meals</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-50">
              Coming up next
            </h3>
            <p className="mt-2 text-sm text-stone-400">
              A quick preview of meals already added to this week.
            </p>
          </div>

          {plannedRecipes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-700 bg-[#151311] p-6">
              <p className="text-sm text-stone-400">
                You haven’t planned any meals yet. Open the planner to build
                your week.
              </p>

              <Link
                href="/planner"
                className="mt-4 inline-flex rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-emerald-400"
              >
                Start planning
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {plannedRecipes.map(({ day, recipe }) => (
                <Link
                  key={`${day}-${recipe.id}`}
                  href={`/recipes/${recipe.id}`}
                  className="flex items-center gap-4 rounded-3xl border border-white/6 bg-[#151311] p-4 transition hover:-translate-y-0.5 hover:border-white/10 hover:bg-[#1a1714]"
                >
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="h-20 w-20 rounded-2xl object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-stone-800 px-2 py-1 text-xs text-stone-300">
                        {formatWeekDay(day)}
                      </span>

                      {recipe.origin === "imported" && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-200">
                          Imported
                        </span>
                      )}

                      {recipe.origin === "user" && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
                          Your recipe
                        </span>
                      )}
                    </div>

                    <h4 className="mt-2 truncate text-base font-semibold text-stone-50">
                      {recipe.title}
                    </h4>

                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-400">
                      <span>
                        ⏱{" "}
                        {recipe.cookTime !== undefined
                          ? `${recipe.cookTime} min`
                          : "—"}
                      </span>
                      <span>🥕 {recipe.ingredients.length} ingredients</span>
                      <span>
                        🔥{" "}
                        {recipe.calories !== undefined
                          ? `${recipe.calories} kcal`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
