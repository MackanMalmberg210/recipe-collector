"use client";

import Link from "next/link";

export default function SavedHero() {
  return (
    <header className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#17120f]/90 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-white/3 md:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-8%] top-[-20%] h-72 w-72 rounded-full bg-amber-400/12 blur-3xl" />
        <div className="absolute bottom-[-30%] left-[15%] h-72 w-72 rounded-full bg-orange-500/8 blur-3xl" />
      </div>

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.24em] text-amber-100/55">
            Personal cookbook
          </p>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[#fff8ef] md:text-6xl">
            Your recipe collection, beautifully organized.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-300 md:text-lg">
            Save, browse, import and revisit your favorite meals in one polished
            cookbook built around how you actually cook.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
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

          <Link
            href="/"
            className="rounded-2xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-medium text-stone-200 transition hover:bg-white/8"
          >
            Back home
          </Link>
        </div>
      </div>
    </header>
  );
}
