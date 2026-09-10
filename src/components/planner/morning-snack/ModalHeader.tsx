"use client";

import React from "react";
import { type SnackSlot, getSnackSlotConfig } from "./morningSnackFilter";

interface ModalHeaderProps {
  slot?: SnackSlot;
  title?: string;
  subtitle?: string;
  hasSelectedRecipe?: boolean;
  onClearSlot?: () => void;
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  slot = "morning_snack",
  title,
  subtitle,
  hasSelectedRecipe = false,
  onClearSlot,
  onClose,
}) => {
  const config = getSnackSlotConfig(slot);
  const displayTitle = title ?? config.title;
  const displaySubtitle = subtitle ?? config.subtitle;

  return (
    <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#35312D]">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 mb-1.5">
          {slot === "evening_snack" ? (
            <svg
              className="w-3 h-3 text-[#F59E0B]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : slot === "afternoon_snack" ? (
            <svg
              className="w-3 h-3 text-[#F59E0B]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ) : (
            <svg
              className="w-3 h-3 text-[#F59E0B]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="4" />
              <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          )}
          {config.badge}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
          {displayTitle}
        </h2>
        <p className="text-xs sm:text-sm text-[#A8A29E] mt-0.5">
          {displaySubtitle}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {hasSelectedRecipe && onClearSlot && (
          <button
            type="button"
            onClick={onClearSlot}
            className="px-3 py-1.5 text-xs font-medium text-[#F87171] hover:text-[#EF4444] bg-[#F87171]/10 hover:bg-[#F87171]/20 border border-[#F87171]/20 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F87171]"
          >
            Clear Slot
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#1C1917] hover:bg-[#211E1B] text-[#A8A29E] hover:text-[#F5F5F4] border border-[#35312D] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
