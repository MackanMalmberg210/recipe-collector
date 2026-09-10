"use client";

import React from "react";
import { PlateIcon } from "../PlannerIcons";

type EmptyStateProps = {
  onResetSearch: () => void;
  onBrowseAllCookbook?: () => void;
  isSearching: boolean;
  customQuery?: string;
  onPlanCustom?: () => void;
};

export function EmptyState({
  onResetSearch,
  onBrowseAllCookbook,
  isSearching,
  customQuery,
  onPlanCustom,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-[#35312D] bg-[#1C1917]/40">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1C1917] border border-[#35312D] text-[#78716C] mb-4">
        <PlateIcon className="h-7 w-7 text-[#78716C]" />
      </div>

      <h3 className="text-base font-semibold text-[#F5F5F4] tracking-tight mb-1">
        No recipes found
      </h3>
      <p className="text-sm text-[#A8A29E] max-w-sm mb-5 leading-relaxed">
        {isSearching
          ? "We couldn't find anything matching your search in the cookbook."
          : "No snack-friendly recipes match the active filter criteria."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {onPlanCustom && customQuery && (
          <button
            type="button"
            onClick={onPlanCustom}
            className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 px-4 py-2 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
          >
            + Plan &ldquo;{customQuery}&rdquo; as quick snack
          </button>
        )}

        {isSearching && (
          <button
            type="button"
            onClick={onResetSearch}
            className="rounded-xl border border-[#35312D] bg-[#1C1917] hover:bg-[#211E1B] text-[#F5F5F4] px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            Clear search
          </button>
        )}

        {onBrowseAllCookbook && (
          <button
            type="button"
            onClick={onBrowseAllCookbook}
            className="rounded-xl border border-[#35312D] hover:border-white/20 bg-[#1C1917] hover:bg-[#211E1B] text-[#A8A29E] hover:text-[#F5F5F4] px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            Browse all recipes
          </button>
        )}
      </div>
    </div>
  );
}
