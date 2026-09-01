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

            <div className="flex items-center gap-2.5">
              <span className="text-2xl">
                {isPlateMode ? "🍽️" : "📖"}
              </span>
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
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-transparent p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  🍽️ Plate Analyzer
                </span>
                <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Capture your plated dish. The scanner estimates calories, protein &amp; reconstructs the complete recipe.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300 bg-white/70 dark:bg-black/40 border border-stone-200/90 dark:border-white/10 rounded-2xl px-3.5 py-2">
                <span>🎯 Top-down photo recommended</span>
              </div>
            </div>
          </div>
        ) : (
          /* COOKBOOK OCR PAGE VIEWFINDER ACCENT */
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  📖 Page Scanner
                </span>
                <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Lay your cookbook flat under bright light. Ingredients and steps will be extracted into your library.
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300 bg-white/70 dark:bg-black/40 border border-stone-200/90 dark:border-white/10 rounded-2xl px-3.5 py-2">
                <span>💡 Flat page &amp; good lighting</span>
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
