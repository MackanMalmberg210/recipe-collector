"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AdminRecipe } from "../../lib/admin";

interface AdminRecipeTableProps {
  recipes: AdminRecipe[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  search: string;
  onSearchChange: (newSearch: string) => void;
  filter: "all" | "public" | "private";
  onFilterChange: (newFilter: "all" | "public" | "private") => void;
  onTogglePublic: (recipeId: number, currentStatus: boolean) => Promise<void>;
  onDeleteRecipe: (recipeId: number) => Promise<void>;
  isActionLoading: boolean;
}

export default function AdminRecipeTable({
  recipes,
  totalCount,
  page,
  pageSize,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  onTogglePublic,
  onDeleteRecipe,
  isActionLoading,
}: AdminRecipeTableProps) {
  const [recipeToDelete, setRecipeToDelete] = useState<AdminRecipe | null>(null);

  const confirmDelete = async () => {
    if (!recipeToDelete) return;
    await onDeleteRecipe(recipeToDelete.id);
    setRecipeToDelete(null);
  };

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* Header controls: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value);
              onPageChange(1);
            }}
            placeholder="Search recipes by title..."
            className="w-full rounded-2xl border border-stone-200 bg-white py-2 pl-9 pr-8 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none dark:border-[#2e2722] dark:bg-[#161311] dark:text-[#fafaf9] dark:placeholder-stone-500 transition shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                onPageChange(1);
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 rounded-2xl border border-stone-200/80 bg-stone-100 p-1 dark:border-[#2e2722] dark:bg-[#141210] self-start sm:self-auto">
          {(["all", "public", "private"] as const).map((tabKey) => {
            const labels: Record<string, string> = {
              all: "All",
              public: "Public",
              private: "Private",
            };
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => {
                  onFilterChange(tabKey);
                  onPageChange(1);
                }}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  filter === tabKey
                    ? "bg-white text-stone-900 shadow-xs dark:bg-[#221e1a] dark:text-white"
                    : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white"
                }`}
              >
                {labels[tabKey]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-sm dark:border-[#2e2722] dark:bg-[#1a1715]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600 dark:text-stone-400">
            <thead className="border-b border-stone-200 bg-stone-50/75 text-[11px] font-black uppercase tracking-wider text-stone-500 dark:border-[#2e2722] dark:bg-[#141210] dark:text-stone-400">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 sm:pl-6">
                  Recipe
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Category
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Author / Origin
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5">
                  Created
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-[#25201c]">
              {recipes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <p className="text-sm font-semibold">No recipes found matching your query</p>
                    <p className="text-xs mt-1">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                recipes.map((recipe) => (
                  <tr
                    key={recipe.id}
                    className="hover:bg-stone-50/50 dark:hover:bg-[#1f1b18] transition-colors"
                  >
                    {/* Title & thumbnail */}
                    <td className="py-3 pl-4 pr-3 sm:pl-6">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-stone-200 dark:border-white/10 bg-stone-100 dark:bg-stone-900">
                          {recipe.image ? (
                            <Image
                              src={recipe.image}
                              alt={recipe.title}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-400">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/recipes/${recipe.id}`}
                            target="_blank"
                            className="font-bold text-stone-900 hover:text-amber-600 dark:text-[#fafaf9] dark:hover:text-amber-400 line-clamp-1 transition"
                            title="Open recipe in new tab"
                          >
                            {recipe.title}
                          </Link>
                          <p className="text-[11px] text-stone-400 dark:text-stone-500">
                            #{recipe.id} {recipe.cook_time ? `• ${recipe.cook_time} mins` : ""} {recipe.calories ? `• ${recipe.calories} kcal` : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3">
                      <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700 capitalize dark:bg-[#25201c] dark:text-stone-300">
                        {recipe.category || "General"}
                      </span>
                    </td>

                    {/* Author */}
                    <td className="px-3 py-3">
                      <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                        {recipe.author_name || (recipe.user_id ? "User Recipe" : "Editorial / Built-in")}
                      </span>
                    </td>

                    {/* Status toggle pill */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onTogglePublic(recipe.id, recipe.is_public)}
                          disabled={isActionLoading}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                            recipe.is_public
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-stone-100 border-stone-200 text-stone-500 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400 hover:bg-stone-200"
                          }`}
                          title="Click to toggle public/private status"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              recipe.is_public ? "bg-emerald-500" : "bg-stone-400"
                            }`}
                          />
                          <span>{recipe.is_public ? "Public" : "Private"}</span>
                        </button>

                        {recipe.is_quarantined && (
                          <span
                            className="rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                            title="This recipe has been automatically quarantined due to community reports"
                          >
                            Quarantined
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3 text-[11px] text-stone-400">
                      {new Date(recipe.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 pl-3 pr-4 sm:pr-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/recipes/${recipe.id}`}
                          target="_blank"
                          className="rounded-lg p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-white dark:hover:bg-[#25201c] transition"
                          title="Preview Recipe"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </Link>

                        <button
                          type="button"
                          onClick={() => setRecipeToDelete(recipe)}
                          disabled={isActionLoading}
                          className="rounded-lg p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:text-stone-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Delete Recipe"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-stone-200 dark:border-[#2e2722] bg-stone-50/50 dark:bg-[#151210] text-xs">
            <p className="text-stone-500 dark:text-[#a8a29e]">
              Showing <span className="font-bold text-stone-900 dark:text-white">{startItem}</span>–
              <span className="font-bold text-stone-900 dark:text-white">{endItem}</span> of{" "}
              <span className="font-bold text-stone-900 dark:text-white">{totalCount}</span> recipes
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isActionLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 dark:border-[#2e2722] bg-white dark:bg-[#1a1715] px-3 py-1.5 font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#221e1a] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
                <span>Previous</span>
              </button>

              <span className="px-2 font-semibold text-stone-600 dark:text-stone-400">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages || isActionLoading}
                className="inline-flex items-center gap-1 rounded-xl border border-stone-200 dark:border-[#2e2722] bg-white dark:bg-[#1a1715] px-3 py-1.5 font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#221e1a] disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
              >
                <span>Next</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete */}
      {recipeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 dark:border-[#2e2722] dark:bg-[#1a1715] space-y-4">
            <div className="flex items-center gap-3">
              <svg className="h-6 w-6 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Delete Recipe?
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="font-bold text-stone-900 dark:text-white">&quot;{recipeToDelete.title}&quot;</strong> (#{recipeToDelete.id}) from the database?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRecipeToDelete(null)}
                className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 dark:border-[#2e2722] dark:text-[#a8a29e] dark:hover:bg-[#25211d] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 text-xs transition cursor-pointer shadow-xs active:scale-95"
              >
                Yes, Delete Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
