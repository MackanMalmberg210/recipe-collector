"use client";

import React from "react";
import type { MorningFilterId } from "./morningSnackFilter";

type FilterChip = {
  id: MorningFilterId;
  label: string;
};

const CHIPS: FilterChip[] = [
  { id: "all", label: "All" },
  { id: "recommended", label: "Recommended" },
  { id: "quick", label: "Quick" },
  { id: "under500", label: "<500 kcal" },
  { id: "my-recipes", label: "My recipes" },
  { id: "imported", label: "Imported" },
];

type FilterChipsProps = {
  activeFilter: MorningFilterId;
  onFilterChange: (id: MorningFilterId) => void;
};

export function FilterChips({ activeFilter, onFilterChange }: FilterChipsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter recipe results"
      className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 max-w-full"
    >
      {CHIPS.map((chip) => {
        const isActive = chip.id === activeFilter;
        return (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(chip.id)}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
              isActive
                ? "bg-[#F59E0B] text-stone-950 font-bold shadow-xs"
                : "border border-[#35312D] bg-[#1C1917] text-[#A8A29E] hover:bg-[#211E1B] hover:text-[#F5F5F4] hover:border-[#4A443E]"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
