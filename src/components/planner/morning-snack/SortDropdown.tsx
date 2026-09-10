"use client";

import React, { useState, useRef, useEffect } from "react";
import type { MorningSortId } from "./morningSnackFilter";

type SortOption = {
  id: MorningSortId;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { id: "recommended", label: "Recommended" },
  { id: "recent", label: "Recently added" },
  { id: "quickest", label: "Quickest" },
  { id: "lowest-calories", label: "Lowest calories" },
  { id: "highest-protein", label: "Highest protein" },
];

type SortDropdownProps = {
  activeSort: MorningSortId;
  onSortChange: (sortId: MorningSortId) => void;
};

export function SortDropdown({ activeSort, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLabel =
    SORT_OPTIONS.find((opt) => opt.id === activeSort)?.label ?? "Recommended";

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Sort recipes, current: ${currentLabel}`}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[#35312D] bg-[#1C1917] hover:bg-[#211E1B] text-[#F5F5F4] px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
      >
        <span className="text-[#A8A29E] font-normal">Sort:</span>
        <span className="font-semibold text-[#F5F5F4]">{currentLabel}</span>
        <svg
          className={`h-3.5 w-3.5 text-[#A8A29E] transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Sort options"
          className="absolute right-0 z-30 mt-1.5 w-44 origin-top-right rounded-xl border border-[#35312D] bg-[#1C1917] p-1 shadow-xl shadow-black/50 focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.id === activeSort;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSortChange(option.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#F59E0B]/15 text-[#F59E0B] font-bold"
                    : "text-[#A8A29E] hover:bg-[#211E1B] hover:text-[#F5F5F4]"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <span className="text-[#F59E0B] font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
