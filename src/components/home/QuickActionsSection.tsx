import Link from "next/link";

type QuickActionsSectionProps = {
  onBrowseMatches: () => void;
  onUpdateIngredients: () => void;
};

const actionPillBase =
  "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-stone-200 backdrop-blur-sm transition hover:bg-white/10 hover:text-stone-50";

export default function QuickActionsSection({
  onBrowseMatches,
  onUpdateIngredients,
}: QuickActionsSectionProps) {
  return (
    <section className="mb-8">
      <div className="rounded-[1.75rem] border border-white/8 bg-stone-900/70 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.16)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">
              Quick access
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-50">
              Jump into the parts of the app you use most
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/create" className={actionPillBase}>
              <span className="text-emerald-300">●</span>
              Create recipe
            </Link>

            <Link href="/import" className={actionPillBase}>
              <span className="text-amber-300">●</span>
              Import recipe
            </Link>

            <Link href="/saved" className={actionPillBase}>
              <span className="text-stone-300">●</span>
              View saved recipes
            </Link>

            <Link href="/planner" className={actionPillBase}>
              <span className="text-amber-200">●</span>
              Meal planner
            </Link>

            <button
              type="button"
              onClick={onUpdateIngredients}
              className={actionPillBase}
            >
              <span className="text-emerald-300">●</span>
              Update pantry
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
