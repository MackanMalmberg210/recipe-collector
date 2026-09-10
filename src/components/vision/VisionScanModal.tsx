"use client";

import { useEffect } from "react";
import ChefVisionStudio from "./ChefVisionStudio";
import type { AppRecipe } from "../../lib/types";

type VisionScanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  defaultMode?: "recipe" | "grocery" | "meal_analyzer";
  onRecipeExtracted?: (recipe: AppRecipe) => void;
};

export default function VisionScanModal({
  isOpen,
  onClose,
  onBack,
  defaultMode = "recipe",
  onRecipeExtracted,
}: VisionScanModalProps) {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPlateMode = defaultMode === "meal_analyzer";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Solid High-Speed Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/85 transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Container (Spacious studio canvas) */}
      <div
        style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
        className="relative w-full max-w-4xl overflow-hidden rounded-4xl border border-stone-200/90 bg-white text-stone-900 shadow-2xl dark:border-white/10 dark:bg-[#151210] dark:text-stone-100 animate-in zoom-in-95 fade-in duration-200 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6"
      >
        
        {/* Header with Breadcrumb Back and Close buttons */}
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/8 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Go Back"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 hover:text-stone-950 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
                title="Back"
              >
                ←
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="text-amber-500">
                {isPlateMode ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4.5" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-stone-950 dark:text-stone-50">
                  {isPlateMode
                    ? "Snap My Plate"
                    : "Scan Cookbook or Recipe Card"}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {isPlateMode
                    ? "Macro calculation & reverse home-cook recipe"
                    : "Extract text, amounts & cooking steps from photos"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* DISTINCT CREATIVE HERO BANNER */}
        {isPlateMode ? (
          /* SNAP MY PLATE RETICLE ACCENT */
          <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-50/80 dark:border-white/10 dark:bg-white/[0.03] p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  <span>Plate Analyzer</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Capture your plated dish. The scanner estimates calories, protein &amp; reconstructs the complete recipe.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 rounded-xl px-3 py-1.5 shadow-xs">
                <svg className="h-3.5 w-3.5 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Top-down photo recommended</span>
              </div>
            </div>
          </div>
        ) : (
          /* COOKBOOK OCR PAGE VIEWFINDER ACCENT */
          <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-50/80 dark:border-white/10 dark:bg-white/[0.03] p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Page Scanner</span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Lay your cookbook flat under bright light. Ingredients and steps will be extracted into your library.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 rounded-xl px-3 py-1.5 shadow-xs">
                <svg className="h-3.5 w-3.5 text-stone-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Flat page &amp; good lighting recommended</span>
              </div>
            </div>
          </div>
        )}

        {/* Embedded Vision Studio (Locked into single purpose) */}
        <ChefVisionStudio
          initialMode={defaultMode}
          lockMode={true}
          onRecipeExtracted={(recipe) => {
            if (onRecipeExtracted) {
              onRecipeExtracted(recipe);
            }
          }}
        />

      </div>
    </div>
  );
}
