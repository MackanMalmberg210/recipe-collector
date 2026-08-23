"use client";

import Link from "next/link";

export default function SavedHero() {
  return (
    <header className="relative overflow-hidden rounded-4xl border border-stone-200/90 bg-white p-6 shadow-sm transition duration-300 dark:border-white/[0.08] dark:bg-[#151210] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:p-8">
      {/* Top subtle hairline highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent dark:via-amber-400/20" />

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Personal Cookbook
          </div>

          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50 sm:text-4xl md:text-5xl">
            Your recipe collection, beautifully organized.
          </h1>

          <p className="mt-3 max-w-2xl text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Save, browse, import, and plan your favorite meals in one personal cookbook.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-stone-950 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-stone-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400"
          >
            + Create recipe
          </Link>

          <Link
            href="/import"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-300/90 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-stone-800 shadow-2xs transition hover:bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-200 dark:hover:bg-white/5"
          >
            🌐 Import URL
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-300/90 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-stone-800 shadow-2xs transition hover:bg-stone-100 dark:border-white/10 dark:bg-[#1c1815] dark:text-stone-200 dark:hover:bg-white/5"
          >
            Overview
          </Link>
        </div>
      </div>
    </header>
  );
}
