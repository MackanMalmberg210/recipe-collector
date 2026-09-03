"use client";

import { useState, useEffect } from "react";
import type { AppRecipe } from "../../lib/types";
import { convertIngredient } from "../../lib/unitConverter";
import { getStoredUserSettings, type MeasurementUnitSystem } from "../../lib/settings";
import { getRecipeRating, saveRecipeRating, type RecipeRating } from "../../lib/ratings";
import { capitalize } from "../../lib/format";
import { sanitizeCulinaryText } from "../../lib/culinaryTextSanitizer";

type CookModeModalProps = {
  recipe: AppRecipe;
  isOpen: boolean;
  onClose: () => void;
};

const RECIPE_NOTES_KEY = "recipe_collector_notes";

export default function CookModeModal({
  recipe,
  isOpen,
  onClose,
}: CookModeModalProps) {
  const steps = recipe.instructions || [];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [unitSystem, setUnitSystem] = useState<MeasurementUnitSystem>("metric");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Completion Rating Modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [cookingNote, setCookingNote] = useState("");

  useEffect(() => {
    setUnitSystem(getStoredUserSettings().unitSystem || "metric");
    const existingRating = getRecipeRating(recipe.id);
    if (existingRating) {
      setSelectedRating(existingRating);
    }
  }, [isOpen, recipe.id]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Reset step & states on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsTimerRunning(false);
      setTimerSeconds(null);
      setShowRatingModal(false);
      setCheckedIngredients(new Set());
    }
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!isOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Detect time in current step text (e.g. "3-5 minutes", "20 mins", "1 hour")
  const detectTimeInStep = (text: string): number | null => {
    const minMatch = text.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:minutes|minute|mins|min)\b/i);
    if (minMatch) {
      const minVal = Number(minMatch[2] || minMatch[1]);
      return minVal * 60;
    }
    const hourMatch = text.match(/(\d+)\s*(?:hours|hour|hrs|hr)\b/i);
    if (hourMatch) {
      return Number(hourMatch[1]) * 3600;
    }
    return null;
  };

  const detectedSeconds = detectTimeInStep(currentStep);

  const startTimerWithSeconds = (secs: number) => {
    setTimerSeconds(secs);
    setIsTimerRunning(true);
  };

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const toggleIngredientCheck = (idx: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleFinishCooking = () => {
    setShowRatingModal(true);
  };

  const handleSaveRatingAndClose = () => {
    if (selectedRating > 0) {
      saveRecipeRating(recipe.id, selectedRating as RecipeRating);
      window.dispatchEvent(
        new CustomEvent("recipe_rating_updated", {
          detail: { recipeId: recipe.id, rating: selectedRating },
        }),
      );
    }

    if (cookingNote.trim()) {
      try {
        const storedNotes = localStorage.getItem(RECIPE_NOTES_KEY);
        const parsed = storedNotes ? (JSON.parse(storedNotes) as Record<string, string>) : {};
        parsed[recipe.id] = cookingNote.trim();
        localStorage.setItem(RECIPE_NOTES_KEY, JSON.stringify(parsed));
      } catch {
        // Ignore
      }
    }

    setShowRatingModal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#120e0c] text-stone-100 animate-in fade-in duration-200">
      {/* TOP KITCHEN HEADER */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-6 sm:px-10 bg-[#17120f]">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#fff8ef] line-clamp-1">
              Cook Mode: {recipe.title}
            </h2>
            <p className="text-xs text-amber-200/60 font-medium">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowIngredients(!showIngredients)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              showIngredients
                ? "border-amber-400/50 bg-amber-400 text-stone-950 shadow-sm shadow-amber-400/20"
                : "border-white/10 bg-white/5 text-stone-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Ingredients ({recipe.ingredients.length})</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-stone-400 hover:bg-white/15 hover:text-white transition cursor-pointer"
            title="Exit Cook Mode"
          >
            ✕
          </button>
        </div>
      </header>

      {/* PROGRESS TRACKER */}
      <div className="h-1.5 w-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
          style={{
            width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
          }}
        />
      </div>

      {/* MAIN BODY */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* STEP CONTENT AREA */}
        <main className="flex flex-1 flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-4xl mx-auto overflow-y-auto">
          <div className="space-y-6 my-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-amber-300">
              Step {currentStepIndex + 1} of {steps.length}
            </div>

            <h3 className="text-2xl sm:text-4xl md:text-5xl font-black leading-snug tracking-tight text-[#fff8ef]">
              {currentStep}
            </h3>

            {/* IN-STEP TIMER HELPER */}
            {detectedSeconds && (
              <div className="mt-8 flex flex-wrap items-center gap-4 rounded-3xl border border-amber-400/20 bg-amber-400/5 p-4 sm:p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-48">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Step Timer Detected
                  </p>
                  <p className="text-xl font-mono font-bold text-white">
                    {timerSeconds !== null
                      ? formatTimer(timerSeconds)
                      : formatTimer(detectedSeconds)}
                  </p>
                </div>

                <div className="flex gap-2">
                  {timerSeconds === null ? (
                    <button
                      type="button"
                      onClick={() => startTimerWithSeconds(detectedSeconds)}
                      className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-xs px-4 py-2 text-xs sm:text-sm transition cursor-pointer"
                    >
                      Start Timer
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
                          isTimerRunning
                            ? "bg-amber-400/20 text-amber-200 border border-amber-400/30"
                            : "bg-emerald-400 text-stone-950 font-bold hover:bg-emerald-300"
                        }`}
                      >
                        {isTimerRunning ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTimerRunning(false);
                          setTimerSeconds(null);
                        }}
                        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-stone-300 hover:bg-white/15 cursor-pointer"
                      >
                        Reset
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM STEP CONTROLS */}
          <footer className="mt-12 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
            <button
              type="button"
              disabled={isFirstStep}
              onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
              className={`rounded-2xl border px-6 py-3.5 text-sm font-bold transition cursor-pointer ${
                isFirstStep
                  ? "border-white/5 text-stone-600 cursor-not-allowed"
                  : "border-white/10 bg-white/5 text-stone-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              ← Previous Step
            </button>

            <button
              type="button"
              onClick={() => {
                if (isLastStep) {
                  handleFinishCooking();
                } else {
                  setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                }
              }}
              className={`rounded-2xl px-8 py-3.5 text-sm font-bold shadow-xl transition cursor-pointer active:scale-95 ${
                isLastStep
                  ? "bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-emerald-400/20 font-black"
                  : "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)]"
              }`}
            >
              {isLastStep ? "Finish Cooking ✓" : "Next Step →"}
            </button>
          </footer>
        </main>

        {/* ELEVATED INGREDIENTS SIDE DRAWER */}
        {showIngredients && (
          <aside className="w-80 sm:w-96 border-l border-white/10 bg-[#17120f] flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 z-10 shadow-2xl">
            {/* DRAWER HEADER */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-[#fff8ef]">
                  Ingredients Checklist
                </h4>
                <p className="text-xs text-stone-400 mt-0.5 font-medium">
                  {checkedIngredients.size} of {recipe.ingredients.length} ready
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowIngredients(false)}
                className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Close drawer"
              >
                ✕
              </button>
            </div>

            {/* INGREDIENT LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {recipe.ingredients.map((ing, i) => {
                const isChecked = checkedIngredients.has(i);
                const { amount, unit, name } = convertIngredient(ing, unitSystem);
                const quantity = [amount, unit].filter(Boolean).join(" ");
                const cleanName = capitalize(sanitizeCulinaryText(name || ing));

                return (
                  <div
                    key={i}
                    onClick={() => toggleIngredientCheck(i)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-xs transition cursor-pointer select-none ${
                      isChecked
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200/70"
                        : "border-white/8 bg-[#211915]/80 hover:bg-[#281e18] hover:border-amber-400/30 text-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* CUSTOM CHECKBOX */}
                      <div
                        className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          isChecked
                            ? "border-emerald-500 bg-emerald-500 text-stone-950 shadow-xs shadow-emerald-500/25"
                            : "border-white/20 bg-white/5"
                        }`}
                      >
                        {isChecked && (
                          <svg className="h-3 w-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* INGREDIENT NAME */}
                      <span className={`truncate flex-1 font-semibold text-sm ${isChecked ? "line-through text-emerald-300/60" : "text-stone-100"}`}>
                        {cleanName}
                      </span>
                    </div>

                    {/* QUANTITY BADGE */}
                    {quantity && (
                      <span className={`shrink-0 rounded-lg py-0.5 px-2 text-xs font-mono font-bold transition ${
                        isChecked
                          ? "bg-emerald-500/15 text-emerald-300 line-through"
                          : "bg-white/8 text-amber-300 border border-white/10"
                      }`}>
                        {quantity}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DRAWER FOOTER */}
            {checkedIngredients.size > 0 && (
              <div className="p-3 border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={() => setCheckedIngredients(new Set())}
                  className="text-xs text-stone-400 hover:text-white font-medium hover:underline cursor-pointer"
                >
                  Reset checklist
                </button>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* COMPLETION RATING POP-UP MODAL */}
      {showRatingModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-white/12 bg-[#17120f] text-white p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-center">
            
            <div className="space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/30">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-[#fff8ef] pt-2">
                Dish Completed! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-stone-400">
                How did &ldquo;{recipe.title}&rdquo; turn out?
              </p>
            </div>

            {/* INTERACTIVE 5-STAR RATING */}
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoverRating || selectedRating);
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setSelectedRating(star)}
                    className="p-1 transition-transform hover:scale-130 active:scale-90 cursor-pointer"
                    title={`Rate ${star} of 5 stars`}
                  >
                    <svg
                      className={`h-8 w-8 transition-colors ${
                        isFilled
                          ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                          : "text-stone-700 fill-transparent hover:text-amber-400/50"
                      }`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* OPTIONAL CHEF NOTE */}
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Add a quick cooking note (optional)
              </label>
              <textarea
                rows={2}
                value={cookingNote}
                onChange={(e) => setCookingNote(e.target.value)}
                placeholder="e.g. Perfect seasoning, baked 2 mins less..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none transition resize-none"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRatingModal(false);
                  onClose();
                }}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-stone-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                Skip
              </button>

              <button
                type="button"
                onClick={handleSaveRatingAndClose}
                className="flex-1 rounded-2xl bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold border border-amber-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_6px_rgba(0,0,0,0.2)] py-3 text-xs transition active:scale-95 cursor-pointer"
              >
                Save &amp; Finish
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
