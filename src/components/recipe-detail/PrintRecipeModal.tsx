"use client";

import { useEffect, useState, useMemo } from "react";
import type { AppRecipe } from "../../lib/types";

type PrintRecipeModalProps = {
  recipe: AppRecipe;
  isOpen: boolean;
  onClose: () => void;
};

export default function PrintRecipeModal({
  recipe,
  isOpen,
  onClose,
}: PrintRecipeModalProps) {
  const [includePhoto, setIncludePhoto] = useState(true);
  const [includeNutrition, setIncludeNutrition] = useState(true);
  const [textSize, setTextSize] = useState<"normal" | "large">("normal");
  const [userNotes, setUserNotes] = useState<string[]>([]);

  // Load any user notes from localStorage
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem(`recipeNotes:${recipe.id}`);
      if (stored) {
        setUserNotes(JSON.parse(stored) as string[]);
      }
    } catch {
      setUserNotes([]);
    }
  }, [recipe.id, isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const hasNutrition = Boolean(
    recipe.calories ||
      recipe.nutrition?.calories ||
      recipe.nutrition?.protein ||
      recipe.nutrition?.carbohydrates ||
      recipe.nutrition?.fat
  );

  const displayDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      id="printable-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static print:inset-auto print:block print:w-full print:h-auto"
    >
      {/* Click-outside Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 print:hidden cursor-pointer"
        aria-hidden="true"
      />

      <div
        id="printable-modal-dialog"
        className="relative flex flex-col w-full max-w-6xl h-[92vh] rounded-3xl bg-white dark:bg-[#1a1715] border border-stone-200 dark:border-[#2e2722] shadow-2xl overflow-hidden print:border-none print:shadow-none print:h-auto print:max-w-none print:rounded-none print:bg-white print:w-full z-10"
      >
        
        {/* MODAL TOOLBAR / HEADER (Screen only, completely hidden on print) */}
        <header className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-stone-200 bg-stone-50/80 dark:border-[#2e2722] dark:bg-[#141210] shrink-0">
          <div className="flex items-center gap-3">
            {/* Clean SVG printer icon with NO background box */}
            <svg className="h-6 w-6 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white leading-tight">
                Print Preview
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Preview how your recipe will look when printed.
              </p>
            </div>
          </div>

          {/* HARMONIZED TOOLBAR CONTROLS */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Secondary Controls: Photo Toggle */}
            <button
              type="button"
              onClick={() => setIncludePhoto(!includePhoto)}
              className={`h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                includePhoto
                  ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 border border-amber-600/60 shadow-xs"
                  : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-[#2e2722] dark:bg-[#24201c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823]"
              }`}
              title="Toggle photo to save printer ink"
            >
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <span>{includePhoto ? "Photo On" : "Photo Off"}</span>
            </button>

            {/* Secondary Controls: Nutrition Toggle */}
            {hasNutrition && (
              <button
                type="button"
                onClick={() => setIncludeNutrition(!includeNutrition)}
                className={`h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                  includeNutrition
                    ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 border border-amber-600/60 shadow-xs"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-[#2e2722] dark:bg-[#24201c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823]"
                }`}
              >
                <span>{includeNutrition ? "Nutrition On" : "Nutrition Off"}</span>
              </button>
            )}

            {/* Secondary Controls: Text Size Toggle */}
            <button
              type="button"
              onClick={() => setTextSize(textSize === "normal" ? "large" : "normal")}
              className={`h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                textSize === "large"
                  ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 border border-amber-600/60 shadow-xs"
                  : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-[#2e2722] dark:bg-[#24201c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823]"
              }`}
              title="Toggle larger text for kitchen readability"
            >
              <span className="font-mono text-[11px] font-black">Aa</span>
              <span>{textSize === "large" ? "Large Text" : "Standard Text"}</span>
            </button>

            {/* Subtle Divider between option toggles and primary print action */}
            <div className="hidden sm:block h-6 w-px bg-stone-300/70 dark:bg-stone-700/70 mx-1 shrink-0" />

            {/* Distinct Primary Action Button: Print Recipe */}
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-4.5 rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold border border-amber-600/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(245,158,11,0.25)] text-xs inline-flex items-center gap-2 cursor-pointer active:scale-95 shrink-0 sm:ml-1"
            >
              <svg className="h-4 w-4 text-stone-950 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Recipe</span>
            </button>

            {/* Close Button matching other modals */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:border-[#2e2722] dark:bg-[#24201c] dark:text-stone-400 dark:hover:bg-[#2d2823] dark:hover:text-[#fafaf9] transition cursor-pointer active:scale-95 shrink-0 sm:ml-1.5"
              title="Close preview"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* MODAL BODY: SCROLLABLE CANVAS SIMULATING A4 PAPER */}
        <div
          id="printable-modal-body"
          className="flex-1 overflow-y-auto bg-stone-200/70 p-4 sm:p-8 md:p-12 dark:bg-[#100e0c] flex justify-center items-start print:bg-white print:p-0 print:overflow-visible print:w-full print:h-auto"
        >
          
          {/* THE PRINTABLE SHEET (Pure white paper matching physical print) */}
          <article
            id="printable-recipe-sheet"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-stone-900 p-8 sm:p-12 shadow-2xl border border-stone-300/80 rounded-sm font-sans space-y-6 print:space-y-3.5 print:shadow-none print:border-none print:max-w-none print:min-h-0 print:w-full print:text-black"
          >
            {/* HEADER BRANDING */}
            <div className="flex items-center justify-between border-b-2 border-stone-900 pb-3 print:pb-1.5">
              <div>
                <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-600 block">
                  Recipe Collector • Kitchen Edition
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  Printed on {displayDate}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-stone-700">
                  recipecollector.app
                </span>
              </div>
            </div>

            {/* TITLE & ATTRIBUTION */}
            <div className="space-y-1.5 print:space-y-0.5">
              <h1 className="text-2xl sm:text-3xl print:text-xl font-black tracking-tight text-stone-950 leading-tight">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="text-xs sm:text-sm print:text-xs text-stone-600 leading-relaxed italic">
                  {recipe.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1 print:pt-0.5 text-[11px] text-stone-500 font-medium">
                {recipe.authorName && (
                  <span>Created by <strong>Chef {recipe.authorName}</strong></span>
                )}
                {recipe.sourceName && (
                  <span>Source: <strong>{recipe.sourceName}</strong></span>
                )}
                {recipe.category && (
                  <span className="uppercase tracking-wider font-bold text-stone-700">
                    • {recipe.category}
                  </span>
                )}
              </div>
            </div>

            {/* KEY METRICS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-y border-stone-200 py-3 print:py-1.5 text-center bg-stone-50/60 rounded-lg">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Cook Time
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900">
                  {recipe.cookTime ? `${recipe.cookTime} mins` : "—"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Servings
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900">
                  {recipe.servingsText || (recipe.servings ? `${recipe.servings} portions` : "—")}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Calories
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900">
                  {recipe.calories || recipe.nutrition?.calories ? `${recipe.calories || recipe.nutrition?.calories} kcal` : "—"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Difficulty
                </span>
                <span className="text-xs sm:text-sm font-black text-stone-900 capitalize">
                  Easy / Everyday
                </span>
              </div>
            </div>

            {/* COVER PHOTO (Optional) */}
            {includePhoto && recipe.image && (
              <div className="overflow-hidden rounded-xl border border-stone-200 h-44 sm:h-56 print:h-32 print:max-h-32 w-full break-inside-avoid">
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* MAIN RECIPE CONTENT: 2-COLUMN CULINARY LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-12 print-grid gap-6 pt-2 print:pt-1 print:gap-5">
              
              {/* LEFT COLUMN: INGREDIENTS CHECKLIST (5 cols) */}
              <div className="md:col-span-5 print-col-ingredients space-y-3 print:space-y-1.5 break-inside-avoid">
                <div className="flex items-center justify-between border-b border-stone-300 pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-950">
                    Ingredients ({recipe.ingredients.length})
                  </h3>
                  <span className="text-[10px] text-stone-400">Mise en place</span>
                </div>

                <ul className="space-y-2 print:space-y-1">
                  {recipe.ingredients.map((ing, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2.5 leading-snug ${
                        textSize === "large" ? "text-sm sm:text-base font-medium" : "text-xs sm:text-[13px]"
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-block rounded-xs border border-stone-400 shrink-0 ${
                          textSize === "large" ? "h-4 w-4" : "h-3.5 w-3.5"
                        }`}
                      />
                      <span className="text-stone-800">{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RIGHT COLUMN: INSTRUCTIONS (7 cols) */}
              <div className="md:col-span-7 print-col-instructions space-y-3 print:space-y-2">
                <div className="border-b border-stone-300 pb-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-950">
                    Instructions
                  </h3>
                </div>

                <ol className="space-y-3.5 print:space-y-2">
                  {(recipe.instructions || []).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 break-inside-avoid">
                      <span
                        className={`flex shrink-0 items-center justify-center rounded-full bg-stone-900 font-black text-white mt-0.5 ${
                          textSize === "large" ? "h-6 w-6 text-xs" : "h-5 w-5 text-[10px]"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <p
                        className={`leading-relaxed text-stone-800 flex-1 ${
                          textSize === "large" ? "text-sm sm:text-base font-medium" : "text-xs sm:text-[13px]"
                        }`}
                      >
                        {step.replace(/^\d+[\.\)]\s*/, "")}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* NUTRITION FACTS STRIP (Optional) */}
            {includeNutrition && hasNutrition && (
              <div className="border-t border-stone-200 pt-4 print:pt-2 break-inside-avoid">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2 print:mb-1">
                  Nutrition Facts (per serving)
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center bg-stone-50 border border-stone-200 rounded-lg p-2.5 print:p-1.5">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Calories</span>
                    <span className="text-xs font-black text-stone-900">
                      {recipe.calories || recipe.nutrition?.calories || "—"} kcal
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Protein</span>
                    <span className="text-xs font-black text-stone-900">
                      {recipe.nutrition?.protein || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Carbs</span>
                    <span className="text-xs font-black text-stone-900">
                      {recipe.nutrition?.carbohydrates || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-stone-400">Fat</span>
                    <span className="text-xs font-black text-stone-900">
                      {recipe.nutrition?.fat || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* CHEF NOTES / KITCHEN NOTES */}
            <div className="border-t border-stone-200 pt-4 print:pt-2 break-inside-avoid space-y-2 print:space-y-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Kitchen Notes
              </h4>
              {userNotes.length > 0 ? (
                <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 print:p-2 space-y-1 text-xs text-stone-700">
                  {userNotes.map((note, idx) => (
                    <p key={idx} className="flex items-start gap-1.5">
                      <span className="text-stone-400 font-bold">•</span>
                      <span>{note}</span>
                    </p>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-stone-300 rounded-lg p-4 print:p-2.5 space-y-2 print:space-y-1">
                  <div className="h-px bg-stone-200 w-full" />
                  <div className="h-px bg-stone-200 w-full" />
                  <span className="text-[10px] text-stone-400 italic block">
                    Space for handwritten cook notes, adjustments, and oven calibrations.
                  </span>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t border-stone-200 pt-4 print:pt-2 flex items-center justify-between text-[10px] text-stone-400">
              <span>Recipe Collector</span>
              <span>Enjoy your meal!</span>
            </div>

          </article>
        </div>
      </div>
    </div>
  );
}
