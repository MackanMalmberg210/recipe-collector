"use client";

type SavedStatsProps = {
  savedCount: number;
  importedCount: number;
  userCount: number;
  totalCount: number;
};

type StatCardProps = {
  label: string;
  value: number;
  helper: string;
  icon: string;
  accent?: string;
};

function StatCard({ label, value, helper, icon }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:border-amber-500/30 dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] dark:hover:border-white/16">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {label}
        </p>
        <span className="text-base opacity-80">{icon}</span>
      </div>

      <p className="mt-2 text-3xl font-black tracking-tight text-stone-950 dark:text-stone-50">
        {value}
      </p>

      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
        {helper}
      </p>
    </div>
  );
}

export default function SavedStats({
  savedCount,
  importedCount,
  userCount,
  totalCount,
}: SavedStatsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total recipes"
        value={totalCount}
        helper="Everything in your cookbook."
        icon="📚"
      />
      <StatCard
        label="Saved picks"
        value={savedCount}
        helper="Recipes marked for later."
        icon="🔖"
      />
      <StatCard
        label="Created by you"
        value={userCount}
        helper="Your own personal recipes."
        icon="👨‍🍳"
      />
      <StatCard
        label="Imported"
        value={importedCount}
        helper="Recipes from external links."
        icon="🌐"
      />
    </section>
  );
}
