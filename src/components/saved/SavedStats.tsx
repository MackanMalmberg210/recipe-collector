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
};

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#17120f]/85 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] ring-1 ring-white/3 transition hover:border-amber-100/15 hover:bg-[#1d1713]">
      <p className="text-sm font-medium text-stone-400">{label}</p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-[#fff8ef]">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-stone-500">{helper}</p>
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
      />
      <StatCard
        label="Saved picks"
        value={savedCount}
        helper="Recipes marked for later."
      />
      <StatCard
        label="Imported"
        value={importedCount}
        helper="Recipes from external pages."
      />
      <StatCard
        label="Created by you"
        value={userCount}
        helper="Your own personal recipes."
      />
    </section>
  );
}
