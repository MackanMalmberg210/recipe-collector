"use client";

import type { AdminMetrics } from "../../lib/admin";

interface AdminStatsBentoProps {
  metrics: AdminMetrics;
  onNavigateToTab: (tab: "recipes" | "photos" | "users") => void;
}

export default function AdminStatsBento({
  metrics,
  onNavigateToTab,
}: AdminStatsBentoProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. RECIPES CARD */}
      <div
        onClick={() => onNavigateToTab("recipes")}
        className="group relative rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm hover:shadow-md transition hover:border-amber-500/40 dark:border-[#2e2722] dark:bg-[#1a1715] cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Total Recipes
          </p>
          <div className="text-amber-600 dark:text-amber-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">
            {metrics.totalRecipes}
          </span>
          <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">
            recipes in DB
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-stone-100 dark:border-[#26211d] text-[11px]">
          <span className="rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5">
            {metrics.publicRecipes} Public
          </span>
          <span className="rounded-md bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300 font-bold px-2 py-0.5">
            {metrics.privateRecipes} Private
          </span>
        </div>
      </div>

      {/* 2. COOK PHOTOS CARD */}
      <div
        onClick={() => onNavigateToTab("photos")}
        className="group relative rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm hover:shadow-md transition hover:border-amber-500/40 dark:border-[#2e2722] dark:bg-[#1a1715] cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Cook Photos
          </p>
          <div className="text-amber-600 dark:text-amber-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">
            {metrics.totalCookPhotos}
          </span>
          <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">
            creations logged
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-100 dark:border-[#26211d] text-[11px] text-stone-500 dark:text-stone-400 font-medium">
          <span>&quot;How It Turned Out&quot;</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">
            Moderate &rarr;
          </span>
        </div>
      </div>

      {/* 3. REGISTERED USERS CARD */}
      <div
        onClick={() => onNavigateToTab("users")}
        className="group relative rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm hover:shadow-md transition hover:border-amber-500/40 dark:border-[#2e2722] dark:bg-[#1a1715] cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Users &amp; Profiles
          </p>
          <div className="text-amber-600 dark:text-amber-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">
            {metrics.totalUsers}
          </span>
          <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">
            registered accounts
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-100 dark:border-[#26211d] text-[11px] text-stone-500 dark:text-stone-400 font-medium">
          <span>Access control &amp; tier</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">
            View users &rarr;
          </span>
        </div>
      </div>

      {/* 4. ENGAGEMENT / FAVORITES CARD */}
      <div className="relative rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm dark:border-[#2e2722] dark:bg-[#1a1715]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Saved Favorites
          </p>
          <div className="text-amber-600 dark:text-amber-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">
            {metrics.totalFavorites}
          </span>
          <span className="text-xs font-semibold text-stone-400 dark:text-stone-500">
            bookmarked recipes
          </span>
        </div>

        <div className="mt-4 flex items-center gap-1 pt-3 border-t border-stone-100 dark:border-[#26211d] text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <span>Active user engagement</span>
        </div>
      </div>
    </div>
  );
}
