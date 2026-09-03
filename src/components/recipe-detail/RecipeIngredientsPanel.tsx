"use client";

import { useState, useEffect } from "react";
import { convertIngredient } from "../../lib/unitConverter";
import { findSubstitutionsForIngredient, type Substitution } from "../../lib/substitutions";
import { getStoredUserSettings, saveUserSettings, type MeasurementUnitSystem } from "../../lib/settings";
import type { IngredientGroup } from "../../lib/types";

function normalizeIngredient(value: string) {
  return value.trim().toLowerCase();
}

type RecipeIngredientsPanelProps = {
  ingredients: string[];
  ingredientGroups?: IngredientGroup[];
  baseServings: number;
  checkedIngredients: string[];
  checkedCount?: number;
  totalCount?: number;
  missingCount?: number;
  progressPercentage?: number;
  matchedSelectedIngredientsCount?: number;
  onToggleIngredient: (ingredient: string) => void;
  onAddMissingToGroceryList?: () => void;
  onUndoAddMissing?: () => void;
  isAddedToGrocery?: boolean;
  allMissingAlreadyInGrocery?: boolean;
};

// Fallback short badge when no unit/amount exists (e.g., "to taste", "pinch")
function getFallbackBadge(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("salt") || lower.includes("pepper")) return "to taste";
  if (lower.includes("oil") || lower.includes("butter")) return "as needed";
  if (lower.includes("garnish") || lower.includes("herbs")) return "fresh";
  return "item";
}

export default function RecipeIngredientsPanel({
  ingredients,
  ingredientGroups,
  baseServings,
  checkedIngredients,
  onToggleIngredient,
  onAddMissingToGroceryList,
  onUndoAddMissing,
  isAddedToGrocery = false,
  missingCount = 0,
  allMissingAlreadyInGrocery = false,
}: RecipeIngredientsPanelProps) {
  const [currentServings, setCurrentServings] = useState<number>(baseServings > 0 ? baseServings : 4);
  const [unitSystem, setUnitSystem] = useState<MeasurementUnitSystem>("metric");
  const [expandedSubstitutions, setExpandedSubstitutions] = useState<Record<string, boolean>>({});
  
  const scaleRatio = currentServings / (baseServings > 0 ? baseServings : 4);
  const hasGroups = Array.isArray(ingredientGroups) && ingredientGroups.length > 1;

  useEffect(() => {
    const settings = getStoredUserSettings();
    setUnitSystem(settings.unitSystem || "metric");

    const handleSettingsUpdate = () => {
      setUnitSystem(getStoredUserSettings().unitSystem || "metric");
    };

    window.addEventListener("storage", handleSettingsUpdate);
    window.addEventListener("user_settings_updated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("storage", handleSettingsUpdate);
      window.removeEventListener("user_settings_updated", handleSettingsUpdate);
    };
  }, []);

  const handleToggleUnitSystem = (system: MeasurementUnitSystem) => {
    setUnitSystem(system);
    const settings = getStoredUserSettings();
    saveUserSettings({ ...settings, unitSystem: system });
  };

  const handleDecrease = () => {
    setCurrentServings((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setCurrentServings((prev) => Math.min(24, prev + 1));
  };

  const handleSetScale = (factor: number) => {
    const target = Math.max(1, Math.round((baseServings > 0 ? baseServings : 4) * factor));
    setCurrentServings(target);
  };

  const toggleSubstitutionDrawer = (ingredientKey: string) => {
    setExpandedSubstitutions((prev) => ({
      ...prev,
      [ingredientKey]: !prev[ingredientKey],
    }));
  };

  const totalCount = ingredients.length;
  const checkedCount = ingredients.filter((ing) =>
    checkedIngredients.includes(normalizeIngredient(ing))
  ).length;
  const progressPercentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const matchedSelectedIngredientsCount = checkedCount;

  const renderIngredientItem = (ingredient: string) => {
    const normalizedIngredient = normalizeIngredient(ingredient);
    const isChecked = checkedIngredients.includes(normalizedIngredient);
    
    // Convert unit according to active system and scale
    const { amount, unit, name } = convertIngredient(ingredient, unitSystem, scaleRatio);
    const quantityDisplay = [amount, unit].filter(Boolean).join(" ");
    const fallbackBadge = !quantityDisplay ? getFallbackBadge(name || ingredient) : "";

    // Check if substitutions are available
    const substitutionData: Substitution | null = findSubstitutionsForIngredient(name || ingredient);
    const isExpanded = Boolean(expandedSubstitutions[normalizedIngredient]);

    return (
      <li
        key={normalizedIngredient}
        className={`rounded-2xl border transition overflow-hidden ${
          isChecked
            ? "border-emerald-500/25 bg-emerald-500/10 opacity-70"
            : "border-stone-200/90 bg-stone-50/60 hover:bg-stone-100 hover:border-amber-500/30 dark:border-[#2e2722] dark:bg-[#24201c] dark:hover:bg-[#2d2823] dark:hover:border-amber-400/30 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between gap-3 p-3 sm:px-4">
          <label className="flex min-w-0 items-center gap-3 flex-1 cursor-pointer select-none group/item">
            {/* SLEEK CUSTOM CHECKBOX */}
            <div
              className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                isChecked
                  ? "border-emerald-500 bg-emerald-500 text-stone-950 shadow-xs shadow-emerald-500/25"
                  : "border-stone-300 bg-white group-hover/item:border-amber-400 dark:border-[#3a322c] dark:bg-[#1a1715] dark:group-hover/item:border-amber-400/60"
              }`}
            >
              {isChecked && (
                <svg className="h-3 w-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggleIngredient(ingredient)}
              className="sr-only"
            />

            {/* COMPACT QUANTITY BADGE COLUMN (FIXED WIDTH FOR PERFECT TEXT ALIGNMENT) */}
            <div className="w-[70px] shrink-0 flex items-center justify-center">
              {quantityDisplay ? (
                <span
                  className={`w-full text-center rounded-xl py-1 px-1 text-xs font-bold font-mono tracking-tight transition truncate ${
                    isChecked
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 line-through"
                      : "bg-stone-100 text-stone-800 border border-stone-200 dark:bg-[#1f1b18] dark:text-amber-400 dark:border-[#3a322c] shadow-2xs"
                  }`}
                  title={quantityDisplay}
                >
                  {quantityDisplay}
                </span>
              ) : (
                <span
                  className={`w-full text-center rounded-xl py-1 px-1 text-[10px] font-semibold tracking-tight transition truncate ${
                    isChecked
                      ? "bg-emerald-500/10 text-emerald-600 line-through dark:text-emerald-300/60"
                      : "bg-stone-100 text-stone-500 border border-stone-200/70 dark:bg-[#1a1715] dark:text-[#a8a29e] dark:border-[#2e2722]"
                  }`}
                  title={fallbackBadge}
                >
                  {fallbackBadge}
                </span>
              )}
            </div>

            {/* INGREDIENT NAME */}
            <span
              className={`flex-1 text-xs sm:text-sm font-semibold leading-snug break-words ${
                isChecked
                  ? "text-emerald-800 dark:text-emerald-200 line-through"
                  : "text-stone-900 dark:text-[#fafaf9]"
              }`}
            >
              {name || ingredient}
            </span>
          </label>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* SMART SUBSTITUTION LAMP ICON BUTTON */}
            {substitutionData && !isChecked && (
              <button
                type="button"
                onClick={() => toggleSubstitutionDrawer(normalizedIngredient)}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-lg transition active:scale-95 cursor-pointer ${
                  isExpanded
                    ? "bg-amber-500 text-stone-950 shadow-xs"
                    : "border border-amber-500/30 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:bg-[#1f1b18] dark:text-amber-400 dark:border-amber-400/30 hover:scale-110"
                }`}
                title="Did You Know? View ingredient substitute tips"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>
            )}

            {!isChecked && (
              <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                Missing
              </span>
            )}
          </div>
        </div>

        {/* EXPANDABLE SUBSTITUTION ACCORDION */}
        {substitutionData && isExpanded && !isChecked && (
          <div className="border-t border-stone-200/90 bg-stone-50 p-3.5 sm:px-4 space-y-3 text-xs dark:border-[#2e2722] dark:bg-[#151311] animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Substitutes for {substitutionData.ingredientName}</span>
              </span>
              <button
                type="button"
                onClick={() => toggleSubstitutionDrawer(normalizedIngredient)}
                className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white font-semibold cursor-pointer text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2.5">
              {substitutionData.substitutes.map((sub, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200 bg-white p-3 sm:p-3.5 space-y-2 dark:border-[#2e2722] dark:bg-[#1f1b18] shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-bold text-sm text-stone-900 dark:text-[#fafaf9]">
                      {sub.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-stone-50 border border-amber-500/20 px-3 py-1.5 dark:bg-[#12100e] dark:border-amber-400/20">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 shrink-0">
                      Ratio:
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-900 dark:text-amber-200">
                      {sub.ratio}
                    </span>
                  </div>

                  {sub.notes && (
                    <p className="text-xs text-stone-600 dark:text-[#d6d3d1] leading-relaxed">
                      {sub.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <section className="rounded-4xl border border-stone-200/90 bg-white p-6 shadow-xl dark:border-[#2e2722] dark:border-t-amber-500/20 dark:bg-[#1a1715] dark:shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.03)]">
      {/* HEADER CONTROLS */}
      <div className="mb-5 space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-4 dark:border-[#2e2722]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 dark:text-amber-400">
              Ingredients
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* UNIT CONVERTER SWITCHER */}
            <div className="flex items-center rounded-xl border border-stone-200 bg-stone-100 p-0.5 dark:border-[#2e2722] dark:bg-[#141210]">
              <button
                type="button"
                onClick={() => handleToggleUnitSystem("metric")}
                className={`rounded-lg px-2.5 py-1 text-[11px] transition cursor-pointer ${
                  unitSystem === "metric"
                    ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 shadow-xs"
                    : "text-stone-600 hover:text-stone-900 dark:text-[#a8a29e] dark:hover:text-[#fafaf9] font-semibold"
                }`}
                title="Convert to Metric (g, ml, kg)"
              >
                Metric
              </button>
              <button
                type="button"
                onClick={() => handleToggleUnitSystem("imperial")}
                className={`rounded-lg px-2.5 py-1 text-[11px] transition cursor-pointer ${
                  unitSystem === "imperial"
                    ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 shadow-xs"
                    : "text-stone-600 hover:text-stone-900 dark:text-[#a8a29e] dark:hover:text-[#fafaf9] font-semibold"
                }`}
                title="Convert to Imperial (oz, lb, cups)"
              >
                <span className="hidden sm:inline">Imperial</span>
                <span className="sm:hidden">Imp.</span>
              </button>
            </div>

            <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-700 font-bold dark:border-[#2e2722] dark:bg-[#24201c] dark:text-[#d6d3d1]">
              {checkedCount}/{totalCount} ready
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-stone-950 dark:text-[#fafaf9]">What you need</h2>

          {/* PORTION SCALER BUTTONS */}
          <div className="flex items-center gap-1.5 rounded-2xl border border-stone-200 bg-stone-50 p-1 shadow-xs dark:border-[#2e2722] dark:bg-[#141210]">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={currentServings <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-stone-800 hover:bg-stone-100 disabled:opacity-30 transition cursor-pointer text-sm font-bold shadow-xs dark:bg-[#24201c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823] dark:hover:text-[#fafaf9]"
              title="Fewer servings"
            >
              −
            </button>

            <div className="flex items-center gap-1 px-1.5 min-w-16 justify-center text-xs font-black text-amber-700 dark:text-amber-400">
              <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{currentServings} serv</span>
            </div>

            <button
              type="button"
              onClick={handleIncrease}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-stone-800 hover:bg-stone-100 transition cursor-pointer text-sm font-bold shadow-xs dark:bg-[#24201c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823] dark:hover:text-[#fafaf9]"
              title="More servings"
            >
              +
            </button>
          </div>
        </div>

        {/* QUICK MULTIPLIER PILLS */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-[11px] font-bold text-stone-500 dark:text-[#a8a29e]">Scale:</span>
          {[0.5, 1, 2, 3].map((factor) => {
            const isActive = Math.round((baseServings > 0 ? baseServings : 4) * factor) === currentServings;
            return (
              <button
                key={factor}
                type="button"
                onClick={() => handleSetScale(factor)}
                className={`rounded-lg px-2.5 py-0.5 text-[11px] transition cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-b from-amber-500 to-amber-600 text-stone-950 font-bold border border-amber-600/60 shadow-xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-[#24201c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823] dark:hover:text-[#fafaf9] font-semibold"
                }`}
              >
                {factor}x
              </button>
            );
          })}

          {scaleRatio !== 1 && (
            <button
              type="button"
              onClick={() => handleSetScale(1)}
              className="ml-auto text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* READY PROGRESS BAR */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs text-stone-600 dark:text-[#a8a29e] font-semibold">
          <span>Ready progress</span>
          <span className="font-bold text-amber-700 dark:text-amber-400">{progressPercentage}%</span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-[#12100e]">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {matchedSelectedIngredientsCount > 0 && (
        <p className="mb-5 rounded-2xl border border-emerald-500/20 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
          ✓ You already have {matchedSelectedIngredientsCount} ingredient
          {matchedSelectedIngredientsCount === 1 ? "" : "s"} in your pantry.
        </p>
      )}

      {/* INGREDIENTS LIST OR SECTIONS */}
      {hasGroups ? (
        <div className="space-y-6">
          {ingredientGroups.map((group, gIdx) => (
            <div key={`group-${gIdx}`} className="space-y-2.5">
              {group.heading && (
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 pl-1">
                  {group.heading}
                </h3>
              )}
              <ul className="space-y-2">
                {group.ingredients.map(renderIngredientItem)}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">
          {ingredients.map(renderIngredientItem)}
        </ul>
      )}

      {/* GROCERY LIST BUTTON WITH SUCCESS & UNDO STATES */}
      {onAddMissingToGroceryList && (
        <div className="mt-6 border-t border-stone-200 dark:border-[#2e2722] pt-4">
          {isAddedToGrocery ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50 p-3.5 text-xs sm:text-sm text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200 animate-in fade-in">
              <span className="font-bold flex items-center gap-1.5">
                <span>✓</span>
                <span>Added to Grocery List!</span>
              </span>

              {onUndoAddMissing && (
                <button
                  type="button"
                  onClick={onUndoAddMissing}
                  className="shrink-0 rounded-xl bg-white border border-stone-300 px-3 py-1 text-xs font-bold text-stone-800 hover:bg-stone-50 dark:bg-[#24201c] dark:border-[#3a322c] dark:text-[#d6d3d1] dark:hover:bg-[#2d2823] transition cursor-pointer"
                >
                  Undo
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onAddMissingToGroceryList}
              disabled={missingCount === 0 || allMissingAlreadyInGrocery}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 shadow-xs ${
                allMissingAlreadyInGrocery
                  ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 opacity-90 cursor-default"
                  : missingCount === 0
                  ? "border border-stone-200 bg-stone-100 text-stone-400 opacity-60 cursor-not-allowed dark:border-[#2e2722] dark:bg-[#141210] dark:text-[#78716c]"
                  : "bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-600/60 shadow-md shadow-amber-500/20"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>
                {allMissingAlreadyInGrocery
                  ? "✓ All missing items are in Grocery List"
                  : missingCount > 0
                  ? `Add Missing to Grocery List (${missingCount})`
                  : "All ingredients checked ✓"}
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
